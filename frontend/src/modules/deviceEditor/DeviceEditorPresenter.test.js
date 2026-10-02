import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceService } from '../../shared/services/deviceService';
import { ToastService } from '../../shared/services/toastService';
import { DeviceEditorInteractor } from './DeviceEditorInteractor';
import { DeviceEditorPresenter } from './DeviceEditorPresenter';

function setup() {
  const devices = new DeviceService(2);
  const toast = new ToastService();
  const presenter = new DeviceEditorPresenter({ interactor: new DeviceEditorInteractor({ devices }), toast });
  return { devices, toast, presenter, vm: () => presenter.getViewModel() };
}

describe('DeviceEditorPresenter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('validates name and IP before adding', () => {
    const { devices, presenter, vm } = setup();
    presenter.open();
    presenter.submit();
    expect(vm().addError).toBe('Enter a device name and a valid IP address.');
    expect(vm().fIpBorder).toBe('#C62828');
    presenter.setField('name', 'Gate 2');
    presenter.setField('ip', '10.0.0.7');
    expect(vm().rtspUrl).toBe('rtsp://10.0.0.7:554/');
    presenter.submit();
    expect(vm().open).toBe(false);
    expect(devices.nameOf(100)).toBe('Gate 2');
  });

  it('edits an existing device', () => {
    const { devices, toast, presenter, vm } = setup();
    presenter.open(1);
    expect(vm().addTitle).toBe('Edit device');
    expect(vm().fIp).toBe('192.168.1.102');
    expect(vm().fPort).toBe('8000');
    presenter.setField('name', 'Lobby East');
    presenter.submit();
    expect(devices.nameOf(1)).toBe('Lobby East');
    expect(toast.current.msg).toBe('Device updated');
  });

  it('tests the connection and resets the result when the address changes', async () => {
    const { presenter, vm } = setup();
    presenter.open();
    presenter.setField('ip', '10.0.0.7');
    const done = presenter.testConnection();
    expect(vm().testLabel).toBe('Testing…');
    await vi.advanceTimersByTimeAsync(1100);
    await done;
    expect(vm().testMsg).toMatch(/Stream reachable/);
    presenter.setField('port', '8554');
    expect(vm().testMsg).toBe('');
  });
});
