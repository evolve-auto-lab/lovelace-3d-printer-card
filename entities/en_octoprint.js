// Entity mappings for Home Assistant's built-in OctoPrint integration — English.
// Works for any OctoPrint printer; multi-tool printers (e.g. Prusa XL with up to 5 tools)
// get one row per tool.
//
// Default entity IDs use the "octoprint" prefix; if you renamed the device in HA
// (e.g. to "Prusa XL") and let HA update entity IDs, the prefix becomes prusa_xl:
//   sensor.<base>_current_state              → status (operational/printing/paused/…)
//   sensor.<base>_job_percentage             → progress
//   sensor.<base>_start_time (timestamp)     → elapsed
//   sensor.<base>_estimated_finish_time      → ETA
//   sensor.<base>_current_file               → filename
//   sensor.<base>_actual_tool0_temp … tool4  → per-tool nozzle temperatures
//   sensor.<base>_target_tool0_temp … tool4  → per-tool targets (read-only)
//   number.<base>_extruder_temperature       → tool 0 target (settable)
//   number.<base>_extruder_1_temperature …   → tool 1..n targets (settable)
//   sensor.<base>_actual_bed_temp / number.<base>_bed_temperature
//   button.<base>_pause_job / resume_job / stop_job
//   button.<base>_restart_octoprint / reboot_system / shutdown_system
//   camera.<base>_camera                     → live camera
export default {
  sensor: [
    ["status", ["current_state"]],
    ["progress", ["job_percentage"]],
    ["duration", ["start_time"]],
    ["eta", ["estimated_finish_time"]],
    ["filename", ["current_file"]],
    ["file_size", ["current_file_size"]],
    ["hotend", ["actual_tool0_temp"]],
    ["bed", ["actual_bed_temp"]],
    ["chamber", ["actual_chamber_temp"]],
    ["hotend_target", ["target_tool0_temp"]],
    ["bed_target", ["target_bed_temp"]],
    ["chamber_target", ["target_chamber_temp"]]
  ],
  number: [
    // Settable targets win over the read-only target sensors above
    ["hotend_target", ["extruder_temperature"]],
    ["bed_target", ["bed_temperature"]]
  ],
  button: [
    ["cancel", ["stop_job"]],
    ["pause", ["pause_job"]],
    ["resume", ["resume_job"]],
    ["server_restart", ["restart_octoprint"]],
    ["host_restart", ["reboot_system"]],
    ["host_shutdown", ["shutdown_system"]]
  ],
  camera: [["thumbnail", ["thumbnail", "job_preview"]]],
  hidden_roles: ["file_size"],
  // Unclaimed sensors matching these (suffix after base_entity) are not listed as heaters
  ignore: ["^target_"],
  // Friendly names for Prusa firmware's extra M105 readings (from Prusa-Firmware-Buddy
  // temperature.cpp). Matched against the entity suffix; first match wins.
  // {n} = captured index, {n1} = index + 1 (tools are numbered from 1 on the printer).
  labels: [
    { match: "^actual_a_temp$", label: "Mainboard" },
    { match: "^actual_w_temp$", label: "Bed settle timer", unit: "s" },
    { match: "^actual_x5_temp$", label: "Heatbreak (no tool)" },
    { match: "^actual_x(\\d+)_temp$", label: "Tool {n1} heatbreak" },
    { match: "^actual_chamber_temp$", label: "Chamber" }
  ],
  // Prusa XL reports its 16 heatbed tiles as B_<x>_<y>
  bed_segments: "actual_b_{x}_{y}_temp",
  // Multi-tool discovery. {n} is the zero-based tool index.
  // target_number for tool 0 has no index in HA ("Extruder temperature").
  tools: {
    actual: "actual_tool{n}_temp",
    target_sensor: "target_tool{n}_temp",
    target_number: "extruder_{n}_temperature",
    target_number_first: "extruder_temperature"
  },
  ui: {
    eta: "ETA",
    elapsed: "Elapsed",
    file: "File",
    progress: "Progress",
    hotend: "Nozzle",
    bed: "Bed",
    speed: "Speed",
    flow: "Flow",
    pause: "Pause",
    resume: "Resume",
    continue: "Continue",
    cancel: "Cancel",
    macros: "Macros",
    move: "Move",
    misc: "Temps",
    more: "More",
    movement: "Movement",
    system: "System",
    temperatures: "Temperatures",
    fans_outputs: "Fans & Outputs",
    tools: "Tools",
    tool: "Tool",
    service_control: "Service Control",
    host_control: "Host Control",
    server_restart: "Restart OctoPrint",
    reboot_host: "Reboot Host",
    shutdown_host: "Shutdown Host",
    cameras: "Cameras",
    camera_fallback: "Camera",
    home_all: "All"
  }
};
