/** Devices available for the live grid. */
export class LiveViewModel {
  constructor({ devices }) {
    this.devices = devices;
  }

  get source() {
    return this.devices;
  }

  deviceIds() {
    return this.devices.ids();
  }

  nameOf(id) {
    return this.devices.nameOf(id);
  }

  codeOf(id) {
    return this.devices.codeOf(id);
  }
}
