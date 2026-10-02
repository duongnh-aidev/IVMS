import { withValue } from '../../core/events';
import { Presenter } from '../../core/viper';

export class HelpPresenter extends Presenter {
  constructor({ interactor, router, toast }) {
    super();
    this.interactor = interactor;
    this.router = router;
    this.toast = toast;
    this.state = { query: '' };
  }

  search = (query) => this.setState({ query });
  openGuide = (guide) => this.toast.ok('Opening “' + guide.title + '”');
  sendLogs = () => this.toast.ok(this.interactor.sendDiagnosticLogs());
  contactSupport = () => this.router.toSupportEmail();

  present() {
    const guides = this.interactor.searchGuides(this.state.query);
    return {
      hq: this.state.query,
      setHq: withValue(this.search),
      guides: guides.map((g) => ({ title: g.title, desc: g.desc, d: g.icon, onClick: () => this.openGuide(g) })),
      noGuides: guides.length === 0,
      shortcuts: this.interactor.shortcuts(),
      helpContact: this.contactSupport,
      helpLogs: this.sendLogs,
    };
  }
}
