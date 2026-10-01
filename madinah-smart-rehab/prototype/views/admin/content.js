// Content management: exercise library and education materials. Every save is audited.
import { html, useState } from '../../lib/h.js';
import { Icon, Modal, Field, Empty, Figure, toast } from '../../lib/ui.js';
import { CATEGORIES } from '../../lib/data.js';
import { dispatch } from '../../lib/store.js';
import { ADMIN, MOTIONS, PageHead, NumberChips, FieldError, num } from './common.js';

const PHASES = [1, 2, 3, 4, 5, 6];
const holdText = (s) => (s >= 60 ? `${Math.round((s / 60) * 10) / 10} د` : `${s} ث`);
const dose = (ex) => (ex.sets === 1 && ex.reps === 1 && ex.hold >= 60 ? holdText(ex.hold) : `${ex.sets}×${ex.reps}${ex.hold ? ` · ثبات ${holdText(ex.hold)}` : ''}`);

/* ---------- exercises ---------- */
function ExerciseModal({ ex, cat, onClose }) {
  const isNew = !ex;
  const [f, setF] = useState(() => ({
    nameAr: ex?.nameAr || '', nameEn: ex?.nameEn || '', cat: ex?.cat || 'Quadriceps', phases: ex?.phases || [],
    sets: String(ex?.sets ?? 3), reps: String(ex?.reps ?? 10), hold: String(ex?.hold ?? 0), freq: ex?.freq || 'يوميًا',
    cues: (ex?.cues || []).join('\n'), precautions: ex?.precautions || '', video: ex?.video || '',
    prog: ex?.prog || '', reg: ex?.reg || '', motion: ex?.motion || 'squat',
  }));
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.currentTarget.value });
  const others = cat.exercises.filter((x) => x.id !== ex?.id).sort((a, b) => Math.min(...a.phases) - Math.min(...b.phases) || a.nameAr.localeCompare(b.nameAr, 'ar'));
  const save = () => {
    const sets = num(f.sets); const reps = num(f.reps); const hold = num(f.hold);
    if (!f.nameAr.trim() || !f.nameEn.trim()) return setErr('اكتب الاسم بالعربي والإنجليزي.');
    if (!f.phases.length) return setErr('اختر مرحلة واحدة على الأقل.');
    if (!(sets >= 1 && reps >= 1 && hold >= 0)) return setErr('المجموعات والتكرارات 1 أو أكثر، والثبات 0 أو أكثر.');
    if (f.video.trim() && !/^https:\/\//.test(f.video.trim())) return setErr('رابط الفيديو يجب أن يبدأ بـ https://');
    const exercise = {
      ...(ex || {}), id: ex?.id || `ex_${Date.now().toString(36)}`,
      nameAr: f.nameAr.trim(), nameEn: f.nameEn.trim(), cat: f.cat, phases: f.phases,
      sets, reps, hold, freq: f.freq.trim() || 'يوميًا', motion: f.motion,
      cues: f.cues.split('\n').map((s) => s.trim()).filter(Boolean), precautions: f.precautions.trim() || '—',
      video: f.video.trim(), prog: f.prog || null, reg: f.reg || null,
    };
    dispatch({ type: 'catalog/exercise/upsert', exercise, by: ADMIN });
    toast(isNew ? `أُضيف «${exercise.nameAr}» للمكتبة` : `حُفظ «${exercise.nameAr}» — يُسجل في سجل التغييرات`);
    onClose();
    return undefined;
  };
  return html`<${Modal} title=${isNew ? 'إضافة تمرين' : `تعديل: ${ex.nameAr}`} onClose=${onClose} wide
    footer=${html`<button type="button" class="btn btn-ghost" id="exf-cancel" onClick=${onClose}>إلغاء</button>
      <button type="button" class="btn btn-primary" id="exf-save" onClick=${save}><${Icon} name="check" size=${16} />حفظ</button>`}>
    <div class="ex-form">
      <div class="stack">
        <div class="form-grid">
          <${Field} label="الاسم بالعربي" htmlFor="exf-nameAr"><input class="input" id="exf-nameAr" value=${f.nameAr} onInput=${set('nameAr')} /><//>
          <${Field} label="الاسم بالإنجليزي" htmlFor="exf-nameEn"><input class="input" id="exf-nameEn" dir="ltr" value=${f.nameEn} onInput=${set('nameEn')} /><//>
          <${Field} label="الفئة" htmlFor="exf-cat"><select class="select" id="exf-cat" value=${f.cat} onChange=${set('cat')}>
            ${Object.entries(CATEGORIES).map(([k, v]) => html`<option value=${k}>${v}</option>`)}</select><//>
          <${Field} label="الحركة التوضيحية" htmlFor="exf-motion"><select class="select" id="exf-motion" value=${f.motion} onChange=${set('motion')}>
            ${MOTIONS.map(([k, v]) => html`<option value=${k}>${v}</option>`)}</select><//>
        </div>
        <div class="field"><span class="label">المراحل</span>
          <${NumberChips} idPrefix="exf-phase" label="المراحل" options=${PHASES} value=${f.phases} onChange=${(v) => setF({ ...f, phases: v })} /></div>
        <div class="form-grid compact">
          <${Field} label="المجموعات" htmlFor="exf-sets"><input class="input num" id="exf-sets" type="number" min="1" value=${f.sets} onInput=${set('sets')} /><//>
          <${Field} label="التكرارات" htmlFor="exf-reps"><input class="input num" id="exf-reps" type="number" min="1" value=${f.reps} onInput=${set('reps')} /><//>
          <${Field} label="الثبات (ثانية)" htmlFor="exf-hold"><input class="input num" id="exf-hold" type="number" min="0" value=${f.hold} onInput=${set('hold')} /><//>
          <${Field} label="التكرار" htmlFor="exf-freq"><input class="input" id="exf-freq" value=${f.freq} onInput=${set('freq')} /><//>
        </div>
      </div>
      <div class="exercise-media ex-form-preview" aria-hidden="true"><${Figure} motion=${f.motion} /></div>
    </div>
    <${Field} label="تعليمات الأداء (سطر لكل تعليمة)" htmlFor="exf-cues"><textarea class="textarea" id="exf-cues" rows="3" value=${f.cues} onInput=${set('cues')}></textarea><//>
    <${Field} label="احتياطات" htmlFor="exf-prec"><textarea class="textarea" id="exf-prec" rows="2" value=${f.precautions} onInput=${set('precautions')}></textarea><//>
    <${Field} label="رابط الفيديو" htmlFor="exf-video" hint="يُرفع لمخزن داخل المملكة">
      <input class="input" id="exf-video" type="url" dir="ltr" placeholder="https://" value=${f.video} onInput=${set('video')} /><//>
    <div class="form-grid">
      <${Field} label="التدرج للأصعب" htmlFor="exf-prog"><select class="select" id="exf-prog" value=${f.prog} onChange=${set('prog')}>
        <option value="">لا يوجد</option>${others.map((x) => html`<option value=${x.id}>${x.nameAr}</option>`)}</select><//>
      <${Field} label="البديل الأسهل" htmlFor="exf-reg"><select class="select" id="exf-reg" value=${f.reg} onChange=${set('reg')}>
        <option value="">لا يوجد</option>${others.map((x) => html`<option value=${x.id}>${x.nameAr}</option>`)}</select><//>
    </div>
    <${FieldError} text=${err} />
    <p class="small muted">التعديل يغيّر المكتبة فقط؛ برامج المرضى الحالية لا تتغير حتى يعدّلها الأخصائي.</p>
  <//>`;
}

