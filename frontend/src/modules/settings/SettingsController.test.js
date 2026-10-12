import { describe, expect, it } from 'vitest';
import { FakeApi } from '../../test/fakeApi';
import { SystemInfoService } from '../../shared/services/systemInfoService';
import { ToastService } from '../../shared/services/toastService';
import { SettingsModel } from './SettingsModel';
import { SettingsController } from './SettingsController';

const LicenceView = () => null;
const FacesView = () => null;
const SECTIONS = [
  { key: 'licence', label: 'Licence', View: LicenceView },
  { key: 'faces', label: 'Face recognition', requires: 'acme.faces', View: FacesView },
];

async function setup(pluginSections = SECTIONS, features = []) {
  const api = new FakeApi({ info: { version: '1', edition: 'Community', features } });
  const systemInfo = new SystemInfoService({ api });
  await systemInfo.load();
  const controller = new SettingsController({
    model: new SettingsModel(),
    auth: { signOut() {} },
    toast: new ToastService(),
    pluginSections,
    systemInfo,
  });
  const vm = () => controller.getViewModel();
  return { api, systemInfo, controller, vm, labels: () => vm().setSecs.map((s) => s.label) };
}

describe('SettingsController with plugin sections', () => {
  it('without plugins shows exactly the core sections', async () => {
    const { labels, vm } = await setup([]);
    expect(labels()).toEqual(['General', 'Account', 'Notifications', 'Server', 'About']);
    expect(vm().SetPanel).toBeNull();
  });

  it('adds available plugin sections after the core ones', async () => {
    const { labels, api, systemInfo } = await setup();
    expect(labels()).toEqual(['General', 'Account', 'Notifications', 'Server', 'About', 'Licence']);

    api.info = { ...api.info, features: ['acme.faces'] };
    await systemInfo.load();

    expect(labels()).toEqual(['General', 'Account', 'Notifications', 'Server', 'About', 'Licence', 'Face recognition']);
  });

  it("shows the plugin's view instead of rows in its section", async () => {
    const { controller, vm } = await setup();
    controller.showSection('licence');
    expect(vm().SetPanel).toBe(LicenceView);
    expect(vm().setRows).toEqual([]);
  });

  it('falls back to General when the active plugin section is turned off', async () => {
    const { controller, vm, api, systemInfo } = await setup(SECTIONS, ['acme.faces']);
    controller.showSection('faces');
    expect(vm().SetPanel).toBe(FacesView);

    api.info = { ...api.info, features: [] };
    await systemInfo.load();

    expect(vm().SetPanel).toBeNull();
    expect(vm().setSecs[0].weight).toBe(600); // General is selected
  });

  it("About shows the server's version and edition", async () => {
    const { controller, vm, api, systemInfo } = await setup([]);
    controller.showSection('about');
    const row = (label) => vm().setRows.find((r) => r.label === label).value;
    expect(row('Version')).toBe('1 · Community Edition');
    expect(row('License')).toBe('Open source (GNU AGPL-3.0)');

    api.info = { version: '1.1.0', edition: 'Enterprise', features: ['acme.faces'] };
    await systemInfo.load();

    expect(row('Version')).toBe('1.1.0 · Enterprise Edition');
    expect(row('License')).toBe('Commercial');
  });
});
