import { ICONS } from '../../shared/ui/icons';

const GUIDES = [
  [
    'Getting started',
    'Sign in, connect to the server and find your way around.',
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM10 8l6 4-6 4z',
  ],
  ['Add a camera with RTSP', 'Find the stream URL, test the connection and add the device.', ICONS.devices],
  ['Playback & export', 'Find footage on the timeline, bookmark moments and export clips.', ICONS.playback],
  ['Recording schedules', 'Set when cameras record and how long footage is kept.', ICONS.schedule],
  ['Users & permissions', 'Create roles and limit which cameras each person can see.', ICONS.users],
  ['Troubleshooting', 'Fix offline cameras, black screens and sign-in problems.', ICONS.help],
].map(([title, desc, icon]) => ({ title, desc, icon }));

const SHORTCUTS = [
  [['⌘', '1'], 'Dashboard'],
  [['⌘', '2'], 'Live View'],
  [['⌘', '3'], 'Playback'],
  [['Space'], 'Play / pause'],
  [['←', '→'], 'Previous / next frame'],
  [['⌘', 'B'], 'Bookmark moment'],
  [['⌘', 'E'], 'Export clip'],
  [['⌘', 'F'], 'Full-screen camera'],
].map(([keys, label]) => ({ keys, label }));

/** Help articles, keyboard shortcuts and support actions. */
export class HelpModel {
  searchGuides(query) {
    const q = query.trim().toLowerCase();
    return GUIDES.filter((g) => !q || g.title.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q));
  }

  shortcuts() {
    return SHORTCUTS;
  }

  /** Simulated upload of client logs. */
  sendDiagnosticLogs() {
    return 'Diagnostic logs sent to support';
  }
}
