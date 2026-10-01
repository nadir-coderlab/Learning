// Dashboard: who needs me today, in priority order.
import { html } from '../../lib/h.js';
import { Icon, Pill, StatusPill, Avatar, Card, Empty } from '../../lib/ui.js';
import { TODAY, fmtDateLong, fmtTime, relDay } from '../../lib/util.js';
import { BY, STRIPE } from './common.js';

const TILES = [
  { id: 'all', label: 'المرضى النشطون', icon: 'users', tone: 'var(--accent)' },
  { id: 'green', label: 'على المسار', icon: 'check', tone: 'var(--ok)' },
  { id: 'yellow', label: 'يحتاج مراجعة', icon: 'alert', tone: 'var(--warn)' },
  { id: 'red', label: 'تنبيه سريري', icon: 'alert', tone: 'var(--alert)' },
  { id: 'idle', label: 'غير نشط', icon: 'clock', tone: 'var(--idle)' },
];

function ApptRow({ r, a, onOpen }) {
  const virtual = a.type === 'virtual';
  return html`<button type="button" class="list-row clickable" onClick=${() => onOpen(r.p.id, 'appointments')}>
    <span class=${`icon-tile ${virtual ? '' : 'gold'}`} aria-hidden="true"><${Icon} name=${virtual ? 'video' : 'user'} size=${18} /></span>
    <span class="stack-sm grow" style="gap:0">
      <span class="strong">${r.p.name}</span>
      <span class="small muted">${a.purpose}</span>
    </span>
    <span class="stack-sm" style="gap:2px;align-items:flex-end">
      <${Pill} tone=${virtual ? 'info' : 'plain'} icon=${virtual ? 'video' : 'user'}>${virtual ? 'افتراضي' : 'حضوري'}<//>
      <span class="small muted">${a.day === r.day ? '' : `${relDay(a.day - r.day)} · `}${fmtTime(a.hour)}</span>
    </span>
  </button>`;
}

