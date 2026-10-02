import time
import sys
from smbus2 import SMBus, i2c_msg

# ── Configuration ─────────────────────────────────────────────────────────────
ROB_ADDR       = 0x1F
ACTUATORS_SIZE = 19 + 1   # 19 data bytes + 1 checksum
SENSORS_SIZE   = 46 + 1   # 46 data bytes + 1 checksum

WEBOTS_MAX_VELOCITY = 6.28
HARDWARE_MAX_SPEED  = 1000          # steps/s
SPEED_CONVERSION    = HARDWARE_MAX_SPEED / WEBOTS_MAX_VELOCITY

# ── Ground sensor (Pi-Puck extension board) ───────────────────────────────────
GROUND_ADDR = 0x60   # I2C address of the ground sensor board
GROUND_REG  = 0      # register to read from
GROUND_SIZE = 6      # 6 bytes → 3 x uint16 big-endian (left, center, right)

# ── Actuator packet layout (from e-puck2_test.py) ────────────────────────────
#
#  Byte  0-1 : Left  motor speed  (int16 little-endian, steps/s)
#  Byte  2-3 : Right motor speed  (int16 little-endian, steps/s)
#  Byte  4   : Speaker sound index (0 = off)
#  Byte  5   : Binary LEDs bitmask — bits 0-3 = LED1, LED3, LED5, LED7
#                 0x01 = LED1 on,  0x02 = LED3 on,
#                 0x04 = LED5 on,  0x08 = LED7 on,  0x0F = all 4 on
#  Byte  6   : LED2 Red   (0-100)
#  Byte  7   : LED2 Green (0-100)
#  Byte  8   : LED2 Blue  (0-100)
#  Byte  9   : LED4 Red
#  Byte 10   : LED4 Green
#  Byte 11   : LED4 Blue
#  Byte 12   : LED6 Red
#  Byte 13   : LED6 Green
#  Byte 14   : LED6 Blue
#  Byte 15   : LED8 Red
#  Byte 16   : LED8 Green
#  Byte 17   : LED8 Blue
#  Byte 18   : Settings (0)
#  Byte 19   : Checksum (XOR of bytes 0-18)
#
# ── Sensor packet layout ──────────────────────────────────────────────────────
#  Bytes  0-15 : Proximity sensors ps0-ps7 (uint16 LE each)
#  Bytes 16-31 : Ambient light   ps0-ps7  (uint16 LE each)
#  Bytes 32-39 : Microphones     mic0-3   (uint16 LE each)
#  Byte  40    : Selector (bits 0-3) + Button (bit 4)
#  Bytes 41-44 : Motor steps left/right   (uint16 LE each)
#  Byte  45    : TV remote
#  Byte  46    : Checksum


