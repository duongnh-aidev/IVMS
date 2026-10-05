import { prevented, withValue } from '../../core/events';
import { Controller } from '../../core/mvc';

const ring = (bad) => (bad ? 'inset 0 0 0 1px #C62828' : 'inset 0 0 0 0 transparent');
// Same rule as the server (POST /auth/setup)
const MIN_ADMIN_PASSWORD = 8;

/**
 * Sign-in form. On a fresh install (no user yet) it creates the admin account instead.
 * `showServer` shows the server/port fields; `edition` is 'Standard' | 'Pro'.
 */
export class LoginController extends Controller {
  constructor({ model, appNavigator, showServer = true, edition = 'Standard' }) {
    super();
    this.model = model;
    this.appNavigator = appNavigator;
    this.showServer = showServer;
    this.edition = edition;
    this.state = {
      server: '192.168.1.10',
      port: '8000',
      user: '',
      pass: '',
      show: false,
      remember: true,
      loading: false,
      error: '',
      missing: [], // fields flagged after a submit attempt
      done: false,
      setup: false, // first run: create the admin account
    };
  }

  attach() {
    this.model.setupRequired().then(
      (setup) => this.setState({ setup }),
      () => {}, // server unreachable: stay on sign-in, submitting shows the error
    );
  }

  setField = (key, value) => this.setState({ [key]: value });
  toggleShow = () => this.setState((s) => ({ show: !s.show }));
  toggleRemember = () => this.setState((s) => ({ remember: !s.remember }));

  submit = async () => {
    const missing = this.model.missingFields(this.state, { requireServer: this.showServer });
    if (missing.length) return this.setState({ missing, error: 'Please fill in all required fields.' });
    const { setup } = this.state;
    if (setup && this.state.pass.length < MIN_ADMIN_PASSWORD) {
      return this.setState({
        missing: ['pass'],
        error: `Use at least ${MIN_ADMIN_PASSWORD} characters for the password.`,
      });
    }
    this.setState({ loading: true, error: '', missing: [] });
    try {
      await (setup ? this.model.createAdmin(this.state) : this.model.signIn(this.state));
      this.setState({ loading: false, done: true });
      this.appNavigator.toApp();
    } catch (err) {
      this.setState({ loading: false, error: err.message });
    }
  };

  present() {
    const { server, port, user, pass, show, remember, loading, error, missing, done, setup } = this.state;
    const field = (key) => withValue((v) => this.setField(key, v));
    const pro = this.edition === 'Pro';
    return {
      showServer: this.showServer,
      server,
      port,
      user,
      pass,
      setServer: field('server'),
      setPort: field('port'),
      setUser: field('user'),
      setPass: field('pass'),
      serverRing: ring(missing.includes('server')),
      userRing: ring(missing.includes('user')),
      passRing: ring(missing.includes('pass')),
      show,
      passType: show ? 'text' : 'password',
      showLabel: show ? 'Hide password' : 'Show password',
      toggleShow: this.toggleShow,
      remember,
      toggleRemember: this.toggleRemember,
      error,
      loading,
      submit: prevented(this.submit),
      title: setup ? 'Create the admin account for' : 'Sign in to',
      subtitle: setup ? 'First run: this account manages IVMS' : 'Video Management System',
      passPlaceholder: setup ? `At least ${MIN_ADMIN_PASSWORD} characters` : 'Password',
      submitLabel: loading ? 'Connecting…' : done ? 'Signed in' : setup ? 'Create account' : 'Sign In',
      editionLabel: pro ? 'Pro Edition' : 'Standard Edition',
      editionColor: pro ? '#3E6AE1' : '#5C5E62',
    };
  }
}
