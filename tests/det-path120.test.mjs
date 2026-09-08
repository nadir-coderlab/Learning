import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context = { window: {}, Date, console };
vm.createContext(context);
for (const file of ['det-path120.js', 'det-path120-bank.js', 'det-path120-drills.js']) vm.runInContext(fs.readFileSync(new URL('../public/' + file, import.meta.url), 'utf8'), context);
const P = context.window.DetPath120;
let count = 0;
const test = (label, run) => { run(); count++; console.log('ok ' + label); };
test('official scores are not percentages and malformed records do not corrupt state', () => {
  assert.equal(P.validScore(100), true); assert.equal(P.validScore(160), true); assert.equal(P.validScore(85), true); assert.equal(P.validScore(101), false);
  const old = { best: { fib: 72 }, log: [], path120: { records: [null, { type: 'official', date: '2026-09-07', overall: 85 }], minutes: -5 } };
  assert.equal(P.profile(old).records.length, 0); assert.equal(old.best.fib, 72); assert.equal(old.path120.minutes, 60);
});
const baseline = { id: 'b', type: 'official', date: '2026-09-07', overall: 85, reading: 75, writing: 80, speaking: 90, listening: 100 };
test('all session budgets add up and favor the measured weaker skills', () => {
  for (const minutes of [45, 60, 90]) {
    const s = { log: [], path120: { records: [baseline], minutes } }; const rows = P.allocation(s);
    assert.equal(rows.reduce((sum, r) => sum + r.minutes, 0), minutes);
    assert(rows[0].minutes > rows[3].minutes); assert(rows.every(r => r.minutes >= 5));
    assert.deepEqual(JSON.parse(JSON.stringify(s.path120.records)), [baseline]);
  }
});
test('recent performance excludes stale, unscored and future attempts', () => {
  const now = Date.now(), s = { log: [{ drill: 'fib', t: now, sc: 50 }, { drill: 'rs', t: now, ok: true }, { drill: 'rc', t: now - 8 * 864e5, sc: 0 }, { drill: 'ir', t: now, sc: null, ok: null }, { drill: 'ir', t: now + 9999, sc: 0 }] };
  const r = P.stats(s, now)[0]; assert.equal(r.count, 2); assert.equal(r.avg, 75);
});
test('new weak listening evidence increases its practice allocation', () => {
  const s = { log: [], path120: { records: [baseline], minutes: 60 } }, before = P.allocation(s)[3].minutes;
  s.log.push({ drill: 'il', t: Date.now(), sc: 20 }); assert(P.allocation(s)[3].minutes > before);
});
test('new official results drive priorities while practice ranges stay separate', () => {
  const newer = { ...baseline, date: '2026-09-08', overall: 110, reading: 130, writing: 100, speaking: 105, listening: 110 };
  const s = { log: [], path120: { records: [baseline, newer, { id: 'p', type: 'practice', date: '2026-09-08', low: 120, high: 130 }], minutes: 60 } };
  const rows = P.allocation(s); assert(rows[1].minutes > rows[0].minutes); assert(P.report(s).includes('110/160')); assert.equal(s.path120.records.length, 3);
});
test('reading bank has unique passages and each explanation cites actual evidence', () => {
  assert.equal(P.bank.length, 12); assert.equal(new Set(P.bank.map(x => x.id)).size, 12);
  for (const passage of P.bank) { assert.equal(passage.questions.length, 2); for (const q of passage.questions) { assert(q.options[q.answer]); assert.equal(new Set(q.options).size, q.options.length); assert(passage.passage.includes(q.evidence), passage.id); assert(q.explain.length > 20); } }
});
test('both parts of interactive writing contribute to the revision notes', () => {
  assert.equal(P.collectIssues({ extra: { part1: { issues: [{ text: 'a' }] }, part2: { issues: [{ text: 'b' }] } } }).length, 2);
});
// Contract test: exercise timed and untimed completion without a browser.
class Element {
  constructor() { this.nodes = {}; this.children = []; this.classList = { add() {} }; this.value = ''; }
  set innerHTML(v) { this.html = v; this.nodes = {}; } get innerHTML() { return this.html; }
  querySelector(key) { return this.nodes[key] ||= new Element(); }
  querySelectorAll(key) { return key === '.opt' ? this.querySelector('.opts').children : []; }
  appendChild(x) { this.children.push(x); }
}
test('reading completion logs every answer once and timeout records unanswered questions', () => {
  context.document = { createElement: () => new Element() };
  for (const timeout of [false, true]) {
    let finish, f; const logs = [], misses = [], scores = []; const drills = {};
    context.window.installPath120Drills({ state: () => ({ log: [] }), drills, pick: pool => [pool[0]], frame: (id, title, seconds, end) => { finish = end; return f = { body: new Element(), timer: { start() {}, stop() {} } }; }, learn() {}, log: (k, a) => logs.push(a), miss: (...a) => misses.push(a), best: (k, a) => scores.push(a) });
    drills.evidence();
    if (timeout) { finish(); finish(); assert.equal(misses.length, 2); assert.equal(scores[0], 0); }
    else { for (const q of P.bank[0].questions) { f.body.querySelector('.opts').children[q.answer].onclick(); f.body.querySelector('#evidence-next').onclick(); } assert.equal(scores[0], 100); }
    assert.equal(logs.length, 2); assert.equal(scores.length, 1);
  }
});
test('revision rejects empty or unchanged text and saves original plus revised answer', () => {
  let f; const state = { log: [] }, logs = [], drills = {};
  context.window.installPath120Drills({ state: () => state, drills, frame: () => f = { body: new Element() }, save() {}, keywords: () => [], grade: () => ({ score: 60, issues: [] }), rubric: () => '', log: (k, a) => logs.push(a), best() {} });
  drills.rewrite();
  f.body.querySelector('#rewrite-save').onclick(); assert.equal(logs.length, 0);
  const text = f.body.querySelector('#rewrite-text');
  text.value = 'Last week the system go down. I was check patient files when it happened. We make sure all orders was registered. It was difficult but we keep working.';
  f.body.querySelector('#rewrite-save').onclick(); assert.equal(logs.length, 0);
  text.value = 'While I was checking patient files, the system went down. We recorded the orders on paper and checked them after the system returned.';
  text.oninput(); assert.equal(state.path120.draft.text, text.value);
  f.body.querySelector('#rewrite-save').onclick(); assert.equal(logs.length, 1); assert(logs[0].extra.before.includes('system go down')); assert.equal(logs[0].a, text.value); assert.equal(state.path120.draft, null);
});
test('trainer wires new routes before routing and preserves cloud state schema', () => {
  const html = fs.readFileSync(new URL('../public/det-train.html', import.meta.url), 'utf8');
  assert(html.indexOf('installPath120Drills({') < html.lastIndexOf('routeHash();'));
  assert(html.includes("const SK = 'detTrainer.v1'")); assert(!html.includes('detEstimate'));
  const workflow = fs.readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  for (const file of ['det-path120.js', 'det-path120.css', 'det-path120-bank.js', 'det-path120-drills.js']) { assert(workflow.includes(file)); assert(html.includes(file)); }
});
console.log(`${count} tests passed`);
