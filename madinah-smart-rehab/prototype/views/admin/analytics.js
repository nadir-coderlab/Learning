// Management analytics: aggregates only — no names and no individual clinical detail.
import { html, useMemo } from '../../lib/h.js';
import { Icon, Card, StatusPill } from '../../lib/ui.js';
import { BarChart } from '../../lib/charts.js';
import { adherence, statusOf } from '../../lib/engine.js';
import { RTS_CONTINUUM } from '../../lib/data.js';
import { round } from '../../lib/util.js';
import { PageHead, avg, median } from './common.js';

const sum = (arr) => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function kpis(state) {
  const cat = state.catalog;
  const act = state.patients;
  const dis = state.discharged;
  const completed = dis.filter((d) => !d.dropout);
  const dropouts = dis.filter((d) => d.dropout);
  const done = act.flatMap((p) => (p.appointments || []).filter((a) => a.status === 'done'));
  const vDone = done.filter((a) => a.type === 'virtual').length + sum(dis.map((d) => d.virtual));
  const ipDone = done.filter((a) => a.type !== 'virtual').length + sum(dis.map((d) => d.inPerson));
  const statuses = act.map((p) => statusOf(p, cat));
  const status = ['green', 'yellow', 'red', 'idle'].map((code) => ({ code, n: statuses.filter((s) => s.code === code).length }));
  return {
    enrolled: act.length + dis.length,
    active: act.length,
    discharged: dis.length,
    completion: pct(completed.length, dis.length),
    dropout: pct(dropouts.length, dis.length),
    adh14: round(avg(act.map((p) => adherence(p, 14, cat).pct))),
    durationDays: round(avg(completed.map((d) => d.durationDays))),
    vDone, ipDone,
    rtrActive: act.filter((p) => p.phase >= 4).length,
    rtrMedian: median(completed.map((d) => d.rtrDay)),
    rts: RTS_CONTINUUM.map((s) => ({ ...s, n: dis.filter((d) => d.rts === s.id).length + act.filter((p) => (p.rtsStage || 0) === s.id).length })),
    satisfaction: round(avg(completed.map((d) => d.satisfaction)), 1),
    satisfactionN: completed.filter((d) => Number.isFinite(d.satisfaction)).length,
    ikdcStart: round(avg(completed.map((d) => d.ikdcStart))),
    ikdcEnd: round(avg(completed.map((d) => d.ikdcEnd))),
    ikdcN: completed.filter((d) => Number.isFinite(d.ikdcEnd)).length,
    byPhase: cat.phases.map((ph) => ({ ph, n: act.filter((p) => p.phase === ph.id).length })),
    status,
    awaiting: statuses.filter((s) => s.awaitingApproval).length,
  };
}

function Kpi({ icon, label, value, sub, id }) {
  return html`<div class="stat" id=${id}><span class="label"><${Icon} name=${icon} size=${15} />${label}</span>
    <span class="value">${value}</span>${sub ? html`<span class="sub">${sub}</span>` : null}</div>`;
}

const STATUS_FILL = { green: 'var(--ok)', yellow: 'var(--warn-mark)', red: 'var(--alert)', idle: 'var(--idle)' };

