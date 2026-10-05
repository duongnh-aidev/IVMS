import { subtreeIds } from '../../shared/entities/device';

/** Device inventory: listing, grouping and deletion. */
export class DevicesModel {
  constructor({ devices }) {
    this.devices = devices;
  }

  get source() {
    return this.devices;
  }

  list() {
    return this.devices.list();
  }

  /** Group tree for the sidebar, "All devices" first: { id, label, depth, leaf }. */
  groups() {
    const groups = this.devices.groups();
    const parents = new Set(groups.map((g) => g.parentId));
    return [
      { id: 'all', label: 'All devices', depth: 0, leaf: false },
      ...groups.map((g) => ({ id: g.id, label: g.name, depth: g.depth, leaf: !parents.has(g.id) })),
    ];
  }

  /** Filter for devices in `group` or its sub-groups ('all' matches everything). */
  inGroup(group) {
    if (group === 'all') return () => true;
    const ids = subtreeIds(group, this.devices.groups());
    return (d) => ids.has(d.grp);
  }

  countInGroup(group) {
    return this.list().filter(this.inGroup(group)).length;
  }

  nameOf(id) {
    return this.devices.nameOf(id);
  }

  /** Rejects with an ApiError. */
  remove(id) {
    return this.devices.remove(id);
  }
}
