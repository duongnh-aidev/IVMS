import { createElement } from 'react';
import { LiveViewInteractor } from './LiveViewInteractor';
import { LiveViewPresenter } from './LiveViewPresenter';
import { LiveViewRouter } from './LiveViewRouter';
import LiveViewView from './LiveViewView';

export function buildLiveView({ devices, shell, deviceEditor }) {
  const presenter = new LiveViewPresenter({
    interactor: new LiveViewInteractor({ devices }),
    router: new LiveViewRouter({ shell, deviceEditor }),
  });
  return { presenter, input: { pin: presenter.pin }, View: () => createElement(LiveViewView, { presenter }) };
}