class Robot:
    def __init__(self):
        print("[Wrapper] Initializing Direct I2C Connection...")

        self.bus = None
        for channel in [12, 4, 1]:
            try:
                self.bus = SMBus(channel)
                print("[Wrapper] Connected on I2C Channel {}".format(channel))
                break
            except Exception:
                pass

        if self.bus is None:
            print("[Wrapper] CRITICAL: Cannot open I2C device. Is the robot ON?")
            sys.exit(1)

        # Set a short I2C timeout (500ms) so a missing/sleeping e-puck2
        # firmware fails fast instead of hanging the server for 120 seconds.
        try:
            import fcntl as _fcntl
            I2C_TIMEOUT = 0x0706   # ioctl request code
            # Timeout unit is 10ms ticks — 50 = 500ms
            _fcntl.ioctl(self.bus.fd, I2C_TIMEOUT, 50)
            print("[Wrapper] I2C timeout set to 500ms")
        except Exception as e:
            print("[Wrapper] Could not set I2C timeout: {}".format(e))

        # Quick connectivity check — ping the e-puck2 at ROB_ADDR (0x1F)
        try:
            from smbus2 import i2c_msg as _msg
            _probe = _msg.read(ROB_ADDR, 1)
            self.bus.i2c_rdwr(_probe)
            print("[Wrapper] e-puck2 firmware responding OK")
        except Exception:
            print("[Wrapper] WARNING: e-puck2 not responding at 0x{:02X} — is the robot firmware running?".format(ROB_ADDR))

        # ── Motor state ───────────────────────────────────────────────────────
        self.left_speed_steps  = 0
        self.right_speed_steps = 0

        # ── LED state ─────────────────────────────────────────────────────────
        # Binary LEDs: LED1, LED3, LED5, LED7
        # led_binary[0]=LED1, [1]=LED3, [2]=LED5, [3]=LED7  (0=off, 1=on)
        self.led_binary = [0, 0, 0, 0]

        # RGB LEDs: LED2, LED4, LED6, LED8
        # led_rgb[0]=[R,G,B] for LED2, [1] for LED4, etc.  values 0-100
        self.led_rgb = [
            [0, 0, 0],   # LED2
            [0, 0, 0],   # LED4
            [0, 0, 0],   # LED6
            [0, 0, 0],   # LED8
        ]

        # ── Pi-puck extension LEDs (FT903 at 0x1C on I2C bus 11) ─────────────
        # 3 RGB LEDs on the Pi-puck board, controlled via separate I2C bus.
        # Color values: 0x00=off, 0x01=red, 0x02=green, 0x04=blue,
        #               0x03=yellow, 0x05=magenta, 0x06=cyan, 0x07=white
        # pi_leds[0]=LED1, [1]=LED2, [2]=LED3
        self.pi_leds      = [0, 0, 0]   # color byte per LED
        self._ft903_ch    = None        # I2C channel number (11 or 3)
        self._ft903_addr  = 0x1C
        self._ft903_lock  = __import__('threading').Lock()
        for _ch in (11, 3):
            try:
                _b = SMBus(_ch)
                _b.write_byte_data(0x1C, 0x00, 0x00)  # probe
                _b.close()
                self._ft903_ch = _ch
                print("Pi-puck FT903 LEDs found on I2C bus {}".format(_ch))
                break
            except Exception:
                try: _b.close()
                except Exception: pass
        if self._ft903_ch is None:
            print("Pi-puck FT903 LEDs not available")

        # Speaker (0 = off)
        self.speaker = 0

        # ── Sensor cache ──────────────────────────────────────────────────────
        self.sensors_raw   = [0] * 8   # proximity ps0-ps7
        self.ambient_raw   = [0] * 8   # ambient light ps0-ps7
        self.mic_raw       = [0] * 4   # microphones mic0-mic3
        self.ground_raw    = [0, 0, 0] # ground sensors: left, center, right
        self.tof_mm        = -1        # ToF distance in mm (-1 = not ready)
        self.selector      = 0         # selector dial 0-15
        self.button        = False     # front button pressed
        self.motor_steps_l = 0         # cumulative left  motor steps
        self.motor_steps_r = 0         # cumulative right motor steps
        self.tv_remote     = 0         # last TV remote code (0 = no signal)
        self._tof          = None      # VL53L1X instance

        # ── ToF sensor (VL53L0X at 0x29 on bus 12) ───────────────────────────
        # Uses VL53L0X library (not VL53L1X). Bus 12 is a virtual channel
        # exposed by the kernel pca954x mux driver — open directly.
        # Reading runs in a background thread at ~15Hz (66ms timing budget).
        self._tof_lock = None
        self._i2c_lock = __import__('threading').Lock()
        try:
            import VL53L0X as _VL53
            for _bus in (12, 4):
                try:
                    tof = _VL53.VL53L0X(i2c_bus=_bus, i2c_address=0x29)
                    tof.open()
                    print("ToF sensor found on bus {}".format(_bus))
                    break
                except Exception:
                    tof = None
            if tof is None:
                raise RuntimeError("ToF not found on any bus")
            tof.start_ranging(_VL53.Vl53l0xAccuracyMode.BETTER)
            self._tof_timing = max(20000, tof.get_timing())
            self._tof = tof
            print("ToF sensor ranging OK, timing {}ms".format(self._tof_timing // 1000))
            import time as _tw; _tw.sleep(0.5)   # wait for first valid reading
            import threading as _th
            self._tof_lock = _th.Lock()
            t = _th.Thread(target=self._tof_thread, daemon=True)
            t.start()
        except Exception as e:
            print("ToF sensor not available: {}".format(e))
            self._tof = None

        # ── Battery ADC (ADS1015 on I2C bus 11 via sysfs) ────────────────────
        # Reads voltage from Linux IIO sysfs — no I2C bus conflict.
        # Returns dict with 'voltage' (V) and 'percent' (0-100) for each battery.
        self._bat_paths = {
            'epuck_raw':   '/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_raw',
            'epuck_scale': '/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage0_scale',
            'ext_raw':     '/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_raw',
            'ext_scale':   '/sys/bus/i2c/devices/11-0048/iio:device0/in_voltage1_scale',
        }

        # ── Camera (OpenCV V4L2) ──────────────────────────────────────────────
        # video0 = Pi-Puck top camera, video1 = e-puck2 front camera (default)
        # Runs capture in a background thread; getCameraFrame() returns latest JPEG.
        self._cam_lock    = __import__('threading').Lock()
        self._cam_frame   = None    # latest JPEG bytes
        self._cam_running = False
        self._cam_thread  = None
        self.devices = {
            'left wheel motor':  Motor(self, 'left'),
            'right wheel motor': Motor(self, 'right'),
        }
        for i in range(8):
            self.devices['ps{}'.format(i)]             = DistanceSensor(self, i)
            self.devices['distance_sensor_{}'.format(i)] = self.devices['ps{}'.format(i)]

        # Ground sensor proxy
        self.devices['ground_sensor'] = GroundSensor(self)

        # ToF sensor proxy
        self.devices['tof'] = ToFSensor(self)

        # ── Range and Bearing (RaB) sensor ───────────────────────────────────
        # RaB board at I2C address 0x20, same bus as HAL.
        # IMPORTANT: we deliberately share self.bus (the main SMBus handle)
        # protected by self._i2c_lock instead of opening a second handle.
        # Opening multiple SMBus handles to the same bus channel causes
        # concurrent I2C transactions to interleave and corrupt each other —
        # which is exactly why Robot B always read data=0, range=0.
        self._rab_lock   = __import__('threading').Lock()
        self._rab_mode   = None        # None | 'rx' | 'tx'
        self._rab_data   = 0           # last received data word
        self._rab_bearing = 0.0        # radians
        self._rab_range  = 0           # mm
        self._rab_sensor = 0           # sensor ID
        self._rab_tx_hi  = 0xAA       # default tx data high byte
        self._rab_tx_lo  = 0xFF       # default tx data low byte
        self._rab_last_rx = 0.0       # timestamp of last valid RX packet
        self._rab_thread_running = False  # prevent multiple threads
        print("RaB sharing main I2C bus (channel {}) with _i2c_lock".format(
            12 if self.bus is not None else 'unknown'))

        # ── IMU (MPU-9250 at 0x68 on bus 12) ─────────────────────────────────
        # Accelerometer: ±2g range → raw/16384 = g
        # Gyroscope:     ±250dps range → raw/131 = dps
        # Runs in a background thread at ~20Hz (independent of main I2C step)
        self._imu_lock   = __import__('threading').Lock()
        self._imu_addr   = 0x68        # MPU-9250 default address
        self.imu_acc     = [0.0, 0.0, 0.0]   # g values: [x, y, z]
        self.imu_gyro    = [0.0, 0.0, 0.0]   # dps values: [x, y, z]
        self.imu_ok      = False       # True once first valid reading received
        self._imu_acc_offset  = [0, 0, 0]
        self._imu_gyro_offset = [0, 0, 0]
        self._imu_available   = False
        try:
            # Probe IMU through shared bus (guarded by _i2c_lock)
            for addr in (0x68, 0x69):
                try:
                    with self._i2c_lock:
                        self.bus.read_byte_data(addr, 0x75)  # WHO_AM_I register
                    self._imu_addr = addr
                    self._imu_available = True
                    break
                except Exception:
                    pass
            if not self._imu_available:
                raise RuntimeError("IMU not found at 0x68 or 0x69")
            print("IMU (MPU-9250) found at 0x{:02X} on bus 12".format(self._imu_addr))
            self._imu_calibrate()
            import threading as _th3
            t = _th3.Thread(target=self._imu_thread, daemon=True)
            t.start()
        except Exception as e:
            print("IMU not available: {}".format(e))
            self._imu_available = False

        # ── Magnetometer (BMM150 on bus 11, address 0x10) ─────────────────────
        # Uses the bmm150.py library (must be in the same directory as server.py)
        # Hard-iron calibration offsets — pre-loaded from calibration.csv
        # Recomputed when user runs the in-app calibration routine
        self._mag_lock    = __import__('threading').Lock()
        self._mag         = None        # bmm150_I2C instance
        self.mag_x        = 0.0        # µT
        self.mag_y        = 0.0
        self.mag_z        = 0.0
        self.mag_heading  = 0.0        # degrees 0-360, 0=North
        self.mag_ok       = False
        # Default offsets from calibration.csv (robot-specific — re-calibrate if needed)
        self._mag_offset  = [5.061, 14.614, 165.885]
        try:
            import sys as _sys, os as _os
            _sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
            from bmm150 import bmm150_I2C as _BMM
            mag = _BMM(11, 0x10)
            _mag_ok = False
            for _attempt in range(3):
                if mag.sensor_init() != mag.ERROR:
                    _mag_ok = True
                    break
                print("BMM150 init attempt {} failed — retrying…".format(_attempt + 1))
                __import__('time').sleep(0.5)
            if not _mag_ok:
                raise Exception("BMM150 sensor_init failed after 3 attempts (check wiring/address)")
            mag.set_operation_mode(mag.POWERMODE_NORMAL)
            mag.set_preset_mode(mag.PRESETMODE_HIGHACCURACY)
            mag.set_rate(mag.RATE_10HZ)
            mag.set_measurement_xyz()
            self._mag = mag
            print("Magnetometer (BMM150) ready on bus 11")
            import threading as _th4
            t = _th4.Thread(target=self._mag_thread, daemon=True)
            t.start()
        except Exception as e:
            print("Magnetometer not available: {}".format(e))

        # LED device proxies (for Webots-style getDevice('led0') calls)
        # We map led0-led3 → binary LEDs, led4-led7 → RGB LEDs
        for i in range(4):
            self.devices['led{}'.format(i)]   = BinaryLED(self, i)
        for i in range(4):
            self.devices['led{}'.format(i+4)] = RgbLED(self, i)

    # ── Main step ─────────────────────────────────────────────────────────────

    def step(self, time_step_ms):
        """
        Pack motor + LED state → send via I2C → read sensors → sleep.
        Returns 0 on success (matches Webots convention).
        """
        actuators = bytearray([0] * ACTUATORS_SIZE)

        # Motor speeds (signed int16 little-endian, two's complement)
        ls = int(self.left_speed_steps)  & 0xFFFF
        rs = int(self.right_speed_steps) & 0xFFFF
        actuators[0] = ls & 0xFF;        actuators[1] = (ls >> 8) & 0xFF
        actuators[2] = rs & 0xFF;        actuators[3] = (rs >> 8) & 0xFF

        # Speaker
        actuators[4] = self.speaker & 0xFF

        # Binary LED bitmask (bits 0-3 = LED1,3,5,7)
        bitmask = 0
        for i in range(4):
            if self.led_binary[i]:
                bitmask |= (1 << i)
        actuators[5] = bitmask

        # RGB LEDs (bytes 6-17, 3 bytes per LED)
        for i in range(4):
            r, g, b = self.led_rgb[i]
            actuators[6  + i*3] = max(0, min(100, int(r)))
            actuators[7  + i*3] = max(0, min(100, int(g)))
            actuators[8  + i*3] = max(0, min(100, int(b)))

        # Settings byte
        actuators[18] = 0

        # Checksum
        checksum = 0
        for i in range(ACTUATORS_SIZE - 1):
            checksum ^= actuators[i]
        actuators[ACTUATORS_SIZE - 1] = checksum

        # I2C transaction — hold _i2c_lock so background threads (IMU, RaB)
        # cannot interleave their own reads/writes mid-transaction.
        with self._i2c_lock:
            try:
                write = i2c_msg.write(ROB_ADDR, actuators)
                read  = i2c_msg.read(ROB_ADDR, SENSORS_SIZE)
                self.bus.i2c_rdwr(write, read)
                sensors_data = list(read)

                # Verify checksum and parse all sensor fields
                calc = 0
                for i in range(SENSORS_SIZE - 1):
                    calc ^= sensors_data[i]
                if calc == sensors_data[SENSORS_SIZE - 1]:
                    # Proximity ps0-ps7 (bytes 0-15, uint16 LE)
                    for i in range(8):
                        self.sensors_raw[i] = sensors_data[i*2] + sensors_data[i*2+1] * 256
                    # Ambient light ps0-ps7 (bytes 16-31, uint16 LE)
                    for i in range(8):
                        self.ambient_raw[i] = sensors_data[16+i*2] + sensors_data[16+i*2+1] * 256
                    # Microphones mic0-3 (bytes 32-39, uint16 LE)
                    for i in range(4):
                        self.mic_raw[i] = sensors_data[32+i*2] + sensors_data[32+i*2+1] * 256
                    # Selector (byte 40, bits 0-3) + Button (byte 40, bit 4)
                    b40 = sensors_data[40]
                    self.selector = b40 & 0x0F
                    self.button   = bool(b40 & 0x10)
                    # Motor steps left/right (bytes 41-44, uint16 LE)
                    self.motor_steps_l = sensors_data[41] + sensors_data[42] * 256
                    self.motor_steps_r = sensors_data[43] + sensors_data[44] * 256
                    # TV remote (byte 45)
                    self.tv_remote = sensors_data[45]

            except Exception as e:
                print("I2C Error: {}".format(e))

            # Read ground sensor (separate I2C device at 0x60, same bus)
            # Still inside _i2c_lock — same bus, must not interleave.
            try:
                data = self.bus.read_i2c_block_data(GROUND_ADDR, GROUND_REG, GROUND_SIZE)
                self.ground_raw[0] = (data[0] << 8) + data[1]   # left
                self.ground_raw[1] = (data[2] << 8) + data[3]   # center
                self.ground_raw[2] = (data[4] << 8) + data[5]   # right
            except Exception:
                pass   # ground sensor board not present

        # ToF is read by _tof_thread in background — no action needed here

        time.sleep(time_step_ms / 1000.0)
        return 0

    # ── ToF background thread ─────────────────────────────────────────────────

    def _tof_thread(self):
        import time as _time
        interval = self._tof_timing / 1000000.0
        while True:
            try:
                d = self._tof.get_distance()
                val = d if (0 < d < 8190) else -1
                with self._tof_lock:
                    self.tof_mm = val
            except Exception as e:
                print("ToF read error: {}".format(e))
                _time.sleep(0.5)
                continue
            _time.sleep(interval)

    # ── IMU background thread (MPU-9250) ──────────────────────────────────────

    def _imu_read_raw(self):
        """Read raw acc + gyro from MPU-9250. Returns (acc_raw[3], gyro_raw[3]) or None.
        Uses the shared bus handle guarded by _i2c_lock to avoid conflicts."""
        import struct as _struct
        try:
            with self._i2c_lock:
                acc_data  = self.bus.read_i2c_block_data(self._imu_addr, 0x3B, 6)
                gyro_data = self.bus.read_i2c_block_data(self._imu_addr, 0x43, 6)
            ax = _struct.unpack(">h", bytes([acc_data[0],  acc_data[1]]))[0]
            ay = _struct.unpack(">h", bytes([acc_data[2],  acc_data[3]]))[0]
            az = _struct.unpack(">h", bytes([acc_data[4],  acc_data[5]]))[0]
            gx = _struct.unpack(">h", bytes([gyro_data[0], gyro_data[1]]))[0]
            gy = _struct.unpack(">h", bytes([gyro_data[2], gyro_data[3]]))[0]
            gz = _struct.unpack(">h", bytes([gyro_data[4], gyro_data[5]]))[0]
            return [ax, ay, az], [gx, gy, gz]
        except Exception:
            # Try alternative address
            self._imu_addr = 0x69 if self._imu_addr == 0x68 else 0x68
            return None, None

    def _imu_calibrate(self, samples=20):
        """Average N samples at rest to compute acc/gyro offsets."""
        import time as _t
        acc_sum  = [0, 0, 0]
        gyro_sum = [0, 0, 0]
        count = 0
        for _ in range(samples):
            acc, gyro = self._imu_read_raw()
            if acc is not None:
                acc_sum[0]  += acc[0];  acc_sum[1]  += acc[1]
                acc_sum[2]  += acc[2] - 16384   # subtract 1g on Z axis
                gyro_sum[0] += gyro[0]; gyro_sum[1] += gyro[1]; gyro_sum[2] += gyro[2]
                count += 1
            _t.sleep(0.05)
        if count > 0:
            self._imu_acc_offset  = [acc_sum[i]  // count for i in range(3)]
            self._imu_gyro_offset = [gyro_sum[i] // count for i in range(3)]
            print("IMU calibrated ({} samples): acc_offset={} gyro_offset={}".format(
                count, self._imu_acc_offset, self._imu_gyro_offset))

    def _imu_thread(self):
        import time as _t
        while True:
            acc, gyro = self._imu_read_raw()
            if acc is not None:
                ax = (acc[0]  - self._imu_acc_offset[0])  / 16384.0   # g  (±2g range)
                ay = (acc[1]  - self._imu_acc_offset[1])  / 16384.0
                az = (acc[2]  - self._imu_acc_offset[2])  / 16384.0
                gx = (gyro[0] - self._imu_gyro_offset[0]) / 131.0     # dps (±250dps range)
                gy = (gyro[1] - self._imu_gyro_offset[1]) / 131.0
                gz = (gyro[2] - self._imu_gyro_offset[2]) / 131.0
                with self._imu_lock:
                    self.imu_acc  = [round(ax,3), round(ay,3), round(az,3)]
                    self.imu_gyro = [round(gx,1), round(gy,1), round(gz,1)]
                    self.imu_ok   = True
            _t.sleep(0.05)   # 20 Hz

    def getImuAccel(self):
        """Returns [x, y, z] accelerometer values in g."""
        with self._imu_lock:
            return list(self.imu_acc)

    def getImuGyro(self):
        """Returns [x, y, z] gyroscope values in degrees/second."""
        with self._imu_lock:
            return list(self.imu_gyro)

    def recalibrateImu(self):
        """Re-run IMU calibration (call when robot is stationary)."""
        self._imu_acc_offset  = [0, 0, 0]
        self._imu_gyro_offset = [0, 0, 0]
        self._imu_calibrate()

    # ── Magnetometer background thread (BMM150) ───────────────────────────────

    def _mag_thread(self):
        import time as _t, math as _m
        while True:
            try:
                geo = self._mag.get_geomagnetic()
                x = geo[0] - self._mag_offset[0]
                y = geo[1] - self._mag_offset[1]
                z = geo[2] - self._mag_offset[2]
                # Heading: atan2(x, y), corrected 90° for robot orientation
                heading = _m.atan2(x, y) - (_m.pi / 2)
                if heading < 0:       heading += 2 * _m.pi
                if heading > 2*_m.pi: heading -= 2 * _m.pi
                heading_deg = round(heading * 180 / _m.pi, 1)
                with self._mag_lock:
                    self.mag_x       = round(float(geo[0]), 2)
                    self.mag_y       = round(float(geo[1]), 2)
                    self.mag_z       = round(float(geo[2]), 2)
                    self.mag_heading = heading_deg
                    self.mag_ok      = True
            except Exception as e:
                pass
            _t.sleep(0.1)   # 10 Hz

    def getMagHeading(self):
        """Returns compass heading in degrees (0=North, 90=East, 180=South, 270=West)."""
        with self._mag_lock:
            return self.mag_heading

    def getMagField(self):
        """Returns [x, y, z] magnetic field in µT."""
        with self._mag_lock:
            return [self.mag_x, self.mag_y, self.mag_z]

    def recalibrateMag(self, samples=100, interval=0.1):
        """
        Hard-iron calibration: spin the robot 360° while this runs (~10s).
        Records min/max on X and Y, sets offsets to midpoint.
        """
        import time as _t
        mx, my = [], []
        print("Magnetometer calibration starting ({} samples)…".format(samples))
        for i in range(samples):
            try:
                geo = self._mag.get_geomagnetic()
                mx.append(float(geo[0]))
                my.append(float(geo[1]))
            except Exception:
                pass
            _t.sleep(interval)
        if mx and my:
            self._mag_offset[0] = (max(mx) + min(mx)) / 2
            self._mag_offset[1] = (max(my) + min(my)) / 2
            print("Magnetometer calibrated: offsets X={:.3f} Y={:.3f}".format(
                self._mag_offset[0], self._mag_offset[1]))
            return {"x": self._mag_offset[0], "y": self._mag_offset[1]}
        return None

    # ── Device access ─────────────────────────────────────────────────────────

    def getDevice(self, name):
        return self.devices.get(name)

    def getBasicTimeStep(self):
        return 32

    # ── Convenience LED API (used by Block Coder generated code) ──────────────

    def setBinaryLed(self, index, state):
        """Set one of the 4 binary LEDs (index 0-3 = LED1,3,5,7). state: 0/1"""
        if 0 <= index <= 3:
            self.led_binary[index] = 1 if state else 0

    def setAllBinaryLeds(self, state):
        """Turn all 4 binary LEDs on or off."""
        for i in range(4):
            self.led_binary[i] = 1 if state else 0

    def setRgbLed(self, index, r, g, b):
        """Set one of the 4 RGB LEDs (index 0-3 = LED2,4,6,8). r,g,b: 0-100"""
        if 0 <= index <= 3:
            self.led_rgb[index] = [r, g, b]

    def setAllRgbLeds(self, r, g, b):
        """Set all 4 RGB LEDs to the same colour."""
        for i in range(4):
            self.led_rgb[i] = [r, g, b]

    def setAllLeds(self, state):
        """Turn all LEDs on (white) or off. Convenience for blocks."""
        self.setAllBinaryLeds(state)
        if state:
            self.setAllRgbLeds(100, 100, 100)
        else:
            self.setAllRgbLeds(0, 0, 0)

    # ── Pi-puck extension LED API (FT903) ─────────────────────────────────────

    # Color constants for convenience
    PI_LED_OFF     = 0x00
    PI_LED_RED     = 0x01
    PI_LED_GREEN   = 0x02
    PI_LED_BLUE    = 0x04
    PI_LED_YELLOW  = 0x03   # red + green
    PI_LED_MAGENTA = 0x05   # red + blue
    PI_LED_CYAN    = 0x06   # green + blue
    PI_LED_WHITE   = 0x07   # red + green + blue

    def setPiLed(self, index, color):
        """
        Set one of the 3 Pi-puck extension LEDs.
        index: 0, 1, or 2
        color: use PI_LED_* constants or raw byte
               0x00=off, 0x01=red, 0x02=green, 0x04=blue,
               0x03=yellow, 0x05=magenta, 0x06=cyan, 0x07=white
        Opens and closes the I2C bus per write to avoid holding
        bus 11 open (which would block the battery ADC kernel driver).
        """
        if not (0 <= index <= 2):
            return
        self.pi_leds[index] = int(color) & 0x07
        if self._ft903_ch is None:
            return
        try:
            with self._ft903_lock:
                _b = SMBus(self._ft903_ch)
                _b.write_byte_data(self._ft903_addr, index, self.pi_leds[index])
                _b.close()
        except Exception as e:
            print("Pi LED I2C error: {}".format(e))

    def setAllPiLeds(self, color):
        """Set all 3 Pi-puck extension LEDs to the same color."""
        for i in range(3):
            self.setPiLed(i, color)

    # ── Speaker API ───────────────────────────────────────────────────────────

    def setSpeaker(self, sound_index):
        """
        Play one of the e-puck2 built-in sounds.
        sound_index: 0 = off/stop
                     1 = short beep
                     2 = double beep
                     3 = three beeps (startup)
                     4 = alarm / long beep
                     5 = demo melody
        The sound plays until the next step() call with index 0.
        """
        self.speaker = max(0, min(5, int(sound_index)))

    def stopSpeaker(self):
        """Stop any playing sound."""
        self.speaker = 0

    # ── Motor API ─────────────────────────────────────────────────────────────

    def setMotors(self, left_pct, right_pct):
        """
        Set both wheel speeds from percentage values.
        left_pct, right_pct: -100 to +100
          +100 = full forward, -100 = full backward, 0 = stop
        """
        self.left_speed_steps  = (left_pct  / 100.0) * HARDWARE_MAX_SPEED
        self.right_speed_steps = (right_pct / 100.0) * HARDWARE_MAX_SPEED

    def stopMotors(self):
        """Stop both wheels immediately — zeroes state AND sends a zero-speed I2C packet."""
        self.left_speed_steps  = 0
        self.right_speed_steps = 0
        # Force an immediate I2C write so the robot stops without waiting for the
        # next sensor polling step(). This is critical when called from the stop handler.
        try:
            actuators = bytearray([0] * ACTUATORS_SIZE)
            checksum = 0
            for i in range(ACTUATORS_SIZE - 1):
                checksum ^= actuators[i]
            actuators[ACTUATORS_SIZE - 1] = checksum
            write = i2c_msg.write(ROB_ADDR, actuators)
            with self._i2c_lock:
                self.bus.i2c_rdwr(write)
        except Exception as e:
            print("stopMotors I2C error: {}".format(e))


    # ── Range and Bearing API ────────────────────────────────────────────────

    def setRabMode(self, mode):
        """
        Set RaB mode: 'rx' to receive, 'tx' to transmit, None/'' to disable.
        Initialises the board on first call and (re)starts the background thread.
        """
        import threading as _th
        mode = mode.lower() if mode else None
        with self._rab_lock:
            if mode == self._rab_mode:
                return
            self._rab_mode = mode

        # Board init — exactly matches randb_tx.py / randb_rx.py state==0 block:
        #   write_reg(12, [150])  → set range
        #   write_reg(17, [0])    → onboard calculation
        if mode in ('rx', 'tx'):
            try:
                with self._i2c_lock:
                    self.bus.write_i2c_block_data(0x20, 12, [150])
                    self.bus.write_i2c_block_data(0x20, 17, [0])
                import time as _t; _t.sleep(0.1)
                print("RaB board initialised in {} mode".format(mode))
            except Exception as e:
                print("RaB init error: {}".format(e))

        # Start background thread only once — it reads _rab_mode dynamically
        if mode in ('rx', 'tx') and not self._rab_thread_running:
            self._rab_thread_running = True
            t = _th.Thread(target=self._rab_rx_thread, daemon=True)
            t.start()

    def _rab_rx_thread(self):
        """Background thread: poll/drive RaB board at 20 Hz.

        All I2C access goes through self.bus guarded by self._i2c_lock so this
        thread never races with step() or _imu_thread.  This mirrors the simple
        loop in randb_rx.py / randb_tx.py exactly — one bus handle, no
        concurrent access.
        """
        import time as _time
        while True:
            with self._rab_lock:
                mode = self._rab_mode

            if mode is None:
                _time.sleep(0.1)
                continue

            if mode == 'rx':
                try:
                    # Check ready flag (reg 0) — matches randb_rx.py
                    with self._i2c_lock:
                        ready = self.bus.read_i2c_block_data(0x20, 0, 1)
                    if ready[0] != 0:
                        # Read data (regs 1-2), bearing (3-4), range (5-6), sensor (9)
                        with self._i2c_lock:
                            r1 = self.bus.read_i2c_block_data(0x20, 1, 1)[0]
                            r2 = self.bus.read_i2c_block_data(0x20, 2, 1)[0]
                            r3 = self.bus.read_i2c_block_data(0x20, 3, 1)[0]
                            r4 = self.bus.read_i2c_block_data(0x20, 4, 1)[0]
                            r5 = self.bus.read_i2c_block_data(0x20, 5, 1)[0]
                            r6 = self.bus.read_i2c_block_data(0x20, 6, 1)[0]
                            r9 = self.bus.read_i2c_block_data(0x20, 9, 1)[0]
                        rab_data    = (r1 << 8) + r2
                        rab_bearing = ((r3 << 8) + r4) * 0.0001
                        rab_range   = (r5 << 8) + r6
                        rab_sensor  = r9
                        if rab_data > 0 or rab_range > 0:
                            with self._rab_lock:
                                self._rab_data    = rab_data
                                self._rab_bearing = rab_bearing
                                self._rab_range   = rab_range
                                self._rab_sensor  = rab_sensor
                                self._rab_last_rx = _time.time()
                except Exception:
                    pass

            elif mode == 'tx':
                try:
                    with self._rab_lock:
                        hi = self._rab_tx_hi
                        lo = self._rab_tx_lo
                    # Matches randb_tx.py state==1 block exactly:
                    #   write_reg(13, [0xAA])
                    #   write_reg(14, [0xFF])
                    with self._i2c_lock:
                        self.bus.write_i2c_block_data(0x20, 13, [hi])
                        self.bus.write_i2c_block_data(0x20, 14, [lo])
                except Exception:
                    pass

            _time.sleep(0.05)   # 20 Hz

    def setRabRange(self, value):
        """
        Set the RaB transmission range.
        value: 0 = full range (~1m), 255 = no range (0cm).
        Per the manual: lower value = longer range.
        """
        try:
            with self._i2c_lock:
                self.bus.write_i2c_block_data(0x20, 12, [value & 0xFF])
            print("RaB range register set to {}".format(value))
        except Exception as e:
            print("RaB set range error: {}".format(e))

    def setRabData(self, hi, lo):
        """Set the two bytes to transmit (TX mode). hi, lo: 0-255."""
        with self._rab_lock:
            self._rab_tx_hi = hi & 0xFF
            self._rab_tx_lo = lo & 0xFF

    def getRabData(self):
        """Return last received data word (RX mode)."""
        with self._rab_lock:
            return self._rab_data

    def getRabBearing(self):
        """Return bearing in degrees (RX mode). 0-360."""
        import math as _math
        with self._rab_lock:
            return round(self._rab_bearing * 180.0 / _math.pi, 1)

    def getRabRange(self):
        """Return range in mm (RX mode)."""
        with self._rab_lock:
            return self._rab_range

    def getRabSensor(self):
        """Return sensor ID of the last received message (RX mode)."""
        with self._rab_lock:
            return self._rab_sensor

    def getRabReading(self):
        """Return full RaB reading as dict: data, bearing_deg, range_mm, sensor.
        Returns all zeros if no packet has been received within 1.5 seconds."""
        import math as _math, time as _time
        with self._rab_lock:
            stale = (self._rab_mode == 'rx') and ((_time.time() - self._rab_last_rx) > 1.5)
            if stale:
                # Clear cached values so next genuine packet starts fresh
                self._rab_data    = 0
                self._rab_bearing = 0.0
                self._rab_range   = 0
                self._rab_sensor  = 0
                return {'data': 0, 'bearing_deg': 0.0, 'range_mm': 0, 'sensor': 0}
            return {
                'data':        self._rab_data,
                'bearing_deg': round(self._rab_bearing * 180.0 / _math.pi, 1),
                'range_mm':    self._rab_range,
                'sensor':      self._rab_sensor,
            }

    # ── Robot Info getters ────────────────────────────────────────────────────

    def getSelector(self):
        """Return the selector dial value (0-15)."""
        return self.selector

    def getTvRemote(self):
        """
        Return the last IR remote control code received (0 = no signal).
        The code is updated every step() call.
        Point any NEC-protocol IR remote at the robot's front and press
        a button — the returned byte identifies which button was pressed.
        Typical use:
            code = robot.getTvRemote()
            if code != 0:
                print('Remote button:', code)
        """
        return self.tv_remote

    def isButtonPressed(self):
        """Return True if the front button is currently pressed."""
        return self.button

    def getMicrophone(self, index):
        """Return microphone intensity for mic index 0-3."""
        return self.mic_raw[max(0, min(3, index))]

    def getAmbientLight(self, index):
        """Return ambient light reading for sensor index 0-7."""
        return self.ambient_raw[max(0, min(7, index))]

    def getMotorSteps(self, side):
        """Return cumulative motor step count. side: 'left' or 'right'."""
        return self.motor_steps_l if side == 'left' else self.motor_steps_r

    def getMotorSpeed(self, side):
        """Return current motor speed in steps/s. side: 'left' or 'right'."""
        return self.left_speed_steps if side == 'left' else self.right_speed_steps

    def isMoving(self):
        """Return True if either motor is running."""
        return (self.left_speed_steps != 0 or self.right_speed_steps != 0)

    def getRobotId(self):
        """Return robot hostname (useful for multi-robot identification)."""
        import socket
        try:
            return socket.gethostname()
        except Exception:
            return 'unknown'

    # ── Battery API ───────────────────────────────────────────────────────────

    def getBattery(self):
        """
        Read both battery voltages from the ADS1015 ADC via sysfs.
        Returns a dict:
          {
            'epuck': {'voltage': 3.85, 'percent': 67.2},   # e-puck2 main battery
            'ext':   {'voltage': 3.91, 'percent': 75.0},   # Pi-puck extension battery
          }
        Returns None for a battery if the ADC path is not available.
        Voltage range: 3.3V (0%) to 4.138V (100%).
        """
        import os as _os
        BAT_MIN, BAT_MAX = 3.3, 4.138
        BAT_RANGE = BAT_MAX - BAT_MIN

        def _read(raw_path, scale_path):
            try:
                if not _os.path.exists(raw_path):
                    return None
                with open(scale_path) as f:
                    scale = float(f.read())
                with open(raw_path) as f:
                    raw = float(f.read())
                voltage = round((raw * scale) / 500.0, 2)
                pct = round((voltage - BAT_MIN) / BAT_RANGE * 100.0, 1)
                pct = max(0.0, min(100.0, pct))
                return {'voltage': voltage, 'percent': pct}
            except Exception:
                return None

        return {
            'epuck': _read(self._bat_paths['epuck_raw'], self._bat_paths['epuck_scale']),
            'ext':   _read(self._bat_paths['ext_raw'],   self._bat_paths['ext_scale']),
        }

    # ── Camera API ────────────────────────────────────────────────────────────

    def openCamera(self, device=1):
        """
        Open the camera and start capturing frames in the background.
        device: 0 = Pi-Puck top camera (/dev/video0)
                1 = e-puck2 front camera (/dev/video1)  ← default
        Call closeCamera() when done.
        """
        with self._cam_lock:
            if self._cam_running:
                return
            self._cam_running = True
            self._cam_frame   = None
        import threading as _th
        t = _th.Thread(target=self._cam_thread_func, args=(device,), daemon=True)
        t.start()
        self._cam_thread = t
        print("Camera opened on /dev/video{}".format(device))

    def closeCamera(self):
        """Stop camera capture and release the device."""
        with self._cam_lock:
            self._cam_running = False
            self._cam_frame   = None
        print("Camera closed.")

    def isCameraOpen(self):
        """Return True if camera capture is running."""
        return self._cam_running

    def getCameraFrame(self):
        """
        Return the latest camera frame as JPEG bytes, or None if not available.
        Use this to save to disk or encode to base64.
        Example:
            robot.openCamera(1)
            robot.step(500)   # wait for first frame
            jpg = robot.getCameraFrame()
            if jpg:
                open('frame.jpg', 'wb').write(jpg)
        """
        with self._cam_lock:
            return self._cam_frame

    def getCameraImage(self):
        """
        Return the latest frame as a numpy array (BGR, HxWx3), or None.
        Requires OpenCV (cv2). Use for image processing in student code.
        Example:
            img = robot.getCameraImage()
            if img is not None:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                brightness = gray.mean()
        """
        with self._cam_lock:
            frame = self._cam_frame
        if frame is None:
            return None
        try:
            import cv2 as _cv2
            import numpy as _np
            buf = _np.frombuffer(frame, dtype=_np.uint8)
            return _cv2.imdecode(buf, _cv2.IMREAD_COLOR)
        except Exception:
            return None

    def _cam_thread_func(self, device):
        """Background thread: capture frames from camera at ~15fps."""
        dev_path = '/dev/video{}'.format(device)
        try:
            import cv2 as _cv2
            cap = _cv2.VideoCapture(dev_path, _cv2.CAP_V4L2)
            cap.set(_cv2.CAP_PROP_FRAME_WIDTH,  320)
            cap.set(_cv2.CAP_PROP_FRAME_HEIGHT, 240)
            cap.set(_cv2.CAP_PROP_FPS, 15)
            cap.set(_cv2.CAP_PROP_FOURCC, _cv2.VideoWriter_fourcc(*'MJPG'))
            while True:
                with self._cam_lock:
                    if not self._cam_running:
                        break
                ok, frame = cap.read()
                if ok:
                    if len(frame.shape) == 2:
                        frame = _cv2.cvtColor(frame, _cv2.COLOR_GRAY2BGR)
                    elif frame.shape[2] == 4:
                        frame = frame[:, :, :3]
                    _, buf = _cv2.imencode('.jpg', frame, [_cv2.IMWRITE_JPEG_QUALITY, 70])
                    with self._cam_lock:
                        self._cam_frame = buf.tobytes()
            cap.release()
        except ImportError:
            # cv2 not available — use fswebcam at ~5fps
            import subprocess, os as _os, tempfile, time as _t
            while True:
                with self._cam_lock:
                    if not self._cam_running:
                        break
                tmp = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
                tmp_path = tmp.name
                tmp.close()
                try:
                    r = subprocess.call(
                        ['fswebcam', '-d', dev_path, '-r', '320x240',
                         '--no-banner', '--jpeg', '70', '-q', tmp_path],
                        timeout=3)
                    if r == 0 and _os.path.exists(tmp_path):
                        with open(tmp_path, 'rb') as f:
                            data = f.read()
                        if data:
                            with self._cam_lock:
                                self._cam_frame = data
                except Exception:
                    pass
                finally:
                    try: _os.unlink(tmp_path)
                    except Exception: pass
                _t.sleep(0.2)
        except Exception as e:
            print("Camera error: {}".format(e))


# ── Motor ─────────────────────────────────────────────────────────────────────

class Motor:
    def __init__(self, robot, side):
        self.robot = robot
        self.side  = side

    def setPosition(self, pos):
        pass  # ignored in velocity mode

    def setVelocity(self, rad_per_sec):
        steps = rad_per_sec * SPEED_CONVERSION
        steps = max(-HARDWARE_MAX_SPEED, min(HARDWARE_MAX_SPEED, steps))
        if self.side == 'left':
            self.robot.left_speed_steps = steps
        else:
            self.robot.right_speed_steps = steps


# ── Distance sensor ───────────────────────────────────────────────────────────

class DistanceSensor:
    def __init__(self, robot, index):
        self.robot = robot
        self.index = index

    def enable(self, time_step):
        pass  # always on

    def getValue(self):
        return self.robot.sensors_raw[self.index]


# ── LED device proxies ────────────────────────────────────────────────────────

class BinaryLED:
    """Proxy for LED1/3/5/7 — on/off only."""

    def __init__(self, robot, index):
        self.robot = robot
        self.index = index   # 0=LED1, 1=LED3, 2=LED5, 3=LED7

    def set(self, value):
        self.robot.setBinaryLed(self.index, value)

    def get(self):
        return self.robot.led_binary[self.index]


class RgbLED:
    """Proxy for LED2/4/6/8 — full RGB."""

    def __init__(self, robot, index):
        self.robot = robot
        self.index = index   # 0=LED2, 1=LED4, 2=LED6, 3=LED8

    def set(self, value):
        """value: 0=off, 1=white, or pass (r,g,b) tuple."""
        if value == 0:
            self.robot.setRgbLed(self.index, 0, 0, 0)
        elif isinstance(value, (list, tuple)) and len(value) == 3:
            self.robot.setRgbLed(self.index, value[0], value[1], value[2])
        else:
            self.robot.setRgbLed(self.index, 100, 100, 100)

    def setRGB(self, r, g, b):
        self.robot.setRgbLed(self.index, r, g, b)

    def get(self):
        return self.robot.led_rgb[self.index]


# ── Ground sensor ─────────────────────────────────────────────────────────────

class GroundSensor:
    """
    Proxy for the Pi-Puck ground sensor board (3 sensors: left, center, right).
    Values are uint16 reflectance readings — higher = more reflective (lighter surface).
    Typical range: ~0 (black) to ~1000+ (white).
    """

    def __init__(self, robot):
        self.robot = robot

    def enable(self, time_step):
        pass   # always active

    def getLeft(self):
        return self.robot.ground_raw[0]

    def getCenter(self):
        return self.robot.ground_raw[1]

    def getRight(self):
        return self.robot.ground_raw[2]

    def getValues(self):
        """Return all three readings as [left, center, right]."""
        return list(self.robot.ground_raw)


# ── ToF sensor proxy ──────────────────────────────────────────────────────────

class ToFSensor:
    """
    Proxy for the VL53L1X Time-of-Flight distance sensor.
    Returns distance in millimetres. -1 means no reading available.
    Typical range: 40mm to 1300mm (short mode) or 4000mm (long mode).
    """

    def __init__(self, robot):
        self.robot = robot

    def enable(self, time_step):
        pass   # always active

    def getDistance(self):
        """Return distance in mm, or -1 if not available."""
        return self.robot.tof_mm

    def getDistanceCm(self):
        """Return distance in cm, or -1 if not available."""
        d = self.robot.tof_mm
        return round(d / 10.0, 1) if d >= 0 else -1
