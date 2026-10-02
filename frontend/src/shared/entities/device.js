// Device entity: a camera/NVR known to IVMS. Built-in demo cameras have ids 0..15,
// devices added by the user have ids from 100.

export const CUSTOM_ID_BASE = 100;

/** Demo camera names; camera i is CAM-(i+1). */
export const DEMO_CAMERAS = [
  'Front Gate',
  'Lobby',
  'Parking B1',
  'Warehouse',
  'Corridor 2F',
  'Server Room',
  'Reception',
  'Loading Dock',
  'Rooftop',
  'Parking B2',
  'Stairwell A',
  'Cafeteria',
  'Meeting Room 3',
  'Back Door',
  'Elevator Hall',
  'Corridor 3F',
];

/** Device groups: [id, label, depth]. A group contains its "<id>-..." children. */
export const DEVICE_GROUPS = [
  ['all', 'All devices', 0],
  ['hq', 'Head Office', 0],
  ['hq-a', 'Building A', 1],
  ['hq-a-1', 'Floor 1', 2],
  ['hq-a-2', 'Floor 2', 2],
  ['hq-b', 'Building B', 1],
  ['wh', 'Warehouse', 0],
];

export const DEVICE_STATUSES = ['Online', 'Offline', 'Error'];

/** Display code: CAM-01 for built-in cameras, NEW-01 for user-added ones. */
export function deviceCode(id) {
  return id >= CUSTOM_ID_BASE
    ? 'NEW-' + String(id - CUSTOM_ID_BASE + 1).padStart(2, '0')
    : 'CAM-' + String(id + 1).padStart(2, '0');
}

/** True if device group `grp` is inside group `filter` ('all' matches everything). */
export function inGroup(grp, filter) {
  return filter === 'all' || grp === filter || grp.startsWith(filter + '-');
}

export const isValidIPv4 = (ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test((ip || '').trim());
