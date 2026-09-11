import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read = name => fs.readFileSync(new URL('../public/' + name, import.meta.url), 'utf8');
// det-flex.json: the learner's 7 memorized stories with openers/closers, plus transformed answers for bank questions.
const F = JSON.parse(read('det-flex.json'));
const wordsOf = s => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
test('seven stories, each with text, skeleton, core sentences taken from the text, openers and closers', () => {
  assert.equal(F.stories.length, 7);
  assert.deepEqual(F.stories.map(s => s.id), [1, 2, 3, 4, 5, 6, 7]);
  for (const s of F.stories) {
    assert(wordsOf(s.text).length >= 55, s.id + ': text');
    assert(s.skeleton.length >= 5 && s.core.length >= 3 && s.openers.length >= 4 && s.closers.length >= 2, s.id + ': parts');
    for (const c of s.core) assert(s.text.includes(c), `${s.id}: core sentence must be verbatim from the text — ${c.slice(0, 30)}`);
    for (const o of [...s.openers, ...s.closers]) assert(o.when_ar && o.en, s.id + ': opener/closer');
    assert(s.patterns.length && s.cues.length, s.id + ': mapping');
  }
  assert(F.keys.length >= 10 && F.closers.length >= 4 && F.rules_ar.length >= 5);
});
test('every transform points at a real story, opens with its opener and keeps the memorized core', () => {
  const byId = new Map(F.stories.map(s => [s.id, s]));
  assert(F.transforms.length >= 30);
  const seen = new Set();
  for (const t of F.transforms) {
    assert(!seen.has(t.q.toLowerCase()), 'duplicate transform: ' + t.q); seen.add(t.q.toLowerCase());
    const s = byId.get(t.story); assert(s, t.q + ': story ' + t.story);
    assert(t.opener_en && t.change_ar && typeof t.cut === 'boolean', t.q + ': fields');
    if (!t.answer_en) continue;
    const a = wordsOf(t.answer_en).join(' ');
    assert(a.startsWith(wordsOf(t.opener_en).slice(0, 5).join(' ')), t.q + ': answer must start with the opener');
    const n = wordsOf(t.answer_en).length; assert(n >= 45 && n <= 130, `${t.q}: ${n} words`);
    // memorized body kept: at least one core sentence appears nearly verbatim (its first 5 words) and
    // the answer reuses a good share of the story's own words — the guide allows changing ~20–40%, never rewriting.
    // Either a core sentence survives verbatim, or (skeleton swaps like "communication" on story 7) most words still come from the story.
    const kept = s.core.filter(c => a.includes(wordsOf(c).slice(0, 5).join(' '))).length;
    const sw = new Set(wordsOf(s.text)); const reuse = wordsOf(t.answer_en).filter(w => sw.has(w)).length / wordsOf(t.answer_en).length;
    assert(kept >= 1 || reuse >= 0.4, `${t.q}: no core sentence kept and only ${Math.round(reuse * 100)}% of the words come from the story`);
  }
});
