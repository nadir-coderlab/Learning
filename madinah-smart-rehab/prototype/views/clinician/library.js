// Exercise library (read-only for clinicians) and the full audit trail.
import { html, useState } from '../../lib/h.js';
import { Icon, Empty, Figure } from '../../lib/ui.js';
import { getEx } from '../../lib/engine.js';
import { CATEGORIES } from '../../lib/data.js';
import { fmtDateTime } from '../../lib/util.js';
import { doseLabel } from './common.js';

function ExerciseCard({ ex, cat }) {
  const [play, setPlay] = useState(false);
  const prog = ex.prog ? getEx(ex.prog, cat)?.nameAr : null;
  const reg = ex.reg ? getEx(ex.reg, cat)?.nameAr : null;
  return html`<article class="card exercise-card" aria-labelledby=${`lib-${ex.id}-name`}>
    <div class="exercise-media">
      <${Figure} motion=${ex.motion} playing=${play} />
      <button type="button" class="icon-btn media-play" id=${`lib-${ex.id}-play`} aria-pressed=${String(play)} aria-label=${play ? `إيقاف عرض ${ex.nameAr}` : `تشغيل عرض ${ex.nameAr}`} onClick=${() => setPlay(!play)}>
        ${play ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>`
          : html`<${Icon} name="play" size=${16} />`}</button>
    </div>
    <div class="stack-sm" style="gap:0">
      <h3 id=${`lib-${ex.id}-name`}>${ex.nameAr}</h3>
      <span class="small muted"><bdi>${ex.nameEn}</bdi></span>
    </div>
    <div class="row" style="gap:6px">
      <span class="tag">${CATEGORIES[ex.cat] || ex.cat}</span>
      <span class="tag">المراحل ${ex.phases.join('، ')}</span>
      ${ex.level ? html`<span class="tag">قفز مستوى ${ex.level}</span>` : null}
      ${ex.load ? html`<span class="tag">بحمل</span>` : null}
      ${ex.camera ? html`<span class="tag">قابل للتحقق بالكاميرا</span>` : null}
    </div>
    <div class="dose"><span>${doseLabel(ex)}</span><span>${ex.freq}</span></div>
    ${ex.precautions && ex.precautions !== '—' ? html`<p class="small row" style="gap:6px;align-items:flex-start;flex-wrap:nowrap"><span style="color:var(--warn);display:inline-flex"><${Icon} name="alert" size=${14} /></span><span>${ex.precautions}</span></p>` : null}
    <div class="small stack-sm" style="gap:2px">
      <span><span class="muted">التدرج للأصعب: </span>${prog || '—'}</span>
      <span><span class="muted">البديل الأسهل: </span>${reg || '—'}</span>
    </div>
  </article>`;
}

export function LibraryPage({ cat }) {
  const [q, setQ] = useState('');
  const [c, setC] = useState('all');
  const [ph, setPh] = useState('all');
  const ql = q.trim().toLowerCase();
  const cats = Object.keys(CATEGORIES).filter((k) => cat.exercises.some((ex) => ex.cat === k));
  const list = cat.exercises.filter((ex) => (c === 'all' || ex.cat === c) && (ph === 'all' || ex.phases.includes(Number(ph)))
    && (!ql || ex.nameAr.includes(q.trim()) || ex.nameEn.toLowerCase().includes(ql)));
  return html`<div class="stack">
    <div class="page-head">
      <div class="stack-sm" style="gap:2px"><span class="eyebrow">يديرها فريق المحتوى من واجهة الإدارة</span><h1>مكتبة التمارين</h1></div>
      <span class="small muted">${list.length} من ${cat.exercises.length} تمرينًا</span>
    </div>
    <div class="toolbar">
      <label class="sr-only" for="lib-search">بحث في المكتبة</label>
      <div class="search-box"><${Icon} name="search" size=${16} />
        <input class="input" id="lib-search" type="search" placeholder="ابحث بالعربي أو الإنجليزي" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} autocomplete="off" /></div>
      <label class="sr-only" for="lib-phase">المرحلة</label>
      <select class="select" id="lib-phase" style="width:auto" value=${ph} onChange=${(e) => setPh(e.currentTarget.value)}>
        <option value="all">كل المراحل</option>
        ${cat.phases.map((x) => html`<option value=${String(x.id)}>المرحلة ${x.id} — ${x.nameAr}</option>`)}
      </select>
    </div>
    <div class="row" role="group" aria-label="الفئة" style="gap:6px">
      <button type="button" class="chip" id="lib-cat-all" aria-pressed=${String(c === 'all')} onClick=${() => setC('all')}>الكل</button>
      ${cats.map((k) => html`<button type="button" class="chip" key=${k} id=${`lib-cat-${k}`} aria-pressed=${String(c === k)} onClick=${() => setC(k)}>${CATEGORIES[k]}</button>`)}
    </div>
    ${list.length ? html`<div class="grid-auto lib-grid">${list.map((ex) => html`<${ExerciseCard} key=${ex.id} ex=${ex} cat=${cat} />`)}</div>`
      : html`<div class="card"><${Empty} icon="search" title="لا تمارين مطابقة" /></div>`}
  </div>`;
}

export function AuditPage({ audit }) {
  const [q, setQ] = useState('');
  const rows = audit.filter((a) => !q.trim() || `${a.by} ${a.action} ${a.target} ${a.from} ${a.to}`.includes(q.trim()));
  return html`<div class="stack">
    <div class="page-head">
      <div class="stack-sm" style="gap:2px"><span class="eyebrow">كل إجراء يُسجل بالاسم والوقت والقيمة قبل وبعد</span><h1>سجل التغييرات</h1></div>
      <span class="small muted">${rows.length} إجراء</span>
    </div>
    <div class="toolbar">
      <label class="sr-only" for="audit-search">بحث في السجل</label>
      <div class="search-box"><${Icon} name="search" size=${16} />
        <input class="input" id="audit-search" type="search" placeholder="ابحث باسم مريض أو إجراء أو مستخدم" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} autocomplete="off" /></div>
    </div>
    ${rows.length ? html`<div class="table-wrap"><table class="table">
      <caption class="sr-only">سجل التغييرات</caption>
      <thead><tr><th>الوقت</th><th>بواسطة</th><th>الإجراء</th><th>الهدف</th><th>من</th><th>إلى</th></tr></thead>
      <tbody>${rows.map((a, i) => html`<tr key=${`${a.ts}-${i}`}>
        <td class="nowrap">${fmtDateTime(a.ts)}</td><td class="nowrap">${a.by}</td><td>${a.action}</td><td>${a.target}</td>
        <td>${a.from}</td><td>${a.to}</td></tr>`)}</tbody></table></div>`
      : html`<div class="card"><${Empty} icon="file" title="لا نتائج" /></div>`}
  </div>`;
}
