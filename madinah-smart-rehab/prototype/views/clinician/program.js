// Program tab: the prescription, inline dose edits, removal with confirmation, and adding from the library.
import { html, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Modal, Empty, Figure, toast } from '../../lib/ui.js';
import { LineChart } from '../../lib/charts.js';
import { getEx, postOpDay, weekOf } from '../../lib/engine.js';
import { CATEGORIES } from '../../lib/data.js';
import { dispatch } from '../../lib/store.js';
import { BY, doseLabel, Check, FieldError, num } from './common.js';

function LoadChart({ p, exId }) {
  const pts = (p.loads || []).filter((l) => l.exId === exId).map((l) => ({ x: weekOf(l.day), y: l.kg }));
  if (pts.length < 2) return html`<p class="small muted">لا أحمال كافية مسجلة لهذا التمرين بعد.</p>`;
  return html`<${LineChart} label="الحمل بالكيلوغرام حسب الأسبوع" unit=" كغ" xTitle="الأسبوع" height=${150}
    series=${[{ label: 'الحمل', color: 'var(--series-1)', points: pts }]} />`;
}

function EditDose({ p, it, ex, onDone }) {
  const [v, setV] = useState({ sets: String(it.sets), reps: String(it.reps), hold: String(it.hold || 0), freq: it.freq || '' });
  const [err, setErr] = useState('');
  const pre = `prog-${it.exId}`;
  const save = (e) => {
    e.preventDefault();
    const sets = num(v.sets); const reps = num(v.reps); const hold = num(v.hold);
    if (!(sets >= 1 && sets <= 20) || !(reps >= 1 && reps <= 200)) return setErr('المجموعات والتكرارات أرقام موجبة.');
    if (!(hold >= 0 && hold <= 3600)) return setErr('الثبات بالثواني (0–3600).');
    if (!v.freq.trim()) return setErr('اكتب التكرار الأسبوعي أو اليومي.');
    const changes = { sets, reps, hold, freq: v.freq.trim() };
    if (sets === it.sets && reps === it.reps && hold === (it.hold || 0) && changes.freq === it.freq) { onDone(); return undefined; }
    dispatch({ type: 'program/update', pid: p.id, exId: it.exId, exName: ex?.nameAr, changes, by: BY });
    toast(`عُدلت جرعة «${ex?.nameAr || it.exId}» وسُجل التعديل`);
    onDone();
    return undefined;
  };
  return html`<form class="stack-sm dose-edit" onSubmit=${save} noValidate>
    <div class="form-grid compact">
      <div class="field"><label for=${`${pre}-sets`}>المجموعات</label><input class="input num" id=${`${pre}-sets`} type="number" min="1" max="20" value=${v.sets} onInput=${(e) => setV({ ...v, sets: e.currentTarget.value })} /></div>
      <div class="field"><label for=${`${pre}-reps`}>التكرارات</label><input class="input num" id=${`${pre}-reps`} type="number" min="1" max="200" value=${v.reps} onInput=${(e) => setV({ ...v, reps: e.currentTarget.value })} /></div>
      <div class="field"><label for=${`${pre}-hold`}>الثبات (ثانية)</label><input class="input num" id=${`${pre}-hold`} type="number" min="0" max="3600" value=${v.hold} onInput=${(e) => setV({ ...v, hold: e.currentTarget.value })} /></div>
      <div class="field"><label for=${`${pre}-freq`}>التكرار</label><input class="input" id=${`${pre}-freq`} type="text" value=${v.freq} list="freq-options" onInput=${(e) => setV({ ...v, freq: e.currentTarget.value })} /></div>
    </div>
    <${FieldError} text=${err} />
    <div class="row"><button type="submit" class="btn btn-sm btn-primary" id=${`${pre}-save`}>حفظ الجرعة</button>
      <button type="button" class="btn btn-sm btn-ghost" id=${`${pre}-cancel`} onClick=${onDone}>إلغاء</button></div>
  </form>`;
}