export function ExercisesPage({ state }) {
  const cat = state.catalog;
  const [q, setQ] = useState('');
  const [c, setC] = useState('all');
  const [ph, setPh] = useState('all');
  const [edit, setEdit] = useState(null); // exercise | 'new' | null
  const ql = q.trim().toLowerCase();
  const rows = cat.exercises.filter((ex) => (c === 'all' || ex.cat === c) && (ph === 'all' || ex.phases.includes(Number(ph)))
    && (!ql || ex.nameAr.includes(q.trim()) || ex.nameEn.toLowerCase().includes(ql)));
  return html`<div class="stack">
    <${PageHead} eyebrow=${`${cat.exercises.length} تمرينًا في المكتبة`} title="مكتبة التمارين">
      <button type="button" class="btn btn-primary" id="adm-ex-add" onClick=${() => setEdit('new')}><${Icon} name="plus" size=${16} />إضافة تمرين</button>
    <//>
    <div class="toolbar">
      <label class="sr-only" for="adm-ex-search">بحث</label>
      <div class="search-box"><${Icon} name="search" size=${16} />
        <input class="input" id="adm-ex-search" type="search" placeholder="ابحث بالعربي أو الإنجليزي" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} autocomplete="off" /></div>
      <label class="sr-only" for="adm-ex-cat">الفئة</label>
      <select class="select" id="adm-ex-cat" style="width:auto" value=${c} onChange=${(e) => setC(e.currentTarget.value)}>
        <option value="all">كل الفئات</option>${Object.entries(CATEGORIES).map(([k, v]) => html`<option value=${k}>${v}</option>`)}</select>
      <label class="sr-only" for="adm-ex-phase">المرحلة</label>
      <select class="select" id="adm-ex-phase" style="width:auto" value=${ph} onChange=${(e) => setPh(e.currentTarget.value)}>
        <option value="all">كل المراحل</option>${PHASES.map((n) => html`<option value=${String(n)}>المرحلة ${n}</option>`)}</select>
    </div>
    ${rows.length ? html`<div class="table-wrap"><table class="table">
      <caption class="sr-only">تمارين المكتبة</caption>
      <thead><tr><th>التمرين</th><th>الفئة</th><th>المراحل</th><th>الجرعة</th><th>التكرار</th><th>فيديو</th><th><span class="sr-only">إجراءات</span></th></tr></thead>
      <tbody>${rows.map((ex) => html`<tr key=${ex.id}>
        <td><div class="stack-sm" style="gap:0"><strong>${ex.nameAr}</strong><span class="small muted"><bdi>${ex.nameEn}</bdi></span></div></td>
        <td>${CATEGORIES[ex.cat] || ex.cat}</td>
        <td><div class="row" style="gap:4px;flex-wrap:nowrap">${ex.phases.map((n) => html`<span class="tag num" key=${n}>${n}</span>`)}</div></td>
        <td class="nowrap">${dose(ex)}</td><td>${ex.freq}</td>
        <td>${ex.video ? html`<span class="row nowrap" style="gap:4px;color:var(--ok)"><${Icon} name="video" size=${15} />مرفوع</span>` : html`<span class="muted small">عرض توضيحي</span>`}</td>
        <td><button type="button" class="btn btn-sm" id=${`adm-ex-edit-${ex.id}`} onClick=${() => setEdit(ex)}><${Icon} name="edit" size=${15} />تعديل</button></td>
      </tr>`)}</tbody></table></div>` : html`<div class="card"><${Empty} icon="search" title="لا نتائج" /></div>`}
    ${edit ? html`<${ExerciseModal} ex=${edit === 'new' ? null : edit} cat=${cat} onClose=${() => setEdit(null)} />` : null}
  </div>`;
}