export function Dashboard({ roster, onOpen, onFilter }) {
  const count = (id) => (id === 'all' ? roster.length : roster.filter((r) => r.st.code === id).length);
  const appts = roster.flatMap((r) => (r.p.appointments || []).map((a) => ({ r, a })));
  const today = appts.filter(({ r, a }) => a.day === r.day && a.status !== 'missed').sort((x, y) => x.a.hour - y.a.hour);
  const vToday = today.filter(({ a }) => a.type === 'virtual').length;
  const ipToday = today.length - vToday;
  const awaiting = roster.filter((r) => r.st.awaitingApproval);
  const upcoming = appts.filter(({ r, a }) => a.status === 'scheduled' && a.day > r.day && a.day - r.day <= 3)
    .sort((x, y) => (x.a.day - x.r.day) - (y.a.day - y.r.day) || x.a.hour - y.a.hour);
  const priority = roster.filter((r) => r.code !== 'green');

  return html`<div class="stack-lg">
    <div class="page-head">
      <div class="stack-sm" style="gap:2px">
        <span class="eyebrow">مسار الرباط الصليبي الأمامي · ${fmtDateLong(TODAY)}</span>
        <h1>لوحة الرباط الصليبي</h1>
      </div>
      <span class="small muted">مرحبًا ${BY}${count('red') ? ` — ${count('red')} ${count('red') === 1 ? 'تنبيه سريري ينتظر' : 'تنبيهات سريرية تنتظر'} مراجعتك` : ''}</span>
    </div>

    <div class="grid-auto dash-tiles" role="group" aria-label="ملخص حالات المرضى">
      ${TILES.map((t) => html`<button type="button" class="stat stat-button" id=${`tile-${t.id}`} key=${t.id}
          onClick=${() => onFilter(t.id)} aria-label=${`${t.label}: ${count(t.id)} — عرض القائمة`}>
        <span class="label"><span style=${`color:${t.tone};display:inline-flex`}><${Icon} name=${t.icon} size=${16} stroke=${2.2} /></span>${t.label}</span>
        <span class="value">${count(t.id)}</span>
        <span class="sub">${t.id === 'all' ? `${awaiting.length} بانتظار اعتماد المرحلة` : 'اضغط لعرض المرضى'}</span>
      </button>`)}
    </div>

    <div class="dash-split">
      <${Card} title="قائمة الأولوية" eyebrow="الأحمر أولًا، ثم الأصفر، ثم بانتظار الاعتماد، ثم غير النشط"
        actions=${html`<span class="tag num">${priority.length}</span>`}>
        ${priority.length ? html`<div class="priority-list">${priority.map((r) => {
          const reason = r.code === 'approval' ? `معايير المرحلة ${r.st.ready.to} مكتملة — بانتظار مراجعتك` : r.st.reasons[0];
          return html`<button type="button" class="priority-item" key=${r.p.id} onClick=${() => onOpen(r.p.id, 'overview')}>
            <span class="severity-stripe" style=${`background:${STRIPE[r.code]}`}></span>
            <span class="row" style="gap:10px;flex-wrap:nowrap;min-width:0">
              <${Avatar} name=${r.p.name} small />
              <span class="stack-sm" style="gap:0;min-width:0">
                <span class="strong">${r.p.name}</span>
                <span class="small muted clamp-2">${reason}</span>
              </span>
            </span>
            <span class="stack-sm" style="gap:4px;align-items:flex-end">
              <${StatusPill} code=${r.code} />
              ${r.code !== 'approval' && r.st.awaitingApproval ? html`<${StatusPill} code="approval" label="بانتظار الاعتماد" />` : null}
              <span class="small muted nowrap">المرحلة ${r.p.phase} · اليوم ${r.day}</span>
            </span>
          </button>`;
        })}</div>` : html`<${Empty} icon="check" title="لا أحد يحتاج تدخلًا الآن">كل المرضى على المسار.<//>`}
      <//>

      <${Card} title="اليوم" eyebrow=${fmtDateLong(TODAY)}>
        <div class="today-stats">
          <div class="today-stat"><span class="value">${vToday}</span><span class="label"><${Icon} name="video" size=${14} />افتراضي اليوم</span></div>
          <div class="today-stat"><span class="value">${ipToday}</span><span class="label"><${Icon} name="user" size=${14} />حضوري اليوم</span></div>
          <div class="today-stat"><span class="value">${awaiting.length}</span><span class="label"><${Icon} name="flag" size=${14} />بانتظار الاعتماد</span></div>
        </div>
        <div class="stack-sm" style="margin-top:12px">
          ${today.length
            ? html`<h4>مواعيد اليوم</h4><div class="list">${today.map(({ r, a }) => html`<${ApptRow} key=${a.id} r=${r} a=${a} onOpen=${onOpen} />`)}</div>`
            : html`<p class="small muted">لا مواعيد اليوم.${upcoming.length ? ' أقرب المواعيد خلال 3 أيام:' : ''}</p>`}
          ${!today.length && upcoming.length ? html`<div class="list">${upcoming.slice(0, 4).map(({ r, a }) => html`<${ApptRow} key=${a.id} r=${r} a=${a} onOpen=${onOpen} />`)}</div>` : null}
        </div>
        <hr class="divider" style="margin:12px 0" />
        <div class="stack-sm">
          <h4>بانتظار اعتماد المرحلة</h4>
          ${awaiting.length ? html`<div class="list">${awaiting.map((r) => html`<button type="button" class="list-row clickable" key=${r.p.id} onClick=${() => onOpen(r.p.id, 'overview', 'approval')}>
              <${Avatar} name=${r.p.name} small />
              <span class="stack-sm grow" style="gap:0"><span class="strong">${r.p.name}</span>
                <span class="small muted">المعايير ${r.st.ready.metCount}/${r.st.ready.results.length} للمرحلة ${r.st.ready.to} · المرحلة الحالية ${r.p.phase}</span></span>
              <${StatusPill} code="approval" label="مراجعة" />
            </button>`)}</div>`
            : html`<p class="small muted">لا أحد بانتظار الاعتماد.</p>`}
          <p class="small muted">المنصة تعرض المعايير فقط؛ الانتقال لا يتم إلا باعتمادك.</p>
        </div>
      <//>
    </div>
  </div>`;
}
