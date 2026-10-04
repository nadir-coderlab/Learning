// Activity tab: adherence, exercise log, running sessions and jump-training levels.
import { html, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Empty, toast } from '../../lib/ui.js';
import { BarChart } from '../../lib/charts.js';
import { adherenceByDay, postOpDay } from '../../lib/engine.js';
import { RUN_PROGRAM, PLYO_LEVELS } from '../../lib/data.js';
import { dispatch } from '../../lib/store.js';
import { relDay } from '../../lib/util.js';
import { BY, exName, Check, adhSummary, adhBars } from './common.js';

const SWELL_AR = { none: 'لا يوجد', mild: 'خفيف', increased: 'زاد', more: 'زاد' };
const DONE_AR = { yes: { tone: 'ok', icon: 'check', label: 'مكتملة' }, partial: { tone: 'warn', icon: 'alert', label: 'جزئية' }, no: { tone: 'alert', icon: 'x', label: 'لم تكتمل' } };

function PlyoLevels({ p, cat }) {
  const cur = p.plyoLevel || 0;
  const [asking, setAsking] = useState(false);
  const [ok, setOk] = useState(false);
  const nextLevel = cur + 1;
  const unlock = () => {
    dispatch({ type: 'plyo/unlock', pid: p.id, level: nextLevel, by: BY });
    toast(`فُتح المستوى ${nextLevel} لـ ${p.name} — أضف تمارينه من تبويب البرنامج عند الحاجة`);
    setAsking(false); setOk(false);
  };
  return html`<div class="stack-sm">${PLYO_LEVELS.map((lv) => {
    const open = lv.level <= cur;
    const isNext = lv.level === nextLevel;
    return html`<div class="lock-level wrap" data-locked=${String(!open)} key=${lv.level}>
      <span class=${`icon-tile ${open ? 'ok' : 'idle'}`} aria-hidden="true"><${Icon} name=${open ? 'unlock' : 'lock'} size=${18} /></span>
      <div class="stack-sm grow" style="gap:2px;min-width:200px">
        <strong>${lv.nameAr}</strong>
        <span class="small">${lv.ex.map((id) => exName(id, cat)).join(' · ')}</span>
        ${isNext && asking ? html`<div class="stack-sm" style="margin-top:6px">
          <${Check} id=${`plyo-confirm-${lv.level}`} checked=${ok} onChange=${setOk}>راجعت جودة الهبوط والأعراض، وأعتمد فتح هذا المستوى<//>
          <div class="row" style="gap:6px"><button type="button" class="btn btn-sm btn-primary" id=${`plyo-unlock-confirm-${lv.level}`} disabled=${!ok} onClick=${unlock}>تأكيد فتح المستوى</button>
            <button type="button" class="btn btn-sm btn-ghost" id=${`plyo-cancel-${lv.level}`} onClick=${() => { setAsking(false); setOk(false); }}>إلغاء</button></div></div>` : null}
      </div>
      ${open ? html`<${Pill} tone="ok" icon="unlock">مفتوح<//>`
        : isNext && !asking ? html`<button type="button" class="btn btn-sm" id=${`plyo-unlock-${lv.level}`} onClick=${() => setAsking(true)}><${Icon} name="unlock" size=${15} />فتح المستوى</button>`
        : isNext ? null : html`<${Pill} tone="plain" icon="lock">مقفل<//>`}
    </div>`;
  })}</div>`;
}

