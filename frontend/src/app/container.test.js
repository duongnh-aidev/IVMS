import { describe, expect, it } from 'vitest';
import { createPluginRegistry } from '../core/plugins';
import { SCREENS } from '../modules/shell/ShellController';
import { FakeApi } from '../test/fakeApi';
import { createSession } from './container';

const appNavigator = { toLogin() {}, toApp() {} };
const auth = { signOut() {}, subscribe: () => () => {} };

describe('createSession', () => {
  it('asks the server for its version and edition, even without plugins', () => {
    const api = new FakeApi();

    createSession({ appNavigator, api, auth });

    expect(api.calls.some(([, path]) => path === '/system/info')).toBe(true);
  });

  it("builds plugin screens and settings sections with the session's services", () => {
    const api = new FakeApi();
    const built = [];
    const plugin = {
      name: 'acme',
      screens: {
        detections: {
          label: 'Detections',
          icon: 'M0 0',
          group: 'main',
          requires: 'acme.detections',
          build: (services) => (built.push(['screen', services]), () => null),
        },
      },
      slots: {
        'settings.sections': [
          { key: 'licence', label: 'Licence', build: (s) => (built.push(['section', s]), () => null) },
        ],
      },
    };

    const Window = createSession({
      appNavigator,
      api,
      auth,
      plugins: createPluginRegistry([plugin], Object.keys(SCREENS)),
    });

    expect(typeof Window).toBe('function');
    expect(built.map(([what]) => what).sort()).toEqual(['screen', 'section']);
    for (const [, services] of built) {
      expect(services.api).toBe(api);
      expect(services.systemInfo).toBeDefined();
    }
    expect(built.find(([what]) => what === 'screen')[1].shell.show).toBeTypeOf('function');
    expect(api.calls.some(([, path]) => path === '/system/info')).toBe(true);
  });
});
