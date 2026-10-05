import { withValue } from '../../core/events';
import { Controller } from '../../core/mvc';

const STATUS_STYLE = {
  Online: ['#E8F5EC', '#1E7A3C', '#2EA44F'],
  Offline: ['#F4F4F4', '#5C5E62', '#8E8E8E'],
  Error: ['#FCEDED', '#C62828', '#E5484D'],
};
const TABS = [
  ['all', 'All'],
  ['Online', 'Online'],
  ['Offline', 'Offline'],
  ['Error', 'Error'],
];
const GROUP_ICON = {
  all: 'M3 7h12v10H3zM15 10.5l6-3.5v10l-6-3.5',
  leaf: 'M4 6h16M4 12h16M4 18h16',
  folder: 'M3 5h6l2 2h10v12H3z',
};
// The table hides firmware/model/account below this width.
const WIDE_TABLE = 600;

/** Device table with status tabs, group tree, search, row menu and delete confirmation. */
export class DevicesController extends Controller {
  constructor({ model, toast, shell, liveView, deviceEditor }) {
    super();
    this.model = model;
    this.shell = shell;
    this.liveView = liveView;
    this.deviceEditor = deviceEditor;
    this.toast = toast;
    this.state = { tab: 'all', group: 'all', query: '', menuFor: null, confirmDelete: null, tableWidth: 900 };
    this.observe(model.source);
  }

  // ---- intents ----
  search = (query) => this.setState({ query });
  selectTab = (tab) => this.setState({ tab });
  selectGroup = (group) => this.setState({ group });
  toggleMenu = (id) => this.setState((s) => ({ menuFor: s.menuFor === id ? null : id }));
  closeMenu = () => this.setState({ menuFor: null });
  setTableWidth = (w) => Math.abs(w - this.state.tableWidth) > 4 && this.setState({ tableWidth: w });

  openInLiveView = (id) => {
    this.closeMenu();
    // Pins the device to the grid (if there is room), then shows Live View
    this.liveView.pin(id);
    this.shell.show('live');
  };

  edit = (id) => {
    this.closeMenu();
    this.deviceEditor.open(id);
  };

  askDelete = (id) => this.setState({ menuFor: null, confirmDelete: id });
  cancelDelete = () => this.setState({ confirmDelete: null });

  confirmDelete = async () => {
    const id = this.state.confirmDelete;
    const name = this.model.nameOf(id);
    this.setState({ confirmDelete: null });
    try {
      await this.model.remove(id);
      this.toast.error('Deleted ' + name);
    } catch (err) {
      this.toast.error("Couldn't delete " + name + ': ' + err.message);
    }
  };

  // ---- view model ----
  present() {
    const { tab, group, query, menuFor, confirmDelete, tableWidth } = this.state;
    const all = this.model.list();
    const inGrp = this.model.inGroup(group);
    const count = (k) => all.filter((d) => inGrp(d) && (k === 'all' || d.status === k)).length;
    const q = query.trim().toLowerCase();
    const rows = all.filter(
      (d) =>
        inGrp(d) && (tab === 'all' || d.status === tab) && (!q || d.name.toLowerCase().includes(q) || d.ip.includes(q)),
    );
    const wide = tableWidth >= WIDE_TABLE;
    return {
      q: query,
      setQ: withValue(this.search),
      openAdd: () => this.deviceEditor.open(),
      devTabs: TABS.map(([k, label]) => {
        const on = tab === k;
        return {
          label,
          count: count(k),
          weight: on ? 600 : 400,
          color: on ? '#171A20' : '#5C5E62',
          line: on ? 'inset 0 -2px 0 #171A20' : 'none',
          onClick: () => this.selectTab(k),
        };
      }),
      grpList: this.model.groups().map(({ id, label, depth, leaf }) => ({
        label,
        pad: 10 + depth * 14 + 'px',
        count: this.model.countInGroup(id),
        icon: id === 'all' ? GROUP_ICON.all : leaf ? GROUP_ICON.leaf : GROUP_ICON.folder,
        iconColor: group === id ? '#3E6AE1' : '#5C5E62',
        bg: group === id ? '#E4E5E8' : 'transparent',
        weight: group === id ? 600 : 400,
        onClick: () => this.selectGroup(id),
      })),
      devRows: rows.map((d) => {
        const [sBg, sColor, sDot] = STATUS_STYLE[d.status];
        return {
          ...d,
          sBg,
          sColor,
          sDot,
          menuOpen: menuFor === d.i,
          menuBtnBg: menuFor === d.i ? '#EEEEEE' : 'transparent',
          onMenu: () => this.toggleMenu(d.i),
          onLive: () => this.openInLiveView(d.i),
          onEdit: () => this.edit(d.i),
          onDelete: () => this.askDelete(d.i),
        };
      }),
      devWide: wide,
      devCols: wide
        ? 'minmax(110px,2fr) 92px minmax(120px,1.3fr) minmax(56px,.8fr) minmax(0,1fr) minmax(0,.8fr) 32px'
        : 'minmax(0,2fr) 92px minmax(0,1.4fr) 32px',
      noRows: rows.length === 0,
      menuAny: menuFor !== null,
      closeMenu: this.closeMenu,
      confirm: confirmDelete != null && {
        delName: this.model.nameOf(confirmDelete),
        cancelDel: this.cancelDelete,
        doDelete: this.confirmDelete,
      },
    };
  }
}
