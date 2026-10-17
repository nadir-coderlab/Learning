// «مذاكرة الاختبارات»: كل سؤال محلول يتحول لأسئلة تدريب واختبار صحيحة —
// الجواب الصحيح موجود ومقبول، الخيارات فريدة، المربع فيه الجواب، والدرجة الكاملة = درجة الورقة.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, '..', 'public');
const E = await import(path.join(pub, 'assets', 'js', 'exam-engine.js'));
const { EXAMS } = await import(path.join(pub, 'assets', 'js', 'exams-data.js'));

const MODES = ['choice', 'write', 'build', 'box', 'match', 'cfmt', 'pair'];

function checkQuestion(q, where) {
  assert.ok(q.head, `${where}: سؤال بلا نص`);
  if (q.kind === 'choice') {
    const vals = q.options.map((o) => o.val);
    assert.ok(vals.length >= 2, `${where}: أقل من خيارين`);
    assert.equal(new Set(vals).size, vals.length, `${where}: خيارات مكررة ${vals}`);
    assert.ok(vals.includes(q.answer), `${where}: الجواب ${q.answer} مو ضمن الخيارات`);
  } else if (q.kind === 'write') {
    assert.ok(q.accept?.length && E.accepts(q.accept[0], q.accept), `${where}: الجواب الرسمي ما ينقبل`);
    assert.ok(!E.accepts('zzz', q.accept), `${where}: جواب غلط ينقبل`);
    if (q.box) assert.ok(q.box.some((b) => E.accepts(b, q.accept)), `${where}: المربع ما فيه الجواب`);
  } else if (q.kind === 'build') {
    assert.deepEqual([...q.chips].sort(), [...q.target].sort(), `${where}: كلمات الترتيب ما تطابق الجملة`);
  } else {
    assert.fail(`${where}: نوع سؤال غير معروف ${q.kind}`);
  }
}

for (const exam of EXAMS) {
  const idx = E.indexExam(exam);

  test(`${exam.id}: كل عنصر له بطاقة مذاكرة وحل وأسئلة صحيحة بكل الأشكال`, () => {
    const ids = new Set();
    for (const L of idx.allLessons) {
      assert.ok(L.rule && L.instr?.en, `${L.id}: درس بلا قاعدة أو تعليمات`);
      for (const it of L.items) {
        assert.ok(!ids.has(it.id), `معرّف مكرر ${it.id}`);
        ids.add(it.id);
        if (it.pic) assert.ok(existsSync(path.join(pub, it.pic)), `${it.id}: الصورة غير موجودة ${it.pic}`);
        const learn = E.learnHtml(it, exam), solved = E.solvedHtml(it, 'cfmt', 1);
        assert.ok(learn && solved, `${it.id}: بلا بطاقة`);
        assert.ok(!/undefined|NaN|\[object/.test(learn + solved), `${it.id}: نص فيه undefined`);
        for (const mode of MODES) {
          for (let k = 0; k < 20; k++) {
            const group = [it, ...L.items.filter((x) => x !== it).slice(0, 3)];
            checkQuestion(E.makeQuestion(it, mode, { pool: L.items, group, clue: true }), `${it.id}/${mode}`);
          }
        }
      }
    }
  });

  test(`${exam.id}: الاختبار المنوّع بنفس ترتيب الأبلة ودرجته الكاملة ${exam.marks}`, () => {
    for (let k = 0; k < 200; k++) {
      const m = E.buildVariantMock(exam, idx);
      assert.deepEqual(m.parts.map((p) => p.sec), exam.mock.map((x) => x.sec), 'ترتيب الأقسام');
      for (const p of m.parts) {
        for (const q of p.qs) checkQuestion(q, `mock/${q.itemId}`);
        const ids = p.qs.map((q) => q.itemId);
        assert.ok(!(ids.includes('g3') && ids.includes('g4')), 'سؤالا اليوم الوطني مع بعض');
      }
      const all = m.parts.flatMap((p, pi) => p.qs.map(() => ({ part: pi, ok: true })));
      assert.equal(E.scoreMock(m, all).score, exam.marks);
      const none = m.parts.flatMap((p, pi) => p.qs.map(() => ({ part: pi, ok: false })));
      assert.equal(E.scoreMock(m, none).score, 0);
    }
  });

  test(`${exam.id}: كل نموذج بالضبط يُبنى ودرجته الكاملة صحيحة`, () => {
    for (const paper of exam.papers) {
      for (const p of paper.parts) for (const id of p.items) assert.ok(idx.items[id], `${paper.id}: عنصر مفقود ${id}`);
      const m = E.buildPaperMock(exam, idx, paper.id);
      for (const p of m.parts) for (const q of p.qs) checkQuestion(q, `${paper.id}/${q.itemId}`);
      const all = m.parts.flatMap((p, pi) => p.qs.map(() => ({ part: pi, ok: true })));
      const expected = paper.marks ?? paper.parts.reduce((a, p) => a + p.items.length, 0);
      assert.equal(E.scoreMock(m, all).score, expected, paper.id);
    }
  });
}

test('توحيد الإجابة المكتوبة متسامح مع الحروف الكبيرة والنقاط', () => {
  assert.ok(E.accepts('we will go shopping this weekend', ['We will go shopping this weekend.']));
  assert.ok(E.accepts('My favorite month is December.', ['My favourite month is December.']));
  assert.ok(E.accepts('  Unlucky ', ['unlucky']));
  assert.ok(E.accepts('is / am / are', ['is/am/are']));
  assert.ok(!E.accepts('tall', ['tallest']));
  assert.ok(!E.accepts('', ['a']));
});
