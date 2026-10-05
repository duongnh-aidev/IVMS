import { createElement } from 'react';
import { LoginModel } from './LoginModel';
import { LoginController } from './LoginController';
import LoginView from './LoginView';

export function buildLogin({ appNavigator, auth, showServer, edition }) {
  const controller = new LoginController({
    model: new LoginModel({ auth }),
    appNavigator,
    showServer,
    edition,
  });
  return { controller, View: () => createElement(LoginView, { controller }) };
}
