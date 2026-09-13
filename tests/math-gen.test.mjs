// محرك أسئلة «رياضياتي»: كل وحدة لها مولّد، وكل سؤال مولَّد يقبل جوابه الرسمي، بلا NaN/undefined، وخيارات الاختيار من متعدد فريدة.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const MG = require(path.join(here, '..', 'public', 'math-gen.js'));
const J = JSON.parse(readFileSync(path.join(here, '..', 'public', 'math-lessons.json'), 'utf8'));

// مولّد عشوائي ثابت حتى تكون النتائج قابلة للتكرار
function seeded(s) { return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

test('every unit has a generator and 200 generated questions are self-consistent in both digit modes', () => {
  for (const mode of ['en', 'ar']) {
    MG.setDigits(mode); MG.seed(seeded(mode === 'en' ? 7 : 11));
    for (const u of J.units) {
      assert.ok(MG.G[u.gen.type], `${u.id}: لا يوجد مولّد ${u.gen.type}`);
      for (let i = 0; i < 200; i++) {
        const q = MG.gen(u);
        const txt = [q.q, q.vis, q.hint, q.steps.join(' '), (q.options || []).join(' ')].join(' ');
        assert.ok(!/undefined|NaN|\[object/.test(txt), `${u.id}: نص فيه undefined/NaN: ${q.q}`);
        assert.ok(q.q && q.hint && q.steps.length, `${u.id}: سؤال بلا تلميح أو خطوات`);
        if (q.type === 'mc') {
          assert.ok(q.options.length >= 2 && new Set(q.options).size === q.options.length, `${u.id}: خيارات مكررة`);
          assert.ok(q.ai >= 0 && q.ai < q.options.length && MG.check(q, q.ai).ok, `${u.id}: مؤشر الجواب`);
          assert.ok(!MG.check(q, (q.ai + 1) % q.options.length).ok, `${u.id}: خيار خاطئ يُقبل`);
        } else {
          assert.ok(String(q.answer).length, `${u.id}: بلا جواب`);
          assert.ok(MG.check(q, q.answer).ok, `${u.id}: الجواب الرسمي مرفوض: ${q.answer} | ${q.q}`);
          for (const a of q.accept) assert.ok(MG.check(q, a).ok, `${u.id}: جواب بديل مرفوض: ${a}`);
          assert.ok(!MG.check(q, '987654321').ok, `${u.id}: يقبل أي رقم`);
        }
      }
    }
  }
  MG.seed(null); MG.setDigits('en');
});

test('checker tolerates Arabic digits, fractions, mixed numbers, percent, points and linear expressions', () => {
  const t = (q, inp) => MG.check(q, inp).ok;
  assert.ok(t({ answer: '3/4' }, '٣/٤') && t({ answer: '3/4' }, '0.75') && t({ answer: '3/4' }, '6/8') && t({ answer: '1 3/4' }, '7/4'));
  assert.ok(t({ answer: '-5' }, '−5') && !t({ answer: '-5' }, '5'));
  assert.ok(t({ answer: '25%' }, '25') && t({ answer: '25%' }, '٢٥٪'));
  assert.ok(t({ answer: '1.8' }, '1,8') && t({ answer: '1.8' }, '1٫8') && t({ answer: '31.4', tol: 0.02 }, '31.41'));
  assert.ok(t({ answer: '(2, -3)', kind: 'point' }, '(٢، −٣)') && t({ answer: '(2, -3)', kind: 'point' }, '2,-3') && !t({ answer: '(2, -3)', kind: 'point' }, '(2,3)'));
  assert.ok(t({ answer: '5س − 4', kind: 'linear' }, '5س-4') && t({ answer: '5س − 4', kind: 'linear' }, '-4+5x') && !t({ answer: '5س − 4', kind: 'linear' }, '5س+4'));
  assert.ok(t({ answer: '3:4', exact: true }, '٣ : ٤') && !t({ answer: '3:4', exact: true }, '6:8'));
  assert.ok(MG.check({ answer: '7' }, '').empty && MG.check({ answer: '7' }, 'abc').bad);
});

test('genMany returns distinct questions and visual helpers render SVG/HTML', () => {
  MG.seed(seeded(3));
  const qs = MG.genMany(J.units.find((u) => u.id === 'n3-add'), 10);
  assert.equal(qs.length, 10);
  assert.ok(new Set(qs.map((q) => q.q)).size >= 8);
  const V = MG.V;
  assert.match(V.fracbar(3, 4), /<svg/); assert.match(V.fracpie(1, 4), /<path/); assert.match(V.numline(-5, 5, [2]), /<circle/);
  assert.match(V.array(3, 4), /class="arr"/); assert.match(V.place(4523), /آلاف/); assert.match(V.column('+', 345, 278), /623/);
  assert.match(V.angle(90), /<path/); assert.match(V.rect(5, 3), /<rect/); assert.match(V.tri(3, 4, 5), /polygon/);
  assert.match(V.bars(['أ', 'ب'], [3, 5]), /<rect/); assert.match(V.grid([[1, 2]]), /<circle/); assert.match(V.clock(3, 30), /<line/);
  assert.match(V.table([['س', 'ص'], ['1', '3']]), /<table/); assert.match(V.steps(['أ']), /<ol/);
  MG.seed(null);
});
