// Unit tests for the smart-camera coach. Run: node tests/coach.test.mjs
import assert from 'node:assert/strict';
import {
  createOneEuro, createHoldTracker, segmentObliquity, nearerLeg, facingRatio, uprightError, assessFrame, createCoach,
  rateReps, scoreConfidence, flexTarget, arabicCount,
} from '../lib/coach.js';
import { LEG, createRepCounter, createAnalyzer } from '../lib/pose.js';

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const near = (a, e, tol, msg) => assert.ok(Math.abs(a - e) <= tol, `${msg || ''} expected ${e}±${tol}, got ${a}`);

/** 33 landmarks; `pts` maps landmark id → {x, y} (normalized), all visible unless `vis` says otherwise. */
function lmOf(pts, vis = 0.95) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: vis }));
  for (const [i, p] of Object.entries(pts)) lm[i] = { x: p.x, y: p.y, z: 0, visibility: p.v ?? vis };
  return lm;
}
// A clean side view: right leg from hip (0.5, 0.3) to ankle (0.5, 0.8), shoulders stacked (true profile).
const SIDE = { 12: { x: 0.5, y: 0.1 }, 11: { x: 0.51, y: 0.1 }, 24: { x: 0.5, y: 0.3 }, 23: { x: 0.51, y: 0.3 }, 26: { x: 0.5, y: 0.55 }, 28: { x: 0.5, y: 0.8 }, 25: { x: 0.52, y: 0.55 }, 27: { x: 0.52, y: 0.8 } };

test('one-euro: still signal stays still, moving signal follows with little lag', () => {
  const f = createOneEuro();
  let t = 0; let out = 0;
  for (let i = 0; i < 90; i++) { out = f.push(50 + ((i % 3) - 1) * 1.5, t); t += 33; }
  near(out, 50, 1.2, 'noise is smoothed');
  for (let i = 0; i < 30; i++) { out = f.push(50 + i * 2, t); t += 33; }
  near(out, 50 + 29 * 2, 4, 'fast motion is followed');
});

test('hold tracker ignores a one-frame spike and keeps the sustained value', () => {
  const h = createHoldTracker({ windowMs: 700 });
  let t = 0;
  for (let i = 0; i < 40; i++) { h.push(90, t); t += 33; }
  h.push(140, t); t += 33; // spike
  for (let i = 0; i < 40; i++) { h.push(92, t); t += 33; }
  assert.ok(h.max < 100, `spike ignored, got ${h.max}`);
  near(h.max, 92, 1, 'sustained value');
});

test('segment obliquity from world landmarks', () => {
  const world = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
  world[24] = { x: 0, y: 0, z: 0 }; world[26] = { x: 0, y: 0.4, z: 0 }; world[28] = { x: 0, y: 0.8, z: 0 };
  near(segmentObliquity(world, 'R').max, 0, 1e-6, 'in-plane leg');
  world[28] = { x: 0, y: 0.8, z: 0.4 }; // shank pointing toward the camera at 45°
  near(segmentObliquity(world, 'R').shank, 45, 1e-6);
  near(segmentObliquity(world, 'R').max, 45, 1e-6);
});

test('nearer leg from world z; unclear when the gap is small', () => {
  const world = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
  [24, 26, 28].forEach((i) => { world[i] = { x: 0, y: 0, z: -0.1 }; });
  [23, 25, 27].forEach((i) => { world[i] = { x: 0, y: 0, z: 0.1 }; });
  assert.equal(nearerLeg(world), 'R');
  [23, 25, 27].forEach((i) => { world[i] = { x: 0, y: 0, z: -0.09 }; });
  assert.equal(nearerLeg(world), null);
});

test('facing ratio: profile ≈ 0, facing the camera ≈ 0.6', () => {
  assert.ok(facingRatio(lmOf(SIDE)) < 0.1);
  const front = lmOf({ 12: { x: 0.4, y: 0.1 }, 11: { x: 0.6, y: 0.1 }, 24: { x: 0.43, y: 0.42 }, 23: { x: 0.57, y: 0.42 } });
  assert.ok(facingRatio(front) > 0.5);
});

