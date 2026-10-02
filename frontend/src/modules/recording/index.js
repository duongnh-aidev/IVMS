import { createElement } from 'react';
import { RecordingInteractor } from './RecordingInteractor';
import { RecordingPresenter } from './RecordingPresenter';
import RecordingView from './RecordingView';

export function buildRecording({ toast }) {
  const presenter = new RecordingPresenter({ interactor: new RecordingInteractor(), toast });
  return { presenter, View: () => createElement(RecordingView, { presenter }) };
}
