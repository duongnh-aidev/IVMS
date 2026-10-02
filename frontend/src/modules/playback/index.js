import { createElement } from 'react';
import { PlaybackInteractor } from './PlaybackInteractor';
import { PlaybackPresenter } from './PlaybackPresenter';
import PlaybackView from './PlaybackView';

export function buildPlayback({ devices, archive, toast }) {
  const presenter = new PlaybackPresenter({ interactor: new PlaybackInteractor({ devices, archive }), toast });
  return { presenter, View: () => createElement(PlaybackView, { presenter }) };
}
