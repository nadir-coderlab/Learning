// Pathway & criteria, alert rules, questionnaires and the audit trail (patient names masked for management).
import { html, useEffect, useMemo, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Empty, toast } from '../../lib/ui.js';
import { computeAlerts } from '../../lib/engine.js';
import { EFFUSION_GRADES } from '../../lib/data.js';
import { dispatch } from '../../lib/store.js';
import { fmtDateTime } from '../../lib/util.js';
import { ADMIN, PageHead, Check, num } from './common.js';

const OP = { '>=': '≥', '<=': '≤', '==': '=' };
const UNIT = {
  flex: '°', extDeficit: '°', flexDiffOther: '°', flexPctOther: '%', quadLSI: '%', hamLSI: '%', hopLSI: '%', jumpLSI: '%',
  singleLegStance: 'ث', painAdl: '/10', monthsPostOp: 'شهر', aclRsi: 'نقطة', ikdc: 'نقطة',
};

/* ---------- pathway & criteria ---------- */
function TargetEditor({ gate, c }) {
  const [v, setV] = useState(String(c.target));
  useEffect(() => { setV(String(c.target)); }, [c.target]);
  const id = `gate-${gate}-${c.id}`;
  if (typeof c.target === 'boolean') {
    return html`<span class="small"><span class="muted">المطلوب: </span><strong>${c.target ? 'نعم' : 'لا'}</strong></span>`;
  }
  const n = num(v);
  const changed = Number.isFinite(n) && n !== c.target;
  const valid = Number.isFinite(n) && n >= 0 && n <= 1000;
  const save = () => {
    if (!valid) return;
    dispatch({ type: 'catalog/gate/target', gate, criterionId: c.id, target: n, by: ADMIN });
    toast(`حُفظ الحد الجديد لـ «${c.textAr}» — يُطبق على كل المرضى فورًا`);
  };
  return html`<div class="row target-editor" style="gap:6px;flex-wrap:nowrap">
    <label class="sr-only" for=${id}>الحد لمعيار ${c.textAr}</label>
    <span class="num muted" aria-hidden="true">${OP[c.op] || c.op}</span>
    ${c.metric === 'effusion'
      ? html`<select class="select" id=${id} style="width:auto" value=${v} onChange=${(e) => setV(e.currentTarget.value)}>
          ${EFFUSION_GRADES.map((g, i) => html`<option value=${String(i)}>${g}</option>`)}</select>`
      : html`<input class="input num" id=${id} type="number" step="any" style="width:90px" value=${v} onInput=${(e) => setV(e.currentTarget.value)} />`}
    ${c.metric !== 'effusion' && UNIT[c.metric] ? html`<span class="small muted">${UNIT[c.metric]}</span>` : null}
    <button type="button" class="btn btn-sm" id=${`${id}-save`} disabled=${!changed || !valid} onClick=${save}>حفظ</button>
  </div>`;
}

function GateTable({ gate, items }) {
  return html`<div class="criteria">${items.map((c) => html`<div class="criterion gate-row" key=${c.id}>
    <span class="crit-icon crit-unknown" aria-hidden="true"><${Icon} name="target" size=${14} /></span>
    <div class="stack-sm" style="gap:3px;min-width:0">
      <strong>${c.textAr}</strong>
      <span class="row small muted" style="gap:6px">
        <span><bdi>${c.metric}</bdi></span>
        ${c.src ? html`<span class="tag" title="مرجع الحد"><bdi>${c.src}</bdi></span>` : html`<span class="tag">بدون مرجع</span>`}
        ${c.example ? html`<${Pill} tone="gold" icon="flag">مثال — يعتمده الفريق<//>` : null}
      </span>
    </div>
    <${TargetEditor} gate=${gate} c=${c} />
  </div>`)}</div>`;
}

