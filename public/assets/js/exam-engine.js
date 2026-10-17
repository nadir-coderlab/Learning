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

function srcTags(it, exam) {
  return (it.src || []).map((k) => `<span class="src-tag">${esc(exam.sources[k]?.name || k)}</span>`).join("");
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
// بطاقة المذاكرة (الإجابة ملونة)
// ---------------------------------------------------------------

export function learnHtml(it, exam) {
  const tags = `<div class="src-row">${srcTags(it, exam)}</div>`;
  const trick = (t) => (t ? `<div class="trick">🔑 <b>الحيلة:</b> ${t}</div>` : "");
  const sayRow = (s) => (s ? `<div class="xsay">🗣️ تنقرأ: ${esc(s)}</div>` : "");
  switch (it.type) {
    case "inst":
      return `${tags}<div class="xemoji">${it.emoji}</div>
        <div class="xlabel">التعليمات في الورقة:</div>
        <div class="xen exam-font">${hl(it.en, it.kw)} ${sayBtn(it.en)}</div>
        <div class="xlabel ok">معناها ✅</div>
        <div class="ans big-ar">${esc(it.ar)}</div>
        <div class="howto">✍️ وش تسوين: ${esc(it.how)}</div>
        ${trick(`الكلمة المهمة: <b>${esc(it.kw)}</b> = ${esc(it.kwAr)}`)}`;

    case "qa": {
      const also = (it.also || []).map((x) => `<div class="also">✅ وممكن يجي الجواب: <span class="en">${esc(x)}</span></div>`).join("");
      const nope = (it.wrong || []).map((x) => `<div class="nope">❌ <span class="en">${esc(x)}</span> ← غلط</div>`).join("");
      return `${tags}${picHtml(it)}
        <div class="xlabel">السؤال ❓</div>
        <div class="xen">${hl(it.q, it.qKey)} ${sayBtn(it.q)}</div>
        <div class="xmean">${esc(it.qAr)}</div>${sayRow(it.qSay)}
        <div class="xlabel ok">الجواب ✅</div>
        <div class="xen"><span class="ans">${hl(it.a, it.aKey, "kw2")}</span> ${sayBtn(it.a)}</div>
        <div class="xmean">${esc(it.aAr)}</div>${sayRow(it.aSay)}
        ${also}${nope}${trick(it.trick)}`;
    }

    case "order":
      return `${tags}
        <div class="xlabel">الكلمات في الورقة (ملخبطة):</div>
        <div class="xen words">${it.words.map(esc).join(" – ")}</div>
        <div class="xlabel ok">الجملة المرتبة ✅</div>
        <div class="xen"><span class="ans">${esc(answerText(it))}</span> ${sayBtn(sayText(it))}</div>
        <div class="chunks">${it.chunks.map((c, i) => `<span class="chunk c${i % 3}">${esc(c)}</span>`).join('<span class="arrow">→</span>')}</div>
        <div class="xmean">${esc(it.ar)}</div>${sayRow(it.say)}
        ${trick(it.trick)}`;

    case "month": {
      const m = monthOf(it), prev = MONTHS[it.m - 2], next = MONTHS[it.m];
      return `${tags}<div class="xemoji">📅</div>
        <div class="xen seq">${it.m - 1}- ${esc(prev.en)} · <span class="ans">${it.m}- ${esc(m.en)}</span> · ${it.m + 1}- ${esc(next?.en || "")}</div>
        <div class="xen"><span class="ans">${esc(m.en)}</span> ${sayBtn(m.en)}</div>
        <div class="xmean">= ${esc(m.ar)} (الشهر رقم ${it.m})</div>${sayRow(m.say)}
        ${trick(it.trick)}`;
    }

    case "monthOrder":
      return `${tags}<div class="xemoji">📅🔀</div>
        <div class="xlabel">في الورقة:</div>
        <div class="xen words">${it.given.map(esc).join(" – ")} <span class="exam-red">(Rearrange)</span></div>
        <div class="xlabel ok">بالترتيب ✅</div>
        <div class="xen"><span class="ans">${esc(answerText(it))}</span> ${sayBtn(sayText(it))}</div>
        <div class="xmean">يناير ← فبراير ← مارس ← أبريل</div>
        ${trick(it.trick)}`;

    case "pair": {
      let body;
      if (it.kind === "past") {
        const left = it.dir === "rev" ? `<span class="ans">${esc(it.a)}</span>` : esc(it.w);
        const right = it.dir === "rev" ? esc(it.w) : `<span class="ans">${esc(it.a)}</span>`;
        body = `<table class="chart"><tr><th>Verb</th><th>Past form</th></tr><tr><td class="en">${left}</td><td class="en">${right}</td></tr></table>
          <div class="xmean">${it.dir === "rev" ? `${esc(it.aAr)} ← ${esc(it.wAr)}` : `${esc(it.wAr)} ← ${esc(it.aAr)}`}</div>`;
      } else {
        const sign = it.kind === "opp" ? "≠" : "→";
        body = `<div class="xen big">${esc(it.w)} ${sign} <span class="ans">${esc(it.a)}</span></div>
          <div class="xmean">${esc(it.wAr)} ${it.kind === "opp" ? "↔" : "←"} ${esc(it.aAr)}</div>`;
      }
      return `${tags}<div class="xemoji">${it.kind === "opp" ? "↔️" : it.kind === "un" ? "✏️" : "📋"}</div>
        ${body} <div>${sayBtn(sayText(it))}</div>${sayRow(it.aSay)}${trick(it.trick)}`;
    }

    case "tf":
      return `${tags}${picHtml(it)}
        <div class="xen">${hl(it.s, it.key)} ${sayBtn(it.s)}</div>
        <div class="xmean">${esc(it.sAr)}</div>${sayRow(it.say)}
        <div class="tf-ans ${it.answer ? "ok" : "no"}">${it.answer ? "✓ صح (True)" : "✗ خطأ (False)"}</div>
        ${trick(it.why)}`;

    case "pick2":
      return `${tags}${picHtml(it)}
        ${it.opts.map((o, i) => `<div class="xen pick ${i === it.answer ? "" : "faded"}">${String.fromCharCode(97 + i)}- ${i === it.answer ? `<span class="ans">${hl(o, it.key, "kw2")}</span> ✅` : `<span class="nope en">${esc(o)}</span>`}</div>`).join("")}
        <div>${sayBtn(sayText(it))}</div>${sayRow(it.say)}
        <div class="xmean">${esc(it.key)} = ${esc(it.keyAr)}</div>
        ${trick(it.trick)}`;

    case "complete":
      return `${tags}${picHtml(it)}
        <div class="xen">${it.s.includes("___") ? fillBlank(it.s, it.answer) : `${esc(it.s)}<br><span class="ans-in">${esc(it.answer)}</span>`} ${sayBtn(sayText(it))}</div>
        <div class="xmean">${esc(it.sAr)} ← ${esc(it.answer)} = ${esc(it.ansAr)}</div>${sayRow(it.say)}
        ${trick(it.trick)}`;

    case "choose":
      return `${tags}
        <div class="xen">${hl(it.s.replace("___", "⟪⟫"), it.clue, "clue").replace("⟪⟫", `<span class="ans-in">${esc(it.answer)}</span>`)} ${sayBtn(sayText(it))}</div>
        <div class="opts-inline">( ${it.opts.map((o) => (o === it.answer ? `<b class="ans">${esc(o)}</b>` : `<span class="nope en">${esc(o)}</span>`)).join(" / ")} )</div>
        <div class="xmean">${esc(it.ar)}</div>${sayRow(it.say)}
        ${trick(it.trick)}`;

    case "word":
      return `${tags}${picHtml(it)}
        <div class="xen big"><span class="ans">${esc(it.w)}</span> ${sayBtn(it.w)}</div>
        ${it.alt ? `<div class="nope">❌ <span class="en">${esc(it.alt)}</span> ← الكلمة الغلط اللي جنبها في الورقة</div>` : ""}
        <div class="xmean">= ${esc(it.ar)}</div>${sayRow(it.say)}
        ${trick(it.trick)}`;

    case "spell":
      return `${tags}${picHtml(it)}
        <div class="xen big spell">${spellHtml(it, false)}</div>
        <div class="xen big spell"><span class="ans">${spellHtml(it, true)}</span> ${sayBtn(it.w)}</div>
        ${it.opts ? `<div class="xmean">الحروف في الورقة: <span class="wordbox en">${it.opts.map(esc).join(" – ")}</span></div>` : ""}
        <div class="xmean">${esc(it.w)} = ${esc(it.ar)}</div>${sayRow(it.say)}
        ${trick(it.trick)}`;
  }
  return "";
}

// ---------------------------------------------------------------
// عرض «النموذج محلول» — سطر مختصر لكل سؤال
// ---------------------------------------------------------------

export function solvedHtml(it, as, n) {
  const num = `<span class="snum">${n}</span>`;
  const sp = sayBtn(sayText(it));
  switch (it.type) {
    case "qa":
      if (as === "cfmt" && it.cfmt) {
        return `<div class="srow">${num}<div class="sbody"><div class="en">${esc(it.q)}</div>
          <div class="en">${it.cfmt.opts.map((o, i) => `${String.fromCharCode(65 + i)}. ${o === it.cfmt.answer ? `<span class="ans">${esc(o)}</span>` : `<span class="nope">${esc(o)}</span>`}`).join(" &nbsp; ")}</div></div>${sp}</div>`;
      }
      return `<div class="srow">${num}<div class="sbody"><div class="en">${esc(it.q)}</div><div class="en"><span class="ans">${esc(it.a)}</span></div></div>${sp}</div>`;
    case "order":
      return `<div class="srow">${num}<div class="sbody"><div class="en muted">${it.words.map(esc).join(" – ")}</div><div class="en"><span class="ans">${esc(answerText(it))}</span></div></div>${sp}</div>`;
    case "month":
      return `<div class="srow">${num}<div class="sbody en"><span class="ans">${it.m}- ${esc(monthOf(it).en)}</span> <small class="muted ar">${esc(monthOf(it).ar)}</small></div>${sp}</div>`;
    case "monthOrder":
      return `<div class="srow">${num}<div class="sbody"><div class="en muted">${it.given.map(esc).join(" – ")} (Rearrange)</div><div class="en"><span class="ans">${esc(answerText(it))}</span></div></div>${sp}</div>`;
    case "pair":
      if (it.kind === "past") {
        return `<div class="srow">${num}<div class="sbody en">${it.dir === "rev" ? `<span class="ans">${esc(it.a)}</span> → ${esc(it.w)}` : `${esc(it.w)} → <span class="ans">${esc(it.a)}</span>`}</div>${sp}</div>`;
      }
      return `<div class="srow">${num}<div class="sbody en">${esc(it.w)} ${it.kind === "opp" ? "≠" : "→"} <span class="ans">${esc(it.a)}</span></div>${sp}</div>`;
    case "tf":
      return `<div class="srow">${num}${picHtml(it, "spic")}<div class="sbody"><div class="en">${esc(it.s)}</div><div><span class="ans">${it.answer ? "✓" : "✗"}</span></div><div class="why">${it.why}</div></div>${sp}</div>`;
    case "pick2":
      return `<div class="srow">${num}${picHtml(it, "spic")}<div class="sbody en">${it.opts.map((o, i) => `${String.fromCharCode(97 + i)}- ${i === it.answer ? `<span class="ans">${esc(o)}</span>` : `<span class="nope">${esc(o)}</span>`}`).join("<br>")}</div>${sp}</div>`;
    case "complete":
      return `<div class="srow">${num}${picHtml(it, "spic")}<div class="sbody en">${it.s.includes("___") ? fillBlank(it.s, it.answer, "ans") : `${esc(it.s)} <span class="ans">${esc(it.answer)}</span>`}</div>${sp}</div>`;
    case "choose":
      return `<div class="srow">${num}<div class="sbody en">${fillBlank(it.s, it.answer, "ans")} <small class="hint-en">(${it.opts.map(esc).join(" / ")})</small></div>${sp}</div>`;
    case "word":
      return `<div class="srow">${num}${picHtml(it, "spic")}<div class="sbody en"><span class="ans">${esc(it.w)}</span>${it.alt ? ` <span class="nope">${esc(it.alt)}</span>` : ""} <small class="muted ar">${esc(it.ar)}</small></div>${sp}</div>`;
    case "spell":
      return `<div class="srow">${num}${picHtml(it, "spic")}<div class="sbody en big">${spellHtml(it, true)}${it.opts && it.opts.length === 2 ? ` <small class="hint-en">(${it.opts.join(" / ")})</small>` : ""}</div>${sp}</div>`;
    case "inst":
      return `<div class="srow">${num}<div class="sbody"><div class="en">${esc(it.en)}</div><div class="ans">${esc(it.ar)}</div></div>${sp}</div>`;
  }
  return "";
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

// يحدد شكل السؤال في الاختبار حسب نوع العنصر وطريقة القسم
function mockMode(it, as) {
  if (as === "match") return it.type === "qa" ? "match" : "choice";
  if (as === "build") return it.type === "order" || it.type === "monthOrder" ? "build" : "write";
  if (as === "write") {
    if (it.type === "monthOrder") return "build";
    if (["pick2", "tf", "choose"].includes(it.type)) return "choice";
    return "write";
  }
  if (as === "box") return ["word", "spell", "complete", "month"].includes(it.type) ? "box" : "choice";
  if (as === "cfmt") return "cfmt";
  if (as === "pair") return "pair";
  return "choice";
}

function partQuestions(items, as, idx, box, matchOrder) {
  const ctxBase = { mock: true };
  let group = null, boxWords = box || null;
  if (as === "match") group = matchOrder ? matchOrder.map((id) => idx.items[id]) : shuffle(items);
  if (as === "box" && !boxWords) {
    if (items.every((x) => x.type === "spell")) boxWords = shuffle([...new Set(items.map((x) => x.letter))]);
    else if (items.every((x) => x.type === "word")) boxWords = shuffle(uniqueWords(items));
    else if (items.every((x) => x.type === "complete")) boxWords = shuffle(items.map((x) => x.answer));
  }
  return items.map((it) => {
    const pool = idx.lessonOfItem[it.id].items;
    return makeQuestion(it, mockMode(it, as), { ...ctxBase, pool, group, box: boxWords });
  });
}

// نموذج كما هو بالضبط
export function buildPaperMock(exam, idx, paperId) {
  const paper = exam.papers.find((p) => p.id === paperId);
  const parts = paper.parts.map((p) => {
    const items = p.items.map((id) => idx.items[id]);
    // نفس ترتيب الأسئلة في الورقة، وأجوبة المطابقة بنفس ترتيبها في الورقة
    const qs = partQuestions(items, p.as, idx, p.box, p.matchOrder);
    return { h: p.h, sub: p.sub || "", subAr: p.subAr, marks: p.marks ?? null, qs, box: p.box || qs.find((x) => x.box)?.box || null };
  });
  const outOf = paper.marks ?? parts.reduce((a, p) => a + p.qs.length, 0);
  return { kind: paperId, title: paper.title, outOf, parts };
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
    return { h: p.h || p.sub, sub: p.subAr, c, n, marks, got: Math.round(got * 100) / 100 };
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
