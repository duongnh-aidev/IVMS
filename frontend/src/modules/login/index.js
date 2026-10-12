import { createElement } from 'react';
import { SystemInfoService } from '../../shared/services/systemInfoService';
import { LoginModel } from './LoginModel';
import { LoginController } from './LoginController';
import LoginView from './LoginView';

export function buildLogin({ appNavigator, api, auth, showServer }) {
  const controller = new LoginController({
    model: new LoginModel({ auth, systemInfo: new SystemInfoService({ api }) }),
    appNavigator,
    showServer,
  });
  return { controller, View: () => createElement(LoginView, { controller }) };
}
