// Pose estimation for the measurement lab.
// 1) A lazy, single MediaPipe Pose Landmarker shared by every tool (runs in the browser via WASM;
//    frames never leave the device).
// 2) Pure, DOM-free knee-angle math used by the live camera, recorded video and photo tools, and
//    by tests/pose.test.mjs.
// Landmark ids follow MediaPipe, which labels the subject's OWN left/right:
//   right hip/knee/ankle = 24/26/28, left = 23/25/27.

const MP_VERSION = '1.0.1';
const MP_CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}`;
const VISION_URL = `${MP_CDN}/vision_bundle.mjs`;
const CDN_WASM = `${MP_CDN}/wasm`;
const CDN_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
// Optional self-hosted copies (not committed — too large). Same place as './vendor/mediapipe/…'
// next to index.html; resolved from this module so test pages in sub-folders find them too.
const LOCAL_VISION = 'vendor/mediapipe/vision_bundle.mjs';
const LOCAL_WASM = 'vendor/mediapipe/wasm';
const LOCAL_MODEL = 'vendor/mediapipe/pose_landmarker_lite.task';

export const LEG = {
  R: { shoulder: 12, hip: 24, knee: 26, ankle: 28, heel: 30, toe: 32 },
  L: { shoulder: 11, hip: 23, knee: 25, ankle: 27, heel: 29, toe: 31 },
};
export const otherSide = (side) => (side === 'L' ? 'R' : 'L');
export const legIds = (side) => { const l = LEG[side] || LEG.R; return [l.hip, l.knee, l.ankle]; };

// Body outline drawn on the overlay (face points left out on purpose).
export const POSE_LINKS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31], [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
];

/* ---------- errors ---------- */
const MESSAGES = {
  unsupported: 'متصفحك لا يدعم التحليل داخل الجهاز. ضع النقاط بيدك أو جرّب متصفحًا أحدث.',
  load: 'تعذّر تحميل أداة التعرف على الجسم. تأكد من الإنترنت، أو ضع النقاط بيدك.',
  wasm: 'تعذّر تشغيل أداة التعرف على هذا الجهاز. ضع النقاط بيدك.',
  model: 'تعذّر تحميل نموذج التعرف على الجسم. ضع النقاط بيدك.',
  timeout: 'التحميل أخذ وقتًا أطول من المتوقع. تأكد من الإنترنت وحاول مرة ثانية، أو ضع النقاط بيدك.',
  mode: 'أداة التعرف مشغولة بقياس آخر. أغلقه وحاول مرة ثانية.',
  detect: 'تعذّر تحليل هذه الصورة. ضع النقاط بيدك.',
};
export function poseError(code, cause) {
  return { code, message: MESSAGES[code] || MESSAGES.load, cause };
}
const isPoseError = (e) => e && typeof e === 'object' && typeof e.code === 'string' && typeof e.message === 'string' && MESSAGES[e.code];

/* ---------- loader (singleton) ---------- */
let inflight = null; // the actual download/compile; survives a timeout so a retry can reuse it
let pending = null; // inflight wrapped with the user-facing timeout
let ready = false;

function localUrl(rel) {
  try {
    const u = new URL(`../${rel}`, import.meta.url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch { /* fall through */ }
  try { return new URL(`./${rel}`, document.baseURI).href; } catch { return `./${rel}`; }
}
async function exists(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    return r.ok && !/text\/html/i.test(r.headers.get('content-type') || '');
  } catch { return false; }
}
async function modelSource() {
  try {
    const r = await fetch(localUrl(LOCAL_MODEL));
    if (r.ok && !/text\/html/i.test(r.headers.get('content-type') || '')) {
      const buf = new Uint8Array(await r.arrayBuffer());
      if (buf.byteLength > 100000) return { opts: { modelAssetBuffer: buf }, src: 'local' };
    }
  } catch { /* try the base64 copy */ }
  // Hosts that serve only web file types (the Claude artifact viewer) get the same model as a
  // base64 ES module next to it: `export default '<base64>'`.
  try {
    const mod = await import(localUrl(`${LOCAL_MODEL}.js`));
    if (typeof mod.default === 'string' && mod.default.length > 100000) {
      const bin = atob(mod.default);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return { opts: { modelAssetBuffer: buf }, src: 'local' };
    }
  } catch { /* use the CDN copy */ }
  return { opts: { modelAssetPath: CDN_MODEL }, src: 'cdn' };
}
function withTimeout(promise, ms) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(poseError('timeout')), ms); })])
    .finally(() => clearTimeout(t));
}

// MediaPipe ≥ 1.0 posts anonymous usage statistics (task name, call counts, latency — no images or
// landmarks) to this endpoint every minute, with no public switch to turn it off. This health app
// promises that analysis stays on the device, so that one URL is answered locally with a 204; the
// library then stops trying. Every other request goes to the real fetch untouched.
const MP_TELEMETRY = 'https://odml.pa.googleapis.com/v1/log';
function muteMediapipeTelemetry() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function' || window.fetch.msrMuted) return;
  const realFetch = window.fetch;
  const guarded = function fetch(input, init) {
    const url = typeof input === 'string' ? input : (input && (input.href || input.url)) || '';
    if (url.startsWith(MP_TELEMETRY)) return Promise.resolve(new Response(null, { status: 204 }));
    return realFetch.call(window, input, init);
  };
  guarded.msrMuted = true;
  window.fetch = guarded;
}

const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
// A failed <script>/fetch (flaky mobile data) is worth one more try before giving up on a delegate.
const networkish = (e) => (typeof Event !== 'undefined' && e instanceof Event) || /fetch|network|load|script/i.test(String((e && e.message) || e));

async function create() {
  if (typeof WebAssembly !== 'object' || typeof document === 'undefined') throw poseError('unsupported');
  muteMediapipeTelemetry();
  let vision;
  try { vision = await import(localUrl(LOCAL_VISION)); } catch { /* use the CDN copy */ }
  if (!vision) {
    try { vision = await import(VISION_URL); } catch {
      await sleep(800);
      try { vision = await import(`${VISION_URL}?retry=1`); } catch (e) { throw poseError('load', e); }
    }
  }
  const local = localUrl(LOCAL_WASM);
  const wasmBase = (await exists(`${local}/vision_wasm_internal.wasm`)) ? local : CDN_WASM;
  let fileset;
  try { fileset = await vision.FilesetResolver.forVisionTasks(wasmBase); } catch (e) { throw poseError('wasm', e); }
  const model = await modelSource();
  const order = globalThis.MSR_POSE_DELEGATE === 'CPU' ? ['CPU'] : ['GPU', 'CPU'];
  let lastErr;
  for (const delegate of order) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let landmarker;
      try {
        landmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { ...model.opts, delegate },
          runningMode: 'IMAGE', numPoses: 1,
          minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
        });
        // A GPU context can be created yet fail on first use; prove it on a blank frame.
        const probe = document.createElement('canvas');
        probe.width = 64; probe.height = 64;
        landmarker.detect(probe);
        return { landmarker, mode: 'IMAGE', delegate, wasm: wasmBase === CDN_WASM ? 'cdn' : 'local', model: model.src, lastTs: 0, api: null };
      } catch (e) {
        lastErr = e;
        try { if (landmarker) landmarker.close(); } catch { /* ignore */ }
        if (!networkish(e)) break; // a real GPU failure: move on to CPU
        await sleep(800);
      }
    }
  }
  throw poseError(networkish(lastErr) ? 'load' : 'model', lastErr);
}

function makeApi(inst) {
  const need = (mode) => { if (inst.mode !== mode) throw poseError('mode'); };
  const first = (res) => (res && res.landmarks && res.landmarks[0]) || null;
  return {
    get delegate() { return inst.delegate; },
    get source() { return { wasm: inst.wasm, model: inst.model }; },
    get mode() { return inst.mode; },
    /** IMAGE mode: 33 normalized landmarks of the first person, or null. */
    detect(image) {
      need('IMAGE');
      try { return first(inst.landmarker.detect(image)); } catch (e) { throw poseError('detect', e); }
    },
    /** VIDEO mode: timestamps are kept strictly increasing across every caller. */
    detectForVideo(frame, ts) {
      need('VIDEO');
      const t = Math.max(Math.round(Number.isFinite(ts) ? ts : performance.now()), inst.lastTs + 1);
      inst.lastTs = t;
      try { return first(inst.landmarker.detectForVideo(frame, t)); } catch (e) { throw poseError('detect', e); }
    },
    /** A timestamp origin safely after every frame already sent. */
    now() { return Math.max(performance.now(), inst.lastTs + 1); },
  };
}

/**
 * Load (once) and return the shared pose detector in the requested running mode ('IMAGE' | 'VIDEO').
 * Rejects with { code, message } where message is Arabic and safe to show.
 */
export async function loadPose(runningMode = 'IMAGE') {
  if (!pending) {
    // ~17 MB on first use (WASM + model), so slow mobile data gets two minutes; after a timeout the
    // download keeps going and the next attempt picks it up instead of starting over.
    if (!inflight) inflight = create().then((inst) => { ready = true; return inst; }, (e) => { inflight = null; throw e; });
    pending = withTimeout(inflight, 120000).catch((e) => {
      pending = null;
      throw isPoseError(e) ? e : poseError('load', e);
    });
  }
  const inst = await pending;
  if (inst.mode !== runningMode) {
    try { await inst.landmarker.setOptions({ runningMode }); inst.mode = runningMode; } catch (e) { throw poseError('mode', e); }
  }
  if (!inst.api) inst.api = makeApi(inst);
  return inst.api;
}
/** True once the detector is ready (the next call answers without downloading). */
export function poseLoaded() { return ready; }

/* ---------- pure geometry (no DOM) ---------- */
const DEG = 180 / Math.PI;
const finite = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y);

function pt(lm, i, w, h) {
  const p = lm && lm[i];
  return finite(p) ? { x: p.x * w, y: p.y * h } : null;
}

/** Interior angle at b (degrees) for points {x, y}. */
export function angleAt(a, b, c) {
  if (!finite(a) || !finite(b) || !finite(c)) return NaN;
  const ux = a.x - b.x; const uy = a.y - b.y; const vx = c.x - b.x; const vy = c.y - b.y;
  const nu = Math.hypot(ux, uy); const nv = Math.hypot(vx, vy);
  if (!nu || !nv) return NaN;
  const cos = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (nu * nv)));
  return Math.acos(cos) * DEG;
}

/** Knee flexion from hip, knee, ankle points: 180 − interior angle (straight leg ≈ 0). */
export function flexionFromPoints(hip, knee, ankle) {
  const a = angleAt(hip, knee, ankle);
  return Number.isFinite(a) ? 180 - a : NaN;
}

/**
 * Knee flexion of one leg from normalized landmarks. w/h are the frame size in pixels, so the
 * angle is measured in true (aspect-correct) pixel space.
 */
export function kneeFlexion(lm, side = 'R', w = 1, h = 1) {
  const l = LEG[side] || LEG.R;
  return flexionFromPoints(pt(lm, l.hip, w, h), pt(lm, l.knee, w, h), pt(lm, l.ankle, w, h));
}

/** Hip flexion (thigh relative to trunk): 0 lying flat, ~40 with the leg raised 40°. */
export function hipFlexion(lm, side = 'R', w = 1, h = 1) {
  const l = LEG[side] || LEG.R;
  return flexionFromPoints(pt(lm, l.shoulder, w, h), pt(lm, l.hip, w, h), pt(lm, l.knee, w, h));
}

/**
 * Frontal-plane projection angle from three points (front view).
 * Magnitude = 180 − interior knee angle; positive when the knee sits medial to the hip–ankle line
 * (valgus), negative when lateral (varus). medialSign: +1 if "toward the midline" is +x in the image.
 */
export function fppaFromPoints(hip, knee, ankle, medialSign = 1) {
  const mag = flexionFromPoints(hip, knee, ankle);
  if (!Number.isFinite(mag)) return NaN;
  const dy = ankle.y - hip.y;
  const t = Math.abs(dy) > 1e-9 ? (knee.y - hip.y) / dy : 0.5;
  const lineX = hip.x + (ankle.x - hip.x) * t;
  const off = (knee.x - lineX) * (medialSign < 0 ? -1 : 1);
  return off >= 0 ? mag : -mag;
}

/** FPPA of one leg from landmarks; the midline direction comes from the other hip. */
export function fppa(lm, side = 'R', w = 1, h = 1) {
  const l = LEG[side] || LEG.R;
  const o = LEG[otherSide(side)];
  const H = pt(lm, l.hip, w, h); const K = pt(lm, l.knee, w, h); const A = pt(lm, l.ankle, w, h);
  if (!H || !K || !A) return NaN;
  const OH = pt(lm, o.hip, w, h);
  const medial = OH && Math.abs(OH.x - H.x) > 1e-9 ? Math.sign(OH.x - H.x) : (side === 'R' ? 1 : -1);
  return fppaFromPoints(H, K, A, medial);
}

/** True when every id is present, inside the frame and at least `min` visible. */
export function visibleEnough(lm, ids, min = 0.5) {
  if (!lm || !ids || !ids.length) return false;
  return ids.every((i) => {
    const p = lm[i];
    if (!finite(p)) return false;
    if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05) return false;
    const v = p.visibility;
    return v === undefined || v === null ? true : v >= min;
  });
}

/** Lowest visibility of a leg's hip/knee/ankle (1 when the model gives none). */
export function legVisibility(lm, side) {
  if (!lm) return 0;
  return Math.min(...legIds(side).map((i) => {
    const p = lm[i];
    if (!finite(p)) return 0;
    return p.visibility === undefined || p.visibility === null ? 1 : p.visibility;
  }));
}

/**
 * Which leg to read from a photo. Prefers the operated side; if the model clearly sees only the
 * other leg (side photos are sometimes mislabeled), uses that one and says so.
 */
export function pickLeg(lm, side = 'R', min = 0.5) {
  if (!lm) return null;
  const own = legVisibility(lm, side);
  const oth = legVisibility(lm, otherSide(side));
  if (own < min && oth >= min && oth - own > 0.15) return { side: otherSide(side), swapped: true, confident: true, visibility: oth };
  if (own >= 0.2) return { side, swapped: false, confident: own >= min, visibility: own };
  return null;
}

export function median(arr) {
  const v = (arr || []).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return NaN;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN);

/**
 * Repetition counter with hysteresis and an adaptive range.
 * A rep counts when the signal rises above the high threshold and then falls below the low one.
 * Thresholds sit at hiFrac / loFrac of the recent range (lowest → highest value), which adapts:
 * the floor creeps up slowly and the ceiling decays slowly while resting, and is frozen during a
 * rep so long holds at the top never count. The range never shrinks below minRange (noise guard).
 */
export function createRepCounter({
  minRange = 20, hiFrac = 0.65, loFrac = 0.35, riseFloorPerSec = 1, decayPerSec = 3, fps = 30, rearmSec = 20,
} = {}) {
  let lo = NaN; let hi = NaN; let phase = 'low'; let count = 0; let peak = -Infinity; let lastT = null; let heldFor = 0;
  const peaks = [];
  const th = () => {
    const range = Math.max(hi - lo, minRange);
    return { high: lo + hiFrac * range, low: lo + loFrac * range };
  };
  const snap = (counted) => ({ count, counted, phase, ...(Number.isFinite(lo) ? th() : { high: NaN, low: NaN }), peak: phase === 'high' ? peak : NaN });
  return {
    push(v, t) {
      if (!Number.isFinite(v)) return snap(false);
      let dt = 1 / fps;
      if (Number.isFinite(t)) {
        if (lastT !== null) dt = Math.min(1, Math.max(0, (t - lastT) / 1000));
        lastT = t;
      }
      if (!Number.isFinite(lo)) { lo = v; hi = v + minRange; }
      let counted = false;
      if (phase === 'low') {
        lo = Math.min(v, lo + riseFloorPerSec * dt);
        hi = Math.max(v, hi - decayPerSec * dt, lo + minRange);
        if (v > th().high) { phase = 'high'; peak = v; heldFor = 0; }
      } else {
        hi = Math.max(hi, v);
        peak = Math.max(peak, v);
        heldFor += dt;
        if (v < th().low) {
          count += 1; counted = true; peaks.push(peak);
          phase = 'low'; peak = -Infinity;
        } else if (heldFor > rearmSec) {
          // Stuck high (e.g. the baseline moved): re-arm without counting.
          phase = 'low'; lo = v; hi = v + minRange; peak = -Infinity;
        }
      }
      return snap(counted);
    },
    get count() { return count; },
    get peaks() { return peaks.slice(); },
    get phase() { return phase; },
    reset() { lo = NaN; hi = NaN; phase = 'low'; count = 0; peak = -Infinity; lastT = null; heldFor = 0; peaks.length = 0; },
  };
}

const REP_PRESETS = {
  rom: { minRange: 20 }, // knee flexion, degrees (heel slides, seated flexion)
  squat: { minRange: 15 }, // knee flexion, degrees
  slr: { minRange: 15 }, // hip flexion (leg lift), degrees
  valgus: { minRange: 6 }, // hip drop, % of standing hip height
};

/**
 * Turns a stream of landmark frames into the numbers a tool shows. Same code for the live camera
 * and for recorded video. kind: 'rom' | 'squat' | 'slr' | 'valgus'.
 *  - every frame: knee flexion smoothed with a median of the last 5 values
 *  - rom: session max flexion, best extension (lowest flexion), reps
 *  - squat: reps with depth (peak flexion) per rep
 *  - slr: reps from hip flexion; extensor lag = knee flexion while lifted − resting knee flexion
 *  - valgus (front view): reps from hip drop; FPPA peak per rep
 */
export function createAnalyzer({ kind = 'rom', side = 'R', minVisibility = 0.5, fps = 30 } = {}) {
  const l = LEG[side] || LEG.R;
  const need = kind === 'slr' ? [l.shoulder, l.hip, l.knee, l.ankle] : [l.hip, l.knee, l.ankle];
  const counter = createRepCounter({ ...(REP_PRESETS[kind] || REP_PRESETS.rom), fps });
  const win = { knee: [], sig: [], fppa: [] };
  const s = {
    frames: 0, used: 0, maxFlex: -Infinity, minFlex: Infinity,
    rest: [], lagNow: -Infinity, lags: [], fppaNow: -Infinity, fppaReps: [], fppaMax: -Infinity, fppaMin: Infinity,
    refH: NaN, lastT: null, current: null,
  };
  const smooth = (key, v) => {
    if (Number.isFinite(v)) { win[key].push(v); if (win[key].length > 5) win[key].shift(); }
    return median(win[key]);
  };
  function push(lm, w = 1, h = 1, t) {
    s.frames += 1;
    const dt = Number.isFinite(t) && s.lastT !== null ? Math.max(0, (t - s.lastT) / 1000) : 1 / fps;
    if (Number.isFinite(t)) s.lastT = t;
    if (!lm) { s.current = { visible: false, reason: 'none', count: counter.count }; return s.current; }
    if (!visibleEnough(lm, need, minVisibility)) { s.current = { visible: false, reason: 'leg', count: counter.count }; return s.current; }
    s.used += 1;
    const knee = smooth('knee', kneeFlexion(lm, side, w, h));
    const frame = { visible: true, knee };
    let signal = knee;
    if (kind === 'slr') { signal = smooth('sig', hipFlexion(lm, side, w, h)); frame.hip = signal; }
    if (kind === 'valgus') {
      frame.fppa = smooth('fppa', fppa(lm, side, w, h));
      const height = (lm[l.ankle].y - lm[l.hip].y) * h; // hip height above the ankle, px
      s.refH = Number.isFinite(s.refH) ? Math.max(height, s.refH * (1 - 0.02 * dt)) : height;
      signal = smooth('sig', s.refH > 0 ? 100 * (1 - height / s.refH) : NaN);
      frame.depth = signal;
    }
    const r = counter.push(signal, t);
    frame.count = r.count; frame.counted = r.counted; frame.phase = r.phase;
    if (Number.isFinite(knee)) { s.maxFlex = Math.max(s.maxFlex, knee); s.minFlex = Math.min(s.minFlex, knee); }
    if (kind === 'slr' && Number.isFinite(knee)) {
      if (r.phase === 'high') s.lagNow = Math.max(s.lagNow, knee);
      else if (!r.counted) { s.rest.push(knee); if (s.rest.length > 90) s.rest.shift(); }
      if (r.counted) {
        const rest = median(s.rest);
        s.lags.push(Math.max(0, s.lagNow - (Number.isFinite(rest) ? rest : 0)));
        s.lagNow = -Infinity;
      }
      const rest = median(s.rest);
      frame.lag = r.phase === 'high' ? Math.max(0, knee - (Number.isFinite(rest) ? rest : 0)) : NaN;
    }
    if (kind === 'valgus' && Number.isFinite(frame.fppa)) {
      s.fppaMax = Math.max(s.fppaMax, frame.fppa); s.fppaMin = Math.min(s.fppaMin, frame.fppa);
      if (r.phase === 'high') s.fppaNow = Math.max(s.fppaNow, frame.fppa);
      if (r.counted) { if (Number.isFinite(s.fppaNow)) s.fppaReps.push(s.fppaNow); s.fppaNow = -Infinity; }
    }
    s.current = frame;
    return frame;
  }
  function summary() {
    const base = { kind, side, frames: s.frames, used: s.used, count: counter.count };
    if (!s.used) return base;
    if (kind === 'slr') {
      const rest = median(s.rest);
      const now = Number.isFinite(s.lagNow) ? Math.max(0, s.lagNow - (Number.isFinite(rest) ? rest : 0)) : NaN;
      const lag = s.lags.length ? median(s.lags) : now;
      return { ...base, lag, lagMax: s.lags.length ? Math.max(...s.lags) : now, lags: s.lags.slice(), lagFlag: Number.isFinite(lag) && lag > 5, restKnee: rest };
    }
    if (kind === 'valgus') {
      const reps = s.fppaReps;
      const all = Number.isFinite(s.fppaMax) ? s.fppaMax : NaN;
      return { ...base, fppa: reps.length ? median(reps) : all, fppaPeak: reps.length ? Math.max(...reps) : all, fppaReps: reps.slice(), fppaMin: Number.isFinite(s.fppaMin) ? s.fppaMin : NaN };
    }
    const fin = (v) => (Number.isFinite(v) ? v : NaN);
    const out = { ...base, maxFlex: fin(s.maxFlex), minFlex: fin(s.minFlex), extDeficit: Number.isFinite(s.minFlex) ? Math.max(0, s.minFlex) : NaN };
    if (kind === 'squat') { const depths = counter.peaks; return { ...out, depths, avgDepth: mean(depths) }; }
    return out;
  }
  return { push, summary, get current() { return s.current; } };
}
