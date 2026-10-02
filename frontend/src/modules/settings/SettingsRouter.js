export class SettingsRouter {
  constructor({ appNavigator }) {
    this.appNavigator = appNavigator;
  }

  signOut() {
    this.appNavigator.toLogin();
  }
}
