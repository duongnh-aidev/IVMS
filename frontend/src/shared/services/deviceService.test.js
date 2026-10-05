import { describe, expect, it } from 'vitest';
import { FakeApi, loadedDevices } from '../../test/fakeApi';
import { DEVICES } from '../../test/fixtures';
import { DeviceService } from './deviceService';

describe('DeviceService', () => {
  it('maps API devices to display records', async () => {
    const { devices } = await loadedDevices();
    expect(devices.list()[3]).toEqual({
      i: 'dev-4',
      id: 'CAM-04',
      name: 'Warehouse',
      status: 'Error',
      ip: '192.168.1.104:8000',
      fw: 'V2.2.8',
      model: 'NVR-3208',
      account: 'admin',
      grp: 'hq-b',
      grpName: 'Building B',
    });
    expect(devices.codeOf('dev-4')).toBe('CAM-04');
  });

  it('reads every page of devices', async () => {
    const many = Array.from({ length: 450 }, (_, i) => ({ ...DEVICES[0], id: 'd' + i, name: 'Cam ' + i }));
    const api = new FakeApi({ devices: many });
    const devices = new DeviceService({ api });
    await devices.load();
    expect(devices.ids()).toHaveLength(450);
    expect(api.calls.filter(([, path]) => path.startsWith('/devices?'))).toHaveLength(3);
  });

  it('starts empty and notifies listeners once loaded', async () => {
    const devices = new DeviceService({ api: new FakeApi() });
    expect(devices.list()).toEqual([]);
    let notified = 0;
    devices.subscribe(() => notified++);
    await devices.load();
    expect(notified).toBe(1);
    expect(devices.groups()).toHaveLength(6);
  });
});
