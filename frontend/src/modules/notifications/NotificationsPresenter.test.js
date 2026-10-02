import { describe, expect, it, vi } from 'vitest';
import { NotificationService } from '../../shared/services/notificationService';
import { NotificationsInteractor } from './NotificationsInteractor';
import { NotificationsPresenter } from './NotificationsPresenter';
import { NotificationsRouter } from './NotificationsRouter';

describe('NotificationsPresenter', () => {
  it('marks read, filters unread and opens the target screen', () => {
    const shell = { show: vi.fn() };
    const settings = { showSection: vi.fn() };
    const presenter = new NotificationsPresenter({
      interactor: new NotificationsInteractor({ notifications: new NotificationService() }),
      router: new NotificationsRouter({ shell, settings }),
    });
    const vm = () => presenter.getViewModel();
    expect(vm().nUnread).toBe(4);
    presenter.setFilter('Unread');
    expect(vm().nGroups.map((g) => g.label)).toEqual(['Today']);
    vm().nGroups[0].items[0].onClick();
    expect(vm().nUnread).toBe(3);

    presenter.setFilter('All');
    const update = vm().nGroups[1].items.find((n) => n.action === 'View update');
    update.onAction({ stopPropagation() {} });
    expect(settings.showSection).toHaveBeenCalledWith('about');
    expect(shell.show).toHaveBeenCalledWith('settings');
  });
});
