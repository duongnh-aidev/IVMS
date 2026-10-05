import { createElement } from 'react';
import { NotificationsModel } from './NotificationsModel';
import { NotificationsController } from './NotificationsController';
import NotificationsView from './NotificationsView';

export function buildNotifications({ notifications, shell, settings }) {
  const controller = new NotificationsController({
    model: new NotificationsModel({ notifications }),
    shell,
    settings,
  });
  return { controller, View: () => createElement(NotificationsView, { controller }) };
}
