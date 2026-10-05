/** Notification feed and read state. */
export class NotificationsModel {
  constructor({ notifications }) {
    this.notifications = notifications;
  }

  get source() {
    return this.notifications;
  }

  list() {
    return this.notifications.list();
  }

  isRead(id) {
    return this.notifications.isRead(id);
  }

  unreadCount() {
    return this.notifications.unreadCount();
  }

  markRead(id) {
    this.notifications.markRead(id);
  }

  markAllRead() {
    this.notifications.markAllRead();
  }
}
