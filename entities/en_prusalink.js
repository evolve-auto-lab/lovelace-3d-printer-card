// Entity mappings for Prusa printers (XL, MK4/MK4S, MK3.9, MINI, CORE One)
// using Home Assistant's built-in PrusaLink integration — English.
//
// Entity IDs come from the English entity names, e.g. for a device named "Prusa XL":
//   sensor.prusa_xl                         → printer state (named after the device)
//   sensor.prusa_xl_nozzle_temperature      sensor.prusa_xl_heatbed_temperature
//   sensor.prusa_xl_progress                sensor.prusa_xl_filename
//   sensor.prusa_xl_print_start (timestamp) sensor.prusa_xl_print_finish (timestamp)
//   button.prusa_xl_pause_job / resume_job / cancel_job / continue_job
//   camera.prusa_xl_preview                 → job thumbnail
//
// NOTE: several PrusaLink sensors (temperatures, targets, positions, speed, flow, fans)
// are disabled by default in Home Assistant — enable them on the device page.
//
// "@device" matches the entity whose ID is exactly <domain>.<base_entity>.
export default {
  sensor: [
    ["status", ["@device", "printer_state"]],
    ["progress", ["progress"]],
    ["duration", ["print_start"]],
    ["eta", ["print_finish"]],
    ["filename", ["filename"]],
    ["material", ["material"]],
    ["hotend", ["nozzle_temperature"]],
    ["bed", ["heatbed_temperature"]],
    ["hotend_target", ["nozzle_target_temperature"]],
    ["bed_target", ["heatbed_target_temperature"]],
    ["speed_factor", ["print_speed"]],
    ["flow_factor", ["print_flow"]],
    ["position_x", ["x_position"]],
    ["position_y", ["y_position"]],
    ["position_z", ["z_height"]],
    ["fan_hotend", ["hotend_fan"]],
    ["fan_print", ["print_fan"]],
    ["nozzle_diameter", ["nozzle_diameter"]],
    ["min_extrusion_temp", ["minimum_extrusion_temperature"]]
  ],
  number: [],
  button: [
    ["cancel", ["cancel_job"]],
    ["pause", ["pause_job"]],
    ["resume", ["resume_job"]],
    ["continue", ["continue_job"]]
  ],
  camera: [["thumbnail", ["preview", "job_preview"]]],
  // Roles that are claimed (so they don't show up as stray heaters) but not displayed
  hidden_roles: ["min_extrusion_temp", "nozzle_diameter"],
  ui: {
    eta: "ETA",
    elapsed: "Elapsed",
    file: "File",
    progress: "Progress",
    hotend: "Nozzle",
    bed: "Heatbed",
    speed: "Speed",
    flow: "Flow",
    pause: "Pause",
    resume: "Resume",
    continue: "Continue",
    cancel: "Cancel",
    macros: "Macros",
    move: "Position",
    misc: "Misc",
    more: "More",
    movement: "Position",
    system: "System",
    temperatures: "Temperatures",
    fans_outputs: "Fans",
    material: "Material",
    tools: "Tools",
    tool: "Tool",
    cameras: "Cameras",
    camera_fallback: "Camera",
    home_all: "All"
  }
};
