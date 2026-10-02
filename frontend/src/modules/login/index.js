import { createElement } from 'react';
import { LoginInteractor } from './LoginInteractor';
import { LoginPresenter } from './LoginPresenter';
import { LoginRouter } from './LoginRouter';
import LoginView from './LoginView';

export function buildLogin({ appNavigator, showServer, edition, simulateError }) {
  const presenter = new LoginPresenter({
    interactor: new LoginInteractor({ simulateError }),
    router: new LoginRouter({ appNavigator }),
    showServer,
    edition,
  });
  return { presenter, View: () => createElement(LoginView, { presenter }) };
}
