// Outcomes (PROMs), strength and functional tests, plus the return-to-sport board and continuum.
import { html, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Field, Empty, toast } from '../../lib/ui.js';
import { LineChart, LsiBar } from '../../lib/charts.js';
import { criteriaFor, postOpDay, SIDE_AR } from '../../lib/engine.js';
import { RTS_CONTINUUM } from '../../lib/data.js';
import { dispatch } from '../../lib/store.js';
import { round, last } from '../../lib/util.js';
import { BY, CriteriaList, CriteriaDone, CriteriaSummary, Check, FieldError, num } from './common.js';

const lsi = (op, other) => (other ? (op / other) * 100 : undefined);
const pctText = (v) => (Number.isFinite(v) ? `${round(v, 1)}%` : '—');
const gateTarget = (cat, metric) => (cat.gates.rts || []).find((c) => c.metric === metric)?.target;

/* ---------- النتائج ---------- */
function PromChart({ p, field, title, eyebrow, target }) {
  const pts = (p.proms || []).filter((x) => Number.isFinite(x[field])).map((x) => ({ x: x.day, y: x[field] }));
  const lastP = last(pts);
  const first = pts[0];
  const delta = pts.length > 1 ? lastP.y - first.y : null;
  const side = lastP ? html`<div class="chart-side">
      <div><span class="muted">آخر قيمة</span><div class="side-value">${lastP.y}</div><span class="muted">اليوم ${lastP.x}</span></div>
      ${delta !== null ? html`<p>التغير منذ اليوم ${first.x}: <strong class="num"><bdi dir="ltr">${delta > 0 ? '+' : ''}${delta}</bdi></strong></p>` : null}
      ${Number.isFinite(target) ? html`<p class="row" style="gap:6px">هدف العودة ${target} (الخط الأفقي):
        ${lastP.y >= target ? html`<${Pill} tone="ok" icon="check">محقق<//>` : html`<${Pill} tone="warn" icon="alert">دون الهدف<//>`}</p>` : null}
      <p class="muted">${pts.length} ${pts.length === 1 ? 'قياس' : 'قياسات'}</p>
    </div>` : null;
  return html`<${Card} title=${title} eyebrow=${eyebrow}>
    ${pts.length >= 2 ? html`<div class="chart-split"><${LineChart} label=${title} series=${[{ label: title, color: 'var(--series-1)', points: pts, dots: 'all' }]}
        yDomain=${[0, 100]} height=${170} refLines=${Number.isFinite(target) ? [{ y: target, label: '' }] : []} />${side}</div>`
      : pts.length === 1 ? html`<div class="chart-split"><p class="small muted">قياس واحد حتى الآن؛ يظهر الاتجاه بعد التعبئة التالية حسب الجدول.</p>${side}</div>`
      : html`<${Empty} icon="clipboard" title="لم يُعبأ بعد">يظهر عند أول تعبئة حسب الجدول.<//>`}
  <//>`;
}

export function OutcomesTab({ p, cat }) {
  const ikdcT = gateTarget(cat, 'ikdc');
  const rsiT = gateTarget(cat, 'aclRsi');
  return html`<div class="stack-lg">
    <${PromChart} p=${p} field="ikdc" title="IKDC" eyebrow="نموذج تقييم الركبة الذاتي · 0–100 · الأعلى أفضل" target=${ikdcT} />
    <${PromChart} p=${p} field="aclrsi" title="ACL-RSI" eyebrow="الجاهزية النفسية للعودة · 0–100 · الأعلى أفضل" target=${rsiT} />
    <${PromChart} p=${p} field="sane" title="SANE" eyebrow="تقييم وظيفة الركبة بسؤال واحد · 0–100% · أسبوعيًا" />
    <${Card} title="جدول الاستبيانات">
      <div class="table-wrap"><table class="table">
        <thead><tr><th>الاستبيان</th><th class="num">الأسئلة</th><th>المدى</th><th>مواعيد التعبئة</th></tr></thead>
        <tbody>${cat.questionnaires.map((q) => html`<tr key=${q.id}>
          <td><div class="stack-sm" style="gap:0"><strong>${q.nameAr}</strong><span class="small muted"><bdi>${q.nameEn}</bdi></span></div></td>
          <td class="num">${q.items}</td><td class="num"><bdi>${q.range}</bdi></td>
          <td><div class="row" style="gap:4px">${q.schedule.map((s) => html`<span class="tag" key=${s}>${s}</span>`)}</div></td>
        </tr>`)}</tbody></table></div>
      <div class="stack-sm small" style="margin-top:12px">
        <p class="row" style="gap:6px;align-items:flex-start"><${Icon} name="shield" size=${15} /><span>استخدام IKDC في الأنظمة الصحية يحتاج ترخيصًا من AOSSM.</span></p>
        <p class="row" style="gap:6px;align-items:flex-start"><${Icon} name="check" size=${15} /><span>النسخة العربية القصيرة من ACL-RSI متحقق منها في المملكة العربية السعودية (Alzhrani 2022).</span></p>
      </div>
    <//>
  </div>`;
}

