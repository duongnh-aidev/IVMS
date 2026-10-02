import { Observable } from '../../core/viper';

const SAMPLES = 60;

function seed(base, vol) {
  let v = base;
  return Array.from({ length: SAMPLES }, () => (v = Math.max(1, v + (Math.random() - 0.5) * vol)));
}

function step(arr, lo, hi, vol) {
  const last = arr[arr.length - 1];
  return [...arr.slice(1), Math.min(hi, Math.max(lo, last + (Math.random() - 0.5) * vol))];
}

/** Client machine metrics, last 60 s, sampled every second (simulated). */
export class SystemMetricsService extends Observable {
  series = null; // { cpu, mem, down, up }
  #timer = null;
  #users = 0;

  start() {
    if (this.#users++ > 0) return;
    this.series = { cpu: seed(28, 10), mem: seed(6.2, 0.3), down: seed(48, 14), up: seed(3.2, 1.2) };
    this.emit();
    this.#timer = setInterval(() => {
      const s = this.series;
      this.series = {
        cpu: step(s.cpu, 4, 97, 14),
        mem: step(s.mem, 4, 15.5, 0.35),
        down: step(s.down, 2, 180, 22),
        up: step(s.up, 0.2, 20, 1.6),
      };
      this.emit();
    }, 1000);
  }

  stop() {
    if (--this.#users > 0) return;
    clearInterval(this.#timer);
  }
}
