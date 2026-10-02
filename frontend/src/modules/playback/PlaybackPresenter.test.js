import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceService } from '../../shared/services/deviceService';
import { RecordingArchiveService } from '../../shared/services/recordingArchiveService';
import { ToastService } from '../../shared/services/toastService';
import { PlaybackInteractor } from './PlaybackInteractor';
import { PlaybackPresenter } from './PlaybackPresenter';

function setup() {
  const interactor = new PlaybackInteractor({ devices: new DeviceService(13), archive: new RecordingArchiveService() });
  const toast = new ToastService();
  const presenter = new PlaybackPresenter({ interactor, toast });
  return { toast, presenter, vm: () => presenter.getViewModel() };
}

describe('PlaybackPresenter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('advances the playhead only while attached and playing', () => {
    const { presenter, vm } = setup();
    expect(vm().pbTimeLabel).toBe('14:32:10');
    presenter.attach();
    presenter.togglePlay();
    presenter.setSpeed('4');
    vi.advanceTimersByTime(1000);
    expect(vm().pbTimeLabel).toBe('14:32:14');
    presenter.detach();
    vi.advanceTimersByTime(1000);
    expect(vm().pbTimeLabel).toBe('14:32:14');
  });

  it('seeks within the zoomed window', () => {
    const { presenter, vm } = setup();
    presenter.setZoom('1h'); // window centred on 14:32:10 -> 14:02:10..15:02:10
    presenter.seekToFraction(0);
    expect(vm().pbTimeLabel).toBe('14:02:10');
  });

  it('never moves past today', () => {
    const { presenter, vm } = setup();
    presenter.shiftDay(1);
    expect(vm().pbDateLabel).toBe('Oct 1, 2026');
    presenter.shiftDay(-1);
    expect(vm().pbDateLabel).toBe('Sep 30, 2026');
  });

  it('validates the export range', () => {
    const { toast, presenter, vm } = setup();
    presenter.openExport();
    expect(vm().exportForm.exDuration).toBe('Duration 00:01:00');
    presenter.setExportField('to', '01:00:00');
    vm().exportForm.doExport();
    expect(vm().exportForm.exError).toMatch(/valid range/);
    presenter.setExportField('to', '14:40:00');
    vm().exportForm.doExport();
    expect(vm().exportForm).toBe(null);
    expect(toast.current.msg).toBe('Exporting Front Gate · MP4');
  });

  it('adds bookmarks at the playhead', () => {
    const { presenter, vm } = setup();
    presenter.addBookmark();
    expect(vm().pbMarkList).toEqual([
      expect.objectContaining({ note: 'Bookmark 1', time: '14:32:10', cams: 'Front Gate' }),
    ]);
  });
});
