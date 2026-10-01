// Shared pieces for the clinician workspace: roster maths, criteria rows, small form controls.
import { html } from '../../lib/h.js';
import { Icon, Pill } from '../../lib/ui.js';
import { statusOf, adherence, postOpDay, phaseOf, getEx, corridorAt } from '../../lib/engine.js';
import { DEMO_CLINICIAN } from '../../lib/store.js';
import { last, round } from '../../lib/util.js';

export const BY = DEMO_CLINICIAN;
export const SEX_AR = { M: 'ذكر', F: 'أنثى' };
export const LEVEL_AR = { Recreational: 'ترفيهي', Competitive: 'تنافسي', Professional: 'محترف' };
export const SOURCE_AR = { clinic: 'قياس حضوري', camera: 'كاميرا المريض', photo: 'صورة المريض', phone: 'الجوال كمنقلة' };
export const SPORT_KEY = { 'كرة القدم': 'football' };

// Profile tabs, in the order of the spec. Ids double as cross-role navigation targets.
export const TABS = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'clinical', label: 'السريري' },
  { id: 'program', label: 'البرنامج' },
  { id: 'outcomes', label: 'النتائج' },
  { id: 'strength', label: 'القوة' },
  { id: 'functional', label: 'الاختبارات الوظيفية' },
  { id: 'activity', label: 'النشاط' },
  { id: 'appointments', label: 'المواعيد' },
  { id: 'alerts', label: 'التنبيهات' },
  { id: 'messages', label: 'الرسائل' },
  { id: 'record', label: 'السجل' },
];
const TAB_ALIAS = { alert: 'alerts', redflag: 'alerts', message: 'messages', chat: 'messages', checkin: 'overview', checkins: 'overview', appointment: 'appointments', program: 'program', exercises: 'program' };
export function normalizeTab(t) {
  if (!t) return 'overview';
  if (TABS.some((x) => x.id === t)) return t;
  return TAB_ALIAS[t] || 'overview';
}

const LOCALE = 'ar-SA-u-nu-latn-ca-gregory';
let fullFmt = null;
export function fmtFull(d) {
  if (!fullFmt) {
    const opts = { day: 'numeric', month: 'long', year: 'numeric' };
    try { fullFmt = new Intl.DateTimeFormat(LOCALE, opts); } catch { fullFmt = new Intl.DateTimeFormat('ar', opts); }
  }
  return fullFmt.format(d);
}

/* ---------- priority & roster ---------- */
export const RANK = { red: 0, yellow: 1, approval: 2, idle: 3, green: 4 };
export const STRIPE = { red: 'var(--alert)', yellow: 'var(--warn-mark)', approval: 'var(--info)', idle: 'var(--idle)', green: 'var(--ok)' };
export const STATUS_FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'red', label: 'تنبيه سريري' },
  { id: 'yellow', label: 'يحتاج مراجعة' },
  { id: 'approval', label: 'بانتظار الاعتماد' },
  { id: 'idle', label: 'غير نشط' },
  { id: 'green', label: 'على المسار' },
];

export function priorityCode(st) { return st.code === 'green' && st.awaitingApproval ? 'approval' : st.code; }

export function buildRoster(state) {
  const cat = state.catalog;
  return state.patients.map((p) => {
    const st = statusOf(p, cat);
    const day = postOpDay(p);
    const lastC = last(p.checkins || []);
    return {
      p, st, day, lastC,
      code: priorityCode(st),
      adh: adherence(p, 7, cat),
      nextAp: (p.appointments || []).find((a) => a.status === 'scheduled' && a.day >= day),
      pains: (p.checkins || []).slice(-14).map((c) => c.pain),
    };
  }).sort((a, b) => RANK[a.code] - RANK[b.code] || a.day - b.day);
}

export function matchesStatus(r, f) {
  if (f === 'all') return true;
  if (f === 'approval') return r.st.awaitingApproval;
  return r.st.code === f;
}

export function phaseName(id, cat) { return phaseOf(id, cat)?.nameAr || ''; }
export function exName(id, cat) { return getEx(id, cat)?.nameAr || id; }

/* ---------- dose text ---------- */
export function holdText(s) { return s >= 60 ? `${round(s / 60, 1)} د` : `${s} ث`; }
export function doseLabel(it) {
  if (!it) return '—';
  if (Number(it.sets) === 1 && Number(it.reps) === 1 && it.hold >= 60) return holdText(it.hold);
  return `${it.sets}×${it.reps}${it.hold ? ` · ثبات ${holdText(it.hold)}` : ''}`;
}

