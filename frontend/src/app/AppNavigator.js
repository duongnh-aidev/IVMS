import { Observable } from '../core/viper';

const ROUTES = { login: '#/login', app: '#/app' };

/** Top-level routes in the URL hash: #/login (default) and #/app. */
export class AppNavigator extends Observable {
  constructor() {
    super();
    window.addEventListener('hashchange', () => this.emit());
  }

  route() {
    return window.location.hash === ROUTES.app ? 'app' : 'login';
  }

  toApp() {
    window.location.hash = ROUTES.app;
  }

  toLogin() {
    window.location.hash = ROUTES.login;
  }
}
