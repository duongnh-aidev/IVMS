export const SUPPORT_EMAIL = 'support@ivms.vn';

export class HelpRouter {
  toSupportEmail() {
    window.location.href = 'mailto:' + SUPPORT_EMAIL;
  }
}