/* ---------- chart helpers ---------- */
// Clip a corridor to [.., maxX] and close it with an interpolated edge point.
export function bandTo(series, maxX) {
  if (!series?.length) return [];
  const pts = series.filter((q) => q.x <= maxX).map((q) => ({ ...q }));
  const end = corridorAt(series, maxX);
  if (end && (!pts.length || last(pts).x < maxX)) pts.push({ x: maxX, lo: round(end.lo), hi: round(end.hi) });
  return pts;
}

/* ---------- criteria ---------- */
const CRIT = {
  met: { cls: 'crit-met', icon: 'check', label: 'محقق' },
  unmet: { cls: 'crit-unmet', icon: 'x', label: 'غير محقق' },
  unknown: { cls: 'crit-unknown', icon: 'minus', label: 'لا يوجد قياس' },
};
export function CritIcon({ state }) {
  const s = CRIT[state] || CRIT.unknown;
  return html`<span class=${`crit-icon ${s.cls}`} title=${s.label}><${Icon} name=${s.icon} size=${15} stroke=${2.4} /><span class="sr-only">${s.label}</span></span>`;
}

// The engine leaves a few sources blank; fill them from the patient record so every row says where its value came from.
function sourceText(r, p) {
  if (r.src) return r.src;
  const m = r.c.metric;
  if (m === 'jumpLSI' && last(p.jumps || [])) return `CMJ · اليوم ${last(p.jumps).day}`;
  if (m === 'monthsPostOp') return 'من تاريخ العملية';
  if (m === 'sportDrills') return 'تقرير الأخصائي';
  if (m === 'noRedAlerts') return 'تنبيهات المنصة';
  return '';
}

export function CriteriaList({ results, p }) {
  if (!results.length) return html`<p class="small muted">لا معايير معرفة لهذه الخطوة.</p>`;
  return html`<div class="criteria">${results.map((r) => html`<div class="criterion" key=${r.c.id}>
    <${CritIcon} state=${r.state} />
    <div class="stack-sm" style="gap:3px;min-width:0">
      <span class="strong">${r.c.textAr}</span>
      <span class="row small muted" style="gap:6px">
        <span>${sourceText(r, p) || 'المصدر: —'}</span>
        ${r.c.src ? html`<span class="tag" title="مرجع الحد"><bdi>${r.c.src}</bdi></span>` : null}
        ${r.c.example ? html`<${Pill} tone="gold" icon="flag">مثال — يعتمده الفريق<//>` : null}
      </span>
      ${r.homeOnly ? html`<span class="small row" style="gap:5px;color:var(--warn)"><${Icon} name="info" size=${14} />قياس منزلي — يُستحسن تأكيده حضوريًا</span>` : null}
    </div>
    <span class="small strong" style="text-align:end">${r.valueText}<span class="sr-only"> — ${(CRIT[r.state] || CRIT.unknown).label}</span></span>
  </div>`)}</div>`;
}

export function CriteriaSummary({ results }) {
  const met = results.filter((r) => r.state === 'met').length;
  const unmet = results.filter((r) => r.state === 'unmet').length;
  const unknown = results.length - met - unmet;
  return html`<div class="row small" style="gap:6px">
    <${Pill} tone="ok" icon="check">${met} محقق<//>
    ${unmet ? html`<${Pill} tone="alert" icon="x">${unmet} غير محقق<//>` : null}
    ${unknown ? html`<${Pill} tone="idle" icon="minus">${unknown} بلا قياس<//>` : null}
  </div>`;
}

// Exact wording required by the spec; shown only when every criterion is met. Never clears anything by itself.
export function CriteriaDone() {
  return html`<div class="note note-info row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start" role="status">
    <${Icon} name="info" size=${18} />
    <div class="stack-sm" style="gap:2px">
      <strong><bdi lang="en" dir="ltr">Criteria appear completed – Clinical review required</bdi></strong>
      <span>تبدو المعايير مكتملة – يلزم مراجعة سريرية قبل أي اعتماد</span>
    </div>
  </div>`;
}

/* ---------- form controls (every control carries a stable id) ---------- */
export function Choice({ id, label, value, options, onChange }) {
  return html`<div class="seg" role="group" id=${id} aria-label=${label}>
    ${options.map((o) => html`<button type="button" id=${`${id}-${o.id}`} aria-pressed=${String(value === o.id)} onClick=${() => onChange(o.id)}>${o.label}</button>`)}
  </div>`;
}

export function Check({ id, checked, onChange, children, disabled }) {
  return html`<label class="check-row" for=${id}>
    <input type="checkbox" id=${id} checked=${checked} disabled=${disabled} onChange=${(e) => onChange(e.currentTarget.checked)} />
    <span>${children}</span></label>`;
}

export function FieldError({ text }) {
  return text ? html`<p class="field-error" role="alert"><${Icon} name="alert" size=${14} /> ${text}</p>` : null;
}

export function num(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  return Number(String(v).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
