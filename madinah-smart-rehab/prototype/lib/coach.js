// The "smart camera": everything that turns raw pose landmarks into coaching.
// Pure, DOM-free, so tests/coach.test.mjs can exercise it in Node.
//  - one-euro smoothing (low lag while moving, low jitter while still)
//  - a framing coach: is someone there, is the leg in frame, distance, side vs front view,
//    camera obliquity (from 3D world landmarks), light, phone tilt, which leg is nearer
//  - auto-start: "ready" once the frame has been good for a while
//  - held peak (the highest angle sustained, not a one-frame spike)
//  - rep quality and a confidence score the clinician can trust
import { LEG, otherSide, legIds, legVisibility } from './pose.js';

const DEG = 180 / Math.PI;
const fin = Number.isFinite;

/* ---------- smoothing ---------- */
/** One Euro filter (Casiez, Roussel & Vogel 2012). t in milliseconds. */
export function createOneEuro({ minCutoff = 1.2, beta = 0.03, dCutoff = 1.0 } = {}) {
  let xPrev = NaN; let dxPrev = 0; let tPrev = NaN;
  const alpha = (cutoff, dt) => { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); };
  return {
    push(x, t) {
      if (!fin(x)) return xPrev;
      if (!fin(xPrev) || !fin(t) || !fin(tPrev) || t <= tPrev) { xPrev = x; tPrev = fin(t) ? t : tPrev; dxPrev = 0; return x; }
      const dt = Math.max(1e-3, (t - tPrev) / 1000);
      tPrev = t;
      const dx = (x - xPrev) / dt;
      const ad = alpha(dCutoff, dt);
      dxPrev = ad * dx + (1 - ad) * dxPrev;
      const a = alpha(minCutoff + beta * Math.abs(dxPrev), dt);
      xPrev = a * x + (1 - a) * xPrev;
      return xPrev;
    },
    get value() { return xPrev; },
    reset() { xPrev = NaN; dxPrev = 0; tPrev = NaN; },
  };
}

/* ---------- held peak ---------- */
/**
 * Highest value that was sustained for a whole window (rolling minimum, then its maximum), so a
 * single noisy frame at 140° never becomes "your best flexion".
 */
export function createHoldTracker({ windowMs = 700 } = {}) {
  const buf = []; // [{ t, v }]
  let max = -Infinity;
  return {
    push(v, t) {
      if (!fin(v) || !fin(t)) return fin(max) ? max : NaN;
      buf.push({ t, v });
      while (buf.length && t - buf[0].t > windowMs) buf.shift();
      if (buf.length > 1 && t - buf[0].t >= windowMs * 0.9) {
        let m = Infinity;
        for (const b of buf) m = Math.min(m, b.v);
        max = Math.max(max, m);
      }
      return fin(max) ? max : NaN;
    },
    get max() { return fin(max) ? max : NaN; },
    reset() { buf.length = 0; max = -Infinity; },
  };
}

/* ---------- geometry from 3D world landmarks ---------- */
/**
 * How much each leg segment points toward or away from the camera, in degrees (0 = parallel to the
 * screen, 90 = pointing straight at it). A side view of the knee is only true to the real angle
 * when both are small; MediaPipe's world landmarks (metres, hip-centred) give the depth.
 */
export function segmentObliquity(world, side = 'R') {
  const l = LEG[side] || LEG.R;
  const seg = (a, b) => {
    const A = world && world[a]; const B = world && world[b];
    if (!A || !B || !fin(A.z) || !fin(B.z)) return NaN;
    const dx = B.x - A.x; const dy = B.y - A.y; const dz = B.z - A.z;
    const len = Math.hypot(dx, dy, dz);
    return len > 1e-6 ? Math.asin(Math.min(1, Math.abs(dz) / len)) * DEG : NaN;
  };
  const thigh = seg(l.hip, l.knee); const shank = seg(l.knee, l.ankle);
  const vals = [thigh, shank].filter(fin);
  return { thigh, shank, max: vals.length ? Math.max(...vals) : NaN };
}

