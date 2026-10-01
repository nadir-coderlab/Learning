// Phase-approval modal: the criteria with their evidence, then an explicit, confirmed clinician decision.
import { html, useMemo, useState } from '../../lib/h.js';
import { Icon, Modal, Pill, toast } from '../../lib/ui.js';
import { criteriaFor, phaseOf, getEx } from '../../lib/engine.js';
import { CATEGORIES } from '../../lib/data.js';
import { dispatch } from '../../lib/store.js';
import { BY, SPORT_KEY, CriteriaList, CriteriaDone, CriteriaSummary, Check, doseLabel } from './common.js';
import { RtsContinuum } from './measures.js';

// Is `ex` a progression of something already picked? (walk_jog → treadmill_run, cut45 → cut90 → reactive …)
function progressesFrom(ex, picked, cat) {
  let cur = ex; let guard = 0;
  while (cur?.reg && guard++ < 6) {
    if (picked.has(cur.reg)) return true;
    cur = getEx(cur.reg, cat);
  }
  return false;
}

// Proposed programme for the new phase: up to 8 catalog exercises whose phases include it.
// Sport-specific drills first (phase 6), then a few exercises new to this phase, then still-valid
// exercises from the current programme, then the rest. The clinician sees the list before loading it.
export function proposeProgram(p, toPhase, cat) {
  const sportKey = SPORT_KEY[p.sport];
  const plyoMax = Math.max(1, p.plyoLevel || 0);
  const pool = cat.exercises.filter((ex) => ex.phases.includes(toPhase)
    && (!ex.level || ex.level <= plyoMax) && (!ex.sport || ex.sport === sportKey));
  const picked = new Map();
  const perCat = {};
  const take = (ex, catCap = 2) => {
    if (picked.size >= 8 || picked.has(ex.id)) return;
    if ((perCat[ex.cat] || 0) >= catCap) return;
    if (progressesFrom(ex, picked, cat)) return;
    picked.set(ex.id, ex); perCat[ex.cat] = (perCat[ex.cat] || 0) + 1;
  };
  if (toPhase === 6) pool.filter((ex) => ex.sport).forEach((ex) => take(ex));
  const fresh = pool.filter((ex) => Math.min(...ex.phases) === toPhase);
  for (const ex of fresh) { if (picked.size >= 4 + (toPhase === 6 ? 2 : 0)) break; take(ex); }
  const current = new Set(p.program.map((it) => it.exId));
  pool.filter((ex) => current.has(ex.id)).forEach((ex) => take(ex, 3));
  [...pool].sort((a, b) => Math.min(...b.phases) - Math.min(...a.phases)).forEach((ex) => take(ex, 3));
  return [...picked.values()].map((ex) => ({ exId: ex.id, sets: ex.sets, reps: ex.reps, hold: ex.hold, freq: ex.freq, note: '' }));
}