test('upright error for portrait and landscape phones', () => {
  near(uprightError(90, 0), 0, 1e-9, 'portrait upright');
  near(uprightError(0, -90), 0, 1e-9, 'landscape upright');
  near(uprightError(70, 0), 20, 1e-9, 'tipped back 20°');
  assert.ok(Number.isNaN(uprightError(undefined, 0)));
});

test('framing coach picks the most urgent message', () => {
  assert.equal(assessFrame({ lm: null }).code, 'none');
  const dim = lmOf(SIDE, 0.3);
  assert.equal(assessFrame({ lm: dim, side: 'R' }).code, 'leg');
  const edge = lmOf({ ...SIDE, 28: { x: 0.5, y: 0.99 } });
  assert.equal(assessFrame({ lm: edge, side: 'R' }).code, 'edge');
  const far = lmOf({ ...SIDE, 24: { x: 0.5, y: 0.45 }, 26: { x: 0.5, y: 0.52 }, 28: { x: 0.5, y: 0.6 } });
  assert.equal(assessFrame({ lm: far, side: 'R' }).code, 'far');
  const front = lmOf({ ...SIDE, 12: { x: 0.35, y: 0.1 }, 11: { x: 0.65, y: 0.1 }, 24: { x: 0.4, y: 0.3 }, 23: { x: 0.6, y: 0.3 } });
  assert.equal(assessFrame({ lm: front, side: 'R', view: 'side' }).code, 'face');
  assert.equal(assessFrame({ lm: front, side: 'R', view: 'front', need: [24, 26, 28] }).code, 'ok');
  assert.equal(assessFrame({ lm: lmOf(SIDE), side: 'R', view: 'front' }).code, 'side');
  const good = lmOf(SIDE);
  assert.equal(assessFrame({ lm: good, side: 'R' }).code, 'ok');
  assert.equal(assessFrame({ lm: good, side: 'R', luma: 30 }).code, 'dark');
  assert.equal(assessFrame({ lm: good, side: 'R', tilt: 30 }).code, 'tilt');
  // world landmarks: wrong leg nearer, then oblique
  const world = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
  [24, 26, 28].forEach((i) => { world[i] = { x: 0, y: 0, z: 0.1 }; });
  [23, 25, 27].forEach((i) => { world[i] = { x: 0, y: 0, z: -0.1 }; });
  assert.equal(assessFrame({ lm: good, world, side: 'R' }).code, 'swap');
  const w2 = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 1 })); // left leg far behind
  w2[24] = { x: 0, y: 0, z: 0 }; w2[26] = { x: 0, y: 0.3, z: 0.3 }; w2[28] = { x: 0, y: 0.6, z: 0.6 };
  assert.equal(assessFrame({ lm: good, world: w2, side: 'R' }).code, 'oblique');
});

test('stateful coach debounces and reports ready after the hold time', () => {
  const c = createCoach({ holdMs: 1000, settleMs: 300 });
  const ok = { code: 'ok', ok: true }; const far = { code: 'far', ok: false };
  let r = c.push(far, 0);
  assert.equal(r.code, 'far');
  r = c.push(ok, 100); // ok shows at once
  assert.equal(r.code, 'ok'); assert.equal(r.ready, false);
  r = c.push(far, 200); // a single bad frame does not flip the message back
  assert.equal(r.code, 'ok');
  r = c.push(ok, 300);
  r = c.push(ok, 1400);
  assert.equal(r.ready, true, 'ready after 1 s of good frames');
  r = c.push(far, 1500); r = c.push(far, 1900);
  assert.equal(r.code, 'far'); assert.equal(r.ready, false);
});

test('rep counter reports per-rep duration; reps are rated against a target', () => {
  const rc = createRepCounter();
  let t = 0;
  const feed = (v) => { rc.push(v, t); t += 33; };
  for (let i = 0; i < 30; i++) feed(0);
  for (let i = 0; i <= 60; i++) feed(1.5 * i); // up to 90 over 2 s
  for (let i = 60; i >= 0; i--) feed(1.5 * i);
  for (let i = 0; i < 30; i++) feed(0);
  for (let i = 0; i <= 20; i++) feed(3 * i); // quick, shallow rep to 60 over 0.7 s
  for (let i = 20; i >= 0; i--) feed(3 * i);
  for (let i = 0; i < 30; i++) feed(0);
  assert.equal(rc.count, 2);
  const reps = rc.reps;
  near(reps[0].peak, 90, 2); near(reps[0].dur, 3.0, 0.5, 'first rep spends ~3 s above the threshold');
  const rated = rateReps(reps, { target: 110 });
  assert.equal(rated[0].q, 'low', 'peak 90 against a 110 target');
  assert.equal(rated[1].q, 'fast');
  assert.equal(rateReps(reps, { target: 90 })[0].q, 'full');
});

