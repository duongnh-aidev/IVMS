/** Navigation out of the main window. */
export class ShellRouter {
  constructor({ appNavigator }) {
    this.appNavigator = appNavigator;
  }

  signOut() {
    this.appNavigator.toLogin();
  }
}
