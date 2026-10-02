import { Presenter } from '../../core/viper';
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

/**
 * Main window: which screen is active, sidebar state and the toast.
 * Its public `show(screen)` is how other modules' routers switch screens.
 */
export class ShellPresenter extends Presenter {
  constructor({ interactor, router, toast, initialScreen = 'live' }) {
    super();
    this.interactor = interactor;
    this.router = router;
    this.toast = toast;
    this.state = { active: SCREENS[initialScreen] ? initialScreen : 'live', collapsed: false, logoHover: false };
    this.observe(interactor.source, toast);
  }

  // ---- intents ----
  show = (screen) => this.setState({ active: screen });
  toggleSidebar = () => this.setState((s) => ({ collapsed: !s.collapsed, logoHover: false }));
  setLogoHover = (logoHover) => this.setState({ logoHover });
  signOut = () => this.router.signOut();

  // ---- view model ----
  present() {
    const { active, collapsed, logoHover } = this.state;
    const expanded = !collapsed;
    const unread = this.interactor.unreadCount();
    const item = (key, extra = {}) => {
      const on = active === key;
      return {
        key,
        label: SCREENS[key][0],
        d: SCREENS[key][1],
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
        mainNav: ['dashboard', 'live', 'playback'].map((k) => item(k)),
        setupNav: ['devices', 'recording', 'storage', 'users'].map((k) => item(k)),
        bottomNav: [
          item('notifications', {
            showBadge: expanded && unread > 0,
            showDot: !expanded && unread > 0,
            badge: unread > 99 ? '99+' : String(unread),
          }),
          item('settings'),
          item('help'),
        ],
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
