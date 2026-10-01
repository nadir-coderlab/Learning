// Appointments, alerts, messages and the per-patient record.
import { html, useEffect, useRef, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Field, Empty, toast } from '../../lib/ui.js';
import { computeAlerts, dateOfDay, postOpDay } from '../../lib/engine.js';
import { dispatch } from '../../lib/store.js';
import { fmtDateLong, fmtDateTime, fmtTime, relDay, uid } from '../../lib/util.js';
import { BY, Choice, FieldError, num } from './common.js';

/* ---------- المواعيد ---------- */
const AP_STATUS = {
  scheduled: { tone: 'info', icon: 'clock', label: 'مجدول' },
  done: { tone: 'ok', icon: 'check', label: 'تم' },
  missed: { tone: 'alert', icon: 'x', label: 'فائت' },
};

function ApptList({ p, items, day }) {
  return html`<div class="list">${items.map((a) => {
    const v = a.type === 'virtual';
    const s = AP_STATUS[a.status] || AP_STATUS.scheduled;
    return html`<div class="list-row wrap" key=${a.id}>
      <span class=${`icon-tile ${v ? '' : 'gold'}`} aria-hidden="true"><${Icon} name=${v ? 'video' : 'user'} size=${18} /></span>
      <span class="stack-sm grow" style="gap:0;min-width:180px">
        <strong>${fmtDateLong(dateOfDay(p, a.day))} · ${fmtTime(a.hour)}</strong>
        <span class="small muted">${a.purpose} · اليوم ${a.day} بعد العملية (${relDay(a.day - day)})</span>
      </span>
      <span class="row" style="gap:6px">
        <${Pill} tone=${v ? 'info' : 'plain'} icon=${v ? 'video' : 'user'}>${v ? 'افتراضي' : 'حضوري'}<//>
        <${Pill} tone=${s.tone} icon=${s.icon}>${s.label}<//>
      </span>
    </div>`;
  })}</div>`;
}

function ApptForm({ p }) {
  const [f, setF] = useState({ type: 'virtual', inDays: '3', hour: '10', purpose: '' });
  const [err, setErr] = useState('');
  const day = postOpDay(p);
  const submit = (e) => {
    e.preventDefault();
    const n = num(f.inDays);
    if (!Number.isInteger(n) || n < 0 || n > 120) return setErr('عدد الأيام بين 0 و120.');
    const purpose = f.purpose.trim() || (f.type === 'virtual' ? 'عيادة افتراضية' : 'تقييم حضوري');
    const appointment = { day: day + n, hour: Number(f.hour), type: f.type, purpose, status: 'scheduled' };
    dispatch({ type: 'appointment/add', pid: p.id, id: uid('ap'), appointment, by: BY });
    setErr(''); setF({ ...f, purpose: '' });
    toast(`حُجز موعد ${f.type === 'virtual' ? 'افتراضي' : 'حضوري'} ${relDay(n)} الساعة ${fmtTime(Number(f.hour))}`);
    return undefined;
  };
  const when = fmtDateLong(dateOfDay(p, day + (Number.isFinite(num(f.inDays)) ? num(f.inDays) : 0)));
  return html`<form class="stack" onSubmit=${submit} noValidate>
    <div class="form-grid">
      <div class="field"><span class="label">نوع الموعد</span>
        <${Choice} id="appt-type" label="نوع الموعد" value=${f.type} onChange=${(v) => setF({ ...f, type: v })}
          options=${[{ id: 'virtual', label: 'افتراضي' }, { id: 'inperson', label: 'حضوري' }]} /></div>
      <${Field} label="بعد كم يوم" htmlFor="appt-in" hint=${when}>
        <input class="input num" id="appt-in" type="number" min="0" max="120" value=${f.inDays} onInput=${(e) => setF({ ...f, inDays: e.currentTarget.value })} /><//>
      <${Field} label="الساعة" htmlFor="appt-hour">
        <select class="select" id="appt-hour" value=${f.hour} onChange=${(e) => setF({ ...f, hour: e.currentTarget.value })}>
          ${Array.from({ length: 13 }, (_, i) => i + 8).map((h) => html`<option value=${String(h)}>${fmtTime(h)}</option>`)}</select><//>
      <${Field} label="الغرض" htmlFor="appt-purpose">
        <input class="input" id="appt-purpose" type="text" placeholder=${f.type === 'virtual' ? 'عيادة افتراضية' : 'تقييم حضوري'} value=${f.purpose} onInput=${(e) => setF({ ...f, purpose: e.currentTarget.value })} /><//>
    </div>
    <${FieldError} text=${err} />
    <div><button type="submit" class="btn btn-primary" id="appt-save"><${Icon} name="calendar" size=${16} />حجز الموعد</button></div>
  </form>`;
}

