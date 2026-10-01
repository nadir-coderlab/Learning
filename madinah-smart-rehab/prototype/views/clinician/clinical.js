// Clinical tab: surgery details, protocol modifiers, assessment history and the in-person assessment form.
import { html, useState } from '../../lib/h.js';
import { Icon, Pill, Card, Field, Empty, toast } from '../../lib/ui.js';
import { postOpDay, GRAFT_AR, SIDE_AR } from '../../lib/engine.js';
import { EFFUSION_GRADES } from '../../lib/data.js';
import { dispatch } from '../../lib/store.js';
import { BY, LEVEL_AR, fmtFull, Choice, FieldError, num } from './common.js';

const yesNo = (v, yes = 'نعم', no = 'لا') => (v === true ? yes : v === false ? no : '—');

function SurgeryInfo({ p }) {
  const meniscus = p.meniscusRepair ? 'إصلاح الغضروف الهلالي (Repair)' : p.meniscectomy ? 'استئصال جزئي للغضروف (Meniscectomy)' : 'لا يوجد';
  const rows = [
    ['الركبة', `الركبة ${SIDE_AR[p.side]}`],
    ['الطعم', GRAFT_AR[p.graft] || p.graft],
    ['الغضروف الهلالي', meniscus],
    ['إجراءات إضافية', p.additional || 'لا يوجد'],
    ['الجراح', p.surgeon],
    ['الأخصائي', p.pt],
    ['التحميل', p.wb],
    ['الدعامة', p.brace],
    ['قيود المدى', p.romRestriction],
    ['تعليمات الجراح', p.surgeonInstructions],
    ['أمراض مصاحبة', p.comorbidities],
    ['Tegner قبل الإصابة', String(p.tegnerPre)],
    ['الرياضة والمستوى', `${p.sport} · ${LEVEL_AR[p.sportLevel] || p.sportLevel}`],
    ['الهدف', p.goal],
    ['تاريخ الإصابة', fmtFull(p.injuryDate)],
    ['تاريخ العملية', fmtFull(p.surgeryDate)],
    ['الطرف السليم', `ثني ${p.contralateral?.flex ?? '—'}°`],
  ];
  return html`<dl class="kv">${rows.map(([k, v]) => html`<dt key=${`k-${k}`}>${k}</dt><dd key=${`v-${k}`}>${v}</dd>`)}</dl>`;
}

function Modifiers({ p }) {
  const day = postOpDay(p);
  const mods = p.modifiers || [];
  if (!mods.length) return html`<p class="small muted">لا معدّلات على البروتوكول القياسي.</p>`;
  return html`<div class="list">${mods.map((m) => {
    const active = day < m.untilDay;
    return html`<div class="list-row" key=${m.id}>
      <span class=${`icon-tile ${active ? 'warn' : 'idle'}`} aria-hidden="true"><${Icon} name=${active ? 'shield' : 'check'} size=${18} /></span>
      <span class="grow">${m.textAr}</span>
      ${active ? html`<${Pill} tone="warn" icon="shield">سارٍ حتى اليوم ${m.untilDay} (باقي ${m.untilDay - day} يومًا)<//>`
        : html`<${Pill} tone="plain" icon="check">انتهى في اليوم ${m.untilDay}<//>`}
    </div>`;
  })}</div>`;
}

function AssessmentTable({ p }) {
  const rows = [...(p.assessments || [])].reverse();
  if (!rows.length) return html`<${Empty} icon="clipboard" title="لا تقييمات حضورية بعد" />`;
  const romOn = (d) => (p.rom || []).find((r) => r.day === d && r.source === 'clinic');
  return html`<div class="table-wrap"><table class="table">
    <caption class="sr-only">سجل التقييمات الحضورية</caption>
    <thead><tr><th class="num">اليوم</th><th class="num">الثني</th><th class="num">نقص الفرد</th><th>التورم</th><th>تأخر رفع الساق</th><th>المشية</th>
      <th class="num">الوقوف على رجل</th><th>جودة الهبوط</th><th>قفز تمهيدي</th><th>بواسطة</th></tr></thead>
    <tbody>${rows.map((a, i) => {
      const rom = romOn(a.day);
      return html`<tr key=${`${a.day}-${i}`}>
        <td class="num">${a.day}</td>
        <td class="num">${rom && Number.isFinite(rom.flex) ? `${rom.flex}°` : '—'}</td>
        <td class="num">${rom && Number.isFinite(rom.ext) ? `${rom.ext}°` : '—'}</td>
        <td><bdi>${EFFUSION_GRADES[a.effusion] ?? '—'}</bdi></td>
        <td>${yesNo(a.slrLag, 'يوجد', 'لا يوجد')}</td>
        <td>${yesNo(a.gait, 'طبيعية', 'غير طبيعية')}</td>
        <td class="num">${Number.isFinite(a.sls) ? `${a.sls} ث` : '—'}</td>
        <td>${yesNo(a.landingQuality, 'جيدة', 'غير جيدة')}</td>
        <td>${yesNo(a.hopPrereq, 'بدون ألم', 'غير ممكن')}</td>
        <td class="small">${a.by || '—'}</td>
      </tr>`;
    })}</tbody></table></div>`;
}

const EMPTY_FORM = { flex: '', ext: '', effusion: '', slr: null, gait: null, sls: '', land: 'na', hop: 'na' };

