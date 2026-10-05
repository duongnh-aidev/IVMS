import { withValue } from '../../core/events';
import { Controller } from '../../core/mvc';
import { darkOption, lightOption } from '../../shared/ui/options';
import { formatClock, pad2, parseClock } from '../../shared/utils/time';
import { EVENT_FILTERS } from './PlaybackModel';

const DAY_END = 86399;
const ZOOM_SPAN = { '24h': 86400, '6h': 21600, '1h': 3600 };
const TICK_STEPS = [300, 600, 900, 1800, 3600, 7200, 10800, 14400, 21600, 43200];
const MIN_TICK_SPACING = 56; // px
const TICK_MS = 200;

const isoDate = (y, m, d) => y + '-' + pad2(m) + '-' + pad2(d);
const isoOf = (date) => isoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());

/** Timeline playback of one camera's day: transport, zoomable timeline, calendar, events, bookmarks, export. */
export class PlaybackController extends Controller {
  #timer = null;

  constructor({ model, toast }) {
    super();
    this.model = model;
    this.toast = toast;
    this.state = {
      t: 52330, // playhead, seconds within the day
      speed: 1,
      direction: 1,
      playing: false,
      date: model.today(),
      focus: null, // selected camera (defaults to the first)
      calendarOpen: false,
      calendarMonth: null,
      tab: 'cams',
      eventFilter: 'All',
      zoom: '24h',
      hover: null, // timeline hover position, 0..1
      timelineWidth: 600,
      exportForm: null,
    };
    this.observe(...model.sources);
  }

  attach() {
    this.#timer = setInterval(this.#tick, TICK_MS);
  }

  detach() {
    clearInterval(this.#timer);
  }

  #tick = () => {
    const { playing, t, direction, speed } = this.state;
    if (!playing) return;
    const next = t + direction * speed * (TICK_MS / 1000);
    if (next <= 0 || next >= DAY_END) this.setState({ playing: false, t: Math.min(DAY_END, Math.max(0, next)) });
    else this.setState({ t: next });
  };

  focusedCamera() {
    const ids = this.model.cameraIds();
    return ids.includes(this.state.focus) ? this.state.focus : ids[0];
  }

  /** Visible timeline window: [startSeconds, spanSeconds], centred on the playhead. */
  window() {
    const span = ZOOM_SPAN[this.state.zoom];
    return [Math.min(Math.max(0, this.state.t - span / 2), 86400 - span), span];
  }

  // ---- intents: transport ----
  togglePlay = () => this.setState((s) => ({ playing: !s.playing }));
  playReverse = () => this.setState({ direction: -1, playing: true });
  stepBack = () => this.setState((s) => ({ playing: false, t: Math.max(0, s.t - 1) }));
  stepForward = () => this.setState((s) => ({ playing: false, t: Math.min(DAY_END, s.t + 1) }));
  setSpeed = (speed) => this.setState({ speed: +speed, direction: 1 });
  seek = (t) => this.setState({ t });

  // ---- intents: timeline (positions are fractions 0..1 of the visible window) ----
  seekToFraction = (f) => {
    const [ws, span] = this.window();
    this.seek(Math.min(DAY_END, ws + f * span));
  };

  hoverAt = (f) => this.setState({ hover: f });
  setZoom = (zoom) => this.setState({ zoom });
  setTimelineWidth = (w) => Math.abs(w - this.state.timelineWidth) > 4 && this.setState({ timelineWidth: w });

  // ---- intents: day / calendar ----
  setDate = (date) => this.setState({ date, calendarOpen: false });

  shiftDay = (n) => {
    const d = new Date(this.state.date + 'T00:00:00');
    d.setDate(d.getDate() + n);
    const iso = isoOf(d);
    this.setState({ date: iso > this.model.today() ? this.model.today() : iso });
  };

  toggleCalendar = () => this.setState((s) => ({ calendarOpen: !s.calendarOpen, calendarMonth: s.date.slice(0, 7) }));

  shiftCalendarMonth = (n) => {
    const [y, m] = (this.state.calendarMonth || this.state.date.slice(0, 7)).split('-').map(Number);
    const d = new Date(y, m - 1 + n, 1);
    this.setState({ calendarMonth: d.getFullYear() + '-' + pad2(d.getMonth() + 1) });
  };

  // ---- intents: side panel ----
  setTab = (tab) => this.setState({ tab });
  setEventFilter = (eventFilter) => this.setState({ eventFilter });
  focusCamera = (id) => this.setState({ focus: id });

  addBookmark = () => {
    const cam = this.focusedCamera();
    if (cam == null) return;
    this.model.addBookmark(this.state.t, [cam]);
    this.toast.ok('Bookmark added at ' + formatClock(this.state.t));
  };

  // ---- intents: export ----
  openExport = () =>
    this.setState((s) => ({
      playing: false,
      exportForm: {
        from: formatClock(Math.max(0, s.t - 30)),
        to: formatClock(Math.min(DAY_END, s.t + 30)),
        format: 'MP4',
        watermark: true,
        tried: false,
      },
    }));

