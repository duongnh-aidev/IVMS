// Composition root: creates the services and assembles every module.
// This is the only place that knows how modules are wired to each other.

import { DeviceService } from '../shared/services/deviceService';
import { NotificationService } from '../shared/services/notificationService';
import { RecordingArchiveService } from '../shared/services/recordingArchiveService';
import { SystemInfoService } from '../shared/services/systemInfoService';
import { SystemMetricsService } from '../shared/services/systemMetricsService';
import { ToastService } from '../shared/services/toastService';
import { buildDashboard } from '../modules/dashboard';
import { buildDeviceEditor } from '../modules/deviceEditor';
import { buildDevices } from '../modules/devices';
import { buildHelp } from '../modules/help';
import { buildLiveView } from '../modules/liveView';
import { buildLogin } from '../modules/login';
import { buildNotifications } from '../modules/notifications';
import { buildPlayback } from '../modules/playback';
import { buildRecording } from '../modules/recording';
import { buildSettings } from '../modules/settings';
import { buildShell } from '../modules/shell';
import { buildStorage } from '../modules/storage';
import { buildSystemMonitor } from '../modules/systemMonitor';
import { buildUsers } from '../modules/users';

const EMPTY_REGISTRY = { screens: [], slots: { 'settings.sections': [] } };

/**
 * Sign-in screen.
 * @param showServer  show server/port fields (the web client always talks to the server it was loaded from)
 */
export function createLogin({ appNavigator, api, auth, showServer = false }) {
  return buildLogin({ appNavigator, api, auth, showServer }).View;
}

/**
 * A signed-in session: fresh services and modules, returns the main window view.
 * @param initialScreen  dashboard | live | playback | devices | recording | storage | users | notifications | settings | help
 *                       (or a plugin screen key)
 * @param plugins        createPluginRegistry() result: what frontend plugins add
 */
export function createSession({ appNavigator, api, auth, initialScreen = 'live', plugins = EMPTY_REGISTRY }) {
  const services = {
    api,
    devices: new DeviceService({ api }),
    notifications: new NotificationService(),
    archive: new RecordingArchiveService(),
    metrics: new SystemMetricsService(),
    systemInfo: new SystemInfoService({ api }),
    toast: new ToastService(),
    appNavigator,
    auth,
  };
  services.devices.load().catch((err) => services.toast.error(err.message));
  // Without plugins there is nothing to switch on, so the core never needs it
  if (plugins.screens.length || Object.values(plugins.slots).some((items) => items.length)) {
    services.systemInfo.load().catch((err) => services.toast.error(err.message));
  }

  const shell = buildShell({ ...services, initialScreen, pluginScreens: plugins.screens });
  const deviceEditor = buildDeviceEditor(services);
  const settings = buildSettings({
    ...services,
    pluginSections: plugins.slots['settings.sections'].map((item) => ({ ...item, View: item.build(services) })),
  });
  const liveView = buildLiveView({ ...services, shell: shell.input, deviceEditor: deviceEditor.input });

  const screens = {
    dashboard: buildDashboard({ ...services, shell: shell.input }).View,
    live: liveView.View,
    playback: buildPlayback(services).View,
    devices: buildDevices({
      ...services,
      shell: shell.input,
      liveView: liveView.input,
      deviceEditor: deviceEditor.input,
    }).View,
    recording: buildRecording(services).View,
    storage: buildStorage(services).View,
    users: buildUsers(services).View,
    notifications: buildNotifications({ ...services, shell: shell.input, settings: settings.input }).View,
    settings: settings.View,
    help: buildHelp(services).View,
    // Built even while their feature is off, so they appear as soon as it is turned on
    ...Object.fromEntries(
      plugins.screens.map((screen) => [screen.key, screen.build({ ...services, shell: shell.input })]),
    ),
  };

  return shell.bindView({
    screens,
    statusBar: buildSystemMonitor(services).View,
    overlays: [deviceEditor.View],
  });
}
