// Patient list: search, status chips, phase filter, one row per patient.
import { html } from '../../lib/h.js';
import { Icon, Pill, StatusPill, Avatar, Empty } from '../../lib/ui.js';
import { Sparkline } from '../../lib/charts.js';
import { relDay } from '../../lib/util.js';
import { STATUS_FILTERS, matchesStatus, phaseName } from './common.js';

export function PatientList({ roster, list, setList, onOpen, cat }) {
  const q = list.q.trim().toLowerCase();
  const rows = roster.filter((r) => matchesStatus(r, list.status)
    && (list.phase === 'all' || r.p.phase === Number(list.phase))
    && (!q || r.p.name.toLowerCase().includes(q) || String(r.p.mrn).toLowerCase().includes(q)));
  const count = (id) => roster.filter((r) => matchesStatus(r, id)).length;

  return html`<div class="stack">
    <div class="page-head">
      <div class="stack-sm" style="gap:2px"><span class="eyebrow">مسار الرباط الصليبي الأمامي</span><h1>المرضى</h1></div>
      <span class="small muted">${rows.length} من ${roster.length} مريضًا</span>
    </div>
    <div class="toolbar">
      <label class="sr-only" for="pt-search">بحث بالاسم أو رقم الملف</label>
      <div class="search-box">
        <${Icon} name="search" size=${16} />
        <input class="input" id="pt-search" type="search" placeholder="ابحث بالاسم أو رقم الملف" value=${list.q}
          onInput=${(e) => setList({ ...list, q: e.currentTarget.value })} autocomplete="off" />
      </div>
      <label class="sr-only" for="pt-phase">تصفية حسب المرحلة</label>
      <select class="select" id="pt-phase" style="width:auto" value=${list.phase} onChange=${(e) => setList({ ...list, phase: e.currentTarget.value })}>
        <option value="all">كل المراحل</option>
        ${cat.phases.map((ph) => html`<option value=${String(ph.id)}>المرحلة ${ph.id} — ${ph.nameAr}</option>`)}
      </select>
    </div>
    <div class="row" role="group" aria-label="تصفية حسب الحالة" style="gap:6px">
      ${STATUS_FILTERS.map((f) => html`<button type="button" class="chip" id=${`pt-status-${f.id}`} key=${f.id} aria-pressed=${String(list.status === f.id)}
        onClick=${() => setList({ ...list, status: f.id })}>${f.label} <span class="num muted">${count(f.id)}</span></button>`)}
    </div>

    ${rows.length ? html`<div class="table-wrap">
      <table class="table patient-table">
        <caption class="sr-only">قائمة المرضى</caption>
        <thead><tr>
          <th>المريض</th><th class="num">اليوم</th><th>المرحلة</th><th>الحالة</th><th class="num">الالتزام 7 أيام</th>
          <th>الألم (آخر 14 تسجيلًا)</th><th>آخر تسجيل</th><th>الموعد القادم</th>
        </tr></thead>
        <tbody>${rows.map((r) => {
          const since = r.lastC ? r.day - r.lastC.day : null;
          const late = since === null || since >= 3;
          return html`<tr class="clickable" key=${r.p.id} onClick=${() => onOpen(r.p.id)}>
            <td><div class="row" style="gap:8px;flex-wrap:nowrap">
              <${Avatar} name=${r.p.name} small />
              <div class="stack-sm" style="gap:0">
                <button type="button" class="link-btn" onClick=${(e) => { e.stopPropagation(); onOpen(r.p.id); }}>${r.p.name}</button>
                <span class="small muted"><bdi>${r.p.mrn}</bdi></span>
              </div></div></td>
            <td class="num">${r.day}</td>
            <td><span title=${phaseName(r.p.phase, cat)}>المرحلة ${r.p.phase}</span></td>
            <td><div class="stack-sm" style="gap:4px;align-items:flex-start">
              <${StatusPill} code=${r.st.code} />
              ${r.st.awaitingApproval ? html`<${StatusPill} code="approval" label="بانتظار الاعتماد" />` : null}
            </div></td>
            <td class="num">${r.adh.pct === null ? '—' : html`<span class=${r.adh.pct < 50 ? 'strong' : ''} style=${r.adh.pct < 50 ? 'color:var(--warn)' : ''}>${r.adh.pct}%</span>`}</td>
            <td><${Sparkline} values=${r.pains} width=${96} height=${26} label=${`الألم في آخر التسجيلات: ${r.pains.join('، ')}`} /></td>
            <td>${r.lastC ? html`<span class="row nowrap" style=${`gap:4px;${late ? 'color:var(--warn);font-weight:600' : ''}`}>
              ${late ? html`<${Icon} name="clock" size=${14} />` : null}${relDay(-since)}</span>` : html`<span class="muted">لا يوجد</span>`}</td>
            <td>${r.nextAp ? html`<div class="stack-sm" style="gap:2px;align-items:flex-start">
              <span class="nowrap">${relDay(r.nextAp.day - r.day)}</span>
              <${Pill} tone=${r.nextAp.type === 'virtual' ? 'info' : 'plain'} icon=${r.nextAp.type === 'virtual' ? 'video' : 'user'}>${r.nextAp.type === 'virtual' ? 'افتراضي' : 'حضوري'}<//>
            </div>` : html`<span class="muted">—</span>`}</td>
          </tr>`;
        })}</tbody>
      </table></div>`
      : html`<div class="card"><${Empty} icon="search" title="لا نتائج">غيّر البحث أو المرشحات.
          <div style="margin-top:8px"><button type="button" class="btn btn-sm" id="pt-clear" onClick=${() => setList({ q: '', status: 'all', phase: 'all' })}>مسح المرشحات</button></div><//></div>`}
  </div>`;
}
