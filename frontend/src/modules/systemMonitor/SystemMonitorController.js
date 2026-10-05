import { Controller } from '../../core/mvc';

const last = (a) => a[a.length - 1];
const bars = (a, max, n, color) =>
  a.slice(-n).map((v) => ({ h: Math.max(8, Math.round((v / max) * 100)) + '%', bg: color }));

/** Status bar with mini charts, and the expandable "System monitor" popover. */
export class SystemMonitorController extends Controller {
  constructor({ model }) {
    super();
    this.model = model;
    this.state = { open: false };
    this.observe(model.source);
  }

  attach() {
    this.model.start();
  }

  detach() {
    this.model.stop();
  }

  toggle = () => this.setState((s) => ({ open: !s.open }));

  present() {
    const sys = this.model.series();
    const dMax = Math.max(60, ...sys.down);
    const uMax = Math.max(5, ...sys.up);
    const cpu = last(sys.cpu);
    const cpuCol = cpu > 85 ? '#E5484D' : '#3E6AE1';
    return {
      sysOpen: this.state.open,
      toggleSys: this.toggle,
      sysBtnBg: this.state.open ? '#F4F4F4' : 'transparent',
      cpuNow: Math.round(cpu) + '%',
      cpuColor: cpu > 85 ? '#C62828' : '#171A20',
      cpuSub: '8 cores',
      memNow: last(sys.mem).toFixed(1) + ' GB',
      memSub: 'of 16 GB',
      downNow: last(sys.down).toFixed(1) + ' Mb/s',
      downSub: 'peak ' + Math.max(...sys.down).toFixed(0),
      upNow: last(sys.up).toFixed(1) + ' Mb/s',
      upSub: 'peak ' + Math.max(...sys.up).toFixed(1),
      cpuMini: bars(sys.cpu, 100, 16, cpuCol),
      memMini: bars(sys.mem, 16, 16, '#171A20'),
      cpuBig: bars(sys.cpu, 100, 40, cpuCol),
      memBig: bars(sys.mem, 16, 40, '#171A20'),
      downBig: bars(sys.down, dMax, 40, '#3E6AE1'),
      upBig: bars(sys.up, uMax, 40, '#8E8E8E'),
    };
  }
}
