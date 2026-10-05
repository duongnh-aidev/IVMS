// Device entity: a camera/NVR registered on the IVMS server (GET /devices), and the
// device-group tree it is filed under (GET /device-groups).

export const DEVICE_STATUSES = ['Online', 'Offline', 'Error'];

const STATUS_LABEL = { online: 'Online', offline: 'Offline', error: 'Error' };

/**
 * Display record of an API device.
 * @param d       API device (camelCase, see docs/backend-api.md §4.5)
 * @param groups  Map of group id -> API group
 */
export function toDevice(d, groups) {
  return {
    i: d.id,
    id: d.code,
    name: d.name,
    status: STATUS_LABEL[d.status] || 'Offline',
    ip: d.host + ':' + d.port,
    fw: d.firmware || '—',
    model: d.model || '—',
    account: d.username || '—',
    grp: d.groupId,
    grpName: groupLabel(d.groupId, groups),
  };
}

/** "Building A · Floor 1": the group and its parent (top-level groups show their own name). */
export function groupLabel(groupId, groups) {
  const g = groups.get(groupId);
  if (!g) return '—';
  const parent = groups.get(g.parentId);
  return parent && g.depth >= 2 ? parent.name + ' · ' + g.name : g.name;
}

/** Ids of a group and all its descendants. */
export function subtreeIds(groupId, groupList) {
  const ids = new Set([groupId]);
  // The API lists groups depth-first, so a parent always comes before its children
  for (const g of groupList) if (ids.has(g.parentId)) ids.add(g.id);
  return ids;
}

export const isValidIPv4 = (ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test((ip || '').trim());
