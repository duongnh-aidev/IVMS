import { stopped } from '../../core/events';
import { Controller } from '../../core/mvc';
import { ICONS } from '../../shared/ui/icons';
import { lightOption } from '../../shared/ui/options';

const KIND_ICON = {
  alert: 'M12 3l10 18H2zM12 10v4M12 17.5v.5',
  device: ICONS.devices,
  storage: ICONS.storage,
  done: 'M5 12.5l4.5 4.5L19 7.5',
  report: ICONS.reports,
  update: 'M12 3v12M7 10l5 5 5-5M5 21h14',
};
const ACTION_LABEL = {
  devices: 'View device',
  storage: 'Open storage',
  playback: 'Open playback',
  dashboard: 'Open dashboard',
  settings: 'View update',
};
const DAYS = ['Today', 'Yesterday'];

export class NotificationsController extends Controller {
  constructor({ model, shell, settings }) {
    super();
    this.model = model;
    this.shell = shell;
    this.settings = settings;
    this.state = { filter: 'All' };
    this.observe(model.source);
  }

  setFilter = (filter) => this.setState({ filter });
  markRead = (id) => this.model.markRead(id);
  markAllRead = () => this.model.markAllRead();

  /** Opens the screen a notification points to ("Open storage", "View update", ...). */
  openTarget = (n) => {
    this.model.markRead(n.id);
    if (n.target === 'settings') this.settings.showSection('about');
    this.shell.show(n.target);
  };

  present() {
    const { filter } = this.state;
    const items = this.model.list().filter((n) => filter === 'All' || !this.model.isRead(n.id));
    const item = (n) => {
      const read = this.model.isRead(n.id);
      return {
        title: n.title,
        desc: n.desc,
        time: n.time,
        weight: read ? 500 : 600,
        icon: KIND_ICON[n.kind],
        iconColor: n.color,
        dot: read ? 'transparent' : '#3E6AE1',
        bg: read ? 'transparent' : '#F7F8FB',
        action: ACTION_LABEL[n.target],
        onClick: () => this.markRead(n.id),
        onAction: stopped(() => this.openTarget(n)),
      };
    };
    return {
      nUnread: this.model.unreadCount(),
      nFilters: ['All', 'Unread'].map((v) => lightOption(v, filter === v, () => this.setFilter(v))),
      nGroups: DAYS.map((day) => ({ label: day, items: items.filter((n) => n.day === day).map(item) })).filter(
        (g) => g.items.length,
      ),
      nEmpty: items.length === 0,
      nMarkAll: this.markAllRead,
    };
  }
}
