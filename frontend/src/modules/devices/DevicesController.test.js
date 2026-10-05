import { describe, expect, it, vi } from 'vitest';
import { ToastService } from '../../shared/services/toastService';
import { DevicesModel } from './DevicesModel';
import { DevicesController } from './DevicesController';
import { loadedDevices } from '../../test/fakeApi';
import { DEVICE_IDS } from '../../test/fixtures';

async function setup() {
  const { api, devices } = await loadedDevices();
  const toast = new ToastService();
  const shell = { show: vi.fn() };
  const liveView = { pin: vi.fn() };
  const deviceEditor = { open: vi.fn() };
  const controller = new DevicesController({
    model: new DevicesModel({ devices }),
    toast,
    shell,
    liveView,
    deviceEditor,
  });
  return { api, devices, toast, shell, liveView, deviceEditor, controller, vm: () => controller.getViewModel() };
}

describe('DevicesController', () => {
  it('filters by status tab, group (with sub-groups) and search', async () => {
    const { controller, vm } = await setup();
    expect(vm().devTabs.map((t) => t.count)).toEqual([13, 9, 2, 2]);
    controller.selectTab('Error');
    expect(vm().devRows.map((r) => r.name)).toEqual(['Warehouse', 'Stairwell A']);
    controller.selectTab('all');
    controller.selectGroup('wh');
    expect(vm().devRows.every((r) => r.grp === 'wh')).toBe(true);
    controller.selectGroup('hq-a');
    expect(new Set(vm().devRows.map((r) => r.grp))).toEqual(new Set(['hq-a-1', 'hq-a-2']));
    expect(vm().devRows[0].grpName).toBe('Building A · Floor 1');
    controller.selectGroup('wh');
    controller.search('lobby');
    expect(vm().noRows).toBe(true);
  });

  it('lists the group tree with device counts', async () => {
    const { vm } = await setup();
    expect(vm().grpList.map((g) => [g.label, g.count])).toEqual([
      ['All devices', 13],
      ['Head Office', 10],
      ['Building A', 7],
      ['Floor 1', 4],
      ['Floor 2', 3],
      ['Building B', 3],
      ['Warehouse', 3],
    ]);
  });

  it('deletes a device on the server after confirmation', async () => {
    const { api, devices, toast, controller, vm } = await setup();
    vm().devRows[1].onMenu();
    vm().devRows[1].onDelete();
    expect(vm().confirm.delName).toBe('Lobby');
    await vm().confirm.doDelete();
    expect(vm().confirm).toBe(false);
    expect(api.calls).toContainEqual(['DELETE', '/devices/dev-2', undefined]);
    expect(devices.ids()).not.toContain('dev-2');
    expect(toast.current).toEqual({ kind: 'err', msg: 'Deleted Lobby' });
    toast.close();
  });

  it('shows a server error when the delete fails', async () => {
    const { api, toast, controller, vm } = await setup();
    api.devices = api.devices.filter((d) => d.id !== 'dev-2'); // deleted elsewhere meanwhile
    controller.askDelete('dev-2');
    await vm().confirm.doDelete();
    expect(toast.current).toEqual({ kind: 'err', msg: "Couldn't delete Lobby: Device not found" });
    toast.close();
  });

  it('opens a device in Live View and in the editor', async () => {
    const { shell, liveView, deviceEditor, vm } = await setup();
    vm().devRows[3].onLive();
    expect(liveView.pin).toHaveBeenCalledWith(DEVICE_IDS[3]);
    expect(shell.show).toHaveBeenCalledWith('live');
    vm().devRows[3].onEdit();
    expect(deviceEditor.open).toHaveBeenCalledWith(DEVICE_IDS[3]);
  });

  it('hides extra columns on a narrow table', async () => {
    const { controller, vm } = await setup();
    controller.setTableWidth(500);
    expect(vm().devWide).toBe(false);
  });
});
