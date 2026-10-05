import { withValue } from '../../core/events';
import { Controller } from '../../core/mvc';

export const SUPPORT_EMAIL = 'support@ivms.vn';

export class HelpController extends Controller {
  constructor({ model, toast }) {
    super();
    this.model = model;
    this.toast = toast;
    this.state = { query: '' };
  }

  search = (query) => this.setState({ query });
  openGuide = (guide) => this.toast.ok('Opening “' + guide.title + '”');
  sendLogs = () => this.toast.ok(this.model.sendDiagnosticLogs());
  contactSupport = () => {
    window.location.href = 'mailto:' + SUPPORT_EMAIL;
  };

  present() {
    const guides = this.model.searchGuides(this.state.query);
    return {
      hq: this.state.query,
      setHq: withValue(this.search),
      guides: guides.map((g) => ({ title: g.title, desc: g.desc, d: g.icon, onClick: () => this.openGuide(g) })),
      noGuides: guides.length === 0,
      shortcuts: this.model.shortcuts(),
      helpContact: this.contactSupport,
      helpLogs: this.sendLogs,
    };
  }
}
