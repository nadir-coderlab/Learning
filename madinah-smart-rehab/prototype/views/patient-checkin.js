// Daily check-in with red-flag routing, and the tappable knee pain map.
import { html, useState } from '../lib/h.js';
import { Icon, NRS, YesNo, Seg, painColor } from '../lib/ui.js';
import { redFlagsInCheckin, postOpDay } from '../lib/engine.js';
import { dispatch } from '../lib/store.js';
import { EMERGENCY, RED_WORDS } from '../lib/data.js';
import { go } from '../lib/nav.js';

/* ---------- pain map ---------- */
const REGION_LABEL = {
  ant_thigh: 'مقدمة الفخذ', suprapatellar: 'فوق الرضفة', patella: 'الرضفة', patellar_tendon: 'تحت الرضفة (الوتر)',
  medial: 'الجهة الداخلية للركبة', lateral: 'الجهة الخارجية للركبة', shin: 'مقدمة الساق',
  post_thigh: 'خلف الفخذ', hamstring_tendon: 'أوتار الهامسترينج', popliteal: 'خلف الركبة', calf: 'السمانة (بطن الساق)',
};
const DONOR = { BPTB: 'patellar_tendon', HS: 'hamstring_tendon', QT: 'suprapatellar' };

function Region({ id, shape, on, flag, toggle }) {
  const common = {
    class: 'region', 'data-on': String(on), 'data-flag': String(Boolean(flag)), role: 'button', tabindex: 0,
    'aria-pressed': String(on), 'aria-label': REGION_LABEL[id],
    onClick: () => toggle(id), onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(id); } },
  };
  return shape.rect
    ? html`<rect ...${common} x=${shape.x} y=${shape.y} width=${shape.w} height=${shape.h} rx=${shape.r || 5}><title>${REGION_LABEL[id]}</title></rect>`
    : html`<ellipse ...${common} cx=${shape.cx} cy=${shape.cy} rx=${shape.rx} ry=${shape.ry}><title>${REGION_LABEL[id]}</title></ellipse>`;
}

