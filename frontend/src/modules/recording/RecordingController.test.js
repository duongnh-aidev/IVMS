import { describe, expect, it } from 'vitest';
import { ToastService } from '../../shared/services/toastService';
import { RecordingModel } from './RecordingModel';
import { RecordingController } from './RecordingController';

describe('RecordingController', () => {
  it('paints hours with the selected mode while the mouse is down', () => {
    const controller = new RecordingController({ model: new RecordingModel(), toast: new ToastService() });
    const vm = () => controller.getViewModel();
    expect(vm().recSummary.map((x) => x.hours)).toEqual(['60 h/week', '108 h/week', '0 h/week']);
    controller.setMode('O');
    controller.startPaint(0, 0);
    controller.continuePaint(0, 1);
    controller.endPaint();
    controller.continuePaint(0, 2); // released: no effect
    expect(vm().recSummary[2].hours).toBe('2 h/week');
    expect(vm().recTemplates.every((t) => t.bg === '#FFFFFF')).toBe(true); // template no longer matches
    controller.applyTemplate('24/7 continuous');
    expect(vm().recSummary[0].hours).toBe('168 h/week');
  });
});
