import { describe, expect, it, vi } from 'vitest';
import { NotificationService } from '../../shared/services/notificationService';
import { NotificationsModel } from './NotificationsModel';
import { NotificationsController } from './NotificationsController';

describe('NotificationsController', () => {
  it('marks read, filters unread and opens the target screen', () => {
    const shell = { show: vi.fn() };
    const settings = { showSection: vi.fn() };
    const controller = new NotificationsController({
      model: new NotificationsModel({ notifications: new NotificationService() }),
      shell,
      settings,
    });
    const vm = () => controller.getViewModel();
    expect(vm().nUnread).toBe(4);
    controller.setFilter('Unread');
    expect(vm().nGroups.map((g) => g.label)).toEqual(['Today']);
    vm().nGroups[0].items[0].onClick();
    expect(vm().nUnread).toBe(3);

    controller.setFilter('All');
    const update = vm().nGroups[1].items.find((n) => n.action === 'View update');
    update.onAction({ stopPropagation() {} });
    expect(settings.showSection).toHaveBeenCalledWith('about');
    expect(shell.show).toHaveBeenCalledWith('settings');
  });
});
