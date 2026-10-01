// Overview tab: why this status, the key numbers, and the recovery curves against the reference corridor.
import { html, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Empty, Seg } from '../../lib/ui.js';
import { LineChart, BarChart } from '../../lib/charts.js';
import { latest, statusOf, adherence, adherenceByDay, projectFlex, riskOfDropout, postOpDay } from '../../lib/engine.js';
import { round, mean } from '../../lib/util.js';
import { SOURCE_AR, bandTo } from './common.js';

const RISK = {
  high: { tone: 'alert', icon: 'alert', label: 'مرتفع' },
  medium: { tone: 'warn', icon: 'alert', label: 'متوسط' },
  low: { tone: 'ok', icon: 'check', label: 'منخفض' },
};

function romSeries(p, key) {
  const pts = (p.rom || []).filter((r) => Number.isFinite(r[key]));
  return [
    { label: 'قياس حضوري', color: 'var(--series-1)', dots: 'all', points: pts.filter((r) => r.source === 'clinic').map((r) => ({ x: r.day, y: r[key] })) },
    { label: 'قياس منزلي', color: 'var(--series-2)', dots: 'all', points: pts.filter((r) => r.source !== 'clinic').map((r) => ({ x: r.day, y: r[key] })) },
  ].filter((s) => s.points.length);
}

function sourceCounts(p) {
  const c = {};
  for (const r of p.rom || []) c[r.source] = (c[r.source] || 0) + 1;
  return Object.entries(c).map(([k, n]) => `${SOURCE_AR[k] || k}: ${n}`).join(' · ');
}

