// Small shared helpers: dates, numbers, seeded randomness, clipboard.

const DAY = 86400000;

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export const TODAY = startOfDay();
export function addDays(d, n) { return new Date(startOfDay(d).getTime() + n * DAY); }
export function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / DAY); }

const LOCALE = 'ar-SA-u-nu-latn-ca-gregory';
const fmtCache = {};
function fmt(opts) {
  const key = JSON.stringify(opts);
  if (!fmtCache[key]) {
    try { fmtCache[key] = new Intl.DateTimeFormat(LOCALE, opts); }
    catch { fmtCache[key] = new Intl.DateTimeFormat('ar', opts); }
  }
  return fmtCache[key];
}
export function fmtDate(d) { return fmt({ day: 'numeric', month: 'long' }).format(d); }
export function fmtDateLong(d) { return fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(d); }
export function fmtWeekday(d) { return fmt({ weekday: 'long' }).format(d); }
export function fmtShort(d) { return fmt({ day: 'numeric', month: 'short' }).format(d); }
export function fmtTime(h, m = 0) {
  const ampm = h < 12 ? 'ص' : 'م';
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}
export function fmtDateTime(ts) {
  const d = new Date(ts);
  return `${fmtShort(d)} · ${fmtTime(d.getHours(), d.getMinutes())}`;
}
export function relDay(n) {
  if (n === 0) return 'اليوم';
  if (n === 1) return 'غدًا';
  if (n === -1) return 'أمس';
  if (n > 1 && n <= 10) return `بعد ${n} ${n <= 10 ? 'أيام' : 'يومًا'}`;
  if (n < -1 && n >= -10) return `قبل ${-n} ${-n <= 10 ? 'أيام' : 'يومًا'}`;
  return n > 0 ? `بعد ${n} يومًا` : `قبل ${-n} يومًا`;
}
export function weeksLabel(day) {
  const w = Math.floor(day / 7);
  const d = day % 7;
  return d ? `الأسبوع ${w + 1}` : `الأسبوع ${Math.max(1, w)}`;
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const round = (v, p = 0) => { const f = 10 ** p; return Math.round(v * f) / f; };
export const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN);
export const last = (arr) => (arr && arr.length ? arr[arr.length - 1] : undefined);
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export function linreg(points) {
  // points: [{x, y}] -> {slope, intercept}
  const n = points.length;
  if (n < 2) return null;
  const mx = mean(points.map((p) => p.x));
  const my = mean(points.map((p) => p.y));
  let num = 0;
  let den = 0;
  for (const p of points) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  if (!den) return null;
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

// Deterministic PRNG so the demo looks the same on every open.
export function rng(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function noise(r, amp) { return (r() * 2 - 1) * amp; }

let uidCounter = 0;
export function uid(prefix = 'id') {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

export async function copyText(text, fallbackEl) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallbackEl) {
      const range = document.createRange();
      range.selectNodeContents(fallbackEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return false;
  }
}

export const storage = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};