/** Which leg is nearer the camera (smaller world z), or null when it is not clear. */
export function nearerLeg(world, minGap = 0.05) {
  if (!world) return null;
  const z = (side) => {
    const ids = legIds(side).map((i) => world[i]).filter((p) => p && fin(p.z));
    return ids.length === 3 ? ids.reduce((a, p) => a + p.z, 0) / 3 : NaN;
  };
  const r = z('R'); const l = z('L');
  if (!fin(r) || !fin(l) || Math.abs(r - l) < minGap) return null;
  return r < l ? 'R' : 'L';
}

/** Shoulder (or hip) width relative to trunk length: ~0 in a true side view, ~0.5–0.7 facing the camera. */
export function facingRatio(lm, w = 1, h = 1) {
  if (!lm) return NaN;
  const P = (i) => (lm[i] && fin(lm[i].x) ? { x: lm[i].x * w, y: lm[i].y * h } : null);
  const sL = P(11); const sR = P(12); const hL = P(23); const hR = P(24);
  if (!sL || !sR || !hL || !hR) return NaN;
  const trunk = Math.hypot((sL.x + sR.x) / 2 - (hL.x + hR.x) / 2, (sL.y + sR.y) / 2 - (hL.y + hR.y) / 2);
  if (trunk < 1e-6) return NaN;
  const width = Math.max(Math.abs(sL.x - sR.x), Math.abs(hL.x - hR.x));
  return width / trunk;
}

/** Deviation (degrees) of the phone from standing upright, portrait or landscape, from DeviceOrientation beta/gamma. */
export function uprightError(beta, gamma) {
  if (!fin(beta) || !fin(gamma)) return NaN;
  const portrait = Math.max(Math.abs(Math.abs(beta) - 90), Math.abs(gamma));
  const landscape = Math.max(Math.abs(beta), Math.abs(Math.abs(gamma) - 90));
  return Math.min(portrait, landscape);
}

/* ---------- framing coach ---------- */
export const COACH_TEXT = {
  none: { text: 'لا يظهر أحد في الكاميرا — ابتعد حتى يظهر جسمك كاملًا', tone: 'warn' },
  leg: { text: 'تأكد أن الساق كاملة ظاهرة من الورك إلى الكاحل', tone: 'warn' },
  edge: { text: 'جزء من ساقك خارج الصورة — ابتعد قليلًا أو حرّك الجوال', tone: 'warn' },
  far: { text: 'اقترب قليلًا من الكاميرا', tone: 'warn' },
  near: { text: 'ابتعد قليلًا عن الكاميرا', tone: 'warn' },
  face: { text: 'اقلب جسمك: الكاميرا لازم تشوفك من الجانب', tone: 'warn' },
  side: { text: 'واجه الكاميرا بجسمك كاملًا', tone: 'warn' },
  swap: { text: 'اجعل ركبتك المصابة هي الأقرب للكاميرا', tone: 'warn' },
  oblique: { text: 'حرّك الجوال حتى تكون ساقك موازية للشاشة', tone: 'warn' },
  dark: { text: 'الإضاءة ضعيفة — شغّل النور أو اقترب من النافذة', tone: 'warn' },
  bright: { text: 'الضوء قوي خلفك — غيّر مكان الجوال', tone: 'warn' },
  tilt: { text: 'الجوال مايل — عدّله حتى يقف مستقيمًا', tone: 'warn' },
  shaky: { text: 'ثبّت الجوال على شيء ثابت', tone: 'warn' },
  ok: { text: 'الوضع ممتاز', tone: 'ok' },
};
export const COACH_SPEECH = {
  none: 'ابتعد حتى يظهر جسمك', leg: 'خلّ الساق كاملة ظاهرة', edge: 'ابتعد شوي', far: 'اقترب شوي', near: 'ابتعد شوي',
  face: 'اقلب جسمك على جنبك', side: 'واجه الكاميرا', swap: 'خلّ الركبة المصابة أقرب للكاميرا', oblique: 'عدّل مكان الجوال',
  dark: 'الإضاءة ضعيفة', bright: 'الضوء قوي', tilt: 'عدّل الجوال', shaky: 'ثبّت الجوال', ok: 'ممتاز',
};

/**
 * One frame → the single most useful instruction. Priority order matters: fix presence before
 * distance, distance before orientation, orientation before light.
 * opts: { lm, world, w, h, side, view: 'side'|'front', need, luma, tilt, jitter, minVisibility }
 */
