/** Seconds within the day -> "HH:MM:SS". */
export function formatClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  return [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

/** "HH:MM[:SS]" -> seconds within the day, or null if invalid. */
export function parseClock(str) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec((str || '').trim());
  if (!m) return null;
  const v = +m[1] * 3600 + +m[2] * 60 + +(m[3] || 0);
  return v < 86400 ? v : null;
}

export const pad2 = (n) => String(n).padStart(2, '0');
