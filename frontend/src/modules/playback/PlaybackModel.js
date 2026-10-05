import { Observable } from '../../core/mvc';

// Demo clock: "today" and the oldest day that still has footage.
export const TODAY = '2026-10-01';
const ARCHIVE_START = '2026-08-20';

export const EVENT_FILTERS = {
  All: () => true,
  Motion: (e) => ['Motion', 'Intrusion', 'Line crossing'].includes(e.type),
  Alerts: (e) => ['Tampering', 'Signal loss'].includes(e.type),
};

/** Recorded footage, events and bookmarks for the playback screen. */
export class PlaybackModel extends Observable {
  #bookmarks = [];

  constructor({ devices, archive }) {
    super();
    this.devices = devices;
    this.archive = archive;
  }

  get sources() {
    return [this.devices, this];
  }

  cameraIds() {
    return this.devices.ids();
  }

  nameOf(id) {
    return this.devices.nameOf(id);
  }

  today() {
    return TODAY;
  }

  hasFootage(date) {
    return date <= TODAY && date >= ARCHIVE_START;
  }

  /** Recorded [start, end] segments (seconds) of a camera's day. */
  segments(cameraId) {
    return this.archive.day(cameraId).segs;
  }

  events(cameraId) {
    return this.archive.day(cameraId).evts;
  }

  isRecorded(cameraId, t) {
    return this.archive.isRecorded(cameraId, t);
  }

  bookmarks() {
    return this.#bookmarks;
  }

  addBookmark(t, cameraIds) {
    this.#bookmarks = [...this.#bookmarks, { t, cams: cameraIds, note: 'Bookmark ' + (this.#bookmarks.length + 1) }];
    this.emit();
  }

  /** Simulated clip export. */
  exportClip({ cameraId, format }) {
    return 'Exporting ' + this.nameOf(cameraId) + ' · ' + format;
  }
}