export function PhaseApprovalModal({ p, cat, onClose }) {
  const isRts = p.phase >= 6;
  const toPhase = isRts ? 'rts' : p.phase + 1;
  const results = criteriaFor(p, toPhase, cat);
  const allMet = results.length > 0 && results.every((r) => r.state === 'met');
  const target = isRts ? null : phaseOf(toPhase, cat);
  const [confirm, setConfirm] = useState(false);
  const [why, setWhy] = useState('');
  const [loadProg, setLoadProg] = useState(false);
  const proposed = useMemo(() => (isRts ? [] : proposeProgram(p, toPhase, cat)), [p, toPhase, cat, isRts]);
  const needWhy = !allMet;
  const canApprove = confirm && (!needWhy || why.trim().length >= 8);

  const approve = () => {
    if (!canApprove) return;
    const criteria = results.map((r) => ({ id: r.c.id, state: r.state, valueText: r.valueText }));
    const note = needWhy ? `اعتماد سريري قبل اكتمال المعايير: ${why.trim()}` : why.trim();
    dispatch({ type: 'phase/approve', pid: p.id, toPhase, criteria, note, ...(loadProg ? { program: proposed } : {}), by: BY });
    toast(`اعتُمد انتقال ${p.name} إلى المرحلة ${toPhase}${loadProg ? ' وحُمّل برنامجها' : ''} — سُجل في السجل`);
    onClose();
  };

  const footer = isRts
    ? html`<button type="button" class="btn" id="appr-close" onClick=${onClose}>إغلاق</button>`
    : html`<button type="button" class="btn btn-ghost" id="appr-cancel" onClick=${onClose}>إلغاء</button>
      <button type="button" class="btn btn-primary" id="appr-approve" disabled=${!canApprove} onClick=${approve}>
        <${Icon} name="check" size=${16} />اعتماد الانتقال إلى المرحلة ${toPhase}</button>`;

  return html`<${Modal} title=${isRts ? `معايير العودة للرياضة — ${p.name}` : `مراجعة معايير الانتقال — ${p.name}`} onClose=${onClose} footer=${footer} wide>
    <div class="row-between">
      <div class="stack-sm" style="gap:2px">
        <span class="eyebrow">${isRts ? 'المرحلة 6 ← العودة للرياضة' : `المرحلة ${p.phase} ← المرحلة ${toPhase}`}</span>
        <strong>${isRts ? 'جاهزية العودة للرياضة' : target?.nameAr}</strong>
        ${target ? html`<span class="small muted">${target.goalAr}</span>` : null}
      </div>
      <${CriteriaSummary} results=${results} />
    </div>
    ${allMet ? html`<${CriteriaDone} />` : html`<div class="note note-warn row" style="gap:8px;flex-wrap:nowrap;align-items:flex-start"><${Icon} name="alert" size=${16} />
      <span>ليست كل المعايير محققة أو مقاسة. يمكنك الاعتماد كقرار سريري مع تبرير مكتوب يُحفظ في السجل.</span></div>`}
    <${CriteriaList} results=${results} p=${p} />

    ${isRts ? html`<hr class="divider" /><h3>متصل العودة للرياضة</h3>
      <${RtsContinuum} p=${p} results=${results} idPrefix="appr-rts" />` : html`<div class="card card-flat stack">
      <${Check} id="appr-confirm" checked=${confirm} onChange=${setConfirm}><strong>راجعت المعايير سريريًا وأعتمد الانتقال</strong><//>
      <div class="field">
        <label for="appr-why">${needWhy ? 'التبرير السريري (مطلوب لأن بعض المعايير غير محققة)' : 'ملاحظة للسجل (اختياري)'}</label>
        <textarea class="textarea" id="appr-why" rows="2" value=${why} onInput=${(e) => setWhy(e.currentTarget.value)}
          placeholder=${needWhy ? 'مثال: الثني 108° حضوريًا مع تحسن ثابت، والمريض ملتزم؛ نعيد القياس بعد أسبوع' : ''}></textarea>
        ${needWhy && why.trim().length < 8 ? html`<span class="small muted">اكتب 8 أحرف على الأقل.</span>` : null}
      </div>
      <${Check} id="appr-load-program" checked=${loadProg} onChange=${setLoadProg}>تحميل برنامج المرحلة الجديدة (يستبدل البرنامج الحالي: ${p.program.length} تمارين)<//>
      ${loadProg ? html`<div class="stack-sm">
        <span class="small muted">البرنامج المقترح — ${proposed.length} تمارين (تعدّله لاحقًا من تبويب البرنامج):</span>
        <div class="list">${proposed.map((it) => {
          const ex = getEx(it.exId, cat);
          const fresh = !p.program.some((x) => x.exId === it.exId);
          return html`<div class="list-row wrap" key=${it.exId}>
            <span class="grow"><strong>${ex.nameAr}</strong> <span class="small muted">· ${CATEGORIES[ex.cat] || ex.cat}</span></span>
            <span class="small num">${doseLabel(it)} · ${it.freq}</span>
            ${fresh ? html`<${Pill} tone="info" icon="plus">جديد<//>` : html`<${Pill} tone="plain">مستمر<//>`}
          </div>`;
        })}</div></div>` : null}
      <p class="small muted">الاعتماد يُسجل باسم ${BY} مع لقطة من المعايير وقيمها الحالية.</p>
    </div>`}
  <//>`;
}
