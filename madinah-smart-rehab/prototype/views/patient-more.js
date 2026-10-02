// Patient "more" area: education, AI assistant, appointments, secure messages, notification settings,
// plus the running-session log and jump-training levels used by the programme screen.
import { html, useEffect, useRef, useState } from '../lib/h.js';
import { Icon, Pill, Modal, NRS, Seg, AiMark, toast, Figure } from '../lib/ui.js';
import { postOpDay, dateOfDay, getEx } from '../lib/engine.js';
import { dispatch } from '../lib/store.js';
import { askAssistant, aiErrorText, getSample } from '../lib/ai.js';
import { EMERGENCY, RED_WORDS, RUN_PROGRAM, PLYO_LEVELS } from '../lib/data.js';
import { fmtDateLong, fmtTime, fmtDateTime, relDay, storage } from '../lib/util.js';

/* ---------- education ---------- */
const QUIZ = {
  ed_redflags: { q: 'لاحظت تورمًا وألمًا في السمانة اليوم. ماذا تفعل؟', options: ['أكمل التمارين وأنتظر', 'أتواصل مع فريقي فورًا', 'أضع وسادة تحت الركبة'], correct: 1 },
  ed_extension: { q: 'أين تضع اللفافة عند تمرين فرد الركبة؟', options: ['تحت الركبة', 'تحت الكعب', 'تحت الفخذ'], correct: 1 },
  ed_running: { q: 'متى تبدأ الجري؟', options: ['بعد 3 أشهر تلقائيًا', 'عندما أشعر أني بخير', 'بعد تقييم حضوري واعتماد أخصائيي'], correct: 2 },
};

export function EducationList({ patient, catalog, onOpen }) {
  const [filter, setFilter] = useState('mine');
  const items = catalog.education.filter((e) => filter === 'all' || e.phases.includes(patient.phase) || e.pinned);
  return html`<div class="stack">
    <div class="row-between"><h2>تعلّم</h2><${Seg} label="تصفية" options=${[{ id: 'mine', label: 'لمرحلتي' }, { id: 'all', label: 'الكل' }]} value=${filter} onChange=${setFilter} /></div>
    <div class="list">
      ${items.map((e) => html`<button class="list-row clickable" onClick=${() => onOpen(e)}>
        <span class=${`icon-tile ${e.pinned ? 'alert' : ''}`}><${Icon} name=${e.pinned ? 'shield' : 'book'} /></span>
        <span class="grow"><span class="strong">${e.titleAr}</span><br /><span class="small muted">${e.cat} · ${e.minutes} د</span></span>
        <${Icon} name="forward" size=${18} />
      </button>`)}
    </div>
  </div>`;
}

export function Article({ item, onBack }) {
  const quiz = QUIZ[item.id];
  const [pick, setPick] = useState(null);
  return html`<div class="stack">
    <button class="btn btn-ghost btn-sm" style="align-self:flex-start" onClick=${onBack}><${Icon} name="back" size=${16} />رجوع</button>
    <span class="eyebrow">${item.cat} · ${item.minutes} دقيقة</span>
    <h2>${item.titleAr}</h2>
    <div class="exercise-media"><span class="media-label">فيديو قصير 60–120 ثانية — يُصوَّر في المركز</span><${Icon} name="video" size=${40} /></div>
    <ul class="stack-sm" style="margin:0;padding-inline-start:20px">${item.body.map((b) => html`<li>${b}</li>`)}</ul>
    ${quiz ? html`<section class="card card-tight stack-sm">
      <strong>تأكد من فهمك</strong><div>${quiz.q}</div>
      ${quiz.options.map((o, i) => html`<button class=${`btn btn-block ${pick === i ? (i === quiz.correct ? 'btn-ok' : 'btn-danger') : ''}`} onClick=${() => setPick(i)}>${o}</button>`)}
      ${pick !== null ? html`<div class=${`note ${pick === quiz.correct ? 'note-ok' : 'note-warn'}`}>${pick === quiz.correct ? 'إجابة صحيحة.' : 'راجع النقاط بالأعلى ثم جرّب مرة ثانية.'}</div>` : null}
    </section>` : null}
  </div>`;
}