function ProgramItem({ p, it, cat }) {
  const ex = getEx(it.exId, cat);
  const [mode, setMode] = useState(null); // 'edit' | 'remove'
  const [showLoad, setShowLoad] = useState(false);
  const remove = () => {
    dispatch({ type: 'program/remove', pid: p.id, exId: it.exId, exName: ex?.nameAr, by: BY });
    toast(`حُذف «${ex?.nameAr || it.exId}» من البرنامج`);
  };
  return html`<div class="prog-item">
    <div class="row-between" style="align-items:flex-start">
      <div class="stack-sm" style="gap:2px;min-width:0">
        <strong>${ex?.nameAr || it.exId}</strong>
        <span class="small muted"><bdi>${ex?.nameEn || ''}</bdi></span>
        <span class="row" style="gap:6px">
          <span class="tag">${CATEGORIES[ex?.cat] || ex?.cat || '—'}</span>
          ${ex?.load ? html`<span class="tag">بحمل</span>` : null}
          ${ex?.level ? html`<span class="tag">قفز مستوى ${ex.level}</span>` : null}
        </span>
      </div>
      <div class="dose"><span class="num">${doseLabel(it)}</span><span>${it.freq || ex?.freq || ''}</span></div>
    </div>
    ${it.note ? html`<p class="small muted">${it.note}</p>` : null}
    ${mode === 'edit' ? html`<${EditDose} p=${p} it=${it} ex=${ex} onDone=${() => setMode(null)} />` : null}
    ${mode === 'remove' ? html`<div class="note note-warn row-between" role="alert">
        <span>حذف «${ex?.nameAr}» من برنامج ${p.name}؟</span>
        <span class="row" style="gap:6px"><button type="button" class="btn btn-sm btn-danger" id=${`prog-${it.exId}-confirm-remove`} onClick=${remove}>نعم، احذف</button>
          <button type="button" class="btn btn-sm btn-ghost" onClick=${() => setMode(null)}>إلغاء</button></span></div>` : null}
    ${!mode ? html`<div class="row" style="gap:6px">
      <button type="button" class="btn btn-sm" id=${`prog-${it.exId}-edit`} onClick=${() => setMode('edit')}><${Icon} name="edit" size=${15} />تعديل الجرعة</button>
      <button type="button" class="btn btn-sm btn-ghost" id=${`prog-${it.exId}-remove`} onClick=${() => setMode('remove')}><${Icon} name="trash" size=${15} />حذف</button>
      ${ex?.load ? html`<button type="button" class="btn btn-sm btn-ghost" id=${`prog-${it.exId}-loads`} aria-expanded=${String(showLoad)} onClick=${() => setShowLoad(!showLoad)}>
        <${Icon} name="chart" size=${15} />${showLoad ? 'إخفاء الأحمال' : 'الأحمال المسجلة'}</button>` : null}
    </div>` : null}
    ${ex?.load && showLoad ? html`<div class="card card-flat card-tight"><${LoadChart} p=${p} exId=${it.exId} /></div>` : null}
  </div>`;
}

