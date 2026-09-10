import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read = name => fs.readFileSync(new URL('../public/' + name, import.meta.url), 'utf8');
const html = read('det-train.html');
// The pattern table lives between markers so it can run without the page; it only depends on CX and RECOUNT_RE.
const cx = html.match(/const CX = \{[\s\S]*?\n\};/)[0];
const recount = html.match(/const RECOUNT_RE = .*\n/)[0];
const block = html.match(/\/\* ==v6-patterns== \*\/([\s\S]*?)\/\* ==\/v6-patterns== \*\//)[1];
const c = {}; vm.createContext(c);
// const bindings stay in the script scope, so return the table explicitly; the function declaration lands on the context.
const PATTERNS = vm.runInContext(cx + '\n' + recount + '\n' + block + '\n;PATTERNS', c);
const { patternOf } = c;
function prompts() {
  const base = JSON.parse(html.match(/<script id="banks" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  const out = [];
  const add = (b) => {
    if (!b) return;
    (b.writing?.sample || []).forEach(x => out.push(x.prompt));
    (b.writing?.interactive || []).forEach(x => { out.push(x.prompt); out.push(x.followup); });
    (b.speaking?.rts || []).forEach(x => out.push(x.prompt + ' ' + (x.bullets || []).join(' ')));
    (b.speaking?.sample || []).forEach(x => out.push(x.prompt));
    (b.speaking?.interactive || []).forEach(s => (s.questions || []).forEach(q => out.push(q.q)));
  };
  add(base);
  try { add(JSON.parse(read('det-bank2.json'))); } catch {}
  try { add(JSON.parse(read('det-packs.json')).banks); } catch {}
  try { JSON.parse(read('det-kit.json')).topics.forEach(t => (t.questions || []).forEach(q => out.push(q))); } catch {}
  return out.filter(Boolean);
}
test('ten patterns, each with a 3-step short form and a closing step', () => {
  assert.equal(PATTERNS.length, 10);
  assert.equal(new Set(PATTERNS.map(p => p.id)).size, 10);
  for (const p of PATTERNS) {
    assert(p.slots.length >= 5, p.id);
    assert.equal(p.slots.filter(s => s.core).length, 3, p.id + ' needs exactly 3 core slots for the 35-second form');
    assert(/خاتمة|الدرس/.test(p.slots.at(-1).k), p.id + ': last slot must be a closing so the live coach can warn about it');
    assert(p.how && p.cue && p.ar, p.id);
    for (const s of p.slots) {
      // RegExp comes from the vm realm, so instanceof would be false here.
      assert(Object.prototype.toString.call(s.re) === '[object RegExp]' && s.chip && s.en && s.ar && s.w > 0, p.id + ':' + s.k);
      assert(s.re.test(s.en) || s.re.test(s.chip), `${p.id}:${s.k} — the frame must satisfy its own detector, or the coach never ticks it`);
    }
  }
});
test('pattern detection on the question shapes the learner reported', () => {
  const want = [
    ['Describe a skill you learned recently. How did you learn it? What difficulties did you have?', 'learned'],
    ['What skill would you recommend students learn? What is the best way to learn it, and how will it help them?', 'advise'],
    ['Some people think advertising makes us buy things we do not need. Do you agree or disagree?', 'agree'],
    ['Some people prefer to live in a big city, while others prefer a small town. Which do you prefer? What are the advantages of your choice? Are there any disadvantages?', 'compare'],
    ['Describe a person who has had a big influence on your life. Who is this person, and how have they influenced you?', 'describe'],
    ['Think about a person who has had a big influence on your life. Who is this person? How did they influence you? What did you learn from them?', 'describe'],
    ['Describe a problem you solved at work or at university. What was the problem, what did you do, and what was the result?', 'experience'],
    ['Describe a memorable trip you have taken. Where did you go? What did you do there? Why was it memorable?', 'experience'],
    ['Why do some people avoid buying used items?', 'why'],
    ['What makes a good manager? Give reasons and examples.', 'why'],
    ['Looking ahead, how do you think jobs will change in the next twenty years?', 'change'],
    ['How has advertising changed compared with twenty years ago?', 'change'],
    ['Do you prefer to plan your trips carefully or to be spontaneous? Why?', 'preference'],
    ["Let's begin with music. What kind of music do you listen to?", 'about'],
    ['Tell me about the area where you live.', 'about'],
    ['Do you think it is better to see a doctor online or in person? Explain your choice.', 'compare'],
    ['Should schools require students to do a certain number of volunteer hours?', 'agree'],
  ];
  for (const [q, id] of want) assert.equal(patternOf(q)?.id, id, q);
  assert.equal(patternOf(''), null);
  assert.equal(patternOf('   '), null);
});
test('bank prompts: at least 90% get a pattern', () => {
  const all = prompts(); assert(all.length > 200, 'expected the merged prompt banks');
  const miss = all.filter(q => !patternOf(q));
  const cov = 1 - miss.length / all.length;
  assert(cov >= 0.9, `coverage ${(100 * cov).toFixed(1)}% — unmatched: ${miss.slice(0, 10).join(' | ')}`);
});
