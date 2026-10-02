export class LoginRouter {
  constructor({ appNavigator }) {
    this.appNavigator = appNavigator;
  }

  toApp() {
    this.appNavigator.toApp();
  }
}
