import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordingArchiveService } from '../../shared/services/recordingArchiveService';
import { ToastService } from '../../shared/services/toastService';
import { PlaybackModel } from './PlaybackModel';
import { PlaybackController } from './PlaybackController';
import { loadedDevices } from '../../test/fakeApi';

async function setup() {
  const { devices } = await loadedDevices();
  const model = new PlaybackModel({ devices, archive: new RecordingArchiveService() });
  const toast = new ToastService();
  const controller = new PlaybackController({ model, toast });
  return { toast, controller, vm: () => controller.getViewModel() };
}

describe('PlaybackController', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('advances the playhead only while attached and playing', async () => {
    const { controller, vm } = await setup();
    expect(vm().pbTimeLabel).toBe('14:32:10');
    controller.attach();
    controller.togglePlay();
    controller.setSpeed('4');
    vi.advanceTimersByTime(1000);
    expect(vm().pbTimeLabel).toBe('14:32:14');
    controller.detach();
    vi.advanceTimersByTime(1000);
    expect(vm().pbTimeLabel).toBe('14:32:14');
  });

  it('seeks within the zoomed window', async () => {
    const { controller, vm } = await setup();
    controller.setZoom('1h'); // window centred on 14:32:10 -> 14:02:10..15:02:10
    controller.seekToFraction(0);
    expect(vm().pbTimeLabel).toBe('14:02:10');
  });

  it('never moves past today', async () => {
    const { controller, vm } = await setup();
    controller.shiftDay(1);
    expect(vm().pbDateLabel).toBe('Oct 1, 2026');
    controller.shiftDay(-1);
    expect(vm().pbDateLabel).toBe('Sep 30, 2026');
  });

  it('validates the export range', async () => {
    const { toast, controller, vm } = await setup();
    controller.openExport();
    expect(vm().exportForm.exDuration).toBe('Duration 00:01:00');
    controller.setExportField('to', '01:00:00');
    vm().exportForm.doExport();
    expect(vm().exportForm.exError).toMatch(/valid range/);
    controller.setExportField('to', '14:40:00');
    vm().exportForm.doExport();
    expect(vm().exportForm).toBe(null);
    expect(toast.current.msg).toBe('Exporting Front Gate · MP4');
  });

  it('adds bookmarks at the playhead', async () => {
    const { controller, vm } = await setup();
    controller.addBookmark();
    expect(vm().pbMarkList).toEqual([
      expect.objectContaining({ note: 'Bookmark 1', time: '14:32:10', cams: 'Front Gate' }),
    ]);
  });
});