/* ---------- القوة ---------- */
const METHODS = ['HHD', 'Isokinetic 60°/s', 'Isokinetic 180°/s', '1RM Leg extension'];

function StrengthForm({ p }) {
  const [f, setF] = useState({ method: 'HHD', qR: '', qL: '', hR: '', hL: '' });
  const [err, setErr] = useState('');
  const opSide = p.side; // 'R' | 'L'
  const sideLabel = (s) => `${s === 'R' ? 'اليمنى' : 'اليسرى'}${s === opSide ? ' (المُجراة)' : ' (السليمة)'}`;
  const submit = (e) => {
    e.preventDefault();
    const v = { qR: num(f.qR), qL: num(f.qL), hR: num(f.hR), hL: num(f.hL) };
    if (!(v.qR > 0 && v.qL > 0)) return setErr('أدخل قوة الرباعية للطرفين (أرقام موجبة).');
    const hamGiven = f.hR !== '' || f.hL !== '';
    if (hamGiven && !(v.hR > 0 && v.hL > 0)) return setErr('أدخل الهامسترينج للطرفين أو اتركهما فارغين.');
    const pick = (r, l) => (opSide === 'R' ? [r, l] : [l, r]);
    const [quadOp, quadOther] = pick(v.qR, v.qL);
    const [hamOp, hamOther] = hamGiven ? pick(v.hR, v.hL) : [undefined, undefined];
    const entry = { method: f.method, quadOp, quadOther, ...(hamGiven ? { hamOp, hamOther } : {}) };
    const summary = `Quad LSI ${round(lsi(quadOp, quadOther))}%${hamGiven ? ` · Ham LSI ${round(lsi(hamOp, hamOther))}%` : ''}`;
    dispatch({ type: 'strength/add', pid: p.id, entry, summary, by: BY });
    setErr(''); setF({ ...f, qR: '', qL: '', hR: '', hL: '' });
    toast(`حُفظ اختبار القوة — ${summary}`);
    return undefined;
  };
  const inp = (k, id, label) => html`<${Field} label=${label} htmlFor=${id}>
    <input class="input num" id=${id} type="number" inputmode="decimal" min="0" step="0.1" value=${f[k]} onInput=${(e) => setF({ ...f, [k]: e.currentTarget.value })} /><//>`;
  return html`<form class="stack" onSubmit=${submit} noValidate>
    <div class="form-grid">
      <${Field} label="طريقة القياس" htmlFor="str-method">
        <select class="select" id="str-method" value=${f.method} onChange=${(e) => setF({ ...f, method: e.currentTarget.value })}>
          ${METHODS.map((m) => html`<option value=${m}>${m}</option>`)}</select><//>
      ${inp('qR', 'str-quad-r', `الرباعية — ${sideLabel('R')}`)}
      ${inp('qL', 'str-quad-l', `الرباعية — ${sideLabel('L')}`)}
      ${inp('hR', 'str-ham-r', `الهامسترينج — ${sideLabel('R')}`)}
      ${inp('hL', 'str-ham-l', `الهامسترينج — ${sideLabel('L')}`)}
    </div>
    <p class="small muted">أدخل القيم كما قيست لكل رجل (نيوتن أو نيوتن·متر)؛ المنصة تحسب التماثل = المُجراة ÷ السليمة × 100 حسب جهة العملية (${SIDE_AR[p.side]}).</p>
    <${FieldError} text=${err} />
    <div><button type="submit" class="btn btn-primary" id="str-save"><${Icon} name="check" size=${16} />حفظ الاختبار</button></div>
  </form>`;
}

