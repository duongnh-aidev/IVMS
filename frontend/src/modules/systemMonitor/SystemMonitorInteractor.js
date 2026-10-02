const EMPTY = { cpu: [0], mem: [0], down: [0], up: [0] };

/** Live client metrics (CPU, memory, network) from the metrics service. */
export class SystemMonitorInteractor {
  constructor({ metrics }) {
    this.metrics = metrics;
  }

  get source() {
    return this.metrics;
  }

  start() {
    this.metrics.start();
  }

  stop() {
    this.metrics.stop();
  }

  series() {
    return this.metrics.series || EMPTY;
  }
}
