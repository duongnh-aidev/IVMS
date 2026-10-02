import { createElement } from 'react';
import { NotificationsInteractor } from './NotificationsInteractor';
import { NotificationsPresenter } from './NotificationsPresenter';
import { NotificationsRouter } from './NotificationsRouter';
import NotificationsView from './NotificationsView';

export function buildNotifications({ notifications, shell, settings }) {
  const presenter = new NotificationsPresenter({
    interactor: new NotificationsInteractor({ notifications }),
    router: new NotificationsRouter({ shell, settings }),
  });
  return { presenter, View: () => createElement(NotificationsView, { presenter }) };
}
