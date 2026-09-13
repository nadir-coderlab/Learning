/* ============================================================
   math-gen.js — محرك أسئلة «رياضياتي» (تأسيس الرياضيات من ثالث ابتدائي إلى ثاني متوسط)

   كل وحدة في math-lessons.json لها مولّد (gen.type) يصنع أسئلة لا نهائية بأرقام
   عشوائية، ومع كل سؤال: تلميح، وخطوات الحل بالتفصيل، وأحيانًا رسمة (كسر، خط أعداد،
   مصفوفة، زاوية، مستطيل، أعمدة، مستوى إحداثي…).

   الواجهة (window.MathGen أو module.exports):
     gen(unit)            ← سؤال {q, vis, type:'num'|'mc', answer, accept, options, ai, hint, steps, kind, tol}
     genMany(unit, n)     ← n أسئلة مختلفة
     check(q, input)      ← {ok} مع تسامح: أرقام عربية/إنجليزية، كسور، أعداد كسرية، نقاط، تعابير خطية
     V                    ← دوال الرسم (تُستخدم أيضًا في شرح الدروس)
     setDigits('ar'|'en') ← عرض الأرقام ١٢٣ (مثل الكتاب المدرسي) أو 123
     seed(fn)             ← مولّد عشوائي بديل للاختبارات
   ============================================================ */
