import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './authService';

class MemoryStorage {
  items = {};
  getItem = (k) => this.items[k] ?? null;
  setItem = (k, v) => (this.items[k] = v);
  removeItem = (k) => delete this.items[k];
}

const LOGIN = { accessToken: 'tok', tokenType: 'bearer', expiresIn: 5, user: { username: 'admin' } };

function setup() {
  const api = { post: vi.fn().mockResolvedValue(LOGIN) };
  const storage = { persistent: new MemoryStorage(), tab: new MemoryStorage() };
  const auth = new AuthService({ api, storage });
  return { api, storage, auth };
}

describe('AuthService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('signs in and keeps the token until it expires', async () => {
    const { api, auth } = setup();
    const changed = vi.fn();
    auth.subscribe(changed);
    await auth.signIn('admin', 'secret');
    expect(api.post).toHaveBeenCalledWith('/auth/login', { username: 'admin', password: 'secret' });
    expect(auth.token()).toBe('tok');
    expect(auth.user().username).toBe('admin');

    vi.advanceTimersByTime(4999);
    expect(auth.isSignedIn()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(auth.isSignedIn()).toBe(false);
    expect(auth.token()).toBe(null);
    expect(changed).toHaveBeenCalledTimes(2); // signed in, expired
  });

  it('remembers the session across reloads only with "Remember me"', async () => {
    const { api, storage, auth } = setup();
    await auth.signIn('admin', 'secret', true);
    expect(new AuthService({ api, storage }).token()).toBe('tok');

    await auth.signIn('admin', 'secret', false);
    expect(storage.persistent.items).toEqual({});
    expect(new AuthService({ api, storage: { ...storage, tab: new MemoryStorage() } }).isSignedIn()).toBe(false);
  });

  it('does not restore an expired session', async () => {
    const { api, storage, auth } = setup();
    await auth.signIn('admin', 'secret');
    vi.setSystemTime(Date.now() + 6000);
    expect(new AuthService({ api, storage }).isSignedIn()).toBe(false);
  });

  it('signs out and forgets the token', async () => {
    const { storage, auth } = setup();
    await auth.signIn('admin', 'secret');
    auth.signOut();
    expect(auth.isSignedIn()).toBe(false);
    expect(storage.persistent.items).toEqual({});
  });
});
