// Unit tests for the measurement lab's pure math. Run: node tests/pose.test.mjs
import assert from 'node:assert/strict';
import {
  LEG, angleAt, flexionFromPoints, kneeFlexion, hipFlexion, fppa, fppaFromPoints, visibleEnough, median,
  createRepCounter, createAnalyzer, pickLeg,
} from '../lib/pose.js';
import { laplacianVariance, focusMeasure, assessQuality, QUALITY_LIMITS } from '../lib/sensors.js';

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const near = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg || ''} expected ${expected}±${tol}, got ${actual}`);

// Deterministic noise so the suite never flakes.
function prng(seed = 7) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** 33 landmarks, all visible, with the given pixel points placed for `side` (normalized by w/h). */
function makeLm({ side = 'R', w = 1, h = 1, hip, knee, ankle, shoulder, otherHip, vis = 0.95 }) {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: vis }));
  const l = LEG[side];
  const put = (i, p) => { if (p) lm[i] = { x: p.x / w, y: p.y / h, z: 0, visibility: vis }; };
  put(l.hip, hip); put(l.knee, knee); put(l.ankle, ankle); put(l.shoulder, shoulder);
  if (otherHip) put(LEG[side === 'R' ? 'L' : 'R'].hip, otherHip);
  return lm;
}
/** Leg in pixel space: knee K, thigh toward the hip at angle a1, shank toward the ankle at a2 (degrees). */
function legAt(K, a1, a2, len = 300) {
  const r = (d) => (d * Math.PI) / 180;
  return { hip: { x: K.x + len * Math.cos(r(a1)), y: K.y + len * Math.sin(r(a1)) }, knee: K, ankle: { x: K.x + len * Math.cos(r(a2)), y: K.y + len * Math.sin(r(a2)) } };
}

test('straight leg reads ~0° flexion', () => {
  const lm = makeLm({ hip: { x: 0.5, y: 0.2 }, knee: { x: 0.5, y: 0.5 }, ankle: { x: 0.5, y: 0.8 } });
  near(kneeFlexion(lm, 'R'), 0, 1e-6);
  // slightly off-axis points still read close to zero
  const lm2 = makeLm({ hip: { x: 0.49, y: 0.2 }, knee: { x: 0.5, y: 0.5 }, ankle: { x: 0.51, y: 0.8 } });
  near(kneeFlexion(lm2, 'R'), 0, 4);
});

test('right angle reads ~90°', () => {
  const lm = makeLm({ side: 'L', hip: { x: 0.2, y: 0.5 }, knee: { x: 0.5, y: 0.5 }, ankle: { x: 0.5, y: 0.8 } });
  near(kneeFlexion(lm, 'L'), 90, 1e-6);
  near(angleAt({ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }), 90, 1e-9);
  near(flexionFromPoints({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 10 }), 45, 1e-9);
  assert.ok(Number.isNaN(flexionFromPoints({ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 })), 'degenerate input gives NaN');
});

test('aspect-ratio correction: angle is measured in pixel space', () => {
  const w = 1280; const h = 720;
  for (const trueFlex of [30, 60, 90, 120]) {
    // interior angle at the knee = 180 − flex; thigh on a diagonal, where 16:9 distortion is largest
    const leg = legAt({ x: 640, y: 360 }, 225, 225 - (180 - trueFlex), 250);
    const lm = makeLm({ w, h, ...leg });
    near(kneeFlexion(lm, 'R', w, h), trueFlex, 1e-6, `flex ${trueFlex}`);
    // Without the frame size the same normalized points give a distorted angle.
    assert.ok(Math.abs(kneeFlexion(lm, 'R') - trueFlex) > 3, `uncorrected angle should differ for ${trueFlex}°`);
  }
});

test('hip flexion for a straight-leg raise', () => {
  const lm = makeLm({ shoulder: { x: 0.1, y: 0.6 }, hip: { x: 0.4, y: 0.6 }, knee: { x: 0.4 + 0.25 * Math.cos(-Math.PI / 6), y: 0.6 + 0.25 * Math.sin(-Math.PI / 6) }, ankle: { x: 0.9, y: 0.6 - 0.5 * 0.5 } });
  near(hipFlexion(lm, 'R'), 30, 1e-6);
});

test('FPPA sign: valgus positive, varus negative, mirrored for the left leg', () => {
  // Front view: subject faces the camera, right leg on image-left, left hip at larger x.
  const base = { hip: { x: 400, y: 300 }, ankle: { x: 400, y: 700 }, otherHip: { x: 600, y: 300 } };
  const valgus = makeLm({ side: 'R', ...base, knee: { x: 440, y: 500 } }); // knee toward midline (+x)
  const varus = makeLm({ side: 'R', ...base, knee: { x: 360, y: 500 } });
  const neutral = makeLm({ side: 'R', ...base, knee: { x: 400, y: 500 } });
  assert.ok(fppa(valgus, 'R') > 15, 'medial knee → positive FPPA');
  assert.ok(fppa(varus, 'R') < -15, 'lateral knee → negative FPPA');
  near(fppa(neutral, 'R'), 0, 1e-6);
  near(fppa(valgus, 'R'), -fppa(varus, 'R'), 1e-6, 'symmetric');
  // Left leg sits on image-right; its midline is toward −x.
  const lValgus = makeLm({ side: 'L', hip: { x: 600, y: 300 }, ankle: { x: 600, y: 700 }, knee: { x: 560, y: 500 }, otherHip: { x: 400, y: 300 } });
  assert.ok(fppa(lValgus, 'L') > 15, 'left knee toward midline → positive');
  // Facing away from the camera flips image sides; the other hip still defines the midline.
  const backView = makeLm({ side: 'R', hip: { x: 600, y: 300 }, ankle: { x: 600, y: 700 }, knee: { x: 560, y: 500 }, otherHip: { x: 400, y: 300 } });
  assert.ok(fppa(backView, 'R') > 15, 'back view valgus still positive');
  assert.ok(fppaFromPoints({ x: 0, y: 0 }, { x: 5, y: 50 }, { x: 0, y: 100 }, 1) > 0);
  assert.ok(fppaFromPoints({ x: 0, y: 0 }, { x: 5, y: 50 }, { x: 0, y: 100 }, -1) < 0);
});

test('visibility and median helpers', () => {
  const lm = makeLm({ hip: { x: 0.5, y: 0.2 }, knee: { x: 0.5, y: 0.5 }, ankle: { x: 0.5, y: 0.8 } });
  assert.equal(visibleEnough(lm, [24, 26, 28], 0.5), true);
  lm[26] = { ...lm[26], visibility: 0.3 };
  assert.equal(visibleEnough(lm, [24, 26, 28], 0.5), false);
  assert.equal(visibleEnough(null, [24], 0.5), false);
  const off = makeLm({ hip: { x: 0.5, y: 0.2 }, knee: { x: 0.5, y: 0.5 }, ankle: { x: 0.5, y: 1.4 } });
  assert.equal(visibleEnough(off, [24, 26, 28], 0.5), false, 'out of frame is not visible');
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([NaN, 2, undefined, 4]), 3);
  assert.ok(Number.isNaN(median([])));
});

test('pickLeg prefers the operated side and swaps only when clearly better', () => {
  const lm = makeLm({ hip: { x: 0.5, y: 0.2 }, knee: { x: 0.5, y: 0.5 }, ankle: { x: 0.5, y: 0.8 } });
  assert.deepEqual(pickLeg(lm, 'R').side, 'R');
  [24, 26, 28].forEach((i) => { lm[i].visibility = 0.2; });
  [23, 25, 27].forEach((i) => { lm[i].visibility = 0.9; });
  const p = pickLeg(lm, 'R');
  assert.equal(p.side, 'L'); assert.equal(p.swapped, true);
});

function cycles({ n = 3, lo = 0, hi = 90, fps = 30, period = 4, rest = 1, noise = 2, seed = 3 }) {
  const r = prng(seed); const out = []; let t = 0;
  for (let k = 0; k < rest * fps; k++, t += 1000 / fps) out.push({ v: lo + (r() * 2 - 1) * noise, t });
  for (let c = 0; c < n; c++) {
    for (let k = 0; k < period * fps; k++, t += 1000 / fps) {
      const ph = k / (period * fps);
      out.push({ v: lo + (hi - lo) * (0.5 - 0.5 * Math.cos(2 * Math.PI * ph)) + (r() * 2 - 1) * noise, t });
    }
  }
  for (let k = 0; k < rest * fps; k++, t += 1000 / fps) out.push({ v: lo + (r() * 2 - 1) * noise, t });
  return out;
}

test('rep counter counts 3 synthetic reps', () => {
  const rc = createRepCounter();
  let counted = 0;
  for (const { v, t } of cycles({ n: 3 })) if (rc.push(v, t).counted) counted += 1;
  assert.equal(rc.count, 3);
  assert.equal(counted, 3);
  rc.peaks.forEach((p) => near(p, 90, 4, 'peak'));
});

test('rep counter: noise, shallow reps and long holds do not count', () => {
  const rc = createRepCounter();
  const r = prng(11);
  for (let i = 0; i < 600; i++) rc.push(5 + (r() * 2 - 1) * 4, i * 33);
  assert.equal(rc.count, 0, 'noise only');
  // one rep up to 90 that holds for 15 s at the top, then comes down: exactly one rep
  const rc2 = createRepCounter();
  let t = 0;
  const feed = (v) => { rc2.push(v, t); t += 33; };
  for (let i = 0; i < 30; i++) feed(0);
  for (let i = 0; i <= 60; i++) feed(1.5 * i);
  for (let i = 0; i < 450; i++) feed(90 + (i % 3) - 1);
  assert.equal(rc2.count, 0, 'holding at the top is not a rep');
  for (let i = 60; i >= 0; i--) feed(1.5 * i);
  assert.equal(rc2.count, 1);
  // range adapts: after big reps, smaller (but real) reps still count without timestamps
  const rc3 = createRepCounter();
  for (const { v } of cycles({ n: 2, hi: 100, noise: 0 })) rc3.push(v);
  for (const { v } of cycles({ n: 2, hi: 75, noise: 0, rest: 2 })) rc3.push(v);
  assert.equal(rc3.count, 4);
});

test('analyzer: heel slides → reps, max flexion, best extension', () => {
  const W = 1280; const H = 720; const fps = 30;
  const an = createAnalyzer({ kind: 'rom', side: 'R', fps });
  const series = cycles({ n: 3, lo: 4, hi: 95, noise: 1.5 });
  // occasional missing / low-visibility frames must not break counting
  series.forEach(({ v, t }, i) => {
    const leg = legAt({ x: 640, y: 400 }, 180 + 0, 180 + 0 - (180 - v), 260);
    const lm = makeLm({ w: W, h: H, ...leg, vis: i % 17 === 0 ? 0.2 : 0.9 });
    an.push(i % 29 === 0 ? null : lm, W, H, t);
  });
  const s = an.summary();
  assert.equal(s.count, 3);
  near(s.maxFlex, 95, 3);
  near(s.extDeficit, 4, 3);
  assert.ok(s.used < s.frames, 'skipped frames are reported');
});

test('analyzer: straight-leg raise extensor lag', () => {
  const fps = 30; const W = 1000; const H = 1000;
  const run = (bendWhenLifted) => {
    const an = createAnalyzer({ kind: 'slr', side: 'R', fps });
    for (const { v: lift, t } of cycles({ n: 3, lo: 0, hi: 40, noise: 0.5 })) {
      const r = (d) => (d * Math.PI) / 180;
      const hip = { x: 400, y: 600 };
      const shoulder = { x: 100, y: 600 };
      const thighDir = -lift; // raise the thigh above horizontal
      const knee = { x: hip.x + 220 * Math.cos(r(thighDir)), y: hip.y + 220 * Math.sin(r(thighDir)) };
      const bend = bendWhenLifted * Math.min(1, lift / 40); // knee sags as the leg goes up
      const shankDir = thighDir + bend;
      const ankle = { x: knee.x + 220 * Math.cos(r(shankDir)), y: knee.y + 220 * Math.sin(r(shankDir)) };
      an.push(makeLm({ w: W, h: H, shoulder, hip, knee, ankle }), W, H, t);
    }
    return an.summary();
  };
  const good = run(0);
  assert.equal(good.count, 3);
  assert.ok(good.lag <= 2, `straight knee lag ~0, got ${good.lag}`);
  assert.equal(good.lagFlag, false);
  const lagging = run(12);
  assert.equal(lagging.count, 3);
  near(lagging.lag, 12, 3, 'lag');
  assert.equal(lagging.lagFlag, true);
});

test('analyzer: valgus reps from hip drop and FPPA per rep', () => {
  const fps = 30; const W = 720; const H = 1280;
  const an = createAnalyzer({ kind: 'valgus', side: 'R', fps });
  for (const { v: depth, t } of cycles({ n: 3, lo: 0, hi: 1, noise: 0 })) {
    const hipY = 500 + 120 * depth; // hip drops
    const knee = { x: 300 + 40 * depth, y: 760 + 30 * depth }; // knee drifts medially (+x) at depth
    const lm = makeLm({ w: W, h: H, hip: { x: 300, y: hipY }, knee, ankle: { x: 300, y: 1000 }, otherHip: { x: 460, y: hipY } });
    an.push(lm, W, H, t);
  }
  const s = an.summary();
  assert.equal(s.count, 3);
  assert.ok(s.fppa > 10, `valgus FPPA should be clearly positive, got ${s.fppa}`);
});

test('photo quality math', () => {
  const w = 64; const h = 64;
  const flat = new Float32Array(w * h).fill(128);
  assert.equal(laplacianVariance(flat, w, h), 0);
  const checker = new Float32Array(w * h).map((_, i) => (((i % w) + Math.floor(i / w)) % 2 ? 255 : 0));
  assert.ok(laplacianVariance(checker, w, h) > 1000);
  // A sharp detail in one corner of an otherwise smooth photo (wound on skin) still reads as in focus.
  const patch = new Float32Array(w * h).map((_, i) => { const x = i % w; const y = Math.floor(i / w); return x < 32 && y < 32 && (x + y) % 2 ? 200 : 120; });
  assert.ok(focusMeasure(patch, w, h) > 10 * laplacianVariance(patch, w, h) / 4, 'tile focus is not diluted by smooth areas');
  assert.equal(focusMeasure(flat, w, h), 0);
  const good = assessQuality({ brightness: 130, sharpness: QUALITY_LIMITS.sharp * 3, width: 3024, height: 4032 });
  assert.equal(good.ok, true);
  const bad = assessQuality({ brightness: 30, sharpness: 5, width: 640, height: 480 });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.checks.filter((c) => !c.ok).map((c) => c.id), ['light', 'sharp', 'size']);
});

for (const { name, fn } of tests) {
  try { fn(); passed += 1; console.log(`ok - ${name}`); } catch (e) { console.error(`FAIL - ${name}\n  ${e.message}`); process.exitCode = 1; }
}
console.log(`${passed}/${tests.length} passed`);