  closeExport = () => this.setState({ exportForm: null });
  setExportField = (key, value) => this.setState((s) => ({ exportForm: { ...s.exportForm, [key]: value } }));

  submitExport = () => {
    const f = this.state.exportForm;
    const cam = this.focusedCamera();
    const from = parseClock(f.from);
    const to = parseClock(f.to);
    if (from == null || to == null || to <= from || cam == null) return this.setExportField('tried', true);
    this.setState({ exportForm: null });
    this.toast.ok(this.model.exportClip({ cameraId: cam, from, to, format: f.format }));
  };

  // ---- view model ----
  presentCalendar() {
    const { date, calendarOpen, calendarMonth } = this.state;
    const today = this.model.today();
    const [cy, cm] = (calendarMonth || date.slice(0, 7)).split('-').map(Number);
    const first = new Date(cy, cm - 1, 1);
    const nDays = new Date(cy, cm, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // weeks start on Monday
    const blank = {
      label: '',
      vis: 'hidden',
      disabled: true,
      bg: 'transparent',
      hoverBg: 'transparent',
      ring: 'none',
      color: '#171A20',
      weight: 400,
      cursor: 'default',
      dot: 'transparent',
      onClick: null,
    };
    return {
      calOpen: calendarOpen,
      calBtnBg: calendarOpen ? '#F4F4F4' : '#FFFFFF',
      toggleCal: this.toggleCalendar,
      calTitle: first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      calPrev: () => this.shiftCalendarMonth(-1),
      calNext: () => this.shiftCalendarMonth(1),
      calToday: () => this.setDate(today),
      calDays: [
        ...Array.from({ length: lead }, () => blank),
        ...Array.from({ length: nDays }, (_, k) => {
          const d = isoDate(cy, cm, k + 1);
          const sel = d === date;
          const future = d > today;
          const isToday = d === today;
          return {
            label: k + 1,
            vis: 'visible',
            disabled: future,
            bg: sel ? '#3E6AE1' : 'transparent',
            hoverBg: sel ? '#3E6AE1' : future ? 'transparent' : '#F4F4F4',
            ring: isToday && !sel ? 'inset 0 0 0 1px #3E6AE1' : 'none',
            color: sel ? '#FFFFFF' : future ? '#D0D1D2' : '#171A20',
            weight: sel || isToday ? 600 : 400,
            cursor: future ? 'default' : 'pointer',
            dot: this.model.hasFootage(d) ? (sel ? '#FFFFFF' : '#3E6AE1') : 'transparent',
            onClick: () => !future && this.setDate(d),
          };
        }),
      ],
    };
  }

  presentExport(focus, dateLabel) {
    const f = this.state.exportForm;
    const from = parseClock(f.from);
    const to = parseClock(f.to);
    const rangeOk = from != null && to != null && to > from;
    return {
      exFrom: f.from,
      exTo: f.to,
      setExFrom: withValue((v) => this.setExportField('from', v)),
      setExTo: withValue((v) => this.setExportField('to', v)),
      exFormats: ['MP4', 'Original + player'].map((v) =>
        lightOption(v, f.format === v, () => this.setExportField('format', v), { title: v }),
      ),
      exWm: f.watermark,
      toggleExWm: () => this.setExportField('watermark', !f.watermark),
      exCamsLabel: focus != null ? this.model.nameOf(focus) : 'No camera',
      exDuration: rangeOk ? 'Duration ' + formatClock(to - from) : '',
      exError:
        f.tried && !rangeOk
          ? 'Enter a valid range (HH:MM:SS), with "To" after "From".'
          : f.tried && focus == null
            ? 'Select at least one camera.'
            : '',
      pbDateLabel: dateLabel,
      closeExport: this.closeExport,
      doExport: this.submitExport,
    };
  }

  present() {
    const i = this.model;
    const { t, speed, direction, playing, date, tab, eventFilter, hover, zoom, timelineWidth } = this.state;
    const ids = i.cameraIds();
    const focus = this.focusedCamera();
    const selected = focus != null ? [focus] : [];
    const today = i.today();
    const [ws, span] = this.window();
    const pct = (v) => (((v - ws) / span) * 100).toFixed(3) + '%';
    const inView = (v) => v >= ws && v <= ws + span;
    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Time ruler: the finest step that keeps labels at least MIN_TICK_SPACING px apart.
    const maxLabels = Math.max(2, Math.floor(timelineWidth / MIN_TICK_SPACING));
    const tickStep = TICK_STEPS.find((v) => span / v + 1 <= maxLabels) || 43200;
    const ticks = [];
    for (let v = Math.ceil(ws / tickStep) * tickStep; v <= ws + span; v += tickStep) {
      ticks.push({ left: pct(v), label: formatClock(v).slice(0, 5) });
    }

    const events = selected
      .flatMap((cam) => i.events(cam).map((e) => ({ ...e, cam })))
      .filter(EVENT_FILTERS[eventFilter])
      .sort((a, b) => b.t - a.t);
    const marks = i.bookmarks();
    const hoverT = hover != null ? ws + hover * span : 0;
    const recordedNow = focus != null && i.isRecorded(focus, t);
    const tabOption = (k, label) => lightOption(label, tab === k, () => this.setTab(k), { title: label });

    return {
      // header
      pbDateLabel: dateLabel,
      pbPrevDay: () => this.shiftDay(-1),
      pbNextDay: () => this.shiftDay(1),
      pbIsToday: date >= today,
      nextDayColor: date >= today ? '#D0D1D2' : '#393C41',
      addBookmark: this.addBookmark,
      openExport: this.openExport,
      ...this.presentCalendar(),

      // side panel
      pbTabs: [tabOption('cams', 'Cameras'), tabOption('events', 'Events'), tabOption('marks', 'Marks')],
      pbTabCams: tab === 'cams',
      pbTabEvents: tab === 'events',
      pbTabMarks: tab === 'marks',
      pbSelInfo: 'Choose a camera to play back',
      pbCamList: ids.map((id) => {
        const on = id === focus;
        return {
          name: i.nameOf(id),
          on,
          boxBg: '#FFFFFF',
          boxBorder: on ? '#3E6AE1' : '#C4C6C9',
          color: '#171A20',
          rowBg: on ? '#E4E5E8' : 'transparent',
          weight: on ? 600 : 400,
          onClick: () => this.focusCamera(id),
        };
      }),
      pbEvFilters: Object.keys(EVENT_FILTERS).map((l) =>
        darkOption(l, eventFilter === l, () => this.setEventFilter(l), '#FFFFFF'),
      ),
      pbEvList: events.slice(0, 40).map((e) => ({
        type: e.type,
        dot: e.color,
        time: formatClock(e.t),
        cam: i.nameOf(e.cam),
        bg: Math.abs(e.t - t) < 6 ? '#E4E5E8' : 'transparent',
        onClick: () => this.seek(Math.max(0, e.t - 5)), // start a few seconds before the event
      })),
      pbNoEvents: events.length === 0,
      pbMarkList: marks
        .slice()
        .reverse()
        .map((m) => ({
          note: m.note,
          time: formatClock(m.t),
          cams: m.cams.map((c) => i.nameOf(c)).join(', '),
          onClick: () => this.seek(m.t),
        })),
      pbNoMarks: marks.length === 0,

      // player
      pvName: focus != null ? i.nameOf(focus) : 'No camera selected',
      pvCenter:
        focus == null ? 'Select a camera to play back' : recordedNow ? 'recorded footage' : 'No recording at this time',
      pvCenterColor: recordedNow ? '#5C5E62' : '#D0D1D2',
      pvState: playing ? (direction < 0 ? 'Reverse ' : 'Playing ') + speed + '×' : 'Paused',

      // transport
      pbToggle: this.togglePlay,
      pbPlayTitle: playing ? 'Pause' : 'Play',
      pbPlayD: playing ? 'M7 5h3v14H7zM14 5h3v14h-3z' : 'M8 5v14l11-7z',
      pbReverse: this.playReverse,
      pbStepBack: this.stepBack,
      pbStepFwd: this.stepForward,
      pbTimeLabel: formatClock(t),
      pbSpeedVal: String(speed),
      setPbSpeed: withValue(this.setSpeed),
      pbZooms: Object.keys(ZOOM_SPAN).map((z) =>
        lightOption(z, zoom === z, () => this.setZoom(z), { title: 'Zoom ' + z }),
      ),

      // timeline
      pbTicks: ticks,
      pbRows: selected.map((cam) => {
        const f = cam === focus;
        return {
          name: i.nameOf(cam),
          onFocus: () => this.focusCamera(cam),
          labelBg: f ? '#EEF2FD' : 'transparent',
          weight: f ? 600 : 400,
          color: f ? '#171A20' : '#393C41',
          dot: f ? '#3E6AE1' : 'transparent',
          trackBg: f ? '#EEF2FD' : '#F4F4F4',
          segs: i
            .segments(cam)
            .filter(([a, b]) => b > ws && a < ws + span)
            .map(([a, b]) => ({
              left: pct(Math.max(a, ws)),
              width: (((Math.min(b, ws + span) - Math.max(a, ws)) / span) * 100).toFixed(3) + '%',
            })),
          evts: i
            .events(cam)
            .filter((e) => inView(e.t))
            .map((e) => ({ left: pct(e.t), color: e.color, title: e.type + ' · ' + formatClock(e.t) })),
        };
      }),
      pbMarkFlags: marks
        .filter((m) => inView(m.t))
        .map((m) => ({ left: pct(m.t), note: m.note + ' · ' + formatClock(m.t) })),
      pbHeadLeft: pct(t),
      pbHoverOn: hover != null,
      pbHoverLeft: (hover * 100).toFixed(2) + '%',
      pbHoverShift: hover < 0.15 ? '0%' : hover > 0.85 ? '-100%' : '-50%',
      pbHoverTime: formatClock(hoverT),
      pbHoverCam: focus != null ? i.nameOf(focus) : '—',
      pbHoverThumb: focus != null && i.isRecorded(focus, hoverT) ? 'thumbnail' : 'no recording',

      exportForm: this.state.exportForm && this.presentExport(focus, dateLabel),
    };
  }
}
