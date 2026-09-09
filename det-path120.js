/* Personalized practice. Practice accuracy is never converted to a DET score. */
(function (root) {
  'use strict';
  const skills = {
    reading: { ar: 'القراءة', score: 75, weight: 4, drills: ['rs', 'fib', 'rc', 'ir', 'evidence'], route: 'read/ir' },
    writing: { ar: 'الكتابة', score: 80, weight: 3, drills: ['wp', 'iw', 'ws', 'sum', 'rewrite'], route: 'write/iw' },
    speaking: { ar: 'التحدث', score: 90, weight: 2, drills: ['sp', 'rts', 'is', 'ss'], route: 'speak/is' },
    listening: { ar: 'الاستماع', score: 100, weight: 1, drills: ['lt', 'il'], route: 'listen/il' }
  };
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const validScore = n => Number.isInteger(n) && n >= 10 && n <= 160 && n % 5 === 0;
  const day = t => { const d = new Date(t); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); };
  function profile(state) {
    if (!state.path120 || typeof state.path120 !== 'object' || Array.isArray(state.path120)) state.path120 = {};
    const p = state.path120;
    if (!Array.isArray(p.records)) p.records = [];
    p.records = p.records.filter(r => r && ['official', 'practice'].includes(r.type) && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && (r.type === 'official' ? validScore(r.overall) && Object.keys(skills).every(k => validScore(r[k])) : validScore(r.low) && validScore(r.high) && r.low <= r.high));
    if (![45, 60, 90].includes(p.minutes)) p.minutes = 60;
    return p;
  }
  function latest(p) { return p.records.filter(r => r.type === 'official').slice().reverse().sort((a, b) => b.date.localeCompare(a.date))[0] || null; }
  function stats(state, now = Date.now()) {
    const cutoff = now - 7 * 86400000;
    return Object.entries(skills).map(([key, s]) => {
      const attempts = (state.log || []).filter(a => s.drills.includes(a.drill) && a.t >= cutoff && a.t <= now && (Number.isFinite(a.sc) || typeof a.ok === 'boolean'));
      const recent = attempts.slice(-20);
      const avg = recent.length ? Math.round(recent.reduce((sum, a) => sum + (Number.isFinite(a.sc) ? a.sc : a.ok ? 100 : 0), 0) / recent.length) : null;
      return { key, ...s, avg, count: attempts.length, days: new Set(attempts.map(a => day(a.t))).size, today: attempts.filter(a => day(a.t) === day(now)).length };
    });
  }
  function allocation(state, now) {
    const p = profile(state), base = latest(p), rows = stats(state, now);
    const weights = rows.map(r => (base ? Math.max(10, 120 - base[r.key]) : r.weight * 10) * (r.avg == null ? 1.15 : r.avg < 70 ? 1.35 : r.avg < 85 ? 1.1 : 1));
    const remaining = p.minutes - 20, total = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map(w => remaining * w / total), extra = raw.map(Math.floor);
    const order = raw.map((v, i) => ({ i, fraction: v - extra[i] })).sort((a, b) => b.fraction - a.fraction);
    for (let n = remaining - extra.reduce((a, b) => a + b, 0), i = 0; i < n; i++) extra[order[i].i]++;
    return rows.map((r, i) => ({ ...r, minutes: 5 + extra[i] }));
  }
  function collectIssues(a) { return [a.extra, a.extra?.part1, a.extra?.part2].flatMap(x => Array.isArray(x?.issues) ? x.issues : []); }
  function report(state) {
    const p = profile(state), b = latest(p);
    return ['مسار 120 — ملخص متابعة', b ? `آخر نتيجة رسمية ${b.date}: ${b.overall}/160` : 'لم تسجل نتيجة رسمية',
      ...allocation(state).map(r => `${r.ar}: رسمي ${b ? b[r.key] : '—'} · تدريب ${r.avg == null ? 'لا بيانات' : r.avg + '%'} · ${r.count} محاولة خلال 7 أيام · ${r.minutes} دقيقة مقترحة`),
      'نسب التدريب ليست درجات DET ولا توقعا معتمدا.',
      ...p.records.map(r => r.type === 'official' ? `${r.date} رسمي: ${r.overall}` : `${r.date} نطاق التجريبي الرسمي: ${r.low}–${r.high}`)
    ].join('\n');
  }
  function mount(api) {
    const box = document.getElementById('path120'); if (!box) return;
    const state = api.state(), p = profile(state), base = latest(p), rows = allocation(state);
    box.innerHTML = `<div class="p120-heading"><div><span class="pill">مسار شخصي</span><h2>من مستواك الحالي إلى 120</h2><p>ابدأ بالمهارة الأضعف ثم راجع الخطأ وطبقه في سؤال جديد.</p></div><div class="p120-total"><b>${base ? base.overall : '—'}</b><span>آخر نتيجة رسمية / 160</span></div></div>
      <div class="p120-stages">${[95, 110, 120].map(n => `<span class="${base && base.overall >= n ? 'achieved' : ''}">${base && base.overall >= n ? '✓ ' : ''}${n} · ${n === 95 ? 'المحطة الأولى' : n === 110 ? 'المحطة الثانية' : 'الهدف'}</span>`).join('')}</div>
      <p class="hl-tip">100 في الاستماع ليست 100%. المقياس من 10 إلى 160. نسب التمارين أدناه تقيس أداء التدريب فقط.</p>
      ${!base ? '<button class="btn" id="p120-baseline">ابدأ بنتيجتي 85 · قراءة 75 · كتابة 80 · تحدث 90 · استماع 100</button>' : ''}
      <div class="p120-grid">${rows.map(r => `<div class="p120-skill"><h3>${r.ar}</h3><b>${base ? base[r.key] : '—'} <small>/ 160</small></b><div>تدريب آخر 7 أيام: ${r.avg == null ? 'لم يبدأ' : r.avg + '%'}</div><small>${r.count} محاولة · ${r.days} أيام تدريب</small><div class="bar"><i style="width:${r.avg || 0}%"></i></div></div>`).join('')}</div>
      <div class="p120-heading"><h3>جلسة اليوم</h3><label>وقت التدريب <select id="p120-minutes">${[45, 60, 90].map(n => `<option ${p.minutes === n ? 'selected' : ''} value="${n}">${n} دقيقة</option>`).join('')}</select></label></div>
      <div class="p120-missions">${rows.map(r => `<a href="#${r.route}"><span><b>${r.ar}</b><small>${r.key === 'reading' ? 'حدد الدليل وافهم معنى الكلمة من السياق' : r.key === 'writing' ? 'فكرة واضحة ثم تفسير ومثال ومراجعة' : r.key === 'speaking' ? 'إجابة مباشرة ثم سبب وتفصيل محدد' : 'افهم مقصد المتحدث ثم لخّص القرار'}<br>${r.today ? r.today + ' محاولات اليوم' : 'لم تتدرب اليوم بعد'}</small></span><strong>${r.minutes} د</strong></a>`).join('')}</div>
      <div class="row"><a class="btn" href="#read/evidence">قراءة: الاستنتاج والدليل</a><a class="btn" href="#write/rewrite">ورشة إعادة كتابة إجاباتي</a><a class="btn ghost" href="#skills/review">مراجعة أخطائي</a></div>
      <details><summary>كيف أعرف أني أتقدم؟</summary><p>راقب أداء عدة أيام وأسئلة جديدة. التقييم النصي هنا آلي ومحدود ولا يقيس النطق أو يمنح درجة DET. بعد كل 3 أيام تدريب خذ التجريبي الرسمي وسجل نطاقه. تكرار نطاق مناسب يدعم قرار الإعادة لكنه لا يضمن نتيجة.</p><a class="btn sm ghost" href="https://englishtest.duolingo.com/readiness" target="_blank" rel="noopener">التجريبي ودليل الاستعداد الرسمي</a></details>
      <details id="p120-records"><summary>سجل نتيجة رسمية أو نطاق التجريبي</summary><form id="p120-form"><label>نوع النتيجة <select name="type"><option value="official">اختبار معتمد</option><option value="practice">التجريبي الرسمي</option></select></label><label>التاريخ <input name="date" type="date" required value="${day(Date.now())}" max="${day(Date.now())}"></label><div id="p120-official" class="p120-grid">${[['overall', 'الإجمالي'], ...Object.entries(skills).map(([k, v]) => [k, v.ar])].map(([k, label]) => `<label>${label}<input name="${k}" type="number" min="10" max="160" step="5" required></label>`).join('')}</div><div id="p120-practice" hidden><label>بداية النطاق <input name="low" type="number" min="10" max="160" step="5" disabled></label><label>نهاية النطاق <input name="high" type="number" min="10" max="160" step="5" disabled></label></div><button class="btn sm" type="submit">حفظ النتيجة</button><p role="status" id="p120-error"></p></form>
      <div class="p120-record-list">${p.records.slice().sort((a, b) => b.date.localeCompare(a.date)).map(r => `<p>${escape(r.date)} · ${r.type === 'official' ? 'معتمد: ' + r.overall : 'تجريبي رسمي: ' + r.low + '–' + r.high} <button type="button" class="btn sm ghost" data-remove="${escape(r.id)}">حذف</button></p>`).join('') || 'لا نتائج مسجلة'}</div></details>
      <button type="button" class="btn sm ghost" id="p120-copy">نسخ ملخص تقدمي</button><p class="hl-tip">يحفظ مع بيانات المدرّب ويستخدم المزامنة الحالية عند تسجيل الدخول. يمكنك مشاركة الملخص للمراجعة.</p>`;
    const refresh = () => { api.save(); mount(api); };
    box.querySelector('#p120-baseline')?.addEventListener('click', () => { p.records.push({ id: 'baseline-20260907', date: '2026-09-07', type: 'official', overall: 85, reading: 75, writing: 80, speaking: 90, listening: 100 }); refresh(); });
    box.querySelector('#p120-minutes').onchange = e => { p.minutes = Number(e.target.value); refresh(); };
    const form = box.querySelector('form');
    form.elements.type.onchange = () => { const official = form.elements.type.value === 'official'; ['official', 'practice'].forEach(kind => { const group = box.querySelector('#p120-' + kind), active = (kind === 'official') === official; group.hidden = !active; group.querySelectorAll('input').forEach(i => { i.disabled = !active; i.required = active; }); }); };
    form.onsubmit = e => {
      e.preventDefault(); const f = new FormData(form), type = f.get('type'), date = f.get('date');
      const record = { id: Date.now().toString(36), type, date };
      (type === 'official' ? ['overall', ...Object.keys(skills)] : ['low', 'high']).forEach(k => record[k] = Number(f.get(k)));
      const error = box.querySelector('#p120-error');
      if (!date || date > day(Date.now()) || !Object.entries(record).filter(([k]) => !['id', 'type', 'date'].includes(k)).every(([, v]) => validScore(v)) || (type === 'practice' && record.low > record.high)) { error.textContent = 'أدخل درجات من 10 إلى 160 بمضاعفات 5 وتأكد من ترتيب النطاق والتاريخ.'; return; }
      p.records.push(record); refresh(); box.querySelector('#p120-records').open = true;
    };
    box.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { if (!confirm('تحذف هذه النتيجة من السجل؟')) return; p.records = p.records.filter(r => r.id !== b.dataset.remove); refresh(); });
    box.querySelector('#p120-copy').onclick = async () => { const text = report(state); try { await navigator.clipboard.writeText(text); api.toast('تم نسخ ملخصك'); } catch (_) { const ta = document.createElement('textarea'); ta.className = 'ta'; ta.value = text; box.appendChild(ta); ta.select(); api.toast('حدد الملخص وانسخه'); } };
  }
  root.DetPath120 = { skills, validScore, profile, stats, allocation, collectIssues, report, mount, escape };
})(typeof window !== 'undefined' ? window : globalThis);
