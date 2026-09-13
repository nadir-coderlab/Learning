// محتوى دروس «رياضياتي»: البنية، الترتيب، أنواع المولّدات، وكتل الشرح لكل وحدة.
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
const VIS = { fracbar: ['n', 'd'], fracpie: ['n', 'd'], numline: ['min', 'max'], array: ['r', 'c'], place: ['num'], column: ['op', 'a', 'b'], angle: ['deg'], rect: ['w', 'ht'], tri: ['a', 'b', 'c'], bars: ['labels', 'values'], grid: ['points'], clock: ['hh', 'mm'], table: ['rows'], steps: ['items'] };

test('meta: levels 3..8 and 7 strands', () => {
  assert.deepEqual(Object.keys(J.meta.levels), ['3', '4', '5', '6', '7', '8']);
  assert.equal(Object.keys(J.meta.strands).length, 7);
  for (const lv of Object.values(J.meta.levels)) assert.ok(lv.name && lv.island && lv.emoji && lv.color);
});

test('units: unique ids, ascending levels, known strands, known generator types, every level has at least 9 units', () => {
  const ids = new Set(); let lastLevel = 0; const perLevel = {};
  for (const u of J.units) {
    assert.ok(!ids.has(u.id), `id مكرر ${u.id}`); ids.add(u.id);
    assert.ok(u.level >= lastLevel, `${u.id}: الترتيب حسب المستوى`); lastLevel = u.level;
    assert.ok(J.meta.levels[u.level] && J.meta.strands[u.strand], `${u.id}: مستوى/مجال غير معروف`);
    assert.ok(u.title && u.desc && u.emoji, `${u.id}: عنوان/وصف/رمز`);
    assert.ok(MG.G[u.gen.type], `${u.id}: مولّد غير موجود ${u.gen.type}`);
    perLevel[u.level] = (perLevel[u.level] || 0) + 1;
  }
  for (const lv of [3, 4, 5, 6, 7, 8]) assert.ok(perLevel[lv] >= 9, `المستوى ${lv} فيه ${perLevel[lv]} وحدات فقط`);
  assert.ok(J.units.length >= 59);
});

test('content: every unit has goal, explanation blocks with visuals, 2 worked examples, tips, mistakes and a story', () => {
  const missing = J.units.filter((u) => !u.content).map((u) => u.id);
  assert.deepEqual(missing, [], 'وحدات بلا محتوى: ' + missing.join(', '));
  for (const u of J.units) {
    const c = u.content;
    assert.ok(c.goal && c.goal.length > 10, `${u.id}: goal`);
    assert.ok(Array.isArray(c.explain) && c.explain.length >= 6, `${u.id}: explain قصير (${(c.explain || []).length})`);
    let visuals = 0;
    for (const b of c.explain) {
      const keys = Object.keys(b);
      assert.ok(keys.length, `${u.id}: كتلة فاضية`);
      if (b.v) { assert.ok(VIS[b.v], `${u.id}: رسمة غير معروفة ${b.v}`); for (const k of VIS[b.v]) assert.ok(b[k] !== undefined, `${u.id}: الرسمة ${b.v} بلا ${k}`); visuals++;
        if (b.v === 'fracbar' || b.v === 'fracpie') assert.ok(b.n <= b.d && b.d <= 20, `${u.id}: كسر ${b.n}/${b.d}`);
        if (b.v === 'numline') { assert.ok(b.max > b.min && b.max - b.min <= 120, `${u.id}: مدى خط الأعداد`); for (const m of b.marks || []) assert.ok(m >= b.min && m <= b.max, `${u.id}: علامة خارج المدى`); }
        if (b.v === 'bars') assert.equal(b.labels.length, b.values.length, `${u.id}: أعمدة`);
        if (b.v === 'column') { assert.ok(['+', '-', '×'].includes(b.op), `${u.id}: عملية عمودية ${b.op}`); if (b.op === '-') assert.ok(b.a >= b.b, `${u.id}: طرح سالب`); }
        if (b.v === 'tri') assert.ok(Math.abs(b.a * b.a + b.b * b.b - b.c * b.c) < 1e-6, `${u.id}: مثلث ${b.a},${b.b},${b.c} ليس قائمًا`);
        if (b.v === 'rect') assert.ok(b.w <= 14 && b.ht <= 10, `${u.id}: مستطيل كبير`);
      } else { const txt = b.t || b.hd || b.ex; assert.ok(typeof txt === 'string' && txt.length, `${u.id}: كتلة بلا نص`); assert.ok(!/<[a-z/]/i.test(txt), `${u.id}: HTML في الشرح`); }
    }
    assert.ok(visuals >= 1, `${u.id}: بلا رسمة`);
    assert.ok(Array.isArray(c.examples) && c.examples.length >= 2, `${u.id}: أقل من مثالين`);
    for (const ex of c.examples) { assert.ok(ex.q && ex.steps.length >= 2 && String(ex.answer).length, `${u.id}: مثال ناقص`); }
    assert.ok(c.tips.length >= 1 && c.mistakes.length >= 1 && c.story, `${u.id}: tips/mistakes/story`);
    for (const m of c.mistakes) assert.ok(m.wrong && m.right, `${u.id}: خطأ شائع ناقص`);
  }
});
