import { Observable } from '../../core/mvc';

/**
 * Edition and enabled plugin features from GET /system/info. Plugin screens and slot items show
 * only while their feature is enabled; a plugin calls `load()` again after a licence change.
 */
export class SystemInfoService extends Observable {
  #info = { version: '', edition: 'Community', features: [] };
  #features = new Set();

  constructor({ api }) {
    super();
    this.api = api;
  }

  /** Rejects with an ApiError; the previous info is kept. */
  async load() {
    this.#info = await this.api.get('/system/info');
    this.#features = new Set(this.#info.features);
    this.emit();
  }

  edition() {
    return this.#info.edition;
  }

  /** Enabled feature keys (a Set). */
  features() {
    return this.#features;
  }
}
