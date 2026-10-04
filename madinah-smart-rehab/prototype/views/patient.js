// Patient app: phone-width screens with bottom tabs. Login → home → check-in → programme →
// measure → progress → more (education, assistant, appointments, messages, notifications).
import { html, useEffect, useMemo, useState } from '../lib/h.js';
import { useStore, dispatch } from '../lib/store.js';
import { Icon, Mark, Ring, Pill, StatusPill, Meter, Modal, NRS, Seg, toast } from '../lib/ui.js';
import { LineChart } from '../lib/charts.js';
import {
  postOpDay, weekOf, phaseOf, dueToday, doneOn, adherence, streak, statusOf, readyForNext, latest, milestonesFor,
  projectFlex, getEx, dateOfDay, GRAFT_AR,
} from '../lib/engine.js';
import { fmtDateLong, fmtTime, relDay, storage, round } from '../lib/util.js';
import { CheckinFlow } from './patient-checkin.js';
import { EducationList, Article, Assistant, Appointments, Messages, NotificationSettings, RunLogModal, PlyoLevels, ExercisePreview } from './patient-more.js';
import { MeasureHub, CameraCheck } from './measure.js';
import { RTS_CONTINUUM, RUN_PROGRAM } from '../lib/data.js';

const PERSONAS = [
  { id: 'p_ahmed', note: 'المرحلة 2 · اليوم 18 · طعم وتر الرضفة' },
  { id: 'p_sara', note: 'المرحلة 1 · إصلاح غضروف هلالي' },
  { id: 'p_fahad', note: 'المرحلة 4 · برنامج الجري' },
  { id: 'p_mohammed', note: 'المرحلة 5 · مستويات القفز' },
  { id: 'p_khalid', note: 'المرحلة 6 · قبل العودة للرياضة' },
];
const TABS = [
  { id: 'home', label: 'الرئيسية', icon: 'home' },
  { id: 'program', label: 'برنامجي', icon: 'list' },
  { id: 'measure', label: 'قياس', icon: 'camera' },
  { id: 'progress', label: 'تقدّمي', icon: 'chart' },
  { id: 'more', label: 'المزيد', icon: 'grid' },
];
const EXPLAIN = {
  login: { title: 'دخول مستقل عن أنظمة المركز', points: ['الأخصائي يسجل المريض ويرسل له رابطًا ورمز QR.', 'الدخول برقم الجوال ورمز تحقق — بدون رقم هوية.', 'على iPhone: المشاركة ثم "إضافة إلى الشاشة الرئيسية" ليصبح مثل التطبيق وتصله الإشعارات.'] },
  home: { title: 'الصفحة الرئيسية', points: ['اليوم بعد العملية + المرحلة الحالية + نسبة المعايير المحققة للمرحلة القادمة.', 'مهام اليوم: التسجيل اليومي، التمارين، القياس الأسبوعي، مادة تعليمية.', 'الموعد القادم ونوعه (افتراضي أو حضوري).'] },
  checkin: { title: 'التسجيل اليومي والعلامات الحمراء', points: ['أسئلة مغلقة سريعة + خريطة ألم للركبة + نص حر.', 'إذا تحققت علامة خطر تظهر إرشادات المسار المعتمد ويصل تنبيه للفريق فورًا.', 'المنصة لا تشخّص؛ تصنّف وتوجّه حسب قواعد يعتمدها الفريق.'] },
  program: { title: 'برنامج اليوم', points: ['التمارين من مكتبة يديرها الفريق، وليست مكتوبة داخل البرمجة.', 'كل تمرين: اسم عربي وإنجليزي، عرض للحركة، الجرعة، الاحتياطات، زر "أكملت"، والألم أثناء التمرين.', 'بعض التمارين فيها "تحقق بالكاميرا" لعدّ التكرارات وقياس الزاوية.'] },
  measure: { title: 'القياس من البيت', points: ['زاوية الركبة من صورة، أو الكاميرا المباشرة، أو الجوال كمنقلة على الساق.', 'التحليل داخل الجوال؛ لا يُرفع الفيديو. يمكن إرسال نقاط الهيكل فقط.', 'هذه قياسات للمتابعة؛ قرارات الانتقال تعتمد القياس الحضوري.'] },
  progress: { title: 'رحلتي', points: ['منحنى الثني مقابل المسار المرجعي — مثل منحنيات نمو الأطفال.', 'معالم مفهومة للمريض، ومنها معالم الصلاة (الكرسي، السجود، التشهد).', '"أنت في اليوم X، وهذه المعايير التي حققتها، وسيحدد فريقك جاهزيتك."'] },
  more: { title: 'التعلّم والتواصل', points: ['مكتبة تعليمية قصيرة لكل مرحلة مع سؤال للتأكد من الفهم.', 'مساعد ذكي يجيب من المكتبة المعتمدة فقط.', 'رسائل آمنة مع الفريق — ليست للطوارئ.'] },
};