export function PainMap({ side = 'R', graft, value = [], onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  // Facing the patient, the medial side of the right knee is on the viewer's right; from behind it flips.
  const frontMedialX = side === 'R' ? 79 : 41;
  const frontLateralX = side === 'R' ? 41 : 79;
  const backMedialX = side === 'R' ? 44 : 76;
  const limb = html`<path class="limb" d="M34 2 L86 2 L82 88 Q84 100 85 110 Q84 124 80 128 L74 218 L46 218 L40 128 Q36 124 35 110 Q36 100 38 88 Z" />`;
  const donor = DONOR[graft];
  return html`<div class="stack-sm">
    <div class="painmap">
      <figure>
        <svg viewBox="0 0 120 220" role="group" aria-label="الركبة من الأمام">${limb}
          <${Region} id="ant_thigh" shape=${{ cx: 60, cy: 50, rx: 15, ry: 24 }} on=${value.includes('ant_thigh')} toggle=${toggle} />
          <${Region} id="suprapatellar" shape=${{ cx: 60, cy: 86, rx: 14, ry: 7 }} on=${value.includes('suprapatellar')} toggle=${toggle} />
          <${Region} id="patella" shape=${{ cx: 60, cy: 106, rx: 11, ry: 12 }} on=${value.includes('patella')} toggle=${toggle} />
          <${Region} id="patellar_tendon" shape=${{ rect: true, x: 54, y: 120, w: 12, h: 16 }} on=${value.includes('patellar_tendon')} toggle=${toggle} />
          <${Region} id="medial" shape=${{ cx: frontMedialX, cy: 110, rx: 6, ry: 12 }} on=${value.includes('medial')} toggle=${toggle} />
          <${Region} id="lateral" shape=${{ cx: frontLateralX, cy: 110, rx: 6, ry: 12 }} on=${value.includes('lateral')} toggle=${toggle} />
          <${Region} id="shin" shape=${{ cx: 60, cy: 172, rx: 10, ry: 26 }} on=${value.includes('shin')} toggle=${toggle} />
        </svg>
        <figcaption>من الأمام</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 120 220" role="group" aria-label="الركبة من الخلف">${limb}
          <${Region} id="post_thigh" shape=${{ cx: 60, cy: 50, rx: 15, ry: 24 }} on=${value.includes('post_thigh')} toggle=${toggle} />
          <${Region} id="hamstring_tendon" shape=${{ cx: backMedialX, cy: 92, rx: 6, ry: 11 }} on=${value.includes('hamstring_tendon')} toggle=${toggle} />
          <${Region} id="popliteal" shape=${{ cx: 60, cy: 108, rx: 12, ry: 10 }} on=${value.includes('popliteal')} toggle=${toggle} />
          <${Region} id="calf" shape=${{ cx: 60, cy: 160, rx: 15, ry: 30 }} flag=${true} on=${value.includes('calf')} toggle=${toggle} />
        </svg>
        <figcaption>من الخلف</figcaption>
      </figure>
    </div>
    <div class="small muted">${value.length ? `اخترت: ${value.map((v) => REGION_LABEL[v]).join('، ')}` : 'اضغط على مكان الألم (اختياري).'}</div>
    ${donor && value.includes(donor) ? html`<div class="note note-info">هذا مكان أخذ الطعم في عمليتك؛ ألم خفيف فيه متوقع في الأسابيع الأولى. أخبر أخصائيك إذا زاد.</div>` : null}
    ${value.includes('calf') ? html`<div class="note note-alert"><strong>ألم السمانة يحتاج انتباه.</strong> أجب عن سؤال السمانة بالأسفل بدقة.</div>` : null}
  </div>`;
}

/* ---------- check-in ---------- */
const SWELL = [{ id: 'less', label: 'أقل' }, { id: 'same', label: 'مثل أمس' }, { id: 'more', label: 'أكثر' }];

export function CheckinFlow({ patient, onClose, onStartExercises }) {
  const today = postOpDay(patient);
  const existing = patient.checkins.find((c) => c.day === today);
  const [c, setC] = useState(() => existing ? { ...existing } : {
    pain: null, swelling: null, givingWay: null, warmth: null, calf: null, breath: null, fever: null, wound: null, note: '', sites: [], confidence: 6,
  });
  const [result, setResult] = useState(null);
  const set = (k) => (v) => setC((x) => ({ ...x, [k]: v }));
  const required = ['pain', 'swelling', 'givingWay', 'warmth', 'calf', 'breath', 'fever', 'wound'];
  const missing = required.filter((k) => c[k] === null || c[k] === undefined);
  const setSites = (sites) => setC((x) => ({ ...x, sites, calf: sites.includes('calf') ? true : x.calf }));

  const submit = () => {
    const entry = { ...c, day: today };
    const flags = redFlagsInCheckin(entry, patient);
    const soft = [];
    if (!flags.length) {
      if (c.pain >= 6) soft.push('ألمك اليوم مرتفع. خفف شدة التمارين، واستخدم الثلج ورفع الساق.');
      if (c.swelling === 'more') soft.push('التورم زاد عن أمس. ارفع الساق واستخدم الثلج، وقلل المشي الطويل اليوم.');
      if (c.givingWay) soft.push('سجلنا الإحساس بعدم الثبات. تجنب الحركات الالتفافية وأخبر أخصائيك في الزيارة القادمة.');
    }
    dispatch({ type: 'checkin/add', pid: patient.id, checkin: { ...c } });
    setResult({ flags, soft });
  };

  if (result) {
    const red = result.flags.length > 0;
    const emergency = result.flags.some((f) => f.emergency);
    return html`<div class="stack">
      ${red ? html`<div class="redflag" role="alert">
          <div class="row"><${Icon} name="alert" size=${26} /><h2>تنبيه سريري</h2></div>
          <ul class="stack-sm" style="margin:0;padding-inline-start:18px">${result.flags.map((f) => html`<li>${f.text}</li>`)}</ul>
          <p>${emergency ? 'ضيق التنفس أو ألم الصدر حالة طارئة: اتصل بالإسعاف الآن.' : 'تواصل مع فريقك العلاجي اليوم، وإذا ساءت الأعراض توجه للطوارئ. لا تكمل تمارين اليوم حتى يرد عليك الفريق.'}</p>
          <div class="callbox"><div><div class="small muted">الإسعاف</div><div class="number">${EMERGENCY.ambulance}</div></div><${Icon} name="phone" size=${26} /></div>
          <div class="small">تم إرسال تنبيه لأخصائيك تلقائيًا. ${EMERGENCY.note}.</div>
          <p class="small muted">المنصة لا تشخّص؛ هذه إرشادات المسار المعتمد في المركز.</p>
        </div>
        <button class="btn btn-block" onClick=${() => go('clinician', { patientId: patient.id, tab: 'alerts' })}><${Icon} name="eye" size=${16} />للعرض: شاهد ما يصل للأخصائي</button>`
      : html`<div class=${`note ${result.soft.length ? 'note-warn' : 'note-ok'}`} role="status">
          <div class="row" style="margin-bottom:6px"><${Icon} name=${result.soft.length ? 'info' : 'check'} size=${20} /><strong>${result.soft.length ? 'سجلنا ملاحظتك' : 'ممتاز، سجّلنا حالة ركبتك'}</strong></div>
          ${result.soft.length ? html`<ul style="margin:0;padding-inline-start:18px" class="stack-sm">${result.soft.map((t) => html`<li>${t}</li>`)}</ul><div class="small" style="margin-top:6px">سيطّلع أخصائيك على تسجيلك.</div>` : html`<div>الألم ${c.pain}/10 · التورم ${SWELL.find((s) => s.id === c.swelling)?.label}</div>`}
        </div>
        <button class="btn btn-primary btn-lg btn-block" onClick=${onStartExercises}><${Icon} name="play" size=${16} fill=${true} />ابدأ تمارين اليوم</button>`}
      <button class="btn btn-ghost btn-block" onClick=${onClose}>رجوع للرئيسية</button>
    </div>`;
  }

  const q = (label, key, hint) => html`<div class="question"><div class="question-text">${label}${hint ? html`<div class="small muted">${hint}</div>` : null}</div><${YesNo} id=${`q-${key}`} value=${c[key]} onChange=${set(key)} /></div>`;
  const freeHit = c.note && RED_WORDS.find((w) => c.note.includes(w));
  return html`<div class="stack">
    <div><h2>كيف ركبتك اليوم؟</h2><div class="small muted">دقيقة واحدة قبل التمارين. اليوم ${today} بعد العملية.</div></div>
    <section class="card card-tight stack-sm">
      <div class="row-between"><strong>الألم الآن</strong>${c.pain !== null ? html`<span class="pill" style=${`background:color-mix(in srgb, ${painColor(c.pain)} 16%, transparent);color:var(--ink)`}>${c.pain}/10</span>` : null}</div>
      <${NRS} id="q-pain" value=${c.pain} onChange=${set('pain')} />
    </section>
    <section class="card card-tight stack-sm">
      <strong>التورم اليوم مقارنة بأمس</strong>
      <${Seg} label="التورم" options=${SWELL} value=${c.swelling} onChange=${set('swelling')} />
    </section>
    <section class="card card-tight">
      ${q('هل شعرت بعدم ثبات أو أن الركبة "خانتك"؟', 'givingWay')}
      ${q('هل توجد حرارة أو احمرار غير معتاد حول الركبة؟', 'warmth')}
      ${q('هل يوجد ألم أو تورم في الساق أو السمانة؟', 'calf')}
      ${q('هل عندك ضيق في التنفس أو ألم في الصدر؟', 'breath', 'سؤال سلامة')}
      ${q('هل حرارتك 38° أو أعلى؟', 'fever')}
      ${q('هل في الجرح إفرازات أو انفتاح أو نزيف؟', 'wound')}
    </section>
    <section class="card card-tight stack-sm">
      <strong>وين الألم بالضبط؟</strong>
      <${PainMap} side=${patient.side} graft=${patient.graft} value=${c.sites || []} onChange=${setSites} />
    </section>
    <section class="card card-tight stack-sm">
      <label for="q-note"><strong>أعراض أخرى؟</strong> <span class="small muted">(اختياري)</span></label>
      <textarea id="q-note" class="textarea" placeholder="اكتب بكلماتك…" value=${c.note} onInput=${(e) => set('note')(e.target.value)}></textarea>
      ${freeHit ? html`<div class="note note-warn small">كلامك فيه كلمة تحتاج انتباه («${freeHit}»). سيصل تنبيه لأخصائيك بعد الإرسال.</div>` : null}
      <label for="q-conf" class="small">ثقتك بركبتك اليوم: <strong class="num">${c.confidence}</strong>/10</label>
      <input id="q-conf" type="range" min="0" max="10" step="1" value=${c.confidence} onInput=${(e) => set('confidence')(Number(e.target.value))} />
    </section>
    ${missing.length ? html`<div class="small muted">باقي ${missing.length} ${missing.length === 1 ? 'سؤال' : 'أسئلة'} قبل الإرسال.</div>` : null}
    <button class="btn btn-primary btn-lg btn-block" disabled=${missing.length > 0} onClick=${submit}>إرسال</button>
    <button class="btn btn-ghost btn-block" onClick=${onClose}>إلغاء</button>
    <p class="small muted">هذه الخدمة ليست للطوارئ. في الحالات الطارئة اتصل بالإسعاف ${EMERGENCY.ambulance}.</p>
  </div>`;
}
