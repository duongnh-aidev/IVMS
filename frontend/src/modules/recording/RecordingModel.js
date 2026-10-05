import { Observable } from '../../core/mvc';

/** Recording modes painted on the weekly grid: C = continuous, M = motion only, O = off. */
export const MODES = { C: ['Continuous', '#3E6AE1'], M: ['Motion only', '#A9BDF1'], O: ['Off', '#FFFFFF'] };

const grid = (fn) => Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, hr) => fn(d, hr)));

/** Schedule templates: 7 days (Mon..Sun) × 24 hours of modes. */
export const TEMPLATES = {
  'Business hours': () => grid((d, hr) => (d < 5 && hr >= 7 && hr < 19 ? 'C' : 'M')),
  '24/7 continuous': () => grid(() => 'C'),
  'Motion only': () => grid(() => 'M'),
  'Nights & weekends': () => grid((d, hr) => (d >= 5 || hr < 7 || hr >= 19 ? 'C' : 'M')),
};

export const BUFFER_OPTIONS = {
  pre: ['3 s', '5 s', '10 s'],
  post: ['10 s', '30 s', '60 s'],
  stream: ['Main', 'Sub'],
};

/** Weekly recording schedule, event buffers and holiday exceptions (in-memory mock). */
export class RecordingModel extends Observable {
  #target = 'all';
  #schedule = TEMPLATES['Business hours']();
  #buffers = { pre: '5 s', post: '30 s', stream: 'Main' };
  #holidays = [
    { date: 'Jan 1, 2027', name: "New Year's Day", rule: 'Motion only' },
    { date: 'Feb 6, 2027', name: 'Lunar New Year (Tết)', rule: 'Continuous' },
    { date: 'Apr 30, 2027', name: 'Reunification Day', rule: 'Motion only' },
  ];

  target() {
    return this.#target;
  }

  /** Which cameras / group the schedule applies to. */
  setTarget(target) {
    this.#target = target;
    this.emit();
  }

  schedule() {
    return this.#schedule;
  }

  applyTemplate(name) {
    this.#schedule = TEMPLATES[name]();
    this.emit();
  }

  /** Sets one hour slot; returns false if it already had that mode. */
  setSlot(day, hour, mode) {
    if (this.#schedule[day][hour] === mode) return false;
    this.#schedule = this.#schedule.map((row) => row.slice());
    this.#schedule[day][hour] = mode;
    this.emit();
    return true;
  }

  hoursPerWeek(mode) {
    return this.#schedule.flat().filter((v) => v === mode).length;
  }

  buffers() {
    return this.#buffers;
  }

  setBuffer(key, value) {
    this.#buffers = { ...this.#buffers, [key]: value };
    this.emit();
  }

  holidays() {
    return this.#holidays;
  }
}
