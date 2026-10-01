// Unit tests for the clinical rules engine. Run: node tests/engine.test.mjs
import assert from 'node:assert/strict';
import {
  redFlagsInCheckin, computeAlerts, statusOf, criteriaFor, adherence, projectFlex, soapNote, perWeek, isDueOn, programOn,
  DEFAULT_CATALOG as CAT,
} from '../lib/engine.js';
import { buildPatients } from '../lib/seed.js';
import { addDays, TODAY } from '../lib/util.js';

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

function patient(day, extra = {}) {
  return {
    id: 't', name: 'اختبار', side: 'R', graft: 'BPTB', surgeryDate: addDays(TODAY, -day), phase: 1, contralateral: { flex: 145 },
    program: [{ exId: 'quad_sets', sets: 3, reps: 10, hold: 5, freq: '3 مرات يوميًا' }], programHistory: [],
    checkins: [], exlog: [], rom: [], assessments: [], strength: [], hops: [], jumps: [], proms: [], appointments: [], runs: [], acks: {},
    ...extra,
  };
}
const calm = (d, more = {}) => ({ day: d, pain: 2, swelling: 'same', givingWay: false, warmth: false, calf: false, breath: false, fever: false, wound: false, note: '', ...more });

test('calf pain or swelling is a red flag', () => {
  const f = redFlagsInCheckin(calm(5, { calf: true }), patient(5));
  assert.equal(f[0].ruleId, 'r_calf');
});
test('breathlessness is an emergency red flag', () => {
  const f = redFlagsInCheckin(calm(5, { breath: true }), patient(5));
  assert.ok(f.some((x) => x.ruleId === 'r_breath' && x.emergency));
});
test('fever alone is not an infection flag; fever with redness is', () => {
  assert.equal(redFlagsInCheckin(calm(5, { fever: true }), patient(5)).length, 0);
  assert.ok(redFlagsInCheckin(calm(5, { fever: true, warmth: true }), patient(5)).some((x) => x.ruleId === 'r_infect'));
});
test('pain spike needs >= 8/10 and +3 over the recent mean', () => {
  const p = patient(10, { checkins: [calm(8, { pain: 3 }), calm(9, { pain: 3 })] });
  assert.ok(redFlagsInCheckin(calm(10, { pain: 8 }), p).some((x) => x.ruleId === 'r_spike'));
  assert.ok(!redFlagsInCheckin(calm(10, { pain: 7 }), p).some((x) => x.ruleId === 'r_spike'));
});
test('giving way twice within 7 days is red; once is not', () => {
  const p = patient(20, { checkins: [calm(16, { givingWay: true })] });
  assert.ok(redFlagsInCheckin(calm(20, { givingWay: true }), p).some((x) => x.ruleId === 'r_givingway'));
  assert.ok(!redFlagsInCheckin(calm(20, { givingWay: true }), patient(20)).some((x) => x.ruleId === 'r_givingway'));
});
test('danger words in free text raise a flag for review', () => {
  assert.ok(redFlagsInCheckin(calm(5, { note: 'عندي ضيق في التنفس' }), patient(5)).some((x) => x.ruleId === 'r_freetext'));
});
test('a disabled rule does not fire', () => {
  const cat = { ...CAT, rules: CAT.rules.map((r) => (r.id === 'r_calf' ? { ...r, enabled: false } : r)) };
  assert.equal(redFlagsInCheckin(calm(5, { calf: true }), patient(5), cat).length, 0);
});
test('status precedence: red beats idle beats yellow beats green', () => {
  const red = patient(12, { checkins: [calm(12, { calf: true })] });
  assert.equal(statusOf(red).code, 'red');
  const idle = patient(12, { checkins: [calm(4)] });
  assert.equal(statusOf(idle).code, 'idle');
  const acked = patient(12, { checkins: [calm(12, { calf: true })], acks: { 'r_calf:12': { by: 'PT' } } });
  assert.notEqual(statusOf(acked).code, 'red');
});
test('extension deficit after day 21 is off-trajectory (yellow)', () => {
  const p = patient(30, { checkins: [calm(29), calm(30)], rom: [{ day: 28, flex: 125, ext: 4, source: 'clinic' }] });
  assert.ok(computeAlerts(p).some((a) => a.ruleId === 'y_trajectory'));
});
test('return-to-running gate uses Aspetar thresholds and reports each criterion', () => {
  const p = patient(100, {
    phase: 3,
    rom: [{ day: 98, flex: 140, ext: 0, source: 'clinic' }],
    assessments: [{ day: 98, effusion: 1, slrLag: false, gait: true, sls: 40, landingQuality: true, hopPrereq: true }],
    strength: [{ day: 98, method: 'HHD', quadOp: 170, quadOther: 200, hamOp: 120, hamOther: 130 }],
    checkins: [calm(97), calm(99), calm(100)],
  });
  const r = criteriaFor(p, 4);
  const byId = Object.fromEntries(r.map((x) => [x.c.id, x.state]));
  assert.equal(byId.g4_flex, 'met'); // 140/145 = 96.6% >= 95
  assert.equal(byId.g4_quad, 'met'); // LSI 85% > 80%
  assert.equal(byId.g4_eff, 'met');
  assert.ok(r.every((x) => x.state === 'met'));
  const lowQuad = { ...p, strength: [{ day: 98, method: 'HHD', quadOp: 140, quadOther: 200 }] };
  assert.equal(criteriaFor(lowQuad, 4).find((x) => x.c.id === 'g4_quad').state, 'unmet');
});
test('missing measurements are "unknown", never "met"', () => {
  const r = criteriaFor(patient(100, { phase: 3 }), 4);
  assert.ok(r.filter((x) => x.c.metric !== 'noRedAlerts').every((x) => x.state === 'unknown'));
});
test('frequency parsing and weekly scheduling', () => {
  assert.equal(perWeek('3 مرات أسبوعيًا'), 3);
  assert.equal(perWeek('مرتين أسبوعيًا'), 2);
  assert.equal(perWeek('يوم بعد يوم'), 3.5);
  assert.equal(perWeek('3 مرات يوميًا'), 7);
  const twice = { freq: 'مرتين أسبوعيًا' };
  const due = [0, 1, 2, 3, 4, 5, 6].filter((d) => isDueOn(twice, null, d));
  assert.equal(due.length, 2);
});
test('adherence uses the programme that was active on each day', () => {
  const old = [{ exId: 'quad_sets', freq: '3 مرات يوميًا' }];
  const cur = [{ exId: 'bike', freq: 'يوميًا' }];
  const exlog = [];
  for (let d = 1; d < 10; d++) exlog.push({ day: d, exId: d < 7 ? 'quad_sets' : 'bike', done: true });
  const p = patient(10, { program: cur, programHistory: [{ fromDay: 0, program: old }, { fromDay: 7, program: cur }], exlog });
  assert.equal(programOn(p, 3), old);
  assert.equal(adherence(p, 7).pct, 100);
});
test('projection estimates days to 120° from a rising trend', () => {
  const p = patient(14, { rom: [{ day: 6, flex: 85, source: 'phone' }, { day: 9, flex: 94, source: 'phone' }, { day: 12, flex: 103, source: 'clinic' }] });
  const pr = projectFlex(p, 120);
  assert.ok(pr && pr.days > 0 && pr.days < 10, JSON.stringify(pr));
});
test('SOAP note never clears the patient by itself', () => {
  const p = patient(100, {
    phase: 3, rom: [{ day: 98, flex: 140, ext: 0, source: 'clinic' }],
    assessments: [{ day: 98, effusion: 0, slrLag: false, gait: true, sls: 40, landingQuality: true, hopPrereq: true }],
    strength: [{ day: 98, method: 'HHD', quadOp: 180, quadOther: 200 }], checkins: [calm(99), calm(100)],
  });
  const note = soapNote(p);
  assert.match(note, /criteria appear completed, clinical review required/);
  assert.doesNotMatch(note, /cleared/i);
});
test('seed: 38 active demo patients with the designed scenarios', () => {
  const ps = buildPatients();
  assert.equal(ps.length, 38);
  assert.equal(new Set(ps.map((p) => p.id)).size, 38);
  const st = (id) => statusOf(ps.find((p) => p.id === id)).code;
  assert.equal(st('p_sara'), 'red');
  assert.equal(st('p_haifa'), 'idle');
  assert.equal(st('p_yousef'), 'yellow');
  assert.equal(st('p_ahmed'), 'green');
  assert.ok(statusOf(ps.find((p) => p.id === 'p_reem')).awaitingApproval);
});

console.log(`\n${passed} tests passed`);
