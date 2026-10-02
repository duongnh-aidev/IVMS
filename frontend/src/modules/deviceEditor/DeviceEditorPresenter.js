import { prevented, withValue } from '../../core/events';
import { Presenter } from '../../core/viper';

const EMPTY_FORM = { name: '', ip: '', port: '554', path: '', user: '', pass: '', show: false };
const TEST_RESULT = {
  ok: ['Stream reachable · H.264 · 1920×1080 · 25 fps', '#E8F5EC', '#1E7A3C'],
  fail: ["Couldn't open the RTSP stream. Check the IP, port, path and credentials.", '#FCEDED', '#C62828'],
};
// Editing any connection field invalidates the last test result.
const CONNECTION_FIELDS = ['ip', 'port', 'path', 'user', 'pass'];

/** "Add device" / "Edit device" modal. Public input: `open(deviceId?)`. */
export class DeviceEditorPresenter extends Presenter {
  constructor({ interactor, toast }) {
    super();
    this.interactor = interactor;
    this.toast = toast;
    this.state = { open: false, editId: null, form: EMPTY_FORM, touched: false, test: 'idle' };
  }

  // ---- intents ----
  open = (deviceId = null) =>
    this.setState({
      open: true,
      editId: deviceId,
      touched: false,
      test: 'idle',
      form: deviceId == null ? EMPTY_FORM : { ...this.interactor.load(deviceId), show: false },
    });

  close = () => this.setState({ open: false });

  setField = (key, value) =>
    this.setState((s) => ({
      form: { ...s.form, [key]: value },
      test: CONNECTION_FIELDS.includes(key) ? 'idle' : s.test,
    }));

  togglePassword = () => this.setState((s) => ({ form: { ...s.form, show: !s.form.show } }));

  testConnection = async () => {
    this.setState({ test: 'testing' });
    const ok = await this.interactor.testConnection(this.state.form);
    this.setState({ test: ok ? 'ok' : 'fail' });
  };

  submit = () => {
    const { form, editId } = this.state;
    const { nameOk, ipOk } = this.interactor.validate(form);
    if (!nameOk || !ipOk) return this.setState({ touched: true });
    const rec = this.interactor.save(editId, form);
    this.setState({ open: false });
    this.toast.ok(editId != null ? 'Device updated' : 'Added ' + rec.name);
  };

  // ---- view model ----
  present() {
    const { open, editId, form: f, touched: t, test } = this.state;
    const { nameOk, ipOk } = this.interactor.validate(f);
    const [testMsg, testBg, testColor] = TEST_RESULT[test] || ['', '', ''];
    const field = (key) => withValue((v) => this.setField(key, v));
    const border = (bad) => (bad ? '#C62828' : '#D0D1D2');
    const path = f.path ? (f.path.startsWith('/') ? f.path : '/' + f.path) : '/';
    return {
      open,
      addTitle: editId != null ? 'Edit device' : 'Add device',
      addCta: editId != null ? 'Save' : 'Add',
      closeAdd: this.close,
      fName: f.name,
      fIp: f.ip,
      fPort: f.port,
      fPath: f.path,
      fUser: f.user,
      fPass: f.pass,
      setFName: field('name'),
      setFIp: field('ip'),
      setFPort: field('port'),
      setFPath: field('path'),
      setFUser: field('user'),
      setFPass: field('pass'),
      fNameBorder: border(t && !nameOk),
      fIpBorder: border(t && !ipOk),
      fPortBorder: border(false),
      fPathBorder: border(false),
      fUserBorder: border(false),
      rtspUrl:
        'rtsp://' +
        (f.user ? f.user + ':' + (f.pass ? '••••' : '') + '@' : '') +
        (f.ip.trim() || '<ip>') +
        ':' +
        (f.port || '554') +
        path,
      fPassType: f.show ? 'text' : 'password',
      fPassShown: f.show,
      fPassTitle: f.show ? 'Hide password' : 'Show password',
      toggleFPass: this.togglePassword,
      testing: test === 'testing',
      testLabel: test === 'testing' ? 'Testing…' : 'Test connection',
      testMsg,
      testBg,
      testColor,
      testConn: this.testConnection,
      addError: t && (!nameOk || !ipOk) ? 'Enter a device name and a valid IP address.' : '',
      submitAdd: prevented(this.submit),
    };
  }
}