(function (root) {
'use strict';
let rnd = Math.random;
const ri = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
const pick = (a) => a[ri(0, a.length - 1)];
const shuffle = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = ri(0, i); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const lcm = (a, b) => a * b / gcd(a, b);
const r2 = (x) => Math.round(x * 100) / 100;
const isInt = (x) => Math.abs(x - Math.round(x)) < 1e-9;

/* ---------- عرض الأرقام والرياضيات ---------- */
let DIG = 'en';
const AR = '٠١٢٣٤٥٦٧٨٩';
const dg = (s) => DIG === 'ar' ? String(s).replace(/[0-9]/g, (d) => AR[+d]) : String(s);
const M = (s) => `<span class="m" dir="${DIG === 'ar' ? 'rtl' : 'ltr'}">${dg(s)}</span>`;
const F = (n, d) => `<span class="frac"><span>${dg(n)}</span><span>${dg(d)}</span></span>`;
const MX = (w, n, d) => `<span class="m" dir="${DIG === 'ar' ? 'rtl' : 'ltr'}">${dg(w)} ${F(n, d)}</span>`;
const sgn = (n) => n < 0 ? `−${Math.abs(n)}` : `${n}`;
const par = (n) => n < 0 ? `(−${Math.abs(n)})` : `${n}`;
const fx = (x) => { const r = Math.round(x * 1e6) / 1e6; return String(r).replace('-', '−'); };
const simp = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
const fs = (n, d) => { [n, d] = simp(n, d); return d === 1 ? `${n}` : `${n}/${d}`; };
const fh = (n, d) => { [n, d] = simp(n, d); return d === 1 ? M(sgn(n)) : `<span class="m" dir="${DIG === 'ar' ? 'rtl' : 'ltr'}">${F(sgn(n), d)}</span>`; };
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
const sup = (n) => String(n).split('').map((c) => SUP[c] || c).join('');
const pt = (x, y) => `(${sgn(x)}، ${sgn(y)})`;

const Q = (o) => Object.assign({ type: 'num', vis: '', hint: '', steps: [], accept: [] }, o);
const MC = (q, options, ai, extra) => Object.assign(Q({ q, type: 'mc', options, ai, answer: String(options[ai]) }), extra || {});
const uniq = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);
const mcFrom = (q, correct, wrongs, extra) => { const opts = shuffle(uniq([correct].concat(wrongs)).slice(0, 4)); return MC(q, opts, opts.indexOf(correct), extra); };

/* ---------- الرسومات ---------- */
const V = {};
V.fracbar = (n, d) => { const w = Math.min(300, d * 36), cw = w / d; let s = `<svg class="vis" viewBox="0 0 ${w + 4} 44" width="${w + 4}" height="44">`; for (let i = 0; i < d; i++) s += `<rect x="${2 + i * cw}" y="2" width="${cw}" height="40" fill="${i < n ? '#f59e0b' : '#fff'}" stroke="#7c3aed" stroke-width="2"/>`; return s + '</svg>'; };
V.fracpie = (n, d) => { const R = 50, cx = 54, cy = 54; let s = `<svg class="vis" viewBox="0 0 108 108" width="108" height="108">`; if (d <= 1) return s + `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${n >= 1 ? '#f59e0b' : '#fff'}" stroke="#7c3aed" stroke-width="2"/></svg>`; for (let i = 0; i < d; i++) { const a0 = -Math.PI / 2 + 2 * Math.PI * i / d, a1 = -Math.PI / 2 + 2 * Math.PI * (i + 1) / d; const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1); const large = (a1 - a0) > Math.PI ? 1 : 0; s += `<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${i < n ? '#f59e0b' : '#fff'}" stroke="#7c3aed" stroke-width="2"/>`; } return s + '</svg>'; };
V.numline = (min, max, marks) => { marks = marks || []; const n = Math.max(1, max - min); const step = n <= 12 ? 1 : n <= 24 ? 2 : n <= 60 ? 5 : 10; const W = 320, pad = 18, sx = (W - 2 * pad) / n; let s = `<svg class="vis" viewBox="0 0 ${W} 56" width="${W}" height="56"><line x1="${pad - 10}" y1="24" x2="${W - pad + 10}" y2="24" stroke="#3b2b57" stroke-width="2"/>`; for (let v = min; v <= max; v++) { const x = pad + (v - min) * sx; const big = (v - min) % step === 0; s += `<line x1="${x}" y1="${big ? 16 : 20}" x2="${x}" y2="${big ? 32 : 28}" stroke="#3b2b57" stroke-width="${big ? 2 : 1}"/>`; if (big) s += `<text x="${x}" y="48" font-size="11" text-anchor="middle" fill="#3b2b57">${dg(sgn(v))}</text>`; } marks.forEach((v) => { const x = pad + (v - min) * sx; s += `<circle cx="${x}" cy="24" r="6" fill="#db2777"/>`; }); return s + '</svg>'; };
V.array = (r, c) => { let s = `<div class="arr" dir="ltr" style="grid-template-columns:repeat(${c},18px)">`; for (let i = 0; i < r * c; i++) s += '<span></span>'; return s + '</div>'; };
V.place = (num) => { const s = String(Math.abs(num)); const names = ['آحاد', 'عشرات', 'مئات', 'آلاف', 'عشرات الآلاف', 'مئات الآلاف', 'ملايين']; const digs = s.split('').reverse(); let h = '<table class="pv"><tr>' + digs.map((_, i) => `<th>${names[i] || ''}</th>`).join('') + '</tr><tr>' + digs.map((d) => `<td>${dg(d)}</td>`).join('') + '</tr></table>'; return h; };
V.column = (op, a, b, showResult) => { const sym = op === '×' || op === '*' ? '×' : op === '-' ? '−' : '+'; const res = op === '+' ? a + b : op === '-' ? a - b : a * b; const w = Math.max(String(a).length, String(b).length + 2, String(res).length); const padL = (x) => String(x).padStart(w, ' '); return `<pre class="col" dir="ltr">${dg(padL(a))}\n${sym}${dg(padL(b).slice(1))}\n${'—'.repeat(w)}\n${showResult === false ? padL('?') : dg(padL(res))}</pre>`; };
V.angle = (deg) => { const cx = 80, cy = 96, L = 70; const rad = deg * Math.PI / 180; const x2 = cx + L * Math.cos(rad), y2 = cy - L * Math.sin(rad); const ar = 26; const ax = cx + ar * Math.cos(rad), ay = cy - ar * Math.sin(rad); const large = deg > 180 ? 1 : 0; const arc = deg >= 180 ? `<path d="M${cx + ar},${cy} A${ar},${ar} 0 0 0 ${cx - ar},${cy}" fill="none" stroke="#db2777" stroke-width="2"/>` : `<path d="M${cx + ar},${cy} A${ar},${ar} 0 ${large} 0 ${ax.toFixed(1)},${ay.toFixed(1)}" fill="none" stroke="#db2777" stroke-width="2"/>`; const sq = deg === 90 ? `<path d="M${cx + 14},${cy} L${cx + 14},${cy - 14} L${cx},${cy - 14}" fill="none" stroke="#db2777" stroke-width="2"/>` : ''; return `<svg class="vis" viewBox="0 0 160 110" width="160" height="110"><line x1="${cx}" y1="${cy}" x2="${cx + L}" y2="${cy}" stroke="#3b2b57" stroke-width="3"/><line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#3b2b57" stroke-width="3"/>${deg === 90 ? sq : arc}<circle cx="${cx}" cy="${cy}" r="3" fill="#3b2b57"/><text x="${cx + 36}" y="${cy - 30}" font-size="13" fill="#db2777" text-anchor="middle">${dg(deg)}°</text></svg>`; };
V.rect = (w, ht, opts) => { opts = opts || {}; w = Math.min(w, 14); ht = Math.min(ht, 10); const c = 22, W = w * c, H = ht * c; let s = `<svg class="vis" viewBox="0 0 ${W + 40} ${H + 30}" width="${W + 40}" height="${H + 30}"><g transform="translate(6,6)">`; if (opts.grid !== false) for (let i = 0; i < w; i++) for (let j = 0; j < ht; j++) s += `<rect x="${i * c}" y="${j * c}" width="${c}" height="${c}" fill="#fef3c7" stroke="#f59e0b" stroke-width="1"/>`; s += `<rect x="0" y="0" width="${W}" height="${H}" fill="${opts.grid === false ? '#fef3c7' : 'none'}" stroke="#7c3aed" stroke-width="3"/>`; s += `<text x="${W / 2}" y="${H + 18}" font-size="13" text-anchor="middle" fill="#3b2b57">${dg(w)}</text><text x="${W + 16}" y="${H / 2 + 5}" font-size="13" text-anchor="middle" fill="#3b2b57">${dg(ht)}</text>`; return s + '</g></svg>'; };
V.tri = (a, b, c, hide) => { const k = 110 / Math.max(a, b); const A = a * k, B = b * k; const lb = (v, key) => hide === key ? '؟' : dg(v); return `<svg class="vis" viewBox="0 0 170 150" width="170" height="150"><g transform="translate(30,15)"><polygon points="0,${B} ${A},${B} 0,0" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"/><path d="M0,${B - 12} L12,${B - 12} L12,${B}" fill="none" stroke="#db2777" stroke-width="2"/><text x="${A / 2}" y="${B + 16}" font-size="13" text-anchor="middle" fill="#3b2b57">${lb(a, 'a')}</text><text x="-12" y="${B / 2 + 5}" font-size="13" text-anchor="middle" fill="#3b2b57">${lb(b, 'b')}</text><text x="${A / 2 + 14}" y="${B / 2 - 6}" font-size="13" text-anchor="middle" fill="#db2777">${lb(c, 'c')}</text></g></svg>`; };
V.bars = (labels, values) => { const n = labels.length, mx = Math.max.apply(null, values.concat([1])); const bw = 40, gap = 22, W = n * (bw + gap) + gap, H = 150; let s = `<svg class="vis" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><line x1="${gap - 8}" y1="${H - 26}" x2="${W - 6}" y2="${H - 26}" stroke="#3b2b57" stroke-width="2"/>`; labels.forEach((lb, i) => { const h = Math.round((H - 50) * values[i] / mx); const x = gap + i * (bw + gap); s += `<rect x="${x}" y="${H - 26 - h}" width="${bw}" height="${h}" rx="4" fill="${['#7c3aed', '#db2777', '#f59e0b', '#0d9488', '#0ea5e9'][i % 5]}"/><text x="${x + bw / 2}" y="${H - 30 - h}" font-size="12" text-anchor="middle" fill="#3b2b57">${dg(values[i])}</text><text x="${x + bw / 2}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#3b2b57">${lb}</text>`; }); return s + '</svg>'; };
V.grid = (points, opts) => { opts = opts || {}; let R = 5; (points || []).forEach((p) => { R = Math.max(R, Math.abs(p[0]), Math.abs(p[1])); }); R = Math.min(R, 10); const c = R <= 6 ? 20 : 14, W = (2 * R + 2) * c; const X = (x) => (x + R + 1) * c, Y = (y) => (R + 1 - y) * c; let s = `<svg class="vis" viewBox="0 0 ${W} ${W}" width="${Math.min(W, 300)}" height="${Math.min(W, 300)}">`; for (let i = -R; i <= R; i++) { s += `<line x1="${X(i)}" y1="${Y(-R)}" x2="${X(i)}" y2="${Y(R)}" stroke="#e9ddfb" stroke-width="1"/><line x1="${X(-R)}" y1="${Y(i)}" x2="${X(R)}" y2="${Y(i)}" stroke="#e9ddfb" stroke-width="1"/>`; } s += `<line x1="${X(-R) - 6}" y1="${Y(0)}" x2="${X(R) + 6}" y2="${Y(0)}" stroke="#3b2b57" stroke-width="2"/><line x1="${X(0)}" y1="${Y(R) - 6}" x2="${X(0)}" y2="${Y(-R) + 6}" stroke="#3b2b57" stroke-width="2"/>`; for (let i = -R; i <= R; i++) if (i && (R <= 6 || i % 2 === 0)) s += `<text x="${X(i)}" y="${Y(0) + 12}" font-size="9" text-anchor="middle" fill="#8b7aa8">${dg(sgn(i))}</text><text x="${X(0) - 8}" y="${Y(i) + 3}" font-size="9" text-anchor="middle" fill="#8b7aa8">${dg(sgn(i))}</text>`; s += `<text x="${X(R) + 2}" y="${Y(0) - 6}" font-size="11" fill="#3b2b57">س</text><text x="${X(0) + 6}" y="${Y(R) - 2}" font-size="11" fill="#3b2b57">ص</text>`; (points || []).forEach((p, i) => { s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" fill="#db2777"/>`; if (opts.labels !== false) s += `<text x="${X(p[0]) + 8}" y="${Y(p[1]) - 6}" font-size="11" fill="#db2777">${opts.names ? opts.names[i] : (p[2] || '')}</text>`; }); return s + '</svg>'; };
V.clock = (hh, mm) => { const cx = 60, cy = 60; let s = `<svg class="vis" viewBox="0 0 120 120" width="120" height="120"><circle cx="${cx}" cy="${cy}" r="54" fill="#fff" stroke="#7c3aed" stroke-width="3"/>`; for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += `<text x="${(cx + 44 * Math.sin(a)).toFixed(1)}" y="${(cy - 44 * Math.cos(a) + 4).toFixed(1)}" font-size="11" text-anchor="middle" fill="#3b2b57">${dg(i)}</text>`; } const ma = mm * Math.PI / 30, ha = ((hh % 12) + mm / 60) * Math.PI / 6; s += `<line x1="${cx}" y1="${cy}" x2="${(cx + 26 * Math.sin(ha)).toFixed(1)}" y2="${(cy - 26 * Math.cos(ha)).toFixed(1)}" stroke="#3b2b57" stroke-width="4" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${(cx + 38 * Math.sin(ma)).toFixed(1)}" y2="${(cy - 38 * Math.cos(ma)).toFixed(1)}" stroke="#db2777" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="3" fill="#3b2b57"/>`; return s + '</svg>'; };
V.table = (rows) => '<table class="tb">' + rows.map((r, i) => '<tr>' + r.map((c) => i === 0 ? `<th>${dg(c)}</th>` : `<td>${dg(c)}</td>`).join('') + '</tr>').join('') + '</table>';
V.steps = (items) => '<ol class="stp">' + items.map((x) => `<li>${x}</li>`).join('') + '</ol>';

/* ---------- خطوات الجمع والطرح العمودي ---------- */
const PLACE = ['الآحاد', 'العشرات', 'المئات', 'الآلاف', 'عشرات الآلاف'];
function colSteps(op, a, b) {
  const A = String(a).split('').reverse().map(Number), B = String(b).split('').reverse().map(Number); const n = Math.max(A.length, B.length); const st = []; let carry = 0;
  if (op === '+') { for (let i = 0; i < n; i++) { const s = (A[i] || 0) + (B[i] || 0) + carry; const c = carry; carry = s >= 10 ? 1 : 0; st.push(`${PLACE[i]}: ${dg((A[i] || 0))} + ${dg((B[i] || 0))}${c ? ' + ' + dg(c) + ' (المحمول)' : ''} = ${dg(s)}${carry ? ` ← نكتب ${dg(s % 10)} ونحمل 1` : ''}`); } if (carry) st.push(`آخر محمول نكتبه في الخانة التالية: 1`); st.push(`الناتج: ${dg(a + b)}`); }
  else { let borrow = 0; for (let i = 0; i < n; i++) { let top = (A[i] || 0) - borrow; const bot = B[i] || 0; if (top < bot) { st.push(`${PLACE[i]}: ${dg(top)} أصغر من ${dg(bot)} ← نستلف 10 من ${PLACE[i + 1]}: ${dg(top + 10)} − ${dg(bot)} = ${dg(top + 10 - bot)}`); borrow = 1; } else { st.push(`${PLACE[i]}: ${dg(top)} − ${dg(bot)} = ${dg(top - bot)}`); borrow = 0; } } st.push(`الناتج: ${dg(a - b)}`); }
  return st;
}

/* ============================================================
   المولّدات — واحد لكل نوع gen.type
   ============================================================ */
const G = {};

G.place = ({ max = 9999 }) => {
  const v = ri(0, 3); const N = String(max).length;
  if (v === 0) { let n, s; do { n = ri(Math.pow(10, N - 1), max); s = String(n); } while (new Set(s).size !== s.length || s.includes('0')); const p = ri(0, N - 1); const d = +s[N - 1 - p]; const val = d * Math.pow(10, p);
    return Q({ q: `ما قيمة الرقم ${M(d)} في العدد ${M(n)}؟`, vis: V.place(n), answer: String(val), hint: `الرقم ${dg(d)} في خانة ${PLACE[p]}. قيمته = الرقم × ${dg(Math.pow(10, p))}.`, steps: [`الرقم ${dg(d)} موجود في خانة ${PLACE[p]}.`, `قيمته = ${dg(d)} × ${dg(Math.pow(10, p))} = ${dg(val)}.`] }); }
  if (v === 1) { const parts = [ri(1, 9), ri(0, 9), ri(0, 9), ri(1, 9)]; const val = parts[0] * 1000 + parts[1] * 100 + parts[2] * 10 + parts[3]; const nm = ['آلاف', 'مئات', 'عشرات', 'آحاد']; const txt = parts.map((p, i) => p ? `${dg(p)} ${nm[i]}` : '').filter(Boolean).join(' و');
    return Q({ q: `اكتبي العدد: ${txt}`, answer: String(val), hint: 'ابدئي من الآلاف ثم المئات ثم العشرات ثم الآحاد، والخانة الفاضية نكتب فيها 0.', steps: [`الآلاف ${dg(parts[0])}، المئات ${dg(parts[1])}، العشرات ${dg(parts[2])}، الآحاد ${dg(parts[3])}.`, `العدد هو ${dg(val)}.`] }); }
  if (v === 2) { let a = ri(1000, max), b = ri(1000, max); if (a === b) b = a + 1; return mcFrom('أي العددين أكبر؟', M(Math.max(a, b)), [M(Math.min(a, b))], { hint: 'قارني الآلاف أولًا، إذا تساوت قارني المئات، وهكذا.', steps: [`نقارن من اليسار خانة خانة.`, `${dg(Math.max(a, b))} أكبر من ${dg(Math.min(a, b))}.`] }); }
  const parts = [ri(1, 9) * 1000, ri(1, 9) * 100, ri(1, 9) * 10, ri(1, 9)]; const val = parts.reduce((s, x) => s + x, 0);
  return Q({ q: `اكتبي العدد الذي صيغته الممتدة: ${M(parts.join(' + '))}`, answer: String(val), hint: 'اجمعي الأجزاء: كل جزء يملأ خانة.', steps: [`${dg(parts.join(' + '))} = ${dg(val)}`] });
};

G.arith = ({ op, min = 10, max = 999 }) => {
  let a = ri(min, max), b = ri(min, max); if (op === '-' && b > a) [a, b] = [b, a];
  const ans = op === '+' ? a + b : a - b;
  return Q({ q: op === '+' ? `اجمعي: ${M(`${a} + ${b}`)}` : `اطرحي: ${M(`${a} − ${b}`)}`, vis: V.column(op, a, b, false), answer: String(ans), hint: op === '+' ? 'ابدئي من الآحاد (يمين). إذا الناتج 10 أو أكثر اكتبي الآحاد واحملي 1 للخانة التالية.' : 'ابدئي من الآحاد. إذا الرقم فوق أصغر من اللي تحت استلفي 10 من الخانة التالية.', steps: colSteps(op, a, b) });
};

G.table = ({ max = 10 }) => {
  const a = ri(2, max), b = ri(2, max); const vis = (a <= 6 && b <= 6 && ri(0, 1)) ? V.array(a, b) : '';
  const skip = []; for (let i = 1; i <= a; i++) skip.push(b * i);
  return Q({ q: `${M(`${a} × ${b}`)} = ؟`, vis, answer: String(a * b), hint: `${dg(a)} × ${dg(b)} يعني ${dg(b)} مكررة ${dg(a)} مرات. عدّي بالقفز: ${dg(skip.slice(0, 3).join('، '))}…`, steps: [`نعد بالقفز ${dg(b)}: ${dg(skip.join('، '))}`, `${dg(a)} × ${dg(b)} = ${dg(a * b)}`] });
};

G.divfact = ({ max = 10 }) => {
  const b = ri(2, max), q = ri(2, max), a = b * q;
  return Q({ q: `${M(`${a} ÷ ${b}`)} = ؟`, answer: String(q), hint: `فكري: أي عدد × ${dg(b)} يعطي ${dg(a)}؟`, steps: [`القسمة عكس الضرب: ${dg(q)} × ${dg(b)} = ${dg(a)}.`, `إذن ${dg(a)} ÷ ${dg(b)} = ${dg(q)}.`] });
};

G.fracid = () => {
  const d = pick([2, 3, 4, 5, 6, 8]); const n = ri(1, d - 1); const vis = ri(0, 1) ? V.fracbar(n, d) : V.fracpie(n, d);
  if (ri(0, 2)) { const wrongs = [fh(d, n), fh(d - n, d), fh(n, d + 1), fh(n, d - 1)].filter((x) => x !== fh(n, d)); return mcFrom('أي كسر يمثل الجزء المظلل؟', fh(n, d), wrongs, { vis, hint: 'المقام (تحت) = كل الأجزاء، والبسط (فوق) = الأجزاء المظللة.', steps: [`عدد الأجزاء كلها = ${dg(d)} ← المقام.`, `الأجزاء المظللة = ${dg(n)} ← البسط.`, `الكسر ${dg(n)}/${dg(d)}.`] }); }
  return Q({ q: `الشكل مقسم إلى ${M(d)} أجزاء متساوية. كم جزءًا مظللًا؟`, vis, answer: String(n), hint: 'عدّي الأجزاء الملونة فقط.', steps: [`الأجزاء المظللة = ${dg(n)}، والكسر ${dg(n)}/${dg(d)}.`] });
};

G.measure = () => {
  const v = ri(0, 5);
  if (v === 0) { const m = ri(2, 9); return Q({ q: `${M(m)} متر = كم سنتيمترًا؟`, answer: String(m * 100), hint: 'المتر الواحد = 100 سم.', steps: [`${dg(m)} × 100 = ${dg(m * 100)} سم`] }); }
  if (v === 1) { const m = ri(2, 9); return Q({ q: `${M(m * 100)} سم = كم مترًا؟`, answer: String(m), hint: 'كل 100 سم = متر واحد.', steps: [`${dg(m * 100)} ÷ 100 = ${dg(m)} م`] }); }
  if (v === 2) { const h = ri(2, 5); return Q({ q: `${M(h)} ساعات = كم دقيقة؟`, answer: String(h * 60), hint: 'الساعة الواحدة = 60 دقيقة.', steps: [`${dg(h)} × 60 = ${dg(h * 60)} دقيقة`] }); }
  if (v === 3) { const r = ri(2, 9); return Q({ q: `${M(r)} ريالات = كم هللة؟`, answer: String(r * 100), hint: 'الريال الواحد = 100 هللة.', steps: [`${dg(r)} × 100 = ${dg(r * 100)} هللة`] }); }
  if (v === 4) { const a = ri(5, 60), b = ri(5, 60); return Q({ q: `معك ${M(a)} ريالًا وأعطاك أبوك ${M(b)} ريالًا. كم ريالًا معك الآن؟`, answer: String(a + b), hint: 'أعطاك يعني زادت النقود ← جمع.', steps: [`${dg(a)} + ${dg(b)} = ${dg(a + b)} ريالًا`] }); }
  const h = ri(7, 10), m1 = pick([0, 15, 30]), dur = pick([15, 30, 45, 60]); const t2 = h * 60 + m1 + dur; const hh = Math.floor(t2 / 60), mm = t2 % 60; const f = (H, Mn) => `${H}:${String(Mn).padStart(2, '0')}`;
  return Q({ q: `بدأ الدرس الساعة ${M(f(h, m1))} وانتهى الساعة ${M(f(hh, mm))}. كم دقيقة استمر الدرس؟`, vis: V.clock(h, m1), answer: String(dur), hint: 'عدّي الدقائق من وقت البداية إلى وقت النهاية (كل ساعة 60 دقيقة).', steps: [`من ${dg(f(h, m1))} إلى ${dg(f(hh, mm))}: ${dg(dur)} دقيقة`] });
};

G.perim = () => {
  const v = ri(0, 2);
  if (v === 0) { const w = ri(2, 12), h = ri(2, 9); return Q({ q: `مستطيل طوله ${M(w)} سم وعرضه ${M(h)} سم. ما محيطه؟`, vis: V.rect(w, h, { grid: false }), answer: String(2 * (w + h)), hint: 'المحيط = مجموع أطوال الأضلاع الأربعة (الطول مرتين والعرض مرتين).', steps: [`${dg(w)} + ${dg(h)} + ${dg(w)} + ${dg(h)} = ${dg(2 * (w + h))} سم`, `أو 2 × (${dg(w)} + ${dg(h)}) = ${dg(2 * (w + h))}`] }); }
  if (v === 1) { const s = ri(2, 12); return Q({ q: `مربع طول ضلعه ${M(s)} سم. ما محيطه؟`, vis: V.rect(s, s, { grid: false }), answer: String(4 * s), hint: 'المربع له 4 أضلاع متساوية.', steps: [`4 × ${dg(s)} = ${dg(4 * s)} سم`] }); }
  const a = ri(3, 9), b = ri(3, 9), c = ri(3, 9); return Q({ q: `مثلث أطوال أضلاعه ${M(a)} و${M(b)} و${M(c)} سم. ما محيطه؟`, answer: String(a + b + c), hint: 'اجمعي الأضلاع الثلاثة.', steps: [`${dg(a)} + ${dg(b)} + ${dg(c)} = ${dg(a + b + c)} سم`] });
};

G.word1 = () => {
  const names = ['نورة', 'سارة', 'ريم', 'لمى', 'جود']; const nm = pick(names); const v = ri(0, 5);
  const T = [
    () => { const a = ri(4, 30), b = ri(3, 20); return [`عند ${nm} ${M(a)} تفاحة، وأعطتها أمها ${M(b)} تفاحة أخرى. كم تفاحة صار عندها؟`, a + b, 'أعطتها = زادت ← جمع', `${a} + ${b} = ${a + b}`]; },
    () => { const a = ri(15, 35), b = ri(2, 10); return [`في الصف ${M(a)} طالبة، غابت اليوم ${M(b)} طالبات. كم طالبة حضرت؟`, a - b, 'غابت = نقصت ← طرح', `${a} − ${b} = ${a - b}`]; },
    () => { const a = ri(2, 9), b = ri(2, 9); return [`في كل علبة ${M(a)} أقلام. اشترت ${nm} ${M(b)} علب. كم قلمًا عندها؟`, a * b, 'كل علبة فيها نفس العدد ← ضرب', `${a} × ${b} = ${a * b}`]; },
    () => { const a = ri(2, 9), b = ri(2, 9); return [`سعر القلم ${M(a)} ريالات. اشترت ${nm} ${M(b)} أقلام. كم ريالًا دفعت؟`, a * b, 'سعر الواحد × العدد ← ضرب', `${a} × ${b} = ${a * b}`]; },
    () => { const a = ri(20, 90), b = ri(5, 19); return [`معك ${M(a)} ريالًا، اشتريت لعبة بـ ${M(b)} ريالًا. كم ريالًا بقي معك؟`, a - b, 'بقي = نقص ← طرح', `${a} − ${b} = ${a - b}`]; },
    () => { const a = ri(12, 60), b = ri(12, 60); return [`قرأت ${nm} ${M(a)} صفحة يوم السبت و${M(b)} صفحة يوم الأحد. كم صفحة قرأت في اليومين؟`, a + b, 'في اليومين = المجموع ← جمع', `${a} + ${b} = ${a + b}`]; },
  ];
  const [q, ans, key, calc] = T[v]();
  return Q({ q, answer: String(ans), hint: `الكلمة المفتاحية: ${key}.`, steps: [`نفهم المسألة: ${key}.`, `نحسب: ${dg(calc)}`] });
};

G.round = ({ max = 999999 }) => {
  const v = ri(0, 2);
  if (v === 0) { const n = ri(1000, max); const to = pick([10, 100, 1000]); const ans = Math.round(n / to) * to; const dgt = Math.floor(n / (to / 10)) % 10;
    return Q({ q: `قرّبي العدد ${M(n)} لأقرب ${M(to)}.`, answer: String(ans), hint: `انظري للرقم الذي بعد خانة ${to === 10 ? 'العشرات' : to === 100 ? 'المئات' : 'الآلاف'}: إذا كان 5 أو أكثر نزيد، وإلا نبقي.`, steps: [`الرقم الذي بعد الخانة هو ${dg(dgt)} ← ${dgt >= 5 ? 'نزيد 1 على الخانة' : 'تبقى الخانة كما هي'}.`, `الأصفار تملأ ما بعدها: ${dg(ans)}.`] }); }
  if (v === 1) { let a = ri(10000, max), b = ri(10000, max); if (a === b) b++; return mcFrom('أي العددين أكبر؟', M(Math.max(a, b)), [M(Math.min(a, b))], { hint: 'العدد الذي فيه أرقام أكثر أكبر. إذا تساوت الأرقام قارني من اليسار.', steps: [`${dg(Math.max(a, b))} أكبر من ${dg(Math.min(a, b))}.`] }); }
  const parts = []; let val = 0; for (let p = ri(4, 5); p >= 0; p--) { const d = ri(p === 0 ? 1 : 0, 9); if (d) { parts.push(d * Math.pow(10, p)); val += d * Math.pow(10, p); } }
  return Q({ q: `اكتبي العدد الذي صيغته الممتدة: ${M(parts.join(' + '))}`, answer: String(val), hint: 'اجمعي الأجزاء وانتبهي للخانات الفاضية (نكتب فيها 0).', steps: [`${dg(parts.join(' + '))} = ${dg(val)}`] });
};

G.mul2 = () => {
  if (ri(0, 1)) { const a = ri(12, 99), b = ri(12, 99); const t = b % 10, u = Math.floor(b / 10) * 10;
    return Q({ q: `اضربي: ${M(`${a} × ${b}`)}`, vis: V.column('×', a, b, false), answer: String(a * b), hint: `اضربي ${dg(a)} في الآحاد (${dg(t)}) ثم في العشرات (${dg(u)}) واجمعي الناتجين.`, steps: [`${dg(a)} × ${dg(t)} = ${dg(a * t)}`, `${dg(a)} × ${dg(u)} = ${dg(a * u)}`, `${dg(a * t)} + ${dg(a * u)} = ${dg(a * b)}`] }); }
  const a = ri(112, 999), b = ri(3, 9); const A = String(a); const h = +A[0] * 100, t = +A[1] * 10, o = +A[2];
  return Q({ q: `اضربي: ${M(`${a} × ${b}`)}`, vis: V.column('×', a, b, false), answer: String(a * b), hint: `فككي ${dg(a)} = ${dg(h)} + ${dg(t)} + ${dg(o)} واضربي كل جزء في ${dg(b)}.`, steps: [`${dg(h)} × ${dg(b)} = ${dg(h * b)}`, `${dg(t)} × ${dg(b)} = ${dg(t * b)}`, `${dg(o)} × ${dg(b)} = ${dg(o * b)}`, `المجموع = ${dg(a * b)}`] });
};

G.divrem = () => {
  const b = ri(2, 9), q = ri(4, 120), r = ri(0, b - 1), a = b * q + r; const askQ = ri(0, 1) === 0 || r === 0;
  return Q({ q: askQ ? `${M(`${a} ÷ ${b}`)} — ما ناتج القسمة (بدون الباقي)؟` : `${M(`${a} ÷ ${b}`)} — ما الباقي؟`, answer: String(askQ ? q : r), hint: `كم مرة ${dg(b)} تدخل في ${dg(a)}؟ ${dg(b)} × ${dg(q)} = ${dg(b * q)}، وما زاد هو الباقي.`, steps: [`${dg(b)} × ${dg(q)} = ${dg(b * q)}`, `${dg(a)} − ${dg(b * q)} = ${dg(r)} (الباقي)`, `الناتج ${dg(q)} والباقي ${dg(r)}`] });
};

G.fraceq = () => {
  const v = ri(0, 2);
  if (v === 0) { const d = ri(2, 6), n = ri(1, d - 1), k = ri(2, 5); return Q({ q: `أكملي الكسر المكافئ: ${fh(n, d)} = ؟ / ${M(d * k)}`, answer: String(n * k), hint: `المقام ${dg(d)} صار ${dg(d * k)} يعني ضربنا في ${dg(k)}، فنضرب البسط أيضًا في ${dg(k)}.`, steps: [`${dg(d)} × ${dg(k)} = ${dg(d * k)} ← ضربنا المقام في ${dg(k)}.`, `نضرب البسط في نفس العدد: ${dg(n)} × ${dg(k)} = ${dg(n * k)}.`] }); }
  if (v === 1) { const d = ri(2, 6), n = ri(1, d - 1), k = ri(2, 5); return Q({ q: `أكملي الكسر المكافئ: ${fh(n, d)} = ${M(n * k)} / ؟`, answer: String(d * k), hint: `البسط ${dg(n)} صار ${dg(n * k)} يعني ضربنا في ${dg(k)}، فنضرب المقام في ${dg(k)}.`, steps: [`${dg(n)} × ${dg(k)} = ${dg(n * k)} ← ضربنا البسط في ${dg(k)}.`, `المقام: ${dg(d)} × ${dg(k)} = ${dg(d * k)}.`] }); }
  if (ri(0, 1)) { const d = ri(3, 9); let n1 = ri(1, d - 1), n2 = ri(1, d - 1); if (n1 === n2) n2 = n1 === d - 1 ? n1 - 1 : n1 + 1; const big = Math.max(n1, n2); return mcFrom('أي الكسرين أكبر؟', fh(big, d), [fh(Math.min(n1, n2), d)], { hint: 'المقام واحد ← الكسر الذي بسطه أكبر هو الأكبر.', steps: [`المقامان متساويان (${dg(d)}).`, `${dg(big)} أكبر من ${dg(Math.min(n1, n2))} ← ${dg(big)}/${dg(d)} أكبر.`] }); }
  const n = ri(1, 4); let d1 = ri(n + 1, 9), d2 = ri(n + 1, 9); if (d1 === d2) d2 = d1 === 9 ? d1 - 1 : d1 + 1; const small = Math.min(d1, d2);
  return mcFrom('أي الكسرين أكبر؟', fh(n, small), [fh(n, Math.max(d1, d2))], { hint: 'البسط واحد ← الكسر الذي مقامه أصغر هو الأكبر (أجزاء أكبر).', steps: [`البسطان متساويان (${dg(n)}).`, `المقام الأصغر يعني القطعة أكبر ← ${dg(n)}/${dg(small)} أكبر.`] });
};

G.fracadd = ({ same }) => {
  if (same) { const d = ri(3, 12); let n1 = ri(1, d - 1), n2 = ri(1, d - 1); const add = ri(0, 1) === 0; if (add && n1 + n2 > d) { n2 = d - n1; } if (!add && n2 > n1) [n1, n2] = [n2, n1]; if (!add && n1 === n2) n1 = Math.min(d - 1, n1 + 1); const r = add ? n1 + n2 : n1 - n2;
    return Q({ q: `${add ? 'اجمعي' : 'اطرحي'}: ${fh(n1, d)} ${add ? '+' : '−'} ${fh(n2, d)}`, answer: fs(r, d), hint: 'المقام واحد ← نجمع/نطرح البسط فقط والمقام يبقى.', steps: [`${dg(n1)} ${add ? '+' : '−'} ${dg(n2)} = ${dg(r)} ← البسط`, `الناتج ${dg(r)}/${dg(d)}${simp(r, d)[1] !== d ? ` = ${dg(fs(r, d))} بعد التبسيط` : ''}`] }); }
  let d1, d2; do { d1 = ri(2, 9); d2 = ri(2, 9); } while (d1 === d2 || lcm(d1, d2) > 36); const L = lcm(d1, d2); let n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1); const add = ri(0, 1) === 0; let a = n1 * (L / d1), b = n2 * (L / d2); if (!add && b > a) { [n1, n2] = [n2, n1]; [d1, d2] = [d2, d1]; [a, b] = [b, a]; } if (!add && a === b) return G.fracadd({ same: false }); const r = add ? a + b : a - b;
  return Q({ q: `${add ? 'اجمعي' : 'اطرحي'}: ${fh(n1, d1)} ${add ? '+' : '−'} ${fh(n2, d2)}`, answer: fs(r, L), hint: `وحّدي المقامين: المضاعف المشترك الأصغر لـ ${dg(d1)} و${dg(d2)} هو ${dg(L)}.`, steps: [`المقام المشترك = ${dg(L)}.`, `${dg(n1)}/${dg(d1)} = ${dg(a)}/${dg(L)} و ${dg(n2)}/${dg(d2)} = ${dg(b)}/${dg(L)}.`, `${dg(a)} ${add ? '+' : '−'} ${dg(b)} = ${dg(r)} ← ${dg(r)}/${dg(L)}${simp(r, L)[1] !== L ? ` = ${dg(fs(r, L))}` : ''}`] });
};

G.dec1 = () => {
  const v = ri(0, 3);
  if (v === 0) { const t = ri(1, 9); const hund = ri(0, 1); const n = hund ? ri(1, 99) : t; const d = hund ? 100 : 10; const dec = n / d; return Q({ q: `اكتبي الكسر ${fh(n, d)} عددًا عشريًا.`, answer: String(dec), hint: d === 10 ? 'العُشر = خانة واحدة بعد الفاصلة: 3/10 = 0.3' : 'جزء من مئة = خانتان بعد الفاصلة: 25/100 = 0.25', steps: [`${dg(n)} ÷ ${dg(d)} = ${dg(dec)}`] }); }
  if (v === 1) { const n = ri(1, 9); return Q({ q: `اكتبي ${M(n / 10)} كسرًا اعتياديًا.`, answer: fs(n, 10), accept: [`${n}/10`], hint: 'خانة واحدة بعد الفاصلة = أعشار (المقام 10).', steps: [`${dg(n / 10)} = ${dg(n)}/10${simp(n, 10)[1] !== 10 ? ` = ${dg(fs(n, 10))}` : ''}`] }); }
  if (v === 2) { let a = ri(1, 9) / 10, b = ri(10, 99) / 100; if (a === b) b += 0.01; return mcFrom('أي العددين أكبر؟', M(Math.max(a, b)), [M(Math.min(a, b))], { hint: 'قارني خانة الأعشار أولًا (أول رقم بعد الفاصلة). أضيفي 0 لتساوي الخانات: 0.4 = 0.40', steps: [`${dg(a)} = ${dg(a.toFixed(2))} و ${dg(b)} = ${dg(b.toFixed(2))}`, `${dg(Math.max(a, b))} أكبر.`] }); }
  const n = ri(2, 9); return Q({ q: `كم عُشرًا في ${M(n / 10)}؟`, answer: String(n), hint: 'الرقم بعد الفاصلة مباشرة هو الأعشار.', steps: [`${dg(n / 10)} = ${dg(n)} أعشار`] });
};

G.angletype = () => {
  const deg = pick([30, 45, 60, 75, 90, 100, 120, 135, 150, 180]); const t = deg < 90 ? 'حادة' : deg === 90 ? 'قائمة' : deg < 180 ? 'منفرجة' : 'مستقيمة';
  const showDeg = ri(0, 1); return mcFrom(showDeg ? `زاوية قياسها ${M(deg)}°. ما نوعها؟` : 'ما نوع هذه الزاوية؟', t, ['حادة', 'قائمة', 'منفرجة', 'مستقيمة'].filter((x) => x !== t), { vis: V.angle(deg), hint: 'أقل من 90 حادة، 90 قائمة، بين 90 و180 منفرجة، 180 مستقيمة.', steps: [`القياس ${dg(deg)}° ← ${t}.`] });
};

G.area = () => {
  const w = ri(2, 12), h = ri(2, 9); const askArea = ri(0, 1) === 0;
  return Q({ q: `مستطيل طوله ${M(w)} سم وعرضه ${M(h)} سم. ما ${askArea ? 'مساحته' : 'محيطه'}؟`, vis: V.rect(w, h, { grid: askArea }), answer: String(askArea ? w * h : 2 * (w + h)), hint: askArea ? 'المساحة = الطول × العرض (عدد المربعات داخل الشكل).' : 'المحيط = 2 × (الطول + العرض).', steps: askArea ? [`${dg(w)} × ${dg(h)} = ${dg(w * h)} سم²`] : [`2 × (${dg(w)} + ${dg(h)}) = 2 × ${dg(w + h)} = ${dg(2 * (w + h))} سم`] });
};

G.pattern = () => {
  const v = ri(0, 2);
  if (v === 0) { const s = ri(1, 20), st = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]); const seq = [0, 1, 2, 3].map((i) => s + i * st); return Q({ q: `ما العدد التالي في النمط: ${M(seq.join('، ') + '، …')}؟`, answer: String(s + 4 * st), hint: `شوفي الفرق بين كل عددين متتاليين: ${dg(seq[1])} − ${dg(seq[0])} = ${dg(st)}.`, steps: [`القاعدة: نزيد ${dg(st)} كل مرة.`, `${dg(seq[3])} + ${dg(st)} = ${dg(s + 4 * st)}`] }); }
  if (v === 1) { const s = ri(40, 99), st = ri(3, 9); const seq = [0, 1, 2, 3].map((i) => s - i * st); return Q({ q: `ما العدد التالي في النمط: ${M(seq.join('، ') + '، …')}؟`, answer: String(s - 4 * st), hint: 'الأعداد تنقص. كم الفرق بين كل عددين؟', steps: [`القاعدة: ننقص ${dg(st)} كل مرة.`, `${dg(seq[3])} − ${dg(st)} = ${dg(s - 4 * st)}`] }); }
  const s = ri(1, 5), k = pick([2, 3]); const seq = [0, 1, 2, 3].map((i) => s * Math.pow(k, i));
  return mcFrom(`ما قاعدة النمط: ${M(seq.join('، ') + '، …')}؟`, `نضرب في ${dg(k)}`, [`نزيد ${dg(seq[1] - seq[0])}`, `نضرب في ${dg(k + 1)}`, `نزيد ${dg(k)}`], { hint: 'جربي: هل الفرق ثابت (جمع) أم كل عدد ضعف/ثلاثة أضعاف اللي قبله (ضرب)؟', steps: [`${dg(seq[0])} × ${dg(k)} = ${dg(seq[1])}، و ${dg(seq[1])} × ${dg(k)} = ${dg(seq[2])} ← نضرب في ${dg(k)}.`] });
};

