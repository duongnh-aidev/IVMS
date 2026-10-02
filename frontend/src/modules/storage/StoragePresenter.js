import { prevented, withValue } from '../../core/events';
import { Presenter } from '../../core/viper';
import { darkOption, lightOption } from '../../shared/ui/options';

const STATUS_STYLE = { Healthy: ['#E8F5EC', '#1E7A3C', '#2EA44F'], 'Almost full': ['#FFF4E0', '#8A5A00', '#E0A100'] };
const EMPTY_FORM = { type: 'Local', role: 'Recording', name: '', path: '', user: '', pass: '', tried: false };

/** Storage overview, retention policy and the "Add storage" modal. */
export class StoragePresenter extends Presenter {
  constructor({ interactor, toast }) {
    super();
    this.interactor = interactor;
    this.toast = toast;
    this.state = { formOpen: false, form: EMPTY_FORM };
    this.observe(interactor);
  }

  // ---- intents ----
  setPolicy = (key, value) => this.interactor.setPolicy({ [key]: value });
  resetPolicy = () => this.interactor.resetPolicy();
  savePolicy = () => this.toast.ok('Storage settings saved');
  openForm = () => this.setState({ formOpen: true, form: EMPTY_FORM });
  closeForm = () => this.setState({ formOpen: false });
  setField = (key, value) => this.setState((s) => ({ form: { ...s.form, [key]: value } }));

  submitForm = () => {
    const f = this.state.form;
    if (!f.name || !f.path) return this.setField('tried', true);
    const disk = this.interactor.addLocation({
      name: f.name,
      path: f.path,
      network: f.type === 'Network',
      role: f.role,
    });
    this.setState({ formOpen: false });
    this.toast.ok('Added ' + disk.name);
  };

  // ---- view model ----
  presentForm() {
    const f = this.state.form;
    const net = f.type === 'Network';
    const field = (key) => withValue((v) => this.setField(key, v));
    const choice = (key, v) => lightOption(v, f[key] === v, () => this.setField(key, v));
    return {
      asName: f.name,
      asPath: f.path,
      asUser: f.user,
      asPass: f.pass,
      asNameBorder: f.tried && !f.name ? '#C62828' : '#D0D1D2',
      asPathBorder: f.tried && !f.path ? '#C62828' : '#D0D1D2',
      asUserBorder: '#D0D1D2',
      setAsName: field('name'),
      setAsPath: field('path'),
      setAsUser: field('user'),
      setAsPass: field('pass'),
      asTypes: ['Local', 'Network'].map((v) => choice('type', v)),
      asRoles: ['Recording', 'Backup'].map((v) => choice('role', v)),
      asIsNet: net,
      asPathLabel: net ? 'Network path' : 'Folder path',
      asPathPh: net ? 'smb://10.0.0.20/share' : '/Volumes/IVMS-03',
      asError: f.tried && (!f.name || !f.path) ? 'Enter a name and a path.' : '',
      closeAddStorage: this.closeForm,
      submitStorage: prevented(this.submitForm),
    };
  }

  present() {
    const i = this.interactor;
    const disks = i.disks();
    const { total, used } = i.capacity();
    const policy = i.policy();
    const options = (key, values) => values.map((v) => darkOption(v, policy[key] === v, () => this.setPolicy(key, v)));
    return {
      stUsed: used.toFixed(1) + ' TB',
      stTotal: total + ' TB',
      stDays: i.daysAvailable(),
      stSegs: disks.map((d) => ({
        w: ((d.used / total) * 100).toFixed(1) + '%',
        bg: d.color,
        label: d.name + ' · ' + d.used + ' TB',
      })),
      disks2: disks.map((d) => {
        const pc = Math.round((d.used / d.cap) * 100);
        const [sBg, sColor, sDot] = STATUS_STYLE[d.status];
        return {
          ...d,
          pct: pc + '%',
          usage: d.used + ' / ' + d.cap + ' TB · ' + pc + '%',
          bar: pc > 80 ? '#E0A100' : '#171A20',
          sBg,
          sColor,
          sDot,
        };
      }),
      retOpts: options('ret', ['7 days', '14 days', '30 days', '90 days']),
      fullOpts: options('full', ['Overwrite oldest', 'Stop recording']),
      resetPolicy: this.resetPolicy,
      savePolicy: this.savePolicy,
      openAddStorage: this.openForm,
      addForm: this.state.formOpen && this.presentForm(),
    };
  }
}
