export class DevicesRouter {
  constructor({ shell, liveView, deviceEditor }) {
    this.shell = shell;
    this.liveView = liveView;
    this.deviceEditor = deviceEditor;
  }

  /** Shows Live View with the device pinned to the grid (if there is room). */
  toLiveView(deviceId) {
    this.liveView.pin(deviceId);
    this.shell.show('live');
  }

  toAddDevice() {
    this.deviceEditor.open();
  }

  toEditDevice(deviceId) {
    this.deviceEditor.open(deviceId);
  }
}
