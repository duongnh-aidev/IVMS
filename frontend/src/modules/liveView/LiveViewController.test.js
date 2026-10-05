import { describe, expect, it, vi } from 'vitest';
import { LiveViewModel } from './LiveViewModel';
import { LiveViewController } from './LiveViewController';
import { loadedDevices } from '../../test/fakeApi';
import { DEVICE_IDS as IDS } from '../../test/fixtures';

async function setup() {
  const { devices } = await loadedDevices();
  const shell = { show: vi.fn() };
  const deviceEditor = { open: vi.fn() };
  const controller = new LiveViewController({ model: new LiveViewModel({ devices }), shell, deviceEditor });
  return { devices, shell, deviceEditor, controller, vm: () => controller.getViewModel() };
}

describe('LiveViewController', () => {
  it('pins cameras until the grid is full', async () => {
    const { controller, vm } = await setup();
    IDS.slice(0, 5).forEach(controller.pin);
    expect(vm().pinnedCount).toBe('4/4');
    expect(vm().tiles.map((t) => t.id)).toEqual(['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04']);
    expect(vm().deviceList[4].pinTitle).toBe('Grid is full');
  });

  it('drops pinned cameras that no longer fit when the layout shrinks', async () => {
    const { controller, vm } = await setup();
    IDS.slice(0, 3).forEach(controller.pin);
    controller.setLayout(1);
    expect(vm().pinnedCount).toBe('1/1');
    expect(vm().gridCols).toBe('repeat(1, minmax(0,1fr))');
  });

  it('unpins a deleted device', async () => {
    const { devices, controller, vm } = await setup();
    controller.pin(IDS[2]);
    await devices.remove(IDS[2]);
    expect(vm().noPinned).toBe(true);
    expect(vm().deviceCount).toBe(12);
  });

  it('routes to playback and to the device editor', async () => {
    const { shell, deviceEditor, vm } = await setup();
    vm().goPlayback();
    vm().openAdd();
    expect(shell.show).toHaveBeenCalledWith('playback');
    expect(deviceEditor.open).toHaveBeenCalledWith();
  });
});
