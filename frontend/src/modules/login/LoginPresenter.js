import { prevented, withValue } from '../../core/events';
import { Presenter } from '../../core/viper';

const ring = (bad) => (bad ? 'inset 0 0 0 1px #C62828' : 'inset 0 0 0 0 transparent');

/** Sign-in form. `showServer` shows the server/port fields; `edition` is 'Standard' | 'Pro'. */
export class LoginPresenter extends Presenter {
  constructor({ interactor, router, showServer = true, edition = 'Standard' }) {
    super();
    this.interactor = interactor;
    this.router = router;
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
    };
  }

  setField = (key, value) => this.setState({ [key]: value });
  toggleShow = () => this.setState((s) => ({ show: !s.show }));
  toggleRemember = () => this.setState((s) => ({ remember: !s.remember }));

  submit = async () => {
    const missing = this.interactor.missingFields(this.state, { requireServer: this.showServer });
    if (missing.length) return this.setState({ missing, error: 'Please fill in all required fields.' });
    this.setState({ loading: true, error: '', missing: [] });
    try {
      await this.interactor.signIn(this.state);
      this.setState({ loading: false, done: true });
      this.router.toApp();
    } catch (err) {
      this.setState({ loading: false, error: err.message });
    }
  };

  present() {
    const { server, port, user, pass, show, remember, loading, error, missing, done } = this.state;
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
      submitLabel: loading ? 'Connecting…' : done ? 'Signed in' : 'Sign In',
      editionLabel: pro ? 'Pro Edition' : 'Standard Edition',
      editionColor: pro ? '#3E6AE1' : '#5C5E62',
    };
  }
}