export function AppointmentsTab({ p }) {
  const day = postOpDay(p);
  const [showAll, setShowAll] = useState(false);
  const all = p.appointments || [];
  const upcoming = all.filter((a) => a.day >= day && a.status === 'scheduled');
  const past = all.filter((a) => !(a.day >= day && a.status === 'scheduled')).sort((a, b) => b.day - a.day);
  const pastShown = showAll ? past : past.slice(0, 6);
  const done = past.filter((a) => a.status === 'done');
  return html`<div class="stack-lg">
    <${Card} title="المواعيد القادمة" eyebrow=${`${upcoming.length} موعد`}>
      ${upcoming.length ? html`<${ApptList} p=${p} items=${upcoming} day=${day} />` : html`<${Empty} icon="calendar" title="لا مواعيد قادمة" />`}
    <//>
    <${Card} title="حجز موعد" eyebrow="يظهر للمريض في تطبيقه"><${ApptForm} p=${p} /><//>
    <${Card} title="المواعيد السابقة" eyebrow=${`${done.filter((a) => a.type === 'virtual').length} افتراضية و${done.filter((a) => a.type !== 'virtual').length} حضورية منجزة`}
      actions=${past.length > 6 ? html`<button type="button" class="btn btn-sm btn-ghost" id="appt-show-all" onClick=${() => setShowAll(!showAll)}>${showAll ? 'عرض أقل' : `عرض الكل (${past.length})`}</button>` : null}>
      ${past.length ? html`<${ApptList} p=${p} items=${pastShown} day=${day} />` : html`<p class="small muted">لا مواعيد سابقة.</p>`}
    <//>
  </div>`;
}

