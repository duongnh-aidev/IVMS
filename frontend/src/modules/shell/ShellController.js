import { Controller } from '../../core/mvc';
import { isAvailable } from '../../core/plugins';
import { ICONS } from '../../shared/ui/icons';

/** Screen key -> [label, icon]. Order within each group is the sidebar order. */
export const SCREENS = {
  dashboard: ['Dashboard', ICONS.dashboard],
  live: ['Live View', ICONS.live],
  playback: ['Playback', ICONS.playback],
  devices: ['Devices', ICONS.devices],
  recording: ['Recording', ICONS.schedule],
  storage: ['Storage', ICONS.storage],
  users: ['Users', ICONS.users],
  notifications: ['Notifications', ICONS.bell],
  settings: ['Settings', ICONS.settings],
  help: ['Help', ICONS.help],
};

const NAV = {
  main: ['dashboard', 'live', 'playback'],
  setup: ['devices', 'recording', 'storage', 'users'],
  bottom: ['notifications', 'settings', 'help'],
};

/**
 * Main window: which screen is active, sidebar state and the toast.
 * Its public `show(screen)` is how other modules' controllers switch screens.
 * Plugin screens ({ key, label, icon, group, requires }) join the end of their sidebar group while
 * their feature is enabled in `systemInfo`.
 */
export class ShellController extends Controller {
  constructor({ model, auth, toast, initialScreen = 'live', pluginScreens = [], systemInfo }) {
    super();
    this.model = model;
    this.auth = auth;
    this.toast = toast;
    this.pluginScreens = pluginScreens;
    this.systemInfo = systemInfo;
    this.state = { active: initialScreen, collapsed: false, logoHover: false };
    this.observe(model.source, toast, ...(systemInfo ? [systemInfo] : []));
  }

  /** [label, icon] of the screens that can be shown now. */
  available() {
    const features = this.systemInfo?.features() ?? new Set();
    const plugin = this.pluginScreens.filter((s) => isAvailable(s, features)).map((s) => [s.key, [s.label, s.icon]]);
    return { ...SCREENS, ...Object.fromEntries(plugin) };
  }

  navKeys(group, screens) {
    return [...NAV[group], ...this.pluginScreens.filter((s) => s.group === group && screens[s.key]).map((s) => s.key)];
  }

  // ---- intents ----
  show = (screen) => this.setState({ active: screen });
  toggleSidebar = () => this.setState((s) => ({ collapsed: !s.collapsed, logoHover: false }));
  setLogoHover = (logoHover) => this.setState({ logoHover });
  signOut = () => this.auth.signOut();

  // ---- view model ----
  present() {
    const { collapsed, logoHover } = this.state;
    const screens = this.available();
    // A plugin screen whose feature was turned off (or an unknown key) falls back to Live View
    const active = screens[this.state.active] ? this.state.active : 'live';
    const expanded = !collapsed;
    const unread = this.model.unreadCount();
    const item = (key, extra = {}) => {
      const on = active === key;
      return {
        key,
        label: screens[key][0],
        d: screens[key][1],
        bg: on ? '#E4E5E8' : 'transparent',
        color: on ? '#171A20' : '#393C41',
        weight: on ? 600 : 400,
        onClick: () => this.show(key),
        showBadge: false,
        showDot: false,
        ...extra,
      };
    };
    const t = this.toast.current;
    return {
      active,
      sidebar: {
        expanded,
        collapsed,
        sideW: expanded ? '196px' : '92px',
        navJustify: expanded ? 'flex-start' : 'center',
        toggleSide: this.toggleSidebar,
        logoIn: () => this.setLogoHover(true),
        logoOut: () => this.setLogoHover(false),
        logoHover,
        showMiniLogo: !logoHover,
        logoBg: logoHover ? '#E6E7E9' : 'transparent',
        mainNav: this.navKeys('main', screens).map((k) => item(k)),
        setupNav: this.navKeys('setup', screens).map((k) => item(k)),
        bottomNav: this.navKeys('bottom', screens).map((k) =>
          k === 'notifications'
            ? item(k, {
                showBadge: expanded && unread > 0,
                showDot: !expanded && unread > 0,
                badge: unread > 99 ? '99+' : String(unread),
              })
            : item(k),
        ),
        signOut: this.signOut,
      },
      toast: t && {
        toastOk: t.kind === 'ok',
        toastErr: t.kind === 'err',
        toastMsg: t.msg,
        toastBg: t.kind === 'err' ? '#D93025' : '#2E8540',
        closeToast: () => this.toast.close(),
      },
    };
  }
}