G.barchart = () => {
  const names = shuffle(['نورة', 'سارة', 'ريم', 'لمى', 'هند']).slice(0, 4); const vals = names.map(() => ri(1, 9)); const vis = V.bars(names, vals); const v = ri(0, 3);
  const mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
  if (v === 0) { if (vals.filter((x) => x === mx).length > 1) return G.barchart(); return mcFrom('التمثيل يبين عدد الكتب التي قرأتها كل طالبة. من قرأت أكثر عدد؟', names[vals.indexOf(mx)], names.filter((_, i) => vals[i] !== mx), { vis, hint: 'أطول عمود = أكبر عدد.', steps: [`أطول عمود هو ${names[vals.indexOf(mx)]} (${dg(mx)}).`] }); }
  if (v === 1) { if (vals.filter((x) => x === mn).length > 1) return G.barchart(); return mcFrom('من قرأت أقل عدد من الكتب؟', names[vals.indexOf(mn)], names.filter((_, i) => vals[i] !== mn), { vis, hint: 'أقصر عمود = أصغر عدد.', steps: [`أقصر عمود هو ${names[vals.indexOf(mn)]} (${dg(mn)}).`] }); }
  if (v === 2) { const i = 0, j = 1; const d = Math.abs(vals[i] - vals[j]); return Q({ q: `كم الفرق بين عدد كتب ${names[i]} وعدد كتب ${names[j]}؟`, vis, answer: String(d), hint: 'الفرق = الأكبر − الأصغر.', steps: [`${dg(Math.max(vals[i], vals[j]))} − ${dg(Math.min(vals[i], vals[j]))} = ${dg(d)}`] }); }
  return Q({ q: 'كم كتابًا قرأت الطالبات كلهن معًا؟', vis, answer: String(vals.reduce((s, x) => s + x, 0)), hint: 'اجمعي كل الأعمدة.', steps: [`${dg(vals.join(' + '))} = ${dg(vals.reduce((s, x) => s + x, 0))}`] });
};

