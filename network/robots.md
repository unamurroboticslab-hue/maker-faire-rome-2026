# Robots and network

## WiFi

| | |
|---|---|
| Network name | `RoboticsLab` |
| Password | `EpuckRobot` |
| Internet | None — the router only connects the robots and the phones |

The robot IP addresses are reserved in the router. **Do not factory-reset the router**: the addresses would change and the QR codes would stop working.

## Robots

| Robot | IP address | Remote control URL |
|---|---|---|
| #1 | 192.168.0.111 | http://192.168.0.111:5000/mobile.html |
| #2 | 192.168.0.113 | http://192.168.0.113:5000/mobile.html |
| #3 | 192.168.0.114 | http://192.168.0.114:5000/mobile.html |
| #4 | 192.168.0.115 | http://192.168.0.115:5000/mobile.html |
| #5 | 192.168.0.121 | http://192.168.0.121:5000/mobile.html |
| #6 | 192.168.0.118 | http://192.168.0.118:5000/mobile.html |
| #12 | 192.168.0.112 | http://192.168.0.112:5000/mobile.html |
| #16 | 192.168.0.116 | http://192.168.0.116:5000/mobile.html |
| #24 | 192.168.0.124 | http://192.168.0.124:5000/mobile.html |
| #25 | 192.168.0.125 | http://192.168.0.125:5000/mobile.html |

QR codes for robots 1–6 are in `docs/robot-labels.html` and the operator manual; robots 12, 16, 24 and 25 are in `docs/QR_NewRobots.pdf`.

SSH on every robot: user `pi`, password `11110000`.

## Block Coder

Each robot also serves the Block Coder visual programming page at `http://<IP>:5000/` (replace `<IP>` with the robot's address).
