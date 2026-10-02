import { DEVICE_GROUPS, inGroup } from '../../shared/entities/device';

/** Device inventory: listing, grouping and deletion. */
export class DevicesInteractor {
  constructor({ devices }) {
    this.devices = devices;
  }

  get source() {
    return this.devices;
  }

  list() {
    return this.devices.list();
  }

  groups() {
    return DEVICE_GROUPS;
  }

  countInGroup(group) {
    return this.list().filter((d) => inGroup(d.grp, group)).length;
  }

  nameOf(id) {
    return this.devices.nameOf(id);
  }

  remove(id) {
    this.devices.remove(id);
  }
}
