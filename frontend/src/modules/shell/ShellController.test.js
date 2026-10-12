import { describe, expect, it } from 'vitest';
import { FakeApi } from '../../test/fakeApi';
import { SystemInfoService } from '../../shared/services/systemInfoService';
import { ToastService } from '../../shared/services/toastService';
import { ShellModel } from './ShellModel';
import { ShellController } from './ShellController';

const notifications = { subscribe: () => () => {}, unreadCount: () => 0 };
const DETECTIONS = { key: 'detections', label: 'Detections', icon: 'M0 0', group: 'main', requires: 'acme.detections' };
const LICENCE = { key: 'licence', label: 'Licence', icon: 'M1 1', group: 'bottom' };

async function setup({ features = [], initialScreen = 'live', pluginScreens = [DETECTIONS, LICENCE] } = {}) {
  const api = new FakeApi({ info: { version: '1', edition: 'Community', features } });
  const systemInfo = new SystemInfoService({ api });
  await systemInfo.load();
  const controller = new ShellController({
    model: new ShellModel({ notifications }),
    auth: { signOut() {} },
    toast: new ToastService(),
    initialScreen,
    pluginScreens,
    systemInfo,
  });
  const labels = (group) => controller.getViewModel().sidebar[group].map((i) => i.label);
  return { api, systemInfo, controller, labels, vm: () => controller.getViewModel() };
}

describe('ShellController with plugin screens', () => {
  it('without plugins shows exactly the core sidebar', async () => {
    const { labels } = await setup({ pluginScreens: [] });
    expect(labels('mainNav')).toEqual(['Dashboard', 'Live View', 'Playback']);
    expect(labels('setupNav')).toEqual(['Devices', 'Recording', 'Storage', 'Users']);
    expect(labels('bottomNav')).toEqual(['Notifications', 'Settings', 'Help']);
  });

  it('hides a screen whose feature is off, keeps the core items unchanged', async () => {
    const { labels } = await setup();
    expect(labels('mainNav')).toEqual(['Dashboard', 'Live View', 'Playback']);
    // No `requires`: shown whenever the plugin is installed, after the core items
    expect(labels('bottomNav')).toEqual(['Notifications', 'Settings', 'Help', 'Licence']);
  });

  it('adds the screen after the core items once the feature is enabled', async () => {
    const { api, systemInfo, labels } = await setup();
    api.info = { ...api.info, edition: 'Enterprise', features: ['acme.detections'] }; // licence entered

    await systemInfo.load();

    expect(labels('mainNav')).toEqual(['Dashboard', 'Live View', 'Playback', 'Detections']);
  });

  it('falls back to Live View when the active plugin screen is turned off', async () => {
    const { api, systemInfo, controller, vm } = await setup({ features: ['acme.detections'] });
    controller.show('detections');
    expect(vm().active).toBe('detections');

    api.info = { ...api.info, features: [] }; // licence expired
    await systemInfo.load();

    expect(vm().active).toBe('live');
  });
});
