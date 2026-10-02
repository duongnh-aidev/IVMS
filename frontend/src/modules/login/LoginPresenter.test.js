import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginInteractor } from './LoginInteractor';
import { LoginPresenter } from './LoginPresenter';

const submit = (presenter) => presenter.getViewModel().submit({ preventDefault() {} });

function setup(opts = {}) {
  const router = { toApp: vi.fn() };
  const presenter = new LoginPresenter({ interactor: new LoginInteractor(opts), router });
  return { router, presenter, vm: () => presenter.getViewModel() };
}

describe('LoginPresenter', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('flags missing fields', () => {
    const { vm, presenter } = setup();
    submit(presenter);
    expect(vm().error).toBe('Please fill in all required fields.');
    expect(vm().userRing).toBe('inset 0 0 0 1px #C62828');
    expect(vm().serverRing).toBe('inset 0 0 0 0 transparent');
  });

  it('signs in and routes to the app', async () => {
    const { router, presenter, vm } = setup();
    presenter.setField('user', 'admin');
    presenter.setField('pass', 'secret');
    submit(presenter);
    expect(vm().submitLabel).toBe('Connecting…');
    await vi.advanceTimersByTimeAsync(1400);
    expect(vm().submitLabel).toBe('Signed in');
    expect(router.toApp).toHaveBeenCalled();
  });

  it('shows the server error', async () => {
    const { router, presenter, vm } = setup({ simulateError: true });
    presenter.setField('user', 'admin');
    presenter.setField('pass', 'wrong');
    submit(presenter);
    await vi.advanceTimersByTimeAsync(1400);
    expect(vm().error).toMatch(/Incorrect username or password/);
    expect(router.toApp).not.toHaveBeenCalled();
  });
});
