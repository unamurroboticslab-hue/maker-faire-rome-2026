"""
server.py — e-puck Block Coder: Robot-Side Server
===================================================
Pure Python 3.5 standard library — zero pip dependencies.

Runs on the Raspberry Pi Zero (Pi-Puck extension).
Place in the same folder as controller.py.

Endpoints:
  GET  /ping     → health check
  POST /run      → receive & execute Python code  {"code": "..."}
  POST /stop     → kill running script
  GET  /sensors  → one-shot sensor snapshot (JSON)
  GET  /status   → server state (idle/running/error)
  GET  /logs     → last 100 log lines
  WS   /ws       → WebSocket: streams sensors + logs at ~10 Hz

Usage:
  python3 server.py [--port 5000] [--host 0.0.0.0]
"""

import argparse
import base64
import hashlib
import json
import logging
import os
import struct
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("epuck-server")

# ── Server state ─────────────────────────────────────────────────────────────
state_lock = threading.Lock()
server_state = {
    "status":      "idle",   # idle | running | error
    "script_name": None,
    "pid":         None,
    "last_error":  None,
    "log_lines":   [],
    "sensors": {
        "ps":          [0] * 8,
        "left_speed":  0.0,
        "right_speed": 0.0,
        "ground":      [0, 0, 0],
        "tof_mm":      -1,
        "timestamp":   0.0,
    },
    "randb": {
        "mode":        None,
        "data":        0,
        "bearing_deg": 0.0,
        "range_mm":    0,
        "sensor":      0,
    },
}


# WebSocket clients: list of raw sockets
_ws_clients = []
_ws_lock = threading.Lock()


# ─────────────────────────────────────────────────────────────────────────────
# Minimal WebSocket helpers (RFC 6455) — no external library needed
# ─────────────────────────────────────────────────────────────────────────────

WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

def _ws_handshake(conn, key):
    """Complete the WebSocket upgrade handshake."""
    combined = key.strip() + WS_MAGIC
    accept = base64.b64encode(
        hashlib.sha1(combined.encode()).digest()
    ).decode()
    response = (
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Accept: {}\r\n\r\n"
    ).format(accept)
    conn.sendall(response.encode())


def _ws_send_text(conn, text):
    """Send a UTF-8 text frame to a WebSocket client."""
    payload = text.encode("utf-8")
    length = len(payload)
    if length <= 125:
        header = struct.pack("BB", 0x81, length)
    elif length <= 65535:
        header = struct.pack("!BBH", 0x81, 126, length)
    else:
        header = struct.pack("!BBQ", 0x81, 127, length)
    try:
        conn.sendall(header + payload)
        return True
    except Exception:
        return False


def _ws_recv_frame(conn):
    """
    Read one WebSocket frame from the client.
    Returns the decoded text, or None on error/close.
    Uses a short timeout so the caller can do other work (e.g. send pings).
    """
    try:
        conn.settimeout(5)   # 5 s poll interval — allows ping sending
        header = _recv_exact(conn, 2)
        if header is None:
            return ""        # timeout, not a real disconnect — return empty string
        opcode = header[0] & 0x0F
        if opcode == 0x8:    # close frame
            return None
        if opcode == 0xA:    # pong frame — ignore, connection is alive
            return ""
        masked = (header[1] & 0x80) != 0
        length = header[1] & 0x7F
        if length == 126:
            ext = _recv_exact(conn, 2)
            if ext is None:
                return None
            length = struct.unpack("!H", ext)[0]
        elif length == 127:
            ext = _recv_exact(conn, 8)
            if ext is None:
                return None
            length = struct.unpack("!Q", ext)[0]
        mask_key = _recv_exact(conn, 4) if masked else b'\x00\x00\x00\x00'
        if mask_key is None:
            return None
        data = _recv_exact(conn, length)
        if data is None:
            return None
        if masked:
            data = bytes(b ^ mask_key[i % 4] for i, b in enumerate(data))
        return data.decode("utf-8", errors="replace")
    except socket.timeout:
        return ""            # timeout — not a disconnect
    except Exception:
        return None          # real error — disconnect


def _recv_exact(conn, n):
    """Read exactly n bytes from a socket."""
    buf = b""
    while len(buf) < n:
        try:
            chunk = conn.recv(n - len(buf))
            if not chunk:
                return None
            buf += chunk
        except Exception:
            return None
    return buf


# ─────────────────────────────────────────────────────────────────────────────
# Broadcast helpers
# ─────────────────────────────────────────────────────────────────────────────

def _broadcast(payload):
    """Send JSON to all connected WebSocket clients, drop dead ones."""
    msg = json.dumps(payload)
    dead = []
    with _ws_lock:
        clients = list(_ws_clients)
    for conn in clients:
        if not _ws_send_text(conn, msg):
            dead.append(conn)
    if dead:
        with _ws_lock:
            for c in dead:
                try:
                    _ws_clients.remove(c)
                except ValueError:
                    pass


def _append_log(line):
    with state_lock:
        server_state["log_lines"].append(line)
        if len(server_state["log_lines"]) > 100:
            server_state["log_lines"].pop(0)
    _broadcast({"type": "log", "data": line})


def _set_status(status, error=None):
    with state_lock:
        server_state["status"] = status
        server_state["last_error"] = error
    _broadcast({"type": "status", "data": status, "error": error})


# ── Global HAL reference (set by sensor thread once connected) ────────────────
_hal = None
_hal_lock = threading.Lock()

# Audio playback state
_audio_proc    = None   # running subprocess (mpg123/aplay/ffplay)
_audio_current = None   # filename currently playing

# ── Script execution control ──────────────────────────────────────────────────
# When a user script is running we pause the sensor polling loop so both
# don't call hal.step() at the same time on the same I2C bus.
_script_running_event = threading.Event()   # SET   = sensor loop may run
                                             # CLEAR = sensor loop must wait