/* ---------- education ---------- */
function EducationModal({ item, cats, onClose }) {
  const isNew = !item;
  const [f, setF] = useState(() => ({
    titleAr: item?.titleAr || '', phases: item?.phases || [], minutes: String(item?.minutes ?? 2), cat: item?.cat || '', body: (item?.body || []).join('\n'),
  }));
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.currentTarget.value });
  const save = () => {
    const minutes = num(f.minutes);
    const body = f.body.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!f.titleAr.trim()) return setErr('اكتب العنوان.');
    if (!f.phases.length) return setErr('اختر مرحلة واحدة على الأقل.');
    if (!(minutes >= 1 && minutes <= 30)) return setErr('مدة القراءة بين 1 و30 دقيقة.');
    if (!body.length) return setErr('اكتب فقرة واحدة على الأقل.');
    const out = { ...(item || {}), id: item?.id || `ed_${Date.now().toString(36)}`, titleAr: f.titleAr.trim(), phases: f.phases, minutes, cat: f.cat.trim() || 'عام', body };
    dispatch({ type: 'catalog/education/upsert', item: out, by: ADMIN });
    toast(isNew ? 'أُضيفت المادة التثقيفية' : 'حُفظت المادة التثقيفية');
    onClose();
    return undefined;
  };
  return html`<${Modal} title=${isNew ? 'إضافة مادة تثقيفية' : `تعديل: ${item.titleAr}`} onClose=${onClose}
    footer=${html`<button type="button" class="btn btn-ghost" id="edf-cancel" onClick=${onClose}>إلغاء</button>
      <button type="button" class="btn btn-primary" id="edf-save" onClick=${save}><${Icon} name="check" size=${16} />حفظ</button>`}>
    <${Field} label="العنوان" htmlFor="edf-title"><input class="input" id="edf-title" value=${f.titleAr} onInput=${set('titleAr')} /><//>
    <div class="field"><span class="label">المراحل</span>
      <${NumberChips} idPrefix="edf-phase" label="المراحل" options=${PHASES} value=${f.phases} onChange=${(v) => setF({ ...f, phases: v })} /></div>
    <div class="form-grid">
      <${Field} label="مدة القراءة (دقيقة)" htmlFor="edf-min"><input class="input num" id="edf-min" type="number" min="1" max="30" value=${f.minutes} onInput=${set('minutes')} /><//>
      <${Field} label="التصنيف" htmlFor="edf-cat"><input class="input" id="edf-cat" list="edf-cat-list" value=${f.cat} onInput=${set('cat')} />
        <datalist id="edf-cat-list">${cats.map((x) => html`<option value=${x}></option>`)}</datalist><//>
    </div>
    <${Field} label="النص (سطر لكل فقرة)" htmlFor="edf-body" hint="جمل قصيرة وواضحة باللغة اليومية. يراجعها الفريق السريري قبل النشر.">
      <textarea class="textarea" id="edf-body" rows="6" value=${f.body} onInput=${set('body')}></textarea><//>
    <${FieldError} text=${err} />
  <//>`;
}