function AddModal({ p, cat, onClose }) {
  const [q, setQ] = useState('');
  const [c, setC] = useState('all');
  const [fit, setFit] = useState(true);
  const inProg = new Set(p.program.map((it) => it.exId));
  const ql = q.trim().toLowerCase();
  const list = cat.exercises.filter((ex) => (c === 'all' || ex.cat === c) && (!fit || ex.phases.includes(p.phase))
    && (!ql || ex.nameAr.includes(q.trim()) || ex.nameEn.toLowerCase().includes(ql)));
  const cats = Object.keys(CATEGORIES).filter((k) => cat.exercises.some((ex) => ex.cat === k));
  const add = (ex) => {
    dispatch({ type: 'program/add', pid: p.id, exName: ex.nameAr, item: { exId: ex.id, sets: ex.sets, reps: ex.reps, hold: ex.hold, freq: ex.freq, note: '' }, by: BY });
    toast(`أُضيف «${ex.nameAr}» إلى برنامج ${p.name}`);
  };
  return html`<${Modal} title="إضافة تمرين من المكتبة" onClose=${onClose} wide footer=${html`<button type="button" class="btn" id="add-ex-done" onClick=${onClose}>تم</button>`}>
    <div class="toolbar" style="margin:0">
      <label class="sr-only" for="add-ex-search">بحث في التمارين</label>
      <div class="search-box"><${Icon} name="search" size=${16} />
        <input class="input" id="add-ex-search" type="search" placeholder="ابحث بالعربي أو الإنجليزي" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} autocomplete="off" /></div>
      <${Check} id="add-ex-fit" checked=${fit} onChange=${setFit}>مناسب للمرحلة ${p.phase} فقط<//>
    </div>
    <div class="row" role="group" aria-label="الفئة" style="gap:6px">
      <button type="button" class="chip" id="add-ex-cat-all" aria-pressed=${String(c === 'all')} onClick=${() => setC('all')}>الكل</button>
      ${cats.map((k) => html`<button type="button" class="chip" key=${k} id=${`add-ex-cat-${k}`} aria-pressed=${String(c === k)} onClick=${() => setC(k)}>${CATEGORIES[k]}</button>`)}
    </div>
    ${list.length ? html`<div class="list">${list.map((ex) => {
      const added = inProg.has(ex.id);
      const locked = ex.level && ex.level > (p.plyoLevel || 0);
      return html`<div class="list-row wrap" key=${ex.id}>
        <span class="mini-figure" aria-hidden="true"><${Figure} motion=${ex.motion} playing=${false} showAngle=${false} /></span>
        <span class="stack-sm grow" style="gap:2px;min-width:180px">
          <strong>${ex.nameAr}</strong>
          <span class="small muted"><bdi>${ex.nameEn}</bdi> · ${CATEGORIES[ex.cat] || ex.cat} · المراحل ${ex.phases.join('، ')}</span>
          <span class="small">${doseLabel(ex)} · ${ex.freq}</span>
          ${ex.precautions && ex.precautions !== '—' ? html`<span class="small muted">تنبيه: ${ex.precautions}</span>` : null}
          ${locked ? html`<span class="small" style="color:var(--warn)">مستوى قفز ${ex.level} — غير مفتوح للمريض بعد</span>` : null}
        </span>
        ${added ? html`<${Pill} tone="ok" icon="check">في البرنامج<//>`
          : html`<button type="button" class="btn btn-sm btn-primary" id=${`add-ex-${ex.id}`} onClick=${() => add(ex)}><${Icon} name="plus" size=${15} />إضافة</button>`}
      </div>`;
    })}</div>` : html`<${Empty} icon="search" title="لا تمارين مطابقة">جرّب إلغاء «مناسب للمرحلة» أو تغيير الفئة.<//>`}
  <//>`;
}

export function ProgramTab({ p, cat }) {
  const [adding, setAdding] = useState(false);
  const day = postOpDay(p);
  const activeMods = (p.modifiers || []).filter((m) => day < m.untilDay);
  return html`<div class="stack-lg">
    ${activeMods.length ? html`<div class="note note-warn stack-sm" role="note">
      <strong class="row" style="gap:6px"><${Icon} name="shield" size=${16} />قيود سارية على البرنامج</strong>
      <ul class="reasons">${activeMods.map((m) => html`<li key=${m.id}><span>•</span><span>${m.textAr}</span></li>`)}</ul></div>` : null}
    <${Card} title=${`البرنامج المنزلي — ${p.program.length} تمارين`} eyebrow=${`المرحلة ${p.phase} · اليوم ${day}`}
      actions=${html`<button type="button" class="btn btn-primary btn-sm" id="prog-add" onClick=${() => setAdding(true)}><${Icon} name="plus" size=${15} />إضافة من المكتبة</button>`}>
      ${p.program.length ? html`<div class="prog-list">${p.program.map((it) => html`<${ProgramItem} key=${it.exId} p=${p} it=${it} cat=${cat} />`)}</div>`
        : html`<${Empty} icon="dumbbell" title="البرنامج فارغ">أضف تمارين من المكتبة.<//>`}
      <datalist id="freq-options">
        ${['يوميًا', 'مرتين يوميًا', '3 مرات يوميًا', 'يوم بعد يوم', '3 مرات أسبوعيًا', 'مرتين أسبوعيًا'].map((f) => html`<option value=${f}></option>`)}
      </datalist>
    <//>
    <p class="small muted">كل تعديل يُسجل في سجل التغييرات باسم ${BY}، ويظهر للمريض في تطبيقه.</p>
    ${adding ? html`<${AddModal} p=${p} cat=${cat} onClose=${() => setAdding(false)} />` : null}
  </div>`;
}