export function PatientApp() {
  const s = useStore();
  const [pid, setPid] = useState(() => storage.get('msr-persona', 'p_ahmed'));
  const [tab, setTab] = useState('home');
  const [sub, setSub] = useState(null); // {kind:'checkin'|'article'|'assistant'|...}
  const [logged, setLogged] = useState(() => storage.get('msr-logged', false));
  const p = s.patients.find((x) => x.id === pid) || s.patients[0];
  useEffect(() => { storage.set('msr-persona', pid); }, [pid]);
  const cat = s.catalog;
  const screenKey = !logged ? 'login' : sub?.kind === 'checkin' ? 'checkin' : tab;
  const go = (t) => { setSub(null); setTab(t); };
  const openSub = (kind, data) => setSub({ kind, data });
  const ex = EXPLAIN[screenKey] || EXPLAIN[tab];

  let body;
  if (!logged) body = html`<${Login} patient=${p} onDone=${() => { setLogged(true); storage.set('msr-logged', true); }} />`;
  else if (sub?.kind === 'checkin') body = html`<${CheckinFlow} patient=${p} onClose=${() => setSub(null)} onStartExercises=${() => go('program')} />`;
  else if (sub?.kind === 'article') body = html`<${Article} item=${sub.data} onBack=${() => setSub(null)} />`;
  else if (sub?.kind === 'assistant') body = html`<${Assistant} patient=${p} catalog=${cat} />`;
  else if (sub?.kind === 'appointments') body = html`<${Appointments} patient=${p} />`;
  else if (sub?.kind === 'messages') body = html`<${Messages} patient=${p} />`;
  else if (sub?.kind === 'education') body = html`<${EducationList} patient=${p} catalog=${cat} onOpen=${(e) => openSub('article', e)} />`;
  else if (sub?.kind === 'notifications') body = html`<${NotificationSettings} />`;
  else if (tab === 'home') body = html`<${Home} patient=${p} catalog=${cat} onCheckin=${() => openSub('checkin')} onTab=${go} onOpen=${openSub} />`;
  else if (tab === 'program') body = html`<${Program} patient=${p} catalog=${cat} onCheckin=${() => openSub('checkin')} />`;
  else if (tab === 'measure') body = html`<${MeasureHub} patient=${p} />`;
  else if (tab === 'progress') body = html`<${Progress} patient=${p} catalog=${cat} />`;
  else body = html`<${More} patient=${p} onOpen=${openSub} onLogout=${() => { setLogged(false); storage.set('msr-logged', false); setTab('home'); }} />`;

  return html`<div class="patient-stage">
    <div class="phone" aria-label="تطبيق المريض">
      <div class="phone-head">
        ${sub && logged ? html`<button class="icon-btn" aria-label="رجوع" onClick=${() => setSub(null)}><${Icon} name="back" /></button>` : html`<span class="brand-mark" aria-hidden="true"><${Mark} size=${28} /></span>`}
        <div class="grow" style="min-width:0"><div class="strong" style="line-height:1.2">${logged ? p.name : 'تأهيل المدينة'}</div><div class="small muted" style="line-height:1.2">${logged ? `اليوم ${postOpDay(p)} بعد العملية` : 'مسار الرباط الصليبي'}</div></div>
        ${logged ? html`<button class="icon-btn" aria-label="الرسائل" onClick=${() => openSub('messages')}><${Icon} name="chat" /></button>` : null}
      </div>
      <div class="phone-body">${body}</div>
      ${logged ? html`<nav class="tabbar" aria-label="أقسام التطبيق">
        ${TABS.map((t) => html`<button aria-current=${!sub && tab === t.id ? 'page' : undefined} onClick=${() => go(t.id)}><${Icon} name=${t.icon} size=${22} />${t.label}</button>`)}
      </nav>` : null}
    </div>
    <aside class="side-panel">
      <section class="card stack-sm">
        <span class="eyebrow eyebrow-rule">جرّب المنصة بعيون مريض مختلف</span>
        <div class="list">
          ${PERSONAS.map((x) => {
            const pp = s.patients.find((q) => q.id === x.id);
            if (!pp) return null;
            const st = statusOf(pp, cat);
            return html`<button class="list-row clickable" aria-pressed=${String(pid === x.id)} onClick=${() => { setPid(x.id); setSub(null); setTab('home'); }}
              style=${pid === x.id ? 'background:var(--accent-soft);border-radius:10px;padding-inline:10px' : 'padding-inline:10px'}>
              <span class="grow"><span class="strong">${pp.name}</span><br /><span class="small muted">${x.note}</span></span>
              <${StatusPill} code=${st.code} />
            </button>`;
          })}
        </div>
      </section>
      <section class="card explain">
        <span class="eyebrow eyebrow-rule">ماذا تعرض هذه الشاشة؟</span>
        <h2>${ex.title}</h2>
        <ul>${ex.points.map((t) => html`<li>${t}</li>`)}</ul>
      </section>
      <div class="note small">بيانات وهمية للعرض. ما تسجله هنا يُحفظ في متصفحك فقط، ويمكن مسحه من "إعادة الضبط".</div>
    </aside>
  </div>`;
}