_script_running_event.set()   # start in "sensor loop may run" state
_script_stop_event  = threading.Event()     # SET   = stop requested
_script_thread      = None
_script_thread_lock = threading.Lock()

# ── Camera globals ────────────────────────────────────────────────────────────
# Uses OpenCV in a background thread — continuous capture at 15fps.
# Browser connects to /camera/stream (multipart MJPEG) for smooth live video.
_camera_lock         = threading.Lock()
_camera_device_index = 1       # default: video1 (e-puck front camera)
_camera_frame        = None    # latest JPEG bytes
_camera_running      = False   # capture thread active


def _camera_capture_thread(device):
    global _camera_frame, _camera_running
    dev_path = "/dev/video{}".format(device)

    # Try OpenCV first (smooth MJPEG stream), fall back to fswebcam (snapshot polling)
    try:
        import cv2 as _cv2
        cap = _cv2.VideoCapture(dev_path, _cv2.CAP_V4L2)
        cap.set(_cv2.CAP_PROP_FRAME_WIDTH,  320)
        cap.set(_cv2.CAP_PROP_FRAME_HEIGHT, 240)
        cap.set(_cv2.CAP_PROP_FPS, 15)
        # Request MJPEG format to avoid raw YUYV green/pink tint issue
        cap.set(_cv2.CAP_PROP_FOURCC, _cv2.VideoWriter_fourcc(*'MJPG'))
        log.info("OpenCV camera opened on {}".format(dev_path))
        while _camera_running:
            ok, frame = cap.read()
            if ok:
                # Ensure frame is in BGR — some V4L2 cameras return YUYV or other formats
                if len(frame.shape) == 2:
                    # Greyscale → convert to BGR
                    frame = _cv2.cvtColor(frame, _cv2.COLOR_GRAY2BGR)
                elif frame.shape[2] == 4:
                    # BGRA → strip alpha
                    frame = frame[:, :, :3]
                _, buf = _cv2.imencode('.jpg', frame, [_cv2.IMWRITE_JPEG_QUALITY, 70])
                with _camera_lock:
                    _camera_frame = buf.tobytes()
        cap.release()
        log.info("OpenCV camera closed for video{}".format(device))

    except ImportError:
        # cv2 not available — use fswebcam subprocess at ~5fps
        import subprocess, os, tempfile, time as _t
        log.info("cv2 not available, using fswebcam for {}".format(dev_path))
        while _camera_running:
            tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
            tmp_path = tmp.name
            tmp.close()
            try:
                r = subprocess.call(
                    ["fswebcam", "-d", dev_path, "-r", "320x240",
                     "--no-banner", "--jpeg", "70", "-q", tmp_path],
                    timeout=3)
                if r == 0 and os.path.exists(tmp_path):
                    with open(tmp_path, "rb") as f:
                        data = f.read()
                    if data:
                        with _camera_lock:
                            _camera_frame = data
            except Exception as e:
                log.debug("fswebcam error: {}".format(e))
            finally:
                try: os.unlink(tmp_path)
                except Exception: pass
            _t.sleep(0.2)   # ~5fps
        log.info("fswebcam camera closed for video{}".format(device))


def _camera_start(device):
    global _camera_running, _camera_frame, _camera_device_index
    with _camera_lock:
        if _camera_running:
            return
        _camera_running      = True
        _camera_frame        = None
        _camera_device_index = device
    t = threading.Thread(target=_camera_capture_thread, args=(device,), daemon=True)
    t.start()


def _camera_stop():
    global _camera_running, _camera_frame
    with _camera_lock:
        _camera_running = False
        _camera_frame   = None


# ─────────────────────────────────────────────────────────────────────────────
# Sensor polling thread
# ─────────────────────────────────────────────────────────────────────────────

def _sensor_polling_thread():
    global _hal
    log.info("Sensor polling thread starting...")
    try:
        from controller import Robot as HalRobot
        hal = HalRobot()
        with _hal_lock:
            _hal = hal
        log.info("HAL initialised in sensor thread.")
        _real_sensor_loop(hal)
    except Exception as e:
        log.warning("Could not initialise HAL ({}). Using simulated sensors.".format(e))
        _simulate_sensors()


def _real_sensor_loop(hal):
    while True:
        # Block here while a user script owns the HAL
        _script_running_event.wait()
        try:
            hal.step(32)
            with state_lock:
                server_state["sensors"]["ps"]          = list(hal.sensors_raw)
                server_state["sensors"]["ambient"]     = list(hal.ambient_raw)
                server_state["sensors"]["mic"]         = list(hal.mic_raw)
                server_state["sensors"]["left_speed"]  = hal.left_speed_steps
                server_state["sensors"]["right_speed"] = hal.right_speed_steps
                server_state["sensors"]["motor_steps"] = [hal.motor_steps_l, hal.motor_steps_r]
                server_state["sensors"]["ground"]      = list(hal.ground_raw)
                server_state["sensors"]["tof_mm"]      = hal.tof_mm
                server_state["sensors"]["selector"]    = hal.selector
                server_state["sensors"]["button"]      = hal.button
                server_state["sensors"]["tv_remote"]   = hal.tv_remote
                # Battery — read via sysfs, non-blocking
                _bat = hal.getBattery()
                if _bat:
                    server_state["sensors"]["battery"] = _bat
                server_state["sensors"]["timestamp"]   = time.time()
                if hal.imu_ok:
                    server_state["sensors"]["imu"] = {
                        "acc":  list(hal.imu_acc),
                        "gyro": list(hal.imu_gyro),
                    }
                if hal.mag_ok:
                    server_state["sensors"]["mag"] = {
                        "heading": hal.mag_heading,
                        "x": hal.mag_x,
                        "y": hal.mag_y,
                        "z": hal.mag_z,
                    }
                rab = hal.getRabReading()
                server_state["randb"]["data"]        = rab["data"]
                server_state["randb"]["bearing_deg"] = rab["bearing_deg"]
                server_state["randb"]["range_mm"]    = rab["range_mm"]
                server_state["randb"]["sensor"]      = rab["sensor"]
                snapshot = dict(server_state["sensors"])
            with state_lock:
                rab_snap = dict(server_state["randb"])
            _broadcast({"type": "sensors", "data": snapshot, "randb": rab_snap})
        except Exception as e:
            log.debug("Sensor poll error: {}".format(e))
        time.sleep(0.032)


