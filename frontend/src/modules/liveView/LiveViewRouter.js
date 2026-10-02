export class LiveViewRouter {
  constructor({ shell, deviceEditor }) {
    this.shell = shell;
    this.deviceEditor = deviceEditor;
  }

  toPlayback() {
    this.shell.show('playback');
  }

  toAddDevice() {
    this.deviceEditor.open();
  }
}
