import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read = name => fs.readFileSync(new URL('../public/' + name, import.meta.url), 'utf8');
const exists = name => fs.existsSync(new URL('../public/' + name, import.meta.url));
// det-explain.json: full Arabic translations for every passage/sentence and a reason for every Interactive Reading option.
const html = read('det-train.html');
const base = JSON.parse(html.match(/<script id="banks" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const bank2 = JSON.parse(read('det-bank2.json'));
const packs = JSON.parse(read('det-packs.json')).banks || {};
const c = { window: {} }; vm.createContext(c); vm.runInContext(read('assets/det/practice-bank.js'), c);
const practice = c.window.DetPracticeBank.banks;
const banks = [base, bank2, packs, practice];
const rc = new Map(); banks.forEach(b => (b.readcomplete?.passages || []).forEach(p => rc.has(p.title) || rc.set(p.title, p)));
const ir = new Map(); banks.forEach(b => (b.ireading?.sets || []).forEach(s => ir.has(s.title) || ir.set(s.title, s)));
const fib = new Map(); banks.forEach(b => (b.fib?.items || []).forEach(x => fib.has(x.sentence) || fib.set(x.sentence, x)));
const arabic = s => typeof s === 'string' && (s.match(/[؀-ۿ]/g) || []).length >= 10;

test('det-explain.json covers the banks with real Arabic', { skip: !exists('det-explain.json') && 'det-explain.json not generated yet' }, () => {
  const E = JSON.parse(read('det-explain.json'));
  const cov = (have, want) => [...want.keys()].filter(k => have[k]).length / want.size;
  // A partial file (flagged by the merge script while the generation workflow is still running) is allowed to be incomplete, never invalid.
  if (!E.partial) {
    assert(cov(E.rc, rc) >= 0.95, `rc coverage ${cov(E.rc, rc)}`);
    assert(cov(E.ir, ir) >= 0.95, `ir coverage ${cov(E.ir, ir)}`);
    assert(cov(E.fib, fib) >= 0.95, `fib coverage ${cov(E.fib, fib)}`);
  }
  assert(Object.keys(E.rc).length + Object.keys(E.ir).length + Object.keys(E.fib).length > 0, 'empty file');
  for (const [t, x] of Object.entries(E.rc)) { assert(rc.has(t), 'unknown rc title ' + t); assert(arabic(x.ar) && x.ar.split(/\s+/).length >= rc.get(t).text.split(/\s+/).length * 0.5, 'rc translation too short: ' + t); }
  for (const [s, ar] of Object.entries(E.fib)) { assert(fib.has(s), 'unknown fib sentence ' + s.slice(0, 40)); assert(arabic(ar), 'fib translation: ' + s.slice(0, 40)); }
});

test('every Interactive Reading option has a reason that matches the real options', { skip: !exists('det-explain.json') && 'det-explain.json not generated yet' }, () => {
  const E = JSON.parse(read('det-explain.json')); let withWhy = 0;
  for (const [t, x] of Object.entries(E.ir)) {
    const s = ir.get(t); assert(s, 'unknown ir title ' + t);
    if (x.ar) assert(arabic(x.ar) && x.ar.split(/\s+/).length >= (s.part1 + s.part2).split(/\s+/).length * 0.5, 'ir translation too short: ' + t);
    if (!x.why) continue; withWhy++;
    const gaps = [...s.part1.matchAll(/\{([^}]+)\}/g)].map(m => m[1].split('|'));
    assert.equal(x.why.gaps.length, gaps.length, t + ': gap count');
    gaps.forEach((o, k) => { const g = x.why.gaps[k]; assert.equal(g.correct, o[0], `${t} gap ${k}`); assert.deepEqual(new Set(g.wrong.map(w => w.option)), new Set(o.slice(1)), `${t} gap ${k} wrong options`); assert(arabic(g.why_ar) || g.why_ar.length > 8, `${t} gap ${k} why`); g.wrong.forEach(w => assert(w.why_ar.length > 4, `${t} gap ${k} wrong why`)); });
    for (const [key, opts, correct] of [['missing', s.missing_options, s.missing_correct], ['idea', s.idea_options, s.idea_correct], ['title', s.title_options, s.title_correct]]) {
      const q = x.why[key]; assert(q && q.why_ar.length > 4, `${t} ${key} why`);
      assert.deepEqual(new Set(q.wrong.map(w => w.option)), new Set(opts.filter((o, i) => i !== correct)), `${t} ${key} wrong options`);
      q.wrong.forEach(w => assert(w.why_ar.length > 4, `${t} ${key} wrong why`));
    }
    assert.equal(x.why.highlight.length, s.highlight.length, t + ': highlight count');
  }
  if (!E.partial) assert(withWhy >= ir.size * 0.9, `only ${withWhy}/${ir.size} sets have per-option reasons`);
});
