import { createElement } from 'react';
import { SettingsModel } from './SettingsModel';
import { SettingsController } from './SettingsController';
import SettingsView from './SettingsView';

export function buildSettings({ toast, auth }) {
  const controller = new SettingsController({
    model: new SettingsModel(),
    auth,
    toast,
  });
  return {
    controller,
    input: { showSection: controller.showSection },
    View: () => createElement(SettingsView, { controller }),
  };
}