G.mulbig = () => {
  if (ri(0, 1)) { const a = ri(102, 999), b = ri(11, 49); const t = b % 10, u = b - t; return Q({ q: `اضربي: ${M(`${a} × ${b}`)}`, vis: V.column('×', a, b, false), answer: String(a * b), hint: `اضربي في الآحاد ثم في العشرات واجمعي: ${dg(a)} × ${dg(t)} و ${dg(a)} × ${dg(u)}.`, steps: [`${dg(a)} × ${dg(t)} = ${dg(a * t)}`, `${dg(a)} × ${dg(u)} = ${dg(a * u)}`, `${dg(a * t)} + ${dg(a * u)} = ${dg(a * b)}`] }); }
  const b = ri(11, 30), q = ri(11, 99), a = b * q; return Q({ q: `اقسمي: ${M(`${a} ÷ ${b}`)}`, answer: String(q), hint: `قدّري: ${dg(b)} × 10 = ${dg(b * 10)}، ${dg(b)} × 20 = ${dg(b * 20)}… أين يقع ${dg(a)}؟ ثم تحققي بالضرب.`, steps: [`${dg(b)} × ${dg(q)} = ${dg(a)}`, `إذن ${dg(a)} ÷ ${dg(b)} = ${dg(q)}`] });
};

const factorsOf = (n) => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
const isPrime = (n) => n > 1 && factorsOf(n).length === 2;
G.factors = () => {
  const v = ri(0, 3);
  if (v === 0) { let a, b; do { a = ri(4, 48); b = ri(4, 48); } while (a === b || gcd(a, b) < 2); const g = gcd(a, b); return Q({ q: `ما القاسم المشترك الأكبر (ق.م.أ) للعددين ${M(a)} و${M(b)}؟`, answer: String(g), hint: `اكتبي قواسم كل عدد واختاري أكبر قاسم مشترك. قواسم ${dg(a)}: ${dg(factorsOf(a).join('، '))}`, steps: [`قواسم ${dg(a)}: ${dg(factorsOf(a).join('، '))}`, `قواسم ${dg(b)}: ${dg(factorsOf(b).join('، '))}`, `أكبر قاسم مشترك = ${dg(g)}`] }); }
  if (v === 1) { let a, b; do { a = ri(2, 12); b = ri(2, 12); } while (a === b); const L = lcm(a, b); return Q({ q: `ما المضاعف المشترك الأصغر (م.م.أ) للعددين ${M(a)} و${M(b)}؟`, answer: String(L), hint: `اكتبي مضاعفات ${dg(a)}: ${dg([1, 2, 3, 4].map((i) => a * i).join('، '))}… ومضاعفات ${dg(b)} وابحثي عن أول مشترك.`, steps: [`مضاعفات ${dg(a)}: ${dg([1, 2, 3, 4, 5, 6].map((i) => a * i).join('، '))}…`, `مضاعفات ${dg(b)}: ${dg([1, 2, 3, 4, 5, 6].map((i) => b * i).join('، '))}…`, `أول مضاعف مشترك = ${dg(L)}`] }); }
  if (v === 2) { const n = ri(2, 50); const p = isPrime(n); return mcFrom(`هل العدد ${M(n)} أولي؟`, p ? 'نعم، أولي' : 'لا، ليس أوليًا', [p ? 'لا، ليس أوليًا' : 'نعم، أولي'], { hint: 'العدد الأولي له قاسمان فقط: 1 ونفسه. جربي القسمة على 2، 3، 5، 7.', steps: [`قواسم ${dg(n)}: ${dg(factorsOf(n).join('، '))} ← ${p ? 'قاسمان فقط ← أولي' : 'أكثر من قاسمين ← ليس أوليًا'}.`] }); }
  const n = ri(6, 36); return Q({ q: `كم قاسمًا للعدد ${M(n)}؟`, answer: String(factorsOf(n).length), hint: 'اكتبي كل الأعداد التي تقسمه بدون باقٍ (ابدئي بـ 1 وانتهي بالعدد نفسه).', steps: [`القواسم: ${dg(factorsOf(n).join('، '))}`, `عددها ${dg(factorsOf(n).length)}`] });
};

G.mixed = () => {
  const d = ri(2, 8), w = ri(1, 4), n = ri(1, d - 1); const imp = w * d + n;
  if (ri(0, 1)) return Q({ q: `اكتبي ${fh(imp, d)} عددًا كسريًا.`, answer: `${w} ${n}/${d}`, accept: [`${imp}/${d}`], hint: `اقسمي ${dg(imp)} ÷ ${dg(d)}: الناتج هو العدد الصحيح والباقي هو البسط.`, steps: [`${dg(imp)} ÷ ${dg(d)} = ${dg(w)} والباقي ${dg(n)}`, `العدد الكسري: ${dg(w)} ${dg(n)}/${dg(d)}`] });
  return Q({ q: `اكتبي ${MX(w, n, d)} كسرًا غير فعلي.`, answer: `${imp}/${d}`, accept: [`${w} ${n}/${d}`], hint: `اضربي العدد الصحيح في المقام وأضيفي البسط: ${dg(w)} × ${dg(d)} + ${dg(n)}.`, steps: [`${dg(w)} × ${dg(d)} = ${dg(w * d)}`, `${dg(w * d)} + ${dg(n)} = ${dg(imp)} ← البسط`, `الكسر: ${dg(imp)}/${dg(d)}`] });
};

G.fracmul = () => {
  if (ri(0, 2)) { const d1 = ri(2, 9), d2 = ri(2, 9), n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1); return Q({ q: `اضربي: ${fh(n1, d1)} × ${fh(n2, d2)}`, answer: fs(n1 * n2, d1 * d2), hint: 'بسط × بسط، ومقام × مقام، ثم بسّطي.', steps: [`البسط: ${dg(n1)} × ${dg(n2)} = ${dg(n1 * n2)}`, `المقام: ${dg(d1)} × ${dg(d2)} = ${dg(d1 * d2)}`, `${dg(n1 * n2)}/${dg(d1 * d2)}${simp(n1 * n2, d1 * d2)[1] !== d1 * d2 ? ` = ${dg(fs(n1 * n2, d1 * d2))}` : ''}`] }); }
  const d = ri(2, 9), n = ri(1, d - 1), k = ri(2, 9); return Q({ q: `اضربي: ${fh(n, d)} × ${M(k)}`, answer: fs(n * k, d), hint: `اكتبي ${dg(k)} على شكل ${dg(k)}/1 ثم اضربي البسط في البسط.`, steps: [`${dg(n)}/${dg(d)} × ${dg(k)}/1 = ${dg(n * k)}/${dg(d)}${simp(n * k, d)[1] !== d ? ` = ${dg(fs(n * k, d))}` : ''}`] });
};

G.decops = () => {
  const v = ri(0, 2);
  if (v === 0) { const a = ri(11, 999) / 100, b = ri(11, 999) / 100; const s = r2(a + b); return Q({ q: `اجمعي: ${M(`${a} + ${b}`)}`, answer: String(s), hint: 'رصّي الفاصلة تحت الفاصلة، ثم اجمعي مثل الأعداد العادية.', steps: [`${dg(a)} + ${dg(b)} = ${dg(s)}`] }); }
  if (v === 1) { let a = ri(11, 999) / 100, b = ri(11, 999) / 100; if (b > a) [a, b] = [b, a]; const s = r2(a - b); return Q({ q: `اطرحي: ${M(`${a} − ${b}`)}`, answer: String(s), hint: 'رصّي الفاصلة تحت الفاصلة، وأكملي بالأصفار إذا احتجتِ.', steps: [`${dg(a)} − ${dg(b)} = ${dg(s)}`] }); }
  const a = ri(11, 99) / 10, b = ri(0, 1) ? ri(2, 9) : ri(2, 9) / 10; const p = r2(a * b); const places = (String(a).split('.')[1] || '').length + (String(b).split('.')[1] || '').length;
  return Q({ q: `اضربي: ${M(`${a} × ${b}`)}`, answer: String(p), hint: `اضربي بدون فاصلة ثم عدّي المنازل العشرية في العددين (${dg(places)}) وضعي الفاصلة.`, steps: [`${dg(String(a).replace('.', ''))} × ${dg(String(b).replace('.', ''))} = ${dg(Math.round(a * b * Math.pow(10, places)))}`, `المنازل العشرية: ${dg(places)} ← ${dg(p)}`] });
};

G.decdiv = () => {
  if (ri(0, 1)) { const r = ri(11, 99) / 10, b = ri(2, 9); const a = r2(r * b); return Q({ q: `اقسمي: ${M(`${a} ÷ ${b}`)}`, answer: String(r), hint: 'اقسمي مثل الأعداد العادية، والفاصلة في الناتج فوق الفاصلة في المقسوم.', steps: [`${dg(a)} ÷ ${dg(b)} = ${dg(r)}`, `تحقق: ${dg(r)} × ${dg(b)} = ${dg(a)}`] }); }
  const b = pick([2, 4, 5, 8]); const r = pick([0.5, 1.5, 2.5, 0.25, 0.75, 1.25, 0.2, 0.4, 0.6, 0.8, 1.2, 3.5]); const a = r2(r * b); if (!isInt(a)) return G.decdiv();
  return Q({ q: `اقسمي: ${M(`${a} ÷ ${b}`)}`, answer: String(r), hint: `${dg(b)} لا يدخل في ${dg(a)} بالتساوي ← أضيفي فاصلة وصفرًا وكملي القسمة.`, steps: [`${dg(a)} = ${dg(a)}.0 ← نكمل القسمة بعد الفاصلة.`, `${dg(a)} ÷ ${dg(b)} = ${dg(r)}`, `تحقق: ${dg(r)} × ${dg(b)} = ${dg(a)}`] });
};

G.area2 = () => {
  const v = ri(0, 2);
  if (v === 0) { const b = ri(2, 12) * 2, h = ri(2, 10); return Q({ q: `مثلث قاعدته ${M(b)} سم وارتفاعه ${M(h)} سم. ما مساحته؟`, answer: String(b * h / 2), hint: 'مساحة المثلث = ½ × القاعدة × الارتفاع.', steps: [`${dg(b)} × ${dg(h)} = ${dg(b * h)}`, `½ × ${dg(b * h)} = ${dg(b * h / 2)} سم²`] }); }
  if (v === 1) { const b = ri(3, 12), h = ri(2, 9); return Q({ q: `متوازي أضلاع قاعدته ${M(b)} سم وارتفاعه ${M(h)} سم. ما مساحته؟`, answer: String(b * h), hint: 'مساحة متوازي الأضلاع = القاعدة × الارتفاع.', steps: [`${dg(b)} × ${dg(h)} = ${dg(b * h)} سم²`] }); }
  const l = ri(2, 9), w = ri(2, 9), h = ri(2, 9); return Q({ q: `صندوق طوله ${M(l)} سم وعرضه ${M(w)} سم وارتفاعه ${M(h)} سم. ما حجمه؟`, answer: String(l * w * h), hint: 'الحجم = الطول × العرض × الارتفاع.', steps: [`${dg(l)} × ${dg(w)} = ${dg(l * w)}`, `${dg(l * w)} × ${dg(h)} = ${dg(l * w * h)} سم³`] });
};

const median = (a) => { const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
G.stats = () => {
  const v = ri(0, 3); const n = 5;
  if (v === 0) { let a; do { a = Array.from({ length: n }, () => ri(1, 20)); } while (!isInt(a.reduce((s, x) => s + x, 0) / n)); const sum = a.reduce((s, x) => s + x, 0); return Q({ q: `ما المتوسط الحسابي للأعداد: ${M(a.join('، '))}؟`, answer: String(sum / n), hint: 'المتوسط = مجموع الأعداد ÷ عددها.', steps: [`المجموع: ${dg(a.join(' + '))} = ${dg(sum)}`, `${dg(sum)} ÷ ${dg(n)} = ${dg(sum / n)}`] }); }
  if (v === 1) { const a = Array.from({ length: n }, () => ri(1, 30)); return Q({ q: `ما الوسيط للأعداد: ${M(a.join('، '))}؟`, answer: String(median(a)), hint: 'رتبي الأعداد من الأصغر للأكبر، والوسيط هو العدد الذي في المنتصف.', steps: [`بعد الترتيب: ${dg(a.slice().sort((x, y) => x - y).join('، '))}`, `العدد في المنتصف: ${dg(median(a))}`] }); }
  if (v === 2) { const m = ri(1, 12); let a = shuffle([m, m, m, ri(1, 12), ri(1, 12), ri(1, 12)]); const cnt = {}; a.forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; }); if (Object.values(cnt).filter((c) => c >= 3).length !== 1) return G.stats(); return Q({ q: `ما المنوال للأعداد: ${M(a.join('، '))}؟`, answer: String(m), hint: 'المنوال هو العدد الأكثر تكرارًا.', steps: [`العدد ${dg(m)} تكرر ${dg(cnt[m])} مرات ← المنوال ${dg(m)}`] }); }
  const a = Array.from({ length: n }, () => ri(1, 40)); const mx = Math.max.apply(null, a), mn = Math.min.apply(null, a); return Q({ q: `ما المدى للأعداد: ${M(a.join('، '))}؟`, answer: String(mx - mn), hint: 'المدى = أكبر عدد − أصغر عدد.', steps: [`${dg(mx)} − ${dg(mn)} = ${dg(mx - mn)}`] });
};