export function assessFrame({ lm, world, w = 1, h = 1, side = 'R', view = 'side', need, luma, tilt, jitter, minVisibility = 0.5 } = {}) {
  const out = (code, extra = {}) => ({ code, ok: code === 'ok', ...COACH_TEXT[code], ...extra });
  if (!lm) return out('none');
  const ids = need || legIds(side);
  const vis = legVisibility(lm, side);
  if (vis < minVisibility) return out('leg', { vis });
  const pts = ids.map((i) => lm[i]).filter((p) => p && fin(p.x) && fin(p.y));
  if (pts.length !== ids.length) return out('leg', { vis });
  const margin = 0.03;
  if (pts.some((p) => p.x < margin || p.x > 1 - margin || p.y < margin || p.y > 1 - margin)) return out('edge', { vis });
  const l = LEG[side] || LEG.R;
  const hip = lm[l.hip]; const ankle = lm[l.ankle];
  const span = Math.hypot((hip.x - ankle.x) * w, (hip.y - ankle.y) * h) / Math.max(1, Math.min(w, h));
  if (span < 0.28) return out('far', { span });
  if (span > 0.95) return out('near', { span });
  const ratio = facingRatio(lm, w, h);
  if (view === 'side' && fin(ratio) && ratio > 0.5) return out('face', { ratio });
  if (view === 'front' && fin(ratio) && ratio < 0.22) return out('side', { ratio });
  if (view === 'side' && world) {
    const near = nearerLeg(world);
    if (near && near !== side) return out('swap', { near });
    const ob = segmentObliquity(world, side);
    if (fin(ob.max) && ob.max > 35) return out('oblique', { obliquity: ob.max });
  }
  if (fin(luma) && luma < 45) return out('dark', { luma });
  if (fin(luma) && luma > 235) return out('bright', { luma });
  if (fin(tilt) && tilt > 22) return out('tilt', { tilt });
  if (fin(jitter) && jitter > 0.02) return out('shaky', { jitter });
  return out('ok', { vis, span, ratio });
}

/**
 * Stateful coach: debounces messages so they do not flicker, and reports `ready` once the frame
 * has stayed good for holdMs. push(assessment, t) → { code, text, tone, ok, ready, readyFor }.
 */
export function createCoach({ holdMs = 1500, settleMs = 350 } = {}) {
  let shown = null; let candidate = null; let candidateSince = NaN; let okSince = NaN;
  return {
    push(a, t) {
      if (a.code !== candidate) { candidate = a.code; candidateSince = t; }
      if (shown === null || a.code === 'ok' || t - candidateSince >= settleMs) shown = a.code;
      if (a.ok) { if (!fin(okSince)) okSince = t; } else okSince = NaN;
      const readyFor = fin(okSince) ? t - okSince : 0;
      return { ...COACH_TEXT[shown], code: shown, ok: shown === 'ok', ready: readyFor >= holdMs, readyFor };
    },
    reset() { shown = null; candidate = null; candidateSince = NaN; okSince = NaN; },
  };
}

/* ---------- rep quality ---------- */
/**
 * reps: [{ peak, dur }] from the rep counter. target: the angle a full rep should reach (optional).
 * Each rep gets q: 'full' | 'low' (short of target) | 'fast' (too quick to be controlled).
 */
export function rateReps(reps, { target, minDur = 1.2 } = {}) {
  return (reps || []).map((r) => {
    let q = 'full';
    if (fin(r.dur) && r.dur < minDur) q = 'fast';
    else if (fin(target) && fin(r.peak) && r.peak < target * 0.85) q = 'low';
    return { ...r, q };
  });
}

export const REP_Q_AR = { full: 'كاملة', low: 'قصيرة', fast: 'سريعة' };

/* ---------- confidence ---------- */
const clamp01 = (v) => Math.max(0, Math.min(1, v));
/**
 * How far to trust a home session, 0–100, with the reasons that cost points.
 * usedFrac: frames with the leg visible / all frames; meanVis: mean landmark visibility;
 * obliquity: mean segment obliquity in degrees; jitter: mean |Δangle| per frame after smoothing.
 */
