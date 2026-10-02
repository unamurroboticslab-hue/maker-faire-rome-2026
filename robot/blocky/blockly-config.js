// ─── DEFINE CUSTOM BLOCKS ───────────────────────────────────────────────────

const blockDefs = [
  // MOVE
  { type: "epuck_move_forward", message0: "move forward ⏱ %1 sec", args0: [{type:"field_number",name:"DURATION",value:1,min:0.1,max:30}], colour:210, tooltip:"Move e-puck forward", nextStatement:null, previousStatement:null },
  { type: "epuck_move_backward", message0: "move backward ⏱ %1 sec", args0: [{type:"field_number",name:"DURATION",value:1,min:0.1,max:30}], colour:210, tooltip:"Move e-puck backward", nextStatement:null, previousStatement:null },
  { type: "epuck_turn_left", message0: "turn left 🔄 %1 °", args0: [{type:"field_angle",name:"ANGLE",angle:90}], colour:210, tooltip:"Turn left by degrees", nextStatement:null, previousStatement:null },
  { type: "epuck_turn_right", message0: "turn right 🔃 %1 °", args0: [{type:"field_angle",name:"ANGLE",angle:90}], colour:210, tooltip:"Turn right by degrees", nextStatement:null, previousStatement:null },
  { type: "epuck_stop", message0: "⛔ stop motors", colour:210, nextStatement:null, previousStatement:null },
  { type: "epuck_set_speed", message0: "set speed to %1 %", args0: [{type:"field_slider",name:"SPEED",value:50,min:0,max:100}], colour:210, nextStatement:null, previousStatement:null },
  { type: "epuck_set_motors_lr_val",
    message0: "🚗 set motors  left %1 %  right %2 %",
    args0: [
      { type:"input_value", name:"LEFT",  check:"Number" },
      { type:"input_value", name:"RIGHT", check:"Number" },
    ],
    inputsInline: true,
    colour:210, nextStatement:null, previousStatement:null,
    tooltip:"Set motor speeds using variables or expressions (-100 to 100%). Plug in a number block or variable." },
  { type: "epuck_set_motors_lr",
    message0: "🚗 set motors  left %1 %  right %2 %",
    args0: [
      { type:"field_number", name:"LEFT",  value:50, min:-100, max:100 },
      { type:"field_number", name:"RIGHT", value:50, min:-100, max:100 },
    ],
    colour:210, nextStatement:null, previousStatement:null,
    tooltip:"Set left and right wheel speeds independently (-100 to 100%). Negative = reverse. Use different values to curve or spin." },
  { type: "epuck_update_sensors",
    message0: "🔄 update sensors",
    colour:210, nextStatement:null, previousStatement:null,
    tooltip:"Read a fresh sensor snapshot from the robot. Call once at the top of each loop before reading PS values." },
  // LEDs
  { type: "epuck_led_on", message0: "turn on LED %1 🎨 %2", args0: [{type:"field_number",name:"LED_NUM",value:0,min:0,max:7},{type:"field_colour",name:"COLOR",colour:"#00e5ff"}], colour:30, nextStatement:null, previousStatement:null },
  { type: "epuck_led_off", message0: "turn off LED %1", args0: [{type:"field_number",name:"LED_NUM",value:0,min:0,max:7}], colour:30, nextStatement:null, previousStatement:null },
  { type: "epuck_led_all_on", message0: "all LEDs ON 🎨 %1", args0: [{type:"field_colour",name:"COLOR",colour:"#ff6b35"}], colour:30, nextStatement:null, previousStatement:null },
  { type: "epuck_led_all_off", message0: "all LEDs OFF", colour:30, nextStatement:null, previousStatement:null },
  { type: "epuck_led_blink", message0: "blink LEDs %1 times 🎨 %2", args0: [{type:"field_number",name:"TIMES",value:3,min:1,max:20},{type:"field_colour",name:"COLOR",colour:"#7cfc00"}], colour:30, nextStatement:null, previousStatement:null },
  // Sensors — proximity
  { type: "epuck_wait_obstacle", message0: "⏳ wait until obstacle detected", colour:270, nextStatement:null, previousStatement:null },
  { type: "epuck_if_obstacle", message0: "🚧 if obstacle ahead", message1: "do %1", args1: [{type:"input_statement",name:"DO"}], colour:270, nextStatement:null, previousStatement:null },
  { type: "epuck_avoid_obstacle", message0: "🤖 auto avoid obstacle", colour:270, nextStatement:null, previousStatement:null },
  { type: "epuck_log_sensors",   message0: "📋 log all proximity values", colour:270,
    tooltip:"Prints all 8 IR sensor raw values to the log. Use this to find real min/max values for tuning.",
    nextStatement:null, previousStatement:null },
  { type: "epuck_braitenberg",
    message0: "🧠 Braitenberg avoid  sensitivity %1",
    args0: [{ type:"field_number", name:"SENS", value:2, min:0.1, max:10 }],
    colour:270,
    tooltip:"Smooth reactive avoidance. Each front sensor directly slows the opposite motor. Tune sensitivity after checking log values with 'log all proximity values'.",
    nextStatement:null, previousStatement:null },
  { type: "epuck_read_proximity",
    message0: "📡 read proximity sensor %1",
    args0: [{ type:"field_dropdown", name:"INDEX",
              options:[["PS0 (front-right)","0"],["PS1 (front-right 2)","1"],["PS2 (right)","2"],["PS3 (back-right)","3"],
                       ["PS4 (back-left)","4"],["PS5 (left)","5"],["PS6 (front-left 2)","6"],["PS7 (front-left)","7"]] }],
    colour:270, output:"Number", tooltip:"Returns raw proximity value (0=nothing, ~4000=very close)" },
  { type: "epuck_if_proximity",
    message0: "📡 if PS%1 > %2", message1: "do %1",
    args0: [{ type:"field_dropdown", name:"INDEX",
              options:[["0","0"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"]] },
            { type:"field_number", name:"THRESHOLD", value:100, min:0, max:4000 }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour:270, nextStatement:null, previousStatement:null,
    tooltip:"Runs inner blocks if proximity sensor exceeds threshold" },
  // Sensors — ToF
  { type: "epuck_read_tof",
    message0: "📏 ToF distance (mm)",
    colour:270, output:"Number",
    tooltip:"Returns distance in mm from VL53L0X sensor. Returns -1 if nothing in range." },
  { type: "epuck_if_tof_closer",
    message0: "📏 if distance < %1 mm", message1: "do %1",
    args0: [{ type:"field_number", name:"DIST_MM", value:200, min:1, max:2000 }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour:270, nextStatement:null, previousStatement:null,
    tooltip:"Runs inner blocks if ToF sensor detects object closer than threshold" },
  { type: "epuck_wait_tof_closer",
    message0: "⏳ wait until distance < %1 mm",
    args0: [{ type:"field_number", name:"DIST_MM", value:200, min:1, max:2000 }],
    colour:270, nextStatement:null, previousStatement:null,
    tooltip:"Waits until something is closer than the given distance" },
  // Sensors — Ground
  { type: "epuck_read_ground",
    message0: "🔲 read ground sensor %1",
    args0: [{ type:"field_dropdown", name:"SIDE", options:[["Left","left"],["Center","center"],["Right","right"]] }],
    colour:270, output:"Number",
    tooltip:"Returns ground sensor value (higher = lighter surface)" },
  { type: "epuck_if_ground_dark",
    message0: "🔲 if ground %1 is dark (< %2)", message1: "do %1",
    args0: [{ type:"field_dropdown", name:"SIDE", options:[["Left","left"],["Center","center"],["Right","right"]] },
            { type:"field_number", name:"THRESHOLD", value:300, min:0, max:1023 }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour:270, nextStatement:null, previousStatement:null,
    tooltip:"Runs inner blocks if the ground sensor is below threshold (dark surface)" },
  { type: "epuck_if_ground_light",
    message0: "🔲 if ground %1 is light (> %2)", message1: "do %1",
    args0: [{ type:"field_dropdown", name:"SIDE", options:[["Left","left"],["Center","center"],["Right","right"]] },
            { type:"field_number", name:"THRESHOLD", value:700, min:0, max:1023 }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour:270, nextStatement:null, previousStatement:null,
    tooltip:"Runs inner blocks if the ground sensor is above threshold (light surface)" },
  // Sound
  { type: "epuck_play_beep", message0: "🔔 play beep %1 Hz for %2 s", args0: [{type:"field_number",name:"FREQ",value:440,min:100,max:4000},{type:"field_number",name:"DUR",value:0.5,min:0.1,max:5}], colour:330, nextStatement:null, previousStatement:null },
  { type: "epuck_play_melody", message0: "🎵 play startup melody", colour:330, nextStatement:null, previousStatement:null },
  // Control
  { type: "controls_forever", message0: "🔁 repeat forever", message1: "do %1", args1:[{type:"input_statement",name:"DO"}], colour:120, nextStatement:null, previousStatement:null },
  { type: "controls_wait", message0: "⏱ wait %1 seconds", args0:[{type:"field_number",name:"SECONDS",value:1,min:0.1,max:60}], colour:120, nextStatement:null, previousStatement:null },
  // Logic / Variables
  { type: "epuck_print",
    message0: "🖨 print %1",
    args0: [{ type:"input_value", name:"VALUE" }],
    colour: 160, nextStatement:null, previousStatement:null,
    tooltip:"Print a value to the robot log / console" },
  // Robot Info
  { type: "epuck_get_motor_speed",
    message0: "🔧 motor speed %1 (steps/s)",
    args0: [{ type:"field_dropdown", name:"SIDE", options:[["Left","left"],["Right","right"]] }],
    colour: 180, output:"Number",
    tooltip:"Current motor speed in steps/s (~1000 = full speed)" },
  { type: "epuck_is_moving",
    message0: "🔧 robot is moving",
    colour: 180, output:"Boolean",
    tooltip:"True if either motor is currently running" },
  { type: "epuck_get_selector",
    message0: "🎛 selector value (0-15)",
    colour: 180, output:"Number",
    tooltip:"Read the selector dial on top of the robot (0-15)" },
  { type: "epuck_is_button_pressed",
    message0: "🔘 button is pressed",
    colour: 180, output:"Boolean",
    tooltip:"True if the front button on the robot is currently pressed" },
  { type: "epuck_wait_button",
    message0: "⏳ wait until button pressed",
    colour: 180, nextStatement:null, previousStatement:null,
    tooltip:"Pause execution until the front button is pressed" },
  { type: "epuck_if_selector",
    message0: "🎛 if selector = %1", message1: "do %1",
    args0: [{ type:"field_number", name:"VALUE", value:1, min:0, max:15 }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour: 180, nextStatement:null, previousStatement:null,
    tooltip:"Run inner blocks if the selector dial matches the given value" },
  { type: "epuck_get_microphone",
    message0: "🎤 microphone %1 intensity",
    args0: [{ type:"field_dropdown", name:"INDEX", options:[["Mic 0","0"],["Mic 1","1"],["Mic 2","2"],["Mic 3","3"]] }],
    colour: 180, output:"Number",
    tooltip:"Read microphone intensity (0 = silent, higher = louder)" },
  { type: "epuck_get_ambient",
    message0: "☀ ambient light sensor %1",
    args0: [{ type:"field_dropdown", name:"INDEX",
              options:[["PS0","0"],["PS1","1"],["PS2","2"],["PS3","3"],
                       ["PS4","4"],["PS5","5"],["PS6","6"],["PS7","7"]] }],
    colour: 180, output:"Number",
    tooltip:"Read ambient light intensity around the robot (higher = brighter)" },
  { type: "epuck_get_robot_id",
    message0: "🤖 robot ID (hostname)",
    colour: 180, output:"String",
    tooltip:"Returns the robot's hostname — useful to identify it in multi-robot experiments" },
  // Camera
  { type: "epuck_camera_open",
    message0: "📷 open camera %1",
    args0: [{ type:"field_dropdown", name:"DEVICE",
              options:[["video1 — e-puck (front)","1"],["video0 — Pi-Puck (top)","0"]] }],
    colour: 20, nextStatement:null, previousStatement:null,
    tooltip:"Start capturing from the selected camera" },
  { type: "epuck_camera_close",
    message0: "📷 close camera",
    colour: 20, nextStatement:null, previousStatement:null,
    tooltip:"Stop camera capture" },
  { type: "epuck_camera_is_open",
    message0: "📷 camera is open",
    colour: 20, output:"Boolean",
    tooltip:"True if the camera is currently capturing" },
  { type: "epuck_camera_brightness",
    message0: "📷 camera brightness (0-255)",
    colour: 20, output:"Number",
    tooltip:"Mean luminance of the current frame. 0=dark, 255=very bright." },
  { type: "epuck_camera_dominant",
    message0: "📷 dominant color",
    colour: 20, output:"String",
    tooltip:"Returns the dominant color in the frame: red, green, blue, dark, or bright" },
  { type: "epuck_camera_channel",
    message0: "📷 mean %1 channel (0-255)",
    args0: [{ type:"field_dropdown", name:"CH", options:[["Red","r"],["Green","g"],["Blue","b"]] }],
    colour: 20, output:"Number",
    tooltip:"Mean value of the selected color channel in the current frame" },
  { type: "epuck_if_camera_color",
    message0: "📷 if dominant color is %1", message1: "do %1",
    args0: [{ type:"field_dropdown", name:"COLOR",
              options:[["red","red"],["green","green"],["blue","blue"],
                       ["dark","dark"],["bright","bright"]] }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour: 20, nextStatement:null, previousStatement:null,
    tooltip:"Runs inner blocks if the camera sees the selected dominant color" },
  { type: "epuck_if_camera_brighter",
    message0: "📷 if brightness > %1", message1: "do %1",
    args0: [{ type:"field_number", name:"THRESHOLD", value:128, min:0, max:255 }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour: 20, nextStatement:null, previousStatement:null,
    tooltip:"Runs inner blocks if mean frame brightness exceeds the threshold" },
  { type: "epuck_camera_region_brightness",
    message0: "📷 brightness of %1 third",
    args0: [{ type:"field_dropdown", name:"REGION",
              options:[["left","bright_left"],["center","bright_center"],["right","bright_right"]] }],
    colour: 20, output:"Number",
    tooltip:"Returns mean brightness (0-255) of the left, center, or right third of the camera frame. Use to detect which side is brighter." },
  { type: "epuck_camera_ai_describe",
    message0: "🤖 AI describe camera",
    colour: 20, output:"String",
    tooltip:"Sends the current camera frame to the Anthropic AI and returns a text description (takes 2-4 seconds)" },
  { type: "epuck_camera_ai_ask",
    message0: "🤖 AI ask about camera: %1",
    args0: [{ type:"field_input", name:"PROMPT", text:"What color is the object?" }],
    colour: 20, output:"String",
    tooltip:"Ask a custom question about what the camera sees. Returns an AI text answer." },
  { type: "epuck_if_camera_sees",
    message0: "🤖 if AI sees %1", message1: "do %1",
    args0: [{ type:"field_input", name:"KEYWORD", text:"person" }],
    args1: [{ type:"input_statement", name:"DO" }],
    colour: 20, nextStatement:null, previousStatement:null,
    tooltip:"Asks AI to describe the frame, then runs inner blocks if the description contains the keyword" },
  { type: "epuck_race_monitor",
    message0: "🏁 race monitor — spot %1 threshold %2 collision %3",
    args0: [
      { type:"field_number", name:"SPOT_NUM",   value:1,   min:1, max:5   },
      { type:"field_number", name:"GS_THRESH",  value:500, min:0, max:1023},
      { type:"field_number", name:"PS_THRESH",  value:800, min:0, max:4000},
    ],
    colour: 65, nextStatement:null, previousStatement:null,
    tooltip:"Detects when the robot is on a numbered spot (ground sensor) and prints SPOT:N to the log. Also detects collisions via proximity and prints COLLISION." },
];

blockDefs.forEach(def => Blockly.Blocks[def.type] = {
  init: function() { this.jsonInit(def); }
});

// ─── PYTHON CODE GENERATORS ─────────────────────────────────────────────────

// ── Minimal self-contained Python generator (Blockly v10 compatible) ─────────
// Blockly v10 dropped the bundled Python generator. We build our own that
// correctly handles indentation for statement/value inputs.

const gen = new Blockly.Generator('Python');

// Required by Blockly internals
gen.INDENT = '    ';

// scrub_: called for every block — appends the next connected block
gen.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !opt_thisOnly) {
    return code + gen.blockToCode(nextBlock);
  }
  return code;
};

// Helper: generate code for a statement input (indented body)
gen.statementToCode = function(block, name) {
  const targetBlock = block.getInputTargetBlock(name);
  if (!targetBlock) return '';
  const code = gen.blockToCode(targetBlock);
  // Indent every line
  return code.split('\n').map(function(line) {
    return line ? gen.INDENT + line : line;
  }).join('\n');
};

// Helper: generate code for a value input (inline expression)
gen.valueToCode = function(block, name, _order) {
  const targetBlock = block.getInputTargetBlock(name);
  if (!targetBlock) return '';
  const result = gen.blockToCode(targetBlock);
  // Generators for value blocks return [code, order] — unwrap to just the code string
  if (Array.isArray(result)) return result[0];
  return result;
};

// math_number — used by controls_repeat_ext shadow block
gen['math_number'] = function(b) {
  return String(b.getFieldValue('NUM'));
};

gen['epuck_move_forward']  = b => {
  const dur = b.getFieldValue('DURATION');
  const spd = `0.8 * MAX_SPEED`;
  return `left_motor.setVelocity(${spd})\nright_motor.setVelocity(${spd})\nrobot.step(int(${dur} * 1000))\n`;
};
gen['epuck_move_backward'] = b => {
  const dur = b.getFieldValue('DURATION');
  return `left_motor.setVelocity(-0.8 * MAX_SPEED)\nright_motor.setVelocity(-0.8 * MAX_SPEED)\nrobot.step(int(${dur} * 1000))\n`;
};
// MS_PER_DEGREE: ms of turn time per degree at 0.5 * MAX_SPEED.
// Calibrated so that 90° input = real 90° turn on the robot.
// Adjust if your surface or battery level causes drift.
const MS_PER_DEGREE = 7.3333;

gen['epuck_turn_left']     = b => {
  const ang = parseFloat(b.getFieldValue('ANGLE'));
  const ms = Math.round(ang * MS_PER_DEGREE);
  return `left_motor.setVelocity(-0.5 * MAX_SPEED)\nright_motor.setVelocity(0.5 * MAX_SPEED)\nrobot.step(${ms})\n`;
};
gen['epuck_turn_right']    = b => {
  const ang = parseFloat(b.getFieldValue('ANGLE'));
  const ms = Math.round(ang * MS_PER_DEGREE);
  return `left_motor.setVelocity(0.5 * MAX_SPEED)\nright_motor.setVelocity(-0.5 * MAX_SPEED)\nrobot.step(${ms})\n`;
};
gen['epuck_stop']          = b => `left_motor.setVelocity(0.0)\nright_motor.setVelocity(0.0)\nrobot.step(timestep)\n`;
gen['epuck_set_speed']     = b => `left_motor.setVelocity(${b.getFieldValue('SPEED') / 100} * MAX_SPEED)\nright_motor.setVelocity(${b.getFieldValue('SPEED') / 100} * MAX_SPEED)\n`;
gen['epuck_set_motors_lr_val'] = b => {
  const l = gen.valueToCode(b, 'LEFT',  0) || '0';
  const r = gen.valueToCode(b, 'RIGHT', 0) || '0';
  return `left_motor.setVelocity(${l} / 100.0 * MAX_SPEED)\nright_motor.setVelocity(${r} / 100.0 * MAX_SPEED)\n`;
};

gen['epuck_set_motors_lr'] = b => {
  const l = b.getFieldValue('LEFT')  / 100;
  const r = b.getFieldValue('RIGHT') / 100;
  return `left_motor.setVelocity(${l} * MAX_SPEED)\nright_motor.setVelocity(${r} * MAX_SPEED)\n`;
};
gen['epuck_update_sensors'] = b =>
  `ps_values = [sensors[i].getValue() for i in range(8)]\nrobot.step(timestep)\n`;
gen['epuck_led_on']        = b => {
  const n = parseInt(b.getFieldValue('LED_NUM'));
  if (n < 4) return 'robot.setBinaryLed('+n+', 1)\nrobot.step(timestep)\n';
  return 'robot.setRgbLed('+(n-4)+', 100, 0, 0)\nrobot.step(timestep)\n';
};
gen['epuck_led_off']       = b => {
  const n = parseInt(b.getFieldValue('LED_NUM'));
  if (n < 4) return 'robot.setBinaryLed('+n+', 0)\nrobot.step(timestep)\n';
  return 'robot.setRgbLed('+(n-4)+', 0, 0, 0)\nrobot.step(timestep)\n';
};
gen['epuck_led_all_on']    = b => 'robot.setAllLeds(1)\nrobot.step(timestep)\n';
gen['epuck_led_all_off']   = b => 'robot.setAllLeds(0)\nrobot.step(timestep)\n';
gen['epuck_led_blink']     = b => {
  const times = b.getFieldValue('TIMES');
  return 'for _ in range('+times+'):\n    robot.setAllLeds(1)\n    robot.step(200)\n    robot.setAllLeds(0)\n    robot.step(200)\n';
};
gen['epuck_wait_obstacle'] = b =>
  `while not (ps_values[0] > THRESHOLD or ps_values[7] > THRESHOLD):\n    ps_values = [sensors[i].getValue() for i in range(8)]\n    robot.step(timestep)\n`;
gen['epuck_if_obstacle']   = b => {
  const body = gen.statementToCode(b,'DO') || '    pass\n';
  return `ps_values = [sensors[i].getValue() for i in range(8)]\nif ps_values[0] > THRESHOLD or ps_values[7] > THRESHOLD:\n${body}`;
};
gen['epuck_log_sensors'] = b =>
  `_ps_log = [sensors[i].getValue() for i in range(8)]
print("PS raw: " + " ".join(f"{v:5d}" for v in _ps_log))
robot.step(timestep)
`;

gen['epuck_braitenberg'] = b => {
  const sens = parseFloat(b.getFieldValue('SENS'));
  return `# ── Braitenberg vehicle 2b ──────────────────────────────────────
# Calibrated from real sensor data:
#   idle baseline ≈ 100, practical max near wall ≈ 700
#   subtracting baseline so open air = 0, normalising by 600
# Front-right sensors (ps0, ps1) slow LEFT motor  → veers left from right obstacle
# Front-left  sensors (ps7, ps6) slow RIGHT motor → veers right from left obstacle
_SENS = ${sens}
_BASE = 100                     # idle noise floor (measured in open space)
_MAX  = 600.0                   # practical signal range above baseline
_ps   = [sensors[i].getValue() for i in range(8)]
_sig  = [max(0.0, _ps[i] - _BASE) / _MAX for i in range(8)]  # 0.0 in open air, 1.0 near wall
_left  = CRUISE_SPEED - _SENS * CRUISE_SPEED * (_sig[0] + 0.5 * _sig[1])
_right = CRUISE_SPEED - _SENS * CRUISE_SPEED * (_sig[7] + 0.5 * _sig[6])
left_motor.setVelocity(max(-MAX_SPEED, min(MAX_SPEED, _left)))
right_motor.setVelocity(max(-MAX_SPEED, min(MAX_SPEED, _right)))
robot.step(timestep)
`;
};

gen['epuck_avoid_obstacle']= b =>
  `_BASE = 100
_MAX  = 600.0
_ps   = [sensors[i].getValue() for i in range(8)]
_sig  = [max(0.0, _ps[i] - _BASE) / _MAX for i in range(8)]
_left  = CRUISE_SPEED - 2.0 * CRUISE_SPEED * (_sig[0] + 0.5 * _sig[1])
_right = CRUISE_SPEED - 2.0 * CRUISE_SPEED * (_sig[7] + 0.5 * _sig[6])
left_motor.setVelocity(max(-MAX_SPEED, min(MAX_SPEED, _left)))
right_motor.setVelocity(max(-MAX_SPEED, min(MAX_SPEED, _right)))
robot.step(timestep)
`;

// Proximity
gen['epuck_read_proximity'] = b => {
  const i = b.getFieldValue('INDEX');
  return [`sensors[${i}].getValue()`, 0];
};
gen['epuck_if_proximity'] = b => {
  const i   = b.getFieldValue('INDEX');
  const thr = b.getFieldValue('THRESHOLD');
  const body = gen.statementToCode(b, 'DO') || '    pass\n';
  return `ps_values = [sensors[i].getValue() for i in range(8)]\nif ps_values[${i}] > ${thr}:\n${body}`;
};

// ToF
gen['epuck_read_tof'] = b => [`robot.getDevice('tof').getDistance()`, 0];
gen['epuck_if_tof_closer'] = b => {
  const dist = b.getFieldValue('DIST_MM');
  const body = gen.statementToCode(b, 'DO') || '    pass\n';
  return `_tof_val = robot.getDevice('tof').getDistance()\nif _tof_val != -1 and _tof_val < ${dist}:\n${body}`;
};
gen['epuck_wait_tof_closer'] = b => {
  const dist = b.getFieldValue('DIST_MM');
  return `while True:\n    _tof_val = robot.getDevice('tof').getDistance()\n    if _tof_val != -1 and _tof_val < ${dist}:\n        break\n    robot.step(timestep)\n`;
};

// Ground
gen['epuck_read_ground'] = b => {
  const side = b.getFieldValue('SIDE');
  return [`robot.getDevice('ground_sensor').get${side.charAt(0).toUpperCase()+side.slice(1)}()`, 0];
};
gen['epuck_if_ground_dark'] = b => {
  const side = b.getFieldValue('SIDE');
  const thr  = b.getFieldValue('THRESHOLD');
  const body = gen.statementToCode(b, 'DO') || '    pass\n';
  const method = `get${side.charAt(0).toUpperCase()+side.slice(1)}`;
  return `if robot.getDevice('ground_sensor').${method}() < ${thr}:\n${body}`;
};
gen['epuck_if_ground_light'] = b => {
  const side = b.getFieldValue('SIDE');
  const thr  = b.getFieldValue('THRESHOLD');
  const body = gen.statementToCode(b, 'DO') || '    pass\n';
  const method = `get${side.charAt(0).toUpperCase()+side.slice(1)}`;
  return `if robot.getDevice('ground_sensor').${method}() > ${thr}:\n${body}`;
};
gen['epuck_play_beep']     = b => {
  const dur = b.getFieldValue('DUR');
  return `robot.setSpeaker(1)\nrobot.step(int(${dur} * 1000))\nrobot.stopSpeaker()\nrobot.step(timestep)\n`;
};
gen['epuck_play_melody']   = b => `robot.step(1500)  # melody\n`;
gen['controls_repeat_ext'] = b => {
  const times = gen.valueToCode(b, 'TIMES', 0) || '1';
  const body   = gen.statementToCode(b, 'DO') || '    pass\n';
  return `for _ in range(${times}):\n${body}`;
};
gen['controls_forever']    = b => { const body = gen.statementToCode(b,'DO')||'    pass\n'; return `while robot.step(timestep) != -1:\n${body}`; };
gen['controls_wait']       = b => `robot.step(int(${b.getFieldValue('SECONDS')} * 1000))\n`;

// ─── LOGIC / MATH / VARIABLES GENERATORS ────────────────────────────────────

// if / if-else
gen['logic_compare'] = b => {
  const ops = { EQ:'==', NEQ:'!=', LT:'<', LTE:'<=', GT:'>', GTE:'>=' };
  const op = ops[b.getFieldValue('OP')] || '==';
  const a = gen.valueToCode(b, 'A', 0) || '0';
  const bv = gen.valueToCode(b, 'B', 0) || '0';
  return [`${a} ${op} ${bv}`, 0];
};
gen['logic_operation'] = b => {
  const op = b.getFieldValue('OP') === 'AND' ? 'and' : 'or';
  const a = gen.valueToCode(b, 'A', 0) || 'False';
  const bv = gen.valueToCode(b, 'B', 0) || 'False';
  return [`${a} ${op} ${bv}`, 0];
};
gen['logic_negate'] = b => {
  const val = gen.valueToCode(b, 'BOOL', 0) || 'False';
  return [`not ${val}`, 0];
};
gen['logic_boolean'] = b => {
  return [b.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False', 0];
};
gen['controls_if'] = b => {
  let code = '';
  for (let i = 0; i <= (b.elseifCount_ || 0); i++) {
    const cond = gen.valueToCode(b, `IF${i}`, 0) || 'False';
    const body = gen.statementToCode(b, `DO${i}`) || '    pass\n';
    code += (i === 0 ? 'if' : 'elif') + ` ${cond}:\n${body}`;
  }
  if (b.elseCount_) {
    const elseBody = gen.statementToCode(b, 'ELSE') || '    pass\n';
    code += `else:\n${elseBody}`;
  }
  return code;
};

// Math
gen['math_number']     = b => [String(b.getFieldValue('NUM')), 0];
gen['math_arithmetic'] = b => {
  const ops = { ADD:'+', MINUS:'-', MULTIPLY:'*', DIVIDE:'/', POWER:'**' };
  const op = ops[b.getFieldValue('OP')] || '+';
  const a = gen.valueToCode(b, 'A', 0) || '0';
  const bv = gen.valueToCode(b, 'B', 0) || '0';
  return [`(${a} ${op} ${bv})`, 0];
};
gen['math_single'] = b => {
  const op = b.getFieldValue('OP');
  const n = gen.valueToCode(b, 'NUM', 0) || '0';
  const map = { ROOT:`math.sqrt(${n})`, ABS:`abs(${n})`, NEG:`-(${n})`,
                LN:`math.log(${n})`, LOG10:`math.log10(${n})`,
                EXP:`math.exp(${n})`, POW10:`(10**${n})` };
  return [map[op] || n, 0];
};
gen['math_round'] = b => {
  const op = b.getFieldValue('OP');
  const n = gen.valueToCode(b, 'NUM', 0) || '0';
  if (op === 'ROUND') return [`round(${n})`, 0];
  if (op === 'ROUNDUP') return [`math.ceil(${n})`, 0];
  return [`math.floor(${n})`, 0];
};
gen['math_constrain'] = b => {
  const val = gen.valueToCode(b, 'VALUE', 0) || '0';
  const lo  = gen.valueToCode(b, 'LOW', 0) || '0';
  const hi  = gen.valueToCode(b, 'HIGH', 0) || '100';
  return [`max(${lo}, min(${hi}, ${val}))`, 0];
};
gen['math_random_int'] = b => {
  const lo = gen.valueToCode(b, 'FROM', 0) || '0';
  const hi = gen.valueToCode(b, 'TO', 0) || '100';
  return [`random.randint(${lo}, ${hi})`, 0];
};

// Variables
gen['variables_get'] = b => {
  const field = b.getField('VAR');
  const name = field ? (field.getText ? field.getText() : field.getValue()) : b.getFieldValue('VAR');
  return [name, 0];
};
gen['variables_set'] = b => {
  const field = b.getField('VAR');
  const name  = field ? (field.getText ? field.getText() : field.getValue()) : b.getFieldValue('VAR');
  const val   = gen.valueToCode(b, 'VALUE', 0) || '0';
  return `${name} = ${val}\n`;
};
gen['math_change'] = b => {
  const field = b.getField('VAR');
  const name  = field ? (field.getText ? field.getText() : field.getValue()) : b.getFieldValue('VAR');
  const delta = gen.valueToCode(b, 'DELTA', 0) || '0';
  return `${name} = (${name} if isinstance(${name}, (int,float)) else 0) + ${delta}\n`;
};

// Print to log
gen['epuck_print'] = b => {
  const val = gen.valueToCode(b, 'VALUE', 0) || '""';
  return `print(${val})\n`;
};

// ─── ROBOT INFO GENERATORS ───────────────────────────────────────────────────
gen['epuck_get_motor_speed']   = b => [`robot.getMotorSpeed('${b.getFieldValue('SIDE')}')`, 0];
gen['epuck_is_moving']         = b => [`robot.isMoving()`, 0];
gen['epuck_get_selector']      = b => [`robot.getSelector()`, 0];
gen['epuck_is_button_pressed'] = b => [`robot.isButtonPressed()`, 0];
gen['epuck_wait_button']       = b =>
  `while not robot.isButtonPressed():\n    robot.step(timestep)\n`;
gen['epuck_if_selector'] = b => {
  const val  = b.getFieldValue('VALUE');
  const body = gen.statementToCode(b, 'DO') || '    pass\n';
  return `if robot.getSelector() == ${val}:\n${body}`;
};
gen['epuck_get_microphone'] = b => [`robot.getMicrophone(${b.getFieldValue('INDEX')})`, 0];
gen['epuck_get_ambient']    = b => [`robot.getAmbientLight(${b.getFieldValue('INDEX')})`, 0];
gen['epuck_get_robot_id']   = b => [`robot.getRobotId()`, 0];

// ─── CAMERA GENERATORS ───────────────────────────────────────────────────────
// Helper used by analysis blocks — fetches /camera/analyze via urllib
const _camAnalyzeSnippet =
`import urllib.request as _ur, json as _json
_cam_resp = _json.loads(_ur.urlopen('http://localhost:5000/camera/analyze').read())
`;

gen['epuck_camera_open']  = b => {
  const dev = b.getFieldValue('DEVICE');
  return `import urllib.request as _ur\n_ur.urlopen('http://localhost:5000/camera/open?device=${dev}')\nrobot.step(500)  # wait for first frame\n`;
};
gen['epuck_camera_close'] = b =>
  `import urllib.request as _ur\n_ur.urlopen('http://localhost:5000/camera/close')\nrobot.step(timestep)\n`;
gen['epuck_camera_is_open'] = b =>
  [`(__import__('json').loads(__import__('urllib.request',fromlist=['urlopen']).urlopen('http://localhost:5000/camera/status').read()).get('open', False))`, 0];
gen['epuck_camera_brightness'] = b =>
  [`(__import__('json').loads(__import__('urllib.request',fromlist=['urlopen']).urlopen('http://localhost:5000/camera/analyze').read()).get('brightness', 0))`, 0];
gen['epuck_camera_dominant'] = b =>
  [`(__import__('json').loads(__import__('urllib.request',fromlist=['urlopen']).urlopen('http://localhost:5000/camera/analyze').read()).get('dominant', 'dark'))`, 0];
gen['epuck_camera_channel'] = b => {
  const ch = b.getFieldValue('CH');
  return [`(__import__('json').loads(__import__('urllib.request',fromlist=['urlopen']).urlopen('http://localhost:5000/camera/analyze').read()).get('${ch}', 0))`, 0];
};
gen['epuck_if_camera_color'] = b => {
  const color = b.getFieldValue('COLOR');
  const body  = gen.statementToCode(b, 'DO') || '    pass\n';
  return `${_camAnalyzeSnippet}if _cam_resp.get('dominant') == '${color}':\n${body}`;
};
gen['epuck_if_camera_brighter'] = b => {
  const thr  = b.getFieldValue('THRESHOLD');
  const body = gen.statementToCode(b, 'DO') || '    pass\n';
  return `${_camAnalyzeSnippet}if _cam_resp.get('brightness', 0) > ${thr}:\n${body}`;
};

// AI camera snippet — calls /camera/ai_describe with optional prompt
const _camAiSnippet = (prompt) =>
`import urllib.request as _ur, json as _json, urllib.parse as _up
_ai_url = 'http://localhost:5000/camera/ai_describe?prompt=' + _up.quote(${JSON.stringify(prompt)})
_ai_resp = _json.loads(_ur.urlopen(_ai_url, timeout=15).read())
_ai_desc = _ai_resp.get('description', '') if _ai_resp.get('ok') else ''
`;

gen['epuck_camera_region_brightness'] = b => {
  const region = b.getFieldValue('REGION');
  return [`(__import__('json').loads(__import__('urllib.request',fromlist=['urlopen']).urlopen('http://localhost:5000/camera/analyze').read()).get('${region}', 0))`, 0];
};

gen['epuck_camera_ai_describe'] = b =>
  [`(__import__('json').loads(__import__('urllib.request',fromlist=['urlopen']).urlopen('http://localhost:5000/camera/ai_describe', timeout=15).read()).get('description',''))`, 0];

gen['epuck_camera_ai_ask'] = b => {
  const prompt = b.getFieldValue('PROMPT').replace(/'/g, "\\'");
  return [`(__import__('json').loads(__import__('urllib.request',fromlist=['urlopen']).urlopen('http://localhost:5000/camera/ai_describe?prompt=' + __import__('urllib.parse',fromlist=['quote']).quote('${prompt}'), timeout=15).read()).get('description',''))`, 0];
};

gen['epuck_if_camera_sees'] = b => {
  const keyword = b.getFieldValue('KEYWORD').toLowerCase().replace(/'/g, "\\'");
  const body    = gen.statementToCode(b, 'DO') || '    pass\n';
  const snippet = _camAiSnippet('Describe what you see in one sentence. Be brief.');
  return `${snippet}if '${keyword}' in _ai_desc.lower():\n${body}`;
};

gen['epuck_race_monitor'] = b => {
  const spotNum  = b.getFieldValue('SPOT_NUM');
  const gsThresh = b.getFieldValue('GS_THRESH');
  const psThresh = b.getFieldValue('PS_THRESH');
  return `# ── Race monitor — spot ${spotNum} ──────────────────────────────────
_gs = robot.getDevice('ground_sensor')
_spot_visited_${spotNum} = False
_on_spot_since_${spotNum} = 0
_coll_cooldown_${spotNum} = 0
_ps_vals = [sensors[i].getValue() for i in range(8)]
_max_ps = max(_ps_vals)
# Collision detection
import time as _t
_now = _t.time()
if _max_ps > ${psThresh} and (_now - _coll_cooldown_${spotNum}) > 2.0:
    print('COLLISION')
    _coll_cooldown_${spotNum} = _now
# Spot detection
if not _spot_visited_${spotNum}:
    _gs_l = _gs.getLeft()
    _gs_c = _gs.getCenter()
    _gs_r = _gs.getRight()
    if _gs_l < ${gsThresh} or _gs_c < ${gsThresh} or _gs_r < ${gsThresh}:
        _on_spot_since_${spotNum} += 1
        if _on_spot_since_${spotNum} >= 3:
            print('SPOT:${spotNum}')
            _spot_visited_${spotNum} = True
    else:
        _on_spot_since_${spotNum} = 0
`;
};

// ─── RANGE AND BEARING BLOCKS ───────────────────────────────────────────────

// Block definitions
const rabBlockDefs = [
  {
    type: 'epuck_rab_set_mode',
    message0: '📶 set RaB mode to %1',
    args0: [{ type: 'field_dropdown', name: 'MODE', options: [['📥 RX (receive)', 'rx'], ['📤 TX (transmit)', 'tx'], ['■ Off', 'off']] }],
    colour: 46,
    tooltip: 'Set the Range and Bearing board to receive or transmit mode',
    nextStatement: null, previousStatement: null,
  },
  {
    type: 'epuck_rab_set_range',
    message0: '📶 RaB set range %1 (0=1m … 255=off)',
    args0: [{ type: 'field_slider', name: 'RANGE', value: 150, min: 0, max: 255 }],
    colour: 46,
    tooltip: 'Set transmission range: 0 = full range (~1m), 255 = no range',
    nextStatement: null, previousStatement: null,
  },
  {
    type: 'epuck_rab_transmit',
    message0: '📤 RaB transmit hi: %1 lo: %2',
    args0: [
      { type: 'field_input', name: 'HI', text: '0xAA' },
      { type: 'field_input', name: 'LO', text: '0xFF' },
    ],
    colour: 46,
    tooltip: 'Transmit two hex bytes over the Range and Bearing board',
    nextStatement: null, previousStatement: null,
  },
  {
    type: 'epuck_rab_get_bearing',
    message0: '📶 RaB bearing (°)',
    output: null,
    colour: 46,
    tooltip: 'Get the bearing in degrees of the last received RaB message',
  },
  {
    type: 'epuck_rab_get_range',
    message0: '📶 RaB range (mm)',
    output: null,
    colour: 46,
    tooltip: 'Get the range in mm of the last received RaB message',
  },
  {
    type: 'epuck_rab_get_data',
    message0: '📶 RaB data',
    output: null,
    colour: 46,
    tooltip: 'Get the data word from the last received RaB message',
  },
  {
    type: 'epuck_rab_get_sensor',
    message0: '📶 RaB sensor ID',
    output: null,
    colour: 46,
    tooltip: 'Get the sensor ID of the last received RaB message',
  },
];

rabBlockDefs.forEach(def => Blockly.Blocks[def.type] = {
  init: function() { this.jsonInit(def); }
});

// Code generators
gen['epuck_rab_set_mode'] = b => {
  const mode = b.getFieldValue('MODE');
  if (mode === 'off') return `robot.setRabMode(None)\nrobot.step(timestep)\n`;
  return `robot.setRabMode('${mode}')\nrobot.step(200)  # wait for RaB init\n`;
};
gen['epuck_rab_set_range'] = b => {
  const val = parseInt(b.getFieldValue('RANGE'));
  return `robot.setRabRange(${val})\nrobot.step(timestep)\n`;
};
gen['epuck_rab_transmit'] = b => {
  const hi = b.getFieldValue('HI') || '0xAA';
  const lo = b.getFieldValue('LO') || '0xFF';
  return `robot.setRabData(${hi}, ${lo})\nrobot.step(timestep)\n`;
};
gen['epuck_rab_get_bearing'] = b => `robot.getRabBearing()`;
gen['epuck_rab_get_range']   = b => `robot.getRabRange()`;
gen['epuck_rab_get_data']    = b => `robot.getRabData()`;
gen['epuck_rab_get_sensor']  = b => `robot.getRabSensor()`;

// ─── INIT BLOCKLY ───────────────────────────────────────────────────────────

const workspace = Blockly.inject('blockly-div', {
  toolbox: document.getElementById('toolbox'),
  grid: { spacing: 24, length: 8, colour: '#1c2330', snap: true },
  zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 2, minScale: 0.5 },
  trashcan: true,
  move: { scrollbars: true, drag: true, wheel: true },
  theme: Blockly.Theme.defineTheme('epuckDark', {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#0d1117',
      toolboxBackgroundColour: '#161b22',
      toolboxForegroundColour: '#e6edf3',
      flyoutBackgroundColour: '#1c2330',
      flyoutForegroundColour: '#e6edf3',
      flyoutOpacity: 1,
      scrollbarColour: '#30363d',
      insertionMarkerColour: '#00e5ff',
    }
  }),
});

// Keep a clean copy of the last generated code for sendToRobot to use.
// renderCode() only touches the display — never this variable.
let _lastGeneratedCode = '';

workspace.addChangeListener(() => {
  try {
    _lastGeneratedCode = gen.workspaceToCode(workspace);
    renderCode(_lastGeneratedCode);
  } catch(e) { _lastGeneratedCode = ''; }
});

// ─── CODE RENDERING ─────────────────────────────────────────────────────────

function renderCode(raw) {
  if (!raw.trim()) {
    document.getElementById('codeOutput').innerHTML = `<span class="cmt"># Drag blocks to start coding!\n# Your Python code appears here.</span>`;
    return;
  }
  const header = `<span class="cmt"># e-puck Block Coder — generated code\n# Runs on Pi-Puck via controller.py HAL\n</span><span class="kw">from</span> <span class="fn">controller</span> <span class="kw">import</span> Robot\n<span class="kw">import</span> time\n<span class="kw">import</span> math\n<span class="kw">import</span> random\n\nMAX_SPEED = <span class="num">6.28</span>\nCRUISE_SPEED = <span class="num">0.8</span> * MAX_SPEED\nTHRESHOLD = <span class="num">500.0</span>\n\nrobot = <span class="fn">Robot</span>()\ntimestep = int(robot.<span class="fn">getBasicTimeStep</span>())\n\nleft_motor = robot.<span class="fn">getDevice</span>(<span class="str">'left wheel motor'</span>)\nright_motor = robot.<span class="fn">getDevice</span>(<span class="str">'right wheel motor'</span>)\nleft_motor.<span class="fn">setPosition</span>(float(<span class="str">'inf'</span>))\nright_motor.<span class="fn">setPosition</span>(float(<span class="str">'inf'</span>))\nleft_motor.<span class="fn">setVelocity</span>(<span class="num">0.0</span>)\nright_motor.<span class="fn">setVelocity</span>(<span class="num">0.0</span>)\n\nsensors = []\n<span class="kw">for</span> i <span class="kw">in</span> range(<span class="num">8</span>):\n    s = robot.<span class="fn">getDevice</span>(f<span class="str">'ps{i}'</span>)\n    s.<span class="fn">enable</span>(timestep)\n    sensors.<span class="fn">append</span>(s)\n\nps_values = [<span class="num">0</span>] * <span class="num">8</span>\n\n`;
  const highlighted = raw
    .replace(/(while|if|import|True|False|pass)/g, '<span class="kw">$1</span>')
    .replace(/(robot\.\w+)/g, '<span class="fn">$1</span>')
    .replace(/(".*?")/g, '<span class="str">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$1</span>');
  document.getElementById('codeOutput').innerHTML = header + highlighted;
}

// ─── SIMULATOR STATE ────────────────────────────────────────────────────────

let simState = { x: 130, y: 90, angle: 0, running: false, speed: 50 };
let simTimer = null;
const robot = document.getElementById('robot');
const arena = document.getElementById('arena');

function placeRobot() {
  robot.style.left = (simState.x - 18) + 'px';
  robot.style.top  = (simState.y - 18) + 'px';
  robot.style.transform = `rotate(${simState.angle}deg)`;
}

placeRobot();

// ─── PROGRAM EXECUTION (Simulated) ──────────────────────────────────────────

let isRunning = false;

async function runProgram() {
  if (isRunning) return;
  const blocks = workspace.getAllBlocks(true).filter(b => b.type !== 'controls_forever');
  if (workspace.getAllBlocks().length === 0) {
    addLog('⚠ No blocks in workspace!', 'warn');
    return;
  }

  isRunning = true;
  document.getElementById('runBtn').textContent = '⏳ Running...';
  document.getElementById('runBtn').disabled = true;
  setStatus('running', 'Simulating program...');
  addLog('▶ Program started', 'info');

  // Parse and simulate top-level blocks
  const topBlocks = workspace.getTopBlocks(true);
  for (const block of topBlocks) {
    if (!isRunning) break;
    await simulateBlock(block);
  }

  if (isRunning) {
    isRunning = false;
    document.getElementById('runBtn').textContent = '▶ Run Program';
    document.getElementById('runBtn').disabled = false;
    setStatus('idle', 'Program finished ✓');
    addLog('✓ Program complete', 'info');
    allLedsOff();
  }
}

async function simulateBlock(block) {
  if (!block || !isRunning) return;
  const type = block.type;

  switch(type) {
    case 'epuck_move_forward': {
      const dur = parseFloat(block.getFieldValue('DURATION'));
      addLog(`→ Move forward ${dur}s`, 'action');
      await simMove(dur, 1);
      break;
    }
    case 'epuck_move_backward': {
      const dur = parseFloat(block.getFieldValue('DURATION'));
      addLog(`← Move backward ${dur}s`, 'action');
      await simMove(dur, -1);
      break;
    }
    case 'epuck_turn_left': {
      const ang = parseFloat(block.getFieldValue('ANGLE'));
      addLog(`↰ Turn left ${ang}°`, 'action');
      await simTurn(-ang);
      break;
    }
    case 'epuck_turn_right': {
      const ang = parseFloat(block.getFieldValue('ANGLE'));
      addLog(`↱ Turn right ${ang}°`, 'action');
      await simTurn(ang);
      break;
    }
    case 'epuck_stop':
      addLog('⛔ Stop', 'action');
      break;
    case 'epuck_set_speed':
      simState.speed = parseInt(block.getFieldValue('SPEED'));
      addLog(`⚡ Speed set to ${simState.speed}%`, 'action');
      break;
    case 'epuck_set_motors_lr_val': {
      const l = block.getInputTargetBlock('LEFT');
      const r = block.getInputTargetBlock('RIGHT');
      const lv = l ? parseFloat(gen.blockToCode(l)) : 0;
      const rv = r ? parseFloat(gen.blockToCode(r)) : 0;
      addLog(`🚗 Motors L:${lv}% R:${rv}% (from variables)`, 'action');
      break;
    }
    case 'epuck_set_motors_lr': {
      const l = parseInt(block.getFieldValue('LEFT'));
      const r = parseInt(block.getFieldValue('RIGHT'));
      simState.speed = Math.max(Math.abs(l), Math.abs(r));
      addLog(`🚗 Motors  L:${l >= 0 ? '+' : ''}${l}%  R:${r >= 0 ? '+' : ''}${r}%`, 'action');
      break;
    }
    case 'epuck_update_sensors':
      addLog('🔄 Sensors updated (simulated)', 'action');
      await delay(80);
      break;
    case 'epuck_led_on': {
      const n = parseInt(block.getFieldValue('LED_NUM'));
      const c = block.getFieldValue('COLOR');
      addLog(`💡 LED ${n} ON`, 'action');
      setLed(n, c);
      break;
    }
    case 'epuck_led_off':
      setLed(parseInt(block.getFieldValue('LED_NUM')), null);
      addLog(`💡 LED ${block.getFieldValue('LED_NUM')} OFF`, 'action');
      break;
    case 'epuck_led_all_on': {
      const c = block.getFieldValue('COLOR');
      addLog(`✨ All LEDs ON`, 'action');
      for(let i=0;i<8;i++) setLed(i, c);
      setRobotGlow(c);
      break;
    }
    case 'epuck_led_all_off':
      addLog(`💤 All LEDs OFF`, 'action');
      allLedsOff();
      break;
    case 'epuck_led_blink': {
      const times = parseInt(block.getFieldValue('TIMES'));
      const c = block.getFieldValue('COLOR');
      addLog(`✨ Blink LEDs ${times}×`, 'action');
      await simBlink(times, c);
      break;
    }
    case 'epuck_wait_obstacle':
      addLog('📡 Waiting for obstacle...', 'action');
      await delay(800);
      setSensors([2800, 2800, 400, 400, 400, 400, 400, 400]);
      addLog('🚧 Obstacle detected!', 'warn');
      break;
    case 'epuck_if_obstacle': {
      const detected = Math.random() > 0.4;
      addLog(`📡 Checking obstacle... ${detected ? '⚠ YES' : '✓ Clear'}`, detected?'warn':'action');
      if (detected) {
        setSensors([3200, 3000, 800, 800, 800, 800, 800, 800]);
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'epuck_log_sensors':
      addLog('📋 PS raw: (simulated) 45 52 30 20 20 30 48 60', 'info');
      break;
    case 'epuck_braitenberg': {
      const sens = parseFloat(block.getFieldValue('SENS'));
      addLog(`🧠 Braitenberg step (sens=${sens}) — simulated smooth avoidance`, 'action');
      break;
    }
    case 'epuck_avoid_obstacle':
      addLog('🤖 Auto-avoiding obstacle', 'action');
      setSensors([3400, 3200, 600, 600, 600, 600, 600, 600]);
      await simTurn(45 + Math.random()*45);
      setSensors([20, 20, 20, 20, 20, 20, 20, 20]);
      await simMove(0.5, 1);
      break;
    case 'epuck_read_proximity': {
      const idx = block.getFieldValue('INDEX');
      const val = Math.floor(Math.random() * 200);
      addLog(`📡 PS${idx} = ${val} (simulated)`, 'action');
      break;
    }
    case 'epuck_if_proximity': {
      const idx = block.getFieldValue('INDEX');
      const thr = parseInt(block.getFieldValue('THRESHOLD'));
      const simVal = Math.floor(Math.random() * 400);
      const triggered = simVal > thr;
      addLog(`📡 PS${idx} = ${simVal} vs threshold ${thr} → ${triggered ? '⚠ triggered' : '✓ clear'}`, triggered ? 'warn' : 'action');
      if (triggered) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'epuck_read_tof': {
      const simDist = 150 + Math.floor(Math.random() * 500);
      addLog(`📏 ToF = ${simDist} mm (simulated)`, 'action');
      break;
    }
    case 'epuck_if_tof_closer': {
      const distThr = parseInt(block.getFieldValue('DIST_MM'));
      const simDist = 100 + Math.floor(Math.random() * 600);
      const triggered = simDist < distThr;
      addLog(`📏 ToF = ${simDist}mm vs ${distThr}mm → ${triggered ? '⚠ triggered' : '✓ clear'}`, triggered ? 'warn' : 'action');
      if (triggered) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'epuck_wait_tof_closer': {
      const distThr = parseInt(block.getFieldValue('DIST_MM'));
      addLog(`📏 Waiting for object closer than ${distThr}mm...`, 'action');
      await delay(600);
      addLog(`📏 Object detected at ${distThr - 20}mm!`, 'warn');
      break;
    }
    case 'epuck_read_ground': {
      const side = block.getFieldValue('SIDE');
      const val = Math.floor(Math.random() * 1023);
      addLog(`🔲 Ground ${side} = ${val} (simulated)`, 'action');
      break;
    }
    case 'epuck_if_ground_dark': {
      const side = block.getFieldValue('SIDE');
      const thr  = parseInt(block.getFieldValue('THRESHOLD'));
      const val  = Math.floor(Math.random() * 600);
      const triggered = val < thr;
      addLog(`🔲 Ground ${side} = ${val} (dark < ${thr}) → ${triggered ? '⚠ dark' : '✓ light'}`, triggered ? 'warn' : 'action');
      if (triggered) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'epuck_if_ground_light': {
      const side = block.getFieldValue('SIDE');
      const thr  = parseInt(block.getFieldValue('THRESHOLD'));
      const val  = 400 + Math.floor(Math.random() * 600);
      const triggered = val > thr;
      addLog(`🔲 Ground ${side} = ${val} (light > ${thr}) → ${triggered ? '⚠ light' : '✓ dark'}`, triggered ? 'warn' : 'action');
      if (triggered) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'epuck_play_beep': {
      const freq = block.getFieldValue('FREQ');
      addLog(`🔔 Beep ${freq}Hz`, 'action');
      playBeep(parseFloat(freq), parseFloat(block.getFieldValue('DUR')));
      await delay(parseFloat(block.getFieldValue('DUR'))*1000);
      break;
    }
    case 'epuck_play_melody':
      addLog('🎵 Playing melody', 'action');
      await playMelody();
      break;
    case 'controls_repeat_ext': {
      const times = parseInt(block.getInputTargetBlock('TIMES')?.getFieldValue('NUM')) || 3;
      addLog(`🔁 Repeat ${times}×`, 'action');
      for(let i=0; i<times && isRunning; i++) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'controls_forever': {
      addLog('🔁 Repeat forever (3 loops in sim)', 'warn');
      for(let i=0; i<3 && isRunning; i++) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'controls_wait': {
      const sec = parseFloat(block.getFieldValue('SECONDS'));
      addLog(`⏱ Wait ${sec}s`, 'action');
      await delay(Math.min(sec * 600, 2000));
      break;
    }
    // Logic / Variables
    case 'controls_if': {
      // Evaluate condition conservatively: randomise for sim
      const condBlock = block.getInputTargetBlock('IF0');
      const triggered = condBlock ? (Math.random() > 0.4) : false;
      addLog(`🔀 if → ${triggered ? '✓ true' : '✗ false'} (simulated)`, triggered ? 'action' : 'warn');
      if (triggered) {
        const inner = block.getInputTargetBlock('DO0');
        if (inner) await simulateBlock(inner);
      } else if (block.elseCount_) {
        const inner = block.getInputTargetBlock('ELSE');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'variables_set': {
      const field = block.getField('VAR');
      const name = field ? (field.getText ? field.getText() : field.getValue()) : block.getFieldValue('VAR');
      addLog(`📦 set ${name} = ... (simulated)`, 'action');
      break;
    }
    case 'math_change': {
      const field = block.getField('VAR');
      const name = field ? (field.getText ? field.getText() : field.getValue()) : block.getFieldValue('VAR');
      addLog(`📦 change ${name} (simulated)`, 'action');
      break;
    }
    case 'epuck_print': {
      addLog(`🖨 print (simulated)`, 'action');
      break;
    }
    // Robot Info
    case 'epuck_get_motor_speed': {
      const side = block.getFieldValue('SIDE');
      addLog(`🔧 motor speed ${side} = ${simState.speed * 10} steps/s (simulated)`, 'action');
      break;
    }
    case 'epuck_is_moving':
      addLog(`🔧 is moving = ${simState.speed > 0} (simulated)`, 'action');
      break;
    case 'epuck_get_selector': {
      const sel = Math.floor(Math.random() * 16);
      addLog(`🎛 selector = ${sel} (simulated)`, 'action');
      break;
    }
    case 'epuck_is_button_pressed':
      addLog(`🔘 button pressed = false (simulated)`, 'action');
      break;
    case 'epuck_wait_button':
      addLog(`🔘 waiting for button... (simulated — skipped)`, 'warn');
      await delay(400);
      addLog(`🔘 button pressed!`, 'action');
      break;
    case 'epuck_if_selector': {
      const val = parseInt(block.getFieldValue('VALUE'));
      const sel = Math.floor(Math.random() * 16);
      const match = sel === val;
      addLog(`🎛 selector = ${sel}, checking = ${val} → ${match ? '✓ match' : '✗ no match'}`, match ? 'action' : 'warn');
      if (match) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'epuck_get_microphone': {
      const idx = block.getFieldValue('INDEX');
      const val = Math.floor(Math.random() * 3000);
      addLog(`🎤 mic ${idx} = ${val} (simulated)`, 'action');
      break;
    }
    case 'epuck_get_ambient': {
      const idx = block.getFieldValue('INDEX');
      const val = Math.floor(Math.random() * 500);
      addLog(`☀ ambient[${idx}] = ${val} (simulated)`, 'action');
      break;
    }
    case 'epuck_get_robot_id':
      addLog(`🤖 robot ID = "epuck-sim" (simulated)`, 'action');
      break;
    // Camera
    case 'epuck_camera_open': {
      const dev = block.getFieldValue('DEVICE');
      addLog(`📷 camera open video${dev} (simulated)`, 'action');
      break;
    }
    case 'epuck_camera_close':
      addLog(`📷 camera closed (simulated)`, 'action');
      break;
    case 'epuck_camera_is_open':
      addLog(`📷 camera is open = true (simulated)`, 'action');
      break;
    case 'epuck_camera_brightness': {
      const b = Math.floor(Math.random() * 255);
      addLog(`📷 brightness = ${b} (simulated)`, 'action');
      break;
    }
    case 'epuck_camera_dominant': {
      const colors = ['red','green','blue','dark','bright'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      addLog(`📷 dominant color = "${c}" (simulated)`, 'action');
      break;
    }
    case 'epuck_camera_channel': {
      const ch = block.getFieldValue('CH');
      const v = Math.floor(Math.random() * 255);
      addLog(`📷 channel ${ch} = ${v} (simulated)`, 'action');
      break;
    }
    case 'epuck_if_camera_color': {
      const color = block.getFieldValue('COLOR');
      const colors = ['red','green','blue','dark','bright'];
      const seen = colors[Math.floor(Math.random() * colors.length)];
      const match = seen === color;
      addLog(`📷 dominant="${seen}" vs "${color}" → ${match ? '✓ match' : '✗ no match'}`, match ? 'action' : 'warn');
      if (match) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
    case 'epuck_if_camera_brighter': {
      const thr = parseInt(block.getFieldValue('THRESHOLD'));
      const b = Math.floor(Math.random() * 255);
      const triggered = b > thr;
      addLog(`📷 brightness=${b} vs ${thr} → ${triggered ? '✓ brighter' : '✗ darker'}`, triggered ? 'action' : 'warn');
      if (triggered) {
        const inner = block.getInputTargetBlock('DO');
        if (inner) await simulateBlock(inner);
      }
      break;
    }
  }

  // Chain to next block
  if (isRunning && block.nextConnection && block.nextConnection.targetBlock()) {
    await simulateBlock(block.nextConnection.targetBlock());
  }
}

// ─── SIM HELPERS ────────────────────────────────────────────────────────────

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function simMove(duration, dir) {
  const steps = Math.min(duration * 8, 20);
  const dist = (simState.speed / 100) * 18 * dir;
  const rad = (simState.angle - 90) * Math.PI / 180;
  const tx = Math.max(18, Math.min(arena.offsetWidth  - 18, simState.x + Math.cos(rad) * dist));
  const ty = Math.max(18, Math.min(arena.offsetHeight - 18, simState.y + Math.sin(rad) * dist));
  simState.x = tx; simState.y = ty;
  placeRobot();
  await delay(duration * 500);
}

async function simTurn(deg) {
  simState.angle = (simState.angle + deg + 360) % 360;
  placeRobot();
  await delay(300);
}

async function simBlink(times, color) {
  for(let i=0; i<times && isRunning; i++) {
    for(let j=0;j<8;j++) setLed(j, color);
    setRobotGlow(color);
    await delay(200);
    allLedsOff();
    await delay(200);
  }
}

function setSensors(ps) {
  // accepts array of 8 values (0-4000 range)
  for (let i = 0; i < 8; i++) {
    const el  = document.getElementById('s'  + i);
    const val_el = document.getElementById('sv' + i);
    if (!el) continue;
    const val = ps[i] || 0;
    const pct = Math.min(100, (Math.log1p(val) / Math.log1p(4000)) * 100);
    el.style.width = Math.max(3, pct) + '%';
    const warn = val > 120;
    el.classList.toggle('warn', warn);
    if (val_el) {
      val_el.textContent = val;
      val_el.classList.toggle('warn', warn);
    }
  }
}

// ─── WEB AUDIO BEEPS ────────────────────────────────────────────────────────

let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playBeep(freq, dur) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

async function playMelody() {
  const notes = [523, 659, 784, 1047, 784, 659, 523];
  for (const note of notes) {
    playBeep(note, 0.15);
    await delay(180);
  }
}

// ─── STATUS & LOG ───────────────────────────────────────────────────────────

function setStatus(state, text) {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot ' + state;
  document.getElementById('statusText').textContent = text;
}

function addLog(msg, type='info') {
  const log = document.getElementById('logSection');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  const now = new Date();
  const ts = `${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`;
  entry.textContent = `[${ts}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
  // Keep max 20 entries
  while(log.children.length > 20) log.removeChild(log.firstChild);
}

// ─── TOOLBAR ACTIONS ────────────────────────────────────────────────────────

function clearWorkspace() {
  workspace.clear();
  isRunning = false;
  allLedsOff();
  simState = { x: 130, y: 90, angle: 0, running: false, speed: 50 };
  placeRobot();
  document.getElementById('runBtn').textContent = '▶ Run Program';
  document.getElementById('runBtn').disabled = false;
  setStatus('idle', 'Ready — drag blocks to build a program');
  document.getElementById('logSection').innerHTML = '';
  renderCode('');
}

function copyCode() {
  const raw = gen.workspaceToCode(workspace);
  if (!raw.trim()) return;
  const full = `import epuck, time\nrobot = epuck.Robot()\n\n${raw}`;
  navigator.clipboard.writeText(full).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✓ copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 2000);
  });
}

function saveAsExample() {
  const label = prompt('Name for this example:');
  if (!label || !label.trim()) return;
  const key = 'user_' + label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const xml = Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(workspace));
  const stored = JSON.parse(localStorage.getItem('epuck_user_examples') || '{}');
  stored[key] = { label: '⭐ ' + label.trim(), xml };
  localStorage.setItem('epuck_user_examples', JSON.stringify(stored));
  addLog('⭐ Saved as example: ' + label.trim(), 'info');
}

function deleteUserExample(key) {
  const stored = JSON.parse(localStorage.getItem('epuck_user_examples') || '{}');
  if (!stored[key]) return;
  const label = stored[key].label;
  if (!confirm('Delete example "' + label + '"?')) return;
  delete stored[key];
  localStorage.setItem('epuck_user_examples', JSON.stringify(stored));
  addLog('🗑 Deleted example: ' + label, 'info');
}

function _getUserExamples() {
  try { return JSON.parse(localStorage.getItem('epuck_user_examples') || '{}'); }
  catch(e) { return {}; }
}

function loadExample(name) {
  if (!name) {
    name = _examplePicker();
    if (!name) return;
  }
  const all = Object.assign({}, _getExamples(), _getUserExamples());
  const ex = all[name];
  if (!ex) return;
  clearWorkspace();
  try {
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(ex.xml), workspace);
    addLog('📂 Example loaded: ' + ex.label, 'info');
  } catch(e) {
    addLog('❌ Load failed: ' + e.message, 'error');
  }
}

function _examplePicker() {
  const builtin = _getExamples();
  const user    = _getUserExamples();
  const all     = Object.assign({}, builtin, user);
  const keys    = Object.keys(all);
  if (keys.length === 0) { addLog('No examples saved yet.', 'info'); return null; }

  // Build a simple modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';

  const box = document.createElement('div');
  box.style.cssText = 'background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:20px;min-width:320px;max-width:480px;max-height:80vh;overflow-y:auto;font-family:"Space Mono",monospace;';

  const title = document.createElement('div');
  title.textContent = '📂 Load Example';
  title.style.cssText = 'font-size:0.85rem;font-weight:bold;color:var(--text);margin-bottom:14px;';
  box.appendChild(title);

  keys.forEach(key => {
    const ex = all[key];
    const isUser = key in user;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';

    const btn = document.createElement('button');
    btn.textContent = ex.label;
    btn.style.cssText = 'flex:1;text-align:left;background:var(--panel2);border:1px solid var(--border);color:var(--text);font-family:"Space Mono",monospace;font-size:0.7rem;padding:7px 10px;border-radius:6px;cursor:pointer;';
    btn.onmouseover = () => btn.style.borderColor = 'var(--accent)';
    btn.onmouseout  = () => btn.style.borderColor = 'var(--border)';
    btn.onclick = () => { document.body.removeChild(overlay); loadExample(key); };
    row.appendChild(btn);

    if (isUser) {
      const del = document.createElement('button');
      del.textContent = '🗑';
      del.title = 'Delete this example';
      del.style.cssText = 'background:none;border:1px solid var(--border);color:#f85149;font-size:0.75rem;padding:5px 8px;border-radius:6px;cursor:pointer;flex-shrink:0;';
      del.onclick = () => {
        deleteUserExample(key);
        document.body.removeChild(overlay);
      };
      row.appendChild(del);
    }
    box.appendChild(row);
  });

  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.style.cssText = 'margin-top:10px;width:100%;background:none;border:1px solid var(--border);color:var(--text-muted);font-family:"Space Mono",monospace;font-size:0.7rem;padding:7px;border-radius:6px;cursor:pointer;';
  cancel.onclick = () => document.body.removeChild(overlay);
  box.appendChild(cancel);

  overlay.appendChild(box);
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
  document.body.appendChild(overlay);
  return null; // async — loadExample called directly from button onclick
}

function _getExamples() {
  return {
    square_patrol: {
      label: 'Square patrol + blink',
      xml: `<xml>
  <block type="epuck_led_all_on" x="50" y="50">
    <field name="COLOR">#00e5ff</field>
    <next><block type="epuck_play_beep">
      <field name="FREQ">880</field><field name="DUR">0.3</field>
      <next><block type="controls_repeat_ext">
        <value name="TIMES"><shadow type="math_number"><field name="NUM">3</field></shadow></value>
        <statement name="DO"><block type="epuck_move_forward">
          <field name="DURATION">1</field>
          <next><block type="epuck_turn_right"><field name="ANGLE">90</field></block></next>
        </block></statement>
        <next><block type="epuck_led_blink">
          <field name="TIMES">3</field><field name="COLOR">#7cfc00</field>
          <next><block type="epuck_stop"></block></next>
        </block></next>
      </block></next>
    </block></next>
  </block>
</xml>`
    },

    obstacle_avoidance: {
      label: 'Obstacle avoidance (Braitenberg)',
      xml: `<xml>
  <block type="controls_forever" x="50" y="50">
    <statement name="DO">
      <block type="epuck_braitenberg">
        <field name="SENS">1.5</field>
      </block>
    </statement>
  </block>
</xml>`
    },

    obstacle_avoidance_reactive: {
      label: 'Obstacle avoidance (reactive)',
      xml: `<xml>
  <variables>
    <variable id="ps_r">ps_r</variable>
    <variable id="ps_l">ps_l</variable>
  </variables>
  <block type="controls_forever" x="50" y="50">
    <statement name="DO">
      <block type="epuck_update_sensors">
        <next><block type="variables_set">
          <field name="VAR" id="ps_r">ps_r</field>
          <value name="VALUE"><block type="epuck_read_proximity">
            <field name="INDEX">0</field>
          </block></value>
          <next><block type="variables_set">
            <field name="VAR" id="ps_l">ps_l</field>
            <value name="VALUE"><block type="epuck_read_proximity">
              <field name="INDEX">7</field>
            </block></value>
            <next><block type="controls_if">
              <mutation elseif="1" else="1"></mutation>
              <value name="IF0"><block type="logic_compare">
                <field name="OP">GT</field>
                <value name="A"><block type="variables_get"><field name="VAR" id="ps_r">ps_r</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">500</field></block></value>
              </block></value>
              <statement name="DO0"><block type="epuck_set_motors_lr">
                <field name="LEFT">60</field><field name="RIGHT">-60</field>
              </block></statement>
              <value name="IF1"><block type="logic_compare">
                <field name="OP">GT</field>
                <value name="A"><block type="variables_get"><field name="VAR" id="ps_l">ps_l</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">500</field></block></value>
              </block></value>
              <statement name="DO1"><block type="epuck_set_motors_lr">
                <field name="LEFT">-60</field><field name="RIGHT">60</field>
              </block></statement>
              <statement name="ELSE"><block type="epuck_set_motors_lr">
                <field name="LEFT">60</field><field name="RIGHT">60</field>
              </block></statement>
            </block></next>
          </block></next>
        </block></next>
      </block>
    </statement>
  </block>
</xml>`
    },

    wall_following: {
      label: 'Wall following (right side)',
      xml: `<xml>
  <variables>
    <variable id="ACTIV">ACTIV</variable>
    <variable id="FRONT_THRESH">FRONT_THRESH</variable>
    <variable id="SPEED">SPEED</variable>
    <variable id="TURN_SPEED">TURN_SPEED</variable>
    <variable id="FOUND_WALL">FOUND_WALL</variable>
    <variable id="TURNING_RIGHT">TURNING_RIGHT</variable>
    <variable id="ps0">ps0</variable>
    <variable id="ps1">ps1</variable>
    <variable id="ps2">ps2</variable>
    <variable id="ps7">ps7</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="ACTIV">ACTIV</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">50</field></block></value>
    <next><block type="variables_set">
      <field name="VAR" id="FRONT_THRESH">FRONT_THRESH</field>
      <value name="VALUE"><block type="math_number"><field name="NUM">150</field></block></value>
      <next><block type="variables_set">
        <field name="VAR" id="SPEED">SPEED</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">60</field></block></value>
        <next><block type="variables_set">
          <field name="VAR" id="TURN_SPEED">TURN_SPEED</field>
          <value name="VALUE"><block type="math_number"><field name="NUM">40</field></block></value>
          <next><block type="variables_set">
            <field name="VAR" id="FOUND_WALL">FOUND_WALL</field>
            <value name="VALUE"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
            <next><block type="variables_set">
              <field name="VAR" id="TURNING_RIGHT">TURNING_RIGHT</field>
              <value name="VALUE"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>

              <next><block type="controls_forever">
                <statement name="DO">
                  <block type="epuck_update_sensors">
                    <next><block type="variables_set">
                      <field name="VAR" id="ps0">ps0</field>
                      <value name="VALUE"><block type="epuck_read_proximity"><field name="INDEX">0</field></block></value>
                      <next><block type="variables_set">
                        <field name="VAR" id="ps1">ps1</field>
                        <value name="VALUE"><block type="epuck_read_proximity"><field name="INDEX">1</field></block></value>
                        <next><block type="variables_set">
                          <field name="VAR" id="ps2">ps2</field>
                          <value name="VALUE"><block type="epuck_read_proximity"><field name="INDEX">2</field></block></value>
                          <next><block type="variables_set">
                            <field name="VAR" id="ps7">ps7</field>
                            <value name="VALUE"><block type="epuck_read_proximity"><field name="INDEX">7</field></block></value>

                            <next><block type="controls_if">
                              <mutation elseif="2" else="1"></mutation>

                              <!-- Case 1: front wall (ps0 or ps7 > FRONT_THRESH) → turn left -->
                              <value name="IF0"><block type="logic_operation">
                                <field name="OP">OR</field>
                                <value name="A"><block type="logic_compare">
                                  <field name="OP">GT</field>
                                  <value name="A"><block type="variables_get"><field name="VAR" id="ps0">ps0</field></block></value>
                                  <value name="B"><block type="variables_get"><field name="VAR" id="FRONT_THRESH">FRONT_THRESH</field></block></value>
                                </block></value>
                                <value name="B"><block type="logic_compare">
                                  <field name="OP">GT</field>
                                  <value name="A"><block type="variables_get"><field name="VAR" id="ps7">ps7</field></block></value>
                                  <value name="B"><block type="variables_get"><field name="VAR" id="FRONT_THRESH">FRONT_THRESH</field></block></value>
                                </block></value>
                              </block></value>
                              <statement name="DO0">
                                <block type="variables_set">
                                  <field name="VAR" id="TURNING_RIGHT">TURNING_RIGHT</field>
                                  <value name="VALUE"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
                                  <next><block type="epuck_set_motors_lr_val">
                                    <value name="LEFT"><block type="math_arithmetic">
                                      <field name="OP">MINUS</field>
                                      <value name="A"><block type="math_number"><field name="NUM">0</field></block></value>
                                      <value name="B"><block type="variables_get"><field name="VAR" id="TURN_SPEED">TURN_SPEED</field></block></value>
                                    </block></value>
                                    <value name="RIGHT"><block type="variables_get"><field name="VAR" id="TURN_SPEED">TURN_SPEED</field></block></value>
                                  </block></next>
                                </block>
                              </statement>

                              <!-- Case 2: wall lost (ps1 < ACTIV and FOUND_WALL) → start turning right -->
                              <value name="IF1"><block type="logic_operation">
                                <field name="OP">AND</field>
                                <value name="A"><block type="logic_compare">
                                  <field name="OP">LT</field>
                                  <value name="A"><block type="variables_get"><field name="VAR" id="ps1">ps1</field></block></value>
                                  <value name="B"><block type="variables_get"><field name="VAR" id="ACTIV">ACTIV</field></block></value>
                                </block></value>
                                <value name="B"><block type="variables_get"><field name="VAR" id="FOUND_WALL">FOUND_WALL</field></block></value>
                              </block></value>
                              <statement name="DO1">
                                <block type="variables_set">
                                  <field name="VAR" id="TURNING_RIGHT">TURNING_RIGHT</field>
                                  <value name="VALUE"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
                                </block>
                              </statement>

                              <!-- Case 3: TURNING_RIGHT → keep turning until ps1 or ps2 sees wall -->
                              <value name="IF2"><block type="variables_get"><field name="VAR" id="TURNING_RIGHT">TURNING_RIGHT</field></block></value>
                              <statement name="DO2">
                                <block type="controls_if">
                                  <mutation else="1"></mutation>
                                  <value name="IF0"><block type="logic_operation">
                                    <field name="OP">OR</field>
                                    <value name="A"><block type="logic_compare">
                                      <field name="OP">GT</field>
                                      <value name="A"><block type="variables_get"><field name="VAR" id="ps1">ps1</field></block></value>
                                      <value name="B"><block type="variables_get"><field name="VAR" id="ACTIV">ACTIV</field></block></value>
                                    </block></value>
                                    <value name="B"><block type="logic_compare">
                                      <field name="OP">GT</field>
                                      <value name="A"><block type="variables_get"><field name="VAR" id="ps2">ps2</field></block></value>
                                      <value name="B"><block type="variables_get"><field name="VAR" id="ACTIV">ACTIV</field></block></value>
                                    </block></value>
                                  </block></value>
                                  <statement name="DO0">
                                    <block type="variables_set">
                                      <field name="VAR" id="TURNING_RIGHT">TURNING_RIGHT</field>
                                      <value name="VALUE"><block type="logic_boolean"><field name="BOOL">FALSE</field></block></value>
                                    </block>
                                  </statement>
                                  <statement name="ELSE">
                                    <block type="epuck_set_motors_lr_val">
                                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="TURN_SPEED">TURN_SPEED</field></block></value>
                                      <value name="RIGHT"><block type="math_number"><field name="NUM">0</field></block></value>
                                    </block>
                                  </statement>
                                </block>
                              </statement>

                              <!-- Else: go straight, set FOUND_WALL if ps1 active -->
                              <statement name="ELSE">
                                <block type="controls_if">
                                  <value name="IF0"><block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A"><block type="variables_get"><field name="VAR" id="ps1">ps1</field></block></value>
                                    <value name="B"><block type="variables_get"><field name="VAR" id="ACTIV">ACTIV</field></block></value>
                                  </block></value>
                                  <statement name="DO0">
                                    <block type="variables_set">
                                      <field name="VAR" id="FOUND_WALL">FOUND_WALL</field>
                                      <value name="VALUE"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
                                    </block>
                                  </statement>
                                  <next><block type="epuck_set_motors_lr_val">
                                    <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                                    <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                                  </block></next>
                                </block>
                              </statement>

                            </block></next>
                          </block></next>
                        </block></next>
                      </block></next>
                    </block></next>
                  </block>
                </statement>
              </block></next>
            </block></next>
          </block></next>
        </block></next>
      </block></next>
    </block>
  </block>
</xml>`
    },
    line_following: {
      label: 'Line following',
      xml: `<xml>
  <variables>
    <variable id="SPEED_FAST">SPEED_FAST</variable>
    <variable id="SPEED_SLOW">SPEED_SLOW</variable>
    <variable id="THRESHOLD">THRESHOLD</variable>
    <variable id="gs_left">gs_left</variable>
    <variable id="gs_right">gs_right</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="SPEED_FAST">SPEED_FAST</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">60</field></block></value>
    <next><block type="variables_set">
      <field name="VAR" id="SPEED_SLOW">SPEED_SLOW</field>
      <value name="VALUE"><block type="math_number"><field name="NUM">15</field></block></value>
      <next><block type="variables_set">
        <field name="VAR" id="THRESHOLD">THRESHOLD</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">500</field></block></value>

        <next><block type="controls_forever">
          <statement name="DO">
            <block type="epuck_update_sensors">
              <next><block type="variables_set">
                <field name="VAR" id="gs_left">gs_left</field>
                <value name="VALUE"><block type="epuck_read_ground">
                  <field name="SIDE">left</field>
                </block></value>
                <next><block type="variables_set">
                  <field name="VAR" id="gs_right">gs_right</field>
                  <value name="VALUE"><block type="epuck_read_ground">
                    <field name="SIDE">right</field>
                  </block></value>

                  <next><block type="controls_if">
                    <mutation elseif="2" else="1"></mutation>

                    <!-- Left sensor on black, right on white → line is to the left → turn left -->
                    <value name="IF0"><block type="logic_operation">
                      <field name="OP">AND</field>
                      <value name="A"><block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_left">gs_left</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                      <value name="B"><block type="logic_compare">
                        <field name="OP">GT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_right">gs_right</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                    </block></value>
                    <statement name="DO0"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_SLOW">SPEED_SLOW</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FAST">SPEED_FAST</field></block></value>
                    </block></statement>

                    <!-- Right sensor on black, left on white → line is to the right → turn right -->
                    <value name="IF1"><block type="logic_operation">
                      <field name="OP">AND</field>
                      <value name="A"><block type="logic_compare">
                        <field name="OP">GT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_left">gs_left</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                      <value name="B"><block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_right">gs_right</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                    </block></value>
                    <statement name="DO1"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FAST">SPEED_FAST</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_SLOW">SPEED_SLOW</field></block></value>
                    </block></statement>

                    <!-- Both on black → intersection or thick line → go straight -->
                    <value name="IF2"><block type="logic_operation">
                      <field name="OP">AND</field>
                      <value name="A"><block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_left">gs_left</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                      <value name="B"><block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_right">gs_right</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                    </block></value>
                    <statement name="DO2"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FAST">SPEED_FAST</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FAST">SPEED_FAST</field></block></value>
                    </block></statement>

                    <!-- Both on white → lost the line → go straight and hope to find it -->
                    <statement name="ELSE"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FAST">SPEED_FAST</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FAST">SPEED_FAST</field></block></value>
                    </block></statement>

                  </block></next>
                </block></next>
              </block></next>
            </block>
          </statement>
        </block></next>
      </block></next>
    </block>
  </block>
</xml>`
    },

    area_confinement: {
      label: 'Area confinement (boundary avoidance)',
      xml: `<xml>
  <variables>
    <variable id="SPEED_FWD">SPEED_FWD</variable>
    <variable id="SPEED_TURN">SPEED_TURN</variable>
    <variable id="THRESHOLD">THRESHOLD</variable>
    <variable id="gs_left">gs_left</variable>
    <variable id="gs_right">gs_right</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="SPEED_FWD">SPEED_FWD</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">50</field></block></value>
    <next><block type="variables_set">
      <field name="VAR" id="SPEED_TURN">SPEED_TURN</field>
      <value name="VALUE"><block type="math_number"><field name="NUM">60</field></block></value>
      <next><block type="variables_set">
        <field name="VAR" id="THRESHOLD">THRESHOLD</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">500</field></block></value>

        <next><block type="controls_forever">
          <statement name="DO">
            <block type="epuck_update_sensors">
              <next><block type="variables_set">
                <field name="VAR" id="gs_left">gs_left</field>
                <value name="VALUE"><block type="epuck_read_ground">
                  <field name="SIDE">left</field>
                </block></value>
                <next><block type="variables_set">
                  <field name="VAR" id="gs_right">gs_right</field>
                  <value name="VALUE"><block type="epuck_read_ground">
                    <field name="SIDE">right</field>
                  </block></value>

                  <next><block type="controls_if">
                    <mutation elseif="2" else="1"></mutation>

                    <!-- Both sensors on black boundary → back up then turn around -->
                    <value name="IF0"><block type="logic_operation">
                      <field name="OP">AND</field>
                      <value name="A"><block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_left">gs_left</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                      <value name="B"><block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="gs_right">gs_right</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                      </block></value>
                    </block></value>
                    <statement name="DO0">
                      <block type="epuck_move_backward">
                        <field name="DURATION">0.3</field>
                        <next><block type="epuck_turn_right">
                          <field name="ANGLE">180</field>
                        </block></next>
                      </block>
                    </statement>

                    <!-- Left sensor on black → boundary on left → turn right -->
                    <value name="IF1"><block type="logic_compare">
                      <field name="OP">LT</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="gs_left">gs_left</field></block></value>
                      <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                    </block></value>
                    <statement name="DO1">
                      <block type="epuck_move_backward">
                        <field name="DURATION">0.2</field>
                        <next><block type="epuck_turn_right">
                          <field name="ANGLE">90</field>
                        </block></next>
                      </block>
                    </statement>

                    <!-- Right sensor on black → boundary on right → turn left -->
                    <value name="IF2"><block type="logic_compare">
                      <field name="OP">LT</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="gs_right">gs_right</field></block></value>
                      <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                    </block></value>
                    <statement name="DO2">
                      <block type="epuck_move_backward">
                        <field name="DURATION">0.2</field>
                        <next><block type="epuck_turn_left">
                          <field name="ANGLE">90</field>
                        </block></next>
                      </block>
                    </statement>

                    <!-- All white → inside arena → go forward -->
                    <statement name="ELSE"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FWD">SPEED_FWD</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FWD">SPEED_FWD</field></block></value>
                    </block></statement>

                  </block></next>
                </block></next>
              </block></next>
            </block>
          </statement>
        </block></next>
      </block></next>
    </block>
  </block>
</xml>`
    }
,
    distance_keeper: {
      label: 'Distance keeper (ToF)',
      xml: `<xml>
  <variables>
    <variable id="TARGET_MM">TARGET_MM</variable>
    <variable id="DEAD_ZONE">DEAD_ZONE</variable>
    <variable id="SPEED_FWD">SPEED_FWD</variable>
    <variable id="SPEED_BACK">SPEED_BACK</variable>
    <variable id="dist">dist</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="TARGET_MM">TARGET_MM</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">200</field></block></value>
    <next><block type="variables_set">
      <field name="VAR" id="DEAD_ZONE">DEAD_ZONE</field>
      <value name="VALUE"><block type="math_number"><field name="NUM">30</field></block></value>
      <next><block type="variables_set">
        <field name="VAR" id="SPEED_FWD">SPEED_FWD</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">40</field></block></value>
        <next><block type="variables_set">
          <field name="VAR" id="SPEED_BACK">SPEED_BACK</field>
          <value name="VALUE"><block type="math_number"><field name="NUM">-40</field></block></value>

          <next><block type="controls_forever">
            <statement name="DO">
              <block type="epuck_update_sensors">
                <next><block type="variables_set">
                  <field name="VAR" id="dist">dist</field>
                  <value name="VALUE"><block type="epuck_read_tof"></block></value>

                  <next><block type="controls_if">
                    <mutation elseif="3" else="1"></mutation>

                    <!-- Sensor out of range → no object → move forward to find one -->
                    <value name="IF0"><block type="logic_compare">
                      <field name="OP">EQ</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                      <value name="B"><block type="math_number"><field name="NUM">-1</field></block></value>
                    </block></value>
                    <statement name="DO0"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FWD">SPEED_FWD</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FWD">SPEED_FWD</field></block></value>
                    </block></statement>

                    <!-- Too close: dist < TARGET - DEAD_ZONE → back up -->
                    <value name="IF1"><block type="logic_compare">
                      <field name="OP">LT</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                      <value name="B"><block type="math_arithmetic">
                        <field name="OP">MINUS</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="TARGET_MM">TARGET_MM</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="DEAD_ZONE">DEAD_ZONE</field></block></value>
                      </block></value>
                    </block></value>
                    <statement name="DO1"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_BACK">SPEED_BACK</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_BACK">SPEED_BACK</field></block></value>
                    </block></statement>

                    <!-- Too far: dist > TARGET + DEAD_ZONE → move forward -->
                    <value name="IF2"><block type="logic_compare">
                      <field name="OP">GT</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                      <value name="B"><block type="math_arithmetic">
                        <field name="OP">ADD</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="TARGET_MM">TARGET_MM</field></block></value>
                        <value name="B"><block type="variables_get"><field name="VAR" id="DEAD_ZONE">DEAD_ZONE</field></block></value>
                      </block></value>
                    </block></value>
                    <statement name="DO2"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FWD">SPEED_FWD</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FWD">SPEED_FWD</field></block></value>
                    </block></statement>

                    <!-- Inside dead zone → stop -->
                    <value name="IF3"><block type="logic_operation">
                      <field name="OP">AND</field>
                      <value name="A"><block type="logic_compare">
                        <field name="OP">GTE</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                        <value name="B"><block type="math_arithmetic">
                          <field name="OP">MINUS</field>
                          <value name="A"><block type="variables_get"><field name="VAR" id="TARGET_MM">TARGET_MM</field></block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="DEAD_ZONE">DEAD_ZONE</field></block></value>
                        </block></value>
                      </block></value>
                      <value name="B"><block type="logic_compare">
                        <field name="OP">LTE</field>
                        <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                        <value name="B"><block type="math_arithmetic">
                          <field name="OP">ADD</field>
                          <value name="A"><block type="variables_get"><field name="VAR" id="TARGET_MM">TARGET_MM</field></block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="DEAD_ZONE">DEAD_ZONE</field></block></value>
                        </block></value>
                      </block></value>
                    </block></value>
                    <statement name="DO3"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="math_number"><field name="NUM">0</field></block></value>
                      <value name="RIGHT"><block type="math_number"><field name="NUM">0</field></block></value>
                    </block></statement>

                    <!-- Fallback else → stop -->
                    <statement name="ELSE"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="math_number"><field name="NUM">0</field></block></value>
                      <value name="RIGHT"><block type="math_number"><field name="NUM">0</field></block></value>
                    </block></statement>

                  </block></next>
                </block></next>
              </block></next>
            </block>
          </statement>
        </block></next>
      </block></next>
    </block></next>
  </block>
</xml>`
    },
    speed_controller: {
      label: 'Speed controller (ToF — proportional)',
      xml: `<xml>
  <variables>
    <variable id="STOP_MM">STOP_MM</variable>
    <variable id="FULL_MM">FULL_MM</variable>
    <variable id="SPEED_FULL">SPEED_FULL</variable>
    <variable id="SPEED_SLOW">SPEED_SLOW</variable>
    <variable id="dist">dist</variable>
    <variable id="speed">speed</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="STOP_MM">STOP_MM</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">100</field></block></value>
    <next><block type="variables_set">
      <field name="VAR" id="FULL_MM">FULL_MM</field>
      <value name="VALUE"><block type="math_number"><field name="NUM">600</field></block></value>
      <next><block type="variables_set">
        <field name="VAR" id="SPEED_FULL">SPEED_FULL</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">70</field></block></value>
        <next><block type="variables_set">
          <field name="VAR" id="SPEED_SLOW">SPEED_SLOW</field>
          <value name="VALUE"><block type="math_number"><field name="NUM">10</field></block></value>

          <next><block type="controls_forever">
            <statement name="DO">
              <block type="epuck_update_sensors">
                <next><block type="variables_set">
                  <field name="VAR" id="dist">dist</field>
                  <value name="VALUE"><block type="epuck_read_tof"></block></value>

                  <next><block type="controls_if">
                    <mutation elseif="2" else="1"></mutation>

                    <!-- Nothing in range → full speed -->
                    <value name="IF0"><block type="logic_compare">
                      <field name="OP">EQ</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                      <value name="B"><block type="math_number"><field name="NUM">-1</field></block></value>
                    </block></value>
                    <statement name="DO0"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FULL">SPEED_FULL</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FULL">SPEED_FULL</field></block></value>
                    </block></statement>

                    <!-- Too close → stop -->
                    <value name="IF1"><block type="logic_compare">
                      <field name="OP">LT</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                      <value name="B"><block type="variables_get"><field name="VAR" id="STOP_MM">STOP_MM</field></block></value>
                    </block></value>
                    <statement name="DO1"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="math_number"><field name="NUM">0</field></block></value>
                      <value name="RIGHT"><block type="math_number"><field name="NUM">0</field></block></value>
                    </block></statement>

                    <!-- Far away → full speed -->
                    <value name="IF2"><block type="logic_compare">
                      <field name="OP">GT</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                      <value name="B"><block type="variables_get"><field name="VAR" id="FULL_MM">FULL_MM</field></block></value>
                    </block></value>
                    <statement name="DO2"><block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED_FULL">SPEED_FULL</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED_FULL">SPEED_FULL</field></block></value>
                    </block></statement>

                    <!-- In range → proportional speed: SPEED_SLOW + (dist-STOP) / (FULL-STOP) * (SPEED_FULL-SPEED_SLOW) -->
                    <statement name="ELSE"><block type="variables_set">
                      <field name="VAR" id="speed">speed</field>
                      <value name="VALUE"><block type="math_arithmetic">
                          <field name="OP">ADD</field>
                          <value name="A"><block type="math_arithmetic">
                            <field name="OP">MULTIPLY</field>
                            <value name="A"><block type="math_arithmetic">
                              <field name="OP">DIVIDE</field>
                              <value name="A"><block type="math_arithmetic">
                                <field name="OP">MINUS</field>
                                <value name="A"><block type="variables_get"><field name="VAR" id="dist">dist</field></block></value>
                                <value name="B"><block type="variables_get"><field name="VAR" id="STOP_MM">STOP_MM</field></block></value>
                              </block></value>
                              <value name="B"><block type="math_arithmetic">
                                <field name="OP">MINUS</field>
                                <value name="A"><block type="variables_get"><field name="VAR" id="FULL_MM">FULL_MM</field></block></value>
                                <value name="B"><block type="variables_get"><field name="VAR" id="STOP_MM">STOP_MM</field></block></value>
                              </block></value>
                            </block></value>
                            <value name="B"><block type="math_arithmetic">
                              <field name="OP">MINUS</field>
                              <value name="A"><block type="variables_get"><field name="VAR" id="SPEED_FULL">SPEED_FULL</field></block></value>
                              <value name="B"><block type="variables_get"><field name="VAR" id="SPEED_SLOW">SPEED_SLOW</field></block></value>
                            </block></value>
                          </block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="SPEED_SLOW">SPEED_SLOW</field></block></value>
                        </block></value>
                      <next><block type="epuck_set_motors_lr_val">
                        <value name="LEFT"><block type="variables_get"><field name="VAR" id="speed">speed</field></block></value>
                        <value name="RIGHT"><block type="variables_get"><field name="VAR" id="speed">speed</field></block></value>
                      </block></next>
                    </block></statement>

                  </block></next>
                </block></next>
              </block>
            </statement>
          </block></next>
        </block></next>
      </block></next>
    </block>
  </block>
</xml>`
    },
    object_finder: {
      label: 'Object finder (AI camera)',
      xml: `<xml>
  <variables>
    <variable id="INTERVAL_S">INTERVAL_S</variable>
    <variable id="description">description</variable>
    <variable id="timer">timer</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="INTERVAL_S">INTERVAL_S</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">4</field></block></value>
    <next><block type="epuck_camera_open">
      <field name="DEVICE">1</field>
      <next><block type="variables_set">
        <field name="VAR" id="timer">timer</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>

        <next><block type="controls_forever">
          <statement name="DO">
            <block type="epuck_update_sensors">
              <next><block type="controls_if">
                <mutation else="1"></mutation>

                <!-- Every INTERVAL_S seconds: ask AI and log result -->
                <value name="IF0"><block type="logic_compare">
                  <field name="OP">GTE</field>
                  <value name="A"><block type="variables_get"><field name="VAR" id="timer">timer</field></block></value>
                  <value name="B"><block type="variables_get"><field name="VAR" id="INTERVAL_S">INTERVAL_S</field></block></value>
                </block></value>
                <statement name="DO0">
                  <block type="variables_set">
                    <field name="VAR" id="description">description</field>
                    <value name="VALUE"><block type="epuck_camera_ai_describe"></block></value>
                    <next><block type="epuck_print">
                      <value name="VALUE"><block type="variables_get"><field name="VAR" id="description">description</field></block></value>
                      <next><block type="variables_set">
                        <field name="VAR" id="timer">timer</field>
                        <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
                      </block></next>
                    </block></next>
                  </block>
                </statement>

                <!-- Waiting: count up using timestep -->
                <statement name="ELSE">
                  <block type="variables_set">
                    <field name="VAR" id="timer">timer</field>
                    <value name="VALUE"><block type="math_arithmetic">
                      <field name="OP">ADD</field>
                      <value name="A"><block type="variables_get"><field name="VAR" id="timer">timer</field></block></value>
                      <value name="B"><block type="math_arithmetic">
                        <field name="OP">DIVIDE</field>
                        <value name="A"><block type="math_number"><field name="NUM">32</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">1000</field></block></value>
                      </block></value>
                    </block></value>
                  </block>
                </statement>

              </block></next>
            </block>
          </statement>
        </block></next>
      </block></next>
    </block></next>
  </block>
</xml>`
    },
    follow_the_light: {
      label: 'Follow the light (camera)',
      xml: `<xml>
  <variables>
    <variable id="SPEED">SPEED</variable>
    <variable id="THRESHOLD">THRESHOLD</variable>
    <variable id="bl">bl</variable>
    <variable id="bc">bc</variable>
    <variable id="br">br</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="SPEED">SPEED</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">50</field></block></value>
    <next><block type="variables_set">
      <field name="VAR" id="THRESHOLD">THRESHOLD</field>
      <value name="VALUE"><block type="math_number"><field name="NUM">10</field></block></value>
      <next><block type="epuck_camera_open">
        <field name="DEVICE">1</field>

        <next><block type="controls_forever">
          <statement name="DO">
            <block type="epuck_update_sensors">
              <next><block type="variables_set">
                <field name="VAR" id="bl">bl</field>
                <value name="VALUE"><block type="epuck_camera_region_brightness">
                  <field name="REGION">bright_left</field>
                </block></value>
                <next><block type="variables_set">
                  <field name="VAR" id="bc">bc</field>
                  <value name="VALUE"><block type="epuck_camera_region_brightness">
                    <field name="REGION">bright_center</field>
                  </block></value>
                  <next><block type="variables_set">
                    <field name="VAR" id="br">br</field>
                    <value name="VALUE"><block type="epuck_camera_region_brightness">
                      <field name="REGION">bright_right</field>
                    </block></value>

                    <next><block type="controls_if">
                      <mutation elseif="2" else="1"></mutation>

                      <!-- Left is brightest → turn left -->
                      <value name="IF0"><block type="logic_operation">
                        <field name="OP">AND</field>
                        <value name="A"><block type="logic_compare">
                          <field name="OP">GT</field>
                          <value name="A"><block type="variables_get"><field name="VAR" id="bl">bl</field></block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="br">br</field></block></value>
                        </block></value>
                        <value name="B"><block type="logic_compare">
                          <field name="OP">GT</field>
                          <value name="A"><block type="math_arithmetic">
                            <field name="OP">MINUS</field>
                            <value name="A"><block type="variables_get"><field name="VAR" id="bl">bl</field></block></value>
                            <value name="B"><block type="variables_get"><field name="VAR" id="br">br</field></block></value>
                          </block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                        </block></value>
                      </block></value>
                      <statement name="DO0"><block type="epuck_set_motors_lr_val">
                        <value name="LEFT"><block type="math_number"><field name="NUM">0</field></block></value>
                        <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                      </block></statement>

                      <!-- Right is brightest → turn right -->
                      <value name="IF1"><block type="logic_operation">
                        <field name="OP">AND</field>
                        <value name="A"><block type="logic_compare">
                          <field name="OP">GT</field>
                          <value name="A"><block type="variables_get"><field name="VAR" id="br">br</field></block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="bl">bl</field></block></value>
                        </block></value>
                        <value name="B"><block type="logic_compare">
                          <field name="OP">GT</field>
                          <value name="A"><block type="math_arithmetic">
                            <field name="OP">MINUS</field>
                            <value name="A"><block type="variables_get"><field name="VAR" id="br">br</field></block></value>
                            <value name="B"><block type="variables_get"><field name="VAR" id="bl">bl</field></block></value>
                          </block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="THRESHOLD">THRESHOLD</field></block></value>
                        </block></value>
                      </block></value>
                      <statement name="DO1"><block type="epuck_set_motors_lr_val">
                        <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                        <value name="RIGHT"><block type="math_number"><field name="NUM">0</field></block></value>
                      </block></statement>

                      <!-- Center is brightest → go straight -->
                      <value name="IF2"><block type="logic_operation">
                        <field name="OP">AND</field>
                        <value name="A"><block type="logic_compare">
                          <field name="OP">GTE</field>
                          <value name="A"><block type="variables_get"><field name="VAR" id="bc">bc</field></block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="bl">bl</field></block></value>
                        </block></value>
                        <value name="B"><block type="logic_compare">
                          <field name="OP">GTE</field>
                          <value name="A"><block type="variables_get"><field name="VAR" id="bc">bc</field></block></value>
                          <value name="B"><block type="variables_get"><field name="VAR" id="br">br</field></block></value>
                        </block></value>
                      </block></value>
                      <statement name="DO2"><block type="epuck_set_motors_lr_val">
                        <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                        <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                      </block></statement>

                      <!-- All similar brightness → stop and wait -->
                      <statement name="ELSE"><block type="epuck_set_motors_lr_val">
                        <value name="LEFT"><block type="math_number"><field name="NUM">0</field></block></value>
                        <value name="RIGHT"><block type="math_number"><field name="NUM">0</field></block></value>
                      </block></statement>

                    </block></next>
                  </block></next>
                </block></next>
              </block></next>
            </block>
          </statement>
        </block></next>
      </block></next>
    </block>
  </block>
</xml>`
    },
    color_detector: {
      label: 'Color detector (camera)',
      xml: `<xml>
  <block type="epuck_camera_open" x="50" y="50">
    <field name="DEVICE">1</field>
    <next><block type="controls_forever">
      <statement name="DO">
        <block type="epuck_update_sensors">
          <next><block type="controls_if">
            <mutation elseif="3" else="1"></mutation>
            <value name="IF0"><block type="logic_compare">
              <field name="OP">EQ</field>
              <value name="A"><block type="epuck_camera_dominant"></block></value>
              <value name="B"><block type="text"><field name="TEXT">red</field></block></value>
            </block></value>
            <statement name="DO0"><block type="epuck_led_on"><field name="LED_NUM">4</field><field name="COLOR">#ff0000</field><next><block type="epuck_led_on"><field name="LED_NUM">5</field><field name="COLOR">#ff0000</field><next><block type="epuck_led_on"><field name="LED_NUM">6</field><field name="COLOR">#ff0000</field><next><block type="epuck_led_on"><field name="LED_NUM">7</field><field name="COLOR">#ff0000</field></block></next></block></next></block></next></block></statement>
            <value name="IF1"><block type="logic_compare">
              <field name="OP">EQ</field>
              <value name="A"><block type="epuck_camera_dominant"></block></value>
              <value name="B"><block type="text"><field name="TEXT">green</field></block></value>
            </block></value>
            <statement name="DO1"><block type="epuck_led_on"><field name="LED_NUM">4</field><field name="COLOR">#00ff00</field><next><block type="epuck_led_on"><field name="LED_NUM">5</field><field name="COLOR">#00ff00</field><next><block type="epuck_led_on"><field name="LED_NUM">6</field><field name="COLOR">#00ff00</field><next><block type="epuck_led_on"><field name="LED_NUM">7</field><field name="COLOR">#00ff00</field></block></next></block></next></block></next></block></statement>
            <value name="IF2"><block type="logic_compare">
              <field name="OP">EQ</field>
              <value name="A"><block type="epuck_camera_dominant"></block></value>
              <value name="B"><block type="text"><field name="TEXT">blue</field></block></value>
            </block></value>
            <statement name="DO2"><block type="epuck_led_on"><field name="LED_NUM">4</field><field name="COLOR">#0000ff</field><next><block type="epuck_led_on"><field name="LED_NUM">5</field><field name="COLOR">#0000ff</field><next><block type="epuck_led_on"><field name="LED_NUM">6</field><field name="COLOR">#0000ff</field><next><block type="epuck_led_on"><field name="LED_NUM">7</field><field name="COLOR">#0000ff</field></block></next></block></next></block></next></block></statement>
            <value name="IF3"><block type="logic_compare">
              <field name="OP">EQ</field>
              <value name="A"><block type="epuck_camera_dominant"></block></value>
              <value name="B"><block type="text"><field name="TEXT">bright</field></block></value>
            </block></value>
            <statement name="DO3"><block type="epuck_led_on"><field name="LED_NUM">4</field><field name="COLOR">#ffffff</field><next><block type="epuck_led_on"><field name="LED_NUM">5</field><field name="COLOR">#ffffff</field><next><block type="epuck_led_on"><field name="LED_NUM">6</field><field name="COLOR">#ffffff</field><next><block type="epuck_led_on"><field name="LED_NUM">7</field><field name="COLOR">#ffffff</field></block></next></block></next></block></next></block></statement>
            <statement name="ELSE"><block type="epuck_led_all_off"></block></statement>
          </block></next>
        </block>
      </statement>
    </block></next>
  </block>
</xml>`
    },
    spot_rush: {
      label: '🏁 Spot Rush — race program',
      xml: `<xml>
  <variables>
    <variable id="SPEED">SPEED</variable>
    <variable id="GS_THRESH">GS_THRESH</variable>
    <variable id="PS_THRESH">PS_THRESH</variable>
    <variable id="spot1_done">spot1_done</variable>
    <variable id="spot2_done">spot2_done</variable>
    <variable id="spot3_done">spot3_done</variable>
    <variable id="on_spot_count">on_spot_count</variable>
    <variable id="coll_time">coll_time</variable>
    <variable id="next_spot">next_spot</variable>
    <variable id="ps_max">ps_max</variable>
    <variable id="gs_l">gs_l</variable>
    <variable id="gs_c">gs_c</variable>
    <variable id="gs_r">gs_r</variable>
  </variables>

  <block type="variables_set" x="50" y="50">
    <field name="VAR" id="SPEED">SPEED</field>
    <value name="VALUE"><block type="math_number"><field name="NUM">50</field></block></value>
    <next><block type="variables_set">
      <field name="VAR" id="GS_THRESH">GS_THRESH</field>
      <value name="VALUE"><block type="math_number"><field name="NUM">500</field></block></value>
      <next><block type="variables_set">
        <field name="VAR" id="PS_THRESH">PS_THRESH</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">800</field></block></value>
        <next><block type="variables_set">
          <field name="VAR" id="next_spot">next_spot</field>
          <value name="VALUE"><block type="math_number"><field name="NUM">1</field></block></value>
          <next><block type="variables_set">
            <field name="VAR" id="on_spot_count">on_spot_count</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
            <next><block type="variables_set">
              <field name="VAR" id="coll_time">coll_time</field>
              <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>

              <next><block type="controls_forever">
                <statement name="DO">
                  <block type="epuck_update_sensors">
                    <next>

                    <!-- Read ground sensors -->
                    <block type="variables_set">
                      <field name="VAR" id="gs_l">gs_l</field>
                      <value name="VALUE"><block type="epuck_read_ground"><field name="SIDE">left</field></block></value>
                      <next><block type="variables_set">
                        <field name="VAR" id="gs_c">gs_c</field>
                        <value name="VALUE"><block type="epuck_read_ground"><field name="SIDE">center</field></block></value>
                        <next><block type="variables_set">
                          <field name="VAR" id="ps_max">ps_max</field>
                          <value name="VALUE"><block type="epuck_read_proximity"><field name="INDEX">0</field></block></value>

                          <next><block type="controls_if">
                            <mutation elseif="1"></mutation>

                            <!-- Collision detection -->
                            <value name="IF0"><block type="logic_compare">
                              <field name="OP">GT</field>
                              <value name="A"><block type="variables_get"><field name="VAR" id="ps_max">ps_max</field></block></value>
                              <value name="B"><block type="variables_get"><field name="VAR" id="PS_THRESH">PS_THRESH</field></block></value>
                            </block></value>
                            <statement name="DO0">
                              <block type="epuck_print">
                                <value name="VALUE"><block type="text"><field name="TEXT">COLLISION</field></block></value>
                              </block>
                            </statement>

                            <!-- Spot detection -->
                            <value name="IF1"><block type="logic_operation">
                              <field name="OP">OR</field>
                              <value name="A"><block type="logic_compare">
                                <field name="OP">LT</field>
                                <value name="A"><block type="variables_get"><field name="VAR" id="gs_l">gs_l</field></block></value>
                                <value name="B"><block type="variables_get"><field name="VAR" id="GS_THRESH">GS_THRESH</field></block></value>
                              </block></value>
                              <value name="B"><block type="logic_compare">
                                <field name="OP">LT</field>
                                <value name="A"><block type="variables_get"><field name="VAR" id="gs_c">gs_c</field></block></value>
                                <value name="B"><block type="variables_get"><field name="VAR" id="GS_THRESH">GS_THRESH</field></block></value>
                              </block></value>
                            </block></value>
                            <statement name="DO1">
                              <block type="variables_set">
                                <field name="VAR" id="on_spot_count">on_spot_count</field>
                                <value name="VALUE"><block type="math_arithmetic">
                                  <field name="OP">ADD</field>
                                  <value name="A"><block type="variables_get"><field name="VAR" id="on_spot_count">on_spot_count</field></block></value>
                                  <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                </block></value>
                                <next><block type="controls_if">
                                  <value name="IF0"><block type="logic_compare">
                                    <field name="OP">GTE</field>
                                    <value name="A"><block type="variables_get"><field name="VAR" id="on_spot_count">on_spot_count</field></block></value>
                                    <value name="B"><block type="math_number"><field name="NUM">3</field></block></value>
                                  </block></value>
                                  <statement name="DO0">
                                    <block type="epuck_print">
                                      <value name="VALUE"><block type="text_join">
                                        <mutation items="2"></mutation>
                                        <value name="ADD0"><block type="text"><field name="TEXT">SPOT:</field></block></value>
                                        <value name="ADD1"><block type="variables_get"><field name="VAR" id="next_spot">next_spot</field></block></value>
                                      </block></value>
                                      <next><block type="variables_set">
                                        <field name="VAR" id="next_spot">next_spot</field>
                                        <value name="VALUE"><block type="math_arithmetic">
                                          <field name="OP">ADD</field>
                                          <value name="A"><block type="variables_get"><field name="VAR" id="next_spot">next_spot</field></block></value>
                                          <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                        </block></value>
                                        <next><block type="variables_set">
                                          <field name="VAR" id="on_spot_count">on_spot_count</field>
                                          <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
                                        </block></next>
                                      </block></next>
                                    </block>
                                  </statement>
                                </block></next>
                              </block>
                            </statement>

                          </block></next>
                        </block></next>
                      </block></next>
                    </block></next>

                    <!-- Drive forward — students replace with their navigation code -->
                    <block type="epuck_set_motors_lr_val">
                      <value name="LEFT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                      <value name="RIGHT"><block type="variables_get"><field name="VAR" id="SPEED">SPEED</field></block></value>
                    </block>

                    </next>
                  </block>
                </statement>
              </block></next>
            </block></next>
          </block></next>
        </block></next>
      </block></next>
    </block>
  </block>
</xml>`
    }
  };
}

function saveWorkspace() {
  const xml = Blockly.Xml.workspaceToDom(workspace);
  const xmlText = Blockly.Xml.domToPrettyText(xml);
  const blob = new Blob([xmlText], { type: 'text/xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  // Use timestamp for filename so multiple saves don't overwrite
  const ts = new Date().toISOString().slice(0,16).replace('T','_').replace(':','-');
  a.download = 'epuck_program_' + ts + '.xml';
  a.click();
  URL.revokeObjectURL(a.href);
  addLog('💾 Workspace saved to file', 'info');
}

function loadWorkspaceFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      clearWorkspace();
      const xml = Blockly.utils.xml.textToDom(e.target.result);
      Blockly.Xml.domToWorkspace(xml, workspace);
      addLog('📂 Workspace loaded: ' + file.name, 'info');
    } catch(err) {
      addLog('❌ Failed to load: ' + err.message, 'error');
    }
    // Reset input so the same file can be loaded again
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ─── LED CONTROL PANEL ──────────────────────────────────────────────────────
// e-puck2 has two LED types:
//   Binary: LED1, LED3, LED5, LED7 → on/off only (bitmask byte 5)
//   RGB:    LED2, LED4, LED6, LED8 → R,G,B 0-100 (bytes 6-17)

const binaryLedStates = [false, false, false, false];   // LED1,3,5,7
const rgbLedStates    = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]]; // LED2,4,6,8
const RGB_COLORS = ['#ff4444', '#44ff44', '#4488ff', '#ffff44']; // default colors per slot

// Build binary LED tiles
(function buildBinaryGrid() {
  const grid = document.getElementById('ledGridBinary');
  const names = ['LED1','LED3','LED5','LED7'];
  for (let i = 0; i < 4; i++) {
    const tile = document.createElement('div');
    tile.className = 'led-toggle';
    tile.id = 'binLed' + i;
    tile.innerHTML = '<div class="led-bulb" id="binBulb'+i+'"></div><span class="led-num">'+names[i]+'</span>';
    tile.onclick = (function(idx){ return function(){ toggleBinaryLed(idx); }; })(i);
    grid.appendChild(tile);
  }
})();

// Build RGB LED slider cards
const _rgbTimers = [null, null, null, null];

(function buildRgbSliders() {
  const container = document.getElementById('ledGridRgb');
  const names = ['LED2', 'LED4', 'LED6', 'LED8'];
  for (let i = 0; i < 4; i++) {
    const card = document.createElement('div');
    card.className = 'rgb-led-card';
    card.id = 'rgbCard' + i;
    card.innerHTML =
      '<div class="rgb-led-header">'
        + '<div class="rgb-preview" id="rgbPrev' + i + '"></div>'
        + '<span class="rgb-led-name">' + names[i] + '</span>'
        + '<button class="rgb-off-btn" id="rgbOffBtn' + i + '">off</button>'
      + '</div>'
      + '<div class="rgb-row"><span class="rgb-channel-label r">R</span>'
        + '<input class="rgb-slider r" id="rgbR' + i + '" type="range" min="0" max="100" value="0">'
        + '<span class="rgb-value" id="rgbRv' + i + '">0</span></div>'
      + '<div class="rgb-row"><span class="rgb-channel-label g">G</span>'
        + '<input class="rgb-slider g" id="rgbG' + i + '" type="range" min="0" max="100" value="0">'
        + '<span class="rgb-value" id="rgbGv' + i + '">0</span></div>'
      + '<div class="rgb-row"><span class="rgb-channel-label b">B</span>'
        + '<input class="rgb-slider b" id="rgbB' + i + '" type="range" min="0" max="100" value="0">'
        + '<span class="rgb-value" id="rgbBv' + i + '">0</span></div>';
    container.appendChild(card);
    (function(idx) {
      ['R', 'G', 'B'].forEach(function(ch) {
        document.getElementById('rgb' + ch + idx).addEventListener('input', function() {
          _onRgbSlider(idx);
        });
      });
      document.getElementById('rgbOffBtn' + idx).addEventListener('click', function() {
        _rgbOff(idx);
      });
    })(i);
  }
})();

function _onRgbSlider(index) {
  const r = parseInt(document.getElementById('rgbR' + index).value);
  const g = parseInt(document.getElementById('rgbG' + index).value);
  const b = parseInt(document.getElementById('rgbB' + index).value);
  document.getElementById('rgbRv' + index).textContent = r;
  document.getElementById('rgbGv' + index).textContent = g;
  document.getElementById('rgbBv' + index).textContent = b;
  rgbLedStates[index] = [r, g, b];
  _updateRgbPreview(index);
  clearTimeout(_rgbTimers[index]);
  _rgbTimers[index] = setTimeout(function() { _pushLedState(); }, 80);
}

function _rgbOff(index) {
  rgbLedStates[index] = [0, 0, 0];
  ['R', 'G', 'B'].forEach(function(ch) {
    document.getElementById('rgb' + ch + index).value = 0;
    document.getElementById('rgb' + ch + 'v' + index).textContent = '0';
  });
  _updateRgbPreview(index);
  _pushLedState();
}

function toggleBinaryLed(index) {
  binaryLedStates[index] = !binaryLedStates[index];
  _updateBinaryTile(index);
  _sendBinaryLedCommand(index, binaryLedStates[index]);
}

function setAllLeds(state) {
  for (let i = 0; i < 4; i++) {
    binaryLedStates[i] = state;
    _updateBinaryTile(i);
    rgbLedStates[i] = state ? [100, 100, 100] : [0, 0, 0];
    _updateRgbPreview(i);
    _syncRgbSliders(i);
  }
  _sendAllLedsCommand(state);
}

function _syncRgbSliders(index) {
  const [r, g, b] = rgbLedStates[index];
  const rEl = document.getElementById('rgbR' + index);
  const gEl = document.getElementById('rgbG' + index);
  const bEl = document.getElementById('rgbB' + index);
  if (!rEl) return;
  rEl.value = r; document.getElementById('rgbRv' + index).textContent = r;
  gEl.value = g; document.getElementById('rgbGv' + index).textContent = g;
  bEl.value = b; document.getElementById('rgbBv' + index).textContent = b;
}

function _updateBinaryTile(index) {
  const tile = document.getElementById('binLed' + index);
  const bulb = document.getElementById('binBulb' + index);
  if (!tile) return;
  if (binaryLedStates[index]) {
    tile.classList.add('on');
    bulb.style.background = '#ffffff';
    bulb.style.boxShadow  = '0 0 10px #ffffff';
  } else {
    tile.classList.remove('on');
    bulb.style.background = '';
    bulb.style.boxShadow  = '';
  }
}

function _updateRgbPreview(index) {
  const card = document.getElementById('rgbCard' + index);
  const prev = document.getElementById('rgbPrev' + index);
  if (!card || !prev) return;
  const [r, g, b] = rgbLedStates[index];
  const isOn = r > 0 || g > 0 || b > 0;
  const css = 'rgb(' + Math.round(r * 2.55) + ',' + Math.round(g * 2.55) + ',' + Math.round(b * 2.55) + ')';
  card.classList.toggle('on', isOn);
  prev.style.background  = isOn ? css : '';
  prev.style.boxShadow   = isOn ? '0 0 8px ' + css : '';
  prev.style.borderColor = isOn ? css : '';
}

async function _sendBinaryLedCommand(index, state) {
  if (!wsConnected) return;
  await _pushLedState();
}

async function _sendRgbLedCommand(index, rgb) {
  if (!wsConnected) return;
  await _pushLedState();
}

async function _sendAllLedsCommand(state) {
  if (!wsConnected) return;
  await _pushLedState();
}

async function _sendQuickCommand(code) {
  try {
    // Stop any running script first
    const statusRes = await fetch(getRobotBase() + '/status');
    const statusData = await statusRes.json();
    if (statusData.status === 'running') {
      await fetch(getRobotBase() + '/stop', { method: 'POST' });
      await new Promise(r => setTimeout(r, 300));
    }
    await fetch(getRobotBase() + '/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code }),
    });
  } catch(e) {
    addLog('✗ LED command failed: ' + e.message, 'warn');
  }
}

async function _pushLedState() {
  if (!wsConnected) return;
  try {
    await fetch(getRobotBase() + '/leds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        binary: binaryLedStates.map(s => s ? 1 : 0),
        rgb:    rgbLedStates.map(rgb => rgb.slice()),
      }),
    });
  } catch(e) {
    addLog('✗ LED update failed: ' + e.message, 'warn');
  }
}

// Simulation visual fallback (used by block simulator)
function setLed(n, color) {
  // map flat index to binary (0-3) or rgb (4-7)
  if (n < 4) {
    binaryLedStates[n] = !!color;
    if (color) {
      const bulb = document.getElementById('binBulb' + n);
      if (bulb) { bulb.style.background = color; bulb.style.boxShadow = '0 0 10px ' + color; }
      document.getElementById('binLed' + n).classList.add('on');
    } else {
      _updateBinaryTile(n);
    }
  } else {
    const i = n - 4;
    if (color) {
      rgbLedStates[i] = [100, 0, 0];
      _updateRgbPreview(i);
    } else {
      rgbLedStates[i] = [0, 0, 0];
      _updateRgbPreview(i);
    }
  }
}

function setRobotGlow(color) {
  document.getElementById('ledRing').style.borderColor = color;
  document.getElementById('ledRing').style.boxShadow = '0 0 16px ' + color;
}

function allLedsOff() {
  for (let i = 0; i < 4; i++) { binaryLedStates[i] = false; _updateBinaryTile(i); }
  for (let i = 0; i < 4; i++) { rgbLedStates[i] = [0,0,0]; _updateRgbPreview(i); _syncRgbSliders(i); }
  document.getElementById('ledRing').style.borderColor = 'transparent';
  document.getElementById('ledRing').style.boxShadow = 'none';
}


// ─── SPEAKER CONTROL PANEL ───────────────────────────────────────────────────
// e-puck2 built-in sounds: 0=off, 1=short beep, 2=double beep,
//                          3=three beeps, 4=alarm, 5=melody

const SPEAKER_SOUNDS = [
  { index: 1, label: '1 — Short Beep',   icon: '🔔' },
  { index: 2, label: '2 — Double Beep',  icon: '🔔🔔' },
  { index: 3, label: '3 — Three Beeps',  icon: '🔔🔔🔔' },
  { index: 4, label: '4 — Alarm',        icon: '🚨' },
  { index: 5, label: '5 — Melody',       icon: '🎵' },
];

let _speakerActive = 0;   // currently playing sound index (0 = off)

(function buildSpeakerPanel() {
  const body = document.getElementById('speakerPaneBody');
  if (!body) return;

  // ── Section 1: Audio file player ─────────────────────────────────────────

  // Section label
  const audioLabel = document.createElement('div');
  audioLabel.style.cssText = 'font-family:\'Space Mono\',monospace;font-size:0.6rem;color:var(--text-muted);margin-bottom:6px;';
  audioLabel.textContent = '🎵 AUDIO FILE PLAYER';
  body.appendChild(audioLabel);

  // Volume card
  const volCard = document.createElement('div');
  volCard.style.cssText = 'padding:6px 8px;background:#0d1117;border-radius:6px;border:1px solid #21262d;margin-bottom:6px;';

  const volHeader = document.createElement('div');
  volHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;';
  const volTitle = document.createElement('span');
  volTitle.style.cssText = 'font-family:\'Space Mono\',monospace;font-size:0.58rem;color:var(--text-muted);';
  volTitle.textContent = 'VOLUME';
  const volLabel = document.createElement('span');
  volLabel.id = 'audioVolLabel';
  volLabel.style.cssText = 'font-family:\'Space Mono\',monospace;font-size:0.85rem;font-weight:bold;color:#58a6ff;';
  volLabel.textContent = '80%';
  volHeader.appendChild(volTitle);
  volHeader.appendChild(volLabel);
  volCard.appendChild(volHeader);

  const volRow = document.createElement('div');
  volRow.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const btnMinus = document.createElement('button');
  btnMinus.textContent = '−';
  btnMinus.style.cssText = 'flex-shrink:0;width:24px;height:24px;background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:4px;cursor:pointer;font-size:1rem;';
  btnMinus.onclick = function() { _audioVolStep(-10); };

  const sliderWrap = document.createElement('div');
  sliderWrap.style.cssText = 'flex:1;position:relative;height:24px;display:flex;align-items:center;';
  const sliderTrack = document.createElement('div');
  sliderTrack.style.cssText = 'position:absolute;left:0;right:0;height:5px;background:#21262d;border-radius:3px;pointer-events:none;';
  const sliderFill = document.createElement('div');
  sliderFill.id = 'audioVolFill';
  sliderFill.style.cssText = 'position:absolute;left:0;top:50%;transform:translateY(-50%);height:5px;width:80%;background:linear-gradient(90deg,#3fb950,#58a6ff);border-radius:3px;pointer-events:none;transition:width 0.05s;';
  const slider = document.createElement('input');
  slider.id = 'audioVolSlider';
  slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = '80';
  slider.style.cssText = 'position:relative;width:100%;height:5px;appearance:none;background:transparent;cursor:pointer;accent-color:#58a6ff;';
  slider.oninput  = function() { _audioVolInput(this.value); };
  slider.onchange = function() { _audioVolCommit(this.value); };
  sliderWrap.appendChild(sliderTrack);
  sliderWrap.appendChild(sliderFill);
  sliderWrap.appendChild(slider);

  const btnPlus = document.createElement('button');
  btnPlus.textContent = '+';
  btnPlus.style.cssText = 'flex-shrink:0;width:24px;height:24px;background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:4px;cursor:pointer;font-size:1rem;';
  btnPlus.onclick = function() { _audioVolStep(10); };

  volRow.appendChild(btnMinus);
  volRow.appendChild(sliderWrap);
  volRow.appendChild(btnPlus);
  volCard.appendChild(volRow);
  body.appendChild(volCard);

  // File selector row
  const selRow = document.createElement('div');
  selRow.style.cssText = 'display:flex;align-items:center;gap:5px;margin-bottom:5px;';
  const fileSel = document.createElement('select');
  fileSel.id = 'audioFileSelect';
  fileSel.style.cssText = 'flex:1;padding:5px 7px;background:#161b22;color:#e6edf3;border:1px solid #30363d;border-radius:4px;font-family:\'Space Mono\',monospace;font-size:0.65rem;cursor:pointer;';
  const defOpt = document.createElement('option');
  defOpt.value = ''; defOpt.textContent = '— select a file —';
  fileSel.appendChild(defOpt);
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = '↻';
  refreshBtn.title = 'Refresh file list';
  refreshBtn.style.cssText = 'background:none;border:1px solid #30363d;color:#58a6ff;border-radius:4px;cursor:pointer;padding:4px 7px;font-size:0.8rem;';
  refreshBtn.onclick = _audioRefreshList;
  selRow.appendChild(fileSel);
  selRow.appendChild(refreshBtn);
  body.appendChild(selRow);

  // Play / Stop row
  const playRow = document.createElement('div');
  playRow.style.cssText = 'display:flex;gap:5px;margin-bottom:5px;';
  const playBtn = document.createElement('button');
  playBtn.id = 'audioPlayBtn';
  playBtn.textContent = '▶ PLAY';
  playBtn.style.cssText = 'flex:1;padding:6px;background:#238636;border:none;color:#fff;border-radius:4px;font-family:\'Space Mono\',monospace;font-size:0.65rem;cursor:pointer;font-weight:bold;';
  playBtn.onclick = _audioPlay;
  const stopAudioBtn = document.createElement('button');
  stopAudioBtn.textContent = '⏹ STOP';
  stopAudioBtn.style.cssText = 'flex:1;padding:6px;background:#21262d;border:1px solid #30363d;color:#f85149;border-radius:4px;font-family:\'Space Mono\',monospace;font-size:0.65rem;cursor:pointer;font-weight:bold;';
  stopAudioBtn.onclick = _audioStop;
  playRow.appendChild(playBtn);
  playRow.appendChild(stopAudioBtn);
  body.appendChild(playRow);

  // Upload label
  const uploadLabel = document.createElement('label');
  uploadLabel.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 8px;background:#0d1117;border:1px dashed #30363d;border-radius:4px;cursor:pointer;font-family:\'Space Mono\',monospace;font-size:0.6rem;color:#8b949e;margin-bottom:5px;';
  const uploadIcon = document.createElement('span');
  uploadIcon.textContent = '📁';
  const uploadText = document.createElement('span');
  uploadText.id = 'audioUploadLabel';
  uploadText.textContent = 'Upload MP3 / WAV / OGG…';
  const fileInput = document.createElement('input');
  fileInput.id = 'audioFileInput';
  fileInput.type = 'file';
  fileInput.accept = '.mp3,.wav,.ogg,.flac';
  fileInput.style.display = 'none';
  fileInput.onchange = function() { _audioUpload(this); };
  uploadLabel.appendChild(uploadIcon);
  uploadLabel.appendChild(uploadText);
  uploadLabel.appendChild(fileInput);
  body.appendChild(uploadLabel);

  // Status line
  const audioStatus = document.createElement('div');
  audioStatus.id = 'audioStatus';
  audioStatus.style.cssText = 'font-family:\'Space Mono\',monospace;font-size:0.6rem;color:var(--text-muted);margin-bottom:8px;min-height:14px;';
  body.appendChild(audioStatus);

  // ── Divider ───────────────────────────────────────────────────────────────
  const div0 = document.createElement('div');
  div0.style.cssText = 'border-top:1px solid #21262d;margin-bottom:8px;';
  body.appendChild(div0);

  // ── Section 2: e-puck2 built-in buzzer ────────────────────────────────────
  const buzzerLabel = document.createElement('div');
  buzzerLabel.style.cssText = 'font-family:\'Space Mono\',monospace;font-size:0.6rem;color:var(--text-muted);margin-bottom:6px;';
  buzzerLabel.textContent = '🔔 E-PUCK2 BUZZER (fixed volume)';
  body.appendChild(buzzerLabel);

  // Stop button
  const stopRow = document.createElement('div');
  stopRow.style.cssText = 'margin-bottom:8px;';
  stopRow.innerHTML = '<button class="speaker-stop-btn" id="speakerStopBtn" onclick="_speakerStop()">⛔ Stop Buzzer</button>';
  body.appendChild(stopRow);

  // Sound buttons
  const grid = document.createElement('div');
  grid.className = 'speaker-grid';
  grid.id = 'speakerGrid';
  SPEAKER_SOUNDS.forEach(function(s) {
    const btn = document.createElement('button');
    btn.className = 'speaker-btn';
    btn.id = 'speakerBtn' + s.index;
    btn.innerHTML = '<span class="speaker-icon">' + s.icon + '</span>'
      + '<span class="speaker-label">' + s.label + '</span>';
    btn.addEventListener('click', function() { _speakerPlay(s.index); });
    grid.appendChild(btn);
  });
  body.appendChild(grid);

  // Status line
  const status = document.createElement('div');
  status.className = 'speaker-status';
  status.id = 'speakerStatus';
  status.textContent = 'No sound playing';
  body.appendChild(status);
})();

function _speakerPlay(index) {
  _speakerActive = index;
  _updateSpeakerUI();
  _pushSpeakerState(index);
}

function _speakerStop() {
  _speakerActive = 0;
  _updateSpeakerUI();
  _pushSpeakerState(0);
}

// ── Audio file player functions ───────────────────────────────────────────────

let _audioStatusTimer = null;

function _audioVolInput(val) {
  var v = parseInt(val);
  var lbl  = document.getElementById('audioVolLabel');
  var fill = document.getElementById('audioVolFill');
  if (lbl)  lbl.textContent  = v + '%';
  if (fill) fill.style.width = v + '%';
}

function _audioVolStep(delta) {
  var slider = document.getElementById('audioVolSlider');
  if (!slider) return;
  var v = Math.max(0, Math.min(100, parseInt(slider.value) + delta));
  slider.value = v;
  _audioVolInput(v);
  _audioVolCommit(v);
}

function _audioVolCommit(val) {
  var v = parseInt(val);
  if (!wsConnected) { addLog('⚠ Not connected', 'warn'); return; }
  fetch(getRobotBase() + '/audio/volume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ volume: v })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.ok) addLog('🔊 Volume → ' + v + '% (' + d.control + ')', 'info');
    else      addLog('✗ Volume: ' + d.error, 'warn');
  })
  .catch(function(e) { addLog('✗ Volume error: ' + e.message, 'warn'); });
}

function _audioRefreshList() {
  if (!wsConnected) return;
  fetch(getRobotBase() + '/audio/list')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var sel = document.getElementById('audioFileSelect');
      if (!sel) return;
      var prev = sel.value;
      sel.innerHTML = '';
      var def = document.createElement('option');
      def.value = ''; def.textContent = '— select a file —';
      sel.appendChild(def);
      (d.files || []).forEach(function(f) {
        var opt = document.createElement('option');
        opt.value = f; opt.textContent = f;
        if (f === prev) opt.selected = true;
        sel.appendChild(opt);
      });
      if (d.files && d.files.length === 0) {
        var st = document.getElementById('audioStatus');
        if (st) st.textContent = 'No files in sounds/ folder yet — upload one below.';
      }
    })
    .catch(function() {});
}

function _audioPlay() {
  var sel = document.getElementById('audioFileSelect');
  if (!sel || !sel.value) { addLog('⚠ Select a file first', 'warn'); return; }
  if (!wsConnected) { addLog('⚠ Not connected', 'warn'); return; }
  var file = sel.value;
  var btn = document.getElementById('audioPlayBtn');
  if (btn) { btn.textContent = '⏳ …'; btn.disabled = true; }
  fetch(getRobotBase() + '/audio/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: file })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (btn) { btn.textContent = '▶ PLAY'; btn.disabled = false; }
    if (d.ok) {
      var st = document.getElementById('audioStatus');
      if (st) { st.textContent = '▶ ' + d.file; st.style.color = '#3fb950'; }
      addLog('🎵 Playing: ' + d.file + ' via ' + d.player, 'info');
      _audioPollStatus();
    } else {
      addLog('✗ Play failed: ' + d.error, 'warn');
    }
  })
  .catch(function(e) {
    if (btn) { btn.textContent = '▶ PLAY'; btn.disabled = false; }
    addLog('✗ Play error: ' + e.message, 'warn');
  });
}

function _audioStop() {
  if (!wsConnected) return;
  fetch(getRobotBase() + '/audio/stop', { method: 'POST' })
    .then(function(r) { return r.json(); })
    .then(function() {
      var st = document.getElementById('audioStatus');
      if (st) { st.textContent = 'Stopped.'; st.style.color = 'var(--text-muted)'; }
      if (_audioStatusTimer) { clearInterval(_audioStatusTimer); _audioStatusTimer = null; }
    })
    .catch(function() {});
}

function _audioPollStatus() {
  if (_audioStatusTimer) clearInterval(_audioStatusTimer);
  _audioStatusTimer = setInterval(function() {
    if (!wsConnected) { clearInterval(_audioStatusTimer); return; }
    fetch(getRobotBase() + '/audio/status')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d.playing) {
          var st = document.getElementById('audioStatus');
          if (st) { st.textContent = 'Finished.'; st.style.color = 'var(--text-muted)'; }
          clearInterval(_audioStatusTimer);
          _audioStatusTimer = null;
        }
      })
      .catch(function() {});
  }, 1500);
}

function _audioUpload(input) {
  var file = input.files[0];
  if (!file) return;
  if (!wsConnected) { addLog('⚠ Not connected — cannot upload', 'warn'); return; }
  var lbl = document.getElementById('audioUploadLabel');
  if (lbl) lbl.textContent = '⏳ Uploading ' + file.name + '…';
  var fd = new FormData();
  fd.append('file', file);
  fetch(getRobotBase() + '/audio/upload', { method: 'POST', body: fd })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (lbl) lbl.textContent = 'Upload MP3 / WAV / OGG…';
      input.value = '';
      if (d.ok) {
        addLog('📁 Uploaded: ' + d.file + ' (' + Math.round(d.size/1024) + ' KB)', 'info');
        _audioRefreshList();
      } else {
        addLog('✗ Upload failed: ' + d.error, 'warn');
      }
    })
    .catch(function(e) {
      if (lbl) lbl.textContent = 'Upload MP3 / WAV / OGG…';
      addLog('✗ Upload error: ' + e.message, 'warn');
    });
}

function _updateSpeakerUI() {
  SPEAKER_SOUNDS.forEach(function(s) {
    const btn = document.getElementById('speakerBtn' + s.index);
    if (!btn) return;
    btn.classList.toggle('active', s.index === _speakerActive);
  });
  const status = document.getElementById('speakerStatus');
  if (!status) return;
  if (_speakerActive === 0) {
    status.textContent = 'No sound playing';
    status.className = 'speaker-status';
  } else {
    const sound = SPEAKER_SOUNDS.find(function(s) { return s.index === _speakerActive; });
    status.textContent = '▶ Playing: ' + (sound ? sound.label : '');
    status.className = 'speaker-status playing';
  }
}

async function _pushSpeakerState(index) {
  if (!wsConnected) {
    // Simulate in browser with Web Audio when not connected
    if (index > 0) _simSpeakerSound(index);
    return;
  }
  try {
    const res = await fetch(getRobotBase() + '/speaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sound: index }),
    });
    const data = await res.json();
    if (!data.ok) addLog('✗ Speaker error: ' + data.error, 'warn');
    else addLog(index === 0 ? '🔇 Speaker off' : '🔊 Playing sound ' + index, 'action');
  } catch(e) {
    addLog('✗ Speaker failed: ' + e.message, 'warn');
  }
}

// Simulate sounds in browser when robot not connected
function _simSpeakerSound(index) {
  try {
    const ctx = getAudio();
    const patterns = {
      1: [[440, 0.15]],
      2: [[440, 0.1], [440, 0.1]],
      3: [[440, 0.08], [440, 0.08], [440, 0.08]],
      4: [[220, 0.6]],
      5: [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.15], [784, 0.1], [659, 0.1], [523, 0.15]],
    };
    const notes = patterns[index] || [];
    let t = ctx.currentTime;
    notes.forEach(function(note) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = note[0];
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note[1]);
      osc.start(t); osc.stop(t + note[1]);
      t += note[1] + 0.05;
    });
  } catch(e) {}
}


// ─── WHEEL CONTROL PANEL ─────────────────────────────────────────────────────

let _wheelSpeed = 50;          // current speed % (1-100)
let _wheelActive = null;       // 'forward'|'backward'|'left'|'right'|null
let _wheelHoldTimer = null;    // auto-stop timer for non-hold buttons
let _wheelLeftPct  = 0;
let _wheelRightPct = 0;

(function buildWheelsPanel() {
  const body = document.getElementById('wheelsPaneBody');
  if (!body) return;

  body.innerHTML = `
    <!-- Speed slider -->
    <div class="wheel-speed-row">
      <span class="wheel-speed-label">Speed</span>
      <input class="wheel-speed-slider" id="wheelSpeedSlider" type="range"
             min="1" max="100" value="50">
      <span class="wheel-speed-value" id="wheelSpeedVal">50%</span>
    </div>

    <!-- D-pad -->
    <div class="wheel-dpad">
      <div class="wheel-dpad-row">
        <div></div>
        <button class="wheel-btn forward" id="wbtnFwd"
          onmousedown="_wheelPress('forward')" onmouseup="_wheelRelease()"
          ontouchstart="_wheelPress('forward')" ontouchend="_wheelRelease()">
          ▲
        </button>
        <div></div>
      </div>
      <div class="wheel-dpad-row">
        <button class="wheel-btn left" id="wbtnLeft"
          onmousedown="_wheelPress('left')" onmouseup="_wheelRelease()"
          ontouchstart="_wheelPress('left')" ontouchend="_wheelRelease()">
          ◄
        </button>
        <button class="wheel-btn stop" id="wbtnStop"
          onmousedown="_wheelStop()">
          ■
        </button>
        <button class="wheel-btn right" id="wbtnRight"
          onmousedown="_wheelPress('right')" onmouseup="_wheelRelease()"
          ontouchstart="_wheelPress('right')" ontouchend="_wheelRelease()">
          ►
        </button>
      </div>
      <div class="wheel-dpad-row">
        <div></div>
        <button class="wheel-btn backward" id="wbtnBack"
          onmousedown="_wheelPress('backward')" onmouseup="_wheelRelease()"
          ontouchstart="_wheelPress('backward')" ontouchend="_wheelRelease()">
          ▼
        </button>
        <div></div>
      </div>
    </div>

    <!-- Individual wheel sliders -->
    <div class="wheel-manual-row">
      <div class="wheel-manual-col">
        <span class="wheel-manual-label">L</span>
        <input class="wheel-manual-slider" id="wheelLeftSlider" type="range"
               min="-100" max="100" value="0" orient="vertical">
        <span class="wheel-manual-val" id="wheelLeftVal">0</span>
      </div>
      <div class="wheel-manual-divider"></div>
      <div class="wheel-manual-col">
        <span class="wheel-manual-label">R</span>
        <input class="wheel-manual-slider" id="wheelRightSlider" type="range"
               min="-100" max="100" value="0" orient="vertical">
        <span class="wheel-manual-val" id="wheelRightVal">0</span>
      </div>
    </div>

    <!-- Live speed readout -->
    <div class="wheel-readout" id="wheelReadout">L: 0  R: 0</div>
  `;

  // Speed slider
  document.getElementById('wheelSpeedSlider').addEventListener('input', function() {
    _wheelSpeed = parseInt(this.value);
    document.getElementById('wheelSpeedVal').textContent = _wheelSpeed + '%';
  });

  // Individual wheel sliders
  document.getElementById('wheelLeftSlider').addEventListener('input', function() {
    _wheelLeftPct = parseInt(this.value);
    document.getElementById('wheelLeftVal').textContent = _wheelLeftPct;
    _updateWheelReadout();
    _pushMotors(_wheelLeftPct, _wheelRightPct);
  });
  document.getElementById('wheelRightSlider').addEventListener('input', function() {
    _wheelRightPct = parseInt(this.value);
    document.getElementById('wheelRightVal').textContent = _wheelRightPct;
    _updateWheelReadout();
    _pushMotors(_wheelLeftPct, _wheelRightPct);
  });
})();

function _wheelPress(direction) {
  _wheelActive = direction;
  _updateWheelBtnUI();
  const s = _wheelSpeed;
  let l = 0, r = 0;
  switch (direction) {
    case 'forward':  l =  s; r =  s; break;
    case 'backward': l = -s; r = -s; break;
    case 'left':     l = -s; r =  s; break;
    case 'right':    l =  s; r = -s; break;
  }
  _wheelLeftPct  = l;
  _wheelRightPct = r;
  _syncWheelSliders();
  _updateWheelReadout();
  _pushMotors(l, r);
}

function _wheelRelease() {
  // Small delay so a quick tap still registers on robot, then auto-stop
  clearTimeout(_wheelHoldTimer);
  _wheelHoldTimer = setTimeout(function() {
    _wheelStop();
  }, 100);
}

function _wheelStop() {
  _wheelActive = null;
  _wheelLeftPct  = 0;
  _wheelRightPct = 0;
  _updateWheelBtnUI();
  _syncWheelSliders();
  _updateWheelReadout();
  _pushMotors(0, 0);
}

function _updateWheelBtnUI() {
  const map = { forward:'wbtnFwd', backward:'wbtnBack', left:'wbtnLeft', right:'wbtnRight' };
  Object.keys(map).forEach(function(dir) {
    const btn = document.getElementById(map[dir]);
    if (btn) btn.classList.toggle('active', dir === _wheelActive);
  });
}

function _syncWheelSliders() {
  const ls = document.getElementById('wheelLeftSlider');
  const rs = document.getElementById('wheelRightSlider');
  if (ls) { ls.value = _wheelLeftPct;  document.getElementById('wheelLeftVal').textContent  = _wheelLeftPct;  }
  if (rs) { rs.value = _wheelRightPct; document.getElementById('wheelRightVal').textContent = _wheelRightPct; }
}

function _updateWheelReadout() {
  const el = document.getElementById('wheelReadout');
  if (el) el.textContent = 'L: ' + _wheelLeftPct + '   R: ' + _wheelRightPct;
}

async function _pushMotors(left, right) {
  if (!wsConnected) return;
  try {
    const res = await fetch(getRobotBase() + '/motors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ left: left, right: right }),
    });
    const data = await res.json();
    if (!data.ok) addLog('✗ Motor error: ' + data.error, 'warn');
  } catch(e) {
    addLog('✗ Motors failed: ' + e.message, 'warn');
  }
}


// ─── GROUND SENSOR PANEL ─────────────────────────────────────────────────────
// Pi-Puck ground sensor board: 3 sensors (left, center, right)
// Values are uint16 reflectance — high = light surface, low = dark surface.
// Typical range: ~0 (black tape) to ~1000+ (white surface).

const GROUND_MAX = 1000;   // expected maximum for bar scaling

(function buildGroundPanel() {
  const body = document.getElementById('groundPaneBody');
  if (!body) return;

  body.innerHTML = `
    <div class="ground-sensor-grid">

      <div class="ground-sensor-row">
        <div class="ground-label">LEFT</div>
        <div class="ground-bar-wrap">
          <div class="ground-bar-track">
            <div class="ground-bar-fill" id="gBar0"></div>
          </div>
        </div>
        <div class="ground-value" id="gVal0">0</div>
      </div>

      <div class="ground-sensor-row">
        <div class="ground-label">CENTER</div>
        <div class="ground-bar-wrap">
          <div class="ground-bar-track">
            <div class="ground-bar-fill" id="gBar1"></div>
          </div>
        </div>
        <div class="ground-value" id="gVal1">0</div>
      </div>

      <div class="ground-sensor-row">
        <div class="ground-label">RIGHT</div>
        <div class="ground-bar-wrap">
          <div class="ground-bar-track">
            <div class="ground-bar-fill" id="gBar2"></div>
          </div>
        </div>
        <div class="ground-value" id="gVal2">0</div>
      </div>

    </div>

    <!-- Visual floor representation -->
    <div class="ground-floor-wrap">
      <div class="ground-floor-label">SURFACE VIEW</div>
      <div class="ground-floor">
        <div class="ground-floor-sensor" id="gFloor0" title="Left"></div>
        <div class="ground-floor-sensor" id="gFloor1" title="Center"></div>
        <div class="ground-floor-sensor" id="gFloor2" title="Right"></div>
      </div>
    </div>

    <div class="ground-hint">High value = light · Low value = dark</div>
  `;
})();

function updateGroundSensors(values) {
  // values = [left, center, right]
  for (let i = 0; i < 3; i++) {
    const val = values[i] || 0;
    const pct = Math.min(100, Math.round((val / GROUND_MAX) * 100));

    // Bar
    const bar = document.getElementById('gBar' + i);
    if (bar) {
      bar.style.width = Math.max(2, pct) + '%';
      bar.classList.toggle('dark', pct < 20);
      bar.classList.toggle('mid',  pct >= 20 && pct < 60);
      bar.classList.toggle('light', pct >= 60);
    }

    // Numeric value
    const valEl = document.getElementById('gVal' + i);
    if (valEl) valEl.textContent = val;

    // Floor tile — interpolate from black to white
    const floor = document.getElementById('gFloor' + i);
    if (floor) {
      const brightness = Math.round(pct * 2.55);
      floor.style.background = `rgb(${brightness},${brightness},${brightness})`;
      floor.title = ['Left','Center','Right'][i] + ': ' + val;
    }
  }
}


// ─── CAMERA PANEL ────────────────────────────────────────────────────────────
// Polls GET /camera/snapshot (JPEG) at 5 Hz — same rate as snapshot.py.
// Camera must be opened first via POST /camera/open on the robot.

let _cameraPolling = false;
let _cameraTimer   = null;
const CAMERA_FPS_MS = 200;   // 5 Hz, matching snapshot.py

function cameraOpen() {
  const base = getRobotBase();
  addLog('📷 Opening camera at ' + base + ' ...', 'info');
  console.log('[camera] cameraOpen called, wsConnected=', wsConnected, 'base=', base);

  fetch(base + '/camera/open', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({device: 0})
  })
  .then(r => {
    console.log('[camera] /camera/open response status:', r.status);
    return r.json();
  })
  .then(d => {
    console.log('[camera] /camera/open response body:', d);
    if (d.ok) {
      addLog('📷 Camera opened on /dev/video' + (d.device || 0), 'info');
      _cameraStartPolling();
    } else {
      addLog('❌ Camera error: ' + d.error, 'error');
    }
  })
  .catch(e => {
    console.error('[camera] fetch error:', e);
    addLog('❌ Camera open failed: ' + e, 'error');
  });
}

function cameraClose() {
  _cameraStopPolling();
  if (!wsConnected) return;
  fetch(getRobotBase() + '/camera/close', { method: 'POST' })
  .then(() => addLog('📷 Camera closed', 'info'))
  .catch(() => {});
}

function _cameraStartPolling() {
  _cameraPolling = true;

  // Update UI
  document.getElementById('cameraPlaceholder').style.display = 'none';
  document.getElementById('cameraImg').style.display = 'block';
  document.getElementById('cameraOpenBtn').style.display  = 'none';
  document.getElementById('cameraCloseBtn').style.display = '';
  const src = document.getElementById('cameraSource');
  src.textContent = 'LIVE';
  src.classList.add('live');

  _cameraPoll();
}

function _cameraStopPolling() {
  _cameraPolling = false;
  if (_cameraTimer) { clearTimeout(_cameraTimer); _cameraTimer = null; }

  // Reset UI
  const img = document.getElementById('cameraImg');
  if (img) { img.style.display = 'none'; img.src = ''; }
  const ph = document.getElementById('cameraPlaceholder');
  if (ph) ph.style.display = '';
  const ob = document.getElementById('cameraOpenBtn');
  if (ob) ob.style.display = '';
  const cb = document.getElementById('cameraCloseBtn');
  if (cb) cb.style.display = 'none';
  const src = document.getElementById('cameraSource');
  if (src) { src.textContent = 'OFF'; src.classList.remove('live'); }
}

function _cameraPoll() {
  if (!_cameraPolling || !wsConnected) {
    _cameraStopPolling();
    return;
  }

  const t0 = Date.now();
  const url = getRobotBase() + '/camera/snapshot?t=' + t0;

  // Use an Image object — avoids CORS issues and caching naturally
  const img = document.getElementById('cameraImg');
  if (!img) return;

  const tmpImg = new Image();
  tmpImg.onload = function() {
    img.src = tmpImg.src;
    const elapsed = Date.now() - t0;
    const delay = Math.max(0, CAMERA_FPS_MS - elapsed);
    if (_cameraPolling) _cameraTimer = setTimeout(_cameraPoll, delay);
  };
  tmpImg.onerror = function() {
    console.error('[camera] frame fetch failed, url=', url);
    addLog('⚠ Camera frame error — retrying...', 'warn');
    if (_cameraPolling) _cameraTimer = setTimeout(_cameraPoll, 500);
  };
  tmpImg.src = url;
}


// ─── TOF DISTANCE PANEL ──────────────────────────────────────────────────────
// VL53L1X Time-of-Flight sensor — distance in mm via WebSocket sensor stream.

const TOF_MAX_MM = 2000;   // VL53L0X max range

(function buildTofPanel() {
  const body = document.getElementById('tofPaneBody');
  if (!body) return;

  body.innerHTML = `
    <div style="text-align:center;padding:10px 6px 4px;">

      <!-- Big distance readout -->
      <div style="font-family:'Space Mono',monospace;font-size:2.2rem;font-weight:bold;
                  color:#e6edf3;letter-spacing:2px;line-height:1;" id="tofMmValue">
        ---
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:0.6rem;color:var(--text-muted);
                  margin-bottom:10px;">mm</div>

      <!-- cm readout -->
      <div style="font-family:'Space Mono',monospace;font-size:1rem;color:var(--accent2);
                  margin-bottom:12px;" id="tofCmValue">--- cm</div>

      <!-- Distance bar -->
      <div style="background:var(--panel2);border:1px solid var(--border);border-radius:4px;
                  height:14px;overflow:hidden;margin-bottom:8px;">
        <div id="tofBar" style="height:100%;width:0%;border-radius:4px;
             background:linear-gradient(90deg,#3fb950,#e3b341,#f85149);
             transition:width 0.1s ease;"></div>
      </div>

      <!-- Zone indicator -->
      <div style="font-family:'Space Mono',monospace;font-size:0.62rem;
                  color:var(--text-muted);" id="tofZone">--</div>

    </div>
  `;
})();

function updateTof(mm) {
  const mmEl   = document.getElementById('tofMmValue');
  const cmEl   = document.getElementById('tofCmValue');
  const bar    = document.getElementById('tofBar');
  const zone   = document.getElementById('tofZone');

  if (mm < 0) {
    if (mmEl) mmEl.textContent = '---';
    if (cmEl) cmEl.textContent = '--- cm';
    if (bar)  bar.style.width = '0%';
    if (zone) zone.textContent = 'no reading';
    return;
  }

  const pct = Math.min(100, Math.round((mm / TOF_MAX_MM) * 100));
  if (mmEl) mmEl.textContent = mm;
  if (cmEl) cmEl.textContent = (mm / 10).toFixed(1) + ' cm';
  if (bar)  bar.style.width = Math.max(2, pct) + '%';

  // Zone label
  let zoneText, zoneColor;
  if (mm < 100)       { zoneText = '🔴 very close  < 10cm';  zoneColor = '#f85149'; }
  else if (mm < 300)  { zoneText = '🟠 close   10–30cm';     zoneColor = '#e3b341'; }
  else if (mm < 700)  { zoneText = '🟡 medium  30–70cm';     zoneColor = '#d29922'; }
  else                { zoneText = '🟢 far     > 70cm';       zoneColor = '#3fb950'; }

  if (zone) { zone.textContent = zoneText; zone.style.color = zoneColor; }

  // Update source badge
  const src = document.getElementById('tofSource');
  if (src && !src.classList.contains('live')) {
    src.textContent = 'LIVE';
    src.classList.add('live');
  }
}

// ─── BATTERY ────────────────────────────────────────────────────────────────

let _batteryInterval = null;

function _batteryColor(pct) {
  if (pct > 50) return '#3fb950';   // green
  if (pct > 20) return '#e3b341';   // yellow
  return '#f85149';                  // red
}

function _updateBatteryUI(id_pct, id_v, id_bar, data) {
  const elPct = document.getElementById(id_pct);
  const elV   = document.getElementById(id_v);
  const elBar = document.getElementById(id_bar);
  if (!data || data.error) {
    if (elPct) elPct.textContent = '--%';
    if (elV)   elV.textContent   = '--V';
    if (elBar) elBar.style.height = '0%';
    return;
  }
  const pct   = data.percent;
  const color = _batteryColor(pct);
  if (elPct) { elPct.textContent = pct.toFixed(0) + '%'; }
  if (elV)   elV.textContent = data.voltage + 'V';
  if (elBar) { elBar.style.height = pct + '%'; elBar.style.background = color; }
}

async function refreshBattery() {
  if (!wsConnected) return;
  const statusEl = document.getElementById('batStatus');
  try {
    const res  = await fetch(getRobotBase() + '/battery');
    const data = await res.json();
    if (data.ok) {
      _updateBatteryUI('batEpuckPct', 'batEpuckV', 'batEpuckBar', data.epuck);
      _updateBatteryUI('batExtPct',   'batExtV',   'batExtBar',   data.ext);
      if (statusEl) {
        const now = new Date().toLocaleTimeString();
        statusEl.textContent = 'updated ' + now;
        statusEl.style.color = 'var(--text-muted)';
      }
    } else {
      if (statusEl) {
        statusEl.textContent = data.error || 'ADC not found';
        statusEl.style.color = '#f85149';
      }
      addLog('🔋 Battery: ' + (data.error || 'ADC not found'), 'warn');
    }
  } catch(e) {
    if (statusEl) { statusEl.textContent = 'read error'; statusEl.style.color = '#f85149'; }
  }
}

function _batteryStartPolling() {
  refreshBattery();
  _batteryInterval = setInterval(refreshBattery, 30000);  // refresh every 30s
}

function _batteryStopPolling() {
  if (_batteryInterval) { clearInterval(_batteryInterval); _batteryInterval = null; }
  ['batEpuckPct','batExtPct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '--%';
  });
  ['batEpuckV','batExtV'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '--V';
  });
  ['batEpuckBar','batExtBar'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.height = '0%';
  });
  const s = document.getElementById('batStatus');
  if (s) { s.textContent = 'not connected'; s.style.color = 'var(--text-muted)'; }
}

// ─── IMU ─────────────────────────────────────────────────────────────────────

function _imuSetBar(posId, negId, valId, value, maxVal, decimals) {
  const pct = Math.min(50, Math.abs(value) / maxVal * 50);
  const posEl = document.getElementById(posId);
  const negEl = document.getElementById(negId);
  const valEl = document.getElementById(valId);
  if (value >= 0) {
    if (posEl) posEl.style.width = pct + '%';
    if (negEl) negEl.style.width = '0%';
  } else {
    if (posEl) posEl.style.width = '0%';
    if (negEl) negEl.style.width = pct + '%';
  }
  if (valEl) valEl.textContent = value.toFixed(decimals);
}

function updateImu(imu) {
  const acc  = imu.acc;
  const gyro = imu.gyro;

  // ── Accelerometer bars (±2g) ─────────────────────────────────────────────
  _imuSetBar('imuAccXp','imuAccXn','imuAccXv', acc[0],  2, 3);
  _imuSetBar('imuAccYp','imuAccYn','imuAccYv', acc[1],  2, 3);
  _imuSetBar('imuAccZp','imuAccZn','imuAccZv', acc[2],  2, 3);

  // ── Gyroscope bars (±250 dps) ────────────────────────────────────────────
  _imuSetBar('imuGyroXp','imuGyroXn','imuGyroXv', gyro[0], 250, 1);
  _imuSetBar('imuGyroYp','imuGyroYn','imuGyroYv', gyro[1], 250, 1);
  _imuSetBar('imuGyroZp','imuGyroZn','imuGyroZv', gyro[2], 250, 1);

  // ── Roll & Pitch from accelerometer ─────────────────────────────────────
  const roll  = Math.atan2(acc[1], acc[2]) * 180 / Math.PI;
  const pitch = Math.atan2(-acc[0], Math.sqrt(acc[1]*acc[1] + acc[2]*acc[2])) * 180 / Math.PI;
  const yawRate = gyro[2];                          // Z-axis gyro = yaw rate
  const gTotal = Math.sqrt(acc[0]**2 + acc[1]**2 + acc[2]**2);

  // ── Readout labels ───────────────────────────────────────────────────────
  const rollEl    = document.getElementById('imuRoll');
  const pitchEl   = document.getElementById('imuPitch');
  const yawRateEl = document.getElementById('imuYawRate');
  const gTotalEl  = document.getElementById('imuGTotal');
  if (rollEl)    rollEl.textContent    = roll.toFixed(1)    + '°';
  if (pitchEl)   pitchEl.textContent   = pitch.toFixed(1)   + '°';
  if (yawRateEl) yawRateEl.textContent = yawRate.toFixed(1) + '°/s';
  if (gTotalEl)  gTotalEl.textContent  = gTotal.toFixed(2)  + 'g';

  // ── Motion activity bar (based on gyro magnitude) ───────────────────────
  const gyroMag = Math.sqrt(gyro[0]**2 + gyro[1]**2 + gyro[2]**2);
  const motionPct = Math.min(100, gyroMag / 250 * 100);
  const motionBar = document.getElementById('imuMotionBar');
  if (motionBar) motionBar.style.width = motionPct + '%';

  // ── 3D Robot tilt via CSS transform ─────────────────────────────────────
  // Clamp angles for visual clarity (full ±90° tilt)
  const r = Math.max(-85, Math.min(85, roll));
  const p = Math.max(-85, Math.min(85, pitch));
  const wrap = document.getElementById('robotTiltWrap');
  if (wrap) {
    // rotateX tilts front/back (pitch), rotateY tilts left/right (roll)
    wrap.style.transform = `rotateX(${p}deg) rotateY(${-r}deg)`;
  }

  // ── Centre LED colour: green=flat, yellow=tilted, red=very tilted ────────
  const tiltMag = Math.sqrt(roll*roll + pitch*pitch);
  const led = document.getElementById('robotCenterLed');
  if (led) {
    if (tiltMag < 10)       { led.setAttribute('fill','#3fb950'); led.setAttribute('opacity','0.8'); }
    else if (tiltMag < 35)  { led.setAttribute('fill','#e3b341'); led.setAttribute('opacity','0.9'); }
    else                    { led.setAttribute('fill','#f85149'); led.setAttribute('opacity','1.0'); }
  }

  // ── Status badge ─────────────────────────────────────────────────────────
  const st = document.getElementById('imuStatus');
  if (st && st.textContent !== 'LIVE') {
    st.textContent = 'LIVE';
    st.style.color = '#3fb950';
  }
}

function imuCalibrate() {
  if (!wsConnected) { addLog('⚠ Not connected', 'warn'); return; }
  addLog('🧭 IMU calibrating — keep robot still…', 'info');
  fetch(getRobotBase() + '/imu/calibrate', { method: 'POST' })
    .then(r => r.json())
    .then(d => addLog(d.ok ? '✓ IMU calibrated' : '✗ IMU cal failed: ' + d.error, d.ok ? 'info' : 'warn'))
    .catch(e => addLog('✗ IMU cal error: ' + e.message, 'warn'));
}

function magCalibrate() {
  if (!wsConnected) { addLog('⚠ Not connected', 'warn'); return; }
  addLog('🧲 Magnetometer calibrating — spin robot slowly 360° now (10s)…', 'info');
  const st = document.getElementById('magStatus');
  if (st) { st.textContent = 'calibrating…'; st.style.color = '#e3b341'; }
  fetch(getRobotBase() + '/mag/calibrate', { method: 'POST' })
    .then(r => r.json())
    .then(d => {
      addLog(d.ok ? '✓ ' + d.message : '✗ Mag cal failed: ' + d.error, d.ok ? 'info' : 'warn');
      if (st && d.ok) { st.textContent = 'calibrating… keep spinning'; st.style.color = '#e3b341'; }
    })
    .catch(e => addLog('✗ Mag cal error: ' + e.message, 'warn'));
}

function updateMag(mag) {
  const headEl  = document.getElementById('magHeading');
  const dirEl   = document.getElementById('magDir');
  const xyzEl   = document.getElementById('magXYZ');
  const stEl    = document.getElementById('magStatus');
  const needle  = document.getElementById('compassNeedle');

  const h = mag.heading;
  if (headEl) headEl.textContent = h.toFixed(1) + '°';

  // Cardinal direction label
  const dirs = ['N','NE','E','SE','S','SW','W','NW','N'];
  const dir = dirs[Math.round(h / 45) % 8];
  if (dirEl) dirEl.textContent = dir;

  // Rotate compass needle
  if (needle) needle.setAttribute('transform', 'rotate(' + h.toFixed(1) + ')');

  if (xyzEl) xyzEl.textContent = 'X:' + mag.x.toFixed(1) + ' Y:' + mag.y.toFixed(1) + ' Z:' + mag.z.toFixed(1) + ' µT';
  if (stEl && stEl.textContent !== 'LIVE') { stEl.textContent = 'LIVE'; stEl.style.color = '#3fb950'; }
}

function _magReset() {
  const headEl = document.getElementById('magHeading');
  const dirEl  = document.getElementById('magDir');
  const needle = document.getElementById('compassNeedle');
  const stEl   = document.getElementById('magStatus');
  if (headEl) headEl.textContent = '---°';
  if (dirEl)  dirEl.textContent  = '---';
  if (needle) needle.setAttribute('transform', 'rotate(0)');
  if (stEl)   { stEl.textContent = 'not available'; stEl.style.color = 'var(--text-muted)'; }
}

// ─── Microphones ──────────────────────────────────────────────────────────────
// mic[0]=front, mic[1]=left, mic[2]=back, mic[3]=right
// Values: uint16 from e-puck2, treat 4000 as full scale

const MIC_FULL_SCALE = 4000;
// Mic positions as unit vectors: angles 0°=front, 90°=left, 180°=back, 270°=right
const MIC_DIRS = [ [0,-1], [-1,0], [0,1], [1,0] ]; // [vx, vy] pointing toward each mic
const _micPeaks = [0, 0, 0, 0];    // peak hold values
const _micPeakTimers = [0,0,0,0];  // timestamps for peak decay
let _micPrevMax = 0;                // for clap detection

function updateMic(mic) {
  const SCALE = MIC_FULL_SCALE;
  const now = Date.now();

  let maxVal = 0;
  let sumVx = 0, sumVy = 0, totalWeight = 0;

  for (let i = 0; i < 4; i++) {
    const v = mic[i];
    const pct = Math.min(100, v / SCALE * 100);

    // VU bar
    const bar = document.getElementById('micBar' + i);
    if (bar) bar.style.height = pct + '%';

    // Value label
    const val = document.getElementById('micVal' + i);
    if (val) val.textContent = v;

    // Peak hold — update if new high, decay after 1.2s
    if (v >= _micPeaks[i]) {
      _micPeaks[i] = v;
      _micPeakTimers[i] = now + 1200;
    } else if (now > _micPeakTimers[i]) {
      _micPeaks[i] = Math.max(0, _micPeaks[i] - 30);
    }
    const peakEl = document.getElementById('micPeak' + i);
    if (peakEl) peakEl.style.bottom = Math.min(98, _micPeaks[i] / SCALE * 100) + '%';

    // Mic dot brightness on robot diagram
    const dot  = document.getElementById('micDot'  + i);
    const glow = document.getElementById('micGlow' + i);
    const opacity = 0.2 + (v / SCALE) * 0.8;
    if (dot)  dot.setAttribute('opacity',  Math.min(1, opacity).toFixed(2));
    if (glow) glow.setAttribute('opacity', Math.min(0.8, pct / 100 * 0.8).toFixed(2));

    // Weighted direction sum
    const w = v * v;   // square for better directionality
    sumVx += MIC_DIRS[i][0] * w;
    sumVy += MIC_DIRS[i][1] * w;
    totalWeight += w;

    if (v > maxVal) maxVal = v;
  }

  // Overall level bar
  const overall = document.getElementById('micOverallBar');
  if (overall) overall.style.width = Math.min(100, maxVal / SCALE * 100) + '%';

  // Peak level readout
  const peakVal = document.getElementById('micPeakVal');
  if (peakVal) peakVal.textContent = maxVal;

  // Sound direction arrow
  const arrow   = document.getElementById('micDirArrow');
  const dirLine = document.getElementById('micDirLine');
  const dirHead = document.getElementById('micDirHead');
  const dirLabel = document.getElementById('micDirLabel');
  const dirDeg   = document.getElementById('micDirDeg');

  if (totalWeight > 0 && maxVal > 100) {
    const nx = sumVx / totalWeight;
    const ny = sumVy / totalWeight;
    const mag = Math.sqrt(nx*nx + ny*ny);
    if (mag > 0.01) {
      // Compute angle for arrow rotation in SVG (0° = up = front)
      const angleDeg = Math.atan2(nx, -ny) * 180 / Math.PI;
      const len = 22;
      const ex = nx / mag * len, ey = ny / mag * len;
      if (dirLine) { dirLine.setAttribute('x2', ex.toFixed(1)); dirLine.setAttribute('y2', ey.toFixed(1)); }
      if (dirHead) {
        // Arrowhead: perpendicular to direction
        const hx = -ny/mag*3, hy = nx/mag*3;
        dirHead.setAttribute('points',
          `${(ex+nx/mag*4).toFixed(1)},${(ey+ny/mag*4).toFixed(1)} ` +
          `${(ex-nx/mag*4+hx).toFixed(1)},${(ey-ny/mag*4+hy).toFixed(1)} ` +
          `${(ex-nx/mag*4-hx).toFixed(1)},${(ey-ny/mag*4-hy).toFixed(1)}`);
      }
      if (arrow) arrow.setAttribute('opacity', '1');

      // Cardinal label
      const deg = ((angleDeg % 360) + 360) % 360;
      const cards = ['FRONT','FRONT-RIGHT','RIGHT','BACK-RIGHT','BACK','BACK-LEFT','LEFT','FRONT-LEFT'];
      const card = cards[Math.round(deg / 45) % 8];
      if (dirLabel) dirLabel.textContent = card;
      if (dirDeg)   dirDeg.textContent   = deg.toFixed(0) + '°';
    }
  } else {
    if (arrow)    arrow.setAttribute('opacity', '0');
    if (dirLabel) dirLabel.textContent = '---';
    if (dirDeg)   dirDeg.textContent   = '---°';
  }

  // Clap detector — sudden spike > 1.5× recent max
  const clapEl = document.getElementById('micClap');
  if (clapEl) {
    if (maxVal > 300 && maxVal > _micPrevMax * 1.8) {
      clapEl.style.opacity = '1';
      setTimeout(() => { clapEl.style.opacity = '0'; }, 300);
    }
  }
  _micPrevMax = _micPrevMax * 0.85 + maxVal * 0.15;  // slow decay
}

function _micReset() {
  for (let i = 0; i < 4; i++) {
    const bar  = document.getElementById('micBar'  + i); if (bar)  bar.style.height  = '0%';
    const peak = document.getElementById('micPeak' + i); if (peak) peak.style.bottom = '0%';
    const val  = document.getElementById('micVal'  + i); if (val)  val.textContent   = '0';
    const dot  = document.getElementById('micDot'  + i); if (dot)  dot.setAttribute('opacity','0.3');
    const glow = document.getElementById('micGlow' + i); if (glow) glow.setAttribute('opacity','0');
    _micPeaks[i] = 0;
  }
  const overall  = document.getElementById('micOverallBar'); if (overall)  overall.style.width = '0%';
  const peakVal  = document.getElementById('micPeakVal');    if (peakVal)  peakVal.textContent  = '0';
  const arrow    = document.getElementById('micDirArrow');   if (arrow)    arrow.setAttribute('opacity','0');
  const dirLabel = document.getElementById('micDirLabel');   if (dirLabel) dirLabel.textContent = '---';
  const dirDeg   = document.getElementById('micDirDeg');     if (dirDeg)   dirDeg.textContent   = '---°';
  _micPrevMax = 0;
}

function _imuReset() {
  ['imuAccXv','imuAccYv','imuAccZv'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent='0.000'; });
  ['imuGyroXv','imuGyroYv','imuGyroZv'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent='0.0'; });
  ['imuAccXp','imuAccXn','imuAccYp','imuAccYn','imuAccZp','imuAccZn',
   'imuGyroXp','imuGyroXn','imuGyroYp','imuGyroYn','imuGyroZp','imuGyroZn'].forEach(id => {
    const e = document.getElementById(id); if(e) e.style.width = '0%';
  });
  const wrap = document.getElementById('robotTiltWrap');
  if (wrap) wrap.style.transform = 'rotateX(0deg) rotateY(0deg)';
  const led = document.getElementById('robotCenterLed');
  if (led) { led.setAttribute('fill','#3fb950'); led.setAttribute('opacity','0.5'); }
  const motionBar = document.getElementById('imuMotionBar');
  if (motionBar) motionBar.style.width = '0%';
  ['imuRoll','imuPitch'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent='0.0°'; });
  const yr = document.getElementById('imuYawRate'); if(yr) yr.textContent='0.0°/s';
  const gt = document.getElementById('imuGTotal');  if(gt) gt.textContent='1.00g';
  const st = document.getElementById('imuStatus');
  if (st) { st.textContent = 'SIM'; st.style.color = 'var(--text-muted)'; }
}

// ─── ROBOT CONNECTION & WEBSOCKET ───────────────────────────────────────────

let ws = null;
let wsConnected = false;
let robotRunning = false;

function getRobotBase() {
  const ip = document.getElementById('robotIp').value.trim();
  return `http://${ip}:5000`;
}

function getWsUrl() {
  const ip = document.getElementById('robotIp').value.trim();
  return `ws://${ip}:5000/ws`;
}

async function toggleConnect() {
  if (wsConnected) {
    disconnectRobot();
  } else {
    await connectRobot();
  }
}

async function connectRobot() {
  const btn = document.getElementById('connectBtn');
  const label = document.getElementById('connectLabel');
  btn.className = 'connect-pill connecting';
  label.textContent = 'Connecting…';

  // First do a ping check
  try {
    const res = await fetch(getRobotBase() + '/ping', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (!data.ok) throw new Error('Bad response');
  } catch(e) {
    btn.className = 'connect-pill error';
    label.textContent = 'Unreachable';
    addLog('✗ Cannot reach robot at ' + document.getElementById('robotIp').value, 'warn');
    setTimeout(() => { btn.className = 'connect-pill'; label.textContent = 'Connect'; }, 3000);
    return;
  }

  // Open WebSocket
  try {
    ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      wsConnected = true;
      btn.className = 'connect-pill connected';
      label.textContent = '● Connected';
      document.getElementById('sendBtn').style.display = 'inline-flex';
      document.getElementById('robotStopBtn').style.display = 'none';
      document.getElementById('sensorSource').textContent = 'LIVE';
      document.getElementById('sensorSource').classList.add('live');
      addLog('✓ Connected to robot at ' + document.getElementById('robotIp').value, 'info');
      setStatus('idle', 'Robot connected — ready to send program');
      _batteryStartPolling();
      _audioRefreshList();
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        handleWsMessage(msg);
      } catch(e) {}
    };

    ws.onclose = () => {
      wsConnected = false;
      btn.className = 'connect-pill';
      label.textContent = 'Connect';
      document.getElementById('sendBtn').style.display = 'none';
      document.getElementById('robotStopBtn').style.display = 'none';
      document.getElementById('sensorSource').textContent = 'SIM';
      document.getElementById('sensorSource').classList.remove('live');
      const _gs = document.getElementById('groundSource');
      if (_gs) { _gs.textContent = 'SIM'; _gs.classList.remove('live'); }
      const _ts = document.getElementById('tofSource');
      if (_ts) { _ts.textContent = 'SIM'; _ts.classList.remove('live'); }
      updateTof(-1);
      _cameraStopPolling();
      _batteryStopPolling();
      _imuReset();
      _magReset();
      _micReset();
      addLog('⚠ Robot disconnected', 'warn');
      setStatus('idle', 'Robot disconnected');
    };

    ws.onerror = () => {
      addLog('✗ WebSocket error', 'warn');
    };

  } catch(e) {
    btn.className = 'connect-pill error';
    label.textContent = 'Failed';
    addLog('✗ WebSocket failed: ' + e.message, 'warn');
  }
}

function disconnectRobot() {
  if (ws) { ws.close(); ws = null; }
  wsConnected = false;
  const btn = document.getElementById('connectBtn');
  btn.className = 'connect-pill';
  document.getElementById('connectLabel').textContent = 'Connect';
  document.getElementById('sendBtn').style.display = 'none';
  document.getElementById('robotStopBtn').style.display = 'none';
  document.getElementById('sensorSource').textContent = 'SIM';
  document.getElementById('sensorSource').classList.remove('live');
}

function handleWsMessage(msg) {
  // ignore server keepalive pings
  if (msg.type === 'ping') return;
  if (msg.type === 'sensors' && msg.data) {
    const ps = msg.data.ps;
    if (ps && ps.length === 8) {
      setSensors(ps);
    }
    if (msg.data.ground && msg.data.ground.length === 3) {
      updateGroundSensors(msg.data.ground);
      // Update ground source badge
      const gs = document.getElementById('groundSource');
      if (gs && !gs.classList.contains('live')) {
        gs.textContent = 'LIVE';
        gs.classList.add('live');
      }
    }
    if (typeof msg.data.tof_mm !== 'undefined') {
      updateTof(msg.data.tof_mm);
    }
    if (msg.data.imu) {
      updateImu(msg.data.imu);
    }
    if (msg.data.mag) {
      updateMag(msg.data.mag);
    }
    if (msg.data.mic) {
      updateMic(msg.data.mic);
    }
    if (msg.randb && typeof updateRab === 'function') {
      updateRab(msg.randb);
    }
  }

  if (msg.type === 'status') {
    const s = msg.data;
    if (s === 'running') {
      robotRunning = true;
      document.getElementById('robotStopBtn').style.display = 'inline-flex';
      document.getElementById('sendBtn').style.display = 'none';
      setStatus('running', '🤖 Running on robot…');
    } else if (s === 'idle') {
      // Only switch back to Send if we know the script truly finished (not mid-loop)
      if (!robotRunning) {
        document.getElementById('robotStopBtn').style.display = 'none';
        document.getElementById('sendBtn').style.display = 'inline-flex';
      }
      setStatus('idle', wsConnected ? 'Robot ready' : 'Ready');
    } else if (s === 'error') {
      robotRunning = false;
      document.getElementById('robotStopBtn').style.display = 'none';
      document.getElementById('sendBtn').style.display = 'inline-flex';
      setStatus('error', '✗ Robot error: ' + (msg.error || ''));
    }
  }

  if (msg.type === 'log' && msg.data) {
    addLog(msg.data, msg.data.startsWith('✗') ? 'warn' : 'action');
  }

  if (msg.type === 'welcome') {
    // Replay last log lines from robot
    if (msg.logs) {
      msg.logs.slice(-5).forEach(l => addLog('[robot] ' + l, 'action'));
    }
  }
}

async function sendToRobot() {
  if (!wsConnected) {
    addLog('⚠ Not connected to robot', 'warn');
    return;
  }
  if (workspace.getAllBlocks().length === 0) {
    addLog('⚠ No blocks to send!', 'warn');
    return;
  }

  // Use the pre-generated clean code (never read from the DOM)
  const blockCode = _lastGeneratedCode;
  const fullCode =
`# robot, time, math, random are pre-injected by the server
MAX_SPEED = 6.28
CRUISE_SPEED = 0.8 * MAX_SPEED
THRESHOLD = 120.0

timestep = int(robot.getBasicTimeStep())

left_motor = robot.getDevice('left wheel motor')
right_motor = robot.getDevice('right wheel motor')
left_motor.setPosition(float('inf'))
right_motor.setPosition(float('inf'))
left_motor.setVelocity(0.0)
right_motor.setVelocity(0.0)

sensors = []
for i in range(8):
    s = robot.getDevice(f'ps{i}')
    s.enable(timestep)
    sensors.append(s)

ps_values = [0] * 8

${blockCode}`;

  try {
    document.getElementById('sendBtn').style.display = 'none';
    addLog('📤 Sending program to robot…', 'info');

    const res = await fetch(getRobotBase() + '/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: fullCode }),
    });
    const data = await res.json();

    if (data.ok) {
      addLog('✓ Program sent: ' + data.script, 'info');
      robotRunning = true;
      document.getElementById('robotStopBtn').style.display = 'inline-flex';
    } else {
      addLog('✗ ' + data.error, 'warn');
      document.getElementById('sendBtn').style.display = 'inline-flex';
    }
  } catch(e) {
    addLog('✗ Send failed: ' + e.message, 'warn');
    document.getElementById('sendBtn').style.display = 'inline-flex';
  }
}

async function stopRobot() {
  try {
    addLog('⛔ Stopping robot…', 'info');
    await fetch(getRobotBase() + '/stop', { method: 'POST' });
    robotRunning = false;
    document.getElementById('robotStopBtn').style.display = 'none';
    document.getElementById('sendBtn').style.display = 'inline-flex';
  } catch(e) {
    addLog('✗ Stop failed: ' + e.message, 'warn');
  }
}

// Initial status
setStatus('idle', 'Ready — drag blocks to build a program');
addLog('👋 Welcome to e-puck Block Coder!', 'info');
addLog('💡 Enter robot IP above and click Connect', 'info');