G.order = () => {
  const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9); const v = ri(0, 5);
  const T = [
    [`${a} + ${b} × ${c}`, a + b * c, [`الضرب أولًا: ${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`]],
    [`(${a} + ${b}) × ${c}`, (a + b) * c, [`القوس أولًا: ${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`]],
    [`${a} × ${b} − ${c}`, a * b - c, [`الضرب أولًا: ${a} × ${b} = ${a * b}`, `${a * b} − ${c} = ${a * b - c}`]],
    [`${a * b} ÷ ${a} + ${c}`, b + c, [`القسمة أولًا: ${a * b} ÷ ${a} = ${b}`, `${b} + ${c} = ${b + c}`]],
    [`${a} × (${b + c} − ${c})`, a * b, [`القوس أولًا: ${b + c} − ${c} = ${b}`, `${a} × ${b} = ${a * b}`]],
    [`${a} + ${b} × ${c} − ${a}`, b * c, [`الضرب أولًا: ${b} × ${c} = ${b * c}`, `${a} + ${b * c} − ${a} = ${b * c}`]],
  ];
  const [expr, ans, steps] = T[v];
  return Q({ q: `احسبي: ${M(expr)}`, answer: String(ans), hint: 'الترتيب: الأقواس ← الضرب والقسمة ← الجمع والطرح.', steps: steps.map(dg) });
};

G.ratio = () => {
  const v = ri(0, 2);
  if (v === 0) { let a, b, k; do { k = ri(2, 6); a = ri(1, 9); b = ri(1, 9); } while (a === b || gcd(a, b) !== 1); return Q({ q: `بسّطي النسبة ${M(`${a * k} : ${b * k}`)} (اكتبيها مثل 3:4)`, answer: `${a}:${b}`, exact: true, hint: `اقسمي الطرفين على القاسم المشترك الأكبر (${dg(k)}).`, steps: [`ق.م.أ لـ ${dg(a * k)} و${dg(b * k)} = ${dg(k)}`, `${dg(a * k)} ÷ ${dg(k)} : ${dg(b * k)} ÷ ${dg(k)} = ${dg(a)}:${dg(b)}`] }); }
  if (v === 1) { const kg = ri(2, 6), per = ri(3, 15); return Q({ q: `${M(kg)} كيلو تمر بـ ${M(kg * per)} ريالًا. كم سعر الكيلو الواحد؟`, answer: String(per), hint: 'معدل الوحدة = السعر ÷ عدد الكيلوات.', steps: [`${dg(kg * per)} ÷ ${dg(kg)} = ${dg(per)} ريالًا للكيلو`] }); }
  const a = ri(1, 5), b = ri(2, 6), k = ri(2, 5); return Q({ q: `أكملي النسبة المكافئة: ${M(`${a} : ${b} = ؟ : ${b * k}`)}`, answer: String(a * k), hint: `${dg(b)} صار ${dg(b * k)} يعني ضربنا في ${dg(k)}. اضربي الطرف الأول في ${dg(k)} أيضًا.`, steps: [`${dg(b)} × ${dg(k)} = ${dg(b * k)}`, `${dg(a)} × ${dg(k)} = ${dg(a * k)}`] });
};

G.pctconv = () => {
  const v = ri(0, 3); const P = [[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [3, 5, 60], [4, 5, 80], [1, 10, 10], [3, 10, 30], [7, 10, 70], [9, 10, 90], [1, 20, 5], [3, 20, 15], [1, 100, 1]];
  const [n, d, p] = pick(P);
  if (v === 0) return Q({ q: `اكتبي الكسر ${fh(n, d)} نسبة مئوية.`, answer: `${p}%`, accept: [String(p)], hint: 'حولي المقام إلى 100: اضربي البسط والمقام في نفس العدد.', steps: [`${dg(n)}/${dg(d)} = ${dg(p)}/100`, `= ${dg(p)}%`] });
  if (v === 1) return Q({ q: `اكتبي ${M(p / 100)} نسبة مئوية.`, answer: `${p}%`, accept: [String(p)], hint: 'اضربي في 100 (حركي الفاصلة خانتين لليمين).', steps: [`${dg(p / 100)} × 100 = ${dg(p)}%`] });
  if (v === 2) return Q({ q: `اكتبي ${M(p + '%')} عددًا عشريًا.`, answer: String(p / 100), hint: 'اقسمي على 100 (حركي الفاصلة خانتين لليسار).', steps: [`${dg(p)} ÷ 100 = ${dg(p / 100)}`] });
  return Q({ q: `اكتبي ${M(p + '%')} كسرًا اعتياديًا في أبسط صورة.`, answer: fs(p, 100), hint: 'النسبة المئوية = العدد على 100، ثم بسّطي.', steps: [`${dg(p)}% = ${dg(p)}/100`, `بعد التبسيط: ${dg(fs(p, 100))}`] });
};

G.pctof = () => {
  const p = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80]); const n = ri(1, 12) * (p % 25 === 0 ? 4 : 20); const ans = p * n / 100;
  return Q({ q: `احسبي ${M(p + '%')} من ${M(n)}.`, answer: String(ans), hint: p === 10 ? '10% = نقسم على 10.' : p === 50 ? '50% = النصف.' : p === 25 ? '25% = الربع.' : `حولي ${dg(p)}% إلى ${dg(p / 100)} واضربي.`, steps: [`${dg(p)}% = ${dg(p / 100)}`, `${dg(p / 100)} × ${dg(n)} = ${dg(ans)}`] });
};

G.intro = () => {
  const v = ri(0, 3);
  if (v === 0) { let a = ri(-12, 12), b = ri(-12, 12); if (a === b) b = a - 1; const big = Math.max(a, b); return mcFrom(`أي العددين أكبر: ${M(sgn(a))} أم ${M(sgn(b))}؟`, M(sgn(big)), [M(sgn(Math.min(a, b)))], { vis: V.numline(-12, 12, [a, b]), hint: 'على خط الأعداد: العدد الذي على اليمين أكبر دائمًا. السالب الأقرب للصفر أكبر.', steps: [`${dg(sgn(big))} على يمين ${dg(sgn(Math.min(a, b)))} في خط الأعداد ← أكبر.`] }); }
  if (v === 1) { const a = ri(-15, 15); return Q({ q: `ما القيمة المطلقة |${M(sgn(a))}|؟`, answer: String(Math.abs(a)), hint: 'القيمة المطلقة = البعد عن الصفر (دائمًا موجبة).', steps: [`بعد ${dg(sgn(a))} عن الصفر = ${dg(Math.abs(a))}`] }); }
  if (v === 2) { let a = ri(-15, 15); if (!a) a = 5; return Q({ q: `ما معكوس العدد ${M(sgn(a))}؟`, answer: String(-a), hint: 'المعكوس هو نفس العدد بالإشارة المعاكسة.', steps: [`معكوس ${dg(sgn(a))} هو ${dg(sgn(-a))}`] }); }
  const a = ri(-8, 8); return Q({ q: 'ما العدد الذي تشير إليه النقطة على خط الأعداد؟', vis: V.numline(-8, 8, [a]), answer: String(a), hint: 'الصفر في المنتصف، يمينه موجب ويساره سالب.', steps: [`النقطة عند ${dg(sgn(a))}.`] });
};

G.evalexpr = () => {
  const a = ri(2, 9), b = ri(1, 12), x = ri(1, 9); const minus = ri(0, 1) && a * x > b; const val = minus ? a * x - b : a * x + b;
  return Q({ q: `إذا كانت ${M('س = ' + x)} فما قيمة ${M(`${a}س ${minus ? '−' : '+'} ${b}`)}؟`, answer: String(val), hint: `ضعي ${dg(x)} مكان س: ${dg(a)} × ${dg(x)} ${minus ? '−' : '+'} ${dg(b)}.`, steps: [`${dg(a)} × ${dg(x)} = ${dg(a * x)}`, `${dg(a * x)} ${minus ? '−' : '+'} ${dg(b)} = ${dg(val)}`] });
};

G.eq1 = () => {
  const x = ri(1, 15), a = ri(2, 12); const v = ri(0, 3);
  const T = [
    [`س + ${a} = ${x + a}`, `اطرحي ${a} من الطرفين.`, [`س + ${a} − ${a} = ${x + a} − ${a}`, `س = ${x}`]],
    [`س − ${a} = ${x}`, `أضيفي ${a} للطرفين.`, [`س − ${a} + ${a} = ${x} + ${a}`, `س = ${x + a}`]],
    [`${a}س = ${a * x}`, `اقسمي الطرفين على ${a}.`, [`${a}س ÷ ${a} = ${a * x} ÷ ${a}`, `س = ${x}`]],
    [`س ÷ ${a} = ${x}`, `اضربي الطرفين في ${a}.`, [`س = ${x} × ${a}`, `س = ${a * x}`]],
  ];
  const ans = [x, x + a, x, a * x][v]; const [eq, hint, steps] = T[v];
  return Q({ q: `حلي المعادلة: ${M(eq)}`, answer: String(ans), hint: 'المعادلة ميزان: ' + hint, steps: steps.map(dg) });
};

G.fracdiv = () => {
  if (ri(0, 2)) { const d1 = ri(2, 9), d2 = ri(2, 9), n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1); return Q({ q: `اقسمي: ${fh(n1, d1)} ÷ ${fh(n2, d2)}`, answer: fs(n1 * d2, d1 * n2), hint: 'اقلبي الكسر الثاني (المقلوب) وحولي القسمة إلى ضرب.', steps: [`مقلوب ${dg(n2)}/${dg(d2)} هو ${dg(d2)}/${dg(n2)}`, `${dg(n1)}/${dg(d1)} × ${dg(d2)}/${dg(n2)} = ${dg(n1 * d2)}/${dg(d1 * n2)}${simp(n1 * d2, d1 * n2)[1] !== d1 * n2 || simp(n1 * d2, d1 * n2)[0] !== n1 * d2 ? ` = ${dg(fs(n1 * d2, d1 * n2))}` : ''}`] }); }
  const d = ri(2, 9), n = ri(1, d - 1), k = ri(2, 6); return Q({ q: `اقسمي: ${fh(n, d)} ÷ ${M(k)}`, answer: fs(n, d * k), hint: `${dg(k)} = ${dg(k)}/1، ومقلوبه 1/${dg(k)}. اضربي فيه.`, steps: [`${dg(n)}/${dg(d)} × 1/${dg(k)} = ${dg(n)}/${dg(d * k)}${simp(n, d * k)[1] !== d * k ? ` = ${dg(fs(n, d * k))}` : ''}`] });
};

G.circle = () => {
  const r = ri(1, 10); const useD = ri(0, 1); const area = ri(0, 1) === 0; const C = r2(2 * 3.14 * r), A = r2(3.14 * r * r);
  return Q({ q: `دائرة ${useD ? `قطرها ${M(2 * r)}` : `نصف قطرها ${M(r)}`} سم. ما ${area ? 'مساحتها' : 'محيطها'}؟ (π = 3.14)`, answer: String(area ? A : C), tol: 0.02, hint: (useD ? `نصف القطر = القطر ÷ 2 = ${dg(r)}. ` : '') + (area ? 'المساحة = π × نق × نق.' : 'المحيط = 2 × π × نق.'), steps: (useD ? [`نق = ${dg(2 * r)} ÷ 2 = ${dg(r)}`] : []).concat(area ? [`${dg(r)} × ${dg(r)} = ${dg(r * r)}`, `3.14 × ${dg(r * r)} = ${dg(A)} سم²`] : [`2 × 3.14 = 6.28`, `6.28 × ${dg(r)} = ${dg(C)} سم`]) });
};

G.prob = () => {
  if (ri(0, 2)) { const cols = shuffle([['حمراء', ri(1, 5)], ['زرقاء', ri(1, 5)], ['خضراء', ri(1, 5)]]); const tot = cols.reduce((s, c) => s + c[1], 0); const c = pick(cols); return Q({ q: `في كيس ${cols.map((x) => `${M(x[1])} كرات ${x[0]}`).join(' و')}. ما احتمال سحب كرة ${c[0]}؟ (اكتبيه كسرًا)`, answer: fs(c[1], tot), hint: `الاحتمال = عدد الكرات ${c[0]} ÷ عدد كل الكرات.`, steps: [`كل الكرات = ${dg(cols.map((x) => x[1]).join(' + '))} = ${dg(tot)}`, `الاحتمال = ${dg(c[1])}/${dg(tot)}${simp(c[1], tot)[1] !== tot ? ` = ${dg(fs(c[1], tot))}` : ''}`] }); }
  const T = [['ظهور عدد زوجي', 3], ['ظهور العدد 6', 1], ['ظهور عدد أكبر من 4', 2], ['ظهور عدد أصغر من 3', 2], ['ظهور عدد فردي', 3]]; const [ev, k] = pick(T);
  return Q({ q: `نرمي مكعب أرقام (1 إلى 6). ما احتمال ${ev}؟ (اكتبيه كسرًا)`, answer: fs(k, 6), hint: 'النواتج الممكنة 6. عدّي النواتج المطلوبة.', steps: [`النواتج المطلوبة: ${dg(k)} من 6`, `${dg(k)}/6${simp(k, 6)[1] !== 6 ? ` = ${dg(fs(k, 6))}` : ''}`] });
};

G.powroot = () => {
  const v = ri(0, 2);
  if (v === 0) { const a = ri(2, 10), n = a <= 5 ? ri(2, 3) : 2; return Q({ q: `احسبي: ${M(a + sup(n))}`, answer: String(Math.pow(a, n)), hint: `${dg(a)}${sup(n)} يعني ${dg(a)} مضروبة في نفسها ${dg(n)} مرات.`, steps: [`${dg(Array(n).fill(a).join(' × '))} = ${dg(Math.pow(a, n))}`] }); }
  if (v === 1) { const r = ri(2, 12); return Q({ q: `احسبي: ${M('√' + r * r)}`, answer: String(r), hint: `أي عدد مضروب في نفسه يعطي ${dg(r * r)}؟`, steps: [`${dg(r)} × ${dg(r)} = ${dg(r * r)} ← √${dg(r * r)} = ${dg(r)}`] }); }
  const a = ri(2, 9), n = ri(2, 4); return mcFrom(`اكتبي ${M(Array(n).fill(a).join(' × '))} باستخدام الأسس.`, M(a + sup(n)), [M(n + sup(a)), M(a * n), M(a + sup(n + 1))], { hint: 'الأساس هو العدد المكرر، والأس هو عدد مرات التكرار.', steps: [`العدد ${dg(a)} تكرر ${dg(n)} مرات ← ${dg(a)}${sup(n)}`] });
};