export function scoreConfidence({ usedFrac, meanVis, obliquity, jitter, frames = 0 } = {}) {
  const parts = [];
  const reasons = [];
  const add = (w, v, reason) => { parts.push({ w, v }); if (v < 0.6 && reason) reasons.push(reason); };
  add(0.25, fin(usedFrac) ? clamp01((usedFrac - 0.4) / 0.5) : 0, 'الساق لم تظهر بوضوح في جزء كبير من الجلسة');
  add(0.25, fin(meanVis) ? clamp01((meanVis - 0.5) / 0.4) : 0, 'ثقة التعرف على المفاصل منخفضة (إضاءة أو ملابس فضفاضة)');
  add(0.3, fin(obliquity) ? clamp01(1 - (obliquity - 10) / 20) : 0.6, 'زاوية الكاميرا لم تكن جانبية تمامًا');
  add(0.2, fin(jitter) ? clamp01(1 - (jitter - 1.2) / 4) : 0.6, 'الصورة مهزوزة أو القراءة متذبذبة');
  if (frames && frames < 45) reasons.push('الجلسة قصيرة جدًا');
  const score = Math.round(100 * parts.reduce((a, p) => a + p.w * p.v, 0) / parts.reduce((a, p) => a + p.w, 0)) - (frames && frames < 45 ? 20 : 0);
  const s = Math.max(0, Math.min(100, score));
  return { score: s, level: s >= 75 ? 'high' : s >= 50 ? 'medium' : 'low', reasons };
}
export const CONF_AR = { high: 'موثوقية عالية', medium: 'موثوقية متوسطة', low: 'موثوقية منخفضة' };

/* ---------- Arabic voice (Web Speech API) ---------- */
/** Speaks short Arabic cues; silent where speech is unavailable. Rate-limited per message. */
export function createVoice({ lang = 'ar-SA', minGapMs = 900 } = {}) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  let enabled = Boolean(synth);
  let lastAt = 0; let lastText = '';
  const pickVoice = () => {
    try {
      const vs = synth.getVoices() || [];
      return vs.find((v) => /^ar[-_]SA/i.test(v.lang)) || vs.find((v) => /^ar/i.test(v.lang)) || null;
    } catch { return null; }
  };
  return {
    get available() { return Boolean(synth); },
    get enabled() { return enabled; },
    set enabled(v) { enabled = Boolean(v) && Boolean(synth); if (!enabled && synth) { try { synth.cancel(); } catch { /* ignore */ } } },
    hasArabicVoice() { return Boolean(synth && pickVoice()); },
    say(text, { force = false, interrupt = false } = {}) {
      if (!enabled || !synth || !text) return false;
      const now = Date.now();
      if (!force && (now - lastAt < minGapMs || (text === lastText && now - lastAt < 4000))) return false;
      try {
        if (interrupt) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang; u.rate = 1.0; u.pitch = 1.0;
        const v = pickVoice();
        if (v) u.voice = v;
        synth.speak(u);
        lastAt = now; lastText = text;
        return true;
      } catch { return false; }
    },
    stop() { if (synth) { try { synth.cancel(); } catch { /* ignore */ } } },
  };
}

/** Arabic word for small counts (1–20), falling back to digits. */
const AR_NUM = ['صفر', 'واحد', 'اثنين', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر', 'عشرين'];
export function arabicCount(n) { return AR_NUM[n] || String(n); }

/** The flexion a live session should aim for: the next gate's threshold, else a little past the last best. */
export function flexTarget({ results = [], contralateral, lastFlex } = {}) {
  for (const r of results) {
    const c = r.c || r;
    if (c.metric === 'flex' && fin(c.target)) return { value: c.target, why: 'معيار المرحلة القادمة' };
    if (c.metric === 'flexDiffOther' && fin(contralateral) && fin(c.target)) return { value: contralateral - c.target, why: 'حدود 10° من الطرف السليم' };
    if (c.metric === 'flexPctOther' && fin(contralateral) && fin(c.target)) return { value: Math.round(contralateral * c.target / 100), why: `${c.target}% من الطرف السليم` };
  }
  if (fin(lastFlex)) return { value: Math.min(150, lastFlex + 5), why: 'أفضل من آخر قياس بخمس درجات' };
  return null;
}