/* ---------- التنبيهات ---------- */
function AlertRow({ p, a, rule, day }) {
  const [note, setNote] = useState('');
  const safe = a.key.replace(/[^a-z0-9_-]/gi, '-');
  const ack = () => {
    dispatch({ type: 'alert/ack', pid: p.id, key: a.key, label: a.text, by: BY, note: note.trim() });
    toast('سُجلت مراجعة التنبيه');
  };
  const red = a.level === 'red';
  return html`<div class=${`alert-row ${a.acked ? 'is-acked' : ''}`}>
    <span class="severity-stripe" style=${`background:${a.acked ? 'var(--line-strong)' : red ? 'var(--alert)' : 'var(--warn-mark)'}`}></span>
    <div class="stack-sm" style="gap:6px;min-width:0">
      <div class="row" style="gap:6px">
        <${Pill} tone=${red ? 'alert' : 'warn'} icon="alert">${red ? 'تنبيه سريري' : 'يحتاج مراجعة'}<//>
        ${a.emergency ? html`<${Pill} tone="alert" icon="phone">طوارئ — 997<//>` : null}
        <span class="small muted">اليوم ${a.day} (${relDay(a.day - day)})</span>
      </div>
      <strong>${a.text}</strong>
      ${rule ? html`<span class="small muted">القاعدة: ${rule.nameAr} — ${rule.why}</span>` : null}
      ${a.acked ? html`<div class="row small" style="gap:6px"><${Pill} tone="ok" icon="check">تمت المراجعة<//>
          <span>${a.ack.by} · ${fmtDateTime(a.ack.ts)}</span>${a.ack.note ? html`<span class="muted">— ${a.ack.note}</span>` : null}</div>`
        : html`<div class="row" style="gap:6px;align-items:flex-end">
          <div class="field grow" style="min-width:180px"><label class="sr-only" for=${`ack-note-${safe}`}>ملاحظة المراجعة</label>
            <input class="input" id=${`ack-note-${safe}`} type="text" placeholder="ملاحظة (اختياري): ماذا فعلت؟" value=${note} onInput=${(e) => setNote(e.currentTarget.value)} /></div>
          <button type="button" class="btn btn-sm btn-primary" id=${`ack-${safe}`} onClick=${ack}><${Icon} name="check" size=${15} />تمت المراجعة</button>
        </div>`}
    </div>
  </div>`;
}

export function AlertsTab({ p, cat }) {
  const day = postOpDay(p);
  const rules = Object.fromEntries(cat.rules.map((r) => [r.id, r]));
  const alerts = computeAlerts(p, cat).sort((x, y) => Number(x.acked) - Number(y.acked) || (x.level === 'red' ? -1 : 1) - (y.level === 'red' ? -1 : 1) || y.day - x.day);
  const open = alerts.filter((a) => !a.acked).length;
  return html`<div class="stack">
    <div class="note note-info row" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><${Icon} name="info" size=${16} />
      <span>«تمت المراجعة» تعني أنك اطلعت على التنبيه وتصرفت؛ لا تحذف البيانات وتُسجل باسمك. في الحالات الطارئة يُوجَّه المريض للإسعاف 997.</span></div>
    <${Card} title="التنبيهات" eyebrow=${open ? `${open} مفتوح` : 'لا تنبيهات مفتوحة'}>
      ${alerts.length ? html`<div class="stack">${alerts.map((a) => html`<${AlertRow} key=${a.key} p=${p} a=${a} rule=${rules[a.ruleId]} day=${day} />`)}</div>`
        : html`<${Empty} icon="check" title="لا تنبيهات خلال آخر 7 أيام" />`}
    <//>
  </div>`;
}

/* ---------- الرسائل ---------- */
export function MessagesTab({ p }) {
  const [text, setText] = useState('');
  const box = useRef(null);
  const msgs = p.messages || [];
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs.length]);
  const send = (e) => {
    e?.preventDefault?.();
    const t = text.trim();
    if (!t) return;
    dispatch({ type: 'message/send', pid: p.id, from: 'pt', text: t });
    setText('');
    toast('أُرسلت الرسالة للمريض');
  };
  return html`<div class="stack">
    <div class="note note-warn row" style="gap:8px" role="note"><${Icon} name="alert" size=${16} /><strong>هذه الخدمة ليست للطوارئ.</strong><span>في الطوارئ يتصل المريض بالإسعاف 997.</span></div>
    <${Card} title=${`المحادثة مع ${p.name}`} eyebrow=${`ترد باسم ${BY}`}>
      <div class="chat thread" ref=${box} aria-live="polite">
        ${msgs.length ? msgs.map((m) => html`<div key=${m.id} class=${`bubble ${m.from === 'pt' ? 'bubble-me' : m.from === 'patient' ? 'bubble-them' : 'bubble-system'}`}>
            <div>${m.text}</div>
            <div class="bubble-meta">${m.from === 'pt' ? 'الأخصائي' : m.from === 'patient' ? p.name : 'النظام'} · ${fmtDateTime(m.ts)}</div>
          </div>`) : html`<${Empty} icon="chat" title="لا رسائل بعد" />`}
      </div>
      <form class="composer" style="margin-top:12px" onSubmit=${send}>
        <label class="sr-only" for="msg-text">نص الرسالة</label>
        <textarea class="textarea" id="msg-text" rows="2" placeholder="اكتب ردك للمريض…" value=${text} onInput=${(e) => setText(e.currentTarget.value)}
          onKeyDown=${(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(e); }}></textarea>
        <button type="submit" class="btn btn-primary" id="msg-send" disabled=${!text.trim()}><${Icon} name="send" size=${16} />إرسال</button>
      </form>
      <p class="kbd-hint" style="margin-top:6px">Ctrl + Enter للإرسال</p>
    <//>
  </div>`;
}

/* ---------- السجل ---------- */
export function RecordTab({ p, state }) {
  const entries = state.audit.filter((a) => String(a.target).includes(p.name));
  const notes = [...(p.notes || [])].reverse();
  return html`<div class="stack-lg">
    <${Card} title="سجل المراحل">
      <div class="list">
        <div class="list-row"><span class="icon-tile" aria-hidden="true"><span class="num strong">1</span></span><span class="grow">بداية البرنامج بعد العملية</span><span class="small muted">اليوم 0</span></div>
        ${(p.phaseHistory || []).map((h, i) => html`<div class="list-row wrap" key=${i}>
          <span class="icon-tile ok" aria-hidden="true"><span class="num strong">${h.phase}</span></span>
          <span class="stack-sm grow" style="gap:0;min-width:180px"><span>الانتقال إلى المرحلة ${h.phase}</span>
            ${h.note ? html`<span class="small muted">${h.note}</span>` : null}
            ${h.criteria ? html`<span class="small muted">لقطة المعايير: ${h.criteria.filter((c) => c.state === 'met').length}/${h.criteria.length} محقق</span>` : null}</span>
          <span class="small muted">اليوم ${h.day} · ${h.by || '—'}</span>
        </div>`)}
        ${p.rtsStage ? html`<div class="list-row"><span class="icon-tile gold" aria-hidden="true"><${Icon} name="trophy" size=${18} /></span><span class="grow">متصل العودة للرياضة: الخطوة ${p.rtsStage} معتمدة</span></div>` : null}
      </div>
    <//>
    <${Card} title="الملاحظات المحفوظة" eyebrow="ملاحظات الزيارات الافتراضية وتبريرات الاعتماد">
      ${notes.length ? html`<div class="stack">${notes.map((n, i) => html`<div class="stack-sm" key=${i}>
          <span class="small muted">${n.by} · ${fmtDateTime(n.ts)} · اليوم ${n.day}</span>
          <pre class="code-note" style="margin:0">${n.text}</pre></div>`)}</div>`
        : html`<p class="small muted">لا ملاحظات محفوظة بعد. احفظ ملاحظة من «بدء العيادة الافتراضية».</p>`}
    <//>
    <${Card} title="سجل التغييرات لهذا المريض" eyebrow=${`${entries.length} إجراء`}>
      ${entries.length ? html`<div class="table-wrap"><table class="table">
        <thead><tr><th>الوقت</th><th>بواسطة</th><th>الإجراء</th><th>التفاصيل</th><th>من ← إلى</th></tr></thead>
        <tbody>${entries.map((a, i) => html`<tr key=${`${a.ts}-${i}`}>
          <td class="nowrap">${fmtDateTime(a.ts)}</td><td class="nowrap">${a.by}</td><td>${a.action}</td>
          <td>${String(a.target).split(' · ').slice(1).join(' · ') || '—'}</td>
          <td class="nowrap">${a.from} ← ${a.to}</td></tr>`)}</tbody></table></div>`
        : html`<p class="small muted">لا تغييرات مسجلة لهذا المريض بعد.</p>`}
    <//>
  </div>`;
}
