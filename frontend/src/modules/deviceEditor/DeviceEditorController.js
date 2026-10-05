import { prevented, withValue } from '../../core/events';
import { Controller } from '../../core/mvc';

const EMPTY_FORM = { name: '', ip: '', port: '554', path: '', user: '', pass: '', show: false };
const TEST_STYLE = { ok: ['#E8F5EC', '#1E7A3C'], fail: ['#FCEDED', '#C62828'] };
const TEST_FAILED = "Couldn't open the RTSP stream. Check the IP, port, path and credentials.";
// Editing any connection field invalidates the last test result.
const CONNECTION_FIELDS = ['ip', 'port', 'path', 'user', 'pass'];

/** "Add device" / "Edit device" modal. Public input: `open(deviceId?)`. */
export class DeviceEditorController extends Controller {
  constructor({ model, toast }) {
    super();
    this.model = model;
    this.toast = toast;
    this.state = {
      open: false,
      editId: null,
      form: EMPTY_FORM,
      touched: false,
      test: 'idle', // idle | testing | ok | fail
      testMsg: '',
      saving: false,
      saveError: '', // from the server (duplicate address, stream relay down, ...)
    };
  }

  // ---- intents ----
  open = (deviceId = null) =>
    this.setState({
      open: true,
      editId: deviceId,
      touched: false,
      test: 'idle',
      saving: false,
      saveError: '',
      form: deviceId == null ? EMPTY_FORM : { ...this.model.load(deviceId), show: false },
    });

  close = () => this.setState({ open: false });

  setField = (key, value) =>
    this.setState((s) => ({
      form: { ...s.form, [key]: value },
      test: CONNECTION_FIELDS.includes(key) ? 'idle' : s.test,
      saveError: '',
    }));

  togglePassword = () => this.setState((s) => ({ form: { ...s.form, show: !s.form.show } }));

  testConnection = async () => {
    const { form, editId } = this.state;
    this.setState({ test: 'testing' });
    try {
      const r = await this.model.testConnection(editId, form);
      this.setState(
        r.reachable
          ? { test: 'ok', testMsg: 'Stream reachable' + (r.codec ? ' · ' + r.codec : '') }
          : { test: 'fail', testMsg: r.error || TEST_FAILED },
      );
    } catch (err) {
      this.setState({ test: 'fail', testMsg: err.message });
    }
  };

  submit = async () => {
    const { form, editId, saving } = this.state;
    if (saving) return;
    const { nameOk, ipOk } = this.model.validate(form);
    if (!nameOk || !ipOk) return this.setState({ touched: true });
    this.setState({ saving: true, saveError: '' });
    try {
      const device = await this.model.save(editId, form);
      this.setState({ open: false, saving: false });
      this.toast.ok(editId != null ? 'Device updated' : 'Added ' + device.name);
    } catch (err) {
      this.setState({ saving: false, saveError: err.message });
    }
  };

  // ---- view model ----
  present() {
    const { open, editId, form: f, touched: t, test, saving, saveError } = this.state;
    const { nameOk, ipOk } = this.model.validate(f);
    const [testBg, testColor] = TEST_STYLE[test] || ['', ''];
    const testMsg = TEST_STYLE[test] ? this.state.testMsg : '';
    const field = (key) => withValue((v) => this.setField(key, v));
    const border = (bad) => (bad ? '#C62828' : '#D0D1D2');
    const path = f.path ? (f.path.startsWith('/') ? f.path : '/' + f.path) : '/';
    return {
      open,
      addTitle: editId != null ? 'Edit device' : 'Add device',
      addCta: saving ? 'Saving…' : editId != null ? 'Save' : 'Add',
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
      fPassPlaceholder: editId != null ? 'Leave empty to keep the saved password' : 'Password',
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
      addError: t && (!nameOk || !ipOk) ? 'Enter a device name and a valid IP address.' : saveError,
      submitAdd: prevented(this.submit),
    };
  }
}