function AssessmentForm({ p }) {
  const [f, setF] = useState(EMPTY_FORM);
  const [err, setErr] = useState('');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    const flex = num(f.flex); const ext = num(f.ext); const sls = num(f.sls);
    if (!Number.isFinite(flex) || flex < 0 || flex > 160) return setErr('أدخل الثني بين 0 و160 درجة.');
    if (!Number.isFinite(ext) || ext < -15 || ext > 40) return setErr('أدخل نقص الفرد بالدرجات (0 = فرد كامل).');
    if (f.effusion === '') return setErr('اختر درجة التورم.');
    if (f.slr === null || f.gait === null) return setErr('حدد تأخر رفع الساق والمشية.');
    if (f.sls !== '' && (!Number.isFinite(sls) || sls < 0 || sls > 120)) return setErr('الوقوف على رجل بالثواني (0–120).');
    const tri = (v) => (v === 'yes' ? true : v === 'no' ? false : undefined);
    const assessment = {
      effusion: Number(f.effusion), slrLag: f.slr === 'yes', gait: f.gait === 'yes',
      sls: f.sls === '' ? undefined : sls, landingQuality: tri(f.land), hopPrereq: tri(f.hop), by: BY,
    };
    dispatch({ type: 'assessment/add', pid: p.id, assessment, rom: { flex, ext }, by: BY });
    setErr(''); setF(EMPTY_FORM);
    toast('حُفظ التقييم الحضوري — يظهر كقياس حضوري في الرسوم والمعايير');
    return undefined;
  };
  return html`<form class="stack" onSubmit=${submit} noValidate>
    <div class="form-grid">
      <${Field} label="الثني (°)" htmlFor="asmt-flex"><input class="input num" id="asmt-flex" type="number" inputmode="numeric" min="0" max="160" value=${f.flex} onInput=${(e) => set('flex')(e.currentTarget.value)} /><//>
      <${Field} label="نقص الفرد (°)" htmlFor="asmt-ext" hint="0 = فرد كامل"><input class="input num" id="asmt-ext" type="number" inputmode="numeric" min="-15" max="40" value=${f.ext} onInput=${(e) => set('ext')(e.currentTarget.value)} /><//>
      <${Field} label="التورم (Stroke test)" htmlFor="asmt-eff">
        <select class="select" id="asmt-eff" value=${f.effusion} onChange=${(e) => set('effusion')(e.currentTarget.value)}>
          <option value="">اختر…</option>
          ${EFFUSION_GRADES.map((g, i) => html`<option value=${String(i)}>${g}</option>`)}
        </select><//>
      <${Field} label="الوقوف على رجل (ثانية)" htmlFor="asmt-sls"><input class="input num" id="asmt-sls" type="number" inputmode="numeric" min="0" max="120" value=${f.sls} onInput=${(e) => set('sls')(e.currentTarget.value)} /><//>
    </div>
    <div class="form-grid">
      <div class="field"><span class="label" id="asmt-slr-l">تأخر رفع الساق (SLR lag)</span>
        <${Choice} id="asmt-slr" label="تأخر رفع الساق" value=${f.slr} onChange=${set('slr')} options=${[{ id: 'yes', label: 'يوجد تأخر' }, { id: 'no', label: 'بدون تأخر' }]} /></div>
      <div class="field"><span class="label">المشية</span>
        <${Choice} id="asmt-gait" label="المشية" value=${f.gait} onChange=${set('gait')} options=${[{ id: 'yes', label: 'طبيعية' }, { id: 'no', label: 'غير طبيعية' }]} /></div>
      <div class="field"><span class="label">جودة الهبوط / النزول من درجة</span>
        <${Choice} id="asmt-land" label="جودة الهبوط" value=${f.land} onChange=${set('land')} options=${[{ id: 'yes', label: 'جيدة' }, { id: 'no', label: 'غير جيدة' }, { id: 'na', label: 'لم يُختبر' }]} /></div>
      <div class="field"><span class="label">قفزات متكررة بدون ألم</span>
        <${Choice} id="asmt-hop" label="القفز التمهيدي" value=${f.hop} onChange=${set('hop')} options=${[{ id: 'yes', label: 'نعم' }, { id: 'no', label: 'لا' }, { id: 'na', label: 'لم يُختبر' }]} /></div>
    </div>
    <${FieldError} text=${err} />
    <div class="row"><button type="submit" class="btn btn-primary" id="asmt-save"><${Icon} name="check" size=${16} />حفظ التقييم</button>
      <span class="small muted">يُسجل باسم ${BY} في اليوم ${postOpDay(p)}، ويُعامل كقياس حضوري.</span></div>
  </form>`;
}

export function ClinicalTab({ p }) {
  return html`<div class="stack-lg">
    <div class="grid-2">
      <${Card} title="بيانات العملية والخلفية"><${SurgeryInfo} p=${p} /><//>
      <${Card} title="معدّلات البروتوكول" eyebrow="تُحسب حسب اليوم بعد العملية"><${Modifiers} p=${p} /><//>
    </div>
    <${Card} title="سجل التقييمات الحضورية"><${AssessmentTable} p=${p} /><//>
    <${Card} title="تسجيل تقييم حضوري" eyebrow="القيم الحضورية تُقدَّم على القياسات المنزلية في المعايير"><${AssessmentForm} p=${p} /><//>
  </div>`;
}
