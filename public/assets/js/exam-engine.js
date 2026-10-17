// محرك «مذاكرة الاختبارات»: يحوّل كل سؤال محلول إلى
//   - بطاقة مذاكرة (الإجابة ملونة + المعنى + طريقة النطق + الحيلة)
//   - أسئلة تدريب بأشكال مختلفة (اختيار / كتابة / ترتيب كلمات)
//   - أسئلة اختبار تجريبي = الأوراق نفسها بالضبط
// كل الأسئلة والخيارات من أوراق الاختبار فقط — ما نضيف شي من برا.
import { MONTHS } from "./exams-data.js";

// ---------------------------------------------------------------
// أدوات عامة
// ---------------------------------------------------------------

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// توحيد الإجابة المكتوبة: بدون فرق حروف كبيرة/صغيرة أو نقاط أو مسافات زائدة
export function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/favourite/g, "favorite")
    .replace(/[.,!?؟:;"()«»]/g, " ")
    .replace(/[–—]/g, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

export function accepts(input, list) {
  const n = norm(input);
  return !!n && list.some((a) => norm(a) === n);
}

// يلوّن أول ظهور لكل كلمة داخل النص (بدون حساسية للحروف الكبيرة)
export function hl(text, words, cls = "kw") {
  let parts = [{ t: String(text ?? ""), h: false }];
  for (const w of [].concat(words || [])) {
    if (!w) continue;
    const re = new RegExp(String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    let done = false;
    const next = [];
    for (const p of parts) {
      if (p.h || done) { next.push(p); continue; }
      const m = p.t.match(re);
      if (!m) { next.push(p); continue; }
      next.push({ t: p.t.slice(0, m.index), h: false }, { t: m[0], h: true }, { t: p.t.slice(m.index + m[0].length), h: false });
      done = true;
    }
    parts = next;
  }
  return parts.map((p) => (p.h ? `<span class="${cls}">${esc(p.t)}</span>` : esc(p.t))).join("");
}

// يستبدل كلمة داخل الجملة بفراغ
function blankify(text, word, fill = "") {
  const re = new RegExp(String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const m = String(text).match(re);
  if (!m) return esc(text);
  const inner = fill ? `<span class="ans-in">${esc(fill)}</span>` : `<span class="blank">&nbsp;?&nbsp;</span>`;
  return esc(text.slice(0, m.index)) + inner + esc(text.slice(m.index + m[0].length));
}

// فراغ ___ داخل جملة القواعد / الإكمال
function fillBlank(s, fill = "", cls = "ans-in") {
  const [a, b] = String(s).split("___");
  if (b === undefined) return esc(s);
  const inner = fill ? `<span class="${cls}">${esc(fill)}</span>` : `<span class="blank">&nbsp;?&nbsp;</span>`;
  return esc(a) + inner + esc(b);
}

export function sayBtn(text) {
  return `<button type="button" class="say" data-say="${esc(text)}" aria-label="استمعي">🔊</button>`;
}

function picHtml(it, cls = "xpic") {
  if (it.pic) return `<img class="${cls}" src="${esc(it.pic)}" alt="" loading="lazy">`;
  if (it.emoji) return `<div class="xemoji">${it.emoji}</div>`;
  return "";
}

const monthOf = (it) => MONTHS[it.m - 1];

// ---------------------------------------------------------------
// فهرسة الاختبار
// ---------------------------------------------------------------

export function indexExam(exam) {
  const items = {}, lessons = {}, lessonOfItem = {}, sectionOfLesson = {}, allLessons = [];
  exam.sections.forEach((sec) => sec.lessons.forEach((L) => {
    lessons[L.id] = L;
    sectionOfLesson[L.id] = sec;
    allLessons.push(L);
    L.items.forEach((it) => { items[it.id] = it; lessonOfItem[it.id] = L; });
  }));
  return { items, lessons, lessonOfItem, sectionOfLesson, allLessons };
}

// ---------------------------------------------------------------
// نصوص الإجابة
// ---------------------------------------------------------------

export function answerText(it) {
  switch (it.type) {
    case "inst": return it.ar;
    case "qa": return it.a;
    case "order": return it.target.join(" ") + (it.end || "");
    case "month": return monthOf(it).en;
    case "monthOrder": return it.target.join(" – ");
    case "pair": return it.a;
    case "tf": return it.answer ? "✓ True" : "✗ False";
    case "pick2": return it.opts[it.answer];
    case "complete": return it.answer;
    case "choose": return it.answer;
    case "word": return it.w;
    case "spell": return it.letter;
  }
  return "";
}

// النص الإنجليزي الذي يُنطق بعد الإجابة
export function sayText(it) {
  switch (it.type) {
    case "inst": return it.en;
    case "qa": return it.a;
    case "order": return it.target.join(" ");
    case "month": return monthOf(it).en;
    case "monthOrder": return it.target.join(", ");
    case "pair": return it.kind === "past" && it.dir === "rev" ? `${it.a}, ${it.w}` : `${it.w}, ${it.a}`;
    case "tf": return it.s;
    case "pick2": return it.opts[it.answer];
    case "complete": return it.s.includes("___") ? it.s.replace("___", it.answer) : `${it.s} ${it.answer}`;
    case "choose": return it.s.replace("___", it.answer);
    case "word": return it.w;
    case "spell": return it.w;
  }
  return "";
}

// وصف قصير للعنصر (للتقارير ولوحة المتابعة)
export function labelOf(it) {
  switch (it.type) {
    case "inst": return it.kw;
    case "qa": return it.a;
    case "order": return answerText(it);
    case "month": return monthOf(it).en;
    case "monthOrder": return "January–April";
    case "pair": return it.kind === "past" && it.dir === "rev" ? `${it.a} ← ${it.w}` : `${it.w} → ${it.a}`;
    case "tf": return `${it.s} (${it.answer ? "✓" : "✗"})`;
    case "pick2": return it.opts[it.answer];
    case "complete": return it.answer;
    case "choose": return it.s.replace("___", it.answer);
    case "word": return it.w;
    case "spell": return `${it.shape} → ${it.letter}`;
  }
  return it.id;
}

function trickOf(it) {
  if (it.type === "tf") return it.why;
  if (it.type === "inst") return `الكلمة المهمة: <b>${esc(it.kw)}</b> = ${esc(it.kwAr)}`;
  if (it.type === "month") return it.trick || `رقم ${it.m} = ${monthOf(it).ar}`;
  return it.trick || "";
}

// HTML الإجابة الصحيحة (للتغذية الراجعة والمراجعة)
export function correctHtml(it) {
  switch (it.type) {
    case "inst": return `<span class="ans">${esc(it.ar)}</span>`;
    case "qa": return `<span class="ans en">${esc(it.a)}</span>`;
    case "order": return `<span class="ans en">${esc(answerText(it))}</span>`;
    case "month": return `<span class="ans en">${it.m}- ${esc(monthOf(it).en)}</span> <small>(${esc(monthOf(it).ar)})</small>`;
    case "monthOrder": return `<span class="ans en">${esc(answerText(it))}</span>`;
    case "pair": return `<span class="ans en">${esc(it.a)}</span> <small>(${esc(it.aAr)})</small>`;
    case "tf": return `<span class="ans">${it.answer ? "✓ صح" : "✗ خطأ"}</span>`;
    case "pick2": return `<span class="ans en">${esc(it.opts[it.answer])}</span>`;
    case "complete": return `<span class="ans en">${esc(it.answer)}</span>`;
    case "choose": return `<span class="ans en">${esc(it.answer)}</span>`;
    case "word": return `<span class="ans en">${esc(it.w)}</span> <small>(${esc(it.ar)})</small>`;
    case "spell": return `<span class="ans en">${spellHtml(it, true)}</span>`;
  }
  return "";
}

export function explainHtml(it) {
  const t = trickOf(it);
  return `<div class="fb-right">الصح: ${correctHtml(it)} ${sayBtn(sayText(it))}</div>${t ? `<div class="trick">🔑 ${t}</div>` : ""}`;
}

function spellHtml(it, filled) {
  const [a, b] = it.shape.split("_");
  const mid = filled ? `<span class="ans-in">${esc(it.letter)}</span>` : `<span class="blank">_</span>`;
  return esc(a) + mid + esc(b ?? "");
}

// ---------------------------------------------------------------
// بطاقة المذاكرة البسيطة: في الورقة مكتوب ← يعني ← الجواب الصح ← كيف أعرف؟
// ---------------------------------------------------------------

function paperView(it) {
  switch (it.type) {
    case "qa": return `<div class="xen">${esc(it.q)} ${sayBtn(it.q)}</div>`;
    case "order": return `<div class="xen words">${it.words.map(esc).join(" – ")}</div>`;
    case "month": {
      const prev = MONTHS[it.m - 2], next = MONTHS[it.m];
      return `<div class="xen seq">${it.m - 1}- ${esc(prev.en)} &nbsp; ${it.m}- <span class="blank">&nbsp;?&nbsp;</span> &nbsp; ${next ? `${it.m + 1}- ${esc(next.en)}` : ""}</div>`;
    }
    case "monthOrder": return `<div class="xen words">${it.given.map(esc).join(" – ")} (Rearrange)</div>`;
    case "pair":
      if (it.kind === "past") {
        const l = it.dir === "rev" ? `<span class="blank">&nbsp;?&nbsp;</span>` : esc(it.w);
        const r = it.dir === "rev" ? esc(it.w) : `<span class="blank">&nbsp;?&nbsp;</span>`;
        return `<table class="chart"><tr><th>Verb</th><th>Past form</th></tr><tr><td class="en">${l}</td><td class="en">${r}</td></tr></table>`;
      }
      return `<div class="xen big">${esc(it.w)} ${it.kind === "opp" ? "≠" : "→"} <span class="blank">&nbsp;?&nbsp;</span></div>`;
    case "tf": return `${picHtml(it)}<div class="xen">${esc(it.s)} ${sayBtn(it.s)}</div>`;
    case "pick2": return `${picHtml(it)}${it.opts.map((o, i) => `<div class="xen pick">${String.fromCharCode(97 + i)}- ${esc(o)}</div>`).join("")}`;
    case "complete": return `${picHtml(it)}<div class="xen">${it.s.includes("___") ? fillBlank(it.s) : `${esc(it.s)} <span class="blank">&nbsp;?&nbsp;</span>`}</div>`;
    case "choose": return `<div class="xen">${fillBlank(it.s)}</div><div class="opts-inline">( ${it.opts.map(esc).join(" / ")} )</div>`;
    case "word": return `${picHtml(it)}${it.alt ? `<div class="xen">${esc(it.w)} &nbsp;/&nbsp; ${esc(it.alt)}</div>` : ""}`;
    case "spell": return `${picHtml(it)}<div class="xen big spell">${spellHtml(it, false)}</div>${it.opts && it.opts.length === 2 ? `<div class="xen">${it.opts.map(esc).join(" &nbsp; ")}</div>` : ""}`;
  }
  return "";
}

function meaningOf(it) {
  switch (it.type) {
    case "qa": return esc(it.qAr);
    case "order": return `الكلمات ملخبطة. لما نرتبها تصير جملة معناها: «${esc(it.ar)}»`;
    case "month": return `وش اسم الشهر رقم ${it.m}؟ (${esc(MONTHS[it.m - 1].ar)})`;
    case "monthOrder": return "رتّبي الشهور من أول السنة: يناير، فبراير، مارس، أبريل";
    case "pair":
      if (it.kind === "opp") return `وش عكس كلمة ${esc(it.w)} (${esc(it.wAr)})؟`;
      if (it.kind === "un") return `حطي un قبل كلمة ${esc(it.w)} (${esc(it.wAr)})`;
      return it.dir === "rev"
        ? `${esc(it.w)} (${esc(it.wAr)}) هي الماضي. وش الفعل حقها؟`
        : `وش الماضي من ${esc(it.w)} (${esc(it.wAr)})؟`;
    case "tf": return `${esc(it.sAr)} — هل هذا صح حسب الصورة؟`;
    case "pick2": return "أي جملة توصف الصورة؟";
    case "complete": return esc(it.sAr);
    case "choose": return esc(it.ar);
    case "word": return "وش اسم الصورة؟";
    case "spell": return `وش الحرف الناقص في كلمة ${esc(it.w)} (${esc(it.ar)})؟`;
  }
  return "";
}

function readAs(it) {
  return { qa: it.aSay, order: it.say, month: it.m && MONTHS[it.m - 1].say, pair: it.aSay, tf: it.say, pick2: it.say,
    complete: it.say, choose: it.say, word: it.say, spell: it.say }[it.type] || "";
}

export function studyCardHtml(it) {
  const say = readAs(it);
  const t = trickOf(it);
  return `
    <div class="st-block"><div class="st-label">📄 في الورقة مكتوب:</div>${paperView(it)}</div>
    <div class="st-block mean"><div class="st-label">🤔 يعني:</div><div class="st-ar">${meaningOf(it)}</div></div>
    <div class="st-block good"><div class="st-label">✅ الجواب الصح:</div>
      <div class="st-ans">${correctHtml(it)} ${sayBtn(sayText(it))}</div>
      ${say ? `<div class="xsay">🗣️ تنقرأ: ${esc(say)}</div>` : ""}</div>
    ${t ? `<div class="trick">💡 <b>كيف أعرف؟</b><br>${t}</div>` : ""}`;
}

// ---------------------------------------------------------------
// صناعة الأسئلة
// mode: choice | write | build | match | cfmt | pair | box
// ctx:  { pool: عناصر نفس الدرس, group: عناصر مجموعة الاختبار, box: كلمات المربع, mock: true/false, clue: true/false }
// ---------------------------------------------------------------

const opt = (val, cls = "en", html = null) => ({ val, html: html ?? esc(val), cls });

function othersFrom(ctx, it, f, n) {
  const mine = f(it);
  const out = [];
  for (const x of shuffle(ctx.pool || [])) {
    if (x.id === it.id || (x.dup && x.dup === it.dup)) continue;
    const v = f(x);
    if (v && v !== mine && !out.includes(v)) out.push(v);
    if (out.length >= n) break;
  }
  return out;
}

function wrongOrders(tokens, n, joiner = " ", end = "") {
  const right = tokens.join(joiner);
  const out = new Set();
  for (let k = 0; k < 40 && out.size < n; k++) {
    const t = shuffle(tokens).join(joiner);
    if (t !== right) out.add(t + end);
  }
  return [...out];
}

export function makeQuestion(it, mode, ctx = {}) {
  const base = { itemId: it.id, label: labelOf(it), say: sayText(it), explain: explainHtml(it), item: it };
  const q = (o) => ({ ...base, ...o });

  switch (it.type) {
    // ----- التعليمات -----
    case "inst": {
      if (mode === "write") {
        return q({
          kind: "choice", head: `<div class="qtitle">أي تعليمات معناها:</div><div class="ans big-ar">${esc(it.ar)}</div>`,
          options: shuffle([it.en, ...othersFrom(ctx, it, (x) => x.en, 3)]).map((v) => opt(v, "en sm")), answer: it.en,
          hint: `دوري الكلمة: <b>${esc(it.kwAr)}</b>`
        });
      }
      return q({
        kind: "choice", head: `<div class="qtitle">وش معنى هالتعليمات؟</div><div class="xen exam-font">${esc(it.en)} ${sayBtn(it.en)}</div>`,
        options: shuffle([it.ar, ...othersFrom(ctx, it, (x) => x.ar, 3)]).map((v) => opt(v, "ar")), answer: it.ar,
        hint: `الكلمة المهمة: <b>${esc(it.kw)}</b> = ${esc(it.kwAr)}`
      });
    }

    // ----- سؤال وجواب -----
    case "qa": {
      const head = `${picHtml({ emoji: ctx.mock ? "" : it.emoji })}<div class="xen">${esc(it.q)} ${ctx.mock ? "" : sayBtn(it.q)}</div>`;
      const hint = `${esc(it.qAr)}<br>الجواب معناه: <b>${esc(it.aAr)}</b>`;
      if (mode === "write") {
        return q({
          kind: "write", head: `${head}<div class="qtitle">كمّلي الجواب بالكلمة الناقصة:</div><div class="xen">${blankify(it.a, it.blank)}</div>`,
          accept: it.blankAccept || [it.blank], input: "word", hint
        });
      }
      if (mode === "match") {
        return q({
          kind: "choice", head, hint,
          options: ctx.group.map((x, i) => opt(x.a, "en sm", `<b>${String.fromCharCode(97 + i)})</b> ${esc(x.a)}`)), answer: it.a, keepOrder: true
        });
      }
      if (it.cfmt && (mode === "cfmt" || (!ctx.mock && Math.random() < 0.35))) {
        return q({
          kind: "choice", head, hint,
          options: it.cfmt.opts.map((v, i) => opt(v, "en sm", `<b>${String.fromCharCode(65 + i)}.</b> ${esc(v)}`)), answer: it.cfmt.answer, keepOrder: true
        });
      }
      return q({
        kind: "choice", head, hint,
        options: shuffle([it.a, ...othersFrom(ctx, it, (x) => x.a, 3)]).map((v) => opt(v, "en sm")), answer: it.a
      });
    }

    // ----- ترتيب الجملة -----
    case "order": {
      const words = `<div class="xen words">${it.words.map(esc).join(" – ")}</div>`;
      const hint = `${esc(it.ar)}<br>ابدئي بـ <b class="en">${esc(it.target[0])}</b>`;
      if (mode === "build" || mode === "match") {
        return q({ kind: "build", head: `<div class="qtitle">رتّبي الكلمات — اضغطي عليها بالترتيب</div>`, chips: it.words, target: it.target, end: it.end || "", hint });
      }
      if (mode === "write") {
        return q({ kind: "write", head: `<div class="qtitle">اكتبي الجملة مرتبة (انسخي الكلمات)</div>${words}`, accept: [answerText(it)], input: "sentence", hint });
      }
      return q({
        kind: "choice", head: `<div class="qtitle">أي جملة مرتبة صح؟</div>${words}`, hint,
        options: shuffle([answerText(it), ...wrongOrders(it.target, 2, " ", it.end || "")]).map((v) => opt(v, "en sm")), answer: answerText(it)
      });
    }

    // ----- الشهر الناقص -----
    case "month": {
      const m = monthOf(it), prev = MONTHS[it.m - 2], next = MONTHS[it.m];
      const head = `<div class="qtitle">وش الشهر الناقص؟</div>
        <div class="xen seq">${it.m - 1}- ${esc(prev.en)} &nbsp; <b>${it.m}- <span class="blank">&nbsp;?&nbsp;</span></b> &nbsp; ${next ? `${it.m + 1}- ${esc(next.en)}` : ""}</div>`;
      const hint = `الشهر رقم ${it.m} = <b>${esc(m.ar)}</b>`;
      // نفس مربع الشهور اللي في ورقة المراجعة
      const box = ctx.box || (ctx.pool || []).filter((x) => x.type === "month").map((x) => monthOf(x).en);
      if (mode === "write" || mode === "box") return q({ kind: "write", head, box, accept: [m.en], input: "word", hint });
      return q({ kind: "choice", head, hint, options: shuffle(box.includes(m.en) ? box : [m.en, ...box]).map((v) => opt(v)), answer: m.en });
    }

    case "monthOrder": {
      const hint = "ابدئي بأول شهر في السنة: <b>January</b> (يناير)";
      if (mode === "choice") {
        return q({
          kind: "choice", head: `<div class="qtitle">(Rearrange) — أي ترتيب صح؟</div><div class="xen words">${it.given.map(esc).join(" – ")}</div>`, hint,
          options: shuffle([answerText(it), ...wrongOrders(it.target, 2, " – ")]).map((v) => opt(v, "en sm")), answer: answerText(it)
        });
      }
      return q({ kind: "build", head: `<div class="qtitle">(Rearrange) رتّبي الشهور — اضغطي بالترتيب</div>`, chips: it.given, target: it.target, end: "", joiner: " – ", hint });
    }

    // ----- العكس / un / الماضي -----
    case "pair": {
      let head;
      if (it.kind === "past") {
        const left = it.dir === "rev" ? `<span class="blank">&nbsp;?&nbsp;</span>` : esc(it.w);
        const right = it.dir === "rev" ? esc(it.w) : `<span class="blank">&nbsp;?&nbsp;</span>`;
        head = `<div class="qtitle">${it.dir === "rev" ? "وش الفعل؟ (Verb)" : "وش الماضي؟ (Past form)"}</div>
          <table class="chart"><tr><th>Verb</th><th>Past form</th></tr><tr><td class="en">${left}</td><td class="en">${right}</td></tr></table>`;
      } else if (it.kind === "opp") {
        head = `<div class="qtitle">وش عكس الكلمة؟ (opposite)</div><div class="xen big">${esc(it.w)} ≠ <span class="blank">&nbsp;?&nbsp;</span></div>`;
      } else {
        head = `<div class="qtitle">(Rewrite the words using un) حطي un في أولها</div><div class="xen big">${esc(it.w)} → <span class="blank">&nbsp;?&nbsp;</span></div>`;
      }
      const hint = `${esc(it.w)} = ${esc(it.wAr)} · المطلوب معناه: <b>${esc(it.aAr)}</b>`;
      if (mode === "write" || mode === "box") return q({ kind: "write", head, accept: it.accept || [it.a], input: "word", hint });
      return q({ kind: "choice", head, hint, options: shuffle([it.a, ...othersFrom(ctx, it, (x) => x.a, 3)]).map((v) => opt(v)), answer: it.a });
    }

    // ----- صح / خطأ -----
    case "tf": {
      return q({
        kind: "choice", head: `${picHtml(it)}<div class="xen">${esc(it.s)} ${ctx.mock ? "" : sayBtn(it.s)}</div>`,
        options: [opt("T", "tf ok", "✓"), opt("F", "tf no", "✗")], answer: it.answer ? "T" : "F", keepOrder: true, row: true,
        hint: esc(it.sAr)
      });
    }

    // ----- الجملة والصورة -----
    case "pick2": {
      if (mode === "write") {
        return q({
          kind: "write", head: `${picHtml(it)}<div class="xen">${blankify(it.opts[it.answer], it.key)}</div>`,
          box: shuffle([it.key, it.other]), accept: [it.key], input: "word", hint: `الصورة = <b>${esc(it.keyAr)}</b>`
        });
      }
      return q({
        kind: "choice", head: `${picHtml(it)}<div class="qtitle">أي جملة تطابق الصورة؟</div>`,
        options: it.opts.map((v, i) => opt(v, "en sm", `<b>${String.fromCharCode(97 + i)}-</b> ${esc(v)}`)), answer: it.opts[it.answer], keepOrder: true,
        hint: `الصورة = <b>${esc(it.keyAr)}</b>`
      });
    }

    case "complete": {
      const sent = it.s.includes("___") ? fillBlank(it.s) : `${esc(it.s)}<br><span class="blank">&nbsp;?&nbsp;</span>`;
      const head = `${picHtml(it)}<div class="xen">${sent}</div>`;
      const box = ctx.box || (ctx.pool || []).filter((x) => x.type === "complete").map((x) => x.answer);
      const hint = esc(it.sAr);
      if (mode === "write" || mode === "box") return q({ kind: "write", head, box: shuffle(box), accept: [it.answer], input: "word", hint });
      return q({ kind: "choice", head, hint, options: shuffle(box.length >= 2 ? box : [it.answer]).map((v) => opt(v)), answer: it.answer });
    }

    // ----- القواعد -----
    case "choose": {
      const showClue = ctx.clue && !ctx.mock;
      const sentence = showClue
        ? hl(it.s.replace("___", "⟪⟫"), it.clue, "clue").replace("⟪⟫", `<span class="blank">&nbsp;?&nbsp;</span>`)
        : fillBlank(it.s);
      const head = `<div class="xen">${sentence}</div>`;
      const hint = `دوري الكلمة اللي تدلك: <b class="en">${esc(it.clue)}</b><br>${esc(it.ar)}`;
      if (mode === "write") {
        return q({ kind: "write", head: `${head}<div class="opts-inline">( ${it.opts.map(esc).join(" / ")} )</div>`, accept: [it.answer], input: "word", hint });
      }
      return q({ kind: "choice", head, hint, options: it.opts.map((v) => opt(v)), answer: it.answer, keepOrder: !!ctx.mock });
    }

    // ----- المفردات -----
    case "word": {
      const head = `${picHtml(it)}`;
      const hint = `معناها: <b>${esc(it.ar)}</b> — تبدأ بحرف <b class="en">${esc(it.w[0])}</b>`;
      if (mode === "write" || mode === "box") {
        // مربع الكلمات = كلمات نفس الورقة (مثل الاختبار)
        const box = ctx.box || shuffle(uniqueWords((ctx.pool || [it]).filter((x) => x.type === "word" && x.src[0] === it.src[0])));
        return q({ kind: "write", head: `${head}<div class="qtitle">اكتبي اسم الصورة (انسخيه من المربع)</div>`, box, accept: [it.w, ...(it.accept || [])], input: "word", hint });
      }
      if (mode === "pair" && it.alt) {
        return q({ kind: "choice", head: `${head}<div class="qtitle">اختاري الكلمة الصحيحة</div>`, hint, options: [it.w, it.alt].map((v) => opt(v)), answer: it.w, keepOrder: true });
      }
      const pool = othersFrom(ctx, it, (x) => x.w, 4).filter((w) => norm(w) !== norm(it.w) && norm(w) !== norm(it.alt || ""));
      const options = [it.w, ...(it.alt ? [it.alt] : []), ...pool].slice(0, 4);
      return q({ kind: "choice", head: `${head}<div class="qtitle">وش اسم الصورة؟</div>`, hint, options: shuffle(options).map((v) => opt(v)), answer: it.w });
    }

    // ----- الإملاء -----
    case "spell": {
      const head = `${picHtml(it)}<div class="xen big spell">${spellHtml(it, false)}</div>`;
      const hint = `${esc(it.w)}؟ معناها: <b>${esc(it.ar)}</b> — تنقرأ: ${esc(it.say)}`;
      if (mode === "write" || mode === "box") {
        return q({ kind: "write", head, box: mode === "box" ? ctx.box || it.opts : null, accept: [it.letter], input: "letter", hint });
      }
      const options = it.opts ? [...it.opts] : shuffle([it.letter, ...othersFrom(ctx, it, (x) => x.letter, 3)]);
      return q({ kind: "choice", head, hint, options: options.map((v) => opt(v, "en letter")), answer: it.letter, keepOrder: !!it.opts });
    }
  }
  throw new Error("نوع غير معروف: " + it.type);
}

function uniqueWords(items) {
  const seen = new Set(), out = [];
  items.forEach((x) => { const k = norm(x.w); if (!seen.has(k)) { seen.add(k); out.push(x.w); } });
  return out;
}

// ---------------------------------------------------------------
// بناء الاختبار التجريبي
// ---------------------------------------------------------------

// سؤال من الورقة — كل الأسئلة بالضغط (بدون كيبورد) والخيارات من نفس الفقرة في الورقة فقط
export function paperQuestion(it, part, idx, mock = false) {
  const pool = part.items.map((id) => idx.items[id]);
  const ctx = { pool, mock };
  if (it.type === "order" || it.type === "monthOrder") return makeQuestion(it, "build", ctx);
  if (part.as === "match") return makeQuestion(it, "match", { ...ctx, group: (part.matchOrder || part.items).map((id) => idx.items[id]) });
  if (part.as === "cfmt") return makeQuestion(it, "cfmt", ctx);
  if (part.as === "pair") return makeQuestion(it, "pair", ctx);
  const q = makeQuestion(it, "choice", ctx);
  const ans = { word: it.w, spell: it.letter, complete: it.answer, month: it.m && MONTHS[it.m - 1].en }[it.type];
  if (part.box && ans) {
    // نفس مربع الكلمات/الحروف اللي في الورقة
    q.options = part.box.map((v) => opt(v, it.type === "spell" ? "en letter" : "en"));
    q.answer = ans;
    q.keepOrder = true;
    q.box = null;
  }
  return q;
}

// الورقة كاملة كاختبار — نفس الأسئلة ونفس الترتيب
export function buildPaperMock(exam, idx, paperId) {
  const paper = exam.papers.find((p) => p.id === paperId);
  const parts = paper.parts.map((p) => ({
    h: p.h, sub: p.sub || "", t: p.t, marks: p.marks ?? null,
    qs: p.items.map((id) => paperQuestion(idx.items[id], p, idx, true))
  }));
  const outOf = paper.marks ?? parts.reduce((a, p) => a + p.qs.length, 0);
  return { kind: paperId, title: paper.name, outOf, parts };
}

// حساب الدرجة: كل قسم = (الصح ÷ عدد الأسئلة) × درجته
export function scoreMock(mock, answers) {
  let total = 0;
  const parts = mock.parts.map((p, pi) => {
    const list = answers.filter((a) => a.part === pi);
    const c = list.filter((a) => a.ok).length, n = p.qs.length;
    const marks = p.marks ?? n;
    const got = n ? (c / n) * marks : 0;
    total += got;
    return { h: p.h || p.sub, t: p.t, c, n, marks, got: Math.round(got * 100) / 100 };
  });
  const outOf = mock.outOf;
  const score = Math.round(total * 2) / 2;
  return { score, outOf, pct: Math.round((100 * total) / outOf), parts };
}

export function levelFor(pct) {
  if (pct >= 90) return { icon: "🏆", label: "ممتازة — جاهزة للاختبار", short: "ممتازة" };
  if (pct >= 75) return { icon: "⭐", label: "جيد جدًا — تحتاج مراجعة بسيطة", short: "جيد جدًا" };
  if (pct >= 60) return { icon: "😊", label: "جيدة — تحتاج تدريب أكثر", short: "جيدة" };
  return { icon: "💪", label: "تحتاج مراجعة — كمّلي الدروس", short: "تحتاج مراجعة" };
}
