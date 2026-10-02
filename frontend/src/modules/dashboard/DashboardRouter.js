export class DashboardRouter {
  constructor({ shell }) {
    this.shell = shell;
  }

  toDevices() {
    this.shell.show('devices');
  }
}