G.intadd = () => {
  const a = ri(-20, 20), b = ri(-20, 20); const add = ri(0, 1) === 0; const ans = add ? a + b : a - b;
  const q = `${sgn(a)} ${add ? '+' : '−'} ${par(b)}`;
  const steps = add ? ((a >= 0) === (b >= 0) ? [`الإشارتان متشابهتان ← نجمع ${dg(Math.abs(a))} + ${dg(Math.abs(b))} = ${dg(Math.abs(a) + Math.abs(b))} ونحتفظ بالإشارة.`, `الناتج ${dg(sgn(ans))}`] : [`الإشارتان مختلفتان ← نطرح ${dg(Math.max(Math.abs(a), Math.abs(b)))} − ${dg(Math.min(Math.abs(a), Math.abs(b)))} = ${dg(Math.abs(ans))} ونأخذ إشارة الأكبر.`, `الناتج ${dg(sgn(ans))}`]) : [`الطرح = جمع المعكوس: ${dg(sgn(a))} + ${dg(par(-b))}`, `الناتج ${dg(sgn(ans))}`];
  return Q({ q: `احسبي: ${M(q)}`, answer: String(ans), hint: add ? 'نفس الإشارة: نجمع ونحتفظ بها. إشارات مختلفة: نطرح ونأخذ إشارة الأكبر.' : 'حولي الطرح إلى جمع المعكوس: أ − ب = أ + (−ب).', steps });
};

G.intmul = () => {
  const a = ri(-12, 12) || 3, b = ri(-12, 12) || -4; const mul = ri(0, 1) === 0; if (mul) { const ans = a * b; return Q({ q: `احسبي: ${M(`${par(a)} × ${par(b)}`)}`, answer: String(ans), hint: 'إشارتان متشابهتان ← موجب، مختلفتان ← سالب.', steps: [`${dg(Math.abs(a))} × ${dg(Math.abs(b))} = ${dg(Math.abs(ans))}`, `الإشارتان ${(a > 0) === (b > 0) ? 'متشابهتان ← موجب' : 'مختلفتان ← سالب'}: ${dg(sgn(ans))}`] }); }
  const q = a * b; return Q({ q: `احسبي: ${M(`${par(q)} ÷ ${par(b)}`)}`, answer: String(a), hint: 'اقسمي الأعداد بدون إشارة ثم حددي الإشارة: متشابهتان موجب، مختلفتان سالب.', steps: [`${dg(Math.abs(q))} ÷ ${dg(Math.abs(b))} = ${dg(Math.abs(a))}`, `الإشارتان ${(q > 0) === (b > 0) ? 'متشابهتان ← موجب' : 'مختلفتان ← سالب'}: ${dg(sgn(a))}`] });
};

const RAT = [[-1, 2, '−1/2'], [-3, 4, '−3/4'], [-1, 4, '−1/4'], [1, 2, '1/2'], [3, 4, '3/4'], [1, 4, '1/4'], [-0.75, 1, '−0.75'], [-0.5, 1, '−0.5'], [0.6, 1, '0.6'], [-1.5, 1, '−1.5'], [0.25, 1, '0.25'], [-0.2, 1, '−0.2'], [2, 5, '2/5'], [-3, 5, '−3/5']];
G.rational = () => {
  const v = ri(0, 2); const show = (r) => r[1] === 1 ? M(r[2]) : fh(r[0], r[1]); const val = (r) => r[0] / r[1];
  if (v === 0) { let a = pick(RAT), b = pick(RAT); if (val(a) === val(b)) b = RAT[(RAT.indexOf(a) + 1) % RAT.length]; const big = val(a) > val(b) ? a : b, sm = big === a ? b : a; return mcFrom(`أي العددين أكبر: ${show(a)} أم ${show(b)}؟`, show(big), [show(sm)], { hint: 'حولي الكسور إلى عشرية وقارني. السالب الأقرب للصفر أكبر.', steps: [`${dg(a[2])} = ${dg(fx(val(a)))} و ${dg(b[2])} = ${dg(fx(val(b)))}`, `${dg(fx(val(big)))} أكبر.`] }); }
  if (v === 1) { const s = shuffle(RAT).slice(0, 3); if (new Set(s.map(val)).size < 3) return G.rational(); const sorted = s.slice().sort((x, y) => val(x) - val(y)); const txt = (arr) => arr.map((r) => r[2]).join('، '); return mcFrom(`رتبي من الأصغر إلى الأكبر: ${s.map(show).join('، ')}`, M(txt(sorted)), [M(txt(sorted.slice().reverse())), M(txt(shuffle(sorted)))].filter((x) => x !== M(txt(sorted))), { hint: 'حولي كلها إلى عشرية ثم رتبي (الأكثر سالبية هو الأصغر).', steps: [`القيم: ${dg(s.map((r) => fx(val(r))).join('، '))}`, `الترتيب: ${dg(txt(sorted))}`] }); }
  const r = pick(RAT.filter((x) => x[1] !== 1)); return Q({ q: `اكتبي ${show(r)} عددًا عشريًا.`, answer: String(val(r)), hint: 'اقسمي البسط على المقام واحتفظي بالإشارة.', steps: [`${dg(Math.abs(r[0]))} ÷ ${dg(r[1])} = ${dg(Math.abs(val(r)))}`, `الناتج ${dg(fx(val(r)))}`] });
};

G.eq2 = () => {
  const x = ri(1, 12), a = ri(2, 9), b = ri(1, 15); const v = ri(0, 2);
  if (v === 0) return Q({ q: `حلي المعادلة: ${M(`${a}س + ${b} = ${a * x + b}`)}`, answer: String(x), hint: `أولًا اطرحي ${dg(b)} من الطرفين، ثم اقسمي على ${dg(a)}.`, steps: [`${dg(a)}س = ${dg(a * x + b)} − ${dg(b)} = ${dg(a * x)}`, `س = ${dg(a * x)} ÷ ${dg(a)} = ${dg(x)}`, `تحقق: ${dg(a)} × ${dg(x)} + ${dg(b)} = ${dg(a * x + b)} ✓`] });
  if (v === 1) return Q({ q: `حلي المعادلة: ${M(`${a}س − ${b} = ${a * x - b}`)}`, answer: String(x), hint: `أولًا أضيفي ${dg(b)} للطرفين، ثم اقسمي على ${dg(a)}.`, steps: [`${dg(a)}س = ${dg(sgn(a * x - b))} + ${dg(b)} = ${dg(a * x)}`, `س = ${dg(a * x)} ÷ ${dg(a)} = ${dg(x)}`] });
  return Q({ q: `حلي المعادلة: ${M(`س ÷ ${a} + ${b} = ${x + b}`)}`, answer: String(a * x), hint: `أولًا اطرحي ${dg(b)}، ثم اضربي في ${dg(a)}.`, steps: [`س ÷ ${dg(a)} = ${dg(x + b)} − ${dg(b)} = ${dg(x)}`, `س = ${dg(x)} × ${dg(a)} = ${dg(a * x)}`] });
};

const lin = (a, b) => { const t1 = a === 0 ? '' : a === 1 ? 'س' : a === -1 ? '−س' : `${sgn(a)}س`; if (b === 0) return t1 || '0'; if (!t1) return sgn(b); return `${t1} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`; };
G.simplify = () => {
  const v = ri(0, 3); const a = ri(1, 6), b = ri(1, 6), c = ri(1, 9), k = ri(2, 5);
  if (v === 0) return Q({ q: `بسّطي: ${M(`${a}س + ${b}س − ${c}`)}`, answer: lin(a + b, -c), kind: 'linear', hint: 'اجمعي الحدود المتشابهة (التي فيها س) مع بعض، والعدد يبقى لوحده.', steps: [`${dg(a)}س + ${dg(b)}س = ${dg(a + b)}س`, `الناتج: ${dg(lin(a + b, -c))}`] });
  if (v === 1) return Q({ q: `استخدمي خاصية التوزيع: ${M(`${k}(س + ${c})`)}`, answer: lin(k, k * c), kind: 'linear', hint: `اضربي ${dg(k)} في كل حد داخل القوس.`, steps: [`${dg(k)} × س = ${dg(k)}س`, `${dg(k)} × ${dg(c)} = ${dg(k * c)}`, `الناتج: ${dg(lin(k, k * c))}`] });
  if (v === 2) return Q({ q: `استخدمي خاصية التوزيع: ${M(`${k}(${a}س − ${c})`)}`, answer: lin(k * a, -k * c), kind: 'linear', hint: `اضربي ${dg(k)} في ${dg(a)}س وفي ${dg(c)} مع الاحتفاظ بإشارة الطرح.`, steps: [`${dg(k)} × ${dg(a)}س = ${dg(k * a)}س`, `${dg(k)} × ${dg(c)} = ${dg(k * c)}`, `الناتج: ${dg(lin(k * a, -k * c))}`] });
  const d = ri(1, 9); return Q({ q: `بسّطي: ${M(`${a}س + ${c} + ${b}س − ${d}`)}`, answer: lin(a + b, c - d), kind: 'linear', hint: 'الحدود التي فيها س مع بعض، والأعداد مع بعض.', steps: [`${dg(a)}س + ${dg(b)}س = ${dg(a + b)}س`, `${dg(c)} − ${dg(d)} = ${dg(sgn(c - d))}`, `الناتج: ${dg(lin(a + b, c - d))}`] });
};

G.prop = () => {
  const a = ri(1, 9), b = ri(2, 12), k = ri(2, 6); if (ri(0, 1)) return Q({ q: `حلي التناسب: ${fh(a, b)} = ${M('س')} / ${M(b * k)}`, answer: String(a * k), hint: 'الضرب التبادلي: البسط × المقام المقابل = البسط × المقام المقابل.', steps: [`${dg(a)} × ${dg(b * k)} = ${dg(b)} × س`, `${dg(a * b * k)} = ${dg(b)}س`, `س = ${dg(a * b * k)} ÷ ${dg(b)} = ${dg(a * k)}`] });
  return Q({ q: `حلي التناسب: ${fh(a, b)} = ${M(a * k)} / ${M('س')}`, answer: String(b * k), hint: 'الضرب التبادلي ثم القسمة.', steps: [`${dg(a)} × س = ${dg(b)} × ${dg(a * k)}`, `${dg(a)}س = ${dg(a * b * k)}`, `س = ${dg(a * b * k)} ÷ ${dg(a)} = ${dg(b * k)}`] });
};

G.pctapp = () => {
  const v = ri(0, 3);
  if (v === 0) { const p = pick([10, 20, 25, 30, 40, 50]), price = ri(2, 20) * (p % 25 === 0 ? 4 : 10); const disc = price * p / 100; return Q({ q: `عباية سعرها ${M(price)} ريالًا وعليها خصم ${M(p + '%')}. كم السعر بعد الخصم؟`, answer: String(price - disc), hint: `احسبي قيمة الخصم (${dg(p)}% من ${dg(price)}) ثم اطرحيها من السعر.`, steps: [`الخصم = ${dg(p / 100)} × ${dg(price)} = ${dg(disc)}`, `السعر بعد الخصم = ${dg(price)} − ${dg(disc)} = ${dg(price - disc)} ريالًا`] }); }
  if (v === 1) { const price = ri(2, 30) * 20; const tax = price * 15 / 100; return Q({ q: `سعر جهاز ${M(price)} ريالًا قبل الضريبة. إذا كانت ضريبة القيمة المضافة ${M('15%')} فكم السعر بعد الضريبة؟`, answer: String(price + tax), hint: 'احسبي 15% من السعر ثم أضيفيها.', steps: [`الضريبة = 0.15 × ${dg(price)} = ${dg(tax)}`, `السعر النهائي = ${dg(price)} + ${dg(tax)} = ${dg(price + tax)} ريالًا`] }); }
  if (v === 2) { const a = ri(2, 10) * 10, p = pick([10, 20, 25, 50, 100]); const b = a + a * p / 100; return Q({ q: `ارتفع سعر الكيلو من ${M(a)} ريالًا إلى ${M(b)} ريالًا. ما النسبة المئوية للزيادة؟`, answer: `${p}%`, accept: [String(p)], hint: 'نسبة التغير = (الفرق ÷ القيمة الأصلية) × 100.', steps: [`الفرق = ${dg(b)} − ${dg(a)} = ${dg(b - a)}`, `${dg(b - a)} ÷ ${dg(a)} = ${dg((b - a) / a)}`, `× 100 = ${dg(p)}%`] }); }
  const a = ri(2, 10) * 10, p = pick([10, 20, 25, 50]); const b = a - a * p / 100; return Q({ q: `انخفض عدد الزوار من ${M(a)} إلى ${M(b)}. ما النسبة المئوية للنقص؟`, answer: `${p}%`, accept: [String(p)], hint: 'نسبة التغير = (الفرق ÷ العدد الأصلي) × 100.', steps: [`الفرق = ${dg(a)} − ${dg(b)} = ${dg(a - b)}`, `${dg(a - b)} ÷ ${dg(a)} = ${dg((a - b) / a)}`, `× 100 = ${dg(p)}%`] });
};

G.anglerel = () => {
  const v = ri(0, 3);
  if (v === 0) { const x = ri(10, 80); return Q({ q: `زاويتان متتامتان، إحداهما ${M(x)}°. ما قياس الأخرى؟`, answer: String(90 - x), hint: 'المتتامتان مجموعهما 90°.', steps: [`90 − ${dg(x)} = ${dg(90 - x)}°`] }); }
  if (v === 1) { const x = ri(20, 160); return Q({ q: `زاويتان متكاملتان، إحداهما ${M(x)}°. ما قياس الأخرى؟`, answer: String(180 - x), hint: 'المتكاملتان مجموعهما 180°.', steps: [`180 − ${dg(x)} = ${dg(180 - x)}°`] }); }
  if (v === 2) { const a = ri(20, 100), b = ri(20, 170 - a); return Q({ q: `مثلث فيه زاويتان قياسهما ${M(a)}° و${M(b)}°. ما قياس الزاوية الثالثة؟`, answer: String(180 - a - b), hint: 'مجموع زوايا المثلث 180°.', steps: [`${dg(a)} + ${dg(b)} = ${dg(a + b)}`, `180 − ${dg(a + b)} = ${dg(180 - a - b)}°`] }); }
  const x = ri(20, 160); return Q({ q: `مستقيمان متقاطعان، إحدى الزوايا ${M(x)}°. ما قياس الزاوية المقابلة لها بالرأس؟`, answer: String(x), hint: 'المتقابلتان بالرأس متساويتان.', steps: [`الزاوية المقابلة بالرأس = ${dg(x)}°`] });
};