export function StrengthTab({ p }) {
  const rows = p.strength || [];
  const st = last(rows);
  const qPts = rows.filter((s) => s.quadOther).map((s) => ({ x: s.day, y: round(lsi(s.quadOp, s.quadOther)) }));
  const hPts = rows.filter((s) => s.hamOther).map((s) => ({ x: s.day, y: round(lsi(s.hamOp, s.hamOther)) }));
  const bars = st ? html`<div class="stack">
      <${LsiBar} label="العضلة الرباعية" value=${lsi(st.quadOp, st.quadOther)} threshold=${90} />
      ${st.hamOther ? html`<${LsiBar} label="الهامسترينج" value=${lsi(st.hamOp, st.hamOther)} threshold=${90} />` : html`<p class="small muted">الهامسترينج: لم يُقس في هذا الاختبار.</p>`}
      <p class="small muted"><bdi>${st.method}</bdi> · اليوم ${st.day}. الحد 90% = الخط الأسود في الأشرطة والخط الأفقي في الرسم. التماثل = المُجراة ÷ السليمة.</p></div>` : null;
  return html`<div class="stack-lg">
    <${Card} title="تماثل القوة (LSI)" eyebrow=${st ? 'عبر الأيام، وآخر قياس على الجانب' : 'لا اختبارات بعد'}>
      ${!st ? html`<${Empty} icon="dumbbell" title="لا اختبارات قوة بعد">تبدأ عادة في المرحلة 3.<//>`
        : qPts.length + hPts.length >= 2 ? html`<div class="chart-split">
          <${LineChart} label="تماثل القوة عبر الأيام" unit="%" height=${190}
            series=${[{ label: 'الرباعية', color: 'var(--series-1)', points: qPts, dots: 'all' }, { label: 'الهامسترينج', color: 'var(--series-2)', points: hPts, dots: 'all' }].filter((x) => x.points.length)}
            refLines=${[{ y: 90, label: '' }]} yDomain=${[40, 110]} />
          <div class="chart-side">${bars}</div></div>`
        : bars}
    <//>
    <${Card} title="سجل اختبارات القوة">
      ${rows.length ? html`<div class="table-wrap"><table class="table">
        <thead><tr><th class="num">اليوم</th><th>الطريقة</th><th class="num">الرباعية المُجراة</th><th class="num">الرباعية السليمة</th><th class="num">LSI الرباعية</th>
          <th class="num">الهامسترينج المُجراة</th><th class="num">الهامسترينج السليمة</th><th class="num">LSI الهامسترينج</th></tr></thead>
        <tbody>${[...rows].reverse().map((s, i) => html`<tr key=${`${s.day}-${i}`}>
          <td class="num">${s.day}</td><td><bdi>${s.method}</bdi></td>
          <td class="num">${s.quadOp ?? '—'}</td><td class="num">${s.quadOther ?? '—'}</td><td class="num strong">${pctText(lsi(s.quadOp, s.quadOther))}</td>
          <td class="num">${s.hamOp ?? '—'}</td><td class="num">${s.hamOther ?? '—'}</td><td class="num strong">${pctText(lsi(s.hamOp, s.hamOther))}</td>
        </tr>`)}</tbody></table></div>` : html`<p class="small muted">لا اختبارات مسجلة.</p>`}
    <//>
    <${Card} title="تسجيل اختبار قوة" eyebrow="اليمين واليسار كما قيسا"><${StrengthForm} p=${p} /><//>
  </div>`;
}

/* ---------- الاختبارات الوظيفية ---------- */
const HOPS = [
  { key: 'single', ar: 'القفز الفردي', en: 'Single hop' },
  { key: 'triple', ar: 'القفز الثلاثي', en: 'Triple hop' },
  { key: 'crossover', ar: 'القفز المتقاطع', en: 'Crossover hop' },
  { key: 'timed', ar: 'القفز الموقوت 6 م', en: '6 m timed hop' },
];

// Return-to-sport continuum: each step needs its own explicit, confirmed approval. Nothing advances on its own.
export function RtsContinuum({ p, results, idPrefix = 'rts', onApproved }) {
  const stage = p.rtsStage || 0;
  const next = RTS_CONTINUUM.find((s) => s.id === stage + 1);
  const [confirm, setConfirm] = useState(false);
  const [why, setWhy] = useState('');
  const allMet = results.length > 0 && results.every((r) => r.state === 'met');
  const needWhy = !allMet;
  const ok = Boolean(next) && confirm && (!needWhy || why.trim().length >= 8);
  const approve = () => {
    if (!ok) return;
    const from = stage ? RTS_CONTINUUM[stage - 1].nameAr : '—';
    dispatch({ type: 'rts/stage', pid: p.id, stage: next.id, label: next.nameAr, from, by: BY, note: why.trim() });
    if (needWhy) dispatch({ type: 'note/add', pid: p.id, by: BY, text: `تبرير سريري لاعتماد «${next.nameAr}» قبل اكتمال المعايير: ${why.trim()}` });
    toast(`اعتُمدت خطوة «${next.nameAr}» لـ ${p.name}`);
    setConfirm(false); setWhy('');
    onApproved?.();
  };
  return html`<div class="stack">
    <ol class="journey rts-steps" aria-label="مراحل العودة للرياضة">
      ${RTS_CONTINUUM.map((s) => {
        const state = s.id <= stage ? 'done' : s.id === stage + 1 ? 'current' : 'locked';
        return html`<li class="journey-step" data-state=${state} key=${s.id}>
          <span class="journey-node">${state === 'done' ? html`<${Icon} name="check" size=${14} stroke=${2.6} />` : s.id}</span>
          <div class="stack-sm" style="gap:4px;padding-top:2px">
            <div class="row" style="gap:8px"><strong>${s.nameAr}</strong><span class="small muted"><bdi>${s.nameEn}</bdi></span>
              ${state === 'done' ? html`<${Pill} tone="ok" icon="check">معتمد<//>` : state === 'current' ? html`<${Pill} tone="info" icon="flag">الخطوة التالية — تحتاج اعتمادك<//>` : html`<${Pill} tone="plain" icon="lock">بعد اعتماد الخطوة السابقة<//>`}</div>
            <span class="small muted">${s.descAr}</span>
            ${state === 'current' ? html`<div class="card card-flat card-tight stack-sm" style="margin-top:4px">
              ${needWhy ? html`<p class="small row" style="gap:6px;color:var(--alert)"><${Icon} name="alert" size=${15} />ليست كل المعايير محققة — الاعتماد قرار سريري يحتاج تبريرًا مكتوبًا.</p>` : null}
              <${Check} id=${`${idPrefix}-confirm`} checked=${confirm} onChange=${setConfirm}>راجعت المعايير سريريًا<//>
              ${needWhy ? html`<div class="field"><label for=${`${idPrefix}-why`}>التبرير السريري (مطلوب)</label>
                <textarea class="textarea" id=${`${idPrefix}-why`} rows="2" value=${why} onInput=${(e) => setWhy(e.currentTarget.value)} placeholder="مثال: اختبار الفريق الطبي للنادي يغطي المعيار الناقص"></textarea></div>` : null}
              <div><button type="button" class="btn btn-sm btn-primary" id=${`${idPrefix}-approve`} disabled=${!ok} onClick=${approve}>
                <${Icon} name="check" size=${15} />اعتماد «${s.nameAr}»</button></div>
            </div>` : null}
          </div>
        </li>`;
      })}
    </ol>
    ${!next ? html`<p class="small row" style="gap:6px;color:var(--ok)"><${Icon} name="trophy" size=${16} />اعتُمدت كل خطوات العودة للرياضة.</p>` : null}
  </div>`;
}

export function RtsBoard({ p, cat, idPrefix = 'fx-rts' }) {
  const results = criteriaFor(p, 'rts', cat);
  const allMet = results.length > 0 && results.every((r) => r.state === 'met');
  return html`<div class="stack">
    <div class="row-between"><${CriteriaSummary} results=${results} /><span class="small muted">لا يُعتمد شيء تلقائيًا</span></div>
    ${allMet ? html`<${CriteriaDone} />` : null}
    <${CriteriaList} results=${results} p=${p} />
    <hr class="divider" />
    <h4>متصل العودة للرياضة</h4>
    <${RtsContinuum} p=${p} results=${results} idPrefix=${idPrefix} />
  </div>`;
}

export function FunctionalTab({ p, cat }) {
  const hops = p.hops || [];
  const hop = last(hops);
  const jumps = p.jumps || [];
  const jump = last(jumps);
  return html`<div class="stack-lg">
    <div class="grid-2">
      <${Card} title="اختبارات القفز الأربعة" eyebrow=${hop ? `آخر اختبار اليوم ${hop.day} · LSI %` : 'لا اختبارات بعد'}>
        ${hop ? html`<div class="stack">${HOPS.map((h) => html`<${LsiBar} key=${h.key} label=${html`${h.ar} <bdi class="muted" dir="ltr">(${h.en})</bdi>`} value=${hop[h.key]} threshold=${90} />`)}</div>`
          : html`<${Empty} icon="activity" title="لم تُسجل اختبارات قفز">تُجرى عادة بعد تحقق معايير المرحلة 5.<//>`}
      <//>
      <${Card} title="القفز العمودي (CMJ)" eyebrow=${jump ? `آخر اختبار اليوم ${jump.day}` : 'لا اختبارات بعد'}>
        ${jump ? html`<div class="stack">
          <${LsiBar} label="تماثل ارتفاع القفز" value=${lsi(jump.cmjOp, jump.cmjOther)} threshold=${90} />
          <div class="table-wrap"><table class="table">
            <thead><tr><th class="num">اليوم</th><th class="num">المُجراة (سم)</th><th class="num">السليمة (سم)</th><th class="num">LSI</th></tr></thead>
            <tbody>${[...jumps].reverse().map((j, i) => html`<tr key=${i}><td class="num">${j.day}</td><td class="num">${j.cmjOp}</td><td class="num">${j.cmjOther}</td><td class="num strong">${pctText(lsi(j.cmjOp, j.cmjOther))}</td></tr>`)}</tbody>
          </table></div></div>`
          : html`<${Empty} icon="activity" title="لا قياسات CMJ" />`}
      <//>
    </div>
    ${hops.length ? html`<${Card} title="سجل اختبارات القفز (LSI %)">
      <div class="table-wrap"><table class="table">
        <thead><tr><th class="num">اليوم</th>${HOPS.map((h) => html`<th class="num">${h.ar}</th>`)}<th class="num">الأدنى</th></tr></thead>
        <tbody>${[...hops].reverse().map((h, i) => html`<tr key=${i}><td class="num">${h.day}</td>
          ${HOPS.map((k) => html`<td class="num">${h[k.key]}%</td>`)}
          <td class="num strong">${Math.min(h.single, h.triple, h.crossover, h.timed)}%</td></tr>`)}</tbody>
      </table></div><//>` : null}
    ${p.phase >= 5 ? html`<${Card} title="لوحة جاهزية العودة للرياضة" eyebrow="معايير العودة كما يحددها الفريق — المنصة تعرض ولا تقرر">
        <${RtsBoard} p=${p} cat=${cat} /><//>`
      : html`<div class="note note-info row" style="gap:8px"><${Icon} name="info" size=${16} />لوحة جاهزية العودة للرياضة تظهر من المرحلة 5 (المريض الآن في المرحلة ${p.phase}، اليوم ${postOpDay(p)}).</div>`}
  </div>`;
}