/* ---------- login ---------- */
function Login({ patient, onDone }) {
  const [phone, setPhone] = useState('05XXXXXXXX');
  const [step, setStep] = useState(1);
  const [code, setCode] = useState('');
  return html`<div class="stack-lg">
    <div class="login-cover">
      <svg class="ring-bg" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent-soft)" stroke-width="8" />
        <path d="M50 8a42 42 0 1 1-29.7 12.3" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" opacity="0.6" />
      </svg>
      <span class="brand-mark" style="color:var(--accent)" aria-hidden="true"><${Mark} size=${44} /></span>
      <span class="eyebrow eyebrow-rule">مسار الرباط الصليبي</span>
      <h1>تعافيك بعد العملية، يومًا بيوم</h1>
      <p class="muted">تمارينك وقياساتك وفريقك في مكان واحد. سجّل دخولك برقم جوالك المسجل لدى أخصائيك.</p>
    </div>
    ${step === 1 ? html`<div class="stack">
      <div class="field"><label for="login-phone">رقم الجوال</label><input id="login-phone" class="input ltr" inputmode="tel" value=${phone} onInput=${(e) => setPhone(e.target.value)} /></div>
      <button class="btn btn-primary btn-lg btn-block" onClick=${() => setStep(2)}>أرسل رمز التحقق</button>
    </div>` : html`<div class="stack">
      <div class="note note-info small">للعرض: اكتب أي 4 أرقام.</div>
      <div class="field"><label for="login-otp">رمز التحقق</label><input id="login-otp" class="input ltr" inputmode="numeric" maxlength="4" value=${code} onInput=${(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
      <button class="btn btn-primary btn-lg btn-block" disabled=${code.length !== 4} onClick=${onDone}>دخول</button>
    </div>`}
    <section class="card card-flat stack-sm">
      <strong>أضف المنصة لشاشتك الرئيسية</strong>
      <ol class="small steps-list">
        <li>iPhone: زر المشاركة ثم "إضافة إلى الشاشة الرئيسية".</li>
        <li>Android: يظهر لك زر "تثبيت التطبيق".</li>
      </ol>
      <span class="small muted">بعدها تفتح مثل التطبيق وتصلك التذكيرات.</span>
    </section>
    <p class="small muted">بدخولك توافق على سياسة الخصوصية واستخدام بياناتك لأغراض علاجك. الخدمة ليست للطوارئ.</p>
  </div>`;
}

/* ---------- home ---------- */
function Home({ patient: p, catalog, onCheckin, onTab, onOpen }) {
  const day = postOpDay(p);
  const ph = phaseOf(p.phase, catalog);
  const ready = readyForNext(p, catalog);
  const progress = ready.results.length ? Math.round((ready.metCount / ready.results.length) * 100) : 0;
  const todayCheck = p.checkins.find((c) => c.day === day);
  const due = dueToday(p, day, catalog);
  const done = doneOn(p, day);
  const nDone = due.filter((it) => done.has(it.exId)).length;
  const lastRom = [...p.rom].reverse().find((r) => r.source !== 'clinic');
  const measureDue = !lastRom || day - lastRom.day >= 7;
  const edu = catalog.education.filter((e) => e.phases.includes(p.phase))[day % Math.max(1, catalog.education.filter((e) => e.phases.includes(p.phase)).length)];
  const next = p.appointments.find((a) => a.day >= day && a.status === 'scheduled');
  const st = statusOf(p, catalog);
  const red = st.alerts.filter((a) => a.level === 'red' && !a.acked);
  const s7 = streak(p, catalog);
  const adh = adherence(p, 7, catalog);
  const task = (doneFlag, icon, title, sub, onClick) => html`<button class="task" data-done=${String(doneFlag)} onClick=${onClick}>
    <span class="task-check"><${Icon} name="check" size=${16} stroke=${3} /></span>
    <span class="grow"><span class="task-title">${title}</span><br /><span class="small muted">${sub}</span></span>
    <${Icon} name=${icon} size=${20} /></button>`;
  const first = p.name.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  return html`<div class="stack">
    <div class="hero">
      <${Ring} value=${progress} size=${118} stroke=${7} label=${`معايير الانتقال المحققة ${progress}%`}>
        <span class="ring-num">${day}</span><span class="ring-cap">بعد العملية</span>
      <//>
      <div class="stack-sm" style="gap:0;min-width:0">
        <span class="eyebrow">${greet}، ${first} · ${fmtDateLong(new Date())}</span>
        <h1 class="hero-title">${ph.nameAr}</h1>
        <div class="hero-goal">المرحلة ${p.phase} من 6 · الأسبوع ${weekOf(day)}</div>
        <div class="hero-meter"><${Meter} value=${progress} thin label="معايير الانتقال" /><span class="num nowrap">${ready.metCount}/${ready.results.length} معايير</span></div>
      </div>
    </div>
    ${red.length ? html`<div class="redflag" role="alert"><div class="row"><${Icon} name="alert" size=${22} /><strong>تنبيه سريري مفتوح</strong></div>
      <div class="small">${red[0].text}. تم إبلاغ فريقك. تواصل معهم اليوم، وفي الطوارئ اتصل بالإسعاف 997.</div></div>` : null}
    <section class="stack-sm" style="gap:2px">
      <div class="section-label"><h3>اليوم لديك</h3><span class="small muted">${[!!todayCheck, nDone === due.length && due.length > 0].filter(Boolean).length} من ${measureDue ? 4 : 3}</span></div>
      <div class="task-list">
        ${task(!!todayCheck, 'clipboard', 'تسجيل حالة الركبة', todayCheck ? `الألم ${todayCheck.pain}/10 · تم` : 'الألم والتورم والأعراض — دقيقة واحدة', onCheckin)}
        ${task(due.length > 0 && nDone === due.length, 'dumbbell', `تمارين اليوم: ${nDone} من ${due.length}`, due.slice(0, 3).map((it) => getEx(it.exId, catalog)?.nameAr).join('، '), () => onTab('program'))}
        ${measureDue ? task(false, 'camera', 'قياس زاوية الركبة الأسبوعي', 'بالصورة أو الجوال على الساق', () => onTab('measure')) : null}
        ${edu ? task(false, 'book', `مادة اليوم: ${edu.titleAr}`, `${edu.minutes} دقيقة`, () => onOpen('article', edu)) : null}
      </div>
    </section>
    <section class="phase-card">
      <span class="eyebrow">هدف مرحلتك الحالية</span>
      <div class="small">${ph.goalAr}</div>
    </section>
    ${p.phase === 4 ? html`<section class="card card-tight row-between"><div><strong>جلسة الجري — المستوى ${p.runLevel || 1}</strong><div class="small muted">${RUN_PROGRAM[(p.runLevel || 1) - 1]?.textAr}</div></div><button class="btn btn-sm btn-primary" onClick=${() => onTab('program')}>افتح</button></section>` : null}
    ${next ? html`<section class="card card-tight">
      <span class="eyebrow">موعدك القادم</span>
      <div class="row" style="margin-top:6px"><span class=${`icon-tile ${next.type === 'virtual' ? '' : 'gold'}`}><${Icon} name=${next.type === 'virtual' ? 'video' : 'user'} /></span>
        <div class="grow"><strong>${next.type === 'virtual' ? 'عيادة افتراضية' : 'تقييم حضوري'}</strong><div class="small">${fmtDateLong(dateOfDay(p, next.day))} · ${fmtTime(next.hour)} · ${relDay(next.day - day)}</div></div></div>
      ${next.type === 'virtual' ? html`<div class="small muted" style="margin-top:6px">رابط العيادة يظهر هنا قبل الموعد بربع ساعة.</div>` : null}
    </section>` : null}
    <div class="badge-row">
      ${s7 >= 3 ? html`<span class="achv"><${Icon} name="trophy" size=${16} />${s7} أيام التزام متتالية</span>` : null}
      ${adh.pct >= 85 ? html`<span class="achv"><${Icon} name="check" size=${16} />التزام ${adh.pct}%</span>` : null}
    </div>
  </div>`;
}

/* ---------- programme ---------- */
function Program({ patient: p, catalog, onCheckin }) {
  const day = postOpDay(p);
  const due = dueToday(p, day, catalog);
  const done = doneOn(p, day);
  const others = p.program.filter((it) => !due.includes(it));
  const [completing, setCompleting] = useState(null);
  const [checking, setChecking] = useState(null);
  const [runOpen, setRunOpen] = useState(false);
  const todayCheck = p.checkins.find((c) => c.day === day);
  const highPain = todayCheck && todayCheck.pain >= 6;
  const isRest = (p.restDays || []).includes(day);
  const nDone = due.filter((it) => done.has(it.exId)).length;
  return html`<div class="stack">
    <div class="hero" style="padding-top:2px">
      <${Ring} value=${due.length ? (nDone / due.length) * 100 : 0} size=${84} stroke=${7} label="تمارين اليوم المنجزة">
        <span class="ring-num">${nDone}</span><span class="ring-cap">من ${due.length}</span>
      <//>
      <div class="stack-sm" style="gap:0"><span class="eyebrow">اليوم ${day} بعد العملية</span><h1 class="hero-title">برنامجك اليوم</h1>
        <div class="hero-goal">${due.length ? `${due.length} تمارين مستحقة اليوم` : 'لا تمارين مستحقة اليوم'}${isRest ? ' · يوم راحة موجّه' : ''}</div></div>
    </div>
    ${!todayCheck ? html`<button class="note note-info" style="text-align:start;cursor:pointer" onClick=${onCheckin}><strong>ابدأ بتسجيل حالة ركبتك</strong> — قبل التمارين.</button>` : null}
    ${highPain && !isRest ? html`<div class="note note-warn stack-sm"><strong>ألمك اليوم ${todayCheck.pain}/10</strong><span class="small">خفف الشدة أو خذ راحة إذا وجّهك أخصائيك بذلك. يوم الراحة الموجّه لا يكسر سلسلة التزامك.</span>
      <button class="btn btn-sm" onClick=${() => { dispatch({ type: 'restday/add', pid: p.id }); toast('سُجل يوم راحة موجّه — سلسلتك محفوظة'); }}>سجّل يوم راحة بتوجيه أخصائيي</button></div>` : null}
    ${isRest ? html`<div class="note note-ok small">اليوم يوم راحة موجّه. سلسلة التزامك محفوظة.</div>` : null}
    ${p.phase === 4 ? html`<section class="card stack-sm"><div class="row-between"><h3>برنامج الجري</h3><${Pill} tone="info" icon="run">المستوى ${p.runLevel || 1}<//></div>
      <div>${RUN_PROGRAM[(p.runLevel || 1) - 1]?.textAr}</div><div class="small muted">يُرفع المستوى بعد مراجعة أخصائيك لاستجابة الركبة.</div>
      <button class="btn btn-primary" onClick=${() => setRunOpen(true)}>سجّل جلسة اليوم</button></section>` : null}
    ${p.phase >= 5 ? html`<${PlyoLevels} patient=${p} catalog=${catalog} />` : null}
    ${due.map((it) => html`<${ExerciseCard} key=${it.exId} patient=${p} item=${it} catalog=${catalog} done=${done.has(it.exId)}
      onComplete=${() => setCompleting(it)} onCheck=${() => setChecking(it)} />`)}
    ${others.length ? html`<details class="card card-tight"><summary class="strong" style="cursor:pointer">تمارين أيام أخرى (${others.length})</summary>
      <div class="list" style="margin-top:8px">${others.map((it) => html`<div class="list-row"><span class="grow">${getEx(it.exId, catalog)?.nameAr}</span><span class="small muted">${it.freq}</span></div>`)}</div></details>` : null}
    ${completing ? html`<${CompleteModal} patient=${p} item=${completing} catalog=${catalog} onClose=${() => setCompleting(null)} />` : null}
    ${checking ? html`<${CameraCheck} patient=${p} mode=${getEx(checking.exId, catalog)?.camera} exercise=${getEx(checking.exId, catalog)}
      onDone=${(res) => { dispatch({ type: 'exercise/done', pid: p.id, exId: checking.exId, painDuring: null, difficulty: null, verified: res?.verified || { method: 'camera' } }); toast('تم التحقق بالكاميرا وتسجيل التمرين'); }}
      onClose=${() => setChecking(null)} />` : null}
    ${runOpen ? html`<${RunLogModal} patient=${p} onClose=${() => setRunOpen(false)} />` : null}
  </div>`;
}

function ExerciseCard({ patient: p, item, catalog, done, onComplete, onCheck }) {
  const ex = getEx(item.exId, catalog);
  const [open, setOpen] = useState(false);
  if (!ex) return null;
  const day = postOpDay(p);
  const mods = (p.modifiers || []).filter((m) => (!m.untilDay || day <= m.untilDay) && (
    (ex.cat === 'ROM' && /المدى|ثني/.test(m.textAr)) || (ex.cat === 'Hamstrings' && /هامسترينج/.test(m.textAr)) || ((ex.cat === 'Strength' || ex.cat === 'Quadriceps') && /حمل/.test(m.textAr))));
  const log = p.exlog.find((l) => l.day === day && l.exId === item.exId);
  return html`<section class="card exercise-card">
    <${ExercisePreview} ex=${ex} />
    <div class="row-between"><div><h3>${ex.nameAr}</h3><div class="small muted ltr" style="text-align:start">${ex.nameEn}</div></div>
      ${done ? html`<${Pill} tone="ok" icon="check">${log?.verified ? 'تم — متحقق بالكاميرا' : 'تم'}<//>` : null}</div>
    <div class="dose">
      <span>${item.sets} مجموعات × ${item.reps}</span>
      ${item.hold ? html`<span>ثبات ${item.hold >= 60 ? `${round(item.hold / 60, 1)} د` : `${item.hold} ث`}</span>` : null}
      <span>${item.freq}</span>
    </div>
    ${mods.map((m) => html`<div class="note note-warn small"><strong>قيد من الجراح:</strong> ${m.textAr}</div>`)}
    <button class="data-toggle" style="align-self:flex-start" onClick=${() => setOpen(!open)}>${open ? 'إخفاء الطريقة' : 'الطريقة والاحتياطات'}</button>
    ${open ? html`<ol class="small" style="margin:0;padding-inline-start:18px">${ex.cues.map((c) => html`<li>${c}</li>`)}</ol>
      ${ex.precautions && ex.precautions !== '—' ? html`<div class="note small"><strong>احتياطات:</strong> ${ex.precautions}</div>` : null}` : null}
    ${item.note ? html`<div class="small"><strong>ملاحظة أخصائيك:</strong> ${item.note}</div>` : null}
    <div class="row">
      ${done ? html`<button class="btn btn-ghost btn-sm" onClick=${() => dispatch({ type: 'exercise/undo', pid: p.id, exId: item.exId })}>تراجع</button>`
        : html`<button class="btn btn-ok" onClick=${onComplete}><${Icon} name="check" size=${16} />أكملت</button>`}
      ${ex.camera && !done ? html`<button class="btn" onClick=${onCheck}><${Icon} name="camera" size=${16} />تحقق بالكاميرا</button>` : null}
    </div>
  </section>`;
}

function CompleteModal({ patient: p, item, catalog, onClose }) {
  const ex = getEx(item.exId, catalog);
  const [pain, setPain] = useState(null);
  const [diff, setDiff] = useState('ok');
  const save = () => {
    dispatch({ type: 'exercise/done', pid: p.id, exId: item.exId, painDuring: pain, difficulty: { easy: 3, ok: 5, hard: 8 }[diff] });
    toast(pain >= 6 ? 'سُجل التمرين. الألم مرتفع — خفف الجرعة وأخبر أخصائيك.' : 'أحسنت! سُجل التمرين');
    onClose();
  };
  return html`<${Modal} title=${`أكملت: ${ex?.nameAr}`} onClose=${onClose}
    footer=${html`<button class="btn btn-primary" disabled=${pain === null} onClick=${save}>حفظ</button><button class="btn btn-ghost" onClick=${onClose}>إلغاء</button>`}>
    <div class="stack-sm"><strong>الألم أثناء التمرين</strong><${NRS} id="ex-pain" value=${pain} onChange=${setPain} /></div>
    <div class="stack-sm"><strong>كيف كانت الصعوبة؟</strong><${Seg} label="الصعوبة" options=${[{ id: 'easy', label: 'سهل' }, { id: 'ok', label: 'مناسب' }, { id: 'hard', label: 'صعب' }]} value=${diff} onChange=${setDiff} /></div>
    <div class="small muted">لا مكافأة على تحمّل الألم: إذا زاد الألم عن 5/10 أوقف التمرين.</div>
  </${Modal}>`;
}

/* ---------- progress ---------- */
function Progress({ patient: p, catalog }) {
  const day = postOpDay(p);
  const L = latest(p);
  const ready = readyForNext(p, catalog);
  const ms = milestonesFor(p, catalog);
  const adh = adherence(p, 14, catalog);
  const proj = projectFlex(p, 120);
  const pains = p.checkins.filter((c) => day - c.day <= 45).map((c) => ({ x: c.day, y: c.pain }));
  const flexPts = p.rom.filter((r) => Number.isFinite(r.flex)).map((r) => ({ x: r.day, y: r.flex }));
  const xMax = Math.max(day + (proj?.line ? 10 : 2), 21);
  const band = catalog.corridor.flex.filter((b) => b.x <= Math.max(xMax, 28));
  const remaining = ready.results.filter((r) => r.state !== 'met');
  const phases = catalog.phases;
  return html`<div class="stack">
    <div class="hero" style="padding-top:2px">
      <${Ring} value=${ready.results.length ? (ready.metCount / ready.results.length) * 100 : 0} size=${84} stroke=${7} label="معايير الانتقال المحققة">
        <span class="ring-num">${ready.metCount}</span><span class="ring-cap">من ${ready.results.length}</span>
      <//>
      <div class="stack-sm" style="gap:0"><span class="eyebrow">المرحلة ${p.phase} من 6</span><h1 class="hero-title">رحلتي</h1>
        <div class="hero-goal">معايير ${ready.to === 'rts' ? 'العودة للرياضة' : 'المرحلة القادمة'} · يحدد فريقك جاهزيتك</div></div>
    </div>
    <section class="card stack-sm">
      <p>أنت في <strong>اليوم ${day}</strong> بعد العملية، في <strong>المرحلة ${p.phase} من 6</strong>. حققت <strong>${ready.metCount} من ${ready.results.length}</strong> من معايير ${ready.to === 'rts' ? 'العودة للرياضة' : 'المرحلة القادمة'}، وسيحدد فريقك العلاجي جاهزيتك.</p>
      ${remaining.length ? html`<div class="small"><strong>ما زال مطلوبًا:</strong><ul style="margin:4px 0 0;padding-inline-start:18px">${remaining.slice(0, 4).map((r) => html`<li>${r.c.textAr}</li>`)}</ul></div>` : html`<div class="note note-ok small">المعايير تبدو مكتملة — بانتظار مراجعة أخصائيك واعتماده.</div>`}
    </section>
    <section class="card">
      <h3 style="margin-bottom:6px">ثني الركبة مقابل المسار المتوقع</h3>
      <${LineChart} label="منحنى ثني الركبة" unit="°" xFormat=${(x) => `ي${x}`} xDomain=${[0, xMax]} yDomain=${[40, 150]}
        series=${[{ id: 'flex', label: 'ثني ركبتك', color: 'var(--series-1)', points: flexPts.filter((q) => q.x <= xMax) }, ...(proj?.line ? [{ id: 'proj', label: 'تقدير', color: 'var(--series-1)', dashed: true, points: proj.line }] : [])]}
        band=${{ label: 'المسار المتوقع', points: band }} />
      ${proj?.days ? html`<div class="small muted">بالمعدل الحالي (${proj.slopePerWeek}° أسبوعيًا) تقدير الوصول لـ120°: خلال ${proj.days} يومًا تقريبًا. تقدير إحصائي وليس وعدًا.</div>` : null}
    </section>
    ${pains.length > 2 ? html`<section class="card"><h3 style="margin-bottom:6px">الألم</h3>
      <${LineChart} label="منحنى الألم" xFormat=${(x) => `ي${x}`} yDomain=${[0, 10]} series=${[{ id: 'pain', label: 'الألم', color: 'var(--series-2)', points: pains, area: true }]} /></section>` : null}
    <div class="grid-2">
      <div class="stat"><span class="label">الالتزام (14 يومًا)</span><span class="value">${adh.pct ?? '—'}%</span><span class="sub">${adh.done} من ${adh.planned} تمرين</span></div>
      <div class="stat"><span class="label">آخر قياس</span><span class="value num">${L.flex ?? '—'}°</span><span class="sub">ثني · فرد ${L.extDeficit === 0 ? 'كامل' : `ينقص ${L.extDeficit ?? '—'}°`}</span></div>
    </div>
    <section class="card"><h3 style="margin-bottom:8px">المراحل</h3>
      <div class="journey">
        ${phases.map((ph) => html`<div class="journey-step" data-state=${ph.id < p.phase ? 'done' : ph.id === p.phase ? 'current' : 'next'}>
          <span class="journey-node">${ph.id < p.phase ? html`<${Icon} name="check" size=${14} stroke=${3} />` : ph.id}</span>
          <div><div class="strong">${ph.nameAr}</div><div class="small muted">${ph.typical}</div></div></div>`)}
        ${RTS_CONTINUUM.map((r) => html`<div class="journey-step" data-state=${(p.rtsStage || 0) >= r.id ? 'done' : 'next'}>
          <span class="journey-node">${(p.rtsStage || 0) >= r.id ? html`<${Icon} name="check" size=${14} stroke=${3} />` : html`<${Icon} name="flag" size=${13} />`}</span>
          <div><div class="strong">${r.nameAr}</div><div class="small muted">${r.descAr} — باعتماد الفريق</div></div></div>`)}
      </div></section>
    <section class="card"><h3 style="margin-bottom:6px">معالم رحلتك</h3>
      ${ms.map((m) => html`<div class="milestone" data-done=${String(m.done)}><span class="milestone-icon">${m.done ? html`<${Icon} name="check" size=${14} stroke=${3} />` : null}</span><span>${m.textAr}</span></div>`)}
      <div class="small muted" style="margin-top:6px">زوايا الصلاة من دراسة قياس الحركة أثناء الصلاة؛ العودة لها بإذن أخصائيك${p.meniscusRepair ? '، وخاصة بعد إصلاح الغضروف' : ''}.</div>
    </section>
  </div>`;
}

/* ---------- more ---------- */
function More({ patient: p, onOpen, onLogout }) {
  const item = (kind, icon, title, sub, tone = '') => html`<button class="list-row clickable" onClick=${() => onOpen(kind)}>
    <span class=${`icon-tile ${tone}`}><${Icon} name=${icon} /></span><span class="grow"><span class="strong">${title}</span><br /><span class="small muted">${sub}</span></span><${Icon} name="forward" size=${18} /></button>`;
  return html`<div class="stack">
    <div class="stack-sm" style="gap:0"><span class="eyebrow">${p.name}</span><h1 class="hero-title">المزيد</h1></div>
    <section class="card card-tight list">
      ${item('education', 'book', 'تعلّم', 'مواد قصيرة لمرحلتك')}
      ${item('assistant', 'sparkle', 'اسأل مساعد التأهيل', 'إجابات من المكتبة المعتمدة')}
      ${item('appointments', 'calendar', 'مواعيدي', 'افتراضية وحضورية')}
      ${item('messages', 'chat', 'رسائل الفريق', 'ليست للطوارئ')}
      ${item('notifications', 'bell', 'الإشعارات', 'التذكيرات، وقت الصلاة، وضع رمضان')}
    </section>
    <section class="card card-tight stack-sm">
      <strong>ملفي</strong>
      <dl class="kv"><dt>الركبة</dt><dd>${p.side === 'R' ? 'اليمنى' : 'اليسرى'}</dd><dt>الطعم</dt><dd>${GRAFT_AR[p.graft]}</dd><dt>الجراح</dt><dd>${p.surgeon}</dd><dt>أخصائيك</dt><dd>${p.pt}</dd><dt>هدفك</dt><dd>${p.goal}</dd></dl>
    </section>
    <button class="btn btn-ghost" onClick=${onLogout}><${Icon} name="logout" size=${16} />تسجيل الخروج</button>
  </div>`;
}
