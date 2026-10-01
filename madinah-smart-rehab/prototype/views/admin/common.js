// Shared helpers for the admin (management + content) workspace.
import { html } from '../../lib/h.js';
import { Icon } from '../../lib/ui.js';
import { mean } from '../../lib/util.js';

export const ADMIN = 'مدير المحتوى';

export const MOTIONS = [
  ['heelSlide', 'سحب الكعب'], ['slr', 'رفع الساق'], ['quadSet', 'شد الفخذ'], ['heelProp', 'فرد الركبة'], ['anklePump', 'ضخ الكاحل'],
  ['bridge', 'الجسر'], ['seatedExt', 'مد الركبة جالسًا'], ['seatedFlex', 'ثني الركبة جالسًا'], ['bike', 'الدراجة'], ['squat', 'القرفصاء'],
  ['wallSit', 'الجلوس على الحائط'], ['legPress', 'ضغط الأرجل'], ['splitSquat', 'القرفصاء المنقسم'], ['stepUp', 'الصعود على درجة'],
  ['stepDown', 'النزول من درجة'], ['calfRaise', 'رفع الكعبين'], ['balance', 'الوقوف على رجل'], ['hinge', 'الرفعة الرومانية'],
  ['hamCurl', 'ثني الركبة'], ['jump', 'القفز والهبوط'], ['run', 'الجري'],
];

export function num(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  return Number(String(v).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}
export function median(arr) {
  const a = arr.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return NaN;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
export const avg = (arr) => mean(arr.filter(Number.isFinite));

export function Check({ id, checked, onChange, children, disabled, role }) {
  return html`<label class="check-row" for=${id}>
    <input type="checkbox" id=${id} role=${role} checked=${checked} disabled=${disabled} onChange=${(e) => onChange(e.currentTarget.checked)} />
    <span>${children}</span></label>`;
}

export function FieldError({ text }) {
  return text ? html`<p class="field-error" role="alert"><${Icon} name="alert" size=${14} /> ${text}</p>` : null;
}

// Toggle chips for phases 1–6 (or any list of numbers).
export function NumberChips({ idPrefix, label, options, value, onChange }) {
  const set = new Set(value);
  const toggle = (n) => { const s = new Set(set); if (s.has(n)) s.delete(n); else s.add(n); onChange([...s].sort((a, b) => a - b)); };
  return html`<div class="row" role="group" aria-label=${label} style="gap:6px">
    ${options.map((n) => html`<button type="button" class="chip" key=${n} id=${`${idPrefix}-${n}`} aria-pressed=${String(set.has(n))} onClick=${() => toggle(n)}>${n}</button>`)}
  </div>`;
}

export function PageHead({ eyebrow, title, children }) {
  return html`<div class="page-head">
    <div class="stack-sm" style="gap:2px">${eyebrow ? html`<span class="eyebrow">${eyebrow}</span>` : null}<h1>${title}</h1></div>
    ${children ? html`<div class="row">${children}</div>` : null}
  </div>`;
}
