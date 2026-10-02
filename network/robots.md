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

SSH user on every robot: `pi` (the password is in the printed operator manual, not in this public repository).

## Block Coder

Each robot also serves the Block Coder visual programming page at `http://<IP>:5000/` (replace `<IP>` with the robot's address).
