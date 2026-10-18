# Maker Faire Rome 2026 — UNamur Robotics Lab

Hands-on swarm robotics demo from the **University of Namur** (Namur, Belgium).
Visitors drive real **e-puck2** robots from their own phones: join the robot WiFi, scan a robot's QR code, and play.

This repository holds everything needed to run the stand: the robot software, the printed material, and the operator instructions.

---

## What's in the kit

| Item | Notes |
|---|---|
| WiFi router | Pre-configured. Network **RoboticsLab**. Has no internet — that's expected. |
| 10 × e-puck2 robots | Robots 1–6, 12, 16, 24 and 25. Software already installed in `/home/pi/blocky` on each robot. |
| Operator laptop | Used to start the server on each robot over SSH. |

## Quick start (operator)

1. **Power on the router** and wait ~30 s. Connect your laptop to the **RoboticsLab** WiFi.
2. **Turn on a robot** and wait 30–40 s for it to boot and join the network.
3. **Connect to it** from a terminal: `ssh pi@<robot IP>` (IPs in [`network/robots.md`](network/robots.md); password `11110000`, the same on every robot).
4. **Start the server:**
   ```bash
   cd /home/pi/blocky
   python3 server.py
   ```
   Leave this terminal open.
5. **Repeat** steps 2–4 for each robot, each in its own terminal window.
6. Visitors scan the poster or the robot's label and play.

Problems? See [`troubleshooting.md`](troubleshooting.md).

## For visitors

1. Join the WiFi **RoboticsLab** (scan the WiFi QR code on the poster).
2. Scan the QR code of the robot you want to drive.
3. If your phone says the network has no internet, choose **Stay connected**, and turn off mobile data if the page doesn't open.

## Repository layout

```
├── README.md              ← you are here
├── troubleshooting.md     ← common problems and fixes
├── network/
│   └── robots.md          ← robot numbers, IP addresses, URLs
├── docs/
│   ├── operator-manual.pdf ← operator manual (setup, fair day, shutdown, troubleshooting, QR codes)
│   ├── poster-A0.pdf      ← stand poster (print at A0)
│   ├── robot-labels.html  ← printable QR labels for robots 1–6 and the router
│   └── QR_NewRobots.pdf   ← printable QR codes for robots 12, 16, 24 and 25
└── robot/
    └── blocky/            ← software running on each robot (copy of /home/pi/blocky)
```

## Robot pages

Each robot serves these pages on port 5000 (`http://<robot IP>:5000/...`):

| Page | File |
|---|---|
| Remote control for visitors (phone) | `mobile.html` |
| Block Coder (visual programming) | `index.html` |

`mobile.html` is a simple version made for children: robot face, proximity radar, arrows, speed slider (20–70%) and STOP. A Connect / Disconnect button in the header connects to the robot whose QR code was scanned; the arrows only work while connected. The page stops the robot when a finger leaves an arrow or the phone is locked. The original page, with demo programs, LEDs and all sensors, is kept in the repo as `robot/blocky/mobile-full.html` (it isn't served by the robots).

### One driver at a time, and the operator page

Only one phone can drive a robot at a time. The first phone that taps **Connetti / Connect** drives; any other phone sees "Robot busy — wait for your turn" and its arrows stay off. When the driving phone disconnects or closes the page, the next waiting phone gets the robot automatically.

The operator controls the turns from the laptop at **`http://<any robot IP>:5000/operator.html`** (e.g. `http://192.168.0.111:5000/operator.html`). It shows all robots, which phone is driving and for how long, and which phones are waiting:

| Button | What it does |
|---|---|
| **End turn** | Stops the robot and frees it for the next child. That phone must wait 1–10 min (chosen at the top) before it can drive again. |
| **Block** | Keeps a phone out until you press **Unblock**. |
| **Free robot** | Clears the driver and every block on that robot. |

The page asks for the **operator key**: `11110000` by default (same as the SSH password). To use another key, start the server with `OPERATOR_KEY=yourkey python3 server.py`.

Phones are recognised by their address on the RoboticsLab WiFi, so reloading the page doesn't get around a block.

### Updating the robots

`mobile.html`, `operator.html` and `server.py` must be copied to every robot. From the repo folder, on a laptop connected to **RoboticsLab**:

```bash
for ip in 111 113 114 115 121 118 112 116 124 125; do
  scp -o ConnectTimeout=5 robot/blocky/mobile.html robot/blocky/operator.html robot/blocky/server.py pi@192.168.0.$ip:/home/pi/blocky/
done
```

Then restart the server on each robot (Ctrl + C in its window, then `python3 server.py`). The new `mobile.html` also works on a robot that still runs the old `server.py`, just without turn control.

## Restoring the software on a robot

If a robot's files get lost or damaged, copy the folder back from a laptop on the same WiFi:

```bash
scp -r robot/blocky pi@<robot IP>:/home/pi/
```

> **Optional AI feature:** `server.py` includes a feature that calls the Anthropic API. It only works if the environment variable `ANTHROPIC_API_KEY` is set on the robot. Without it, everything else works normally.

---

**UNamur Robotics Lab** · University of Namur · Namur, Belgium
