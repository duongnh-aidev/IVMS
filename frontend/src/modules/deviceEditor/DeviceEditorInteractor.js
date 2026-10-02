import { isValidIPv4 } from '../../shared/entities/device';

/** Add / edit a device and test its RTSP stream. */
export class DeviceEditorInteractor {
  constructor({ devices }) {
    this.devices = devices;
  }

  /** Editable fields of an existing device. */
  load(id) {
    const d = this.devices.list().find((x) => x.i === id);
    const [ip, port] = d.ip.split(':');
    return { name: d.name, ip, port: port || '554', path: '', user: d.account, pass: '' };
  }

  validate(form) {
    return { nameOk: !!form.name, ipOk: isValidIPv4(form.ip) };
  }

  /** Creates (id == null) or updates a device. Returns the saved record. */
  save(id, form) {
    const rec = { name: form.name.trim(), ip: form.ip.trim() + ':' + (form.port || '554'), user: form.user || 'admin' };
    if (id != null) this.devices.update(id, rec);
    else this.devices.add(rec);
    return rec;
  }

  /** Simulated RTSP probe: resolves true when the address is valid. */
  testConnection(form) {
    const ok = isValidIPv4(form.ip);
    return new Promise((resolve) => setTimeout(() => resolve(ok), 1100));
  }
}
