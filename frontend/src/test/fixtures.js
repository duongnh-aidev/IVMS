// Test data in the API's shape (docs/backend-api.md §4.4, §4.5): the demo site the
// frontend used to mock. Only tests import this; the app reads the real server.

export const GROUPS = [
  { id: 'hq', name: 'Head Office', parentId: null, depth: 0 },
  { id: 'hq-a', name: 'Building A', parentId: 'hq', depth: 1 },
  { id: 'hq-a-1', name: 'Floor 1', parentId: 'hq-a', depth: 2 },
  { id: 'hq-a-2', name: 'Floor 2', parentId: 'hq-a', depth: 2 },
  { id: 'hq-b', name: 'Building B', parentId: 'hq', depth: 1 },
  { id: 'wh', name: 'Warehouse', parentId: null, depth: 0 },
];

const NAMES = [
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
];
const GROUP_OF = ['hq-a-1', 'hq-a-1', 'hq-a-2', 'hq-b', 'hq-a-2', 'hq-b', 'wh', 'hq-a-1', 'wh', 'hq-b', 'hq-a-2', 'wh'];
const FIRMWARE = ['V2.3.1', 'V2.3.1', 'V2.4.0', 'V2.2.8'];
const MODELS = ['IPC-D2140', 'IPC-B5160', 'IPC-T3240', 'NVR-3208'];

const pad2 = (n) => String(n).padStart(2, '0');

/** Device i (0-based) has id "dev-<i+1>" and code CAM-<i+1>: 9 online, 2 offline, 2 error. */
export const DEVICES = NAMES.map((name, i) => ({
  id: 'dev-' + (i + 1),
  code: 'CAM-' + pad2(i + 1),
  name,
  host: '192.168.1.' + (101 + i),
  port: 8000,
  path: '/Streaming/Channels/101',
  username: 'admin',
  hasPassword: true,
  groupId: GROUP_OF[i % GROUP_OF.length],
  model: MODELS[i % 4],
  firmware: FIRMWARE[i % 4],
  status: i % 7 === 3 ? 'error' : i % 5 === 4 ? 'offline' : 'online',
  lastSeenAt: null,
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt: '2026-10-01T08:00:00Z',
}));

export const DEVICE_IDS = DEVICES.map((d) => d.id);
