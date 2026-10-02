import { prevented, withValue } from '../../core/events';
import { Presenter } from '../../core/viper';
import { darkOption } from '../../shared/ui/options';
import { pad2 } from '../../shared/utils/time';
import { BUFFER_OPTIONS, MODES, TEMPLATES } from './RecordingInteractor';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Weekly schedule editor: pick a mode, then click or drag over hours to paint it. */
export class RecordingPresenter extends Presenter {
  painting = false;

  constructor({ interactor, toast }) {
    super();
    this.interactor = interactor;
    this.toast = toast;
    // `template` is highlighted until the grid is edited by hand.
    this.state = { mode: 'C', template: 'Business hours' };
    this.observe(interactor);
  }

  // ---- intents ----
  setTarget = (target) => this.interactor.setTarget(target);
  setMode = (mode) => this.setState({ mode });

  applyTemplate = (name) => {
    this.interactor.applyTemplate(name);
    this.setState({ template: name });
  };

  paint = (day, hour) => {
    if (this.interactor.setSlot(day, hour, this.state.mode)) this.setState({ template: null });
  };

  startPaint = (day, hour) => {
    this.painting = true;
    this.paint(day, hour);
  };

  continuePaint = (day, hour) => this.painting && this.paint(day, hour);
  endPaint = () => (this.painting = false);
  setBuffer = (key, value) => this.interactor.setBuffer(key, value);
  addHoliday = () => this.toast.ok('Pick a date to add an exception');
  save = () => this.toast.ok('Recording schedule saved');

  // ---- view model ----
  present() {
    const { mode, template } = this.state;
    const i = this.interactor;
    const buffers = i.buffers();
    const buffer = (key) =>
      BUFFER_OPTIONS[key].map((v) => darkOption(v, buffers[key] === v, () => this.setBuffer(key, v)));
    return {
      recTarget: i.target(),
      setRecTarget: withValue(this.setTarget),
      recModes: Object.entries(MODES).map(([k, [label, swatch]]) =>
        darkOption(label, mode === k, () => this.setMode(k), 'transparent', { swatch }),
      ),
      recTemplates: Object.keys(TEMPLATES).map((n) =>
        darkOption(n, template === n, () => this.applyTemplate(n), '#FFFFFF', {
          hoverBg: template === n ? '#171A20' : '#EEEEEE',
        }),
      ),
      recHours: Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? pad2(h) : '')),
      recRows: i.schedule().map((row, d) => ({
        day: DAYS[d],
        cells: row.map((v, hr) => ({
          bg: MODES[v][1],
          title: DAYS[d] + ' ' + pad2(hr) + ':00 · ' + MODES[v][0],
          down: prevented(() => this.startPaint(d, hr)),
          enter: () => this.continuePaint(d, hr),
        })),
      })),
      recSummary: Object.entries(MODES).map(([k, [label, swatch]]) => ({
        label,
        swatch,
        hours: i.hoursPerWeek(k) + ' h/week',
      })),
      recBuffers: [
        { label: 'Pre-event buffer', desc: 'Footage kept before an event starts.', opts: buffer('pre') },
        { label: 'Post-event buffer', desc: 'Keeps recording after the event ends.', opts: buffer('post') },
        { label: 'Recorded stream', desc: 'Sub stream saves space, lower resolution.', opts: buffer('stream') },
      ],
      holidays: i.holidays(),
      addHoliday: this.addHoliday,
      saveSched: this.save,
    };
  }
}
