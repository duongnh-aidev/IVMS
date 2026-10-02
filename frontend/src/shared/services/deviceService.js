import { Observable } from '../../core/viper';
import { CUSTOM_ID_BASE, DEMO_CAMERAS, DEVICE_GROUPS, deviceCode } from '../entities/device';

const FIRMWARE = ['V2.3.1', 'V2.3.1', 'V2.4.0', 'V2.2.8'];
const MODELS = ['IPC-D2140', 'IPC-B5160', 'IPC-T3240', 'NVR-3208'];
// Group of built-in camera i (cycled).
const GROUP_OF = [
  'hq-a-1',
  'hq-a-1',
  'hq-a-2',
  'hq-b',
  'hq-a-2',
  'hq-b',
  'wh',
  'hq-a-1',
  'wh',
  'hq-b',
  'hq-a-2',
  'wh',
  'hq-a-1',
  'hq-b',
  'hq-a-2',
  'wh',
];
const GROUP_NAME = Object.fromEntries(DEVICE_GROUPS.map(([id, label]) => [id, label]));

/**
 * Device repository (in-memory mock until the backend API exists).
 * Shared by every module that lists, names or edits devices.
 */
export class DeviceService extends Observable {
  #custom = [];
  #edits = {};
  #deleted = [];

  /** @param {number} demoCount number of built-in demo cameras (0–16) */
  constructor(demoCount = 13) {
    super();
    this.demoCount = Math.min(demoCount, DEMO_CAMERAS.length);
  }

  /** Visible device ids, in display order. */
  ids() {
    return [
      ...Array.from({ length: this.demoCount }, (_, i) => i),
      ...this.#custom.map((_, k) => CUSTOM_ID_BASE + k),
    ].filter((i) => !this.#deleted.includes(i));
  }

  nameOf(id) {
    const edit = this.#edits[id];
    if (edit) return edit.name;
    return id >= CUSTOM_ID_BASE ? this.#custom[id - CUSTOM_ID_BASE].name : DEMO_CAMERAS[id];
  }

  /** Device entities for all visible ids. */
  list() {
    return this.ids().map((i) => this.#record(i));
  }

  #record(i) {
    let d;
    if (i >= CUSTOM_ID_BASE) {
      const c = this.#custom[i - CUSTOM_ID_BASE];
      d = { i, status: 'Online', name: c.name, id: deviceCode(i), ip: c.ip, fw: '—', model: 'RTSP', account: c.user };
    } else {
      const status = i % 7 === 3 ? 'Error' : i % 5 === 4 ? 'Offline' : 'Online';
      d = {
        i,
        status,
        name: DEMO_CAMERAS[i],
        id: deviceCode(i),
        ip: '192.168.1.' + (101 + i) + ':8000',
        fw: FIRMWARE[i % 4],
        model: MODELS[i % 4],
        account: 'admin',
      };
    }
    d.grp = i >= CUSTOM_ID_BASE ? 'hq-a-1' : GROUP_OF[i % GROUP_OF.length];
    d.grpName = (d.grp.startsWith('hq-a') ? 'Building A · ' : '') + GROUP_NAME[d.grp];
    const edit = this.#edits[i];
    if (edit) Object.assign(d, { name: edit.name, ip: edit.ip, account: edit.user });
    return d;
  }

  /** @param {{name: string, ip: string, user: string}} rec  ip is "host:port" */
  add(rec) {
    this.#custom = [...this.#custom, rec];
    this.emit();
    return CUSTOM_ID_BASE + this.#custom.length - 1;
  }

  update(id, rec) {
    this.#edits = { ...this.#edits, [id]: rec };
    this.emit();
  }

  remove(id) {
    this.#deleted = [...this.#deleted, id];
    this.emit();
  }
}
