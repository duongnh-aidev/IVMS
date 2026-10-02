// Mock analytics until the backend exposes them.
const EVENTS_PER_HOUR = [3, 2, 1, 1, 0, 1, 2, 5, 9, 12, 8, 7, 10, 14, 11, 9, 13, 17, 15, 10, 7, 6, 4, 5];
const RECENT_EVENTS = [
  // [time, type, index into the device list, dot color]
  ['16:42', 'Motion detected', 0, '#3E6AE1'],
  ['16:31', 'Device offline', 4, '#8E8E8E'],
  ['16:05', 'Line crossing', 2, '#3E6AE1'],
  ['15:48', 'Video tampering', 3, '#E5484D'],
  ['15:20', 'Motion detected', 1, '#3E6AE1'],
  ['14:57', 'Recording error', 10, '#E5484D'],
];
const DISKS = [
  { name: 'Disk 1 · 4 TB', usedPct: 72, used: '2.9 TB' },
  { name: 'Disk 2 · 4 TB', usedPct: 41, used: '1.6 TB' },
];

/** Today's overview: device health, event histogram, recent events, disks. */
export class DashboardInteractor {
  constructor({ devices }) {
    this.devices = devices;
  }

  get source() {
    return this.devices;
  }

  deviceHealth() {
    const all = this.devices.list();
    const count = (status) => all.filter((d) => d.status === status).length;
    return { total: all.length, online: count('Online'), offline: count('Offline'), error: count('Error') };
  }

  eventsPerHour() {
    return EVENTS_PER_HOUR;
  }

  recentEvents() {
    const all = this.devices.list();
    const camera = (k) => (all[k % Math.max(all.length, 1)] || { name: '—' }).name;
    return RECENT_EVENTS.map(([time, type, k, dot]) => ({ time, type, cam: camera(k), dot }));
  }

  disks() {
    return DISKS;
  }
}