export function PathwayPage({ state }) {
  const cat = state.catalog;
  return html`<div class="stack-lg">
    <${PageHead} eyebrow="المسار بيانات لا كود: مسار جديد (مفصل الركبة، الكتف) = بيانات جديدة" title="المسار والمعايير" />
    <div class="note note-warn row" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><${Icon} name="alert" size=${16} />
      <span>تعديل الحدود يغيّر ما تعرضه المنصة لكل المرضى فورًا. الحدود المعلّمة «مثال» تحتاج اعتماد الفريق السريري قبل التشغيل. المنصة تعرض المعايير ولا تنقل أحدًا تلقائيًا.</span></div>
    ${cat.phases.map((ph) => html`<${Card} key=${ph.id} title=${`المرحلة ${ph.id}: ${ph.nameAr}`} eyebrow=${`${ph.nameEn} · ${ph.typical}`}>
      <div class="stack">
        <p class="small">${ph.goalAr}</p>
        <div class="row" style="gap:6px">${ph.goals.map((g) => html`<span class="tag" key=${g}>${g}</span>`)}</div>
        ${cat.gates[ph.id]?.length ? html`<div class="stack-sm"><h4>معايير الدخول لهذه المرحلة</h4><${GateTable} gate=${String(ph.id)} items=${cat.gates[ph.id]} /></div>`
          : html`<p class="small muted">بداية المسار — لا معايير دخول.</p>`}
      </div>
    <//>`)}
    <${Card} title="العودة للرياضة" eyebrow="Return to sport · معايير قبل اعتماد خطوات العودة">
      <${GateTable} gate="rts" items=${cat.gates.rts || []} />
    <//>
  </div>`;
}

/* ---------- alert rules ---------- */
function RuleRow({ rule, openNow }) {
  const [asking, setAsking] = useState(false);
  const id = `rule-${rule.id}`;
  const on = rule.enabled !== false;
  const apply = (enabled) => {
    dispatch({ type: 'catalog/rule/toggle', ruleId: rule.id, enabled, by: ADMIN });
    toast(`${enabled ? 'فُعّلت' : 'أُوقفت'} قاعدة «${rule.nameAr}»`);
    setAsking(false);
  };
  const onToggle = (v) => {
    if (!v && rule.level === 'red') { setAsking(true); return; }
    apply(v);
  };
  return html`<div class="list-row wrap rule-row">
    <span class=${`icon-tile ${rule.level === 'red' ? 'alert' : 'warn'}`} aria-hidden="true"><${Icon} name="alert" size=${18} /></span>
    <div class="stack-sm grow" style="gap:2px;min-width:220px">
      <strong>${rule.nameAr}</strong>
      <span class="small muted">السبب: ${rule.why}</span>
      <span class="small muted">مفتوحة الآن: ${openNow} لدى المرضى النشطين</span>
      ${asking ? html`<div class="note note-alert stack-sm" role="alert" style="margin-top:6px">
        <span>إيقاف قاعدة حمراء يعني أن المنصة لن تنبه الفريق عن هذا العرض لأي مريض. هل أنت متأكد؟</span>
        <div class="row" style="gap:6px"><button type="button" class="btn btn-sm btn-danger" id=${`${id}-confirm-off`} onClick=${() => apply(false)}>نعم، أوقف القاعدة</button>
          <button type="button" class="btn btn-sm btn-ghost" onClick=${() => setAsking(false)}>إلغاء</button></div></div>` : null}
    </div>
    <div class="row" style="gap:8px">
      ${on ? html`<${Pill} tone="ok" icon="check">مفعلة<//>` : html`<${Pill} tone="idle" icon="x">متوقفة<//>`}
      <${Check} id=${id} role="switch" checked=${on} onChange=${onToggle}>${on ? 'إيقاف' : 'تفعيل'}<span class="sr-only"> قاعدة ${rule.nameAr}</span><//>
    </div>
  </div>`;
}

export function RulesPage({ state }) {
  const cat = state.catalog;
  const open = useMemo(() => {
    const m = {};
    for (const p of state.patients) for (const a of computeAlerts(p, cat)) if (!a.acked) m[a.ruleId] = (m[a.ruleId] || 0) + 1;
    return m;
  }, [state]);
  const group = (level) => cat.rules.filter((r) => r.level === level);
  return html`<div class="stack-lg">
    <${PageHead} eyebrow="الحدود أمثلة يعتمدها القائد السريري قبل التشغيل" title="قواعد التنبيه" />
    <${Card} title="تنبيه سريري (أحمر)" eyebrow="أعراض قد تكون خطيرة — إيقافها يحتاج تأكيدًا">
      <div class="list">${group('red').map((r) => html`<${RuleRow} key=${r.id} rule=${r} openNow=${open[r.id] || 0} />`)}</div>
    <//>
    <${Card} title="يحتاج مراجعة (أصفر)" eyebrow="اتجاهات وانقطاع ومسار متأخر">
      <div class="list">${group('yellow').map((r) => html`<${RuleRow} key=${r.id} rule=${r} openNow=${open[r.id] || 0} />`)}</div>
    <//>
  </div>`;
}

/* ---------- questionnaires ---------- */
const LICENCE = {
  ikdc: { tone: 'warn', icon: 'shield', text: 'ترخيص AOSSM مطلوب للأنظمة الصحية' },
  aclrsi: { tone: 'info', icon: 'check', text: 'النسخة العربية القصيرة متحقق منها — يلزم إذن المؤلفين' },
  sane: { tone: 'ok', icon: 'check', text: 'سؤال واحد بدون ترخيص' },
  tsk: { tone: 'warn', icon: 'alert', text: 'نسخة عربية لآلام الظهر فقط' },
};

export function QuestionnairesPage({ state }) {
  return html`<div class="stack">
    <${PageHead} eyebrow="تُرسل للمريض تلقائيًا حسب الجدول وتظهر نتائجها للأخصائي" title="الاستبيانات" />
    <div class="table-wrap"><table class="table">
      <caption class="sr-only">الاستبيانات وجداولها وتراخيصها</caption>
      <thead><tr><th>الاستبيان</th><th class="num">الأسئلة</th><th>المدى</th><th>الجدول</th><th>الترخيص</th></tr></thead>
      <tbody>${state.catalog.questionnaires.map((q) => {
        const l = LICENCE[q.id];
        return html`<tr key=${q.id}>
          <td><div class="stack-sm" style="gap:0"><strong>${q.nameAr}</strong><span class="small muted"><bdi>${q.nameEn}</bdi> · ${q.higherBetter ? 'الأعلى أفضل' : 'الأقل أفضل'}</span></div></td>
          <td class="num">${q.items}</td><td class="num"><bdi>${q.range}</bdi></td>
          <td><div class="row" style="gap:4px">${q.schedule.map((s) => html`<span class="tag" key=${s}>${s}</span>`)}</div></td>
          <td>${l ? html`<span class="row" style="gap:6px;flex-wrap:nowrap;align-items:flex-start"><${Pill} tone=${l.tone} icon=${l.icon}>${l.tone === 'ok' ? 'متاح' : l.tone === 'info' ? 'بإذن' : 'تنبيه'}<//><span class="small">${l.text}</span></span>` : '—'}</td>
        </tr>`;
      })}</tbody></table></div>
    <p class="small muted">التحقق من الترجمة والترخيص مسؤولية الفريق قبل الاستخدام السريري.</p>
  </div>`;
}

/* ---------- audit (names masked) ---------- */
export function AdminAuditPage({ state }) {
  const [q, setQ] = useState('');
  const names = state.patients.map((p, i) => [p.name, `مريض #${i + 1}`]);
  const mask = (t) => names.reduce((s, [n, alias]) => (s.includes(n) ? s.split(n).join(alias) : s), String(t));
  const rows = state.audit.map((a) => ({ ...a, target: mask(a.target) }))
    .filter((a) => !q.trim() || `${a.by} ${a.action} ${a.target}`.includes(q.trim()));
  return html`<div class="stack">
    <${PageHead} eyebrow="أسماء المرضى مخفية في عرض الإدارة" title="سجل التغييرات"><span class="small muted">${rows.length} إجراء</span><//>
    <div class="toolbar">
      <label class="sr-only" for="adm-audit-search">بحث في السجل</label>
      <div class="search-box"><${Icon} name="search" size=${16} />
        <input class="input" id="adm-audit-search" type="search" placeholder="ابحث بإجراء أو مستخدم" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} autocomplete="off" /></div>
    </div>
    ${rows.length ? html`<div class="table-wrap"><table class="table">
      <caption class="sr-only">سجل التغييرات</caption>
      <thead><tr><th>الوقت</th><th>بواسطة</th><th>الإجراء</th><th>الهدف</th><th>من</th><th>إلى</th></tr></thead>
      <tbody>${rows.map((a, i) => html`<tr key=${`${a.ts}-${i}`}><td class="nowrap">${fmtDateTime(a.ts)}</td><td class="nowrap">${a.by}</td><td>${a.action}</td><td>${a.target}</td><td>${a.from}</td><td>${a.to}</td></tr>`)}</tbody>
    </table></div>` : html`<div class="card"><${Empty} icon="file" title="لا نتائج" /></div>`}
  </div>`;
}