/* ---------- AI assistant ---------- */
export function Assistant({ patient, catalog }) {
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState('');
  const [avail, setAvail] = useState('checking');
  const ctl = useRef(null);
  useEffect(() => { let on = true; getSample().then((s) => on && setAvail(s ? 'yes' : 'no')); return () => { on = false; ctl.current?.abort(); }; }, []);
  const suggestions = ['متى أقدر أرجع للسجود في الصلاة؟', 'وش أسوي إذا زاد التورم بعد التمرين؟', 'ليش فرد الركبة مهم؟'];
  const send = async (text) => {
    const msg = (text ?? draft).trim();
    if (!msg || busy) return;
    setDraft('');
    const redHit = RED_WORDS.find((w) => msg.includes(w));
    const next = [...turns, { role: 'user', content: msg }];
    setTurns(next);
    if (redHit) {
      setTurns([...next, { role: 'system', content: `كلامك فيه عرض يحتاج تقييمًا سريعًا («${redHit}»). تواصل مع فريقك الآن، وفي ضيق التنفس أو ألم الصدر اتصل بالإسعاف ${EMERGENCY.ambulance}. سجّل الأعراض في التسجيل اليومي ليصل تنبيه لأخصائيك.` }]);
    }
    if (avail !== 'yes') {
      setTurns((t) => [...t, { role: 'assistant', content: aiErrorText('unavailable'), error: true }]);
      return;
    }
    setBusy(true); setLive('');
    ctl.current = new AbortController();
    try {
      const { text } = await askAssistant(patient, next.filter((t) => t.role !== 'system'), { onText: ({ text: tx }) => setLive(tx), signal: ctl.current.signal, cat: catalog });
      setTurns((t) => [...t, { role: 'assistant', content: text }]);
    } catch (e) {
      const m = aiErrorText(e?.code);
      if (e?.text) setTurns((t) => [...t, { role: 'assistant', content: e.text }]);
      if (m) setTurns((t) => [...t, { role: 'assistant', content: m, error: true }]);
    } finally { setBusy(false); setLive(''); }
  };
  return html`<div class="stack">
    <div class="row-between"><h2>مساعد التأهيل</h2><${AiMark} label="ذكاء اصطناعي" /></div>
    <div class="note note-info small">يجيب من المكتبة التثقيفية المعتمدة فقط، ولا يشخّص ولا يغيّر برنامجك. ليس للطوارئ.</div>
    ${avail === 'no' ? html`<div class="note small">في هذا العرض يعمل المساعد عند فتح النموذج داخل Claude. في المنصة الحقيقية يُربط بنموذج لغوي مستضاف داخل المملكة.</div>` : null}
    <div class="chat" aria-live="polite">
      ${turns.length === 0 ? html`<div class="stack-sm"><span class="small muted">جرّب سؤالًا:</span>${suggestions.map((s) => html`<button class="chip" onClick=${() => send(s)}>${s}</button>`)}</div>` : null}
      ${turns.map((t) => html`<div class=${`bubble ${t.role === 'user' ? 'bubble-me' : t.role === 'system' ? 'bubble-system' : 'bubble-them'}`}>${t.content}</div>`)}
      ${busy ? html`<div class="bubble bubble-them">${live || 'يفكر…'}</div>` : null}
    </div>
    <div class="composer">
      <label for="ai-q" class="sr-only">سؤالك</label>
      <textarea id="ai-q" class="textarea" rows="1" placeholder="اكتب سؤالك…" value=${draft} onInput=${(e) => setDraft(e.target.value)}
        onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}></textarea>
      ${busy ? html`<button class="btn" onClick=${() => ctl.current?.abort()}>إيقاف</button>` : html`<button class="btn btn-primary" onClick=${() => send()} aria-label="إرسال"><${Icon} name="send" size=${16} /></button>`}
    </div>
  </div>`;
}

