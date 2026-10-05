import { createElement } from 'react';
import { PlaybackModel } from './PlaybackModel';
import { PlaybackController } from './PlaybackController';
import PlaybackView from './PlaybackView';

export function buildPlayback({ devices, archive, toast }) {
  const controller = new PlaybackController({ model: new PlaybackModel({ devices, archive }), toast });
  return { controller, View: () => createElement(PlaybackView, { controller }) };
}
