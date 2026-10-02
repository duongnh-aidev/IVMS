import { createElement } from 'react';
import { DevicesInteractor } from './DevicesInteractor';
import { DevicesPresenter } from './DevicesPresenter';
import { DevicesRouter } from './DevicesRouter';
import DevicesView from './DevicesView';

export function buildDevices({ devices, toast, shell, liveView, deviceEditor }) {
  const presenter = new DevicesPresenter({
    interactor: new DevicesInteractor({ devices }),
    router: new DevicesRouter({ shell, liveView, deviceEditor }),
    toast,
  });
  return { presenter, View: () => createElement(DevicesView, { presenter }) };
}
