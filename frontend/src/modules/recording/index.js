import { createElement } from 'react';
import { RecordingModel } from './RecordingModel';
import { RecordingController } from './RecordingController';
import RecordingView from './RecordingView';

export function buildRecording({ toast }) {
  const controller = new RecordingController({ model: new RecordingModel(), toast });
  return { controller, View: () => createElement(RecordingView, { controller }) };
}