export function OverviewTab({ p, cat, onTab }) {
  const day = postOpDay(p);
  const L = latest(p);
  const st = statusOf(p, cat);
  const adh = adherence(p, 7, cat);
  const risk = riskOfDropout(p, cat);
  const proj = projectFlex(p, 120);
  const [painRange, setPainRange] = useState(day > 60 ? '60' : 'all');
  const openAlerts = st.alerts.length;

  const flexSeries = romSeries(p, 'flex');
  const lastRomDay = Math.max(0, ...(p.rom || []).map((r) => r.day));
  const projEnd = proj?.line ? proj.line[1].x : 0;
  const maxX = Math.max(14, day, projEnd, lastRomDay);
  if (proj?.line) flexSeries.push({ label: 'التقدير الإحصائي', color: 'var(--ink-3)', dashed: true, points: proj.line.map((q) => ({ x: q.x, y: round(q.y) })) });
  const flexVals = flexSeries.flatMap((s) => s.points.map((q) => q.y));
  const flexMin = Math.max(0, Math.floor((Math.min(60, ...flexVals) - 10) / 10) * 10);

  const extSeries = romSeries(p, 'ext');
  const extMax = Math.max(8, ...extSeries.flatMap((s) => s.points.map((q) => q.y + 1)));

  const pains = (p.checkins || []).filter((c) => painRange === 'all' || day - c.day < Number(painRange)).map((c) => ({ x: c.day, y: c.pain }));
  const adhDays = adherenceByDay(p, 14, cat);
  const adh14 = adhDays.length ? round(mean(adhDays.map((d) => d.pct))) : null;
  const r = RISK[risk.level];
  const ready = st.ready;

  return html`<div class="stack-lg">
    <div class="grid-2">
      <${Card} title="لماذا هذه الحالة؟" actions=${openAlerts ? html`<button type="button" class="btn btn-sm" id="ov-open-alerts" onClick=${() => onTab('alerts')}><${Icon} name="bell" size=${15} />التنبيهات المفتوحة (${openAlerts})</button>` : null}>
        <ul class="reasons">${st.reasons.map((t, i) => html`<li key=${i}><${Icon} name=${st.code === 'green' ? 'check' : 'alert'} size=${16} /><span>${t}</span></li>`)}</ul>
        <hr class="divider" style="margin:12px 0" />
        <div class="row-between small">
          <span>معايير ${ready.to === 'rts' ? 'العودة للرياضة' : `المرحلة ${ready.to}`}</span>
          <span class="num strong">${ready.metCount} من ${ready.results.length}</span>
        </div>
        <div class="meter meter-thin" style="margin-top:6px" role="img" aria-label=${`${ready.metCount} من ${ready.results.length} معايير محققة`}>
          <span style=${`width:${ready.results.length ? (ready.metCount / ready.results.length) * 100 : 0}%`}></span></div>
      <//>
      <${Card} title="خطر الانقطاع عن البرنامج" actions=${html`<${Pill} tone=${r.tone} icon=${r.icon}>${r.label}<//>`}>
        ${risk.why.length ? html`<ul class="reasons">${risk.why.map((w, i) => html`<li key=${i}><${Icon} name="info" size=${16} /><span>${w}</span></li>`)}</ul>`
          : html`<p class="small">لا مؤشرات انقطاع حاليًا: الالتزام والتسجيل منتظمان.</p>`}
        <p class="small muted" style="margin-top:10px">مؤشر تقريبي قابل للتفسير (التزام، انقطاع التسجيل، الثقة) — ليس نموذجًا مدرّبًا ولا قرارًا.</p>
      <//>
    </div>

    <div class="grid-auto key-stats">
      <div class="stat"><span class="label"><${Icon} name="knee" size=${15} />الثني</span>
        <span class="value">${Number.isFinite(L.flex) ? `${L.flex}°` : '—'}</span>
        <span class="sub">${L.flexRec ? `${SOURCE_AR[L.flexRec.source] || ''} · اليوم ${L.flexRec.day}` : 'لا قياس'}${p.contralateral?.flex ? ` · السليمة ${p.contralateral.flex}°` : ''}</span></div>
      <div class="stat"><span class="label"><${Icon} name="minus" size=${15} />نقص الفرد</span>
        <span class="value">${Number.isFinite(L.extDeficit) ? `${L.extDeficit}°` : '—'}</span>
        <span class="sub">${L.extRec ? `${L.extDeficit === 0 ? 'فرد كامل' : 'ينقص عن الكامل'} · ${SOURCE_AR[L.extRec.source] || ''} · اليوم ${L.extRec.day}` : 'لا قياس'}</span></div>
      <div class="stat"><span class="label"><${Icon} name="list" size=${15} />الالتزام 7 أيام</span>
        <span class="value">${adh.pct === null ? '—' : `${adh.pct}%`}</span>
        <span class="sub">${adh.done}/${adh.planned} تمرين مستحق</span></div>
      <div class="stat"><span class="label"><${Icon} name="activity" size=${15} />الألم (متوسط 7 أيام)</span>
        <span class="value">${Number.isFinite(L.painAdl) ? `${round(L.painAdl, 1)}/10` : '—'}</span>
        <span class="sub">من التسجيل اليومي للمريض</span></div>
      ${Number.isFinite(L.quadLSI) ? html`<div class="stat"><span class="label"><${Icon} name="dumbbell" size=${15} />LSI الرباعية</span>
        <span class="value">${round(L.quadLSI)}%</span>
        <span class="sub"><bdi>${L.strength.method}</bdi> · اليوم ${L.strength.day}</span></div>` : null}
    </div>

    <${Card} title="الثني عبر الوقت مقابل المسار المرجعي" eyebrow="درجات · اليوم بعد العملية">
      ${flexSeries.length ? html`<${LineChart} label="ثني الركبة عبر الأيام" unit="°" series=${flexSeries}
          band=${{ label: 'المسار المرجعي', points: bandTo(cat.corridor.flex, maxX) }}
          xDomain=${[0, maxX]} yDomain=${[flexMin, 150]} height=${230} />
        <div class="stack-sm small" style="margin-top:6px">
          ${proj?.line ? html`<p class="row" style="gap:6px"><${Icon} name="target" size=${15} />
            ${proj.days > 0 ? `التقدير: يصل لـ120° خلال ~${proj.days} يومًا — تقدير إحصائي وليس قرارًا` : 'التقدير: يُرجح أنه بلغ 120° تقريبًا — يحتاج قياسًا جديدًا للتأكد. تقدير إحصائي وليس قرارًا'}
            <span class="muted">(${proj.slopePerWeek}° أسبوعيًا)</span></p>` : null}
          ${proj?.stalled ? html`<p class="row" style="gap:6px;color:var(--warn)"><${Icon} name="alert" size=${15} />تحسن الثني شبه متوقف في آخر 3 أسابيع — راجع البرنامج.</p>` : null}
          ${p.meniscusRepair ? html`<p class="muted">المسار المرجعي لا يراعي قيود المدى بعد إصلاح الغضروف الهلالي (${p.romRestriction}).</p>` : null}
          <p class="muted">مصادر القياس: ${sourceCounts(p) || '—'} · ${cat.corridor.source}</p>
        </div>`
        : html`<${Empty} icon="knee" title="لا قياسات للمدى بعد" />`}
    <//>

    <div class="grid-2">
      <${Card} title="نقص الفرد" eyebrow="0° = فرد كامل؛ الأقل أفضل">
        ${extSeries.length ? html`<${LineChart} label="نقص فرد الركبة عبر الأيام" unit="°" series=${extSeries}
            band=${{ label: 'المسار المرجعي', points: bandTo(cat.corridor.ext, maxX) }}
            xDomain=${[0, maxX]} yDomain=${[0, extMax]} height=${200} />` : html`<${Empty} icon="knee" title="لا قياسات" />`}
      <//>
      <${Card} title="الألم اليومي" eyebrow="مقياس 0–10 من تسجيل المريض"
        actions=${day > 60 ? html`<${Seg} label="مدة عرض الألم" value=${painRange} onChange=${setPainRange}
          options=${[{ id: '60', label: '60 يومًا' }, { id: 'all', label: 'كل الفترة' }]} />` : null}>
        ${pains.length > 1 ? html`<${LineChart} label="الألم اليومي" unit="/10" series=${[{ label: 'الألم', color: 'var(--series-1)', points: pains }]}
            yDomain=${[0, 10]} xDomain=${[Math.min(...pains.map((q) => q.x)), Math.max(day, ...pains.map((q) => q.x))]} height=${200} />`
          : html`<${Empty} icon="activity" title="تسجيلات قليلة" />`}
      <//>
    </div>

    <${Card} title="الالتزام اليومي بالتمارين" eyebrow=${`آخر 14 يومًا${adh14 !== null ? ` · المتوسط ${adh14}%` : ''}`}>
      ${adhDays.length ? html`<${BarChart} label="نسبة التمارين المنجزة يوميًا" max=${100} valueFormat=${(v) => `${v}%`} xTitle="اليوم بعد العملية"
        data=${adhDays.map((d) => ({ label: String(d.day), value: d.pct, tip: `اليوم ${d.day}: ${d.done} من ${d.planned} تمارين` }))} />`
        : html`<${Empty} icon="list" title="لا بيانات بعد" />`}
    <//>
  </div>`;
}
