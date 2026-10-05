import { describe, expect, it } from 'vitest';
import { ToastService } from '../../shared/services/toastService';
import { DeviceEditorModel } from './DeviceEditorModel';
import { DeviceEditorController } from './DeviceEditorController';
import { loadedDevices } from '../../test/fakeApi';

async function setup(options) {
  const { api, devices } = await loadedDevices(options);
  const toast = new ToastService();
  const controller = new DeviceEditorController({ model: new DeviceEditorModel({ devices }), toast });
  return { api, devices, toast, controller, vm: () => controller.getViewModel() };
}

const lastCall = (api) => api.calls.at(-1);

describe('DeviceEditorController', () => {
  it('validates name and IP before adding on the server', async () => {
    const { api, devices, controller, vm } = await setup();
    controller.open();
    await controller.submit();
    expect(vm().addError).toBe('Enter a device name and a valid IP address.');
    expect(vm().fIpBorder).toBe('#C62828');
    controller.setField('name', 'Gate 2');
    controller.setField('ip', '10.0.0.7');
    controller.setField('pass', 'p@ss');
    expect(vm().rtspUrl).toBe('rtsp://10.0.0.7:554/');
    await controller.submit();
    expect(vm().open).toBe(false);
    expect(api.calls).toContainEqual([
      'POST',
      '/devices',
      { name: 'Gate 2', host: '10.0.0.7', port: 554, path: '', username: '', password: 'p@ss' },
    ]);
    expect(devices.list().at(-1).name).toBe('Gate 2');
  });

  it('edits an existing device and keeps its password when left empty', async () => {
    const { api, devices, toast, controller, vm } = await setup();
    controller.open('dev-2');
    expect(vm().addTitle).toBe('Edit device');
    expect(vm().fIp).toBe('192.168.1.102');
    expect(vm().fPort).toBe('8000');
    expect(vm().fPath).toBe('/Streaming/Channels/101');
    expect(vm().fPass).toBe('');
    controller.setField('name', 'Lobby East');
    await controller.submit();
    const [method, path, body] = api.calls.find(([m]) => m === 'PATCH');
    expect([method, path]).toEqual(['PATCH', '/devices/dev-2']);
    expect(body).not.toHaveProperty('password');
    expect(devices.nameOf('dev-2')).toBe('Lobby East');
    expect(toast.current.msg).toBe('Device updated');
    toast.close();
  });

  it('shows the server error and stays open when saving fails', async () => {
    const { controller, vm } = await setup();
    controller.open();
    controller.setField('name', 'Lobby copy');
    controller.setField('ip', '192.168.1.102');
    controller.setField('port', '8000');
    controller.setField('path', '/Streaming/Channels/101');
    await controller.submit();
    expect(vm().open).toBe(true);
    expect(vm().addError).toBe('A device with this address and path already exists');
    controller.setField('port', '8001');
    expect(vm().addError).toBe('');
  });

  it('tests the connection on the server and resets the result when the address changes', async () => {
    const { api, controller, vm } = await setup();
    controller.open();
    controller.setField('ip', '10.0.0.7');
    const done = controller.testConnection();
    expect(vm().testLabel).toBe('Testing…');
    await done;
    expect(lastCall(api)).toEqual([
      'POST',
      '/devices/probe',
      { host: '10.0.0.7', port: 554, path: '', username: '', password: '' },
    ]);
    expect(vm().testMsg).toBe('Stream reachable · H.264');
    controller.setField('port', '8554');
    expect(vm().testMsg).toBe('');
  });

  it('probes an edited device with its stored password and shows why it failed', async () => {
    const { api, controller, vm } = await setup({
      probe: { reachable: false, codec: null, error: 'Wrong username or password' },
    });
    controller.open('dev-1');
    await controller.testConnection();
    expect(lastCall(api)[2]).toEqual({
      host: '192.168.1.101',
      port: 8000,
      path: '/Streaming/Channels/101',
      username: 'admin',
      deviceId: 'dev-1',
    });
    expect(vm().testMsg).toBe('Wrong username or password');
    expect(vm().testColor).toBe('#C62828');
  });
});
