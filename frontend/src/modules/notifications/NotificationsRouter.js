export class NotificationsRouter {
  constructor({ shell, settings }) {
    this.shell = shell;
    this.settings = settings;
  }

  /** Opens the screen a notification points to ("Open storage", "View update", ...). */
  toTarget(screen) {
    if (screen === 'settings') this.settings.showSection('about');
    this.shell.show(screen);
  }
}
