// In-memory IVMS API for tests: same paths, payloads and errors as the backend,
// seeded with the fixtures. Pass it wherever the app expects an ApiClient.

import { ApiError } from '../shared/api/client';
import { DeviceService } from '../shared/services/deviceService';
import { DEVICES, GROUPS } from './fixtures';

const clone = (x) => JSON.parse(JSON.stringify(x));

export class FakeApi {
  constructor({ devices = DEVICES, groups = GROUPS, probe = { reachable: true, codec: 'H.264', error: null } } = {}) {
    this.devices = clone(devices);
    this.groups = clone(groups);
    this.probeResult = probe;
    this.calls = []; // [method, path, body]
    this.seq = this.devices.length;
  }

  get = (path) => this.#handle('GET', path);
  post = (path, body) => this.#handle('POST', path, body);
  patch = (path, body) => this.#handle('PATCH', path, body);
  delete = (path) => this.#handle('DELETE', path);

  async #handle(method, path, body) {
    this.calls.push([method, path, body]);
    const [route, query] = path.split('?');
    const params = new URLSearchParams(query);
    const deviceId = route.match(/^\/devices\/([^/]+)$/)?.[1];

    if (method === 'GET' && route === '/device-groups') {
      return this.groups.map((g) => ({ ...g, deviceCount: this.devices.filter((d) => d.groupId === g.id).length }));
    }
    if (method === 'GET' && route === '/devices') {
      const limit = Number(params.get('limit') || 50);
      const offset = Number(params.get('offset') || 0);
      return { items: clone(this.devices.slice(offset, offset + limit)), total: this.devices.length, limit, offset };
    }
    if (method === 'POST' && route === '/devices/probe') return { ...this.probeResult };
    if (method === 'POST' && route === '/devices') return this.#create(body);
    if (deviceId && method === 'PATCH') return this.#update(deviceId, body);
    if (deviceId && method === 'DELETE') {
      this.#find(deviceId);
      this.devices = this.devices.filter((d) => d.id !== deviceId);
      return null;
    }
    throw new ApiError(404, { title: 'Not found', detail: `${method} ${path} is not faked` });
  }

  #find(id) {
    const d = this.devices.find((x) => x.id === id);
    if (!d) throw new ApiError(404, { title: 'Not found', detail: 'Device not found' });
    return d;
  }

  #checkUnique({ host, port, path }, exceptId) {
    if (this.devices.some((d) => d.id !== exceptId && d.host === host && d.port === port && d.path === path)) {
      throw new ApiError(409, { title: 'Conflict', detail: 'A device with this address and path already exists' });
    }
  }

  #create({ password, ...fields }) {
    const device = {
      path: '',
      username: '',
      groupId: null,
      model: null,
      firmware: null,
      ...fields,
      port: fields.port ?? 554,
      id: 'dev-' + ++this.seq,
      code: 'CAM-' + String(this.seq).padStart(2, '0'),
      hasPassword: !!password,
      status: 'offline',
      lastSeenAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.#checkUnique(device);
    this.devices.push(device);
    return clone(device);
  }

  #update(id, { password, ...fields }) {
    const device = this.#find(id);
    this.#checkUnique({ ...device, ...fields }, id);
    Object.assign(device, fields);
    if (password !== undefined) device.hasPassword = !!password;
    return clone(device);
  }
}

/** A DeviceService over a FakeApi, already loaded. */
export async function loadedDevices(options) {
  const api = new FakeApi(options);
  const devices = new DeviceService({ api });
  await devices.load();
  return { api, devices };
}
