import { Presenter } from '../../core/viper';
import { pad2 } from '../../shared/utils/time';

export class DashboardPresenter extends Presenter {
  constructor({ interactor, router }) {
    super();
    this.interactor = interactor;
    this.router = router;
    this.observe(interactor.source);
  }

  present() {
    const { total: all, online: on, offline: off, error: err } = this.interactor.deviceHealth();
    const H = this.interactor.eventsPerHour();
    const max = Math.max(...H);
    const total = H.reduce((a, b) => a + b, 0);
    return {
      kpis: [
        {
          label: 'Devices online',
          value: on,
          unit: '/ ' + all,
          note: off + err ? off + err + ' need attention' : 'All devices healthy',
          color: '#171A20',
        },
        { label: 'Events today', value: total, unit: '', note: '12 unacknowledged', color: '#171A20' },
        { label: 'Recording', value: on, unit: 'cameras', note: 'Continuous + motion', color: '#171A20' },
        { label: 'Storage used', value: '57', unit: '% of 8 TB', note: '3.4 TB free', color: '#171A20' },
      ],
      eventsTotal: total,
      hours: H.map((v, i) => ({
        h: Math.max(4, Math.round((v / max) * 100)) + '%',
        bg: i === H.length - 1 ? '#3E6AE1' : '#C5D2F5',
        title: pad2(i) + ':00 — ' + v + ' events',
      })),
      health: [
        { label: 'Online', n: on, dot: '#2EA44F' },
        { label: 'Offline', n: off, dot: '#8E8E8E' },
        { label: 'Error', n: err, dot: '#E5484D' },
      ],
      events: this.interactor.recentEvents(),
      disks: this.interactor
        .disks()
        .map((d) => ({ name: d.name, pct: d.usedPct + '%', note: d.used + ' used', bar: '#171A20' })),
      goDevices: () => this.router.toDevices(),
    };
  }
}