export function ActivityTab({ p, cat }) {
  const day = postOpDay(p);
  const adh = adherenceByDay(p, 28, cat);
  const adhS = adhSummary(adh, day);
  const log = [...(p.exlog || [])].sort((a, b) => b.day - a.day).slice(0, 25);
  const runs = [...(p.runs || [])].reverse().slice(0, 10);
  return html`<div class="stack-lg">
    <${Card} title="الالتزام اليومي — 28 يومًا" eyebrow="نسبة المنجز من التمارين المستحقة كل يوم">
      ${adh.length ? html`<div class="chart-split">
        <${BarChart} label="نسبة الالتزام اليومية لآخر 28 يومًا" max=${100} valueFormat=${(v) => `${v}%`} xTitle="اليوم بعد العملية" height=${150} data=${adhBars(adh, day)} />
        <div class="chart-side">
          <div><span class="muted">المنجز من المستحق</span><div class="side-value">${adhS.pct === null ? '—' : `${adhS.pct}%`}</div></div>
          <p>أيام بالتزام 80% أو أكثر: <strong class="num">${adhS.good} من ${adhS.dueDays}</strong></p>
          ${adhS.restDays ? html`<p class="muted">النقطة الرمادية = يوم بلا تمارين مستحقة (${adhS.restDays} يومًا)، لا يُحسب كتفويت.</p>` : null}
        </div>
      </div>` : html`<${Empty} icon="list" title="لا بيانات" />`}
    <//>
    <${Card} title="سجل التمارين الأخير" eyebrow="من تطبيق المريض">
      ${log.length ? html`<div class="table-wrap" style="max-height:360px;overflow:auto"><table class="table">
        <thead><tr><th>اليوم</th><th>التمرين</th><th class="num">الألم أثناء</th><th class="num">الصعوبة</th><th>تحقق</th></tr></thead>
        <tbody>${log.map((l, i) => html`<tr key=${`${l.day}-${l.exId}-${i}`}>
          <td class="nowrap">${l.day} <span class="muted small">(${relDay(l.day - day)})</span></td>
          <td>${exName(l.exId, cat)}</td>
          <td class="num">${Number.isFinite(l.painDuring) ? `${l.painDuring}/10` : '—'}</td>
          <td class="num">${Number.isFinite(l.difficulty) ? `${l.difficulty}/10` : '—'}</td>
          <td>${l.verified ? html`<${Pill} tone="info" icon="camera">بالكاميرا<//>` : html`<span class="muted small">ذاتي</span>`}</td>
        </tr>`)}</tbody></table></div>` : html`<${Empty} icon="list" title="لا تمارين مسجلة" />`}
    <//>
    ${p.phase >= 4 ? html`<div class="grid-2">
      <${Card} title="جلسات الجري" eyebrow="آخر 10 جلسات من تسجيل المريض">
        ${runs.length ? html`<div class="table-wrap"><table class="table">
          <thead><tr><th class="num">اليوم</th><th class="num">المستوى</th><th class="num">ألم أثناء</th><th class="num">ألم بعد</th><th>التورم</th><th>الجلسة</th></tr></thead>
          <tbody>${runs.map((r, i) => {
            const d = DONE_AR[r.completed] || DONE_AR.yes;
            return html`<tr key=${i}><td class="num">${r.day}</td><td class="num">${r.level}</td><td class="num">${r.painDuring}/10</td>
              <td class="num" style=${r.painAfter > 3 ? 'color:var(--alert);font-weight:600' : ''}>${r.painAfter}/10</td>
              <td>${SWELL_AR[r.swelling] || r.swelling}</td><td><${Pill} tone=${d.tone} icon=${d.icon}>${d.label}<//></td></tr>`;
          })}</tbody></table></div>` : html`<${Empty} icon="run" title="لا جلسات جري بعد" />`}
      <//>
      <${Card} title="برنامج الجري المتدرج" eyebrow=${p.runLevel ? `المستوى الحالي ${p.runLevel}` : 'لم يبدأ'}>
        <div class="list">${RUN_PROGRAM.map((lv) => html`<div class="list-row" key=${lv.level}>
          <span class=${`icon-tile ${lv.level < (p.runLevel || 0) ? 'ok' : lv.level === p.runLevel ? '' : 'idle'}`} aria-hidden="true"><span class="num strong">${lv.level}</span></span>
          <span class="grow small">${lv.textAr}</span>
          ${lv.level === p.runLevel ? html`<${Pill} tone="info" icon="run">الحالي<//>` : lv.level < (p.runLevel || 0) ? html`<${Pill} tone="ok" icon="check">أُنجز<//>` : null}
        </div>`)}</div>
        <p class="small muted" style="margin-top:8px">يُقرأ التحمل من الألم بعد الجلسة (3/10 أو أقل) والتورم في اليوم التالي — نفس منطق معيار المرحلة 5. رفع المستوى قرارك.</p>
      <//>
    </div>` : null}
    ${p.phase >= 5 ? html`<${Card} title="مستويات تدريب القفز" eyebrow="كل مستوى يُفتح بقرار الأخصائي فقط">
      <${PlyoLevels} p=${p} cat=${cat} /><//>` : null}
  </div>`;
}
