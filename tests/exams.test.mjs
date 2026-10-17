// «مذاكرة الاختبارات»: كل سؤال محلول يتحول لأسئلة تدريب واختبار صحيحة —
// الجواب الصحيح موجود ومقبول، الخيارات فريدة ومن الأوراق نفسها، المربع فيه الجواب، والدرجة الكاملة = درجة الورقة.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, '..', 'public');
const E = await import(path.join(pub, 'assets', 'js', 'exam-engine.js'));
const { EXAMS, MONTHS } = await import(path.join(pub, 'assets', 'js', 'exams-data.js'));

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
        const card = E.studyCardHtml(it);
        assert.ok(card.includes('الجواب الصح') && card.includes('يعني'), `${it.id}: بطاقة المذاكرة ناقصة`);
        assert.ok(!/undefined|NaN|\[object/.test(card), `${it.id}: نص فيه undefined`);
        for (const mode of MODES) {
          for (let k = 0; k < 20; k++) {
            const group = [it, ...L.items.filter((x) => x !== it).slice(0, 3)];
            checkQuestion(E.makeQuestion(it, mode, { pool: L.items, group, clue: true }), `${it.id}/${mode}`);
          }
        }
      }
    }
  });

  test(`${exam.id}: كل الخيارات من أوراق الاختبار نفسها — ولا كلمة من برا`, () => {
    const allowed = new Set(['T', 'F', ...MONTHS.map((m) => m.en)]);
    for (const L of idx.allLessons) for (const it of L.items) {
      [it.a, it.w, it.alt, it.answer, it.letter, ...(it.also || []), ...(it.wrong || []), ...(it.cfmt?.opts || []), ...(it.opts || [])]
        .filter((v) => typeof v === 'string').forEach((v) => allowed.add(v));
    }
    for (const L of idx.allLessons) for (const it of L.items) {
      for (const mode of MODES) for (let k = 0; k < 20; k++) {
        const q = E.makeQuestion(it, mode, { pool: L.items, group: L.items.slice(0, 4), box: L.box || null });
        if (q.kind !== 'choice') continue;
        if (it.type === 'order' || it.type === 'monthOrder') {
          // خيارات الترتيب = نفس كلمات الجملة بترتيب ثاني
          const words = (it.target || []).join(' ');
          for (const o of q.options) assert.equal(o.val.replace(/ – /g, ' ').replace(/[.]$/, '').split(' ').sort().join(' '), words.split(' ').sort().join(' '), `${it.id}: خيار ترتيب غريب`);
          continue;
        }
        for (const o of q.options) assert.ok(allowed.has(o.val), `${it.id}/${mode}: خيار مو من الأوراق «${o.val}»`);
      }
    }
  });

  test(`${exam.id}: الدروس فيها كل أسئلة الأوراق الثلاث بس`, () => {
    const inPapers = new Set(exam.papers.flatMap((p) => p.parts.flatMap((x) => x.items)));
    assert.deepEqual([...inPapers].sort(), Object.keys(idx.items).sort());
  });

  test(`${exam.id}: أجوبة المطابقة في الاختبار بنفس ترتيبها في الورقة`, () => {
    for (const paper of exam.papers) for (const [pi, part] of paper.parts.entries()) {
      if (!part.matchOrder) continue;
      const m = E.buildPaperMock(exam, idx, paper.id);
      const want = part.matchOrder.map((id) => idx.items[id].a);
      for (const q of m.parts[pi].qs) assert.deepEqual(q.options.map((o) => o.val), want);
      assert.deepEqual(m.parts[pi].qs.map((q) => q.itemId), part.items, 'ترتيب الأسئلة');
    }
  });

  test(`${exam.id}: أسئلة الأوراق كلها بالضغط (بدون كتابة) والخيارات من نفس الفقرة`, () => {
    for (const paper of exam.papers) for (const part of paper.parts) {
      const allowed = new Set(['T', 'F', ...(part.box || []), ...MONTHS.map((m) => m.en)]);
      part.items.forEach((id) => {
        const it = idx.items[id];
        [it.a, it.w, it.alt, it.answer, it.letter, ...(it.cfmt?.opts || []), ...(it.opts || [])]
          .filter((v) => typeof v === 'string').forEach((v) => allowed.add(v));
      });
      for (const id of part.items) for (const mock of [false, true]) for (let k = 0; k < 10; k++) {
        const q = E.paperQuestion(idx.items[id], part, idx, mock);
        assert.ok(q.kind === 'choice' || q.kind === 'build', `${paper.id}/${id}: سؤال كتابة`);
        checkQuestion(q, `${paper.id}/${id}`);
        if (q.kind === 'choice' && !['order', 'monthOrder'].includes(idx.items[id].type)) {
          for (const o of q.options) assert.ok(allowed.has(o.val), `${paper.id}/${id}: خيار من برا الفقرة «${o.val}»`);
        }
        if (part.box && q.kind === 'choice' && ['word', 'spell', 'complete', 'month'].includes(idx.items[id].type)) {
          assert.deepEqual(q.options.map((o) => o.val), part.box, `${paper.id}/${id}: نفس مربع الورقة`);
        }
      }
    }
  });

  test(`${exam.id}: كل فقرة لها شرح بالعربي لطريقة الحل`, () => {
    for (const paper of exam.papers) {
      assert.ok(paper.name, `${paper.id}: بلا اسم عربي`);
      for (const part of paper.parts) {
        assert.ok(part.t && Array.isArray(part.how) && part.how.length >= 2, `${paper.id}: فقرة بلا شرح`);
      }
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