def _simulate_sensors():
    import math
    t = 0.0
    while True:
        t += 0.1
        fake = {
            "ps":          [int(abs(math.sin(t + i * 0.8)) * 200) for i in range(8)],
            "left_speed":  0.0,
            "right_speed": 0.0,
            "timestamp":   time.time(),
        }
        with state_lock:
            server_state["sensors"] = fake
        _broadcast({"type": "sensors", "data": fake})
        time.sleep(0.1)


# ─────────────────────────────────────────────────────────────────────────────
# Script runner  — executes user code IN-PROCESS using the shared HAL
# ─────────────────────────────────────────────────────────────────────────────

class _LogCapture:
    """Redirect print() inside user scripts to the WebSocket log."""
    def write(self, text):
        text = text.rstrip()
        if text:
            _append_log("  " + text)
    def flush(self):
        pass


def _run_script(script_path):
    """Execute user script in-process using the shared HAL. Instant start, no subprocess."""
    _set_status("running")
    _append_log("▶ Starting {}".format(Path(script_path).name))

    # Pause sensor polling so script has exclusive I2C access via shared hal
    _script_running_event.clear()
    time.sleep(0.05)

    with _hal_lock:
        hal = _hal

    try:
        with open(script_path) as f:
            code_str = f.read()

        import sys as _sys
        _old_stdout = _sys.stdout
        _sys.stdout = _LogCapture()

        # Wrap hal.step() so stop event interrupts the script mid-loop
        _original_step = hal.step if hal else None
        if hal:
            def _stoppable_step(ms):
                if _script_stop_event.is_set():
                    raise SystemExit("stopped")
                return _original_step(ms)
            hal.step = _stoppable_step

        # Robot() returns the shared hal — no hardware re-init
        class _SharedFactory:
            def __new__(cls, *a, **kw):
                return hal

        script_globals = {
            "__name__": "__main__",
            "Robot":    _SharedFactory,
            "robot":    hal,
            "time":     __import__("time"),
            "math":     __import__("math"),
            "random":   __import__("random"),
        }

        try:
            _script_stop_event.clear()
            exec(compile(code_str, script_path, "exec"), script_globals)
            _append_log("✓ Script finished successfully.")
            _set_status("idle")
        except SystemExit:
            _append_log("⛔ Script stopped by user.")
            _set_status("idle")
        except Exception as e:
            import traceback
            msg = traceback.format_exc().strip().splitlines()[-1]
            _append_log("✗ {}".format(msg))
            _set_status("error", msg)
        finally:
            _sys.stdout = _old_stdout
            if hal and _original_step:
                hal.step = _original_step

    except Exception as e:
        _append_log("✗ Runner error: {}".format(e))
        _set_status("error", str(e))
    finally:
        if hal is not None:
            try:
                hal.stopMotors()
                hal.stopSpeaker()
                # Reset all LEDs
                hal.led_binary = [0, 0, 0, 0]
                hal.led_rgb    = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
                hal.step(32)
            except Exception:
                pass
        _script_running_event.set()
        _append_log("— Sensor polling resumed.")
        try:
            os.remove(script_path)
        except Exception:
            pass


# ─────────────────────────────────────────────────────────────────────────────
# HTTP request handler
# ─────────────────────────────────────────────────────────────────────────────

