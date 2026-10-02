import { describe, expect, it, vi } from 'vitest';
import { DeviceService } from '../../shared/services/deviceService';
import { ToastService } from '../../shared/services/toastService';
import { DevicesInteractor } from './DevicesInteractor';
import { DevicesPresenter } from './DevicesPresenter';
import { DevicesRouter } from './DevicesRouter';

function setup() {
  const devices = new DeviceService(13);
  const toast = new ToastService();
  const shell = { show: vi.fn() };
  const liveView = { pin: vi.fn() };
  const deviceEditor = { open: vi.fn() };
  const presenter = new DevicesPresenter({
    interactor: new DevicesInteractor({ devices }),
    router: new DevicesRouter({ shell, liveView, deviceEditor }),
    toast,
  });
  return { devices, toast, shell, liveView, deviceEditor, presenter, vm: () => presenter.getViewModel() };
}

describe('DevicesPresenter', () => {
  it('filters by status tab, group and search', () => {
    const { presenter, vm } = setup();
    expect(vm().devTabs.map((t) => t.count)).toEqual([13, 9, 2, 2]);
    presenter.selectTab('Error');
    expect(vm().devRows.map((r) => r.name)).toEqual(['Warehouse', 'Stairwell A']);
    presenter.selectTab('all');
    presenter.selectGroup('wh');
    expect(vm().devRows.every((r) => r.grp === 'wh')).toBe(true);
    presenter.search('lobby');
    expect(vm().noRows).toBe(true);
  });

  it('deletes a device after confirmation', () => {
    const { devices, toast, presenter, vm } = setup();
    vm().devRows[1].onMenu();
    vm().devRows[1].onDelete();
    expect(vm().confirm.delName).toBe('Lobby');
    vm().confirm.doDelete();
    expect(vm().confirm).toBe(false);
    expect(devices.ids()).not.toContain(1);
    expect(toast.current).toEqual({ kind: 'err', msg: 'Deleted Lobby' });
    toast.close();
  });

  it('opens a device in Live View and in the editor through the router', () => {
    const { shell, liveView, deviceEditor, vm } = setup();
    vm().devRows[3].onLive();
    expect(liveView.pin).toHaveBeenCalledWith(3);
    expect(shell.show).toHaveBeenCalledWith('live');
    vm().devRows[3].onEdit();
    expect(deviceEditor.open).toHaveBeenCalledWith(3);
  });

  it('hides extra columns on a narrow table', () => {
    const { presenter, vm } = setup();
    presenter.setTableWidth(500);
    expect(vm().devWide).toBe(false);
  });
});
