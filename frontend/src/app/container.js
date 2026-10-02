// Composition root: creates the services and assembles every VIPER module.
// This is the only place that knows how modules are wired to each other.

import { DeviceService } from '../shared/services/deviceService';
import { NotificationService } from '../shared/services/notificationService';
import { RecordingArchiveService } from '../shared/services/recordingArchiveService';
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

/** Sign-in screen. */
export function createLogin({ appNavigator, showServer = true, edition = 'Standard', simulateError = false }) {
  return buildLogin({ appNavigator, showServer, edition, simulateError }).View;
}

/**
 * A signed-in session: fresh services and modules, returns the main window view.
 * @param initialScreen  dashboard | live | playback | devices | recording | storage | users | notifications | settings | help
 * @param cameraCount    number of demo cameras (0–16)
 */
export function createSession({ appNavigator, initialScreen = 'live', cameraCount = 13 }) {
  const services = {
    devices: new DeviceService(cameraCount),
    notifications: new NotificationService(),
    archive: new RecordingArchiveService(),
    metrics: new SystemMetricsService(),
    toast: new ToastService(),
    appNavigator,
  };

  const shell = buildShell({ ...services, initialScreen });
  const deviceEditor = buildDeviceEditor(services);
  const settings = buildSettings(services);
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
  };

  return shell.bindView({
    screens,
    statusBar: buildSystemMonitor(services).View,
    overlays: [deviceEditor.View],
  });
}
