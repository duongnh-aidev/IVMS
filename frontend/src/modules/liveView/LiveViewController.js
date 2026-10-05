import { stopped } from '../../core/events';
import { Controller } from '../../core/mvc';
import { lightOption } from '../../shared/ui/options';

export const GRID_SIZES = [1, 4, 9, 16, 25];

/** Live grid: layout, cameras pinned to the grid, device list. Public input: `pin(id)`. */
export class LiveViewController extends Controller {
  constructor({ model, shell, deviceEditor }) {
    super();
    this.model = model;
    this.shell = shell;
    this.deviceEditor = deviceEditor;
    this.state = { layout: 4, pinned: [], hover: null, selected: null };
    this.observe(model.source);
  }

  /** Pinned ids that still exist (deleted devices drop out). */
  pinned() {
    const ids = this.model.deviceIds();
    return this.state.pinned.filter((i) => ids.includes(i));
  }

  // ---- intents ----
  setLayout = (layout) => this.setState({ layout, pinned: this.pinned().slice(0, layout) });

  /** Adds a camera to the grid if there is a free tile. */
  pin = (id) => {
    const pinned = this.pinned();
    if (pinned.includes(id) || pinned.length >= this.state.layout) return;
    this.setState({ pinned: [...pinned, id] });
  };

  togglePin = (id) => {
    const pinned = this.pinned();
    if (pinned.includes(id)) this.setState({ pinned: pinned.filter((x) => x !== id) });
    else this.pin(id);
  };

  select = (id) => this.setState({ selected: id });
  hover = (id) => this.setState({ hover: id });
  unhover = (id) => this.setState((s) => (s.hover === id ? { hover: null } : null));

  // ---- view model ----
  present() {
    const { layout: n, hover, selected } = this.state;
    const ids = this.model.deviceIds();
    const pinned = this.pinned();
    const full = pinned.length >= n;
    const device = (i) => {
      const isPinned = pinned.includes(i);
      return {
        name: this.model.nameOf(i),
        bg: selected === i ? '#E4E5E8' : hover === i ? '#EBECEE' : 'transparent',
        showPin: isPinned || hover === i,
        pinTitle: isPinned ? 'Unpin' : full ? 'Grid is full' : 'Pin to grid',
        pinBg: isPinned ? '#FFFFFF' : 'transparent',
        pinColor: isPinned ? '#3E6AE1' : full ? '#D0D1D2' : '#5C5E62',
        pinFill: isPinned ? 'currentColor' : 'none',
        onPin: stopped(() => this.togglePin(i)),
        onSelect: () => this.select(i),
        onEnter: () => this.hover(i),
        onLeave: () => this.unhover(i),
      };
    };
    return {
      layouts: GRID_SIZES.map((v) => ({
        n: v,
        ...lightOption(String(v), v === n, () => this.setLayout(v)),
        title: v + ' cameras',
      })),
      isEmpty: ids.length === 0,
      hasDevices: ids.length > 0,
      gridCols: `repeat(${Math.sqrt(n)}, minmax(0,1fr))`,
      tiles: Array.from({ length: n }, (_, k) =>
        k < pinned.length
          ? {
              cam: true,
              empty: false,
              name: this.model.nameOf(pinned[k]),
              id: this.model.codeOf(pinned[k]),
              bg: '#171A20',
            }
          : { cam: false, empty: true, bg: '#F4F4F4' },
      ),
      pinnedList: pinned.map(device),
      deviceList: ids.map(device),
      deviceCount: ids.length,
      noPinned: pinned.length === 0,
      pinnedCount: pinned.length + '/' + n,
      pinnedCountColor: full ? '#3E6AE1' : '#5C5E62',
      goPlayback: () => this.shell.show('playback'),
      openAdd: () => this.deviceEditor.open(),
    };
  }
}