G.volume = () => {
  const v = ri(0, 2);
  if (v === 0) { const l = ri(2, 10), w = ri(2, 10), h = ri(2, 10); return Q({ q: `متوازي مستطيلات طوله ${M(l)} سم وعرضه ${M(w)} سم وارتفاعه ${M(h)} سم. ما حجمه؟`, answer: String(l * w * h), hint: 'الحجم = الطول × العرض × الارتفاع.', steps: [`${dg(l)} × ${dg(w)} × ${dg(h)} = ${dg(l * w * h)} سم³`] }); }
  if (v === 1) { const l = ri(2, 8), w = ri(2, 8), h = ri(2, 8); const sa = 2 * (l * w + l * h + w * h); return Q({ q: `متوازي مستطيلات أبعاده ${M(l)} و${M(w)} و${M(h)} سم. ما مساحته السطحية؟`, answer: String(sa), hint: 'المساحة السطحية = 2 × (ط×ع + ط×ر + ع×ر).', steps: [`${dg(l)}×${dg(w)} = ${dg(l * w)}، ${dg(l)}×${dg(h)} = ${dg(l * h)}، ${dg(w)}×${dg(h)} = ${dg(w * h)}`, `المجموع ${dg(l * w + l * h + w * h)} × 2 = ${dg(sa)} سم²`] }); }
  const r = ri(1, 6), h = ri(2, 10); const vol = r2(3.14 * r * r * h); return Q({ q: `أسطوانة نصف قطر قاعدتها ${M(r)} سم وارتفاعها ${M(h)} سم. ما حجمها؟ (π = 3.14)`, answer: String(vol), tol: 0.02, hint: 'الحجم = π × نق² × الارتفاع.', steps: [`نق² = ${dg(r * r)}`, `3.14 × ${dg(r * r)} × ${dg(h)} = ${dg(vol)} سم³`] });
};

G.stats2 = () => {
  const v = ri(0, 2);
  if (v === 0) { let vals, fr, sum, n; do { vals = [ri(1, 5), ri(6, 9), ri(10, 14)]; fr = [ri(1, 4), ri(1, 4), ri(1, 4)]; n = fr.reduce((s, x) => s + x, 0); sum = vals.reduce((s, x, i) => s + x * fr[i], 0); } while (!isInt(sum / n)); return Q({ q: 'الجدول يبين درجات طالبات في اختبار قصير. ما المتوسط الحسابي للدرجات؟', vis: V.table([['الدرجة', 'عدد الطالبات']].concat(vals.map((x, i) => [String(x), String(fr[i])]))), answer: String(sum / n), hint: 'اضربي كل درجة في تكرارها، اجمعي، ثم اقسمي على عدد الطالبات.', steps: [`${vals.map((x, i) => `${dg(x)}×${dg(fr[i])}`).join(' + ')} = ${dg(sum)}`, `عدد الطالبات = ${dg(n)}`, `${dg(sum)} ÷ ${dg(n)} = ${dg(sum / n)}`] }); }
  if (v === 1) { const a = Array.from({ length: 6 }, () => ri(3, 40)); const mx = Math.max.apply(null, a), mn = Math.min.apply(null, a); return Q({ q: `ما المدى للبيانات: ${M(a.join('، '))}؟`, answer: String(mx - mn), hint: 'المدى = الأكبر − الأصغر.', steps: [`${dg(mx)} − ${dg(mn)} = ${dg(mx - mn)}`] }); }
  const T = [['صورة وعدد زوجي', 1, 2, 3], ['كتابة والعدد 5', 1, 2, 1], ['صورة وعدد أكبر من 4', 1, 2, 2], ['كتابة وعدد أصغر من 3', 1, 2, 2]]; const [ev, cn, cd, k] = pick(T);
  return Q({ q: `نرمي قطعة نقد ومكعب أرقام معًا. ما احتمال ظهور ${ev}؟ (اكتبيه كسرًا)`, answer: fs(cn * k, cd * 6), hint: 'احتمال حدثين مستقلين = احتمال الأول × احتمال الثاني.', steps: [`احتمال قطعة النقد = 1/2`, `احتمال المكعب = ${dg(k)}/6`, `1/2 × ${dg(k)}/6 = ${dg(k)}/12${simp(k, 12)[1] !== 12 ? ` = ${dg(fs(k, 12))}` : ''}`] });
};

G.exprules = () => {
  const v = ri(0, 4); const a = ri(2, 9), m = ri(2, 6), n = ri(2, 6);
  if (v === 0) return mcFrom(`بسّطي: ${M(`${a}${sup(m)} × ${a}${sup(n)}`)}`, M(a + sup(m + n)), [M(a + sup(m * n)), M((a * a) + sup(m + n)), M(a + sup(Math.abs(m - n)))], { hint: 'نفس الأساس في الضرب ← نجمع الأسس.', steps: [`${dg(a)}${sup(m)} × ${dg(a)}${sup(n)} = ${dg(a)}${sup(m + n)}`] });
  if (v === 1) { const big = Math.max(m, n) + ri(1, 3), sm = Math.min(m, n); return mcFrom(`بسّطي: ${M(`${a}${sup(big)} ÷ ${a}${sup(sm)}`)}`, M(a + sup(big - sm)), [M(a + sup(big + sm)), M(1 + sup(big - sm)), M(a + sup(Math.floor(big / sm)))], { hint: 'نفس الأساس في القسمة ← نطرح الأسس.', steps: [`${dg(a)}${sup(big)} ÷ ${dg(a)}${sup(sm)} = ${dg(a)}${sup(big - sm)}`] }); }
  if (v === 2) return mcFrom(`بسّطي: ${M(`(${a}${sup(m)})${sup(n)}`)}`, M(a + sup(m * n)), [M(a + sup(m + n)), M(a + sup(Math.pow(m, n))), M((a * n) + sup(m))], { hint: 'قوة القوة ← نضرب الأسين.', steps: [`(${dg(a)}${sup(m)})${sup(n)} = ${dg(a)}${sup(m * n)}`] });
  if (v === 3) return Q({ q: `احسبي: ${M(a + sup(0))}`, answer: '1', hint: 'أي عدد (غير الصفر) أسه صفر = 1.', steps: [`${dg(a)}⁰ = 1`] });
  const b = pick([2, 3, 4, 5, 10]), e = ri(1, 2); return Q({ q: `احسبي: ${M(b + sup(-e))} (اكتبي الجواب كسرًا أو عشريًا)`, answer: fs(1, Math.pow(b, e)), accept: [String(1 / Math.pow(b, e))], hint: 'الأس السالب = مقلوب: أ⁻ⁿ = 1 ÷ أⁿ.', steps: [`${dg(b)}${sup(-e)} = 1/${dg(b)}${sup(e)} = 1/${dg(Math.pow(b, e))}`] });
};

G.scinot = () => {
  if (ri(0, 1)) { const m = ri(11, 99) / 10, e = ri(2, 6); const num = m * Math.pow(10, e); const sci = (mm, ee) => `${mm} × 10${sup(ee)}`; return mcFrom(`اكتبي ${M(num)} بالصيغة العلمية.`, M(sci(m, e)), [M(sci(m * 10, e - 1)), M(sci(m, e - 1)), M(sci(m / 10, e + 1))], { hint: 'حركي الفاصلة حتى يصير العدد بين 1 و10، وعدد الحركات هو الأس.', steps: [`${dg(num)} ← نحرك الفاصلة ${dg(e)} خانات لليسار ← ${dg(m)}`, `${dg(m)} × 10${sup(e)}`] }); }
  const m = ri(11, 99) / 10, e = ri(0, 1) ? ri(2, 5) : -ri(1, 3); const num = Math.round(m * Math.pow(10, e) * 1e6) / 1e6;
  return Q({ q: `اكتبي ${M(`${m} × 10${sup(e)}`)} عددًا عاديًا.`, answer: String(num), hint: e > 0 ? `حركي الفاصلة ${dg(e)} خانات لليمين (أضيفي أصفارًا).` : `حركي الفاصلة ${dg(-e)} خانات لليسار (أضيفي أصفارًا بعد الفاصلة).`, steps: [`${dg(m)} × 10${sup(e)} = ${dg(num)}`] });
};

G.roots = () => {
  const v = ri(0, 2);
  if (v === 0) { const r = ri(2, 15); return Q({ q: `احسبي: ${M('√' + r * r)}`, answer: String(r), hint: `أي عدد مضروب في نفسه يعطي ${dg(r * r)}؟ جربي المربعات: 100، 121، 144…`, steps: [`${dg(r)} × ${dg(r)} = ${dg(r * r)} ← √${dg(r * r)} = ${dg(r)}`] }); }
  if (v === 1) { const k = ri(2, 12); const n = ri(k * k + 1, (k + 1) * (k + 1) - 1); return mcFrom(`${M('√' + n)} يقع بين أي عددين صحيحين؟`, `${dg(k)} و${dg(k + 1)}`, [`${dg(k - 1)} و${dg(k)}`, `${dg(k + 1)} و${dg(k + 2)}`, `${dg(k * 2)} و${dg(k * 2 + 1)}`], { hint: `ابحثي عن مربعين كاملين حول ${dg(n)}: ${dg(k * k)} و${dg((k + 1) * (k + 1))}.`, steps: [`${dg(k)}² = ${dg(k * k)} و ${dg(k + 1)}² = ${dg((k + 1) * (k + 1))}`, `${dg(k * k)} < ${dg(n)} < ${dg((k + 1) * (k + 1))} ← √${dg(n)} بين ${dg(k)} و${dg(k + 1)}`] }); }
  const c = pick([2, 3, 4, 5, 10]); return Q({ q: `احسبي: ${M('∛' + c * c * c)}`, answer: String(c), hint: 'أي عدد مضروب في نفسه ثلاث مرات؟', steps: [`${dg(c)} × ${dg(c)} × ${dg(c)} = ${dg(c * c * c)} ← ∛${dg(c * c * c)} = ${dg(c)}`] });
};

G.eqmulti = () => {
  const x = ri(1, 10); const v = ri(0, 2);
  if (v === 0) { let a = ri(2, 6), c = ri(1, 5); if (a === c) a++; const b = ri(1, 12), d = a * x + b - c * x; return Q({ q: `حلي المعادلة: ${M(`${a}س + ${b} = ${lin(c, d)}`)}`, answer: String(x), hint: `اجمعي حدود س في طرف: اطرحي ${dg(c)}س من الطرفين، ثم الأعداد في الطرف الآخر.`, steps: [`${dg(a)}س − ${dg(c)}س = ${dg(sgn(d))} − ${dg(b)}`, `${dg(a - c)}س = ${dg(sgn(d - b))}`, `س = ${dg(sgn(d - b))} ÷ ${dg(a - c)} = ${dg(x)}`] }); }
  if (v === 1) { const k = ri(2, 5), b = ri(1, 6); return Q({ q: `حلي المعادلة: ${M(`${k}(س − ${b}) = ${k * (x - b)}`)}`, answer: String(x), hint: `وزّعي ${dg(k)} على القوس أولًا (أو اقسمي الطرفين على ${dg(k)}).`, steps: [`${dg(k)}س − ${dg(k * b)} = ${dg(sgn(k * (x - b)))}`, `${dg(k)}س = ${dg(sgn(k * (x - b)))} + ${dg(k * b)} = ${dg(k * x)}`, `س = ${dg(x)}`] }); }
  const k = ri(2, 5), b = ri(1, 6), m = ri(1, 9); return Q({ q: `حلي المعادلة: ${M(`${k}(س + ${b}) − ${m} = ${k * (x + b) - m}`)}`, answer: String(x), hint: 'وزّعي، ثم اجمعي الأعداد، ثم اعزلي س.', steps: [`${dg(k)}س + ${dg(k * b)} − ${dg(m)} = ${dg(k * (x + b) - m)}`, `${dg(k)}س + ${dg(sgn(k * b - m))} = ${dg(k * (x + b) - m)}`, `${dg(k)}س = ${dg(k * x)} ← س = ${dg(x)}`] });
};

G.ineq = () => {
  const x = ri(1, 10), a = ri(1, 9), k = ri(2, 5); const v = ri(0, 3); const S = ['>', '<', '≥', '≤']; const s = pick(S); const flip = { '>': '<', '<': '>', '≥': '≤', '≤': '≥' };
  const opts = (val) => S.map((o) => M(`س ${o} ${sgn(val)}`));
  if (v === 0) { const ans = M(`س ${s} ${x}`); return mcFrom(`حلي المتباينة: ${M(`س + ${a} ${s} ${x + a}`)}`, ans, opts(x).filter((o) => o !== ans), { hint: `اطرحي ${dg(a)} من الطرفين، والإشارة تبقى كما هي.`, steps: [`س ${s} ${dg(x + a)} − ${dg(a)}`, `س ${s} ${dg(x)}`] }); }
  if (v === 1) { const ans = M(`س ${s} ${x}`); return mcFrom(`حلي المتباينة: ${M(`${k}س ${s} ${k * x}`)}`, ans, opts(x).filter((o) => o !== ans), { hint: `اقسمي على ${dg(k)} (موجب) ← الإشارة تبقى.`, steps: [`س ${s} ${dg(k * x)} ÷ ${dg(k)}`, `س ${s} ${dg(x)}`] }); }
  if (v === 2) { const ans = M(`س ${flip[s]} ${sgn(-x)}`); return mcFrom(`حلي المتباينة: ${M(`−${k}س ${s} ${k * x}`)}`, ans, opts(-x).filter((o) => o !== ans).concat(opts(x)).filter((o) => o !== ans), { hint: `القسمة على عدد سالب (−${dg(k)}) تقلب الإشارة!`, steps: [`س ${flip[s]} ${dg(k * x)} ÷ (−${dg(k)})`, `س ${flip[s]} ${dg(sgn(-x))}`] }); }
  const ans = M(`س ${s} ${x}`); return mcFrom(`حلي المتباينة: ${M(`${k}س − ${a} ${s} ${k * x - a}`)}`, ans, opts(x).filter((o) => o !== ans), { hint: `أضيفي ${dg(a)} ثم اقسمي على ${dg(k)}.`, steps: [`${dg(k)}س ${s} ${dg(sgn(k * x - a))} + ${dg(a)} = ${dg(k * x)}`, `س ${s} ${dg(x)}`] });
};

