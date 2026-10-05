import { Observable } from '../../core/mvc';
import { toDevice } from '../entities/device';

// Largest page the API serves (docs/backend-api.md §4.5)
const PAGE = 200;

/**
 * Devices and device groups from the IVMS server, cached so views can read them
 * synchronously. Shared by every module that lists, names or edits devices.
 * Writes go to the API, then the cache is reloaded and listeners are notified.
 */
export class DeviceService extends Observable {
  #devices = []; // API devices, in display order
  #groups = []; // API groups, depth-first
  #groupsById = new Map();
  #records = [];

  constructor({ api }) {
    super();
    this.api = api;
  }

  /** Fetches devices and groups. Rejects with an ApiError. */
  async load() {
    const [groups, devices] = await Promise.all([this.api.get('/device-groups'), this.#fetchDevices()]);
    this.#groups = groups;
    this.#groupsById = new Map(groups.map((g) => [g.id, g]));
    this.#devices = devices;
    this.#records = devices.map((d) => toDevice(d, this.#groupsById));
    this.emit();
  }

  async #fetchDevices() {
    const all = [];
    for (let offset = 0; ; offset += PAGE) {
      const page = await this.api.get(`/devices?sort=code&limit=${PAGE}&offset=${offset}`);
      all.push(...page.items);
      if (all.length >= page.total || page.items.length === 0) return all;
    }
  }

  /** Device ids, in display order. */
  ids() {
    return this.#records.map((d) => d.i);
  }

  /** Display records (see `toDevice`). */
  list() {
    return this.#records;
  }

  /** The API device (all fields, e.g. for the edit form), or undefined. */
  get(id) {
    return this.#devices.find((d) => d.id === id);
  }

  nameOf(id) {
    return this.get(id)?.name ?? '—';
  }

  codeOf(id) {
    return this.get(id)?.code ?? '—';
  }

  /** API groups, depth-first: { id, name, parentId, depth, deviceCount }. */
  groups() {
    return this.#groups;
  }

  /** @param fields  { name, host, port, path, username, password, groupId?, model?, firmware? } */
  async add(fields) {
    const device = await this.api.post('/devices', fields);
    await this.load();
    return device;
  }

  /** Omitted fields are unchanged; omit `password` to keep the stored one. */
  async update(id, fields) {
    const device = await this.api.patch(`/devices/${id}`, fields);
    await this.load();
    return device;
  }

  async remove(id) {
    await this.api.delete(`/devices/${id}`);
    await this.load();
  }

  /**
   * Tests an RTSP connection on the server: { reachable, codec, error }.
   * With `deviceId` and no `password`, the device's stored password is used.
   */
  probe(connection) {
    return this.api.post('/devices/probe', connection);
  }
}
