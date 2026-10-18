# Troubleshooting

Robot addresses are in [`network/robots.md`](network/robots.md). All of them start with `192.168.0.`

## Problems and fixes

| Problem | What to do |
|---|---|
| SSH: *connection refused* or *no route to host* | The robot is still booting. Wait 30 s and try again. Check the laptop is on **RoboticsLab**. |
| SSH: *permission denied* | Retype the password `11110000` slowly. Nothing shows while you type. |
| SSH: *remote host identification has changed* | Run `ssh-keygen -R <robot IP>`, then connect again. |
| *Address already in use* when starting the server | An old server is still running. Run `pkill -f server.py`, then start it again. |
| Server stopped with an error | Run `python3 server.py` again in the same window. |
| Phone: page doesn't open | The phone must be on **RoboticsLab**. Turn off mobile data. On "no internet", choose **Stay connected**. |
| Page opens but the robot doesn't move | Check that robot's terminal window is still running the server. Then check its battery. |
| Robot never joins the network | Switch it off and on, wait 40 s. Make sure the router from the kit is the one switched on. |
| Robot files damaged or missing | Copy them back from this repo: `scp -r robot/blocky pi@<robot IP>:/home/pi/` |

## During the fair

- One visitor per robot works best. Several phones on the same robot will fight over it.
- Check batteries every hour or so. A robot that slows down or stops answering usually needs charging.
- Keep every robot's terminal window open on the laptop all day, and stop the laptop from sleeping.
- **Never factory-reset the router.** The robot addresses are reserved in it; a reset breaks every QR code.

## End of the day

Switch each robot off with its two blue buttons, in this order:

1. Press the **blue button on the robot** (the e-puck2) to switch it off.
2. Press and **hold the blue button on top of the Pi-puck for 6–7 seconds**, until it switches off.

You don't need to type anything in the terminal. Switch the router off last, and put the robots on charge.

## Quick reference

```
Start a robot:  ssh pi@192.168.0.1xx   (password 11110000)
                cd /home/pi/blocky
                python3 server.py
Stop a robot:   blue button on the robot, then hold the Pi-puck's top button 6–7 s
WiFi:           RoboticsLab · EpuckRobot
```
