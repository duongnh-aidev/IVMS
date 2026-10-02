import { Observable } from '../../core/viper';

export const DEFAULT_POLICY = { ret: '30 days', full: 'Overwrite oldest' };

const DISKS = [
  {
    name: 'Disk 1',
    type: 'Local · HDD',
    path: '/Volumes/IVMS-01',
    cap: 4,
    used: 2.9,
    role: 'Recording',
    status: 'Healthy',
    color: '#171A20',
  },
  {
    name: 'Disk 2',
    type: 'Local · HDD',
    path: '/Volumes/IVMS-02',
    cap: 4,
    used: 1.6,
    role: 'Recording',
    status: 'Healthy',
    color: '#3E6AE1',
  },
  {
    name: 'Office NAS',
    type: 'Network · SMB',
    path: 'smb://10.0.0.20/backup',
    cap: 8,
    used: 6.9,
    role: 'Backup',
    status: 'Almost full',
    color: '#8E8E8E',
  },
];

// Estimated days of footage that fit, by retention setting (capped by free space).
const DAYS_AVAILABLE = { '7 days': 7, '14 days': 14, '30 days': 18, '90 days': 18 };

/** Storage locations (disks / NAS) and the retention policy (in-memory mock). */
export class StorageInteractor extends Observable {
  #extra = [];
  #policy = DEFAULT_POLICY;

  disks() {
    return [...DISKS, ...this.#extra];
  }

  capacity() {
    const disks = this.disks();
    return { total: disks.reduce((a, d) => a + d.cap, 0), used: disks.reduce((a, d) => a + d.used, 0) };
  }

  policy() {
    return this.#policy;
  }

  setPolicy(patch) {
    this.#policy = { ...this.#policy, ...patch };
    this.emit();
  }

  resetPolicy() {
    this.#policy = DEFAULT_POLICY;
    this.emit();
  }

  daysAvailable() {
    return DAYS_AVAILABLE[this.#policy.ret];
  }

  /** @param {{name, path, network: boolean, role}} location */
  addLocation({ name, path, network, role }) {
    const disk = {
      name: name.trim(),
      type: network ? 'Network · SMB' : 'Local · HDD',
      path: path.trim(),
      cap: 4,
      used: 0,
      role,
      status: 'Healthy',
      color: '#D0D1D2',
    };
    this.#extra = [...this.#extra, disk];
    this.emit();
    return disk;
  }
}