/* ---------- appointments ---------- */
export function Appointments({ patient }) {
  const today = postOpDay(patient);
  const up = patient.appointments.filter((a) => a.day >= today && a.status === 'scheduled');
  const past = patient.appointments.filter((a) => a.day < today).slice(-6).reverse();
  const row = (a) => html`<div class="list-row">
    <span class=${`icon-tile ${a.type === 'virtual' ? '' : 'gold'}`}><${Icon} name=${a.type === 'virtual' ? 'video' : 'user'} /></span>
    <span class="grow"><span class="strong">${a.type === 'virtual' ? 'عيادة افتراضية' : 'تقييم حضوري'}</span> <span class="small muted">· ${a.purpose}</span><br />
      <span class="small">${fmtDateLong(dateOfDay(patient, a.day))} · ${fmtTime(a.hour)}</span></span>
    ${a.status === 'missed' ? html`<${Pill} tone="warn" icon="alert">فائت<//>` : a.status === 'done' ? html`<${Pill} tone="ok" icon="check">تم<//>` : html`<${Pill} tone="info" icon="clock">${relDay(a.day - today)}<//>`}
  </div>`;
  return html`<div class="stack">
    <h2>مواعيدي</h2>
    <div class="note small">الحجز الرسمي يتم عبر نظام المركز؛ المنصة تذكّرك وتوضح نوع الزيارة.</div>
    <section class="card card-tight"><h3 style="margin-bottom:6px">القادمة</h3><div class="list">${up.length ? up.map(row) : html`<div class="small muted">لا مواعيد قادمة.</div>`}</div></section>
    <section class="card card-tight"><h3 style="margin-bottom:6px">السابقة</h3><div class="list">${past.map(row)}</div></section>
  </div>`;
}

/* ---------- secure messages ---------- */
export function Messages({ patient }) {
  const [draft, setDraft] = useState('');
  const send = () => {
    const t = draft.trim();
    if (!t) return;
    dispatch({ type: 'message/send', pid: patient.id, from: 'patient', text: t });
    setDraft('');
    toast('وصلت رسالتك لأخصائيك');
  };
  return html`<div class="stack">
    <h2>رسائل الفريق</h2>
    <div class="note note-warn small"><strong>هذه الخدمة ليست للطوارئ.</strong> الرد خلال أوقات العمل. في الطوارئ اتصل بالإسعاف ${EMERGENCY.ambulance}.</div>
    <div class="chat">
      ${patient.messages.map((m) => html`<div class=${`bubble ${m.from === 'patient' ? 'bubble-me' : 'bubble-them'}`}>
        ${m.text}<div class="small" style="opacity:.75;margin-top:4px">${m.from === 'patient' ? 'أنت' : patient.pt} · ${fmtDateTime(m.ts)}</div></div>`)}
    </div>
    <div class="composer">
      <label for="msg-in" class="sr-only">رسالتك</label>
      <textarea id="msg-in" class="textarea" rows="1" placeholder="اكتب رسالتك لأخصائيك…" value=${draft} onInput=${(e) => setDraft(e.target.value)}></textarea>
      <button class="btn btn-primary" onClick=${send} aria-label="إرسال"><${Icon} name="send" size=${16} /></button>
    </div>
  </div>`;
}

/* ---------- notification settings ---------- */
const NOTIF_DEFAULT = { program: true, remaining: true, appointment: true, milestone: true, prayerQuiet: true, ramadan: false, companion: false };
export function NotificationSettings() {
  const [s, setS] = useState(() => ({ ...NOTIF_DEFAULT, ...storage.get('msr-notif', {}) }));
  const toggle = (k) => { const n = { ...s, [k]: !s[k] }; setS(n); storage.set('msr-notif', n); };
  const row = (k, title, sub) => html`<label class="question" for=${`n-${k}`}><span class="question-text">${title}<br /><span class="small muted">${sub}</span></span>
    <input id=${`n-${k}`} type="checkbox" checked=${s[k]} onChange=${() => toggle(k)} style="width:22px;height:22px" /></label>`;
  return html`<div class="stack">
    <h2>الإشعارات</h2>
    <section class="card card-tight">
      ${row('program', 'تذكير البرنامج', '9:00 ص — لديك برنامج تأهيلي اليوم')}
      ${row('remaining', 'التمارين المتبقية', '6:00 م — بقي تمرينان لإكمال برنامج اليوم')}
      ${row('appointment', 'المواعيد', 'قبل يوم من العيادة الافتراضية أو الحضورية')}
      ${row('milestone', 'الإنجازات', 'مثل اعتماد انتقالك لمرحلة جديدة')}
      ${row('prayerQuiet', 'لا إشعارات وقت الصلاة', 'تؤجل التذكيرات حتى تنتهي الصلاة')}
      ${row('ramadan', 'وضع رمضان', 'التذكير بعد الإفطار وقبل السحور')}
      ${row('companion', 'مرافق التأهيل', 'يستلم فرد من أسرتك نسخة من التذكير بموافقتك')}
    </section>
    <div class="small muted">على iPhone تعمل الإشعارات بعد إضافة المنصة للشاشة الرئيسية: زر المشاركة ثم "إضافة إلى الشاشة الرئيسية".</div>
  </div>`;
}

/* ---------- running session log ---------- */
export function RunLogModal({ patient, onClose }) {
  const level = patient.runLevel || 1;
  const [r, setR] = useState({ painDuring: null, painAfter: null, swelling: 'none', completed: 'yes' });
  const ok = r.painDuring !== null && r.painAfter !== null;
  const save = () => {
    dispatch({ type: 'run/log', pid: patient.id, run: { level, ...r } });
    toast('سُجلت جلسة الجري — سيراجع أخصائيك الاستجابة قبل رفع المستوى');
    onClose();
  };
  return html`<${Modal} title="تسجيل جلسة الجري" onClose=${onClose} footer=${html`<button class="btn btn-primary" disabled=${!ok} onClick=${save}>حفظ الجلسة</button><button class="btn btn-ghost" onClick=${onClose}>إلغاء</button>`}>
    <div class="note note-info small">المستوى ${level}: ${RUN_PROGRAM[level - 1]?.textAr}</div>
    <div class="stack-sm"><strong>الألم أثناء الجري</strong><${NRS} id="run-during" value=${r.painDuring} onChange=${(v) => setR({ ...r, painDuring: v })} /></div>
    <div class="stack-sm"><strong>الألم بعد الجري</strong><${NRS} id="run-after" value=${r.painAfter} onChange=${(v) => setR({ ...r, painAfter: v })} /></div>
    <div class="stack-sm"><strong>التورم لاحقًا (أو صباح الغد)</strong><${Seg} label="التورم" options=${[{ id: 'none', label: 'لا يوجد' }, { id: 'mild', label: 'خفيف' }, { id: 'increased', label: 'زاد' }]} value=${r.swelling} onChange=${(v) => setR({ ...r, swelling: v })} /></div>
    <div class="stack-sm"><strong>هل أكملت الجلسة؟</strong><${Seg} label="الإكمال" options=${[{ id: 'yes', label: 'نعم' }, { id: 'partial', label: 'جزئيًا' }, { id: 'no', label: 'لا' }]} value=${r.completed} onChange=${(v) => setR({ ...r, completed: v })} /></div>
    <div class="small muted">قاعدة مراقبة الألم: ألم 5/10 أو أقل أثناء النشاط، ويعود لمستواه صباح اليوم التالي.</div>
  </${Modal}>`;
}

/* ---------- jump-training levels ---------- */
export function PlyoLevels({ patient, catalog }) {
  return html`<section class="card stack-sm">
    <div class="row-between"><h3>تدريب القفز</h3><span class="small muted">يُفتح كل مستوى بقرار أخصائيك</span></div>
    ${PLYO_LEVELS.map((L) => {
      const open = L.level <= (patient.plyoLevel || 0);
      return html`<div class="lock-level" data-locked=${String(!open)}>
        <${Icon} name=${open ? 'unlock' : 'lock'} size=${20} />
        <div class="grow"><div class="strong">${L.nameAr}</div><div class="small muted">${L.ex.map((id) => getEx(id, catalog)?.nameAr).join('، ')}</div></div>
        ${open ? html`<${Pill} tone="ok" icon="check">مفتوح<//>` : html`<${Pill} tone="plain" icon="lock">مقفل<//>`}
      </div>`;
    })}
  </section>`;
}

export function ExercisePreview({ ex }) {
  return html`<div class="exercise-media"><span class="media-label">عرض الحركة — يُستبدل بفيديو المركز</span><${Figure} motion=${ex.motion} /></div>`;
}
