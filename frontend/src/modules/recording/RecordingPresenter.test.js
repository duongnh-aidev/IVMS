import { describe, expect, it } from 'vitest';
import { ToastService } from '../../shared/services/toastService';
import { RecordingInteractor } from './RecordingInteractor';
import { RecordingPresenter } from './RecordingPresenter';

describe('RecordingPresenter', () => {
  it('paints hours with the selected mode while the mouse is down', () => {
    const presenter = new RecordingPresenter({ interactor: new RecordingInteractor(), toast: new ToastService() });
    const vm = () => presenter.getViewModel();
    expect(vm().recSummary.map((x) => x.hours)).toEqual(['60 h/week', '108 h/week', '0 h/week']);
    presenter.setMode('O');
    presenter.startPaint(0, 0);
    presenter.continuePaint(0, 1);
    presenter.endPaint();
    presenter.continuePaint(0, 2); // released: no effect
    expect(vm().recSummary[2].hours).toBe('2 h/week');
    expect(vm().recTemplates.every((t) => t.bg === '#FFFFFF')).toBe(true); // template no longer matches
    presenter.applyTemplate('24/7 continuous');
    expect(vm().recSummary[0].hours).toBe('168 h/week');
  });
});
