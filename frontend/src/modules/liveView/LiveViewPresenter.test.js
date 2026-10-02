import { describe, expect, it, vi } from 'vitest';
import { DeviceService } from '../../shared/services/deviceService';
import { LiveViewInteractor } from './LiveViewInteractor';
import { LiveViewPresenter } from './LiveViewPresenter';

function setup() {
  const devices = new DeviceService(13);
  const router = { toPlayback: vi.fn(), toAddDevice: vi.fn() };
  const presenter = new LiveViewPresenter({ interactor: new LiveViewInteractor({ devices }), router });
  return { devices, router, presenter, vm: () => presenter.getViewModel() };
}

describe('LiveViewPresenter', () => {
  it('pins cameras until the grid is full', () => {
    const { presenter, vm } = setup();
    [0, 1, 2, 3, 4].forEach(presenter.pin);
    expect(vm().pinnedCount).toBe('4/4');
    expect(vm().tiles.map((t) => t.id)).toEqual(['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04']);
    expect(vm().deviceList[4].pinTitle).toBe('Grid is full');
  });

  it('drops pinned cameras that no longer fit when the layout shrinks', () => {
    const { presenter, vm } = setup();
    [0, 1, 2].forEach(presenter.pin);
    presenter.setLayout(1);
    expect(vm().pinnedCount).toBe('1/1');
    expect(vm().gridCols).toBe('repeat(1, minmax(0,1fr))');
  });

  it('unpins a deleted device', () => {
    const { devices, presenter, vm } = setup();
    presenter.pin(2);
    devices.remove(2);
    expect(vm().noPinned).toBe(true);
    expect(vm().deviceCount).toBe(12);
  });

  it('routes to playback and to the device editor', () => {
    const { router, vm } = setup();
    vm().goPlayback();
    vm().openAdd();
    expect(router.toPlayback).toHaveBeenCalled();
    expect(router.toAddDevice).toHaveBeenCalled();
  });
});