export function AnalyticsPage({ state }) {
  const k = useMemo(() => kpis(state), [state]);
  const visits = k.vDone + k.ipDone;
  return html`<div class="stack-lg">
    <${PageHead} eyebrow="مسار الرباط الصليبي · مركز واحد (تجريبي)" title="التحليلات">
      <span class="small muted">أرقام مجمّعة فقط — بدون أسماء أو تفاصيل سريرية فردية</span>
    <//>

    <section class="stack-sm" aria-labelledby="an-enrol">
      <h2 id="an-enrol" class="section-title">التسجيل والاستمرار</h2>
      <div class="grid-auto kpi-grid">
        <${Kpi} id="kpi-enrolled" icon="users" label="المسجلون" value=${k.enrolled} sub=${`${k.active} نشط · ${k.discharged} أنهوا أو خرجوا`} />
        <${Kpi} id="kpi-active" icon="activity" label="النشطون الآن" value=${k.active} sub=${`${k.awaiting} بانتظار اعتماد مرحلة`} />
        <${Kpi} id="kpi-completion" icon="check" label="نسبة الإكمال" value=${`${k.completion}%`} sub=${`من ${k.discharged} حالة خرجت من البرنامج`} />
        <${Kpi} id="kpi-dropout" icon="logout" label="نسبة الانقطاع" value=${`${k.dropout}%`} sub="انقطع قبل نهاية البرنامج" />
        <${Kpi} id="kpi-duration" icon="clock" label="متوسط مدة البرنامج" value=${`${round(k.durationDays / 7)} أسبوعًا`} sub=${`${k.durationDays} يومًا للحالات المكتملة`} />
      </div>
    </section>

    <section class="stack-sm" aria-labelledby="an-care">
      <h2 id="an-care" class="section-title">الالتزام والزيارات</h2>
      <div class="grid-auto kpi-grid">
        <${Kpi} id="kpi-adherence" icon="list" label="متوسط الالتزام (14 يومًا)" value=${`${k.adh14}%`} sub="للمرضى النشطين" />
        <${Kpi} id="kpi-visits" icon="video" label="زيارات افتراضية منجزة" value=${k.vDone} sub=${`مقابل ${k.ipDone} زيارة حضورية · ${visits ? Math.round((k.vDone / visits) * 100) : 0}% من الزيارات افتراضية`} />
        <${Kpi} id="kpi-redistributed" icon="refresh" label="زيارات حضورية أُعيد توزيعها (تقدير)" value=${k.vDone} sub="تقدير: كل زيارة افتراضية منجزة بدل زيارة حضورية" />
        <${Kpi} id="kpi-satisfaction" icon="heart" label="رضا المرضى" value=${Number.isFinite(k.satisfaction) ? `${k.satisfaction}/5` : '—'} sub=${`من ${k.satisfactionN} حالة مكتملة`} />
      </div>
    </section>

    <section class="stack-sm" aria-labelledby="an-out">
      <h2 id="an-out" class="section-title">النتائج</h2>
      <div class="grid-auto kpi-grid">
        <${Kpi} id="kpi-rtr" icon="run" label="العودة للجري" value=${k.rtrActive} sub=${`نشطون في المرحلة 4 فأكثر · وسيط المكتملين اليوم ${Number.isFinite(k.rtrMedian) ? round(k.rtrMedian) : '—'}`} />
        ${k.rts.map((s) => html`<${Kpi} key=${s.id} id=${`kpi-rts-${s.id}`} icon="trophy" label=${s.nameAr} value=${s.n} sub=${html`أعلى خطوة معتمدة<br /><bdi>${s.nameEn}</bdi>`} />`)}
      </div>
    </section>

    <${Card} title="المرضى النشطون حسب المرحلة" eyebrow=${`${k.active} مريضًا`}>
      <div class="chart-split">
        <${BarChart} label="عدد المرضى النشطين في كل مرحلة" xTitle="المرحلة" valueFormat=${(v) => `${round(v)}`} height=${160}
          data=${k.byPhase.map(({ ph, n }) => ({ label: `المرحلة ${ph.id}`, value: n, tip: `المرحلة ${ph.id} — ${ph.nameAr}` }))} />
        <div class="chart-side">
          <ul class="phase-counts">${k.byPhase.map(({ ph, n }) => html`<li key=${ph.id}><span><span class="tag num">${ph.id}</span> ${ph.nameAr}</span><strong class="num">${n}</strong></li>`)}</ul>
        </div>
      </div>
    <//>

    <div class="grid-2">
      <${Card} title="توزيع الحالات" eyebrow="المرضى النشطون الآن">
        <div class="status-bars">${k.status.map((s) => html`<div class="status-bar" key=${s.code}>
          <${StatusPill} code=${s.code} />
          <div class="meter" role="img" aria-label=${`${s.n} من ${k.active}`}><span style=${`width:${pct(s.n, k.active)}%;background:${STATUS_FILL[s.code]}`}></span></div>
          <span class="num strong">${s.n}</span><span class="small muted num">${pct(s.n, k.active)}%</span>
        </div>`)}</div>
      <//>
      <${Card} title="IKDC عند البدء وعند الخروج" eyebrow=${`متوسط الحالات المكتملة (n=${k.ikdcN}) · 0–100 · الأعلى أفضل`}>
        <div class="stack">
          ${[['عند البدء', k.ikdcStart, 'var(--series-2)'], ['عند الخروج', k.ikdcEnd, 'var(--series-1)']].map(([label, v, c]) => html`<div class="status-bar ikdc-bar" key=${label}>
            <span class="small strong">${label}</span>
            <div class="meter" role="img" aria-label=${`${label}: ${v}`}><span style=${`width:${v}%;background:${c}`}></span></div>
            <span class="num strong">${v}</span><span></span>
          </div>`)}
          <p class="small"><strong>+${k.ikdcEnd - k.ikdcStart} نقطة</strong> في المتوسط بين البداية والخروج.</p>
        </div>
      <//>
    </div>

    <${Card} title="عن هذه الأرقام">
      <ul class="plain-list">
        <li>تُحسب من المرضى النشطين (${k.active}) والحالات التي خرجت من البرنامج (${k.discharged}) في بيانات العرض.</li>
        <li>«الزيارات الحضورية التي أُعيد توزيعها» تقدير وليس قياسًا مباشرًا.</li>
        <li>الإدارة لا ترى أسماء المرضى ولا بياناتهم السريرية الفردية.</li>
      </ul>
      <div class="note note-info row" style="gap:8px;margin-top:12px;flex-wrap:nowrap;align-items:flex-start"><${Icon} name="info" size=${16} />
        <span>مقارنة المنشآت تُفعَّل عند انضمام مراكز أخرى للمسار.</span></div>
    <//>
  </div>`;
}