G.linear = () => {
  const v = ri(0, 3);
  if (v === 0) { let x1 = ri(-5, 5), y1 = ri(-5, 5), dx = ri(1, 4), m = ri(-4, 4); if (!m) m = 2; const x2 = x1 + dx, y2 = y1 + m * dx; return Q({ q: `ما ميل المستقيم المار بالنقطتين ${M(pt(x1, y1))} و${M(pt(x2, y2))}؟`, vis: V.grid([[x1, y1], [x2, y2]]), answer: String(m), hint: 'الميل = (ص₂ − ص₁) ÷ (س₂ − س₁).', steps: [`ص₂ − ص₁ = ${dg(sgn(y2))} − ${dg(par(y1))} = ${dg(sgn(y2 - y1))}`, `س₂ − س₁ = ${dg(sgn(x2))} − ${dg(par(x1))} = ${dg(dx)}`, `الميل = ${dg(sgn(y2 - y1))} ÷ ${dg(dx)} = ${dg(sgn(m))}`] }); }
  if (v === 1) { const m = ri(-5, 5) || 3, b = ri(-9, 9), x = ri(-5, 6); const y = m * x + b; return Q({ q: `إذا كانت ${M(`ص = ${lin(m, b)}`)} فما قيمة ص عندما ${M(`س = ${sgn(x)}`)}؟`, answer: String(y), hint: `عوّضي ${dg(sgn(x))} مكان س.`, steps: [`ص = ${dg(sgn(m))} × ${dg(par(x))} ${b < 0 ? '−' : '+'} ${dg(Math.abs(b))}`, `ص = ${dg(sgn(m * x))} ${b < 0 ? '−' : '+'} ${dg(Math.abs(b))} = ${dg(sgn(y))}`] }); }
  const m = ri(-6, 6) || 2, b = ri(-9, 9) || 4; if (v === 2) return Q({ q: `ما ميل المستقيم ${M(`ص = ${lin(m, b)}`)}؟`, answer: String(m), hint: 'في الصورة ص = م س + ب، الميل هو معامل س.', steps: [`معامل س = ${dg(sgn(m))} ← الميل ${dg(sgn(m))}`] });
  return Q({ q: `ما المقطع الصادي (ب) للمستقيم ${M(`ص = ${lin(m, b)}`)}؟`, answer: String(b), hint: 'ب هو العدد اللي لوحده (بدون س)، وهو نقطة تقاطع المستقيم مع المحور الرأسي.', steps: [`الحد الثابت = ${dg(sgn(b))} ← يقطع المحور الصادي عند ${dg(sgn(b))}`] });
};

G.graphread = () => {
  const v = ri(0, 2);
  if (v === 0) { const x = ri(-5, 5) || 3, y = ri(-5, 5) || -2; return Q({ q: 'اكتبي إحداثيات النقطة أ على شكل (س، ص).', vis: V.grid([[x, y]], { names: ['أ'] }), answer: `(${x}, ${y})`, kind: 'point', hint: 'س: كم خطوة يمين (+) أو يسار (−). ص: كم خطوة فوق (+) أو تحت (−).', steps: [`من نقطة الأصل: ${Math.abs(x)} ${x > 0 ? 'يمينًا' : 'يسارًا'} ← س = ${dg(sgn(x))}`, `ثم ${Math.abs(y)} ${y > 0 ? 'لأعلى' : 'لأسفل'} ← ص = ${dg(sgn(y))}`, `النقطة ${dg(pt(x, y))}`] }); }
  if (v === 1) { const x = ri(1, 6) * (ri(0, 1) ? 1 : -1), y = ri(1, 6) * (ri(0, 1) ? 1 : -1); const q = x > 0 && y > 0 ? 'الأول' : x < 0 && y > 0 ? 'الثاني' : x < 0 && y < 0 ? 'الثالث' : 'الرابع'; return mcFrom(`في أي ربع تقع النقطة ${M(pt(x, y))}؟`, `الربع ${q}`, ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'].filter((o) => o !== `الربع ${q}`), { vis: V.grid([[x, y]], { labels: false }), hint: 'الأول (+، +)، الثاني (−، +)، الثالث (−، −)، الرابع (+، −).', steps: [`س ${x > 0 ? 'موجب' : 'سالب'} و ص ${y > 0 ? 'موجب' : 'سالب'} ← الربع ${q}`] }); }
  const m = ri(1, 5), b = ri(-5, 5); const xs = [0, 1, 2, 3]; const miss = ri(1, 3); const rows = [['س', 'ص']].concat(xs.map((x) => [String(x), x === miss ? '؟' : sgn(m * x + b)]));
  return Q({ q: `أكملي جدول الدالة ${M(`ص = ${lin(m, b)}`)}: ما قيمة ص عندما س = ${M(miss)}؟`, vis: V.table(rows), answer: String(m * miss + b), hint: `عوّضي س = ${dg(miss)} في القاعدة.`, steps: [`ص = ${dg(m)} × ${dg(miss)} ${b < 0 ? '−' : '+'} ${dg(Math.abs(b))} = ${dg(sgn(m * miss + b))}`] });
};

const TRIPLES = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [9, 40, 41]];
G.pyth = () => {
  const [a, b, c] = pick(TRIPLES);
  if (ri(0, 1)) return Q({ q: `مثلث قائم الزاوية طولا ضلعي القائمة ${M(a)} و${M(b)} سم. ما طول الوتر؟`, vis: V.tri(a, b, c, 'c'), answer: String(c), hint: 'الوتر² = الضلع الأول² + الضلع الثاني².', steps: [`${dg(a)}² + ${dg(b)}² = ${dg(a * a)} + ${dg(b * b)} = ${dg(c * c)}`, `الوتر = √${dg(c * c)} = ${dg(c)} سم`] });
  return Q({ q: `مثلث قائم الزاوية وتره ${M(c)} سم وأحد ضلعي القائمة ${M(a)} سم. ما طول الضلع الآخر؟`, vis: V.tri(a, b, c, 'b'), answer: String(b), hint: 'الضلع² = الوتر² − الضلع الآخر².', steps: [`${dg(c)}² − ${dg(a)}² = ${dg(c * c)} − ${dg(a * a)} = ${dg(b * b)}`, `الضلع = √${dg(b * b)} = ${dg(b)} سم`] });
};

G.transform = () => {
  const x = ri(-5, 5) || 2, y = ri(-5, 5) || 3; const v = ri(0, 4);
  if (v === 0) { const dx = ri(-4, 4) || 3, dy = ri(-4, 4) || -2; const nx = x + dx, ny = y + dy; return Q({ q: `انسحبت النقطة ${M(pt(x, y))} بمقدار ${M(Math.abs(dx))} ${dx > 0 ? 'وحدات يمينًا' : 'وحدات يسارًا'} و${M(Math.abs(dy))} ${dy > 0 ? 'وحدات لأعلى' : 'وحدات لأسفل'}. ما صورتها؟`, vis: V.grid([[x, y]], { names: ['أ'] }), answer: `(${nx}, ${ny})`, kind: 'point', hint: 'يمين/أعلى نزيد، يسار/أسفل ننقص.', steps: [`س: ${dg(sgn(x))} ${dx > 0 ? '+' : '−'} ${dg(Math.abs(dx))} = ${dg(sgn(nx))}`, `ص: ${dg(sgn(y))} ${dy > 0 ? '+' : '−'} ${dg(Math.abs(dy))} = ${dg(sgn(ny))}`, `الصورة ${dg(pt(nx, ny))}`] }); }
  if (v === 1) return Q({ q: `ما صورة النقطة ${M(pt(x, y))} بالانعكاس حول المحور س؟`, vis: V.grid([[x, y]], { names: ['أ'] }), answer: `(${x}, ${-y})`, kind: 'point', hint: 'الانعكاس حول محور س: س تبقى وص تغير إشارتها.', steps: [`(س، ص) ← (س، −ص)`, `${dg(pt(x, y))} ← ${dg(pt(x, -y))}`] });
  if (v === 2) return Q({ q: `ما صورة النقطة ${M(pt(x, y))} بالانعكاس حول المحور ص؟`, vis: V.grid([[x, y]], { names: ['أ'] }), answer: `(${-x}, ${y})`, kind: 'point', hint: 'الانعكاس حول محور ص: ص تبقى وس تغير إشارتها.', steps: [`(س، ص) ← (−س، ص)`, `${dg(pt(x, y))} ← ${dg(pt(-x, y))}`] });
  if (v === 3) return Q({ q: `ما صورة النقطة ${M(pt(x, y))} بالدوران 180° حول نقطة الأصل؟`, vis: V.grid([[x, y]], { names: ['أ'] }), answer: `(${-x}, ${-y})`, kind: 'point', hint: 'الدوران 180°: الإحداثيان يغيران إشارتهما.', steps: [`(س، ص) ← (−س، −ص)`, `${dg(pt(x, y))} ← ${dg(pt(-x, -y))}`] });
  return Q({ q: `ما صورة النقطة ${M(pt(x, y))} بالدوران 90° عكس اتجاه عقارب الساعة حول نقطة الأصل؟`, vis: V.grid([[x, y]], { names: ['أ'] }), answer: `(${-y}, ${x})`, kind: 'point', hint: 'الدوران 90° عكس عقارب الساعة: (س، ص) ← (−ص، س).', steps: [`(س، ص) ← (−ص، س)`, `${dg(pt(x, y))} ← ${dg(pt(-y, x))}`] });
};

G.volume2 = () => {
  const v = ri(0, 2); const r = pick([1, 2, 3, 4, 5]);
  if (v === 0) { const h = ri(2, 10); const vol = r2(3.14 * r * r * h); return Q({ q: `أسطوانة نصف قطرها ${M(r)} سم وارتفاعها ${M(h)} سم. ما حجمها؟ (π = 3.14)`, answer: String(vol), tol: 0.02, hint: 'الحجم = π × نق² × ع.', steps: [`نق² = ${dg(r * r)}`, `3.14 × ${dg(r * r)} × ${dg(h)} = ${dg(vol)} سم³`] }); }
  if (v === 1) { const h = ri(1, 4) * 3; const vol = r2(3.14 * r * r * h / 3); return Q({ q: `مخروط نصف قطر قاعدته ${M(r)} سم وارتفاعه ${M(h)} سم. ما حجمه؟ (π = 3.14)`, answer: String(vol), tol: 0.02, hint: 'الحجم = ⅓ × π × نق² × ع (ثلث حجم الأسطوانة).', steps: [`نق² × ع = ${dg(r * r)} × ${dg(h)} = ${dg(r * r * h)}`, `÷ 3 = ${dg(r * r * h / 3)}`, `× 3.14 = ${dg(vol)} سم³`] }); }
  const rr = pick([1, 2, 3, 6]); const vol = r2(4 / 3 * 3.14 * rr * rr * rr); return Q({ q: `كرة نصف قطرها ${M(rr)} سم. ما حجمها؟ (π = 3.14، قرّبي لأقرب جزء من مئة)`, answer: String(vol), tol: 0.05, hint: 'الحجم = 4/3 × π × نق³.', steps: [`نق³ = ${dg(rr * rr * rr)}`, `4/3 × 3.14 × ${dg(rr * rr * rr)} = ${dg(vol)} سم³`] });
};

/* ---------- الفحص ---------- */
const ARD = '٠١٢٣٤٥٦٧٨٩', FAD = '۰۱۲۳۴۵۶۷۸۹';
function norm(s) {
  return String(s == null ? '' : s).trim().replace(/[٠-٩]/g, (d) => ARD.indexOf(d)).replace(/[۰-۹]/g, (d) => FAD.indexOf(d)).replace(/[−–—]/g, '-').replace(/٫/g, '.').replace(/٪/g, '%').replace(/[xX]/g, 'س').replace(/\s+/g, ' ');
}
function parseNum(s) {
  s = norm(s).replace(/%/g, '').replace(/\s*\/\s*/g, '/').replace(/^\((.*)\)$/, '$1').trim();
  if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
  let m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/); if (m) { const v = +m[2] + m[3] / m[4]; return m[1] ? -v : v; }
  m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/); if (m) return +m[2] ? +m[1] / +m[2] : NaN;
  if (/^-?\d*\.?\d+$/.test(s)) return +s;
  return NaN;
}
function parseLinear(s) {
  s = norm(s).replace(/\s+/g, '').replace(/\*/g, ''); if (!s) return null; let a = 0, b = 0; const re = /([+-]?)(\d*\.?\d*)(س?)/g; let m, any = false; let rest = s;
  while ((m = re.exec(s)) && m[0]) { any = true; const sg = m[1] === '-' ? -1 : 1; if (m[3]) a += sg * (m[2] === '' ? 1 : +m[2]); else if (m[2] !== '') b += sg * +m[2]; rest = rest.replace(m[0], ''); }
  if (!any || rest.length) return null; return { a, b };
}
function samePoint(s, ans) { const p = norm(s).replace(/[()]/g, '').split(/[,،;]/).map((x) => parseNum(x)); const q = norm(ans).replace(/[()]/g, '').split(/[,،;]/).map((x) => parseNum(x)); return p.length === 2 && q.length === 2 && p.every((x, i) => !isNaN(x) && Math.abs(x - q[i]) < 1e-9); }
function check(q, input) {
  if (q.type === 'mc') return { ok: Number(input) === q.ai };
  const raw = norm(input); if (!raw) return { ok: false, empty: true };
  const answers = [q.answer].concat(q.accept || []);
  if (q.exact) { const c = (s) => norm(s).replace(/\s+/g, '').toLowerCase(); return { ok: answers.some((a) => c(a) === c(raw)) }; }
  if (q.kind === 'point') return { ok: answers.some((a) => samePoint(raw, a)) };
  if (q.kind === 'linear') { const u = parseLinear(raw); if (!u) return { ok: false, bad: true }; return { ok: answers.some((a) => { const t = parseLinear(a); return t && Math.abs(t.a - u.a) < 1e-9 && Math.abs(t.b - u.b) < 1e-9; }) }; }
  const v = parseNum(raw); if (isNaN(v)) return { ok: false, bad: true };
  const tol = q.tol || 1e-6; return { ok: answers.some((a) => Math.abs(parseNum(a) - v) <= tol) };
}

/* ---------- الواجهة ---------- */
function gen(unit) { const g = (unit && unit.gen) || unit; const f = G[g.type]; if (!f) throw new Error('لا يوجد مولّد: ' + g.type); const q = f(g); q.unit = unit && unit.id; q.gtype = g.type; return q; }
function genMany(unit, n, tries) { const out = []; const seen = new Set(); tries = tries || n * 6; for (let i = 0; i < tries && out.length < n; i++) { const q = gen(unit); const key = q.q + (q.vis || '').slice(0, 80); if (seen.has(key)) continue; seen.add(key); out.push(q); } while (out.length < n) out.push(gen(unit)); return out; }
const API = { gen, genMany, check, V, G, types: Object.keys(G), setDigits: (m) => { DIG = m === 'ar' ? 'ar' : 'en'; }, getDigits: () => DIG, dg, M, F, fh, sgn, seed: (fn) => { rnd = fn || Math.random; }, parseNum, parseLinear, norm };
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.MathGen = API;
})(typeof window !== 'undefined' ? window : globalThis);
