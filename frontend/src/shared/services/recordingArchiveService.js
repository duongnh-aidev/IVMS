const EVENT_TYPES = [
  ['Motion', '#3E6AE1'],
  ['Motion', '#3E6AE1'],
  ['Line crossing', '#3E6AE1'],
  ['Intrusion', '#3E6AE1'],
  ['Tampering', '#E5484D'],
  ['Signal loss', '#E5484D'],
];

/** Stable positive number for a device id (UUID string). */
function hash(id) {
  let h = 7;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h + 1;
}

/**
 * Recorded footage index per camera: recorded segments [startSec, endSec] and
 * events {t, type, color} for a day. Deterministic mock until the NVR API exists.
 */
export class RecordingArchiveService {
  #cache = {};

  day(cameraId) {
    if (this.#cache[cameraId]) return this.#cache[cameraId];
    let seed = (hash(cameraId) % 100000) * 9973 + 17;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const segs = [];
    let cur = 0;
    const gaps = 2 + Math.floor(rnd() * 3);
    for (let g = 0; g < gaps; g++) {
      const start = cur + 3600 + rnd() * (86400 / gaps - 3600);
      const len = 600 + rnd() * 2400;
      segs.push([cur, Math.min(start, 86400)]);
      cur = Math.min(start + len, 86400);
    }
    if (cur < 86400) segs.push([cur, 86400]);
    const evts = Array.from({ length: 8 + Math.floor(rnd() * 8) }, () => {
      const ty = EVENT_TYPES[Math.floor(rnd() * EVENT_TYPES.length)];
      return { t: Math.floor(rnd() * 86000), type: ty[0], color: ty[1] };
    }).sort((a, b) => a.t - b.t);
    return (this.#cache[cameraId] = { segs, evts });
  }

  isRecorded(cameraId, t) {
    return this.day(cameraId).segs.some(([a, b]) => t >= a && t < b);
  }
}
