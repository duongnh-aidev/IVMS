import { Controller } from '../../core/mvc';
import { darkOption } from '../../shared/ui/options';

const SECTIONS = {
  general: 'General',
  account: 'Account',
  notifications: 'Notifications',
  server: 'Server',
  about: 'About',
};

/** Settings window: section list + rows (toggle / segmented / value / button). Public input: `showSection(key)`. */
export class SettingsController extends Controller {
  constructor({ model, auth, toast }) {
    super();
    this.model = model;
    this.auth = auth;
    this.toast = toast;
    this.state = { section: 'general' };
    this.observe(model);
  }

  showSection = (section) => this.setState({ section });
  setPreference = (key, value) => this.model.setPreference(key, value);
  run = (action) => this.toast.ok(action());
  signOut = () => this.auth.signOut();

  rows(section) {
    const p = this.model.preferences();
    const base = { isToggle: false, isSeg: false, isValue: false, isBtn: false, line: '#E6E7E9' };
    const toggle = (k, label, desc) => ({
      ...base,
      label,
      desc,
      isToggle: true,
      track: p[k] ? '#3E6AE1' : '#D0D1D2',
      justify: p[k] ? 'flex-end' : 'flex-start',
      onToggle: () => this.setPreference(k, !p[k]),
    });
    const segmented = (k, label, desc, values) => ({
      ...base,
      label,
      desc,
      isSeg: true,
      opts: values.map((v) => darkOption(v, p[k] === v, () => this.setPreference(k, v))),
    });
    const value = (label, v) => ({ ...base, label, desc: '', isValue: true, value: v });
    const button = (label, desc, btn, onBtn, danger) => ({
      ...base,
      label,
      desc,
      isBtn: true,
      btn,
      onBtn,
      btnColor: danger ? '#C62828' : '#171A20',
      btnBorder: danger ? '#F2C4C4' : '#D0D1D2',
    });
    const i = this.model;
    const account = i.account();
    const server = i.server();
    const about = i.about();
    const rows = {
      general: [
        segmented('lang', 'Language', 'Interface language.', ['English', 'Tiếng Việt']),
        segmented('start', 'Start screen', 'Screen shown after you sign in.', ['Dashboard', 'Live View']),
        segmented('tfmt', 'Time format', 'Used on timelines, logs and exports.', ['24-hour', '12-hour']),
        toggle('launch', 'Open at login', 'Start IVMS when you sign in to your Mac.'),
      ],
      account: [
        value('Name', account.name),
        value('Username', account.username),
        value('Role', account.role),
        button('Password', 'Last changed 42 days ago.', 'Change password', () =>
          this.run(() => i.requestPasswordChange()),
        ),
        toggle('twofa', 'Two-factor authentication', 'Require a code from your phone when signing in.'),
        button('Sign out', 'Sign out of IVMS on this Mac.', 'Sign out', this.signOut, true),
      ],
      notifications: [
        toggle('nMotion', 'Motion & AI events', 'Intrusion, line crossing and motion alerts.'),
        toggle('nTamper', 'Tampering & signal loss', 'When a camera is blocked or loses video.'),
        toggle('nOffline', 'Device offline', 'When a camera or NVR stops responding.'),
        toggle('nStorage', 'Storage almost full', 'When a storage location passes 85%.'),
        toggle('desktop', 'Desktop alerts', 'Show macOS notifications while IVMS is in the background.'),
        toggle('sound', 'Alert sound', 'Play a sound for high-severity events.'),
      ],
      server: [
        value('Server address', server.address),
        value('Status', server.status),
        segmented('quality', 'Live View quality', 'Auto switches to sub stream in large grids.', [
          'Auto',
          'Main',
          'Sub',
        ]),
        button('Connection', 'Reconnect if video stops updating.', 'Reconnect', () => this.run(() => i.reconnect())),
      ],
      about: [
        value('Version', about.version),
        value('License', about.license),
        toggle('autoUpd', 'Automatic updates', 'Download and install updates when available.'),
        button('Updates', `IVMS ${about.update} is available.`, 'Install update', () =>
          this.run(() => i.installUpdate()),
        ),
      ],
    }[section];
    // The last row has no divider.
    rows[rows.length - 1] = { ...rows[rows.length - 1], line: 'transparent' };
    return rows;
  }

  present() {
    const { section } = this.state;
    return {
      setSecs: Object.entries(SECTIONS).map(([k, label]) => ({
        label,
        bg: section === k ? '#FFFFFF' : 'transparent',
        shadow: section === k ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
        weight: section === k ? 600 : 400,
        onClick: () => this.showSection(k),
      })),
      setRows: this.rows(section),
    };
  }
}