test('analyzer: held max and quality numbers', () => {
  const W = 1280; const H = 720;
  const an = createAnalyzer({ kind: 'rom', side: 'R', fps: 30 });
  const legAt = (K, a1, a2, len = 300) => {
    const r = (d) => (d * Math.PI) / 180;
    return { hip: { x: K.x + len * Math.cos(r(a1)), y: K.y + len * Math.sin(r(a1)) }, knee: K, ankle: { x: K.x + len * Math.cos(r(a2)), y: K.y + len * Math.sin(r(a2)) } };
  };
  const mk = (flex, vis = 0.9) => {
    const leg = legAt({ x: 640, y: 400 }, 180, 180 - (180 - flex), 260);
    const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: vis }));
    const l = LEG.R;
    lm[l.hip] = { x: leg.hip.x / W, y: leg.hip.y / H, z: 0, visibility: vis };
    lm[l.knee] = { x: leg.knee.x / W, y: leg.knee.y / H, z: 0, visibility: vis };
    lm[l.ankle] = { x: leg.ankle.x / W, y: leg.ankle.y / H, z: 0, visibility: vis };
    lm.world = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
    lm.world[l.hip] = { x: 0, y: 0, z: 0 }; lm.world[l.knee] = { x: 0, y: 0.4, z: 0.1 }; lm.world[l.ankle] = { x: 0, y: 0.8, z: 0.2 };
    return lm;
  };
  let t = 0;
  for (let i = 0; i < 60; i++) { an.push(mk(80), W, H, t); t += 33; }
  an.push(mk(140), W, H, t); t += 33; // one-frame spike
  for (let i = 0; i < 60; i++) { an.push(mk(82), W, H, t); t += 33; }
  const s = an.summary();
  assert.ok(s.heldMax < 100 && s.heldMax >= 80, `held max ignores the spike: ${s.heldMax}`);
  near(s.quality.usedFrac, 1, 1e-9);
  near(s.quality.meanVis, 0.9, 1e-6);
  near(s.quality.obliquity, 14.0, 0.5, 'obliquity from z/len');
  assert.ok(s.quality.jitter < 3);
});

test('confidence score and reasons', () => {
  const good = scoreConfidence({ usedFrac: 0.98, meanVis: 0.92, obliquity: 8, jitter: 0.8, frames: 300 });
  assert.equal(good.level, 'high'); assert.equal(good.reasons.length, 0);
  const bad = scoreConfidence({ usedFrac: 0.45, meanVis: 0.55, obliquity: 34, jitter: 5, frames: 30 });
  assert.equal(bad.level, 'low'); assert.ok(bad.reasons.length >= 3);
  const mid = scoreConfidence({ usedFrac: 0.9, meanVis: 0.85, obliquity: 26, jitter: 1, frames: 200 });
  assert.equal(mid.level, 'medium');
});

test('flexion target from the next gate, else from the last best', () => {
  const t1 = flexTarget({ results: [{ c: { metric: 'flex', target: 110 } }] });
  assert.equal(t1.value, 110);
  const t2 = flexTarget({ results: [{ c: { metric: 'flexDiffOther', target: 10 } }], contralateral: 145 });
  assert.equal(t2.value, 135);
  const t3 = flexTarget({ results: [{ c: { metric: 'flexPctOther', target: 95 } }], contralateral: 140 });
  assert.equal(t3.value, 133);
  assert.equal(flexTarget({ results: [], lastFlex: 100 }).value, 105);
  assert.equal(flexTarget({ results: [] }), null);
  assert.equal(arabicCount(3), 'ثلاثة'); assert.equal(arabicCount(42), '42');
});

for (const { name, fn } of tests) {
  try { fn(); passed += 1; console.log(`ok - ${name}`); } catch (e) { console.error(`FAIL - ${name}\n  ${e.message}`); process.exitCode = 1; }
}
console.log(`${passed}/${tests.length} passed`);
