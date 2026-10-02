import { stopped } from '../../core/events';
import { Presenter } from '../../core/viper';
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

export class NotificationsPresenter extends Presenter {
  constructor({ interactor, router }) {
    super();
    this.interactor = interactor;
    this.router = router;
    this.state = { filter: 'All' };
    this.observe(interactor.source);
  }

  setFilter = (filter) => this.setState({ filter });
  markRead = (id) => this.interactor.markRead(id);
  markAllRead = () => this.interactor.markAllRead();

  openTarget = (n) => {
    this.interactor.markRead(n.id);
    this.router.toTarget(n.target);
  };

  present() {
    const { filter } = this.state;
    const items = this.interactor.list().filter((n) => filter === 'All' || !this.interactor.isRead(n.id));
    const item = (n) => {
      const read = this.interactor.isRead(n.id);
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
      nUnread: this.interactor.unreadCount(),
      nFilters: ['All', 'Unread'].map((v) => lightOption(v, filter === v, () => this.setFilter(v))),
      nGroups: DAYS.map((day) => ({ label: day, items: items.filter((n) => n.day === day).map(item) })).filter(
        (g) => g.items.length,
      ),
      nEmpty: items.length === 0,
      nMarkAll: this.markAllRead,
    };
  }
}