class EpuckHandler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        pass   # suppress default per-request logging

    # ── helpers ───────────────────────────────────────────────────────────────

    def _serve_static(self, filename, mime):
        """Serve a static file from the same directory as server.py."""
        filepath = Path(__file__).parent / filename
        try:
            data = filepath.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', mime + '; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
        except FileNotFoundError:
            self._send_json({'ok': False, 'error': filename + ' not found'}, 404)

    def _send_json(self, data, code=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return None
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return None

    # ── OPTIONS (CORS preflight) ──────────────────────────────────────────────

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    # ── GET ───────────────────────────────────────────────────────────────────

    def do_GET(self):
        path = self.path.split("?")[0]

        if path == "/ws":
            self._handle_ws_upgrade()
            return

        if path == "/ping":
            self._send_json({"ok": True, "message": "e-puck server alive"})

        elif path == "/sensors":
            with state_lock:
                snapshot = dict(server_state["sensors"])
            self._send_json({"ok": True, "sensors": snapshot})

        elif path == "/status":
            with state_lock:
                self._send_json({
                    "ok":         True,
                    "status":     server_state["status"],
                    "script":     server_state["script_name"],
                    "pid":        server_state["pid"],
                    "last_error": server_state["last_error"],
                })

        elif path == "/logs":
            with state_lock:
                lines = list(server_state["log_lines"])
            self._send_json({"ok": True, "logs": lines})

        elif path == "/camera/snapshot":
            self._handle_camera_snapshot()

        elif path == "/camera/stream":
            self._handle_camera_stream()

        elif path == "/camera/status":
            self._handle_camera_status()

        elif path == "/camera/open":
            self._handle_camera_open()

        elif path == "/camera/close":
            self._handle_camera_close()

        elif path == "/camera/analyze":
            self._handle_camera_analyze()
        elif path == "/camera/ai_describe":
            self._handle_camera_ai_describe()

        elif path == "/randb/status":
            with state_lock:
                rab = dict(server_state["randb"])
            self._send_json({"ok": True, "randb": rab})

        elif path == "/battery":
            self._handle_battery()

        elif path == "/imu/calibrate":
            self._handle_imu_calibrate()

        elif path == "/mag/calibrate":
            self._handle_mag_calibrate()

        elif path == "/audio/list":
            self._handle_audio_list()

        elif path == "/audio/status":
            self._handle_audio_status()

        elif path in ('/', '/index.html'):
            self._serve_static('index.html', 'text/html')
        elif path == '/mobile.html':
            self._serve_static('mobile.html', 'text/html')
        elif path == '/student.html':
            self._serve_static('student.html', 'text/html')
        elif path == '/scoreboard.html':
            self._serve_static('scoreboard.html', 'text/html')
        elif path == '/maze.html':
            self._serve_static('maze.html', 'text/html')
        elif path == '/maze_scoreboard.html':
            self._serve_static('maze_scoreboard.html', 'text/html')
        elif path == '/garbage.html':
            self._serve_static('garbage.html', 'text/html')
        elif path == '/garbage_coop.html':
            self._serve_static('garbage_coop.html', 'text/html')
        elif path == '/rab_test.html':
            self._serve_static('rab_test.html', 'text/html')
        elif path == '/blockly-config.js':
            self._serve_static('blockly-config.js', 'application/javascript')
        elif path == '/style.css':
            self._serve_static('style.css', 'text/css')

        else:
            self._send_json({"ok": False, "error": "Not found"}, 404)

    # ── POST ──────────────────────────────────────────────────────────────────

    def do_POST(self):
        path = self.path.split("?")[0]

        if path == "/run":
            self._handle_run()
        elif path == "/stop":
            self._handle_stop()
        elif path == "/leds":
            self._handle_leds()
        elif path == "/speaker":
            self._handle_speaker()

        elif path == "/speaker/volume":
            self._handle_speaker_volume()
        elif path == "/motors":
            self._handle_motors()
        elif path == "/camera/open":
            self._handle_camera_open()
        elif path == "/camera/close":
            self._handle_camera_close()
        elif path == "/randb/mode":
            self._handle_randb_mode()
        elif path == "/randb/transmit":
            self._handle_randb_transmit()
        elif path == "/randb/range":
            self._handle_randb_range()
        elif path == "/imu/calibrate":
            self._handle_imu_calibrate()
        elif path == "/mag/calibrate":
            self._handle_mag_calibrate()
        elif path == "/audio/play":
            self._handle_audio_play()
        elif path == "/audio/stop":
            self._handle_audio_stop()
        elif path == "/audio/volume":
            self._handle_audio_volume()
        elif path == "/audio/upload":
            self._handle_audio_upload()
        else:
            self._send_json({"ok": False, "error": "Not found"}, 404)

    # ── /run ──────────────────────────────────────────────────────────────────

    def _handle_run(self):
        with state_lock:
            current = server_state["status"]
        if current == "running":
            self._send_json(
                {"ok": False, "error": "A script is already running. Stop it first."},
                409
            )
            return

        body = self._read_json_body()
        if body is None or "code" not in body:
            self._send_json({"ok": False, "error": "Missing 'code' in JSON body."}, 400)
            return

        code = body["code"]

        server_dir = str(Path(__file__).parent)
        fd, tmp_path = tempfile.mkstemp(
            suffix=".py", prefix="blockcode_", dir=server_dir
        )
        with os.fdopen(fd, "w") as f:
            f.write(code)

        with state_lock:
            server_state["script_name"] = Path(tmp_path).name

        log.info("Received script → {}".format(tmp_path))

        t = threading.Thread(target=_run_script, args=(tmp_path,), daemon=True)
        t.start()

        self._send_json({"ok": True, "script": Path(tmp_path).name})

    # ── /stop ─────────────────────────────────────────────────────────────────

    # ── /stop ───────────────────────────────────────────────────────────────

    def _handle_stop(self):
        with state_lock:
            current = server_state["status"]
        if current != "running":
            self._send_json({"ok": False, "error": "No script is running."}, 400)
            return
        log.info("Stop requested — signalling script thread.")
        _script_stop_event.set()
        self._send_json({"ok": True})

    # ── /battery ──────────────────────────────────────────────────────────────

    def _handle_battery(self):
        """Read e-puck and extension battery voltages from the ADS1015 ADC."""
        EPUCK_RAW   = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_raw"
        EXT_RAW     = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_raw"
        EPUCK_SCALE = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_scale"
        EXT_SCALE   = "/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_scale"
        EPUCK_RAW_L = "/sys/bus/i2c/drivers/ads1015/3-0048/in4_input"
        EXT_RAW_L   = "/sys/bus/i2c/drivers/ads1015/3-0048/in5_input"
        BAT_MIN, BAT_MAX = 3.3, 4.138
        BAT_RANGE = BAT_MAX - BAT_MIN

        def read_battery(raw_path, scale_path, legacy_raw_path):
            try:
                if os.path.exists(raw_path):
                    with open(scale_path) as f:
                        scale = float(f.read())
                    with open(raw_path) as f:
                        raw = float(f.read())
                elif os.path.exists(legacy_raw_path):
                    scale = 1.0
                    with open(legacy_raw_path) as f:
                        raw = float(f.read())
                else:
                    return None
                voltage = round((raw * scale) / 500.0, 2)
                pct = round((voltage - BAT_MIN) / BAT_RANGE * 100.0, 1)
                pct = max(0.0, min(100.0, pct))
                return {"voltage": voltage, "percent": pct}
            except Exception as e:
                return {"error": str(e)}

        epuck = read_battery(EPUCK_RAW, EPUCK_SCALE, EPUCK_RAW_L)
        ext   = read_battery(EXT_RAW,   EXT_SCALE,   EXT_RAW_L)
        self._send_json({"ok": True, "epuck": epuck, "ext": ext})

    # ── /imu/calibrate ────────────────────────────────────────────────────────

    def _handle_imu_calibrate(self):
        with _hal_lock:
            hal = _hal
        if hal is None:
            self._send_json({"ok": False, "error": "HAL not available"}, 503)
            return
        try:
            hal.recalibrateImu()
            self._send_json({"ok": True})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    # ── /mag/calibrate ────────────────────────────────────────────────────────

    def _handle_mag_calibrate(self):
        """Start a 10-second magnetometer calibration in a background thread."""
        with _hal_lock:
            hal = _hal
        if hal is None or hal._mag is None:
            self._send_json({"ok": False, "error": "Magnetometer not available"}, 503)
            return
        import threading
        def _run():
            hal.recalibrateMag(samples=100, interval=0.1)
            _append_log("🧭 Magnetometer calibration complete — offsets X={:.2f} Y={:.2f}".format(
                hal._mag_offset[0], hal._mag_offset[1]))
        threading.Thread(target=_run, daemon=True).start()
        self._send_json({"ok": True, "message": "Calibration started — spin robot 360° now (10s)"})

    # ── /leds ─────────────────────────────────────────────────────────────────

    def _handle_leds(self):
        """
        Directly update the HAL's LED state without stopping/starting any script.
        The sensor polling loop picks up the new state on its next step().

        Expected JSON body:
        {
            "binary":   [0, 1, 0, 1],          // LED1,3,5,7 — 0 or 1 each
            "rgb":      [[100,0,0],[0,0,0],[0,0,0],[0,0,0]],  // LED2,4,6,8 — R,G,B 0-100
            "pi_leds":  [1, 2, 0]              // Pi-puck LEDs 1-3 — color byte each (optional)
                                               // 0=off,1=red,2=green,4=blue,3=yellow,5=magenta,6=cyan,7=white
        }
        """
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body."}, 400)
            return

        with _hal_lock:
            hal = _hal

        if hal is None:
            self._send_json({"ok": False, "error": "HAL not available (simulation mode)."}, 503)
            return

        try:
            if "binary" in body:
                vals = body["binary"]
                if len(vals) == 4:
                    hal.led_binary = [1 if v else 0 for v in vals]

            if "rgb" in body:
                vals = body["rgb"]
                if len(vals) == 4:
                    hal.led_rgb = [
                        [max(0, min(100, int(c))) for c in rgb]
                        for rgb in vals
                    ]

            if "pi_leds" in body:
                vals = body["pi_leds"]
                if len(vals) == 3:
                    for i, color in enumerate(vals):
                        hal.setPiLed(i, int(color))

            self._send_json({"ok": True})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    # ── /speaker ──────────────────────────────────────────────────────────────

    def _handle_speaker(self):
        """
        Directly set the speaker sound on the HAL.
        The sensor polling loop sends it on the next step().

        Expected JSON body:
        { "sound": 1 }   // 0=off, 1=short beep, 2=double beep,
                         // 3=three beeps, 4=alarm, 5=melody
        """
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body."}, 400)
            return

        with _hal_lock:
            hal = _hal

        if hal is None:
            self._send_json({"ok": False, "error": "HAL not available (simulation mode)."}, 503)
            return

        try:
            sound = int(body.get("sound", 0))
            sound = max(0, min(5, sound))
            hal.speaker = sound
            self._send_json({"ok": True, "sound": sound})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    # ── /speaker/volume ───────────────────────────────────────────────────────

    def _handle_speaker_volume(self):
        """
        Set system audio volume via amixer.
        Expected JSON body: { "volume": 75 }  // 0-100
        Tries multiple amixer control names in order (Pi Zero / Pi-puck variants).
        """
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body."}, 400)
            return
        try:
            vol = int(body.get("volume", 80))
            vol = max(0, min(100, vol))
        except (TypeError, ValueError):
            self._send_json({"ok": False, "error": "Invalid volume value."}, 400)
            return

        import subprocess as _sp
        # Try common control names on Pi Zero / Pi-puck (Buster and Stretch)
        controls = ["PCM", "Master", "Headphone", "Speaker"]
        last_err = "no amixer controls found"
        for ctrl in controls:
            try:
                result = _sp.run(
                    ["amixer", "sset", ctrl, "{}%".format(vol)],
                    capture_output=True, text=True, timeout=3
                )
                if result.returncode == 0:
                    _append_log("🔊 Volume set to {}%".format(vol))
                    self._send_json({"ok": True, "volume": vol, "control": ctrl})
                    return
                last_err = result.stderr.strip() or result.stdout.strip()
            except FileNotFoundError:
                self._send_json({"ok": False, "error": "amixer not found on this system."}, 501)
                return
            except Exception as e:
                last_err = str(e)
        self._send_json({"ok": False, "error": "amixer failed: {}".format(last_err)}, 500)

    # ── Audio playback (MP3/WAV via mpg123/aplay) ─────────────────────────────
    # Files are stored in <server_dir>/sounds/
    # Global state: _audio_proc holds the running subprocess

    def _handle_audio_list(self):
        import os
        sounds_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sounds")
        if not os.path.isdir(sounds_dir):
            self._send_json({"ok": True, "files": [], "dir": sounds_dir})
            return
        files = sorted([
            f for f in os.listdir(sounds_dir)
            if f.lower().endswith(('.mp3', '.wav', '.ogg', '.flac'))
        ])
        self._send_json({"ok": True, "files": files, "dir": sounds_dir})

    def _handle_audio_status(self):
        global _audio_proc, _audio_current
        playing = _audio_proc is not None and _audio_proc.poll() is None
        self._send_json({"ok": True, "playing": playing, "file": _audio_current if playing else None})

    def _handle_audio_play(self):
        global _audio_proc, _audio_current
        import os, subprocess as _sp
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body"}, 400)
            return
        filename = body.get("file", "")
        if not filename:
            self._send_json({"ok": False, "error": "No file specified"}, 400)
            return
        # Security: strip any path components
        filename = os.path.basename(filename)
        sounds_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sounds")
        filepath = os.path.join(sounds_dir, filename)
        if not os.path.isfile(filepath):
            self._send_json({"ok": False, "error": "File not found: {}".format(filename)}, 404)
            return
        # Stop any current playback
        if _audio_proc and _audio_proc.poll() is None:
            _audio_proc.terminate()
            _audio_proc = None
        # Choose player based on file extension
        ext = filename.lower().rsplit('.', 1)[-1]
        if ext == 'mp3':
            # mpg123 preferred for MP3; fall back to ffplay
            for player in (['mpg123', '-q', filepath], ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', filepath]):
                try:
                    _audio_proc = _sp.Popen(player)
                    _audio_current = filename
                    _append_log("🎵 Playing: {}".format(filename))
                    self._send_json({"ok": True, "file": filename, "player": player[0]})
                    return
                except FileNotFoundError:
                    continue
            self._send_json({"ok": False, "error": "No MP3 player found (install mpg123 or ffplay)"}, 501)
        else:
            # WAV/OGG/FLAC via aplay or ffplay
            for player in (['aplay', '-q', filepath], ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', filepath]):
                try:
                    _audio_proc = _sp.Popen(player)
                    _audio_current = filename
                    _append_log("🎵 Playing: {}".format(filename))
                    self._send_json({"ok": True, "file": filename, "player": player[0]})
                    return
                except FileNotFoundError:
                    continue
            self._send_json({"ok": False, "error": "No audio player found (install aplay or ffplay)"}, 501)

    def _handle_audio_stop(self):
        global _audio_proc, _audio_current
        if _audio_proc and _audio_proc.poll() is None:
            _audio_proc.terminate()
            _audio_proc = None
            _audio_current = None
            _append_log("⏹ Audio stopped")
            self._send_json({"ok": True})
        else:
            _audio_proc = None
            _audio_current = None
            self._send_json({"ok": True, "note": "nothing was playing"})

    def _handle_audio_volume(self):
        """Set system ALSA volume — works for real audio (not the buzzer)."""
        import subprocess as _sp
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body"}, 400)
            return
        try:
            vol = max(0, min(100, int(body.get("volume", 80))))
        except (TypeError, ValueError):
            self._send_json({"ok": False, "error": "Invalid volume"}, 400)
            return
        controls = ["PCM", "Master", "Headphone", "Speaker"]
        for ctrl in controls:
            try:
                r = _sp.run(["amixer", "sset", ctrl, "{}%".format(vol)],
                            capture_output=True, text=True, timeout=3)
                if r.returncode == 0:
                    _append_log("🔊 Volume → {}%".format(vol))
                    self._send_json({"ok": True, "volume": vol, "control": ctrl})
                    return
            except FileNotFoundError:
                self._send_json({"ok": False, "error": "amixer not found"}, 501)
                return
            except Exception as e:
                pass
        self._send_json({"ok": False, "error": "amixer: no usable control found"}, 500)

    def _handle_audio_upload(self):
        """Receive a multipart file upload and save to sounds/ directory."""
        import os, cgi
        sounds_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sounds")
        os.makedirs(sounds_dir, exist_ok=True)
        try:
            ctype = self.headers.get('Content-Type', '')
            length = int(self.headers.get('Content-Length', 0))
            if 'multipart/form-data' in ctype:
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': ctype}
                )
                item = form['file']
                filename = os.path.basename(item.filename)
                data = item.file.read()
            else:
                # Raw binary upload with filename in query string
                filename = os.path.basename(self.path.split('?file=')[-1]) or 'upload.mp3'
                data = self.rfile.read(length)
            if not filename.lower().endswith(('.mp3', '.wav', '.ogg', '.flac')):
                self._send_json({"ok": False, "error": "Unsupported format (mp3/wav/ogg/flac only)"}, 400)
                return
            filepath = os.path.join(sounds_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(data)
            _append_log("📁 Uploaded: {} ({} KB)".format(filename, len(data)//1024))
            self._send_json({"ok": True, "file": filename, "size": len(data)})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    # ── /motors ───────────────────────────────────────────────────────────────

    def _handle_motors(self):
        """
        Directly set wheel speeds on the HAL.
        The sensor polling loop transmits them on the next step().

        Expected JSON body:
        { "left": 50, "right": 50 }   // -100 to +100 percent
        """
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body."}, 400)
            return

        with _hal_lock:
            hal = _hal

        if hal is None:
            self._send_json({"ok": False, "error": "HAL not available (simulation mode)."}, 503)
            return

        try:
            left  = max(-100, min(100, float(body.get("left",  0))))
            right = max(-100, min(100, float(body.get("right", 0))))
            hal.setMotors(left, right)
            self._send_json({"ok": True, "left": left, "right": right})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    # ── /camera ───────────────────────────────────────────────────────────────

    def _handle_camera_open(self):
        """Start OpenCV capture thread for the selected device."""
        import os
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        device = int(qs.get("device", [str(_camera_device_index)])[0])

        if not os.path.exists("/dev/video{}".format(device)):
            self._send_json({"ok": False, "error": "/dev/video{} not found.".format(device)}, 503)
            return

        _camera_stop()
        import time as _t; _t.sleep(0.3)
        _camera_start(device)
        log.info("OpenCV camera started on /dev/video{}".format(device))
        self._send_json({"ok": True, "device": device})

    def _handle_camera_close(self):
        """Stop OpenCV capture thread."""
        _camera_stop()
        self._send_json({"ok": True})

    def _handle_camera_status(self):
        """Report whether capture thread is running."""
        with _camera_lock:
            running = _camera_running
        self._send_json({"ok": True, "open": running, "device": _camera_device_index})

    def _handle_camera_snapshot(self):
        """Return latest JPEG frame from OpenCV capture thread."""
        with _camera_lock:
            frame = _camera_frame
        if not frame:
            self._send_json({"ok": False, "error": "No frame — open camera first."}, 503)
            return
        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", str(len(frame)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(frame)

    def _handle_camera_stream(self):
        """Serve multipart MJPEG stream — browser uses <img src='/camera/stream'>."""
        import time as _t
        self.send_response(200)
        self.send_header("Content-Type", "multipart/x-mixed-replace; boundary=frame")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        try:
            while True:
                with _camera_lock:
                    frame = _camera_frame
                if frame:
                    header = (
                        "--frame\r\n"
                        "Content-Type: image/jpeg\r\n"
                        "Content-Length: {}\r\n\r\n".format(len(frame))
                    ).encode()
                    self.wfile.write(header + frame + b"\r\n")
                    self.wfile.flush()
                _t.sleep(0.066)   # ~15 fps
        except Exception:
            pass   # client disconnected

    def _handle_camera_analyze(self):
        """
        Analyze the latest camera frame and return:
          brightness   : 0-255 mean luminance
          dominant     : "red" | "green" | "blue" | "dark" | "bright"
          r, g, b      : mean channel values (0-255)
        Works with or without OpenCV — falls back to pure stdlib JPEG parsing.
        """
        with _camera_lock:
            frame = _camera_frame
        if not frame:
            self._send_json({"ok": False, "error": "No frame — open camera first."}, 503)
            return
        try:
            import cv2 as _cv2
            import numpy as _np
            import io
            arr = _np.frombuffer(frame, dtype=_np.uint8)
            img = _cv2.imdecode(arr, _cv2.IMREAD_COLOR)   # BGR
            # Resize to 32x24 for fast analysis
            small = _cv2.resize(img, (32, 24))
            mean_b = float(_np.mean(small[:, :, 0]))
            mean_g = float(_np.mean(small[:, :, 1]))
            mean_r = float(_np.mean(small[:, :, 2]))
            brightness = round((mean_r + mean_g + mean_b) / 3.0, 1)
            # Region brightness: left / center / right thirds
            bright_left   = round(float(_np.mean(small[:,  0:11, :])), 1)
            bright_center = round(float(_np.mean(small[:, 11:22, :])), 1)
            bright_right  = round(float(_np.mean(small[:, 22:32, :])), 1)
        except ImportError:
            # No cv2 — decode JPEG with Pillow if available, else estimate from file size
            try:
                from PIL import Image as _Img
                import io as _io
                img = _Img.open(_io.BytesIO(frame)).convert("RGB").resize((32, 24))
                pixels = list(img.getdata())
                mean_r = sum(p[0] for p in pixels) / len(pixels)
                mean_g = sum(p[1] for p in pixels) / len(pixels)
                mean_b = sum(p[2] for p in pixels) / len(pixels)
                brightness = round((mean_r + mean_g + mean_b) / 3.0, 1)
                # Region brightness from pixel list (32 wide × 24 tall)
                left_px   = [pixels[r*32 + c] for r in range(24) for c in range(0,  11)]
                center_px = [pixels[r*32 + c] for r in range(24) for c in range(11, 22)]
                right_px  = [pixels[r*32 + c] for r in range(24) for c in range(22, 32)]
                bright_left   = round(sum(sum(p)/3 for p in left_px)   / len(left_px),   1)
                bright_center = round(sum(sum(p)/3 for p in center_px) / len(center_px), 1)
                bright_right  = round(sum(sum(p)/3 for p in right_px)  / len(right_px),  1)
            except Exception:
                # Last resort — rough estimate from JPEG size
                mean_r = mean_g = mean_b = min(255.0, len(frame) / 50.0)
                brightness = round(mean_r, 1)
                bright_left = bright_center = bright_right = brightness

        # Dominant colour logic
        # Subtract the minimum channel to isolate the true color cast
        # e.g. r=88, g=93, b=38 → min=38 → r_cast=50, g_cast=55, b_cast=0 → green wins
        min_ch   = min(mean_r, mean_g, mean_b)
        r_cast   = mean_r - min_ch
        g_cast   = mean_g - min_ch
        b_cast   = mean_b - min_ch
        max_cast = max(r_cast, g_cast, b_cast)

        if brightness < 30:
            dominant = "dark"
        elif max_cast < 15:
            # All channels similar — achromatic (white/grey/dark)
            dominant = "bright" if brightness > 150 else "dark"
        elif r_cast >= g_cast and r_cast >= b_cast:
            dominant = "red"
        elif g_cast >= r_cast and g_cast >= b_cast:
            dominant = "green"
        else:
            dominant = "blue"

        self._send_json({
            "ok":           True,
            "brightness":   brightness,
            "dominant":     dominant,
            "r":            round(mean_r, 1),
            "g":            round(mean_g, 1),
            "b":            round(mean_b, 1),
            "bright_left":  bright_left,
            "bright_center":bright_center,
            "bright_right": bright_right,
        })

    def _handle_camera_ai_describe(self):
        """
        Send the latest camera frame to the Anthropic API for AI vision description.
        Optional query param: ?prompt=... to customise the question asked.
        Returns: {ok, description} or {ok:False, error}
        Requires ANTHROPIC_API_KEY environment variable on the Pi-Puck.
        """
        import base64, json, os
        from urllib.request import urlopen, Request
        from urllib.error import URLError

        # Get optional custom prompt from query string
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        prompt = qs.get('prompt', ['What do you see in this image? Describe briefly in 1-2 sentences.'])[0]

        # Get current frame
        with _camera_lock:
            frame = _camera_frame
        if not frame:
            self._send_json({"ok": False, "error": "No frame — open camera first."}, 503)
            return

        # Check API key
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            self._send_json({"ok": False, "error": "ANTHROPIC_API_KEY not set on robot."}, 500)
            return

        try:
            img_b64 = base64.b64encode(frame).decode('utf-8')
            payload = json.dumps({
                "model": "claude-haiku-4-5-20251001",
                "max_tokens": 256,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": img_b64
                        }},
                        {"type": "text", "text": prompt}
                    ]
                }]
            }).encode('utf-8')

            req = Request(
                "https://api.anthropic.com/v1/messages",
                data=payload,
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                method="POST"
            )
            resp = json.loads(urlopen(req, timeout=15).read())
            description = resp["content"][0]["text"].strip()
            self._send_json({"ok": True, "description": description})

        except URLError as e:
            self._send_json({"ok": False, "error": "Network error: " + str(e)}, 503)
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    # ── /randb/mode ──────────────────────────────────────────────────────────

    def _handle_randb_range(self):
        """Set RaB transmission range: POST {"range": 0-255} (0=full ~1m, 255=off)."""
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body."}, 400)
            return
        with _hal_lock:
            hal = _hal
        if hal is None:
            self._send_json({"ok": False, "error": "HAL not available."}, 503)
            return
        try:
            val = max(0, min(255, int(body.get("range", 150))))
            hal.setRabRange(val)
            with state_lock:
                server_state["randb"]["range_setting"] = val
            log.info("RaB range set to: {}".format(val))
            self._send_json({"ok": True, "range": val})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    def _handle_randb_mode(self):
        """Set RaB mode: POST {"mode": "rx"} or {"mode": "tx"} or {"mode": null}."""
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body."}, 400)
            return
        with _hal_lock:
            hal = _hal
        if hal is None:
            self._send_json({"ok": False, "error": "HAL not available."}, 503)
            return
        mode = body.get("mode", None)
        try:
            hal.setRabMode(mode)
            with state_lock:
                server_state["randb"]["mode"] = mode
            log.info("RaB mode set to: {}".format(mode))
            self._send_json({"ok": True, "mode": mode})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    def _handle_randb_transmit(self):
        """Set TX data: POST {"hi": 0xAA, "lo": 0xFF}."""
        body = self._read_json_body()
        if body is None:
            self._send_json({"ok": False, "error": "Missing JSON body."}, 400)
            return
        with _hal_lock:
            hal = _hal
        if hal is None:
            self._send_json({"ok": False, "error": "HAL not available."}, 503)
            return
        try:
            hi = int(body.get("hi", 0xAA)) & 0xFF
            lo = int(body.get("lo", 0xFF)) & 0xFF
            hal.setRabData(hi, lo)
            self._send_json({"ok": True, "hi": hi, "lo": lo})
        except Exception as e:
            self._send_json({"ok": False, "error": str(e)}, 500)

    # ── WebSocket upgrade ─────────────────────────────────────────────────────

    def _handle_ws_upgrade(self):
        key = self.headers.get("Sec-WebSocket-Key")
        if not key:
            self.send_response(400)
            self.end_headers()
            return

        conn = self.connection
        conn.setblocking(True)
        _ws_handshake(conn, key)

        log.info("WebSocket client connected.")
        with _ws_lock:
            _ws_clients.append(conn)

        with state_lock:
            welcome = {
                "type":    "welcome",
                "status":  server_state["status"],
                "logs":    server_state["log_lines"][-20:],
                "sensors": server_state["sensors"],
            }
        _ws_send_text(conn, json.dumps(welcome))

        # Keep open until client disconnects
        # Every 5 s we time out on recv and send a WS ping text frame
        # so the browser's WebSocket stays alive indefinitely.
        last_ping = time.time()
        while True:
            msg = _ws_recv_frame(conn)
            if msg is None:          # real disconnect or error
                break
            # msg == "" means recv timed out — send keepalive ping
            if time.time() - last_ping >= 5:
                if not _ws_send_text(conn, json.dumps({"type": "ping"})):
                    break            # send failed — client gone
                last_ping = time.time()

        with _ws_lock:
            try:
                _ws_clients.remove(conn)
            except ValueError:
                pass
        log.info("WebSocket client disconnected.")


