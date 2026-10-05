import { Observable } from '../../core/mvc';

const STORAGE_KEY = 'ivms.session';

function storages() {
  // Either can throw (private mode, blocked site data): the session then lives in memory only
  const get = (name) => {
    try {
      return window[name];
    } catch {
      return null;
    }
  };
  return { persistent: get('localStorage'), tab: get('sessionStorage') };
}

/**
 * The signed-in session: access token, its expiry and the user. The token is kept in
 * localStorage ("Remember me") or sessionStorage. When it expires the session ends,
 * so the user has to sign in again.
 */
export class AuthService extends Observable {
  #session = null; // { token, expiresAt (ms), user }
  #timer = null;

  constructor({ api, storage = storages(), now = () => Date.now() }) {
    super();
    this.api = api;
    this.storage = storage;
    this.now = now;
    this.#restore();
  }

  isSignedIn() {
    return this.#session != null && this.#session.expiresAt > this.now();
  }

  token() {
    return this.isSignedIn() ? this.#session.token : null;
  }

  user() {
    return this.isSignedIn() ? this.#session.user : null;
  }

  /** Rejects with an ApiError (wrong credentials, server unreachable, ...). */
  async signIn(username, password, remember = true) {
    this.#begin(await this.api.post('/auth/login', { username, password }), remember);
  }

  /** True until the server has a first user (fresh install). */
  async setupRequired() {
    return (await this.api.get('/auth/setup')).required;
  }

  /** First run: creates the admin account and signs in with it. */
  async setup(username, password, remember = true) {
    this.#begin(await this.api.post('/auth/setup', { username, password }), remember);
  }

  #begin(res, remember) {
    this.#start({ token: res.accessToken, expiresAt: this.now() + res.expiresIn * 1000, user: res.user }, remember);
  }

  signOut = () => {
    if (!this.#session) return;
    this.#session = null;
    clearTimeout(this.#timer);
    for (const s of Object.values(this.storage)) this.#write(s, null);
    this.emit();
  };

  #start(session, remember) {
    this.#session = session;
    const { persistent, tab } = this.storage;
    this.#write(remember ? persistent : tab, session);
    this.#write(remember ? tab : persistent, null);
    clearTimeout(this.#timer);
    this.#timer = setTimeout(this.signOut, session.expiresAt - this.now());
    this.emit();
  }

  #restore() {
    for (const s of Object.values(this.storage)) {
      try {
        const session = JSON.parse(s?.getItem(STORAGE_KEY) || 'null');
        if (session && session.expiresAt > this.now()) {
          this.#session = session;
          this.#timer = setTimeout(this.signOut, session.expiresAt - this.now());
          return;
        }
      } catch {
        // Unreadable or corrupt: treat as signed out
      }
    }
  }

  #write(storage, session) {
    try {
      if (session) storage?.setItem(STORAGE_KEY, JSON.stringify(session));
      else storage?.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: the session still works for this page
    }
  }
}
