import { isValidIPv4 } from '../../shared/entities/device';

/** Add / edit a device and test its RTSP stream on the server. */
export class DeviceEditorModel {
  constructor({ devices }) {
    this.devices = devices;
  }

  /** Editable fields of an existing device. The password is never sent back: empty keeps it. */
  load(id) {
    const d = this.devices.get(id);
    return { name: d.name, ip: d.host, port: String(d.port), path: d.path, user: d.username, pass: '' };
  }

  validate(form) {
    return { nameOk: !!form.name.trim(), ipOk: isValidIPv4(form.ip) };
  }

  /** Creates (id == null) or updates a device. Resolves with the saved API device, rejects with an ApiError. */
  save(id, form) {
    const fields = { name: form.name.trim(), ...this.#connection(form) };
    if (form.pass) fields.password = form.pass;
    return id != null ? this.devices.update(id, fields) : this.devices.add(fields);
  }

  /** RTSP DESCRIBE from the server: { reachable, codec, error }. Rejects with an ApiError. */
  testConnection(id, form) {
    const connection = this.#connection(form);
    // Editing without retyping the password: the server uses the stored one
    if (form.pass || id == null) connection.password = form.pass;
    else connection.deviceId = id;
    return this.devices.probe(connection);
  }

  #connection(form) {
    return {
      host: form.ip.trim(),
      port: Number(form.port) || 554,
      path: form.path.trim(),
      username: form.user.trim(),
    };
  }
}
