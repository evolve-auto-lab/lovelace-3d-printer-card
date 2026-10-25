// =============================================================================
// Lovelace 3D Printer Card  v1.2.0
// A HACS-installable Home Assistant Lovelace card for Moonraker/Klipper, OctoPrint
// and PrusaLink printers — including the multi-tool Prusa XL.
//
// Install via HACS or manually:
//   Place this file in:  /config/www/lovelace-3d-printer-card/lovelace-3d-printer-card.js
//   Register as a Lovelace resource (type: module):
//     url: /local/lovelace-3d-printer-card/lovelace-3d-printer-card.js
//
// Usage:
//   type: custom:lovelace-3d-printer-card
//   name: My Printer
//   base_entity: voron_24
//   printer_type: i3          # i3 | corexy | corexy-flying-gantry | cantilever | prusa-xl
//   entity_mappings: en_octoprint   # optional; auto-detected for OctoPrint/PrusaLink
//   tool_count: 5             # optional; multi-tool printers
//   active_tool: sensor.x     # optional; entity reporting the active tool (1-5 or T0-T4)
//   exclude: [sensor.x, ...]  # optional; entities to leave off the card
//   show_diagnostic_sensors: true  # optional; show Prusa's bed settle timer / no-tool heatbreak
//   font_scale: 0.9           # optional; scale all text
//
// All entity IDs are auto-derived from base_entity, with optional overrides:
//   entities:
//     progress: sensor.my_printer_print_progress
//     status: sensor.my_printer_current_print_state
//     ...
// =============================================================================

const CARD_TAG = 'lovelace-3d-printer-card';

// ── Default entity mappings (fallback when fetch fails) ────────────────────────
const DEFAULT_MAPPINGS = {
  sensor: [
    ['status', ['current_print_state']],
    ['printer_state', ['printer_state']],
    ['progress', ['progress']],
    ['duration', ['print_duration']],
    ['eta', ['print_time_left', 'print_eta']],
    ['filename', ['filename']],
    ['current_layer', ['current_layer']],
    ['total_layers', ['total_layer', 'total_layers']],
    ['filament_used', ['filament_used']],
    ['current_print_message', ['current_print_message']],
    ['current_display_message', ['current_display_message']],
    ['hotend', ['extruder_temperature', 'extruder_temp']],
    ['bed', ['bed_temperature', 'bed_temp']],
    ['position_x', ['toolhead_position_x']],
    ['position_y', ['toolhead_position_y']],
    ['position_z', ['toolhead_position_z']],
    ['object_height', ['object_height']],
  ],
  number: [
    ['hotend_target', ['extruder_target']],
    ['bed_target', ['bed_target']],
    ['chamber_target', ['heater_chamber_target']],
    ['speed_factor', ['speed_factor']],
    ['flow_factor', ['flow_factor']],
  ],
  button: [
    ['cancel', ['cancel_print']],
    ['pause', ['pause_print']],
    ['resume', ['resume_print']],
    ['emergency', ['emergency_stop']],
    ['home_all', ['home_all_axes']],
    ['home_x', ['home_x_axis']],
    ['home_y', ['home_y_axis']],
    ['home_z', ['home_z_axis']],
    ['fw_restart', ['firmware_restart']],
    ['host_restart', ['host_restart']],
    ['server_restart', ['server_restart']],
    ['host_shutdown', ['host_shutdown']],
    ['klipper_restart', ['restart_klipper']],
  ],
  camera: [['thumbnail', ['thumbnail']]],
};

// ── Built-in maps for integrations ─────────────────────────────────────────────
// Mirrors entities/en_octoprint.js and entities/en_prusalink.js. HACS only installs the
// card's own .js file, not the entities/ folder, so these keep auto-detection working.
const BUILTIN_MAPPINGS = {
  octoprint: {
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
    ignore: ["^target_"],
    labels: [
      { match: "^actual_a_temp$", label: "Mainboard" },
      { match: "^actual_w_temp$", label: "Bed settle timer", unit: "s", diagnostic: true },
      { match: "^actual_x5_temp$", label: "Heatbreak (no tool)", diagnostic: true },
      { match: "^actual_x(\\d+)_temp$", label: "Tool {n1} heatbreak" },
      { match: "^actual_chamber_temp$", label: "Chamber" }
    ],
    bed_segments: "actual_b_{x}_{y}_temp",
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
  },
  prusalink: {
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
  },
};

const DEFAULT_UI = {
  eta: 'ETA',
  elapsed: 'Elapsed',
  file: 'File',
  progress: 'Progress',
  hotend: 'Hotend',
  bed: 'Bed',
  speed: 'Speed',
  flow: 'Flow',
  pause: 'Pause',
  resume: 'Resume',
  cancel: 'Cancel',
  macros: 'Macros',
  move: 'Move',
  misc: 'Misc',
  more: 'More',
  movement: 'Movement',
  system: 'System',
  temperatures: 'Temperatures',
  fans_outputs: 'Fans & Outputs',
  klipper_control: 'Klipper Control',
  service_control: 'Service Control',
  host_control: 'Host Control',
  restart_klipper: 'Restart Klipper',
  firmware_restart: 'Firmware Restart',
  server_restart: 'Server Restart',
  host_restart: 'Host Restart',
  host_shutdown: 'Host Shutdown',
  reboot_host: 'Reboot Host',
  shutdown_host: 'Shutdown Host',
  cameras: 'Cameras',
  camera_fallback: 'Camera',
  home_all: 'All',
  continue: 'Continue',
  material: 'Material',
  tools: 'Tools',
  tool: 'Tool',
  bed_segments: 'Bed segments',
  other_sensors: 'Other sensors',
};

// ── State colours ─────────────────────────────────────────────────────────────
const STATE_COLORS = {
  printing:     '#4caf50',
  paused:       '#e5c000',
  idle:         '#757575',
  ready:        '#757575',
  standby:      '#42a5f5',
  error:        '#f44336',
  cancelled:    '#f44336',
  'printing':   '#4caf50',
  'pausing':    '#e5c000',
  'resuming':   '#4caf50',
  'loading':    '#42a5f5',
  'complete':   '#4caf50',
  'startup':    '#42a5f5',
  'shutdown':   '#757575',
  'offline':    '#757575',
  'unknown':    '#757575',
  'off':        '#4a4a4a',
  // PrusaLink states
  'finished':   '#4caf50',
  'stopped':    '#f44336',
  'attention':  '#ff9800',
  'busy':       '#42a5f5',
};

