import { Observable } from '../../core/viper';

/**
 * Notification entities: [id, day, time, title, description, target screen, color, kind].
 * Mock data until the backend pushes events.
 */
const NOTIFICATIONS = [
  [
    1,
    'Today',
    '16:42',
    'Tampering detected',
    'Warehouse · the camera view is blocked.',
    'playback',
    '#E5484D',
    'alert',
  ],
  [2, 'Today', '16:31', 'Device offline', 'Corridor 2F stopped responding.', 'devices', '#5C5E62', 'device'],
  [
    3,
    'Today',
    '15:20',
    'Storage almost full',
    'Office NAS is 86% full · about 4 days of space left.',
    'storage',
    '#E0A100',
    'storage',
  ],
  [4, 'Today', '14:05', 'Intrusion detected', 'Parking B1 · zone “Gate area”.', 'playback', '#3E6AE1', 'alert'],
  [
    5,
    'Today',
    '09:12',
    'Export completed',
    'Lobby · 14:05–14:07 · 1 clip saved to Downloads.',
    'playback',
    '#2EA44F',
    'done',
  ],
  [6, 'Yesterday', '22:48', 'Signal loss', 'Rooftop lost video for 3 minutes.', 'playback', '#E5484D', 'alert'],
  [
    7,
    'Yesterday',
    '18:00',
    'Daily report ready',
    'Sep 30 · 214 events, 98.9% uptime.',
    'dashboard',
    '#3E6AE1',
    'report',
  ],
  [
    8,
    'Yesterday',
    '10:30',
    'Update available',
    'IVMS 1.0.1 · bug fixes and performance improvements.',
    'settings',
    '#5C5E62',
    'update',
  ],
].map(([id, day, time, title, desc, target, color, kind]) => ({ id, day, time, title, desc, target, color, kind }));

const INITIALLY_READ = [5, 6, 7, 8];

export class NotificationService extends Observable {
  #read = {};

  list() {
    return NOTIFICATIONS;
  }

  isRead(id) {
    return this.#read[id] ?? INITIALLY_READ.includes(id);
  }

  unreadCount() {
    return NOTIFICATIONS.filter((n) => !this.isRead(n.id)).length;
  }

  markRead(id) {
    this.#read = { ...this.#read, [id]: true };
    this.emit();
  }

  markAllRead() {
    this.#read = Object.fromEntries(NOTIFICATIONS.map((n) => [n.id, true]));
    this.emit();
  }
}
