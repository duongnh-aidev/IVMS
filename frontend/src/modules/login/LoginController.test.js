import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../shared/api/client';
import { LoginModel } from './LoginModel';
import { LoginController } from './LoginController';

const submit = (controller) => controller.getViewModel().submit({ preventDefault() {} });

function setup(signIn = vi.fn().mockResolvedValue(undefined), { setupRequired = false } = {}) {
  const auth = { signIn, setupRequired: vi.fn().mockResolvedValue(setupRequired), setup: vi.fn().mockResolvedValue() };
  const appNavigator = { toApp: vi.fn() };
  const controller = new LoginController({ model: new LoginModel({ auth }), appNavigator, showServer: false });
  return { auth, appNavigator, controller, vm: () => controller.getViewModel() };
}

describe('LoginController', () => {
  it('flags missing fields', () => {
    const { vm, controller } = setup();
    submit(controller);
    expect(vm().error).toBe('Please fill in all required fields.');
    expect(vm().userRing).toBe('inset 0 0 0 1px #C62828');
    expect(vm().serverRing).toBe('inset 0 0 0 0 transparent');
  });

  it('signs in on the server and routes to the app', async () => {
    const { auth, appNavigator, controller, vm } = setup();
    controller.setField('user', ' admin ');
    controller.setField('pass', 'secret');
    const done = controller.submit();
    expect(vm().submitLabel).toBe('Connecting…');
    await done;
    expect(auth.signIn).toHaveBeenCalledWith('admin', 'secret', true);
    expect(vm().submitLabel).toBe('Signed in');
    expect(appNavigator.toApp).toHaveBeenCalled();
  });

  it('shows the server error', async () => {
    const signIn = vi.fn().mockRejectedValue(new ApiError(401, { detail: 'Wrong username or password' }));
    const { appNavigator, controller, vm } = setup(signIn);
    controller.setField('user', 'admin');
    controller.setField('pass', 'wrong');
    await controller.submit();
    expect(vm().error).toBe('Wrong username or password');
    expect(appNavigator.toApp).not.toHaveBeenCalled();
  });

  it('creates the admin account on a fresh install', async () => {
    const { auth, appNavigator, controller, vm } = setup(undefined, { setupRequired: true });
    controller.attach();
    await vi.waitFor(() => expect(vm().submitLabel).toBe('Create account'));
    controller.setField('user', 'owner');
    controller.setField('pass', 'short');
    await controller.submit();
    expect(vm().error).toBe('Use at least 8 characters for the password.');
    controller.setField('pass', 'long-enough');
    await controller.submit();
    expect(auth.setup).toHaveBeenCalledWith('owner', 'long-enough', true);
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(appNavigator.toApp).toHaveBeenCalled();
  });
});
