import { Observable } from '../../core/mvc';

const DEFAULT_PREFERENCES = {
  lang: 'English',
  start: 'Live View',
  tfmt: '24-hour',
  launch: true,
  quality: 'Auto',
  twofa: false,
  nMotion: true,
  nTamper: true,
  nOffline: true,
  nStorage: true,
  desktop: true,
  sound: false,
  autoUpd: true,
};

/** User preferences, account and server info (in-memory until the backend exists). */
export class SettingsModel extends Observable {
  #prefs = { ...DEFAULT_PREFERENCES };

  preferences() {
    return this.#prefs;
  }

  setPreference(key, value) {
    this.#prefs = { ...this.#prefs, [key]: value };
    this.emit();
  }

  account() {
    return { name: 'Nguyen Van An', username: 'an.nguyen', role: 'Admin' };
  }

  server() {
    return { address: '192.168.1.10:8000', status: 'Connected · 12 ms' };
  }

  about() {
    // Version and edition come from the server (SettingsController)
    return { update: '1.0.1' };
  }

  // Actions below are simulated; each returns the message to show.
  requestPasswordChange() {
    return 'Password change email sent';
  }

  reconnect() {
    return 'Reconnected to ' + this.server().address.split(':')[0];
  }

  installUpdate() {
    return 'Downloading IVMS ' + this.about().update + '…';
  }
}