export function EducationPage({ state }) {
  const items = state.catalog.education;
  const [edit, setEdit] = useState(null);
  const cats = [...new Set(items.map((x) => x.cat))];
  return html`<div class="stack">
    <${PageHead} eyebrow="تظهر للمريض حسب مرحلته، ويعتمد عليها المساعد الذكي فقط" title="المحتوى التثقيفي">
      <button type="button" class="btn btn-primary" id="adm-ed-add" onClick=${() => setEdit('new')}><${Icon} name="plus" size=${16} />إضافة مادة</button>
    <//>
    <div class="table-wrap"><table class="table">
      <caption class="sr-only">المواد التثقيفية</caption>
      <thead><tr><th>العنوان</th><th>التصنيف</th><th>المراحل</th><th class="num">دقائق</th><th class="num">فقرات</th><th><span class="sr-only">إجراءات</span></th></tr></thead>
      <tbody>${items.map((it) => html`<tr key=${it.id}>
        <td><div class="row" style="gap:6px"><strong>${it.titleAr}</strong>${it.pinned ? html`<span class="tag">مثبتة</span>` : null}</div></td>
        <td>${it.cat}</td>
        <td><div class="row" style="gap:4px;flex-wrap:nowrap">${it.phases.map((n) => html`<span class="tag num" key=${n}>${n}</span>`)}</div></td>
        <td class="num">${it.minutes}</td><td class="num">${it.body.length}</td>
        <td><button type="button" class="btn btn-sm" id=${`adm-ed-edit-${it.id}`} onClick=${() => setEdit(it)}><${Icon} name="edit" size=${15} />تعديل</button></td>
      </tr>`)}</tbody></table></div>
    ${edit ? html`<${EducationModal} item=${edit === 'new' ? null : edit} cats=${cats} onClose=${() => setEdit(null)} />` : null}
  </div>`;
}
