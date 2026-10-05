import { Observable } from '../../core/mvc';

/** App-wide transient message ("Device added", "Deleted Lobby"). */
export class ToastService extends Observable {
  current = null;
  #timer = null;

  /** @param {'ok'|'err'} kind */
  show(kind, msg) {
    clearTimeout(this.#timer);
    this.current = { kind, msg };
    this.emit();
    this.#timer = setTimeout(() => this.close(), 3200);
  }

  ok = (msg) => this.show('ok', msg);
  error = (msg) => this.show('err', msg);

  close() {
    clearTimeout(this.#timer);
    this.current = null;
    this.emit();
  }
}