function stateColor(status) {
  if (!status) return STATE_COLORS.idle;
  const s = status.toLowerCase();
  for (const [key, color] of Object.entries(STATE_COLORS)) {
    if (s.includes(key)) return color;
  }
  return STATE_COLORS.idle;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function fmtSeconds(secs) {
  if (secs == null || isNaN(secs) || secs < 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

// Parse duration strings from Moonraker: "21m 10s", "2h 10m", "2h 30m 45s", "18s", "In 2 hours"
function parseDurationToSeconds(v) {
  if (v == null) return null;
  const s = String(v).trim();
  const n = parseFloat(s);
  if (!isNaN(n) && s === String(n)) return n; // plain number (seconds)
  let total = 0;
  const h = s.match(/(\d+)\s*h(?:ours?)?/i);
  const m = s.match(/(\d+)\s*m(?:in(?:utes?)?)?(?!\s*s)/i) || s.match(/(\d+)\s*min/i);
  const sec = s.match(/(\d+)\s*s(?:ec(?:onds?)?)?/i) || s.match(/(\d+)\s*sec/i);
  if (h) total += parseInt(h[1], 10) * 3600;
  if (m) total += parseInt(m[1], 10) * 60;
  if (sec) total += parseInt(sec[1], 10);
  if (total > 0) return total;
  if (!isNaN(n) && n > 0) return n; // fallback: first number (e.g. "In 2 hours" -> 2)
  return null;
}

function fmtTemp(val, unit = '°C') {
  if (val == null || val === 'unknown' || val === 'unavailable') return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return `${Math.round(n)}${unit}`;
}

function fmtPct(val) {
  if (val == null || val === 'unknown' || val === 'unavailable') return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return `${Math.round(n)}%`;
}

function fmtETA(remainingSecs) {
  if (!remainingSecs || isNaN(remainingSecs)) return null;
  const eta = new Date(Date.now() + remainingSecs * 1000);
  return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function truncate(str, maxLen = 22) {
  if (!str) return '';
  const base = str.replace(/\.b?gcode$/i, '');
  if (base.length <= maxLen) return base;
  return base.slice(0, maxLen - 1) + '…';
}

function stVal(hass, entityId) {
  if (!hass || !entityId) return null;
  const st = hass.states[entityId];
  if (!st) return null;
  if (st.state === 'unknown' || st.state === 'unavailable') return null;
  return st.state;
}

function numVal(hass, entityId) {
  const v = stVal(hass, entityId);
  if (v === null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// mode 'remaining': future timestamp → seconds until it (print_eta, PrusaLink print_finish)
// mode 'elapsed':   past timestamp → seconds since it (PrusaLink print_start)
function durationVal(hass, entityId, mode = 'remaining') {
  const v = stVal(hass, entityId);
  if (v == null) return null;
  const deviceClass = attrVal(hass, entityId, 'device_class') || '';
  const unit = (attrVal(hass, entityId, 'unit_of_measurement') || '').toLowerCase();
  const s = String(v).trim();

  if (deviceClass === 'timestamp' || /^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const t = new Date(s).getTime();
    if (!isNaN(t)) {
      return mode === 'elapsed'
        ? Math.max(0, (Date.now() - t) / 1000)
        : Math.max(0, (t - Date.now()) / 1000);
    }
  }

  const n = parseFloat(v);
  if (!isNaN(n) && s === String(n)) {
    if (unit === 'min' || unit === 'minute' || unit === 'minutes') return n * 60;
    if (unit === 'h' || unit === 'hour' || unit === 'hours') return n * 3600;
    return n; // assume seconds
  }
  return parseDurationToSeconds(v);
}

function attrVal(hass, entityId, attr) {
  if (!hass || !entityId) return null;
  const st = hass.states[entityId];
  if (!st) return null;
  return st.attributes?.[attr] ?? null;
}

function friendlyLabel(entityId, prefix) {
  // Strip friendly_name prefix noise, e.g. "Gilbot Nova Macro Filament Load" → "Filament Load"
  return entityId
    .replace(/^[^.]+\./, '')          // remove domain
    .replace(prefix, '')               // remove base prefix
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

// ── Arc math (same technique as AC Card) ──────────────────────────────────────
function arcPath(cx, cy, r, startDeg, sweepDeg) {
  const start = (startDeg - 90) * Math.PI / 180;
  const end = (startDeg + sweepDeg - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// ── SVG Printer Graphics ──────────────────────────────────────────────────────
function _buildObject(progress, maxHeight, objectWidth) {
  const TOTAL_LINES = 12;
  const lineH = maxHeight / TOTAL_LINES;
  const rectH = Math.max(0.5, lineH - 1); // clamp to avoid negative height when objH is small
  const filled = Math.round(progress * TOTAL_LINES);
  let lines = '';
  for (let i = 0; i < TOTAL_LINES; i++) {
    const lineIdx = TOTAL_LINES - 1 - i;
    const y = 0 + i * lineH;
    const isDone = lineIdx < filled;
    if (isDone) {
      lines += `<rect x="0" y="${y}" width="${objectWidth}" height="${rectH}" rx="1" fill="currentColor" opacity="0.85"/>`;
    } else {
      lines += `<rect x="0" y="${y}" width="${objectWidth}" height="${rectH}" rx="1" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.3" stroke-dasharray="3 2"/>`;
    }
  }
  return `<g class="print-object">${lines}</g>`;
}

function svgPrinterI3(progress, hotendOn, bedOn, chamberOn, isPrinting, nozzleX) {
  const W = 200, H = 180;
  const frameColor = 'var(--primary-text-color)';
  const accentColor = 'var(--mode-color)';
  const rodLeft = 30, rodRight = 170;
  const rodTop = 18, rodBottom = 155;
  const bedY = 140;
  const bedW = 100, bedH = 10;
  const bedX = (W - bedW) / 2;
  const objMaxH = bedY - rodTop - 36;
  const objH = Math.max(4, objMaxH * progress);
  const objY = bedY - objH;
  const filled = Math.round(progress * 12);
  const lineH = objH / 12;
  const topOfPrintedY = filled > 0 ? objY + (12 - filled) * lineH : bedY;
  const nozzleTipOffset = 18;
  const gantryY = topOfPrintedY - nozzleTipOffset;
  const nozzleXPos = 55 + (nozzleX ?? 0.5) * 90;
  const nozzleYPos = gantryY + 10;
  const objW = 56;
  const objX = W / 2 - objW / 2;
  const hotendGlow = hotendOn
    ? `<circle cx="${nozzleXPos}" cy="${nozzleYPos + 4}" r="5" fill="#ff8c00" opacity="0.5"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/></circle>`
    : '';
  const bedGlow = bedOn
    ? `<ellipse cx="${bedX + bedW / 2}" cy="${bedY + bedH / 2}" rx="${bedW / 2 + 4}" ry="8" fill="#ff8c00" opacity="0.35"><animate attributeName="opacity" values="0.35;0.6;0.35" dur="2.5s" repeatCount="indefinite"/></ellipse>`
    : '';
  const chamberGlow = chamberOn
    ? `<rect x="${rodLeft - 10}" y="${rodTop - 10}" width="${rodRight - rodLeft + 20}" height="${rodBottom - rodTop + 25}" rx="8" fill="#ff8c00" opacity="0.08"><animate attributeName="opacity" values="0.08;0.18;0.08" dur="3s" repeatCount="indefinite"/></rect>`
    : '';
  const nozzleAnim = isPrinting
    ? `<animateTransform attributeName="transform" type="translate" values="0,0;3,0;0,0;-3,0;0,0" dur="4s" repeatCount="indefinite"/>`
    : '';
  const objectLines = progress > 0 ? _buildObject(progress, objH, objW - 4) : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;color:${accentColor};overflow:visible">
  ${chamberGlow}
  <rect x="${rodLeft - 6}" y="${rodTop - 8}" width="12" height="${rodBottom - rodTop + 16}" rx="3" fill="none" stroke="${frameColor}" stroke-width="2.5" opacity="0.3"/>
  <rect x="${rodRight - 6}" y="${rodTop - 8}" width="12" height="${rodBottom - rodTop + 16}" rx="3" fill="none" stroke="${frameColor}" stroke-width="2.5" opacity="0.3"/>
  <line x1="${rodLeft}" y1="${rodTop}" x2="${rodLeft}" y2="${rodBottom}" stroke="${frameColor}" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
  <line x1="${rodRight}" y1="${rodTop}" x2="${rodRight}" y2="${rodBottom}" stroke="${frameColor}" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
  <line x1="${rodLeft}" y1="${rodTop}" x2="${rodRight}" y2="${rodTop}" stroke="${frameColor}" stroke-width="3" opacity="0.35" stroke-linecap="round"/>
  <line x1="${rodLeft + 6}" y1="${gantryY}" x2="${rodRight - 6}" y2="${gantryY}" stroke="${frameColor}" stroke-width="4" opacity="0.7" stroke-linecap="round"/>
  <rect x="${rodLeft - 4}" y="${gantryY - 6}" width="14" height="12" rx="2" fill="${accentColor}" opacity="0.8"/>
  <rect x="${rodRight - 10}" y="${gantryY - 6}" width="14" height="12" rx="2" fill="${accentColor}" opacity="0.8"/>
  ${bedGlow}
  <rect x="${bedX - 4}" y="${bedY}" width="${bedW + 8}" height="${bedH}" rx="3" fill="${frameColor}" opacity="0.25"/>
  <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH - 2}" rx="2" fill="${bedOn ? '#ff8c00' : accentColor}" opacity="${bedOn ? '0.7' : '0.4'}"/>
  <line x1="${bedX + 8}" y1="${bedY + 3}" x2="${bedX + bedW - 8}" y2="${bedY + 3}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <line x1="${bedX + 8}" y1="${bedY + 6}" x2="${bedX + bedW - 8}" y2="${bedY + 6}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <g transform="translate(${objX}, ${objY})" style="color:${accentColor}">${objectLines}</g>
  ${hotendGlow}
  <g transform="translate(${nozzleXPos}, ${gantryY})"><g>${nozzleAnim}<rect x="-7" y="0" width="14" height="10" rx="2" fill="${accentColor}" opacity="0.9"/><polygon points="-4,10 4,10 0,18" fill="${hotendOn ? '#ff8c00' : accentColor}" opacity="${hotendOn ? '1' : '0.7'}"/></g></g>
</svg>`;
}

// CoreXY: gantry fixed at top, bed (with object) moves down
function svgPrinterCoreXY(progress, hotendOn, bedOn, chamberOn, isPrinting, nozzleX) {
  const W = 200, H = 180;
  const frameColor = 'var(--primary-text-color)';
  const accentColor = 'var(--mode-color)';
  const frameLeft = 22, frameRight = 178, frameTop = 15, frameBottom = 160;
  const gantryY = 38; // fixed at top
  const bedW = 100;
  const bedX = (W - bedW) / 2;
  const bedH = 10;
  const objMaxH = 75;
  const objH = Math.max(4, objMaxH * progress);
  const filled = Math.round(progress * 12);
  const bedYTop = 55;
  const bedY = bedYTop + (filled > 0 ? objH * filled / 12 : 0);
  const objY = bedY - objH;
  const objW = 56;
  const objX = W / 2 - objW / 2;
  const nozzleXPos = 55 + (nozzleX ?? 0.5) * 90;
  const nozzleYPos = gantryY + 12;
  const hotendGlow = hotendOn
    ? `<circle cx="${nozzleXPos}" cy="${nozzleYPos + 4}" r="5" fill="#ff8c00" opacity="0.5"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/></circle>`
    : '';
  const bedGlow = bedOn
    ? `<ellipse cx="${bedX + bedW / 2}" cy="${bedY + bedH / 2}" rx="${bedW / 2 + 4}" ry="8" fill="#ff8c00" opacity="0.35"><animate attributeName="opacity" values="0.35;0.6;0.35" dur="2.5s" repeatCount="indefinite"/></ellipse>`
    : '';
  const chamberGlow = chamberOn
    ? `<rect x="${frameLeft - 8}" y="${frameTop - 8}" width="${frameRight - frameLeft + 16}" height="${frameBottom - frameTop + 16}" rx="8" fill="#ff8c00" opacity="0.08"><animate attributeName="opacity" values="0.08;0.18;0.08" dur="3s" repeatCount="indefinite"/></rect>`
    : '';
  const nozzleAnim = isPrinting
    ? `<animateTransform attributeName="transform" type="translate" values="0,0;3,0;-3,0;0,0" dur="3s" repeatCount="indefinite"/>`
    : '';
  const objectLines = progress > 0 ? _buildObject(progress, objH, objW - 4) : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;color:${accentColor};overflow:visible">
  ${chamberGlow}
  <rect x="${frameLeft}" y="${frameTop}" width="${frameRight - frameLeft}" height="${frameBottom - frameTop}" rx="4" fill="none" stroke="${frameColor}" stroke-width="2.5" opacity="0.35"/>
  <rect x="${frameLeft - 4}" y="${frameTop - 4}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <rect x="${frameRight - 6}" y="${frameTop - 4}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <rect x="${frameLeft - 4}" y="${frameBottom - 6}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <rect x="${frameRight - 6}" y="${frameBottom - 6}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <line x1="${frameLeft + 8}" y1="${gantryY}" x2="${frameRight - 8}" y2="${gantryY}" stroke="${frameColor}" stroke-width="4" opacity="0.6" stroke-linecap="round"/>
  <rect x="${nozzleXPos - 12}" y="${gantryY - 7}" width="24" height="14" rx="3" fill="${accentColor}" opacity="0.85"/>
  <circle cx="${frameLeft + 10}" cy="${gantryY}" r="5" fill="none" stroke="${frameColor}" stroke-width="1.5" opacity="0.4"/>
  <circle cx="${frameRight - 10}" cy="${gantryY}" r="5" fill="none" stroke="${frameColor}" stroke-width="1.5" opacity="0.4"/>
  <line x1="${bedX + 12}" y1="${bedY + bedH}" x2="${bedX + 12}" y2="${frameBottom}" stroke="${frameColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
  <line x1="${bedX + bedW - 12}" y1="${bedY + bedH}" x2="${bedX + bedW - 12}" y2="${frameBottom}" stroke="${frameColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
  ${bedGlow}
  <rect x="${bedX - 4}" y="${bedY}" width="${bedW + 8}" height="${bedH}" rx="3" fill="${frameColor}" opacity="0.25"/>
  <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH - 2}" rx="2" fill="${bedOn ? '#ff8c00' : accentColor}" opacity="${bedOn ? '0.7' : '0.4'}"/>
  <line x1="${bedX + 8}" y1="${bedY + 3}" x2="${bedX + bedW - 8}" y2="${bedY + 3}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <line x1="${bedX + 8}" y1="${bedY + 6}" x2="${bedX + bedW - 8}" y2="${bedY + 6}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <g transform="translate(${objX}, ${objY})" style="color:${accentColor}">${objectLines}</g>
  ${hotendGlow}
  <g transform="translate(${nozzleXPos}, ${gantryY + 7})"><g>${nozzleAnim}<polygon points="-4,0 4,0 0,10" fill="${hotendOn ? '#ff8c00' : accentColor}" opacity="${hotendOn ? '1' : '0.7'}"/></g></g>
</svg>`;
}

// Voron 2.4–style: flying gantry moves up with object
function svgPrinterCoreXYFlyingGantry(progress, hotendOn, bedOn, chamberOn, isPrinting, nozzleX) {
  const W = 200, H = 180;
  const frameColor = 'var(--primary-text-color)';
  const accentColor = 'var(--mode-color)';
  const frameLeft = 22, frameRight = 178, frameTop = 15, frameBottom = 160;
  const frameW = frameRight - frameLeft;
  const frameH = frameBottom - frameTop;
  const bedY = 130;
  const bedW = 100;
  const bedX = (W - bedW) / 2;
  const bedH = 10;
  const objMaxH = bedY - frameTop - 45;
  const objH = Math.max(4, objMaxH * progress);
  const objY = bedY - objH;
  const filled = Math.round(progress * 12);
  const lineH = objH / 12;
  const topOfPrintedY = filled > 0 ? objY + (12 - filled) * lineH : bedY;
  const nozzleTipOffset = 17;
  const railY = topOfPrintedY - nozzleTipOffset;
  const nozzleXPos = 55 + (nozzleX ?? 0.5) * 90;
  const nozzleYPos = railY + 12;
  const objW = 56;
  const objX = W / 2 - objW / 2;
  const hotendGlow = hotendOn
    ? `<circle cx="${nozzleXPos}" cy="${nozzleYPos + 4}" r="5" fill="#ff8c00" opacity="0.5"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/></circle>`
    : '';
  const bedGlow = bedOn
    ? `<ellipse cx="${bedX + bedW / 2}" cy="${bedY + bedH / 2}" rx="${bedW / 2 + 4}" ry="8" fill="#ff8c00" opacity="0.35"><animate attributeName="opacity" values="0.35;0.6;0.35" dur="2.5s" repeatCount="indefinite"/></ellipse>`
    : '';
  const chamberGlow = chamberOn
    ? `<rect x="${frameLeft - 8}" y="${frameTop - 8}" width="${frameW + 16}" height="${frameH + 16}" rx="8" fill="#ff8c00" opacity="0.08"><animate attributeName="opacity" values="0.08;0.18;0.08" dur="3s" repeatCount="indefinite"/></rect>`
    : '';
  const nozzleAnim = isPrinting
    ? `<animateTransform attributeName="transform" type="translate" values="0,0;3,0;-3,0;0,0" dur="3s" repeatCount="indefinite"/>`
    : '';
  const objectLines = progress > 0 ? _buildObject(progress, objH, objW - 4) : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;color:${accentColor};overflow:visible">
  ${chamberGlow}
  <rect x="${frameLeft}" y="${frameTop}" width="${frameW}" height="${frameH}" rx="4" fill="none" stroke="${frameColor}" stroke-width="2.5" opacity="0.35"/>
  <rect x="${frameLeft - 4}" y="${frameTop - 4}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <rect x="${frameRight - 6}" y="${frameTop - 4}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <rect x="${frameLeft - 4}" y="${frameBottom - 6}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <rect x="${frameRight - 6}" y="${frameBottom - 6}" width="10" height="10" rx="2" fill="${accentColor}" opacity="0.6"/>
  <line x1="${frameLeft + 8}" y1="${railY}" x2="${frameRight - 8}" y2="${railY}" stroke="${frameColor}" stroke-width="4" opacity="0.6" stroke-linecap="round"/>
  <rect x="${nozzleXPos - 12}" y="${railY - 7}" width="24" height="14" rx="3" fill="${accentColor}" opacity="0.85"/>
  <circle cx="${frameLeft + 10}" cy="${railY}" r="5" fill="none" stroke="${frameColor}" stroke-width="1.5" opacity="0.4"/>
  <circle cx="${frameRight - 10}" cy="${railY}" r="5" fill="none" stroke="${frameColor}" stroke-width="1.5" opacity="0.4"/>
  <line x1="${frameLeft + 12}" y1="${railY + 20}" x2="${frameLeft + 12}" y2="${bedY + 5}" stroke="${frameColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
  <line x1="${frameRight - 12}" y1="${railY + 20}" x2="${frameRight - 12}" y2="${bedY + 5}" stroke="${frameColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
  ${bedGlow}
  <rect x="${bedX - 4}" y="${bedY}" width="${bedW + 8}" height="${bedH}" rx="3" fill="${frameColor}" opacity="0.25"/>
  <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH - 2}" rx="2" fill="${bedOn ? '#ff8c00' : accentColor}" opacity="${bedOn ? '0.7' : '0.4'}"/>
  <line x1="${bedX + 8}" y1="${bedY + 3}" x2="${bedX + bedW - 8}" y2="${bedY + 3}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <line x1="${bedX + 8}" y1="${bedY + 6}" x2="${bedX + bedW - 8}" y2="${bedY + 6}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <g transform="translate(${objX}, ${objY})" style="color:${accentColor}">${objectLines}</g>
  ${hotendGlow}
  <g transform="translate(${nozzleXPos}, ${railY + 7})"><g>${nozzleAnim}<polygon points="-4,0 4,0 0,10" fill="${hotendOn ? '#ff8c00' : accentColor}" opacity="${hotendOn ? '1' : '0.7'}"/></g></g>
</svg>`;
}

function svgPrinterCantilever(progress, hotendOn, bedOn, chamberOn, isPrinting, nozzleX) {
  const W = 200, H = 180;
  const frameColor = 'var(--primary-text-color)';
  const accentColor = 'var(--mode-color)';
  const uprightX = 35;
  const uprightTop = 15;
  const uprightBottom = 160;
  const baseY = 155;
  const baseLeft = 20;
  const baseRight = 175;
  const bedY = 140;
  const bedW = 110;
  const bedX = (W - bedW) / 2;
  const bedH = 10;
  const objMaxH = bedY - uprightTop - 36;
  const objH = Math.max(4, objMaxH * progress);
  const objY = bedY - objH;
  const filled = Math.round(progress * 12);
  const lineH = objH / 12;
  const topOfPrintedY = filled > 0 ? objY + (12 - filled) * lineH : bedY;
  const nozzleTipOffset = 23;
  const armY = topOfPrintedY - nozzleTipOffset;
  const armRight = baseRight - 5;
  const nozzleXPos = 70 + (nozzleX ?? 0.5) * 80;
  const objW = 60;
  const objX = W / 2 - objW / 2;
  const hotendGlow = hotendOn
    ? `<circle cx="${nozzleXPos}" cy="${armY + 16}" r="5" fill="#ff8c00" opacity="0.5"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/></circle>`
    : '';
  const bedGlow = bedOn
    ? `<ellipse cx="${bedX + bedW / 2}" cy="${bedY + bedH / 2}" rx="${bedW / 2 + 4}" ry="8" fill="#ff8c00" opacity="0.35"><animate attributeName="opacity" values="0.35;0.6;0.35" dur="2.5s" repeatCount="indefinite"/></ellipse>`
    : '';
  const chamberGlow = chamberOn
    ? `<rect x="${baseLeft - 8}" y="${uprightTop - 8}" width="${baseRight - baseLeft + 16}" height="${uprightBottom - uprightTop + 20}" rx="8" fill="#ff8c00" opacity="0.08"><animate attributeName="opacity" values="0.08;0.18;0.08" dur="3s" repeatCount="indefinite"/></rect>`
    : '';
  const nozzleAnim = isPrinting
    ? `<animateTransform attributeName="transform" type="translate" values="0,0;4,0;0,0;-4,0;0,0" dur="3.5s" repeatCount="indefinite"/>`
    : '';
  const objectLines = progress > 0 ? _buildObject(progress, objH, objW - 4) : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;color:${accentColor};overflow:visible">
  ${chamberGlow}
  <rect x="${baseLeft}" y="${baseY}" width="${baseRight - baseLeft}" height="12" rx="4" fill="${frameColor}" opacity="0.25"/>
  <line x1="${baseLeft + 6}" y1="${baseY}" x2="${baseLeft + 6}" y2="${uprightBottom}" stroke="${frameColor}" stroke-width="3" opacity="0.3" stroke-linecap="round"/>
  <rect x="${uprightX - 5}" y="${uprightTop}" width="12" height="${uprightBottom - uprightTop}" rx="3" fill="${frameColor}" opacity="0.2"/>
  <line x1="${uprightX}" y1="${uprightTop}" x2="${uprightX}" y2="${uprightBottom}" stroke="${frameColor}" stroke-width="3.5" opacity="0.65" stroke-linecap="round"/>
  <rect x="${uprightX - 9}" y="${uprightTop - 6}" width="18" height="10" rx="3" fill="${accentColor}" opacity="0.7"/>
  <rect x="${uprightX - 3}" y="${armY - 6}" width="14" height="12" rx="2" fill="${accentColor}" opacity="0.8"/>
  <line x1="${uprightX + 6}" y1="${armY}" x2="${armRight}" y2="${armY}" stroke="${frameColor}" stroke-width="4" opacity="0.7" stroke-linecap="round"/>
  <rect x="${nozzleXPos - 10}" y="${armY - 7}" width="20" height="14" rx="3" fill="${accentColor}" opacity="0.9"/>
  ${bedGlow}
  <rect x="${bedX - 4}" y="${bedY}" width="${bedW + 8}" height="${bedH}" rx="3" fill="${frameColor}" opacity="0.25"/>
  <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH - 2}" rx="2" fill="${bedOn ? '#ff8c00' : accentColor}" opacity="${bedOn ? '0.7' : '0.4'}"/>
  <line x1="${bedX + 10}" y1="${bedY + 3}" x2="${bedX + bedW - 10}" y2="${bedY + 3}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <line x1="${bedX + 10}" y1="${bedY + 6}" x2="${bedX + bedW - 10}" y2="${bedY + 6}" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <g transform="translate(${objX}, ${objY})" style="color:${accentColor}">${objectLines}</g>
  ${hotendGlow}
  <g transform="translate(${nozzleXPos}, ${armY + 7})"><g>${nozzleAnim}<rect x="-5" y="0" width="10" height="8" rx="1" fill="${accentColor}" opacity="0.9"/><polygon points="-4,8 4,8 0,16" fill="${hotendOn ? '#ff8c00' : accentColor}" opacity="${hotendOn ? '1' : '0.7'}"/></g></g>
</svg>`;
}

// Prusa XL: CoreXY, bed moves down in Z, tool-changer docks along the top.
// toolCount 1–5; activeTool is a 0-based index (the dock drawn empty, tool shown on carriage),
// or -1 when no tool is picked (all docks full, bare carriage).
function svgPrinterPrusaXL(progress, hotendOn, bedOn, chamberOn, isPrinting, nozzleX, toolCount = 5, activeTool = 0) {
  const W = 200, H = 180;
  const frameColor = 'var(--primary-text-color)';
  const accentColor = 'var(--mode-color)';
  const frameLeft = 18, frameRight = 182, frameTop = 12, frameBottom = 162;
  const n = Math.min(5, Math.max(1, Math.round(toolCount || 5)));
  const active = (activeTool != null && activeTool >= 0 && activeTool < n) ? activeTool : -1;

  // Tool docks along the top beam
  const dockY = frameTop + 4;
  const dockSpan = frameRight - frameLeft - 30;
  const dockStep = n > 1 ? dockSpan / (n - 1) : 0;
  const dockX0 = n > 1 ? frameLeft + 15 : W / 2;
  let docks = '';
  for (let i = 0; i < n; i++) {
    const x = dockX0 + i * dockStep;
    const parked = i !== active;
    docks += `<rect x="${x - 8}" y="${dockY}" width="16" height="4" rx="1" fill="${frameColor}" opacity="0.35"/>`;
    if (parked) {
      docks += `<rect x="${x - 6}" y="${dockY + 4}" width="12" height="9" rx="2" fill="${accentColor}" opacity="0.45"/>`
             + `<polygon points="${x - 3},${dockY + 13} ${x + 3},${dockY + 13} ${x},${dockY + 18}" fill="${accentColor}" opacity="0.45"/>`;
    } else {
      docks += `<rect x="${x - 6}" y="${dockY + 4}" width="12" height="9" rx="2" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.4" stroke-dasharray="2 2"/>`;
    }
    docks += `<text x="${x}" y="${dockY - 2}" text-anchor="middle" font-size="6" font-family="'Share Tech Mono',monospace" fill="${frameColor}" opacity="${i === active ? 0.9 : 0.4}">${i + 1}</text>`;
  }

  const gantryY = 48;
  const bedW = 112;
  const bedX = (W - bedW) / 2;
  const bedH = 10;
  const objMaxH = 70;
  const objH = Math.max(4, objMaxH * progress);
  const filled = Math.round(progress * 12);
  const bedYTop = 70;
  const bedY = bedYTop + (filled > 0 ? objH * filled / 12 : 0);
  const objY = bedY - objH;
  const objW = 56;
  const objX = W / 2 - objW / 2;
  const nozzleXPos = 50 + (nozzleX ?? 0.5) * 100;
  const hasTool = active >= 0;
  const tipY = gantryY + (hasTool ? 18 : 8);

  const hotendGlow = hotendOn && hasTool
    ? `<circle cx="${nozzleXPos}" cy="${tipY}" r="5" fill="#ff8c00" opacity="0.5"><animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/></circle>`
    : '';
  const bedGlow = bedOn
    ? `<ellipse cx="${bedX + bedW / 2}" cy="${bedY + bedH / 2}" rx="${bedW / 2 + 4}" ry="8" fill="#ff8c00" opacity="0.35"><animate attributeName="opacity" values="0.35;0.6;0.35" dur="2.5s" repeatCount="indefinite"/></ellipse>`
    : '';
  const chamberGlow = chamberOn
    ? `<rect x="${frameLeft - 8}" y="${frameTop - 8}" width="${frameRight - frameLeft + 16}" height="${frameBottom - frameTop + 16}" rx="8" fill="#ff8c00" opacity="0.08"><animate attributeName="opacity" values="0.08;0.18;0.08" dur="3s" repeatCount="indefinite"/></rect>`
    : '';
  const objectLines = progress > 0 ? _buildObject(progress, objH, objW - 4) : '';
  // Bed is segmented on the XL (4×4 heater tiles) — hint with dividers
  const segLines = [1, 2, 3].map(k => {
    const x = bedX + (bedW / 4) * k;
    return `<line x1="${x}" y1="${bedY + 1}" x2="${x}" y2="${bedY + bedH - 3}" stroke="${frameColor}" stroke-width="0.6" opacity="0.35"/>`;
  }).join('');
  const toolOnCarriage = hasTool
    ? `<rect x="-6" y="7" width="12" height="7" rx="2" fill="${accentColor}" opacity="0.9"/><polygon points="-4,14 4,14 0,${18 + 0}" fill="${hotendOn ? '#ff8c00' : accentColor}" opacity="${hotendOn ? '1' : '0.75'}"/>`
    : '';

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;color:${accentColor};overflow:visible">
  ${chamberGlow}
  <rect x="${frameLeft}" y="${frameTop}" width="${frameRight - frameLeft}" height="${frameBottom - frameTop}" rx="4" fill="none" stroke="${frameColor}" stroke-width="2.5" opacity="0.35"/>
  <line x1="${frameLeft}" y1="${dockY}" x2="${frameRight}" y2="${dockY}" stroke="${frameColor}" stroke-width="2" opacity="0.3"/>
  ${docks}
  <line x1="${frameLeft + 6}" y1="${gantryY}" x2="${frameRight - 6}" y2="${gantryY}" stroke="${frameColor}" stroke-width="4" opacity="0.6" stroke-linecap="round"/>
  <circle cx="${frameLeft + 9}" cy="${gantryY}" r="5" fill="none" stroke="${frameColor}" stroke-width="1.5" opacity="0.4"/>
  <circle cx="${frameRight - 9}" cy="${gantryY}" r="5" fill="none" stroke="${frameColor}" stroke-width="1.5" opacity="0.4"/>
  <line x1="${bedX + 14}" y1="${bedY + bedH}" x2="${bedX + 14}" y2="${frameBottom}" stroke="${frameColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
  <line x1="${bedX + bedW - 14}" y1="${bedY + bedH}" x2="${bedX + bedW - 14}" y2="${frameBottom}" stroke="${frameColor}" stroke-width="1.5" opacity="0.3" stroke-dasharray="4 3"/>
  ${bedGlow}
  <rect x="${bedX - 4}" y="${bedY}" width="${bedW + 8}" height="${bedH}" rx="3" fill="${frameColor}" opacity="0.25"/>
  <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH - 2}" rx="2" fill="${bedOn ? '#ff8c00' : accentColor}" opacity="${bedOn ? '0.7' : '0.4'}"/>
  ${segLines}
  <g transform="translate(${objX}, ${objY})" style="color:${accentColor}">${objectLines}</g>
  ${hotendGlow}
  <g transform="translate(${nozzleXPos}, ${gantryY - 7})">
    <rect x="-11" y="0" width="22" height="9" rx="3" fill="${accentColor}" opacity="0.85"/>
    ${toolOnCarriage}
  </g>
</svg>`;
}

function renderPrinterSVG(printerType, progress, hotendTarget, bedTarget, chamberTarget, isPrinting, nozzleX, opts = {}) {
  const isTargetSet = (t) => t != null && !isNaN(Number(t)) && Number(t) > 0;
  const hotendOn = isTargetSet(hotendTarget);
  const bedOn = isTargetSet(bedTarget);
  const chamberOn = isTargetSet(chamberTarget);
  // Progress: accept 0–100 or 0–1
  const p = (progress != null && !isNaN(progress) && progress > 0 && progress <= 1)
    ? Math.min(1, Math.max(0, progress))
    : Math.min(1, Math.max(0, (progress || 0) / 100));
  const nx = Math.min(1, Math.max(0, nozzleX ?? 0.5));
  switch ((printerType || 'i3').toLowerCase()) {
    case 'corexy': return svgPrinterCoreXY(p, hotendOn, bedOn, chamberOn, isPrinting, nx);
    case 'corexy-flying-gantry': return svgPrinterCoreXYFlyingGantry(p, hotendOn, bedOn, chamberOn, isPrinting, nx);
    case 'cantilever': return svgPrinterCantilever(p, hotendOn, bedOn, chamberOn, isPrinting, nx);
    case 'prusa-xl':
    case 'prusa_xl':
    case 'toolchanger':
      return svgPrinterPrusaXL(p, hotendOn, bedOn, chamberOn, isPrinting, nx, opts.toolCount ?? 5, opts.activeTool ?? -1);
    default: return svgPrinterI3(p, hotendOn, bedOn, chamberOn, isPrinting, nx);
  }
}

// ── Stat chips ────────────────────────────────────────────────────────────────
// Temperature chip: current on top, target on a small second line (blank line when
// no target so every chip in the row lines up).
function tempChip(icon, valClass, current, target, label, dim = false) {
  const cur = current != null && !isNaN(current) ? `${Math.round(current)}°` : '—';
  const sub = target ? `→ ${Math.round(target)}°` : '&nbsp;';
  return `<div class="stat-item ${dim ? 'stat-dim' : ''}">
    <span class="stat-icon">${icon}</span>
    <span class="stat-val ${valClass}">${cur}</span>
    <span class="stat-sub">${sub}</span>
    <span class="stat-label">${label}</span>
  </div>`;
}

function statChip(icon, value, label) {
  return `<div class="stat-item">
    <span class="stat-icon">${icon}</span>
    <span class="stat-val">${value}</span>
    <span class="stat-sub">&nbsp;</span>
    <span class="stat-label">${label}</span>
  </div>`;
}

// ── Progress arc (non-interactive, display-only) ──────────────────────────────
function progressArcSVG(pct) {
  const cx = 36, cy = 36, r = 28;
  const startDeg = 135, sweepTotal = 270;
  const sweep = sweepTotal * Math.min(1, Math.max(0, pct / 100));
  const track = arcPath(cx, cy, r, startDeg, sweepTotal);
  const fill = sweep > 0 ? arcPath(cx, cy, r, startDeg, sweep) : '';
  return `<svg viewBox="0 0 72 72" width="72" height="72" style="flex-shrink:0">
    <path d="${track}" fill="none" stroke="var(--divider-color,rgba(255,255,255,.1))" stroke-width="5" stroke-linecap="round"/>
    ${fill ? `<path d="${fill}" fill="none" stroke="var(--mode-color)" stroke-width="5" stroke-linecap="round"/>` : ''}
    <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="13" font-family="'Share Tech Mono',monospace" fill="var(--primary-text-color)" font-weight="600">${Math.round(pct || 0)}%</text>
  </svg>`;
}

// ── Main Card Class ───────────────────────────────────────────────────────────
class PrinterCard3D extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
    this._entities = {};
    this._cameras = [];
    this._macros = [];
    this._heaters = [];
    this._fans = [];
    this._tools = [];
    this._toolsDetected = 0;
    this._bedSegments = [];
    this._serviceButtons = [];
    this._openSheet = null;
    this._confirmEmergency = false;
    this._confirmTimer = null;
    this._animFrame = null;
    this._nozzleX = 0.5;
    this._nozzleDir = 1;
    this._animRunning = false;
    this._camerasOpen = false;
    this._dragging = false;
    this._thumbFailed = false;
    this._thumbLoaded = false;
    this._lastThumbIdentity = null;
    this._lastHtml = {};
    this._lastEntityIds = null;
    this._entityMappings = null;
    this._entityMappingsKey = null;
    this._entityMappingsPromise = null;
    this._bound_click = this._onClick.bind(this);
    this._bound_change = this._onChange.bind(this);
    this._bound_pointerdown = this._onPointerDown.bind(this);
    this._bound_pointerup = this._onPointerUp.bind(this);
  }

  setConfig(config) {
    if (!config.base_entity) throw new Error('lovelace-3d-printer-card: base_entity is required');
    // Tolerate "prusa_xl_" or "sensor.prusa_xl" — the crawler needs the bare prefix.
    const base = String(config.base_entity).trim().replace(/^[a-z_]+\./, '').replace(/_+$/, '');
    this._config = { ...config, base_entity: base };
    if (!this.shadowRoot.innerHTML) this._initialRender();
  }

  set hass(hass) {
    const prev = this._hass;
    this._hass = hass;
    if (!this._config) return;
    const key = this._resolveEntityMappingsKey();
    const haveMappings = this._entityMappings && this._entityMappingsKey === key;
    if (haveMappings) {
      this._crawlEntities();
      if (prev && !this._entitiesChanged(prev, hass)) return;
      this._render(prev);
      return;
    }
    if (!this._entityMappingsPromise || this._entityMappingsKey !== key) {
      this._entityMappingsKey = key;
      this._entityMappingsPromise = this._loadEntityMappings(key);
    }
    this._entityMappingsPromise.then((mappings) => {
      this._entityMappings = mappings;
      this._crawlEntities();
      this._render(prev);
    });
  }

  _resolveEntityMappingsKey() {
    if (this._config?.entity_mappings) return this._config.entity_mappings;
    const lang = this._hass?.locale?.language || this._hass?.language || 'en';
    return `${lang}_${this._detectIntegration()}`;
  }

  // Guess which integration provides the printer from tell-tale entity IDs.
  _detectIntegration() {
    const s = this._hass?.states;
    const b = this._config?.base_entity;
    if (!s || !b) return 'generic';
    if (s[`button.${b}_stop_job`] || s[`sensor.${b}_current_state`] || s[`sensor.${b}_job_percentage`]) return 'octoprint';
    if (s[`button.${b}_cancel_job`] || s[`sensor.${b}_heatbed_temperature`] || s[`camera.${b}_preview`]) return 'prusalink';
    return 'generic';
  }

  _loadEntityMappings(key) {
    const base = new URL('./entities/', import.meta.url).href;
    const url = base + key + '.js';
    return import(/* webpackIgnore: true */ url)
      .then((m) => m.default)
      .catch(() => this._loadEntityMappingsFallback(key));
  }

  // Fallback chain for "<lang>_<variant>":
  //   en_<variant> → <lang>_generic → en_generic → built-in defaults
  _loadEntityMappingsFallback(key) {
    const [lang, ...rest] = key.split('_');
    const variant = rest.join('_') || 'generic';
    const url = (k) => new URL(`./entities/${k}.js`, import.meta.url).href;
    // Built-in integration maps come before any *_generic file so a missing entities/
    // folder (HACS installs) never silently falls back to the Klipper names.
    if (variant !== 'generic' && BUILTIN_MAPPINGS[variant]) {
      return import(/* webpackIgnore: true */ url(`en_${variant}`))
        .then((m) => m.default)
        .catch(() => BUILTIN_MAPPINGS[variant]);
    }
    const chain = [...new Set([`${lang}_generic`, 'en_generic'])].filter(k => k !== key);
    const tryNext = (i) => i >= chain.length
      ? Promise.resolve(DEFAULT_MAPPINGS)
      : import(/* webpackIgnore: true */ url(chain[i])).then((m) => m.default).catch(() => tryNext(i + 1));
    return tryNext(0);
  }

  _t(key) {
    return this._entityMappings?.ui?.[key] ?? DEFAULT_UI[key] ?? key;
  }

  // ── Entity crawler ──────────────────────────────────────────────────────────
  // Single pass over all hass.states entries that include the base prefix.
  // Classifies each into a well-known role or a dynamic bucket (macros/heaters/fans/cameras).

  _crawlEntities() {
    if (!this._hass || !this._config) return;
    const b = this._config.base_entity;

    // Label helper: use friendly_name, strip device prefix + temperature suffixes
    const devicePrefix = new RegExp(`^(${this._config.name || b})\\s+`, 'i');
    const label = (st, id) => {
      const fn = st.attributes?.friendly_name;
      if (fn) {
        return fn
          .replace(devicePrefix, '')
          .replace(/^(octoprint\s+)?actual\s+/i, '')
          .replace(/\s+temperature$/i, '')
          .replace(/\s+temp$/i, '')
          .trim();
      }
      return id.replace(/^[^.]+\./, '').replace(new RegExp(`^${b}_`), '').replace(/_/g, ' ').trim();
    };

    const m = this._entityMappings || DEFAULT_MAPPINGS;
    const buildRoleTable = (arr) => (arr || []).map(([role, patterns]) => [patterns, role]);
    const SENSOR_ROLES = buildRoleTable(m.sensor);
    const NUMBER_ROLES = buildRoleTable(m.number);
    const BUTTON_ROLES = buildRoleTable(m.button);
    const CAMERA_ROLES = buildRoleTable(m.camera);

    const matchRole = (suffix, roleTable) => {
      for (const [patterns, role] of roleTable) {
        for (const p of patterns) {
          if (suffix === p || suffix.endsWith('_' + p)) return role;
        }
      }
      return null;
    };

    // Reset all dynamic buckets
    this._entities = {};
    this._macros = [];
    this._heaters = [];
    this._fans = [];
    this._serviceButtons = [];
    // cameras populated separately below (preserve rotation config)

    const tempTargetIds = new Set(); // number entities claimed as temp targets

    // Two-pass: first pass claims well-known roles and macros/cameras/thumbnail.
    // Second pass handles remaining temp sensors and fans (need to know claimed targets).
    const remainingSensors = []; // [id, st, suffix] for unclaimed temp sensors

    // Integration-specific extras from the mapping file
    const ignoreRes = (m.ignore || []).map(p => new RegExp(p));
    const toolCfg = m.tools || null;
    const toolActualRe = toolCfg ? new RegExp('^' + toolCfg.actual.replace('{n}', '(\\d+)') + '$') : null;
    const segCfg = m.bed_segments || null;
    const segRe = segCfg ? new RegExp('^' + segCfg.replace('{x}', '(\\d+)').replace('{y}', '(\\d+)') + '$') : null;
    const toolActuals = {};   // index → sensor id
    const bedSegments = [];   // { x, y, entity_id }

    const exclude = new Set(this._config.exclude || []);

    for (const [id, st] of Object.entries(this._hass.states)) {
      if (!id.includes(b)) continue;
      // Skip hidden / user-excluded entities
      if (st.attributes?.hidden === true || exclude.has(id)) continue;

      const domain = id.split('.')[0];
      const bare = id.replace(/^[^.]+\./, '');
      // "@device" = entity named after the device itself, e.g. sensor.prusa_xl (PrusaLink state)
      const suffix = bare === b ? '@device' : bare.replace(new RegExp(`^${b}_`), '');

      if (domain === 'sensor' && toolActualRe) {
        const tm = suffix.match(toolActualRe);
        if (tm) { toolActuals[parseInt(tm[1], 10)] = id; continue; }
      }
      if (domain === 'sensor' && segRe) {
        const sm = suffix.match(segRe);
        if (sm) { bedSegments.push({ x: parseInt(sm[1], 10), y: parseInt(sm[2], 10), entity_id: id }); continue; }
      }

      if (domain === 'sensor') {
        const role = matchRole(suffix, SENSOR_ROLES);
        if (role) {
          // Prefer a valid-state entity over an unknown/unavailable one
          const existing = this._entities[role];
          const isNewGood = st.state !== 'unknown' && st.state !== 'unavailable';
          if (!existing) {
            if (isNewGood) this._entities[role] = id;
          } else if (existing.startsWith('number.')) {
            // keep the settable number entity
          } else {
            const existingSt = this._hass.states[existing];
            const isExistingBad = !existingSt || existingSt.state === 'unknown' || existingSt.state === 'unavailable';
            // Prefer canonical temp sensors over short aliases (extruder_temperature > extruder_temp, bed_temperature > bed_temp)
            const preferNew = (role === 'hotend' && id.includes('extruder_temperature') && existing.includes('extruder_temp'))
              || (role === 'bed' && id.includes('bed_temperature') && existing.includes('bed_temp'))
              || (role === 'eta' && id.includes('print_time_left') && existing.includes('print_eta'));
            if ((isExistingBad && isNewGood) || preferNew) this._entities[role] = id;
          }
        } else if (!ignoreRes.some(re => re.test(suffix))) {
          // Collect unclaimed temp sensors for second pass
          const unit = st.attributes?.unit_of_measurement;
          if (unit === '°C' || unit === '°F') remainingSensors.push([id, st, suffix]);
        }

      } else if (domain === 'number') {
        const role = matchRole(suffix, NUMBER_ROLES);
        if (role) {
          // A settable number beats a read-only sensor for the same role (e.g. OctoPrint targets)
          const existing = this._entities[role];
          if (!existing || !existing.startsWith('number.')) this._entities[role] = id;
        }
        // Fans/outputs handled in second pass

      } else if (domain === 'button') {
        // System/action buttons — well-known roles first
        const role = matchRole(suffix, BUTTON_ROLES);
        if (role) {
          if (!this._entities[role]) this._entities[role] = id;
        } else if (suffix.includes('macro_')) {
          // Macro buttons
          const macroLabel = label(st, id)
            .replace(/^macro\s+/i, '')
            .trim();
          this._macros.push({ entity_id: id, label: macroLabel });
        } else if (suffix.startsWith('restart_') || suffix.startsWith('stop_') || suffix.startsWith('start_')) {
          // Service control buttons (restart_klipper, restart_moonraker, restart_crowsnest, etc.)
          this._serviceButtons.push({ entity_id: id, label: label(st, id) });
        }

      } else if (domain === 'camera') {
        const role = matchRole(suffix, CAMERA_ROLES);
        if (role === 'thumbnail' && !this._entities.thumbnail) this._entities.thumbnail = id;
        // Live cameras handled below
      }
    }

    // Sort macros by label
    this._macros.sort((a, b) => a.label.localeCompare(b.label));
    this._serviceButtons.sort((a, b) => a.label.localeCompare(b.label));

    // ── Tools (multi-extruder / tool-changer, e.g. Prusa XL over OctoPrint) ──
    this._tools = [];
    this._toolsDetected = 0;
    if (toolCfg) {
      const S = this._hass.states;
      const idxs = Object.keys(toolActuals).map(Number).sort((a, b2) => a - b2);
      for (const i of idxs) {
        const actualId = toolActuals[i];
        const numSuffix = i === 0 ? toolCfg.target_number_first : toolCfg.target_number.replace('{n}', String(i));
        const numId = numSuffix ? `number.${b}_${numSuffix}` : null;
        const tgtSensorId = toolCfg.target_sensor ? `sensor.${b}_${toolCfg.target_sensor.replace('{n}', String(i))}` : null;
        const targetId = (numId && S[numId]) ? numId : ((tgtSensorId && S[tgtSensorId]) ? tgtSensorId : null);
        if (targetId) tempTargetIds.add(targetId);
        const current = numVal(this._hass, actualId);
        const target = targetId ? numVal(this._hass, targetId) : null;
        this._tools.push({
          index: i,
          label: `${this._t('tool')} ${i + 1}`,
          entity_id: actualId,
          target_entity: targetId,
          writable: !!targetId && targetId.startsWith('number.'),
          current,
          target,
          min_temp: parseFloat(S[targetId]?.attributes?.min ?? 0),
          max_temp: parseFloat(S[targetId]?.attributes?.max ?? 300),
        });
      }
      this._toolsDetected = this._tools.length;
      // Limit to the configured tool count, otherwise hide tools that report no reading
      // (an empty XL tool slot reports a bogus 0–6 °C, or nothing at all).
      const cfgCount = parseInt(this._config.tool_count, 10);
      if (cfgCount > 0) {
        this._tools = this._tools.slice(0, cfgCount);
      } else {
        const present = this._tools.filter(t => (t.current != null && t.current >= 10) || t.target > 0);
        if (present.length) this._tools = present;
      }
      // Tool 0 doubles as the generic hotend if nothing else claimed it
      const t0 = this._tools.find(t => t.index === 0) || this._tools[0];
      if (t0) {
        if (!this._entities.hotend) this._entities.hotend = t0.entity_id;
        if (!this._entities.hotend_target && t0.target_entity) this._entities.hotend_target = t0.target_entity;
      }
    }

    // ── Segmented heatbed (Prusa XL 4×4) ──
    this._bedSegments = bedSegments
      .map(s => ({ ...s, temp: numVal(this._hass, s.entity_id) }))
      .sort((a, c) => (a.y - c.y) || (a.x - c.x));

    // Core temp entity IDs (already in stats bar — exclude from misc heaters list)
    const coreTemps = new Set([this._entities.hotend, this._entities.bed].filter(Boolean));
    const coreTargets = new Set([this._entities.hotend_target, this._entities.bed_target].filter(Boolean));

    // Second pass: unclaimed temp sensors → heaters list
    for (const [sensorId, st, suffix] of remainingSensors) {
      if (coreTemps.has(sensorId)) continue;

      const targetId = sensorId
        .replace(/^sensor\./, 'number.')
        .replace(/_temperature$/, '_target')
        .replace(/_temp$/, '_target');

      if (coreTargets.has(targetId)) continue; // alias of hotend/bed

      const targetSt = this._hass.states[targetId];
      let lbl = label(st, sensorId);
      let hint = null;
      let unit = '°';
      let diagnostic = false;
      for (const r of (m.labels || [])) {
        const mm = suffix.match(new RegExp(r.match));
        if (!mm) continue;
        const fill = (str) => str == null ? null : str
          .replace(/\{n1\}/g, mm[1] != null ? String(parseInt(mm[1], 10) + 1) : '')
          .replace(/\{n\}/g, mm[1] ?? '');
        lbl = fill(r.label) ?? lbl;
        hint = fill(r.hint);
        if (r.unit != null) unit = r.unit;
        diagnostic = !!r.diagnostic;
        break;
      }
      // Diagnostic readings (e.g. Prusa's bed settle timer) are opt-in
      if (diagnostic && !this._config.show_diagnostic_sensors) continue;

      if (targetSt) {
        tempTargetIds.add(targetId);
        this._heaters.push({
          entity_id: sensorId,
          label: lbl,
          current: parseFloat(st.state) || null,
          target: parseFloat(targetSt.state) || null,
          min_temp: parseFloat(targetSt.attributes?.min ?? 0),
          max_temp: parseFloat(targetSt.attributes?.max ?? 300),
          target_entity: targetId,
          readonly: false,
          hint,
          unit,
        });
      } else {
        this._heaters.push({
          entity_id: sensorId,
          label: lbl,
          current: parseFloat(st.state) || null,
          target: null,
          min_temp: null,
          max_temp: null,
          target_entity: null,
          readonly: true,
          hint,
          unit,
        });
      }
    }

    // Fans/outputs: number entities matching fan/filter/exhaust/output_pin patterns,
    // not already claimed as a well-known role or temp target
    const claimedNumbers = new Set(Object.values(this._entities).filter(id => id?.startsWith('number.')));
    const fanPattern = /fan|filter|exhaust|output_pin/i;
    for (const [id, st] of Object.entries(this._hass.states)) {
      if (!id.startsWith('number.') || !id.includes(b)) continue;
      if (st.attributes?.hidden === true) continue;
      if (claimedNumbers.has(id) || tempTargetIds.has(id)) continue;
      if (!fanPattern.test(id)) continue;
      this._fans.push({
        entity_id: id,
        label: label(st, id),
        value: (st.state === 'unknown' || st.state === 'unavailable') ? 0 : (parseFloat(st.state) || 0),
        min: parseFloat(st.attributes?.min ?? 0),
        max: parseFloat(st.attributes?.max ?? 100),
        step: parseFloat(st.attributes?.step ?? 1),
        unit: st.attributes?.unit_of_measurement || '%',
      });
    }

    // Live cameras: auto-discover from hass.states, merge rotation from config
    const rotationConfig = {};
    for (const c of (this._config.cameras || [])) {
      const entry = typeof c === 'string' ? { entity: c, rotate: 0 } : c;
      if (entry.entity) rotationConfig[entry.entity] = entry.rotate || 0;
    }
    this._cameras = [];
    for (const [id, st] of Object.entries(this._hass.states)) {
      if (!id.startsWith('camera.') || !id.includes(b)) continue;
      if (st.attributes?.hidden === true) continue;
      if (id === this._entities.thumbnail) continue; // already claimed as thumbnail
      this._cameras.push({
        entity: id,
        label: label(st, id),
        rotate: rotationConfig[id] ?? 0,
      });
    }
    this._cameras.sort((a, b) => a.entity.localeCompare(b.entity));
  }

  _entitiesChanged(prev, next) {
    for (const id of Object.values(this._entities)) {
      if (!id) continue;
      if (prev.states[id] !== next.states[id]) return true;
    }
    // Track optional power switch
    const ps = this._config?.power_switch;
    if (ps && prev.states[ps] !== next.states[ps]) return true;
    for (const cam of this._cameras) {
      if (prev.states[cam.entity] !== next.states[cam.entity]) return true;
    }
    // Check macro/heater/fan entities (broad pass on base prefix)
    const b = this._config.base_entity;
    for (const id of Object.keys(next.states)) {
      if (id.includes(b) && prev.states[id] !== next.states[id]) return true;
    }
    return false;
  }

  _getChangedRoles(prev, next) {
    const changed = new Set();
    for (const [role, id] of Object.entries(this._entities)) {
      if (!id) continue;
      if (role === 'thumbnail') continue; // updates every frame during print; would cause flicker
      if (prev.states[id] !== next.states[id]) changed.add(role);
    }
    const ps = this._config?.power_switch;
    if (ps && prev.states[ps] !== next.states[ps]) changed.add('power');
    // Do not track camera entity state changes — they update every frame and would cause flicker
    const b = this._config.base_entity;
    for (const id of Object.keys(next.states)) {
      if (id.includes(b) && prev.states[id] !== next.states[id]) changed.add('base');
    }
    return changed;
  }

  _getSectionsToUpdate(changedRoles) {
    const sections = new Set();
    const R = changedRoles;
    if (R.has('status') || R.has('printer_state') || R.has('power')) sections.add('header');
    if (R.has('current_print_message') || R.has('current_display_message')) sections.add('msg');
    if (R.has('progress') || R.has('hotend_target') || R.has('bed_target') || R.has('chamber_target') || R.has('status') || R.has('power')) sections.add('printer');
    if (R.has('hotend') || R.has('bed') || R.has('hotend_target') || R.has('bed_target') || R.has('chamber_target') || R.has('speed_factor') || R.has('flow_factor') || R.has('base')) sections.add('stats');
    if (R.has('progress') || R.has('duration') || R.has('eta') || R.has('current_layer') || R.has('total_layers') || R.has('filament_used') || R.has('filename') || R.has('thumbnail') || R.has('status')) sections.add('tiles');
    if (R.has('status')) sections.add('controls');
    if (R.has('camera')) sections.add('cameras');
    if (R.has('base') || R.has('position_x') || R.has('position_y') || R.has('position_z')) sections.add('sheets');
    return sections;
  }

  _entityExists(key) {
    const id = this._entities[key];
    if (!id || !this._hass) return false;
    return !!this._hass.states[id];
  }

  _stVal(key) { return stVal(this._hass, this._entities[key]); }
  _numVal(key) { return numVal(this._hass, this._entities[key]); }

  // Combines printer_state (ready/startup/shutdown/error) with current_print_state (standby/printing/paused/complete/cancelled/error)
  _effectiveStatus() {
    const printerState = (this._stVal('printer_state') || '').toLowerCase();
    const printState = (this._stVal('status') || '').toLowerCase();
    // Power switch off takes top priority
    const ps = this._config?.power_switch;
    if (ps && this._hass?.states[ps]?.state === 'off') return 'off';
    if (printerState === 'error' || printerState === 'shutdown' || printerState === 'startup') return printerState;
    // Normalise raw strings like "Printing from SD" (older OctoPrint integration) to snake_case
    const raw = printState || printerState || 'idle';
    return raw.replace(/\s+/g, '_');
  }

  // Printing-like states across Klipper, OctoPrint (printing_sd, starting, finishing…) and PrusaLink
  _isPrinting() {
    const s = this._effectiveStatus();
    return s.startsWith('printing') || s.startsWith('starting') || s === 'finishing' || s === 'resuming';
  }

  _isPaused() {
    const s = this._effectiveStatus();
    return s === 'paused' || s === 'pausing' || s === 'attention';
  }

  _statusLabel(status) {
    const LABELS = {
      printing_sd: 'Printing (SD)',
      printing_from_sd: 'Printing (SD)',
      printing_streaming: 'Sending to SD',
      starting_sd: 'Starting (SD)',
      offline_after_error: 'Offline (error)',
      open_serial: 'Connecting',
      detect_serial: 'Connecting',
      transferring_file: 'Transferring',
    };
    if (LABELS[status]) return LABELS[status];
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  }

  // Which tool to draw on the carriage. Config `active_tool` (entity whose state is 1-based
  // "1".."5" or "T0".."T4") wins; otherwise the hottest tool with a target set.
  _svgOpts() {
    const toolCount = parseInt(this._config.tool_count, 10) || (this._tools.length || 5);
    let activeTool = -1;
    const at = this._config.active_tool;
    if (at && this._hass?.states[at]) {
      const raw = String(this._hass.states[at].state).trim();
      const tm = raw.match(/^t(\d+)$/i);
      let idx = -1;
      if (tm) idx = parseInt(tm[1], 10);
      else if (!isNaN(parseInt(raw, 10))) idx = parseInt(raw, 10) - 1;
      const pos = this._tools.findIndex(t => t.index === idx);
      activeTool = pos >= 0 ? pos : idx;
    } else if (this._tools.length) {
      const heated = this._tools.filter(t => t.target > 0).sort((a, b) => (b.current ?? 0) - (a.current ?? 0));
      if (heated.length) activeTool = this._tools.indexOf(heated[0]);
    } else if (this._isPrinting()) {
      activeTool = 0;
    }
    return { toolCount, activeTool };
  }

  _isPowerOff() {
    const printerState = (this._stVal('printer_state') || '').toLowerCase();
    if (printerState === 'shutdown') return true;
    const ps = this._config?.power_switch;
    if (ps && this._hass?.states[ps]?.state === 'off') return true;
    return false;
  }

  // ── Animation ───────────────────────────────────────────────────────────────

  _startNozzleAnim() {
    if (this._animRunning) return;
    this._animRunning = true;
    const tick = () => {
      if (!this._isPrinting()) { this._animRunning = false; return; }
      this._nozzleX += this._nozzleDir * 0.004;
      if (this._nozzleX >= 1) { this._nozzleX = 1; this._nozzleDir = -1; }
      if (this._nozzleX <= 0) { this._nozzleX = 0; this._nozzleDir = 1; }
      const svgEl = this.shadowRoot.querySelector('.printer-svg-wrap');
      if (svgEl) {
        svgEl.innerHTML = renderPrinterSVG(
          this._config.printer_type,
          this._numVal('progress') || 0,
          this._numVal('hotend_target'),
          this._numVal('bed_target'),
          this._numVal('chamber_target') ?? this._heaters.find(h => h.entity_id?.toLowerCase().includes('chamber'))?.target ?? null,
          true,
          this._nozzleX,
          this._svgOpts()
        );
      }
      this._animFrame = requestAnimationFrame(tick);
    };
    this._animFrame = requestAnimationFrame(tick);
  }

  _stopNozzleAnim() {
    this._animRunning = false;
    if (this._animFrame) { cancelAnimationFrame(this._animFrame); this._animFrame = null; }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  _initialRender() {
    this.shadowRoot.innerHTML = `<style>${this._css()}</style><div class="card"></div>`;
    this.shadowRoot.addEventListener('click', this._bound_click);
    this.shadowRoot.addEventListener('input', this._bound_change);
    this.shadowRoot.addEventListener('change', this._bound_change);
    this.shadowRoot.addEventListener('pointerdown', this._bound_pointerdown);
    this.shadowRoot.addEventListener('pointerup', this._bound_pointerup);
    this.shadowRoot.addEventListener('pointercancel', this._bound_pointerup);
  }

  _onPointerDown(e) {
    if (e.target && e.target.type === 'range') this._dragging = true;
  }

  _onPointerUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    // Commit the slider value to HA on release
    const el = e.target;
    if (!el || el.type !== 'range') return;
    const val = parseFloat(el.value);
    if (el.dataset.action === 'set-fan') {
      this._hass.callService('number', 'set_value', { entity_id: el.dataset.entity, value: val });
    } else if (el.dataset.action === 'mv-speed-factor') {
      this._setNumber('speed_factor', val);
    }
  }

  _render(prevHass) {
    if (!this._config || !this._hass) return;
    if (this._dragging) return;
    const card = this.shadowRoot.querySelector('.card');
    if (!card) return;

    this._crawlEntities();

    const status = this._effectiveStatus();
    const mc = stateColor(status);
    card.style.setProperty('--mode-color', mc);
    card.style.setProperty('--chip-bg', hexA(mc, 0.15));
    card.style.setProperty('--p3d-font-scale', String(parseFloat(this._config.font_scale) || 1));

    const entityIds = Object.values(this._entities).filter(Boolean).sort().join(',');
    const structureChanged = this._lastEntityIds !== null && this._lastEntityIds !== entityIds;
    let canIncremental = prevHass && !structureChanged && Object.keys(this._lastHtml).length > 0;

    if (canIncremental) {
      const changedRoles = this._getChangedRoles(prevHass, this._hass);
      const sectionsToUpdate = this._getSectionsToUpdate(changedRoles);
      if (!sectionsToUpdate.size) {
        if (this._isPrinting()) this._startNozzleAnim();
        else this._stopNozzleAnim();
        return;
      }
      if (sectionsToUpdate.has('cameras')) canIncremental = false;
    }

    const parts = this._htmlParts();

    if (canIncremental) {
      const mainEl = card.querySelector('[data-section="main"]');
      if (mainEl && parts.main !== this._lastHtml.main) {
        mainEl.innerHTML = parts.main;
        this._lastHtml.main = parts.main;
      }
    } else {
      card.innerHTML = `<div data-section="main">${parts.main}</div><div data-section="cameras">${parts.cameras}</div>`;
      this._lastHtml = { main: parts.main, cameras: parts.cameras };
      this._lastEntityIds = entityIds;
    }

    if (this._isPrinting()) this._startNozzleAnim();
    else this._stopNozzleAnim();

    if (this._openSheet) {
      const sheet = this.shadowRoot.querySelector(`.sheet[data-sheet="${this._openSheet}"]`);
      const overlay = this.shadowRoot.querySelector('.overlay');
      if (sheet && overlay) { sheet.classList.add('open'); overlay.classList.add('visible'); }
    }

    if (this._camerasOpen) {
      const section = this.shadowRoot.querySelector('.cameras-section');
      if (section) {
        section.classList.add('open');
        this._wireCameraStreams();
      }
    }

    const thumbImg = this.shadowRoot.querySelector('.thumb-img');
    if (thumbImg) {
      thumbImg.onload = () => {
        if (this._thumbLoaded) return;
        this._thumbLoaded = true;
        this._thumbFailed = false;
        this._render(this._hass);
      };
      thumbImg.onerror = () => {
        if (this._thumbFailed) return;
        this._thumbFailed = true;
        this._thumbLoaded = false;
        this._render(this._hass);
      };
    }
  }

  // ── HTML template ───────────────────────────────────────────────────────────

  _htmlParts() {
    const cfg = this._config;
    const status = this._effectiveStatus();
    const statusLabel = this._statusLabel(status);
    const progress = this._numVal('progress') || 0;
    const hotendTemp = this._numVal('hotend');
    const hotendTarget = this._numVal('hotend_target');
    const bedTemp = this._numVal('bed');
    const bedTarget = this._numVal('bed_target');
    const chamberHeater = this._heaters.find(h => h.entity_id && h.entity_id.toLowerCase().includes('chamber'));
    const chamberTemp = chamberHeater?.current ?? null;
    const durationSecs = durationVal(this._hass, this._entities.duration, 'elapsed') ?? this._numVal('duration');
    const currentLayer = this._numVal('current_layer');
    const totalLayers = this._numVal('total_layers');
    const filename = this._stVal('filename');
    const speedFactor = this._numVal('speed_factor');
    const flowFactor = this._numVal('flow_factor');
    const filamentRaw = this._numVal('filament_used');
    const filamentUnit = attrVal(this._hass, this._entities.filament_used, 'unit_of_measurement');
    const filamentUsed = filamentRaw != null
      ? (filamentUnit === 'm' || filamentRaw < 100 ? filamentRaw : filamentRaw / 1000)
      : null;
    const isPrinting = this._isPrinting();
    const isPaused = this._isPaused();
    const isActive = isPrinting || isPaused;
    const movementDisabled = isPrinting && !isPaused; // disable home/jog when printing (allow when paused)

    // Thumbnail: use entity_picture from attributes; fall back to icon on error
    const thumbEntityId = this._entities.thumbnail;
    const thumbState = thumbEntityId ? this._hass.states[thumbEntityId] : null;
    const entityPicture = thumbState?.attributes?.entity_picture || '';
    const thumbSrc = entityPicture
      ? (entityPicture.startsWith('http') ? entityPicture : `${location.origin}${entityPicture}`)
      : '';
    if (!thumbEntityId || !(isPrinting || isPaused)) this._lastThumbIdentity = null;
    else {
      // Use entityId only — access_token rotates on entity updates and would cause fallback resets
      const thumbIdentity = thumbEntityId;
      if (this._lastThumbIdentity !== thumbIdentity) {
        this._lastThumbIdentity = thumbIdentity;
        this._thumbLoaded = false;
        this._thumbFailed = false;
      }
    }
    const hasThumb = !!(thumbEntityId && (isPrinting || isPaused));
    const showThumb = hasThumb && this._thumbLoaded && !this._thumbFailed;

    // ETA — prefer parsed print_time_left; fallback to calculated from duration/progress
    let etaSecs = durationVal(this._hass, this._entities.eta) ?? this._numVal('eta');
    if (!etaSecs && durationSecs != null && progress > 0) {
      etaSecs = (durationSecs / (progress / 100)) - durationSecs;
    }

    const name = cfg.name || 'Printer';
    const cameras = this._cameras;
    const camCount = cameras.length;

    const multiTool = this._tools.length > 1;
    const material = this._stVal('material');
    // Only number entities can be set; PrusaLink/OctoPrint target sensors are read-only
    const isWritable = (role) => !!this._entities[role]?.startsWith('number.') && this._entityExists(role);
    const fanRpms = [['fan_hotend', 'Hotend fan'], ['fan_print', 'Print fan']]
      .filter(([role]) => this._entityExists(role))
      .map(([role, lbl]) => ({ label: lbl, value: this._numVal(role), unit: attrVal(this._hass, this._entities[role], 'unit_of_measurement') || 'rpm' }));
    const hasHomeButtons = this._entityExists('home_all') || this._entityExists('home_x') || this._entityExists('home_y') || this._entityExists('home_z');
    const canJog = !!(this._hass.services?.moonraker?.send_gcode || this._hass.services?.klipper?.send_gcode
      || this._hass.states[`script.${this._config.base_entity}_jog`]);
    const hasMacros = this._macros.length > 0;
    const hasMovement = hasHomeButtons || canJog || this._entityExists('position_x') || this._entityExists('position_z');
    const hasMisc = this._heaters.length > 0 || this._fans.length > 0 || this._tools.length > 0 || this._bedSegments.length > 0
      || fanRpms.length > 0 || this._entityExists('hotend') || this._entityExists('bed');
    const hasSystem = this._entityExists('fw_restart') || this._entityExists('host_restart') || this._entityExists('server_restart') || this._entityExists('host_shutdown') || this._entityExists('klipper_restart') || this._serviceButtons.length > 0;

    // Power switch (optional config entity)
    const powerEntityId = this._config.power_switch || null;
    const powerState = powerEntityId ? this._hass.states[powerEntityId] : null;
    const powerOn = powerState?.state === 'on';

    const layerStr = (currentLayer != null && totalLayers != null)
      ? `${Math.round(currentLayer)} / ${Math.round(totalLayers)}`
      : (currentLayer != null ? `Layer ${Math.round(currentLayer)}` : null);

    const hotendStr = hotendTemp != null
      ? (hotendTarget ? `${Math.round(hotendTemp)}°/${Math.round(hotendTarget)}°` : fmtTemp(hotendTemp))
      : null;
    const bedStr = bedTemp != null
      ? (bedTarget ? `${Math.round(bedTemp)}°/${Math.round(bedTarget)}°` : fmtTemp(bedTemp))
      : null;

    const hasPause    = this._entityExists('pause');
    const hasResume   = this._entityExists('resume');
    const hasCancel   = this._entityExists('cancel');
    const hasEmergency = this._entityExists('emergency');

    // Message banner — combine current_print_message and current_display_message; hide if both empty
    const printMsg = this._stVal('current_print_message');
    const displayMsg = this._stVal('current_display_message');
    const validMsg = (v) => v && v.toLowerCase() !== 'none' && isNaN(parseFloat(v));
    const parts = [printMsg, displayMsg].filter(validMsg);
    const msgText = parts.length > 0 ? parts.join(' · ') : null;
    const isErrorState = status.toLowerCase().includes('error') || status.toLowerCase().includes('cancel');
    const msgColor = stateColor(status);

    // Position values for movement sheet and SVG
    const posX = this._numVal('position_x');
    const posY = this._numVal('position_y');
    const posZ = this._numVal('position_z');

    const main = `
      <!-- Header -->
      <div class="header">
        <div class="printer-name">${name}</div>
        <div class="header-right">
          ${hasEmergency ? `<button class="power-btn estop-btn ${this._confirmEmergency ? 'estop-confirm' : ''}" data-action="emergency" title="${this._confirmEmergency ? 'Confirm emergency stop?' : 'Emergency Stop'}">${ICON_EMERGENCY}</button>` : ''}
          ${powerEntityId ? `<button class="power-btn ${powerOn ? 'power-on' : 'power-off'}" data-action="toggle-power" data-entity="${powerEntityId}" title="${powerOn ? 'Turn off printer' : 'Turn on printer'}">${ICON_POWER}</button>` : ''}
          <div class="state-chip">
            <span class="state-dot"></span>
            <span class="state-label">${statusLabel}</span>
          </div>
        </div>
      </div>

      <!-- Message banner -->
      ${msgText ? `<div class="msg-banner" style="background:${hexA(msgColor, 0.13)};border-color:${hexA(msgColor, 0.35)}">
        <span class="msg-icon">${isErrorState ? ICON_EMERGENCY : ICON_INFO}</span>
        <span class="msg-text">${msgText}</span>
      </div>` : ''}

      <!-- Printer SVG -->
      <div class="printer-section">
        <div class="printer-svg-wrap${this._isPowerOff() ? ' printer-off' : ''}">
          ${renderPrinterSVG(cfg.printer_type, progress, hotendTarget, bedTarget, this._numVal('chamber_target') ?? chamberHeater?.target ?? null, isPrinting, this._nozzleX, this._svgOpts())}
          ${this._isPowerOff() ? `<div class="printer-off-overlay"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.5"><path d="M16.56 5.44l-1.45 1.45A6.97 6.97 0 0 1 17 12a5 5 0 0 1-5 5 5 5 0 0 1-5-5c0-2.04 1.1-3.8 2.71-4.77L8.27 5.79A8.97 8.97 0 0 0 5 12a7 7 0 0 0 7 7 7 7 0 0 0 7-7c0-2.57-1.36-4.81-3.44-6.11zM13 3h-2v10h2V3z"/></svg></div>` : ''}
        </div>
      </div>

      <!-- Stats bar -->
      <div class="stats-bar">
        ${multiTool ? this._tools.map(t => tempChip(ICON_HOTEND, 'hotend-val', t.current, t.target, t.label, !(t.target > 0))).join('') : ''}
        ${!multiTool && hotendTemp != null ? tempChip(ICON_HOTEND, 'hotend-val', hotendTemp, hotendTarget, this._t('hotend')) : ''}
        ${bedTemp != null ? tempChip(ICON_BED, 'bed-val', bedTemp, bedTarget, this._t('bed')) : ''}
        ${this._heaters.filter(h => !h.readonly && h.target_entity).map(h => tempChip(ICON_THERMOMETER, 'heater-val', h.current, h.target, h.label)).join('')}
        ${speedFactor != null ? statChip(ICON_SPEED, fmtPct(speedFactor), this._t('speed')) : ''}
        ${flowFactor != null ? statChip(ICON_FLOW, fmtPct(flowFactor), this._t('flow')) : ''}
        ${material && material !== '---' ? statChip(ICON_SPOOL, material, this._t('material')) : ''}
      </div>

      <div class="sep"></div>

      <!-- Job panel: progress arc + progress / elapsed / ETA rows -->
      <div class="tiles">
        <div class="tile tile-job ${isActive ? '' : 'tile-dim'}">
          <div class="tile-arc">${progressArcSVG(progress)}</div>
          <div class="job-rows">
            <div class="job-row">
              <span class="job-label">${this._t('progress')}</span>
              <span class="job-val mono">${Math.round(progress)}%${layerStr ? `<span class="job-sub"> · ${layerStr}</span>` : ''}</span>
            </div>
            <div class="job-row">
              <span class="job-label">${this._t('elapsed')}</span>
              <span class="job-val mono">${durationSecs != null ? fmtSeconds(durationSecs) : '—'}</span>
            </div>
            <div class="job-row">
              <span class="job-label">${this._t('eta')}</span>
              <span class="job-val mono">${etaSecs != null ? `${fmtSeconds(etaSecs)}${isActive && fmtETA(etaSecs) ? `<span class="job-sub"> · ${fmtETA(etaSecs)}</span>` : ''}` : '—'}</span>
            </div>
            ${filamentUsed != null ? `<div class="job-row">
              <span class="job-label">Filament</span>
              <span class="job-val mono">${filamentUsed.toFixed(2)} m</span>
            </div>` : ''}
          </div>
        </div>

        <!-- File tile — with optional thumbnail -->
        <div class="tile tile-file ${!filename ? 'tile-dim' : ''} ${hasThumb ? 'tile-has-thumb' : ''} ${isActive && showThumb ? 'tile-file-active' : ''}">
          ${hasThumb ? `<div class="thumb-wrap ${showThumb ? 'thumb-loaded' : ''} ${this._thumbFailed ? 'thumb-failed' : ''}">
            <img class="thumb-img" src="${thumbSrc}" alt="thumbnail"/>
            <div class="tile-icon thumb-fallback">${ICON_FILE}</div>
          </div>` : `<div class="tile-icon">${ICON_FILE}</div>`}
          <div class="tile-file-info">
            <div class="tile-label">${this._t('file')}</div>
            <div class="tile-value tile-filename">
              ${filename ? `<span class="filename">${truncate(filename, 36)}</span>` : '<span class="na">—</span>'}
            </div>
          </div>
        </div>
      </div>

      <div class="sep"></div>

      <!-- Controls: print actions + sheets in one even row -->
      <div class="controls">
        ${isActive && isPrinting && hasPause ? `<button class="ctrl-btn ctrl-pause" data-action="pause">${ICON_PAUSE}<span>${this._t('pause')}</span></button>` : ''}
        ${isActive && isPaused && status === 'attention' && this._entityExists('continue') ? `<button class="ctrl-btn ctrl-resume" data-action="continue">${ICON_PLAY}<span>${this._t('continue')}</span></button>` : ''}
        ${isActive && isPaused && status !== 'attention' && hasResume ? `<button class="ctrl-btn ctrl-resume" data-action="resume">${ICON_PLAY}<span>${this._t('resume')}</span></button>` : ''}
        ${isActive && hasCancel ? `<button class="ctrl-btn ctrl-cancel" data-action="cancel">${ICON_STOP}<span>${this._t('cancel')}</span></button>` : ''}
        ${hasMacros ? `<button class="ctrl-btn ctrl-tune" data-action="open-macros">${ICON_MACRO}<span>${this._t('macros')}</span></button>` : ''}
        ${hasMovement ? `<button class="ctrl-btn ctrl-tune" data-action="open-movement">${ICON_MOVE}<span>${this._t('move')}</span></button>` : ''}
        ${hasMisc ? `<button class="ctrl-btn ctrl-tune" data-action="open-misc">${ICON_THERMOMETER}<span>${this._t('misc')}</span></button>` : ''}
        ${hasSystem ? `<button class="ctrl-btn ctrl-tune" data-action="open-system">${ICON_MORE}<span>${this._t('more')}</span></button>` : ''}
      </div>

      <!-- Overlay -->
      <div class="overlay" data-action="close-sheet"></div>

      <!-- Macros sheet -->
      ${hasMacros ? `<div class="sheet" data-sheet="macros">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${ICON_MACRO} ${this._t('macros')}</div>
        <div class="sheet-scroll">
        <div class="macro-list ${movementDisabled ? 'disabled' : ''}">
          ${this._macros.map(m => `<button class="macro-btn" data-action="run-macro" data-entity="${m.entity_id}" ${movementDisabled ? 'disabled' : ''}>
            ${ICON_PLAY} ${m.label}
          </button>`).join('')}
        </div>
        </div>
      </div>` : ''}

      <!-- Movement sheet -->
      ${hasMovement ? `<div class="sheet" data-sheet="movement">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${ICON_MOVE} ${this._t('movement')}</div>
        <div class="sheet-scroll">

        ${(posX != null || posY != null || posZ != null) ? `<div class="pos-bar ${movementDisabled ? 'disabled' : ''}">
          ${posX != null ? `<div class="pos-item"><span class="pos-axis pos-x">X</span><span class="pos-val mono">${posX.toFixed(1)}</span></div>` : ''}
          ${posY != null ? `<div class="pos-item"><span class="pos-axis pos-y">Y</span><span class="pos-val mono">${posY.toFixed(1)}</span></div>` : ''}
          ${posZ != null ? `<div class="pos-item"><span class="pos-axis pos-z">Z</span><span class="pos-val mono">${posZ.toFixed(1)}</span></div>` : ''}
        </div>` : ''}

        ${hasHomeButtons ? `<div class="home-row ${movementDisabled ? 'disabled' : ''}">
          ${this._entityExists('home_all') ? `<button class="home-btn" data-action="home-axis" data-axis="all" ${movementDisabled ? 'disabled' : ''}>${ICON_HOME} ${this._t('home_all')}</button>` : ''}
          ${this._entityExists('home_x') ? `<button class="home-btn home-x" data-action="home-axis" data-axis="x" ${movementDisabled ? 'disabled' : ''}>X</button>` : ''}
          ${this._entityExists('home_y') ? `<button class="home-btn home-y" data-action="home-axis" data-axis="y" ${movementDisabled ? 'disabled' : ''}>Y</button>` : ''}
          ${this._entityExists('home_z') ? `<button class="home-btn home-z" data-action="home-axis" data-axis="z" ${movementDisabled ? 'disabled' : ''}>Z</button>` : ''}
        </div>` : ''}

        ${canJog ? `<div class="jog-section ${movementDisabled ? 'disabled' : ''}">
          <!-- XY jog cross -->
          <div class="jog-xy">
            <div class="jog-xy-top">
              ${[100,10,1].map(d => `<button class="jog-btn" data-action="jog" data-axis="y" data-dist="${d}" ${movementDisabled ? 'disabled' : ''}>+${d}</button>`).join('')}
            </div>
            <div class="jog-xy-mid">
              ${[100,10,1].map(d => `<button class="jog-btn" data-action="jog" data-axis="x" data-dist="-${d}" ${movementDisabled ? 'disabled' : ''}>-${d}</button>`).join('')}
              <div class="jog-center">${ICON_MOVE}</div>
              ${[1,10,100].map(d => `<button class="jog-btn" data-action="jog" data-axis="x" data-dist="${d}" ${movementDisabled ? 'disabled' : ''}>+${d}</button>`).join('')}
            </div>
            <div class="jog-xy-bot">
              ${[1,10,100].map(d => `<button class="jog-btn" data-action="jog" data-axis="y" data-dist="-${d}" ${movementDisabled ? 'disabled' : ''}>-${d}</button>`).join('')}
            </div>
          </div>

          <!-- Z jog column -->
          <div class="jog-z">
            <div class="jog-z-label pos-z">Z</div>
            ${[10,1,0.1].map(d => `<button class="jog-btn jog-z-btn" data-action="jog" data-axis="z" data-dist="${d}" ${movementDisabled ? 'disabled' : ''}>+${d}</button>`).join('')}
            <div class="jog-z-sep"></div>
            ${[0.1,1,10].map(d => `<button class="jog-btn jog-z-btn" data-action="jog" data-axis="z" data-dist="-${d}" ${movementDisabled ? 'disabled' : ''}>-${d}</button>`).join('')}
          </div>
        </div>` : ''}

        ${isWritable('speed_factor') ? `<div class="tune-row" style="margin-top:12px">
          <div class="tune-row-header">
            <span class="tune-row-label">${ICON_SPEED} ${this._t('speed')}</span>
            <span class="tune-row-val mono" id="mv-speed-val">${fmtPct(speedFactor)}</span>
          </div>
          <input type="range" class="tune-slider" data-action="mv-speed-factor" min="10" max="200" step="1" value="${Math.round(speedFactor || 100)}"/>
        </div>` : ''}
        </div>
      </div>` : ''}

      <!-- Misc sheet (heaters + fans) -->
      ${hasMisc ? `<div class="sheet" data-sheet="misc">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${ICON_THERMOMETER} ${this._t('misc')}</div>
        <div class="sheet-scroll">
        <div class="temps-body">

          ${(this._heaters.length > 0 || this._entityExists('hotend') || this._entityExists('bed')) ? `
          <div class="temps-section-label">${this._t('temperatures')}</div>
          ${!multiTool && this._entityExists('hotend') ? `<div class="temp-row">
            <div class="temp-row-info"><span class="temp-row-name">${this._t('hotend')}</span></div>
            <div class="temp-row-ctrl">
              <span class="temp-current mono">${hotendTemp != null ? hotendTemp.toFixed(1) + '°' : '—'}</span>
              ${isWritable('hotend_target') ? `
              <span class="temp-arrow">→</span>
              <input type="number" class="temp-input"
                data-action="set-temp"
                data-entity="${this._entities.hotend}"
                data-target-entity="${this._entities.hotend_target}"
                min="0" max="300" step="1"
                value="${hotendTarget != null ? Math.round(hotendTarget) : 0}"
              />
              <span class="temp-unit">°C</span>` : ''}
            </div>
          </div>` : ''}
          ${multiTool ? this._tools.map(t => `<div class="temp-row">
            <div class="temp-row-info">
              <span class="temp-row-name">${t.label}</span>
              ${t.target > 0 ? `<span class="temp-row-state temp-state-active">on</span>` : ''}
            </div>
            <div class="temp-row-ctrl">
              <span class="temp-current mono">${t.current != null ? t.current.toFixed(1) + '°' : '—'}</span>
              ${t.writable ? `
              <span class="temp-arrow">→</span>
              <input type="number" class="temp-input"
                data-action="set-temp"
                data-entity="${t.entity_id}"
                data-target-entity="${t.target_entity}"
                min="${t.min_temp}" max="${t.max_temp}" step="1"
                value="${t.target != null ? Math.round(t.target) : 0}"
              />
              <span class="temp-unit">°C</span>` : (t.target ? `<span class="temp-arrow">→</span><span class="temp-current mono">${Math.round(t.target)}°</span>` : '')}
            </div>
          </div>`).join('') : ''}
          ${this._entityExists('bed') ? `<div class="temp-row">
            <div class="temp-row-info"><span class="temp-row-name">${this._t('bed')}</span></div>
            <div class="temp-row-ctrl">
              <span class="temp-current mono">${bedTemp != null ? bedTemp.toFixed(1) + '°' : '—'}</span>
              ${isWritable('bed_target') ? `
              <span class="temp-arrow">→</span>
              <input type="number" class="temp-input"
                data-action="set-temp"
                data-entity="${this._entities.bed}"
                data-target-entity="${this._entities.bed_target}"
                min="0" max="150" step="1"
                value="${bedTarget != null ? Math.round(bedTarget) : 0}"
              />
              <span class="temp-unit">°C</span>` : ''}
            </div>
          </div>` : ''}
          ${this._heaters.filter(h => !h.readonly).map(h => `<div class="temp-row">
            <div class="temp-row-info">
              <span class="temp-row-name">${h.label}</span>
              ${h.hint ? `<span class="temp-row-hint">${h.hint}</span>` : ''}
              ${h.state != null ? `<span class="temp-row-state ${h.state !== 'off' ? 'temp-state-active' : ''}">${h.state}</span>` : ''}
            </div>
            <div class="temp-row-ctrl">
              <span class="temp-current mono">${h.current != null ? (h.unit === '°' ? h.current.toFixed(1) + '°' : `${Math.round(h.current)} ${h.unit}`) : '—'}</span>
              ${h.readonly ? '' : `
              <span class="temp-arrow">→</span>
              <input type="number" class="temp-input"
                data-action="set-temp"
                data-entity="${h.entity_id}"
                data-target-entity="${h.target_entity || ''}"
                min="${h.min_temp}" max="${h.max_temp}" step="1"
                value="${h.target != null ? Math.round(h.target) : 0}"
              />
              <span class="temp-unit">°C</span>`}
            </div>
          </div>`).join('')}
          ${this._heaters.some(h => h.readonly) ? `<div class="temps-section-label" style="margin-top:14px">${this._t('other_sensors')}</div>` : ''}
          ${this._heaters.filter(h => h.readonly).map(h => `<div class="temp-row">
            <div class="temp-row-info">
              <span class="temp-row-name">${h.label}</span>
              ${h.hint ? `<span class="temp-row-hint">${h.hint}</span>` : ''}
              ${h.state != null ? `<span class="temp-row-state ${h.state !== 'off' ? 'temp-state-active' : ''}">${h.state}</span>` : ''}
            </div>
            <div class="temp-row-ctrl">
              <span class="temp-current mono">${h.current != null ? (h.unit === '°' ? h.current.toFixed(1) + '°' : `${Math.round(h.current)} ${h.unit}`) : '—'}</span>
              ${h.readonly ? '' : `
              <span class="temp-arrow">→</span>
              <input type="number" class="temp-input"
                data-action="set-temp"
                data-entity="${h.entity_id}"
                data-target-entity="${h.target_entity || ''}"
                min="${h.min_temp}" max="${h.max_temp}" step="1"
                value="${h.target != null ? Math.round(h.target) : 0}"
              />
              <span class="temp-unit">°C</span>`}
            </div>
          </div>`).join('')}` : ''}

          ${this._bedSegments.length > 0 ? this._bedHeatmapHtml() : ''}

          ${fanRpms.length > 0 ? `
          <div class="temps-section-label" style="margin-top:14px">${this._t('fans_outputs')}</div>
          ${fanRpms.map(f => `<div class="temp-row">
            <div class="temp-row-info"><span class="temp-row-name">${f.label}</span></div>
            <div class="temp-row-ctrl"><span class="temp-current mono">${f.value != null ? Math.round(f.value) : '—'} ${f.unit}</span></div>
          </div>`).join('')}` : ''}

          ${this._fans.length > 0 ? `
          <div class="temps-section-label" style="margin-top:${this._heaters.length > 0 ? '14px' : '0'}">${this._t('fans_outputs')}</div>
          ${this._fans.map(f => `<div class="fan-row">
            <div class="fan-row-info">
              <span class="fan-name">${f.label}</span>
              <span class="fan-val mono" id="fan-val-${f.entity_id.replace(/\./g, '-')}">${f.value}${f.unit}</span>
            </div>
            <input type="range" class="tune-slider"
              data-action="set-fan"
              data-entity="${f.entity_id}"
              data-display="fan-val-${f.entity_id.replace(/\./g, '-')}"
              data-unit="${f.unit}"
              min="${f.min}" max="${f.max}" step="${f.step}"
              value="${f.value}"
            />
          </div>`).join('')}` : ''}

        </div>
        </div>
        </div>` : ''}

      <!-- System sheet -->
      ${hasSystem ? `<div class="sheet" data-sheet="system">
        <div class="sheet-handle"></div>
        <div class="sheet-title">${ICON_MORE} ${this._t('system')}</div>
        <div class="sheet-scroll">
        <div class="system-body">

          ${(this._entityExists('fw_restart') || this._entityExists('klipper_restart')) ? `
          <div class="sys-section-label">${this._t('klipper_control')}</div>
          ${this._entityExists('klipper_restart') ? `<button class="system-btn" data-action="system-action" data-entity="${this._entities.klipper_restart}">${ICON_RESTART} ${this._t('restart_klipper')}</button>` : ''}
          ${this._entityExists('fw_restart') ? `<button class="system-btn" data-action="system-action" data-entity="${this._entities.fw_restart}">${ICON_RESTART} ${this._t('firmware_restart')}</button>` : ''}
          ` : ''}

          ${this._serviceButtons.length > 0 ? `
          <div class="sys-section-label">${this._t('service_control')}</div>
          ${this._serviceButtons.map(b => `<button class="system-btn system-btn-service" data-action="system-action" data-entity="${b.entity_id}">${ICON_RESTART} ${b.label}</button>`).join('')}
          ` : ''}

          ${(this._entityExists('host_restart') || this._entityExists('host_shutdown') || this._entityExists('server_restart')) ? `
          <div class="sys-section-label">${this._t('host_control')}</div>
          ${this._entityExists('server_restart') ? `<button class="system-btn" data-action="system-action" data-entity="${this._entities.server_restart}">${ICON_RESTART} ${this._t('server_restart')}</button>` : ''}
          ${this._entityExists('host_restart') ? `<button class="system-btn system-btn-danger" data-action="system-action" data-entity="${this._entities.host_restart}">${ICON_EMERGENCY} ${this._t('reboot_host')}</button>` : ''}
          ${this._entityExists('host_shutdown') ? `<button class="system-btn system-btn-danger" data-action="system-action" data-entity="${this._entities.host_shutdown}">${ICON_EMERGENCY} ${this._t('shutdown_host')}</button>` : ''}
          ` : ''}

        </div>
        </div>
      </div>` : ''}
    `;

    const camerasHtml = camCount > 0 ? `<button class="camera-btn ${this._camerasOpen ? 'active' : ''}" data-action="toggle-cameras">
        ${ICON_CAMERA}
        <span>${this._t('cameras')}</span>
        <span class="cam-badge">${camCount}</span>
        <span class="cam-chevron ${this._camerasOpen ? 'open' : ''}">${ICON_CHEVRON}</span>
      </button>
      <div class="cameras-section">
        <div class="camera-views">
          ${cameras.map((cam, i) => `<div class="cam-view">
            <div class="cam-label">${cam.label || `${this._t('camera_fallback')} ${i + 1}`}</div>
            <div class="cam-stream-wrap" style="--cam-rotate:${cam.rotate}deg">
              <ha-camera-stream class="cam-stream" data-cam-idx="${i}" allow-exoplayer muted></ha-camera-stream>
            </div>
          </div>`).join('')}
        </div>
      </div>` : '';

    return { main, cameras: camerasHtml };
  }

  // Segmented heatbed (Prusa XL, 4×4 tiles) as a small heatmap. Back row on top.
  _bedHeatmapHtml() {
    const segs = this._bedSegments;
    const xs = [...new Set(segs.map(s => s.x))].sort((a, b) => a - b);
    const ys = [...new Set(segs.map(s => s.y))].sort((a, b) => b - a);
    const byKey = Object.fromEntries(segs.map(s => [`${s.x}_${s.y}`, s]));
    const temps = segs.map(s => s.temp).filter(t => t != null);
    const avg = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
    const cell = (s) => {
      if (!s || s.temp == null) return `<div class="bed-cell bed-cell-na">—</div>`;
      // 25 °C → cool, 110 °C → hot
      const k = Math.min(1, Math.max(0, (s.temp - 25) / 85));
      return `<div class="bed-cell" style="background:rgba(255,140,0,${(0.08 + k * 0.72).toFixed(2)})" title="${s.x},${s.y}: ${s.temp.toFixed(1)}°C">${Math.round(s.temp)}°</div>`;
    };
    return `
      <div class="temps-section-label" style="margin-top:14px">${this._t('bed_segments')}${avg != null ? ` <span class="bed-avg mono">⌀ ${avg.toFixed(1)}°</span>` : ''}</div>
      <div class="bed-grid" style="grid-template-columns:repeat(${xs.length},1fr)">
        ${ys.map(y => xs.map(x => cell(byKey[`${x}_${y}`])).join('')).join('')}
      </div>`;
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  _onClick(e) {
    const el = e.composedPath().find(n => n.dataset && n.dataset.action);
    if (!el) return;
    const action = el.dataset.action;

    switch (action) {
      case 'toggle-cameras':  this._toggleCameras(); break;
      case 'toggle-power': {
        const pId = el.dataset.entity;
        if (pId) this._hass.callService('switch', 'toggle', { entity_id: pId });
        break;
      }
      case 'open-macros':     this._openSheetPanel('macros'); break;
      case 'open-movement':   this._openSheetPanel('movement'); break;
      case 'open-misc':       this._openSheetPanel('misc'); break;
      case 'open-system':     this._openSheetPanel('system'); break;
      case 'close-sheet':     this._closeSheet(); break;
      case 'pause':           this._pressButton('pause'); break;
      case 'resume':          this._pressButton('resume'); break;
      case 'continue':        this._pressButton('continue'); break;
      case 'cancel':          this._pressButton('cancel'); break;
      case 'emergency':       this._handleEmergency(); break;
      case 'run-macro':       this._runMacro(el.dataset.entity); break;
      case 'home-axis':       this._homeAxis(el.dataset.axis); break;
      case 'jog':             this._jog(el.dataset.axis, parseFloat(el.dataset.dist)); break;
      case 'system-action':   this._pressEntityButton(el.dataset.entity); break;
    }
  }

  _onChange(e) {
    const el = e.target;
    if (!el.dataset.action) return;
    const val = parseFloat(el.value);

    switch (el.dataset.action) {
      case 'mv-speed-factor': {
        const d = this.shadowRoot.querySelector('#mv-speed-val');
        if (d) d.textContent = `${val}%`;
        break;
      }
      case 'set-fan': {
        // Only update the display label during drag; service call fires on pointerup
        const displayId = el.dataset.display;
        const unit = el.dataset.unit || '%';
        const d = this.shadowRoot.querySelector(`#${displayId}`);
        if (d) d.textContent = `${val}${unit}`;
        break;
      }
      case 'set-temp': {
        if (e.type === 'change') {
          const targetEntity = el.dataset.targetEntity;
          if (targetEntity) {
            // sensor + number pair — set via number.set_value on the target entity
            this._hass.callService('number', 'set_value', { entity_id: targetEntity, value: val });
          } else {
            // climate entity — set via climate.set_temperature
            this._hass.callService('climate', 'set_temperature', {
              entity_id: el.dataset.entity,
              temperature: val,
            });
          }
        }
        break;
      }
    }
  }

  // ── Sheet management ────────────────────────────────────────────────────────

  _openSheetPanel(name) {
    this._openSheet = name;
    const sheet = this.shadowRoot.querySelector(`.sheet[data-sheet="${name}"]`);
    const overlay = this.shadowRoot.querySelector('.overlay');
    if (sheet) sheet.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    if (sheet) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const card = this.shadowRoot.querySelector('.card');
          if (!card) return;
          const cardRect = card.getBoundingClientRect();
          if (cardRect.bottom > window.innerHeight) {
            this.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 50);
      });
    }
  }

  _closeSheet() {
    this._openSheet = null;
    this.shadowRoot.querySelectorAll('.sheet').forEach(s => s.classList.remove('open'));
    const overlay = this.shadowRoot.querySelector('.overlay');
    if (overlay) overlay.classList.remove('visible');
  }

  _toggleCameras() {
    this._camerasOpen = !this._camerasOpen;
    const section = this.shadowRoot.querySelector('.cameras-section');
    const btn = this.shadowRoot.querySelector('.camera-btn');
    const chevron = this.shadowRoot.querySelector('.cam-chevron');
    if (!section) return;
    if (this._camerasOpen) {
      section.classList.add('open');
      btn?.classList.add('active');
      chevron?.classList.add('open');
      this._wireCameraStreams();
    } else {
      section.classList.remove('open');
      btn?.classList.remove('active');
      chevron?.classList.remove('open');
    }
  }

  _wireCameraStreams() {
    this.shadowRoot.querySelectorAll('.cam-stream[data-cam-idx]').forEach(el => {
      const idx = parseInt(el.dataset.camIdx, 10);
      const cam = this._cameras[idx];
      if (!cam || !this._hass) return;
      const stateObj = this._hass.states[cam.entity];
      if (!stateObj) return;
      el.hass = this._hass;
      el.stateObj = stateObj;
    });
  }

  // ── Service calls ───────────────────────────────────────────────────────────

  _pressButton(key) {
    const id = this._entities[key];
    if (!id || !this._hass) return;
    this._hass.callService('button', 'press', { entity_id: id });
  }

  _pressEntityButton(entityId) {
    if (!entityId || !this._hass) return;
    this._hass.callService('button', 'press', { entity_id: entityId });
  }

  _setNumber(key, val) {
    const id = this._entities[key];
    if (!id || !this._hass) return;
    this._hass.callService('number', 'set_value', { entity_id: id, value: val });
  }

  _runMacro(entityId) {
    if (!entityId || !this._hass) return;
    this._hass.callService('button', 'press', { entity_id: entityId });
  }

  _homeAxis(axis) {
    const keyMap = { all: 'home_all', x: 'home_x', y: 'home_y', z: 'home_z' };
    this._pressButton(keyMap[axis]);
  }

  _jog(axis, dist) {
    if (!this._hass || !axis || isNaN(dist)) return;
    // Use moonraker REST API via HA script service or direct gcode service
    // Most moonraker integrations expose a script or button for relative moves.
    // We send a MOVE gcode via the moonraker.send_gcode HA service if available,
    // otherwise fall back to calling the firmware_restart as a no-op placeholder.
    const gcodeMap = { x: 'X', y: 'Y', z: 'Z' };
    const axis_letter = gcodeMap[axis.toLowerCase()];
    if (!axis_letter) return;
    const gcode = `G91\nG0 ${axis_letter}${dist} F3000\nG90`;
    // Try moonraker gcode service first
    if (this._hass.services?.moonraker?.send_gcode || this._hass.services?.klipper?.send_gcode) {
      const domain = this._hass.services?.moonraker?.send_gcode ? 'moonraker' : 'klipper';
      this._hass.callService(domain, 'send_gcode', { gcode });
    } else {
      // Fallback: call a HA script named <base>_jog_<axis>_<dist> if it exists
      const scriptId = `script.${this._config.base_entity}_jog`;
      if (this._hass.states[scriptId]) {
        this._hass.callService('script', 'turn_on', { entity_id: scriptId, variables: { axis, distance: dist } });
      }
    }
  }

  _handleEmergency() {
    if (!this._confirmEmergency) {
      this._confirmEmergency = true;
      this._render();
      this._confirmTimer = setTimeout(() => {
        this._confirmEmergency = false;
        this._render();
      }, 4000);
    } else {
      clearTimeout(this._confirmTimer);
      this._confirmEmergency = false;
      this._pressButton('emergency');
    }
  }

  // ── CSS ──────────────────────────────────────────────────────────────────────

  _css() {
    return `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

:host { display: block; }

.stat-dim { opacity: 0.45; }
.bed-grid { display: grid; gap: 3px; margin: 6px 0 4px; }
.bed-cell {
  font-family: 'Share Tech Mono', monospace; font-size: 11px; text-align: center;
  padding: 6px 0; border-radius: 4px; color: var(--primary-text-color);
  border: 1px solid var(--divider-color, rgba(255,255,255,.08));
}
.bed-cell-na { opacity: 0.4; }
.temp-row-hint { display:block; font-size:.72em; color:var(--secondary-text-color); opacity:.75; margin-top:1px; }
.bed-avg { font-weight: 400; opacity: 0.7; margin-left: 6px; text-transform: none; }

.card {
  font-size: calc(14px * var(--p3d-font-scale, 1));
  background: var(--card-background-color, var(--ha-card-background-color, #1c1c1e));
  border-radius: var(--ha-card-border-radius, 12px);
  box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,.35));
  padding: 16px;
  font-family: var(--primary-font-family, Roboto, sans-serif);
  color: var(--primary-text-color);
  overflow: hidden;
  position: relative;
}

/* ── Message banner ── */
.msg-banner { display:flex; align-items:flex-start; gap:8px; margin:-4px 0 10px; padding:9px 12px; border-radius:8px; border:1px solid transparent; }
.msg-icon { color:var(--primary-text-color); flex-shrink:0; margin-top:1px; opacity:.8; }
.msg-text { font-size:.82em; font-weight:500; color:var(--primary-text-color); line-height:1.4; word-break:break-word; }

/* ── Header ── */
.header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.header-right { display:flex; align-items:center; gap:8px; }
/* Power button */
.power-btn { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:50%; border:1.5px solid; cursor:pointer; background:transparent; transition:all .18s; padding:0; }
.power-on  { border-color:rgba(76,175,80,.5); color:#4caf50; }
.power-on:hover  { background:rgba(76,175,80,.15); border-color:#4caf50; }
.power-off { border-color:rgba(var(--rgb-secondary-text-color,130,130,130),.4); color:var(--secondary-text-color); }
.power-off:hover { background:rgba(244,67,54,.1); border-color:#f44336; color:#f44336; }
.estop-btn { border-color:rgba(244,67,54,.45); color:#ff6b6b; }
.estop-btn:hover { background:rgba(244,67,54,.15); border-color:#f44336; }
.estop-confirm { background:rgba(244,67,54,.4) !important; color:#fff !important; border-color:#f44336 !important; animation:pulse-red .6s ease infinite; }
.printer-name { font-size:1.05em; font-weight:600; letter-spacing:.02em; }
.state-chip { display:flex; align-items:center; gap:6px; background:var(--chip-bg); border:1px solid var(--mode-color); border-radius:20px; padding:4px 10px; }
.state-dot { width:7px; height:7px; border-radius:50%; background:var(--mode-color); flex-shrink:0; }
.state-label { font-size:.78em; font-weight:600; color:var(--mode-color); letter-spacing:.04em; text-transform:uppercase; }

/* ── Printer SVG ── */
.printer-section { display:flex; justify-content:center; align-items:center; margin:8px 0; }
.printer-svg-wrap { width:100%; max-width:200px; height:180px; position:relative; }
.printer-off { opacity:0.35; filter:grayscale(1); }
.printer-off-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:var(--primary-text-color); opacity:1; pointer-events:none; }

/* ── Stats bar ── */
.stats-bar { display:grid; grid-template-columns:repeat(auto-fit, minmax(48px, 1fr)); gap:8px 4px; margin:8px 0 12px; }
.stat-item { display:flex; flex-direction:column; align-items:center; gap:2px; min-width:0; }
.stat-sub { font-family:'Share Tech Mono',monospace; font-size:.68em; color:var(--secondary-text-color); opacity:.8; line-height:1.1; white-space:nowrap; }
.heater-val { color:#a78bfa; }
.stat-icon { color:var(--secondary-text-color); line-height:1; opacity:.7; text-align:center;}
.stat-val { font-family:'Share Tech Mono',monospace; font-size:.85em; font-weight:600; color:var(--primary-text-color); text-align:center;}
.hotend-val { color:#ff8c66; }
.bed-val    { color:#66b2ff; }
.stat-label { font-size:.64em; color:var(--secondary-text-color); opacity:.7; text-transform:uppercase; letter-spacing:.05em; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }

/* ── Separator ── */
.sep { height:1px; background:var(--divider-color,rgba(255,255,255,.08)); margin:8px 0; }

/* ── Tiles ── */
.tiles { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0; }
.tile { background:var(--secondary-background-color,rgba(255,255,255,.04)); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:4px; transition:opacity .3s; }
.tile-dim { opacity:.45; }
.tile-job { grid-column:span 2; flex-direction:row; align-items:center; gap:14px; padding:10px 14px; }
.job-rows { flex:1; display:flex; flex-direction:column; gap:6px; min-width:0; }
.job-row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.job-label { font-size:.68em; color:var(--secondary-text-color); opacity:.7; text-transform:uppercase; letter-spacing:.06em; }
.job-val { font-size:.92em; font-weight:600; color:var(--primary-text-color); white-space:nowrap; }
.job-sub { font-size:.82em; font-weight:400; color:var(--secondary-text-color); }
.tile-arc { flex-shrink:0; }
.tile-info { display:flex; flex-direction:column; gap:2px; }
.tile-primary { font-family:'Share Tech Mono',monospace; font-size:1.4em; font-weight:700; color:var(--mode-color); }
.tile-secondary { font-size:.78em; color:var(--secondary-text-color); opacity:.75; }
.tile-icon { color:var(--mode-color); opacity:.8; line-height:1; }
.tile-label { font-size:.68em; color:var(--secondary-text-color); opacity:.65; text-transform:uppercase; letter-spacing:.06em; }
.tile-value { font-size:.88em; font-weight:600; margin-top:2px; }
.tile-sub { font-size:.72em; color:var(--secondary-text-color); opacity:.65; }
.tile-filename { overflow:hidden; }
.filename { font-size:.89em; font-family:'Share Tech Mono',monospace; word-break:break-all; }

/* ── File tile with thumbnail ── */
.tile-file { grid-column: span 2; flex-direction: row; align-items: center; gap: 10px; }
.tile-has-thumb { }
.tile-file-active .thumb-img { width: 100px; height: 76px; }
.thumb-wrap { position:relative; flex-shrink:0; }
.thumb-wrap .thumb-img { display:none; }
.thumb-wrap .thumb-fallback { display:flex; width:72px; height:56px; align-items:center; justify-content:center; border-radius:6px; background:rgba(0,0,0,.2); }
.thumb-wrap.thumb-loaded .thumb-img { display:block; }
.thumb-wrap.thumb-loaded .thumb-fallback { display:none; }
.thumb-wrap.thumb-failed .thumb-img { display:none; }
.thumb-wrap.thumb-failed .thumb-fallback { display:flex; }
.tile-file-active .thumb-wrap .thumb-fallback { width:100px; height:76px; }
.thumb-img { width: 72px; height: 56px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: rgba(0,0,0,.3); }
.tile-file-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }

.mono { font-family:'Share Tech Mono',monospace; }
.na { opacity:.35; }

/* ── Controls ── */
.controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(68px, 1fr)); gap:8px; margin:8px 0; }
.ctrl-btn { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:7px 4px; border-radius:10px; min-width:0; border:none; cursor:pointer; font-family:var(--primary-font-family,Roboto,sans-serif); font-size:.82em; font-weight:600; transition:all .18s; background:var(--secondary-background-color,rgba(255,255,255,.06)); color:var(--primary-text-color); }
.ctrl-btn:hover { filter:brightness(1.2); }
.ctrl-btn:active { transform:scale(0.97); }
.ctrl-pause    { background:rgba(229,192,0,.15); color:#e5c000; border:1px solid rgba(229,192,0,.3); }
.ctrl-resume   { background:rgba(76,175,80,.15); color:#4caf50; border:1px solid rgba(76,175,80,.3); }
.ctrl-cancel   { background:rgba(244,67,54,.15); color:#f44336; border:1px solid rgba(244,67,54,.3); }
.ctrl-emergency { background:rgba(244,67,54,.12); color:#ff6b6b; border:1px solid rgba(244,67,54,.25); }
.ctrl-emergency.confirm { background:rgba(244,67,54,.4); color:#fff; border-color:#f44336; animation:pulse-red .6s ease infinite; }
.ctrl-tune { background:var(--chip-bg); color:var(--mode-color); border:1px solid var(--mode-color); }
@keyframes pulse-red { 0%,100% { box-shadow:0 0 0 0 rgba(244,67,54,.5); } 50% { box-shadow:0 0 0 6px rgba(244,67,54,0); } }

/* ── Camera button ── */
.camera-btn { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:8px 12px; margin-top:4px; border-radius:10px; border:1px solid var(--divider-color,rgba(255,255,255,.1)); background:var(--secondary-background-color,rgba(255,255,255,.04)); color:var(--primary-text-color); cursor:pointer; font-family:var(--primary-font-family,Roboto,sans-serif); font-size:.88em; font-weight:600; transition:all .18s; }
.camera-btn:hover, .camera-btn.active { background:var(--chip-bg); border-color:var(--mode-color); color:var(--mode-color); }
.cam-badge { background:var(--mode-color); color:var(--card-background-color,#1c1c1e); border-radius:10px; font-size:.72em; font-weight:700; padding:1px 7px; min-width:18px; text-align:center; }
.cam-chevron { margin-left:auto; display:flex; align-items:center; transition:transform .25s cubic-bezier(.4,0,.2,1); }
.cam-chevron.open { transform:rotate(180deg); }
.cameras-section { overflow:hidden; max-height:0; transition:max-height .4s cubic-bezier(.4,0,.2,1); }
.cameras-section.open { max-height:9999px; }

/* ── Overlay ── */
.overlay { position:absolute; inset:0; background:rgba(0,0,0,.45); backdrop-filter:blur(2px); opacity:0; pointer-events:none; transition:opacity .25s; z-index:10; border-radius:var(--ha-card-border-radius,12px); }
.overlay.visible { opacity:1; pointer-events:all; }

/* ── Bottom sheet ── */
.sheet { position:absolute; left:0; right:0; bottom:0; background:var(--card-background-color,#1c1c1e); border-radius:16px 16px 0 0; padding:12px 16px 24px; z-index:20; transform:translateY(100%); transition:transform .3s cubic-bezier(.4,0,.2,1); box-shadow:0 -4px 24px rgba(0,0,0,.4); max-height:72vh; display:flex; flex-direction:column; }
.sheet.open { transform:translateY(0); }
.sheet-handle { width:36px; height:4px; background:var(--divider-color,rgba(255,255,255,.15)); border-radius:2px; margin:0 auto 12px; flex-shrink:0; }
.sheet-title { display:flex; align-items:center; gap:8px; font-size:.95em; font-weight:600; margin-bottom:16px; color:var(--mode-color); flex-shrink:0; }
.sheet-scroll { flex:1; overflow-y:auto; padding-bottom:20px; }

/* ── Camera views ── */
.camera-views { display:flex; flex-direction:column; gap:12px; padding-top:8px; }
.cam-view { border-radius:10px; overflow:hidden; background:rgba(0,0,0,.3); }
.cam-label { font-size:.72em; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--secondary-text-color); padding:6px 10px 4px; opacity:.7; }
.cam-stream-wrap { overflow:hidden; border-radius:0 0 10px 10px; aspect-ratio:16/9; background:#000; position:relative; }
.cam-stream { display:block; width:100%; height:100%; transform:rotate(var(--cam-rotate,0deg)); transform-origin:center center; }
.cam-stream-wrap[style*="90deg"] .cam-stream, .cam-stream-wrap[style*="270deg"] .cam-stream { transform:rotate(var(--cam-rotate,0deg)) scale(1.78); }

/* ── Tune rows (speed/flow sheet) ── */
.tune-rows { display:flex; flex-direction:column; gap:16px; }
.tune-row {}
.tune-row-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.tune-row-label { display:flex; align-items:center; gap:6px; font-size:.85em; font-weight:600; color:var(--secondary-text-color); }
.tune-row-val { font-size:.88em; font-weight:700; color:var(--mode-color); }
.tune-slider { width:99%; appearance:none; height:4px; border-radius:2px; background:var(--divider-color,rgba(255,255,255,.15)); outline:none; cursor:pointer; accent-color:var(--mode-color); }
.tune-slider::-webkit-slider-thumb { appearance:none; width:18px; height:18px; border-radius:50%; background:var(--mode-color); cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,.4); }

/* ── Macros sheet ── */
.macro-list { display:flex; flex-direction:column; gap:6px; max-height:55vh; overflow-y:auto; }
.macro-btn { display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; border-radius:8px; border:1px solid var(--divider-color,rgba(255,255,255,.1)); background:var(--secondary-background-color,rgba(255,255,255,.04)); color:var(--primary-text-color); cursor:pointer; font-family:var(--primary-font-family,Roboto,sans-serif); font-size:.85em; font-weight:600; text-align:left; transition:all .18s; }
.macro-btn:hover { background:var(--chip-bg); border-color:var(--mode-color); color:var(--mode-color); }
.macro-btn:active { transform:scale(0.98); }

/* ── Movement sheet ── */
.pos-bar { display:flex; gap:16px; margin-bottom:14px; padding:8px 12px; background:var(--secondary-background-color,rgba(255,255,255,.04)); border-radius:8px; }
.pos-item { display:flex; align-items:center; gap:6px; }
.pos-axis { font-size:.75em; font-weight:700; padding:2px 5px; border-radius:4px; }
.pos-x { background:rgba(244,67,54,.2); color:#f44336; }
.pos-y { background:rgba(76,175,80,.2); color:#4caf50; }
.pos-z { background:rgba(33,150,243,.2); color:#2196f3; }
.pos-val { font-size:.85em; font-weight:600; }

.home-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
.home-btn { display:flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; border:1px solid var(--divider-color,rgba(255,255,255,.1)); background:var(--secondary-background-color,rgba(255,255,255,.04)); color:var(--primary-text-color); cursor:pointer; font-family:var(--primary-font-family,Roboto,sans-serif); font-size:.82em; font-weight:600; transition:all .18s; }
.home-btn:hover { background:var(--chip-bg); border-color:var(--mode-color); color:var(--mode-color); }
.home-x { color:#f44336; border-color:rgba(244,67,54,.3); background:rgba(244,67,54,.08); }
.home-y { color:#4caf50; border-color:rgba(76,175,80,.3); background:rgba(76,175,80,.08); }
.home-z { color:#2196f3; border-color:rgba(33,150,243,.3); background:rgba(33,150,243,.08); }

.jog-section { display:flex; gap:12px; align-items:flex-start; }
.jog-xy { display:flex; flex-direction:column; gap:4px; flex:1; }
.jog-xy-top, .jog-xy-bot { display:flex; gap:4px; justify-content:center; }
.jog-xy-mid { display:flex; gap:4px; align-items:center; justify-content:center; }
.jog-center { display:flex; align-items:center; justify-content:center; width:36px; height:36px; opacity:.4; flex-shrink:0; }

.jog-z { display:flex; flex-direction:column; gap:4px; align-items:center; width:52px; flex-shrink:0; }
.jog-z-label { font-size:.75em; font-weight:700; padding:2px 8px; border-radius:4px; background:rgba(33,150,243,.2); color:#2196f3; margin-bottom:2px; }
.jog-z-sep { height:4px; }

.jog-btn { padding:5px 7px; border-radius:6px; border:1px solid var(--divider-color,rgba(255,255,255,.1)); background:var(--secondary-background-color,rgba(255,255,255,.04)); color:var(--primary-text-color); cursor:pointer; font-family:'Share Tech Mono',monospace; font-size:.72em; font-weight:600; transition:all .15s; min-width:32px; text-align:center; }
.jog-btn:hover { background:var(--chip-bg); border-color:var(--mode-color); color:var(--mode-color); }
.jog-btn:active { transform:scale(0.95); }
.jog-z-btn { width:100%; }
.jog-section.disabled, .home-row.disabled, .pos-bar.disabled, .macro-list.disabled { opacity:.5; pointer-events:none; }

/* ── Temps & Fans sheet ── */
.temps-body { display:flex; flex-direction:column; gap:0; }
.temps-section-label { font-size:.68em; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--secondary-text-color); opacity:.6; margin-bottom:6px; }

.temp-row { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:7px 0; border-bottom:1px solid var(--divider-color,rgba(255,255,255,.06)); }
.temp-row-info { display:flex; flex-direction:column; gap:1px; min-width:0; }
.temp-row-name { font-size:.85em; font-weight:600; }
.temp-row-state { font-size:.7em; color:var(--secondary-text-color); opacity:.6; text-transform:uppercase; }
.temp-state-active { color:#ff8c66; opacity:1; }
.temp-arrow { font-size:.75em; color:var(--secondary-text-color); opacity:.4; }
.temp-row-ctrl { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.temp-current { font-size:.85em; color:var(--mode-color); min-width:42px; text-align:right; }
.temp-input { width:52px; padding:4px 6px; border-radius:6px; border:1px solid var(--divider-color,rgba(255,255,255,.15)); background:var(--secondary-background-color,rgba(255,255,255,.06)); color:var(--primary-text-color); font-family:'Share Tech Mono',monospace; font-size:.85em; text-align:center; outline:none; }
.temp-input:focus { border-color:var(--mode-color); }
.temp-unit { font-size:.75em; color:var(--secondary-text-color); opacity:.6; }

.fan-row { padding:8px 0; border-bottom:1px solid var(--divider-color,rgba(255,255,255,.06)); }
.fan-row-info { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.fan-name { font-size:.85em; font-weight:600; }
.fan-val { font-size:.82em; color:var(--mode-color); }

/* ── System sheet ── */
.system-body { display:flex; flex-direction:column; gap:6px; }
.sys-section-label { font-size:.7em; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--secondary-text-color); opacity:.55; margin-top:10px; margin-bottom:2px; padding:0 2px; }
.sys-section-label:first-child { margin-top:0; }
.system-warning { font-size:.75em; color:var(--secondary-text-color); opacity:.65; margin-bottom:4px; padding:7px 10px; border-radius:6px; background:rgba(244,67,54,.06); border:1px solid rgba(244,67,54,.15); }
.ctrl-system { background:rgba(244,67,54,.08); color:#ff6b6b; border:1px solid rgba(244,67,54,.2); }
.system-btn { display:flex; align-items:center; gap:8px; width:100%; padding:10px 14px; border-radius:8px; border:1px solid rgba(var(--rgb-primary-text-color,200,200,200),.12); background:rgba(var(--rgb-primary-text-color,200,200,200),.05); color:var(--primary-text-color); cursor:pointer; font-family:var(--primary-font-family,Roboto,sans-serif); font-size:.85em; font-weight:500; text-align:left; transition:all .18s; }
.system-btn:hover { background:rgba(var(--rgb-primary-text-color,200,200,200),.1); }
.system-btn:active { transform:scale(0.98); }
.system-btn-service { color:var(--secondary-text-color); font-weight:400; }
.system-btn-danger { border-color:rgba(244,67,54,.3); background:rgba(244,67,54,.06); color:#ff6b6b; font-weight:600; }
.system-btn-danger:hover { background:rgba(244,67,54,.18); border-color:#f44336; }
    `;
  }

  getCardSize() { return 6; }
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
const ICON_HOTEND = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.43-1.03-2.07-1.66C13.33 7.26 13 4.85 13.95 3c-.95.23-1.78.75-2.49 1.32-2.59 2.08-3.61 5.75-2.39 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.23.1-.47.04-.66-.12a.6.6 0 0 1-.14-.17c-1.13-1.43-1.31-3.48-.55-5.12C5.78 10 4.87 12.3 5 14.47c.06.5.12 1 .29 1.5.14.6.41 1.2.71 1.73 1.08 1.73 2.95 2.97 4.96 3.22 2.14.27 4.43-.12 6.07-1.6 1.83-1.66 2.47-4.32 1.53-6.6l-.13-.26c-.21-.46-.77-1.26-.77-1.26m-3.16 6.3c-.28.24-.74.5-1.1.6-1.12.4-2.24-.16-2.9-.82 1.19-.28 1.9-1.16 2.11-2.05.17-.8-.15-1.46-.28-2.23-.12-.74-.1-1.37.17-2.06.19.38.39.76.63 1.06.77 1 1.98 1.44 2.24 2.8.04.14.06.28.06.43.03.82-.33 1.72-.93 2.27"/></svg>`;
const ICON_BED = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7H5v2H3V4H1v16h2v-3h18v3h2V11a4 4 0 0 0-4-4m-8 4H7v-2h4zm6 0h-4v-2h4z"/></svg>`;
const ICON_SPEED = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44z"/><path d="M10.59 15.41a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/></svg>`;
const ICON_FLOW = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m1 14.93V15a1 1 0 0 0-2 0v1.93A8 8 0 0 1 4.07 11H6a1 1 0 0 0 0-2H4.07A8 8 0 0 1 11 4.07V6a1 1 0 0 0 2 0V4.07A8 8 0 0 1 19.93 11H18a1 1 0 0 0 0 2h1.93A8 8 0 0 1 13 16.93M12 11a1 1 0 1 0 1 1 1 1 0 0 0-1-1"/></svg>`;
const ICON_ETA = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_ELAPSED = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20a8 8 0 0 0 8-8 8 8 0 0 0-8-8 8 8 0 0 0-8 8 8 8 0 0 0 8 8m0-18a10 10 0 0 1 10 10 10 10 0 0 1-10 10C6.47 22 2 17.5 2 12A10 10 0 0 1 12 2m.5 5v5.25l4.5 2.67-.75 1.23L11 13V7z"/></svg>`;
const ICON_FILE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5z"/></svg>`;
const ICON_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 19h4V5h-4M6 19h4V5H6v14z"/></svg>`;
const ICON_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
const ICON_STOP = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 18H6V6h12v12z"/></svg>`;
const ICON_EMERGENCY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 14h-2V9h2m0 9h-2v-2h2M1 21h22L12 2 1 21z"/></svg>`;
const ICON_CAMERA = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m8 3a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z"/></svg>`;
const ICON_TUNE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17v2h6v-2H3M3 5v2h10V5H3m10 16v-2h8v-2h-8v-2h-2v6h2M7 9v2H3v2h4v2h2V9H7m14 4v-2H11v2h10m-6-4h2V7h4V5h-4V3h-2v6z"/></svg>`;
const ICON_CHEVRON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
const ICON_MACRO = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 3a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2H3v2h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2v-2H8v-5a2 2 0 0 0-2-2 2 2 0 0 0 2-2V5h2V3zm8 0a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1v2h-1a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2v-2h2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5h-2V3z"/></svg>`;
const ICON_MOVE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 6v5h5l-6 6-6-6h5V6h2M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8z"/></svg>`;
const ICON_THERMOMETER = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15 13V5a3 3 0 0 0-6 0v8a5 5 0 1 0 6 0m-3-9a1 1 0 0 1 1 1v3h-2V5a1 1 0 0 1 1-1z"/></svg>`;
const ICON_HOME = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
const ICON_INFO = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z"/></svg>`;
const ICON_MORE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2m0-6a2 2 0 0 1 2 2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1 2-2z"/></svg>`;
const ICON_POWER = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.56 5.44l-1.45 1.45A6.97 6.97 0 0 1 17 12a5 5 0 0 1-5 5 5 5 0 0 1-5-5c0-2.04 1.1-3.8 2.71-4.77L8.27 5.79A8.97 8.97 0 0 0 5 12a7 7 0 0 0 7 7 7 7 0 0 0 7-7c0-2.57-1.36-4.81-3.44-6.11zM13 3h-2v10h2V3z"/></svg>`;
const ICON_SPOOL = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8m0-11a3 3 0 1 0 3 3 3 3 0 0 0-3-3m0 4.5A1.5 1.5 0 1 1 13.5 12 1.5 1.5 0 0 1 12 13.5"/></svg>`;
const ICON_RESTART = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 0 0-8 8 8 8 0 0 0 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18a6 6 0 0 1-6-6 6 6 0 0 1 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;

// ── Register ──────────────────────────────────────────────────────────────────
customElements.define(CARD_TAG, PrinterCard3D);

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: '3D Printer Card',
  description: 'A feature-rich card for Moonraker-based 3D printers with animated SVG visualization.',
  preview: false,
});
