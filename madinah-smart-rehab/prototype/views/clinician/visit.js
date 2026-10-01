// Virtual-visit modal: rule-based brief (always works), optional AI summary, plan, and a SOAP note ready for Raqeem.
import { html, useEffect, useRef, useState } from '../../lib/h.js';
import { Icon, Modal, AiMark, StatusPill, toast } from '../../lib/ui.js';
import { preVisitBrief, soapNote, statusOf, postOpDay, weekOf } from '../../lib/engine.js';
import { aiPreVisit, aiErrorText } from '../../lib/ai.js';
import { dispatch } from '../../lib/store.js';
import { copyText } from '../../lib/util.js';
import { BY, Check, phaseName } from './common.js';

const PLAN = [
  { id: 'continue', ar: 'متابعة البرنامج الحالي', en: 'Continue current home programme' },
  { id: 'progress', ar: 'رفع الجرعة تدريجيًا', en: 'Progress exercise dose as tolerated' },
  { id: 'reduce', ar: 'خفض الجرعة مؤقتًا', en: 'Reduce load temporarily (pain/swelling response)' },
  { id: 'inperson', ar: 'طلب زيارة حضورية', en: 'Request in-person assessment' },
  { id: 'edu-swelling', ar: 'تثقيف حول الألم والتورم', en: 'Education: pain and swelling management' },
  { id: 'edu-ext', ar: 'تثقيف حول فرد الركبة الكامل', en: 'Education: full knee extension' },
  { id: 'criteria', ar: 'مراجعة معايير الانتقال في الزيارة القادمة', en: 'Review progression criteria at next visit' },
];

function normalizeAi(res) {
  let obj = res;
  if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch { return null; } }
  if (obj && typeof obj === 'object' && !obj.summary && (obj.data || obj.result || obj.json)) obj = obj.data || obj.result || obj.json;
  if (!obj || typeof obj !== 'object' || (!obj.summary && !obj.soapEn)) return null;
  const arr = (x) => (Array.isArray(x) ? x.filter((s) => typeof s === 'string') : []);
  return { summary: String(obj.summary || ''), concerns: arr(obj.concerns), discuss: arr(obj.discuss), soapEn: obj.soapEn && typeof obj.soapEn === 'object' ? obj.soapEn : null };
}

function AiPanel({ p, cat }) {
  const [ai, setAi] = useState({ status: 'idle' });
  const ctrl = useRef(null);
  useEffect(() => () => ctrl.current?.abort(), []);
  const run = async () => {
    const c = new AbortController();
    ctrl.current = c;
    let got = '';
    setAi({ status: 'thinking', chars: 0 });
    try {
      const res = await aiPreVisit(p, {
        cat, signal: c.signal,
        onText: (t) => {
          if (typeof t !== 'string') return;
          got = t.startsWith(got) ? t : got + t;
          setAi((a) => (a.status === 'thinking' ? { ...a, chars: got.length } : a));
        },
      });
      if (c.signal.aborted) return;
      const out = normalizeAi(res);
      setAi(out ? { status: 'done', res: out } : { status: 'error', msg: aiErrorText('invalid_json') });
    } catch (e) {
      if (c.signal.aborted || e?.name === 'AbortError' || e?.code === 'cancelled') { setAi({ status: 'idle', stopped: true }); return; }
      setAi({ status: 'error', msg: aiErrorText(e?.code) || aiErrorText() });
    }
  };
  const stop = () => { ctrl.current?.abort(); setAi({ status: 'idle', stopped: true }); };
  const r = ai.res;
  const soapText = r?.soapEn ? ['S', 'O', 'A', 'P'].filter((k) => r.soapEn[k]).map((k) => `${k}: ${r.soapEn[k]}`).join('\n') : '';
  return html`<section class="card card-flat stack-sm" aria-labelledby="vv-ai-title">
    <div class="row-between">
      <h3 id="vv-ai-title" class="row" style="gap:6px"><${Icon} name="sparkle" size=${17} />ملخص بالذكاء الاصطناعي</h3>
      ${ai.status === 'thinking'
        ? html`<button type="button" class="btn btn-sm btn-danger" id="vv-ai-stop" onClick=${stop}><${Icon} name="x" size=${15} />إيقاف</button>`
        : html`<button type="button" class="btn btn-sm" id="vv-ai-run" onClick=${run}><${Icon} name="sparkle" size=${15} />${ai.status === 'done' ? 'إعادة التوليد' : 'ملخص بالذكاء الاصطناعي'}</button>`}
    </div>
    ${ai.status === 'idle' ? html`<p class="small muted">${ai.stopped ? 'أُوقف التوليد. الملخص المبني على القواعد أعلاه يكفي للزيارة.' : 'يعيد صياغة البيانات نفسها في ملخص قصير ومسودة SOAP. اختياري — الملخص المبني على القواعد يعمل دائمًا.'}</p>` : null}
    ${ai.status === 'thinking' ? html`<p class="small row thinking" style="gap:6px" role="status"><span class="pulse-dot" aria-hidden="true"></span>يفكر…${ai.chars ? html` <span class="muted num">(${ai.chars} حرفًا)</span>` : null}</p>` : null}
    ${ai.status === 'error' ? html`<div class="note note-info small" role="status">${ai.msg}</div>` : null}
    ${ai.status === 'done' ? html`<div class="stack-sm">
      <${AiMark} />
      ${r.summary ? html`<p>${r.summary}</p>` : null}
      ${r.concerns.length ? html`<div><h4>نقاط تستدعي الانتباه</h4><ul class="plain-list">${r.concerns.map((c, i) => html`<li key=${i}>${c}</li>`)}</ul></div>` : null}
      ${r.discuss.length ? html`<div><h4>للنقاش مع المريض</h4><ul class="plain-list">${r.discuss.map((c, i) => html`<li key=${i}>${c}</li>`)}</ul></div>` : null}
      ${soapText ? html`<div class="stack-sm"><h4>مسودة SOAP (إنجليزي)</h4><pre class="code-note" style="margin:0">${soapText}</pre>
        <div><button type="button" class="btn btn-sm btn-ghost" id="vv-ai-copy" onClick=${async () => { const ok = await copyText(soapText); toast(ok ? 'نُسخت مسودة الذكاء الاصطناعي — راجعها قبل اللصق' : 'تعذر النسخ التلقائي'); }}>
          <${Icon} name="copy" size=${15} />نسخ المسودة</button></div></div>` : null}
      <p class="small muted">مسودة للمراجعة فقط؛ لا تتضمن قرارات ولا تُحفظ تلقائيًا.</p>
    </div>` : null}
  </section>`;
}

