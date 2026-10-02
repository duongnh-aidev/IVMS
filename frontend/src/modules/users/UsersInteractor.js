import { Observable } from '../../core/viper';

export const ROLES = ['Admin', 'Operator', 'Viewer'];

const USERS = [
  ['Nguyen Van An', 'an.nguyen', 'Admin', 'All devices', 'Active', 'Today 16:20'],
  ['Tran Thi Binh', 'binh.tran', 'Operator', 'Head Office', 'Active', 'Today 15:02'],
  ['Le Minh Cuong', 'cuong.le', 'Operator', 'Building A', 'Active', 'Today 08:11'],
  ['Pham Thu Dung', 'dung.pham', 'Viewer', 'Warehouse', 'Active', 'Yesterday 21:40'],
  ['Hoang Gia Huy', 'huy.hoang', 'Viewer', 'Building B', 'Locked', 'Sep 24, 10:05'],
  ['Vo Thanh Khoa', 'khoa.vo', 'Operator', 'Warehouse', 'Invited', '—'],
].map(([name, login, role, access, status, last]) => ({ name, login, role, access, status, last }));

export const PERMISSIONS = [
  ['live', 'Live View', 'Watch live camera feeds'],
  ['playback', 'Playback', 'Watch recorded footage'],
  ['export', 'Export video', 'Download clips and snapshots'],
  ['ptz', 'PTZ control', 'Pan, tilt and zoom cameras'],
  ['ack', 'Acknowledge events', 'Mark alerts as handled'],
  ['devices', 'Manage devices', 'Add, edit and delete devices'],
  ['record', 'Recording & storage', 'Change schedules and storage'],
  ['users', 'Manage users', 'Add users and edit roles'],
].map(([key, label, desc]) => ({ key, label, desc }));

/** Device scopes a role can be limited to: [id, label, depth]. "hq" includes its "hq-*" children. */
export const SCOPES = [
  ['all', 'All devices', 0],
  ['hq', 'Head Office', 1],
  ['hq-a', 'Building A', 2],
  ['hq-b', 'Building B', 2],
  ['wh', 'Warehouse', 1],
];

const ACTIVITY = [
  ['Oct 1, 16:42', 'an.nguyen', 'Exported clip', 'Front Gate · 16:30–16:32', '#3E6AE1'],
  ['Oct 1, 16:20', 'an.nguyen', 'Signed in', 'IVMS Client 1.0.0', '#2EA44F'],
  ['Oct 1, 15:58', 'binh.tran', 'Watched playback', 'Lobby · Sep 30', '#8E8E8E'],
  ['Oct 1, 15:31', 'binh.tran', 'Acknowledged event', 'Tampering · Warehouse', '#8E8E8E'],
  ['Oct 1, 14:10', 'an.nguyen', 'Changed settings', 'Recording schedule · Head Office', '#E0A100'],
  ['Oct 1, 11:47', 'cuong.le', 'Added device', 'Corridor 2F · 192.168.1.105', '#E0A100'],
  ['Oct 1, 09:03', 'huy.hoang', 'Sign-in failed', '5 attempts · account locked', '#E5484D'],
  ['Oct 1, 08:11', 'cuong.le', 'Signed in', 'IVMS Client 1.0.0', '#2EA44F'],
].map(([time, user, action, target, dot], i) => ({ time, user, action, target, dot, ip: '192.168.1.' + (20 + i * 7) }));

export const ACTIVITY_FILTERS = {
  All: () => true,
  'Sign-ins': (l) => /Sign/.test(l.action),
  Exports: (l) => /Export/.test(l.action),
  Changes: (l) => /Changed|Added/.test(l.action),
};

/** Users, role permissions/scopes and the activity log (in-memory mock). */
export class UsersInteractor extends Observable {
  #permissions = {
    Admin: PERMISSIONS.map((p) => p.key),
    Operator: ['live', 'playback', 'export', 'ptz', 'ack'],
    Viewer: ['live', 'playback'],
  };
  #scopes = { Admin: ['all'], Operator: ['hq', 'hq-a', 'hq-b'], Viewer: ['wh'] };

  users() {
    return USERS;
  }

  countWithRole(role) {
    return USERS.filter((u) => u.role === role).length;
  }

  /** Admins always have every permission and every device. */
  isLocked(role) {
    return role === 'Admin';
  }

  permissions(role) {
    return this.#permissions[role] || [];
  }

  togglePermission(role, key) {
    if (this.isLocked(role)) return;
    const cur = this.permissions(role);
    this.#permissions = {
      ...this.#permissions,
      [role]: cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key],
    };
    this.emit();
  }

  scopes(role) {
    return this.#scopes[role] || [];
  }

  /** Whether scope `key` is effectively granted (directly, via "all", or via its parent "hq"). */
  hasScope(role, key) {
    const sc = this.scopes(role);
    return sc.includes(key) || sc.includes('all') || (key.startsWith('hq-') && sc.includes('hq'));
  }

  toggleScope(role, key) {
    if (this.isLocked(role)) return;
    const sc = this.scopes(role);
    this.#scopes = { ...this.#scopes, [role]: sc.includes(key) ? sc.filter((x) => x !== key) : [...sc, key] };
    this.emit();
  }

  activity(filter) {
    return ACTIVITY.filter(ACTIVITY_FILTERS[filter]);
  }

  /** Simulated invitation e-mail. */
  invite() {
    return 'Invite sent';
  }
}
