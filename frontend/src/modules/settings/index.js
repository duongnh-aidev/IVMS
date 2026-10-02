import { createElement } from 'react';
import { SettingsInteractor } from './SettingsInteractor';
import { SettingsPresenter } from './SettingsPresenter';
import { SettingsRouter } from './SettingsRouter';
import SettingsView from './SettingsView';

export function buildSettings({ toast, appNavigator }) {
  const presenter = new SettingsPresenter({
    interactor: new SettingsInteractor(),
    router: new SettingsRouter({ appNavigator }),
    toast,
  });
  return {
    presenter,
    input: { showSection: presenter.showSection },
    View: () => createElement(SettingsView, { presenter }),
  };
}