export function VirtualVisitModal({ p, cat, onClose }) {
  const st = statusOf(p, cat);
  const brief = preVisitBrief(p, cat);
  const day = postOpDay(p);
  const [plan, setPlan] = useState({ continue: true });
  const [free, setFree] = useState('');
  const [saved, setSaved] = useState(false);
  const pre = useRef(null);
  const planEn = PLAN.filter((x) => plan[x.id]).map((x) => x.en).concat(free.trim() ? [free.trim()] : []);
  const note = soapNote(p, { plan: planEn, visitType: 'virtual', by: BY }, cat);
  useEffect(() => { setSaved(false); }, [note]);

  const copy = async () => {
    const ok = await copyText(note, pre.current);
    toast(ok ? 'نُسخت الملاحظة — الصقها في رقيم' : 'تعذر النسخ التلقائي — النص محدد، انسخه يدويًا');
  };
  const save = () => {
    dispatch({ type: 'note/add', pid: p.id, by: BY, text: note });
    setSaved(true);
    toast('حُفظت الملاحظة في سجل المريض');
  };

  return html`<${Modal} title=${`العيادة الافتراضية — ${p.name}`} onClose=${onClose} wide
    footer=${html`<button type="button" class="btn btn-ghost" id="vv-close" onClick=${onClose}>إغلاق</button>
      <button type="button" class="btn" id="vv-copy" onClick=${copy}><${Icon} name="copy" size=${16} />نسخ الملاحظة</button>
      <button type="button" class="btn btn-primary" id="vv-save" disabled=${saved} onClick=${save}><${Icon} name="check" size=${16} />${saved ? 'حُفظت' : 'حفظ الملاحظة'}</button>`}>
    <div class="row" style="gap:8px">
      <${StatusPill} code=${st.code} />
      <span class="small muted">اليوم ${day} · الأسبوع ${weekOf(day)} · المرحلة ${p.phase}: ${phaseName(p.phase, cat)}</span>
    </div>
    <div class="grid-2 vv-grid">
      <section class="stack-sm" aria-labelledby="vv-brief-title">
        <h3 id="vv-brief-title">ملخص ما قبل الزيارة</h3>
        <span class="small muted">مبني على قواعد واضحة من بيانات المريض — يعمل دائمًا</span>
        <ul class="plain-list">${brief.points.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul>
      </section>
      <section class="stack-sm" aria-labelledby="vv-discuss-title">
        <h3 id="vv-discuss-title">نقاط للنقاش</h3>
        <ul class="plain-list">${brief.discuss.map((t, i) => html`<li key=${i}>${t}</li>`)}</ul>
      </section>
    </div>
    <${AiPanel} p=${p} cat=${cat} />
    <section class="stack-sm" aria-labelledby="vv-plan-title">
      <h3 id="vv-plan-title">الخطة</h3>
      <div class="plan-grid">${PLAN.map((x) => html`<${Check} key=${x.id} id=${`vv-plan-${x.id}`} checked=${Boolean(plan[x.id])} onChange=${(v) => setPlan({ ...plan, [x.id]: v })}>${x.ar}<//>`)}</div>
      <div class="field"><label for="vv-plan-free">خطة إضافية (سطر حر)</label>
        <input class="input" id="vv-plan-free" type="text" value=${free} onInput=${(e) => setFree(e.currentTarget.value)} placeholder="مثال: Add Nordic curls 2x/week from next week" /></div>
    </section>
    <section class="stack-sm" aria-labelledby="vv-note-title">
      <div class="row-between"><h3 id="vv-note-title">ملاحظة جاهزة للنسخ إلى رقيم</h3>
        <button type="button" class="btn btn-sm" id="vv-copy-inline" onClick=${copy}><${Icon} name="copy" size=${15} />نسخ</button></div>
      <pre class="code-note" style="margin:0" ref=${pre} tabindex="0" aria-label="نص الملاحظة بصيغة SOAP">${note}</pre>
      <span class="small muted">تتحدث تلقائيًا مع اختيارات الخطة. راجعها قبل اللصق في الملف الطبي.</span>
    </section>
  <//>`;
}
