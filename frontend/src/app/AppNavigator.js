import { Observable } from '../core/mvc';

const ROUTES = { login: '#/login', app: '#/app' };

/**
 * Top-level routes in the URL hash: #/login and #/app. The app is only shown with a valid
 * session; when the session ends (sign out, token expired) it goes back to #/login.
 */
export class AppNavigator extends Observable {
  constructor({ auth }) {
    super();
    this.auth = auth;
    window.addEventListener('hashchange', () => this.emit());
    auth.subscribe(() => {
      if (!auth.isSignedIn()) this.toLogin();
      this.emit();
    });
  }

  route() {
    return this.auth.isSignedIn() && window.location.hash !== ROUTES.login ? 'app' : 'login';
  }

  toApp() {
    window.location.hash = ROUTES.app;
  }

  toLogin() {
    window.location.hash = ROUTES.login;
  }
}
