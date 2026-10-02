# Maker Faire Rome 2026 — UNamur Robotics Lab

Hands-on swarm robotics demo from the **University of Namur** (Namur, Belgium).
Visitors drive real **e-puck2** robots from their own phones: join the robot WiFi, scan a robot's QR code, and play.

This repository holds everything needed to run the stand: the robot software, the printed material, and the operator instructions.

---

## What's in the kit

| Item | Notes |
|---|---|
| WiFi router | Pre-configured. Network **RoboticsLab**. Has no internet — that's expected. |
| 6 × e-puck2 robots | Software already installed in `/home/pi/blocky` on each robot. |
| Operator laptop | Used to start the server on each robot over SSH. |

## Quick start (operator)

1. **Power on the router** and wait ~30 s. Connect your laptop to the **RoboticsLab** WiFi.
2. **Turn on a robot** and wait 30–40 s for it to boot and join the network.
3. **Connect to it** from a terminal: `ssh pi@<robot IP>` (IPs in [`network/robots.md`](network/robots.md); the password is in the printed operator manual).
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
│   ├── poster-A0.pdf      ← stand poster (print at A0)
│   └── robot-labels.html  ← printable QR labels for each robot and the router
└── robot/
    └── blocky/            ← software running on each robot (copy of /home/pi/blocky)
```

## Robot pages

Each robot serves these pages on port 5000 (`http://<robot IP>:5000/...`):

| Page | File |
|---|---|
| Remote control (phone) | `mobile.html` |
| Block Coder (visual programming) | `index.html` |

## Restoring the software on a robot

If a robot's files get lost or damaged, copy the folder back from a laptop on the same WiFi:

```bash
scp -r robot/blocky pi@<robot IP>:/home/pi/
```

> **Optional AI feature:** `server.py` includes a feature that calls the Anthropic API. It only works if the environment variable `ANTHROPIC_API_KEY` is set on the robot. Without it, everything else works normally.

---

**UNamur Robotics Lab** · University of Namur · Namur, Belgium