# ─────────────────────────────────────────────────────────────────────────────
# Threaded HTTP server
# ─────────────────────────────────────────────────────────────────────────────

class ThreadedHTTPServer(HTTPServer):
    """Spawn a new thread for every incoming request."""

    def process_request(self, request, client_address):
        t = threading.Thread(
            target=self._process_request_thread,
            args=(request, client_address),
            daemon=True,
        )
        t.start()

    def _process_request_thread(self, request, client_address):
        try:
            self.finish_request(request, client_address)
        except Exception:
            self.handle_error(request, client_address)
        finally:
            self.shutdown_request(request)


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="e-puck Block Coder — Robot Server")
    parser.add_argument("--host", default="0.0.0.0",
                        help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=5000,
                        help="Port (default: 5000)")
    parser.add_argument("--no-sensors", action="store_true",
                        help="Disable sensor polling thread")
    args = parser.parse_args()

    if not args.no_sensors:
        t = threading.Thread(target=_sensor_polling_thread, daemon=True)
        t.start()

    server = ThreadedHTTPServer((args.host, args.port), EpuckHandler)
    log.info("e-puck Block Coder server → {}:{}".format(args.host, args.port))
    log.info("Endpoints: /ping  /run  /stop  /sensors  /status  /logs  /speaker  /motors  /camera/*  /randb/*  /ws")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Server stopped.")
