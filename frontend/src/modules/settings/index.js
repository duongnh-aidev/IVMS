import { createElement } from 'react';
import { SettingsModel } from './SettingsModel';
import { SettingsController } from './SettingsController';
import SettingsView from './SettingsView';

/** `pluginSections`: slot "settings.sections" items with their bound `View`. */
export function buildSettings({ toast, auth, pluginSections, systemInfo }) {
  const controller = new SettingsController({
    model: new SettingsModel(),
    auth,
    toast,
    pluginSections,
    systemInfo,
  });
  return {
    controller,
    input: { showSection: controller.showSection },
    View: () => createElement(SettingsView, { controller }),
  };
}
