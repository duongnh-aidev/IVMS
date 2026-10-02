/** Data the window chrome needs: unread notification count. */
export class ShellInteractor {
  constructor({ notifications }) {
    this.notifications = notifications;
  }

  get source() {
    return this.notifications;
  }

  unreadCount() {
    return this.notifications.unreadCount();
  }
}
