// Overview tab: why this status, the key numbers, and the recovery curves against the reference corridor.
import { html, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Empty } from '../../lib/ui.js';
import { LineChart, BarChart } from '../../lib/charts.js';
import { latest, statusOf, adherence, adherenceByDay, projectFlex, riskOfDropout, postOpDay, corridorAt, streak } from '../../lib/engine.js';
import { round, last } from '../../lib/util.js';
import { SOURCE_AR, bandTo, adhSummary, adhBars, Choice } from './common.js';

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
  const ready = st.ready;
  const r = RISK[risk.level];

  const flexSeries = romSeries(p, 'flex');
  const lastRomDay = Math.max(0, ...(p.rom || []).map((x) => x.day));
  const maxX = Math.max(14, day, proj?.line ? proj.line[1].x : 0, lastRomDay);
  if (proj?.line) flexSeries.push({ label: 'التقدير الإحصائي', color: 'var(--ink-3)', dashed: true, points: proj.line.map((q) => ({ x: q.x, y: round(q.y) })) });
  const flexVals = flexSeries.flatMap((s) => s.points.map((q) => q.y));
  const flexMin = Math.max(0, Math.floor((Math.min(60, ...flexVals) - 10) / 10) * 10);
  const corridorNow = corridorAt(cat.corridor.flex, day);

  const extSeries = romSeries(p, 'ext');
  const extMax = Math.max(8, ...extSeries.flatMap((s) => s.points.map((q) => q.y + 1)));
  const fullExtDay = (cat.corridor.ext || []).find((q) => q.hi === 0)?.x;
  const extWhy = cat.rules.find((x) => x.id === 'y_trajectory')?.why;

  const pains = (p.checkins || []).filter((c) => painRange === 'all' || day - c.day < Number(painRange)).map((c) => ({ x: c.day, y: c.pain }));
  const lastPain = last(p.checkins || []);
  const peak = pains.length ? pains.reduce((a, b) => (b.y > a.y ? b : a)) : null;

  const adhDays = adherenceByDay(p, 14, cat);
  const adhS = adhSummary(adhDays, day);
  const streakDays = streak(p, cat);

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
      ${flexSeries.length ? html`<div class="chart-split">
        <${LineChart} label="ثني الركبة عبر الأيام" unit="°" series=${flexSeries}
          band=${{ label: 'المسار المرجعي', points: bandTo(cat.corridor.flex, maxX) }}
          xDomain=${[0, maxX]} yDomain=${[flexMin, 150]} height=${230} />
        <div class="chart-side">
          ${Number.isFinite(L.flex) ? html`<div><span class="muted">آخر قياس</span><div class="side-value">${L.flex}°</div>
            <span class="muted">${SOURCE_AR[L.flexRec.source] || ''} · اليوم ${L.flexRec.day}</span></div>` : null}
          ${corridorNow ? html`<p>المسار المرجعي في اليوم ${day}: <strong><bdi dir="ltr">${Math.round(corridorNow.lo)}–${Math.round(corridorNow.hi)}°</bdi></strong></p>` : null}
          ${proj?.line ? html`<p class="row" style="gap:6px;flex-wrap:nowrap;align-items:flex-start"><${Icon} name="target" size=${15} /><span>
            ${proj.days > 0 ? `التقدير: يصل لـ120° خلال ~${proj.days} يومًا — تقدير إحصائي وليس قرارًا` : 'التقدير: يُرجَّح أنه بلغ 120° تقريبًا — يحتاج قياسًا جديدًا للتأكد. تقدير إحصائي وليس قرارًا'}
            <span class="muted"> (${proj.slopePerWeek}° أسبوعيًا)</span></span></p>` : null}
          ${proj?.stalled ? html`<p class="row" style="gap:6px;flex-wrap:nowrap;align-items:flex-start;color:var(--warn)"><${Icon} name="alert" size=${15} /><span>تحسن الثني شبه متوقف في آخر 3 أسابيع — راجع البرنامج.</span></p>` : null}
          ${p.meniscusRepair ? html`<p class="muted">المسار المرجعي لا يراعي قيود المدى بعد إصلاح الغضروف الهلالي (${p.romRestriction}).</p>` : null}
          <p class="muted">مصادر القياس: ${sourceCounts(p) || '—'}</p>
          <p class="muted">${cat.corridor.source}</p>
        </div>
      </div>` : html`<${Empty} icon="knee" title="لا قياسات للمدى بعد" />`}
    <//>

    <${Card} title="نقص الفرد" eyebrow="0° = فرد كامل؛ الأقل أفضل">
      ${extSeries.length ? html`<div class="chart-split">
        <${LineChart} label="نقص فرد الركبة عبر الأيام" unit="°" series=${extSeries}
          band=${{ label: 'المسار المرجعي', points: bandTo(cat.corridor.ext, maxX) }}
          xDomain=${[0, maxX]} yDomain=${[0, extMax]} height=${180} />
        <div class="chart-side">
          ${Number.isFinite(L.extDeficit) ? html`<div><span class="muted">آخر قياس</span><div class="side-value">${L.extDeficit === 0 ? 'كامل' : `ينقص ${L.extDeficit}°`}</div>
            <span class="muted">${SOURCE_AR[L.extRec.source] || ''} · اليوم ${L.extRec.day}</span></div>` : null}
          ${fullExtDay ? html`<p>المسار المرجعي: فرد كامل بحلول اليوم ${fullExtDay}.</p>` : null}
          ${extWhy ? html`<p class="muted">${extWhy}</p>` : null}
        </div>
      </div>` : html`<${Empty} icon="knee" title="لا قياسات" />`}
    <//>

    <${Card} title="الألم اليومي" eyebrow="مقياس 0–10 من تسجيل المريض"
      actions=${day > 60 ? html`<${Choice} id="ov-pain-range" label="مدة عرض الألم" value=${painRange} onChange=${setPainRange}
        options=${[{ id: '60', label: '60 يومًا' }, { id: 'all', label: 'كل الفترة' }]} />` : null}>
      ${pains.length > 1 ? html`<div class="chart-split">
        <${LineChart} label="الألم اليومي" unit="/10" series=${[{ label: 'الألم', color: 'var(--series-1)', points: pains }]}
          yDomain=${[0, 10]} xDomain=${[Math.min(...pains.map((q) => q.x)), Math.max(day, ...pains.map((q) => q.x))]} height=${180} />
        <div class="chart-side">
          <div><span class="muted">متوسط 7 أيام</span><div class="side-value">${Number.isFinite(L.painAdl) ? `${round(L.painAdl, 1)}/10` : '—'}</div></div>
          ${lastPain ? html`<p>آخر تسجيل: <strong class="num">${lastPain.pain}/10</strong> · اليوم ${lastPain.day}</p>` : null}
          ${peak ? html`<p>الأعلى في الفترة المعروضة: <strong class="num">${peak.y}/10</strong> · اليوم ${peak.x}</p>` : null}
        </div>
      </div>` : html`<${Empty} icon="activity" title="تسجيلات قليلة" />`}
    <//>

    <${Card} title="الالتزام اليومي بالتمارين" eyebrow="آخر 14 يومًا">
      ${adhDays.length ? html`<div class="chart-split">
        <${BarChart} label="نسبة التمارين المنجزة يوميًا" max=${100} valueFormat=${(v) => `${v}%`} xTitle="اليوم بعد العملية" height=${140} data=${adhBars(adhDays, day)} />
        <div class="chart-side">
          <div><span class="muted">المنجز من المستحق</span><div class="side-value">${adhS.pct === null ? '—' : `${adhS.pct}%`}</div></div>
          <p>أيام بالتزام 80% أو أكثر: <strong class="num">${adhS.good} من ${adhS.dueDays}</strong></p>
          <p>سلسلة الالتزام الحالية: <strong class="num">${streakDays}</strong> ${streakDays === 1 ? 'يوم' : 'أيام'}</p>
          ${adhS.restDays ? html`<p class="muted">النقطة الرمادية = يوم بلا تمارين مستحقة (${adhS.restDays}).</p>` : null}
          <p class="muted">النسبة لا تشمل اليوم الحالي لأنه لم ينتهِ.</p>
        </div>
      </div>` : html`<${Empty} icon="list" title="لا بيانات بعد" />`}
    <//>
  </div>`;
}
