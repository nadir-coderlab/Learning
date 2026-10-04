// Shared UI pieces. Every status is shown with an icon and a word, never color alone.
import { html, useEffect, useRef, useState } from './h.js';
import { initials } from './util.js';

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  list: 'M10 6h10M10 12h10M10 18h10M4 6l1.2 1.2L7.5 5M4 12l1.2 1.2L7.5 11M4 18l1.2 1.2L7.5 17',
  chart: 'M4 4v16h16M8 15l3.5-4.5 3 2.5L20 6',
  book: 'M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chat: 'M4 5h16v11H9.5L5 20v-4H4z',
  camera: 'M4 8h3.2L9 5.5h6L16.8 8H20v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6',
  bell: 'M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 3.5 2.5 20h19zM12 10v4.5M12 17.2v.3',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.6v.4',
  back: 'M9 6l6 6-6 6',
  forward: 'M15 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5',
  play: 'M8 5.5v13l10.5-6.5z',
  lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  unlock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 6.8-1.2',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  copy: 'M9 9h11v11H9zM5.5 15H4V4h11v1.5',
  sparkle: 'M12 3.5l1.7 5L19 10.2l-5.3 1.7L12 17l-1.7-5.1L5 10.2l5.3-1.7zM18.5 15.5l.7 1.9 1.8.6-1.8.7-.7 1.8-.6-1.8-1.9-.7 1.9-.6z',
  run: 'M14.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM6 21l3.5-6 3 2.5V21M9.5 15l1.5-6 4 3.5h3.5M11 9 7.5 8.5 5.5 11.5',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4.2M16 6h3a3 3 0 0 1-3 4.2M12 13v4M8.5 21h7M10 17h4',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M5 7h14M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9 7V4h6v3',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  image: 'M4 5h16v14H4zM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM20 15.5l-5-5-9 8.5',
  video: 'M3.5 7h11.5v10H3.5zM15 10.5l5.5-3.5v10L15 13.5',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  activity: 'M3 12h4l3-7.5 4 15 3-7.5h4',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 12.8a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6z',
  refresh: 'M20 11.5a8 8 0 1 0-2.3 5.6M20 4.5v7h-7',
  send: 'M20 4 3.5 11l6.5 2.5L12.5 20z M10 13.5 20 4',
  dumbbell: 'M6.5 7.5v9M3.5 10v4M17.5 7.5v9M20.5 10v4M6.5 12h11',
  layers: 'M12 3.5l9 4.8-9 4.8-9-4.8zM3 12.7l9 4.8 9-4.8M3 16.8l9 4.7 9-4.7',
  bolt: 'M13 2.5 4.5 13.5h6.5l-1 8 8.5-11h-6.5z',
  clipboard: 'M8.5 4h7v3h-7zM6.5 5.5H5V21h14V5.5h-1.5M8.5 12h7M8.5 16h5',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  file: 'M6 3h8.5L19 7.5V21H6zM14 3v5h5M9 13h7M9 17h5',
  knee: 'M9 3c.5 3 1 5.5.6 8.2-.2 1.6 1 2.6 2.6 2.6h0c1.8 0 2.8 1.5 2.4 3.2L13.5 21M9.6 11.2c1.4-.4 2.6-.2 3.6.8',
  scale: 'M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z',
  mic: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  speaker: 'M4 9.5h3.5L13 5v14l-5.5-4.5H4zM16.5 9.5a3.5 3.5 0 0 1 0 5M19 7a7 7 0 0 1 0 10',
};

export function Icon({ name, size = 20, stroke = 1.8, title, fill = false }) {
  const d = ICONS[name] || ICONS.info;
  return html`<svg width=${size} height=${size} viewBox="0 0 24 24" aria-hidden=${title ? undefined : 'true'} role=${title ? 'img' : undefined}
    fill=${fill ? 'currentColor' : 'none'} stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round">
    ${title ? html`<title>${title}</title>` : null}<path d=${d} /></svg>`;
}

/** Brand glyph: a recovery ring, nearly closed. */
export function Mark({ size = 32 }) {
  return html`<svg width=${size} height=${size} viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="3.2" />
    <path d="M16 5.5a10.5 10.5 0 1 1-7.4 3.1" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" />
    <circle cx="16" cy="16" r="2.6" fill="currentColor" /></svg>`;
}

/** Progress ring (the signature element). value 0–100; children render in the middle. */
export function Ring({ value = 0, size = 112, stroke = 8, tone = '', label, children }) {
  const r = 50 - stroke / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return html`<div class="ring" style=${`--ring:${size}px`} role=${label ? 'img' : undefined} aria-label=${label}>
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle class="ring-track" cx="50" cy="50" r=${r} stroke-width=${stroke} />
      <circle class=${`ring-fill ${tone}`} cx="50" cy="50" r=${r} stroke-width=${stroke} stroke-dasharray=${c.toFixed(2)} stroke-dashoffset=${(c * (1 - v / 100)).toFixed(2)} />
    </svg>
    <div class="ring-center">${children}</div>
  </div>`;
}

export const STATUS = {
  green: { cls: 'pill-ok', icon: 'check', label: 'على المسار' },
  yellow: { cls: 'pill-warn', icon: 'alert', label: 'يحتاج مراجعة' },
  red: { cls: 'pill-alert', icon: 'alert', label: 'تنبيه سريري' },
  idle: { cls: 'pill-idle', icon: 'clock', label: 'غير نشط / لا بيانات' },
  approval: { cls: 'pill-info', icon: 'flag', label: 'بانتظار اعتماد المرحلة' },
};

export function StatusPill({ code, label }) {
  const s = STATUS[code] || STATUS.idle;
  return html`<span class=${`pill ${s.cls}`}><${Icon} name=${s.icon} size=${14} stroke=${2.2} />${label || s.label}</span>`;
}

export function Pill({ tone = 'plain', icon, children }) {
  return html`<span class=${`pill pill-${tone}`}>${icon ? html`<${Icon} name=${icon} size=${14} stroke=${2.2} />` : null}${children}</span>`;
}

export function Meter({ value, max = 100, tone, thin, label }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return html`<div class=${`meter ${tone ? `meter-${tone}` : ''} ${thin ? 'meter-thin' : ''}`} role="progressbar"
    aria-valuemin="0" aria-valuemax=${max} aria-valuenow=${Math.round(value)} aria-label=${label || ''}>
    <span style=${`width:${w}%`}></span></div>`;
}

export function Card({ title, actions, children, className = '', eyebrow }) {
  return html`<section class=${`card ${className}`}>
    ${title || actions ? html`<div class="card-head">
      <div class="stack-sm" style="gap:2px">${eyebrow ? html`<span class="eyebrow">${eyebrow}</span>` : null}${title ? html`<h3>${title}</h3>` : null}</div>
      ${actions ? html`<div class="row">${actions}</div>` : null}</div>` : null}
    ${children}</section>`;
}

export function Tabs({ tabs, active, onChange, label = 'أقسام' }) {
  return html`<div class="tabs" role="tablist" aria-label=${label}>
    ${tabs.map((t) => html`<button role="tab" id=${`tab-${t.id}`} aria-selected=${String(active === t.id)} onClick=${() => onChange(t.id)}>
      ${t.label}${t.count ? html` <span class="tag num">${t.count}</span>` : null}</button>`)}
  </div>`;
}

export function Seg({ options, value, onChange, label }) {
  return html`<div class="seg" role="group" aria-label=${label || ''}>
    ${options.map((o) => html`<button type="button" aria-pressed=${String(value === o.id)} onClick=${() => onChange(o.id)}>${o.label}</button>`)}
  </div>`;
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const opener = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector('button, [href], input, select, textarea')?.focus?.();
    return () => { window.removeEventListener('keydown', onKey); if (opener && opener.focus && document.contains(opener)) opener.focus(); };
  }, []);
  return html`<div class="modal-backdrop" onClick=${(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
    <div class=${`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label=${title} ref=${ref}>
      <div class="modal-head"><h2 style="font-size:var(--step-1)">${title}</h2>
        <button class="icon-btn" aria-label="إغلاق" onClick=${onClose}><${Icon} name="x" /></button></div>
      <div class="modal-body">${children}</div>
      ${footer ? html`<div class="modal-foot">${footer}</div>` : null}
    </div></div>`;
}

export function YesNo({ value, onChange, yesLabel = 'نعم', noLabel = 'لا', id }) {
  return html`<div class="yesno" role="group" id=${id}>
    <button type="button" class="yes" aria-pressed=${String(value === true)} onClick=${() => onChange(true)}>${yesLabel}</button>
    <button type="button" class="no" aria-pressed=${String(value === false)} onClick=${() => onChange(false)}>${noLabel}</button>
  </div>`;
}

export function painColor(v) {
  if (v <= 3) return 'var(--ok)';
  if (v <= 6) return 'var(--warn-mark)';
  return 'var(--alert)';
}

export function NRS({ value, onChange, id }) {
  return html`<div id=${id}>
    <div class="nrs" role="radiogroup" aria-label="شدة الألم من 0 إلى 10">
      ${Array.from({ length: 11 }, (_, i) => html`<button type="button" role="radio" aria-checked=${String(value === i)} aria-pressed=${String(value === i)}
        style=${value === i ? `background:${painColor(i)}` : ''} onClick=${() => onChange(i)}>${i}</button>`)}
    </div>
    <div class="nrs-legend"><span>بدون ألم</span><span>ألم متوسط</span><span>أسوأ ألم</span></div>
  </div>`;
}

export function Field({ label, hint, children, htmlFor }) {
  return html`<div class="field">${label ? html`<label for=${htmlFor}>${label}</label>` : null}${children}${hint ? html`<span class="small muted">${hint}</span>` : null}</div>`;
}

export function Empty({ icon = 'info', title, children }) {
  return html`<div class="empty"><${Icon} name=${icon} size=${28} /><strong>${title}</strong>${children ? html`<div class="small">${children}</div>` : null}</div>`;
}

export function Avatar({ name, small }) {
  return html`<span class=${`avatar ${small ? 'avatar-sm' : ''}`} aria-hidden="true">${initials(name)}</span>`;
}

export function AiMark({ label = 'مولَّد بالذكاء الاصطناعي — يراجعه الأخصائي' }) {
  return html`<span class="ai-mark"><${Icon} name="sparkle" size=${13} />${label}</span>`;
}

/* ---------- toast ---------- */
export function toast(message) {
  window.dispatchEvent(new CustomEvent('msr-toast', { detail: message }));
}
export function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const id = Math.random().toString(36).slice(2);
      setItems((xs) => [...xs, { id, text: e.detail }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200);
    };
    window.addEventListener('msr-toast', on);
    return () => window.removeEventListener('msr-toast', on);
  }, []);
  return html`<div class="toast-host" aria-live="polite">${items.map((t) => html`<div class="toast" key=${t.id}>${t.text}</div>`)}</div>`;
}

/* ---------- goniometer gauge ---------- */
// Half-dial from 0 to `max` degrees, like a clinic goniometer. Target zone shaded.
export function Gauge({ value, max = 150, target, label, unit = '°', size = 220 }) {
  const cx = 110; const cy = 104; const r = 86;
  const ang = (v) => Math.PI - (Math.max(0, Math.min(max, v)) / max) * Math.PI;
  const pt = (v, rr = r) => [cx + rr * Math.cos(ang(v)), cy - rr * Math.sin(ang(v))];
  const arc = (a, b, rr = r) => {
    const [x1, y1] = pt(a, rr); const [x2, y2] = pt(b, rr);
    const large = (b - a) / max > 0.5 ? 1 : 0;
    return `M${x1} ${y1} A${rr} ${rr} 0 ${large} 1 ${x2} ${y2}`;
  };
  const ticks = [];
  for (let v = 0; v <= max; v += 10) {
    const major = v % 30 === 0;
    const [x1, y1] = pt(v, r + 6); const [x2, y2] = pt(v, r + (major ? 14 : 10));
    ticks.push(html`<line x1=${x1} y1=${y1} x2=${x2} y2=${y2} stroke-width=${major ? 1.4 : 0.8} />`);
    if (major) { const [tx, ty] = pt(v, r + 24); ticks.push(html`<text x=${tx} y=${ty + 3} text-anchor="middle">${v}</text>`); }
  }
  const hasVal = Number.isFinite(value);
  const [nx, ny] = pt(hasVal ? value : 0, r - 10);
  return html`<div class="gauge" style=${`max-width:${size}px;width:100%`}>
    <svg viewBox="0 0 220 128" role="img" aria-label=${`${label || 'الزاوية'}: ${hasVal ? Math.round(value) : '—'} درجة`}>
      <path class="g-track" d=${arc(0, max)} stroke-width="14" fill="none" stroke-linecap="round" />
      ${target ? html`<path class="g-target" d=${arc(target[0], target[1])} stroke-width="14" fill="none" />` : null}
      <g class="g-ticks">${ticks}</g>
      ${hasVal ? html`<line class="g-needle" x1=${cx} y1=${cy} x2=${nx} y2=${ny} stroke-width="3" stroke-linecap="round" />` : null}
      <circle class="g-hub" cx=${cx} cy=${cy} r="5" />
    </svg>
    <div class="gauge-value num">${hasVal ? Math.round(value) : '—'}${hasVal ? unit : ''}</div>
    ${label ? html`<div class="small muted">${label}</div>` : null}
  </div>`;
}

/* ---------- animated skeleton figure (stands in for exercise videos) ---------- */
// Joint angles drive forward kinematics, so the figure keeps its proportions.
const L = { shank: 26, thigh: 27, trunk: 30, head: 6.5, foot: 9, arm: 15, fore: 13.5 };
const rad = (d) => (d * Math.PI) / 180;
const wave = (t, period = 2.4) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period); // 0..1..0
function fromAnkleUp(ax, ay, shankDeg, thighDeg, trunkDeg) {
  // angles from vertical, positive = leaning toward +x
  const K = [ax + L.shank * Math.sin(rad(shankDeg)), ay - L.shank * Math.cos(rad(shankDeg))];
  const H = [K[0] + L.thigh * Math.sin(rad(thighDeg)), K[1] - L.thigh * Math.cos(rad(thighDeg))];
  const S = [H[0] + L.trunk * Math.sin(rad(trunkDeg)), H[1] - L.trunk * Math.cos(rad(trunkDeg))];
  return { A: [ax, ay], K, H, S };
}
function fromHipOut(H, thighFromHoriz, kneeFlex, dir = 1) {
  // supine: leg extends toward +x (dir) from hip; thigh raised by angle; shank bends down by kneeFlex
  const t = rad(thighFromHoriz);
  const K = [H[0] + dir * L.thigh * Math.cos(t), H[1] - L.thigh * Math.sin(t)];
  const s = t - rad(kneeFlex);
  const A = [K[0] + dir * L.shank * Math.cos(s), K[1] - L.shank * Math.sin(s)];
  return { H, K, A };
}
function poseFor(motion, t) {
  const ground = 104;
  switch (motion) {
    case 'heelSlide': {
      const H = [80, ground - 6];
      const alpha = 8 + 44 * wave(t);
      const beta = Math.asin(Math.min(1, (L.thigh * Math.sin(rad(alpha)) + 0) / L.shank)) * (180 / Math.PI);
      const leg = fromHipOut(H, alpha, alpha + beta);
      return { kind: 'supine', H, leg, other: fromHipOut(H, 0, 0), flex: alpha + beta };
    }
    case 'slr': {
      const H = [80, ground - 6];
      const a = 40 * wave(t);
      return { kind: 'supine', H, leg: fromHipOut(H, a, 0), other: fromHipOut(H, 25, 70), flex: 0 };
    }
    case 'quadSet':
    case 'heelProp': {
      const H = [80, ground - 6];
      const lift = motion === 'heelProp' ? 6 : 1.2 * wave(t, 1.6);
      return { kind: 'supine', H, leg: fromHipOut(H, lift, lift * 0.9), other: fromHipOut(H, 0, 0), prop: motion === 'heelProp', pulse: motion === 'quadSet' ? wave(t, 1.6) : 0, flex: 0 };
    }
    case 'anklePump': {
      const H = [80, ground - 6];
      return { kind: 'supine', H, leg: fromHipOut(H, 0, 0), other: fromHipOut(H, 0, 0), ankle: -20 + 45 * wave(t, 1.4), flex: 0 };
    }
    case 'bridge': {
      const up = wave(t);
      const A = [124, ground];
      const H = [80, ground - 5 - 18 * up];
      // knee found by intersecting thigh & shank circles
      const K = circleJoin(H, A, L.thigh, L.shank, -1);
      return { kind: 'bridge', H, leg: { H, K, A }, flex: 90 };
    }
    case 'seatedExt':
    case 'seatedFlex': {
      const H = [84, 70];
      const flex = motion === 'seatedExt' ? 90 - 85 * wave(t) : 90 + 25 * wave(t);
      return { kind: 'seated', H, leg: fromHipOut(H, 0, flex), other: fromHipOut(H, 0, 90), flex };
    }
    case 'bike': {
      const H = [88, 58];
      const crank = [112, 88];
      const phase = (t / 1.6) * 2 * Math.PI;
      const pedal = [crank[0] + 10 * Math.cos(phase), crank[1] + 10 * Math.sin(phase)];
      const pedal2 = [crank[0] - 10 * Math.cos(phase), crank[1] - 10 * Math.sin(phase)];
      const K = circleJoin(H, pedal, L.thigh, L.shank, -1);
      const K2 = circleJoin(H, pedal2, L.thigh, L.shank, -1);
      return { kind: 'bike', H, leg: { H, K, A: pedal }, other: { H, K: K2, A: pedal2 }, crank };
    }
    case 'squat':
    case 'wallSit':
    case 'legPress': {
      const d = motion === 'wallSit' ? 0.75 : wave(t);
      const shank = 4 + 32 * d; const thigh = -6 - 62 * d; const trunk = motion === 'wallSit' ? 0 : 6 + 32 * d;
      const p = fromAnkleUp(92, ground, shank, thigh, trunk);
      return { kind: 'stand', ...p, flex: shank - thigh, wall: motion === 'wallSit' };
    }
    case 'splitSquat': {
      const d = wave(t);
      const front = fromAnkleUp(108, ground, 6 + 20 * d, -12 - 60 * d, 4);
      const backK = [front.H[0] - 16, front.H[1] + 26];
      return { kind: 'stand', ...front, back: { H: front.H, K: [backK[0] - 3, ground - 10 + (1 - d) * -8], A: [backK[0] - 20, ground - 3] }, flex: 26 + 80 * d };
    }
    case 'stepUp': {
      const d = wave(t);
      const p = fromAnkleUp(110, ground - 12, 22 - 18 * d, -60 + 58 * d, 10 - 6 * d);
      return { kind: 'stand', ...p, step: true, back: { H: p.H, K: [p.H[0] - 6, p.H[1] + 23 + d * 4], A: [p.H[0] - 10 + d * 14, Math.min(ground, p.H[1] + 49 + d * 3)] }, flex: 60 };
    }
    case 'stepDown': {
      const d = wave(t);
      const p = fromAnkleUp(110, ground - 12, 4 + 26 * d, -4 - 50 * d, 6 + 12 * d);
      return { kind: 'stand', ...p, step: true, back: { H: p.H, K: [p.H[0] + 8, p.H[1] + 26], A: [p.H[0] + 17, p.H[1] + 50 + 6 * d] }, flex: 30 + 76 * d };
    }
    case 'calfRaise': {
      const d = wave(t, 1.8);
      const p = fromAnkleUp(92, ground - 8 * d, 2, -2, 3);
      return { kind: 'stand', ...p, heel: d, flex: 0 };
    }
    case 'balance': {
      const sway = Math.sin(t * 2.2) * 2;
      const p = fromAnkleUp(92, ground, 2 + sway * 0.3, -2, 2 + sway);
      return { kind: 'stand', ...p, back: { H: p.H, K: [p.H[0] + 17, p.H[1] + 17], A: [p.H[0] + 8, p.H[1] + 35] }, flex: 0 };
    }
    case 'hinge': {
      const d = wave(t);
      const p = fromAnkleUp(92, ground, 6, -4 - 6 * d, 10 + 70 * d);
      return { kind: 'stand', ...p, back: { H: p.H, K: [p.H[0] - 23 * d - 3, p.H[1] + 23 - 14 * d], A: [p.H[0] - 48 * d - 5, p.H[1] + 49 - 40 * d] }, flex: 10 };
    }
    case 'hamCurl': {
      const d = wave(t);
      const p = fromAnkleUp(92, ground, 2, -2, 3);
      const K = [p.H[0] - 1, p.H[1] + L.thigh];
      const ang = rad(90 * d);
      return { kind: 'stand', ...p, back: { H: p.H, K, A: [K[0] - L.shank * Math.sin(ang), K[1] + L.shank * Math.cos(ang)] }, flex: 0 };
    }
    case 'jump': {
      const c = (t % 2.2) / 2.2;
      let shank; let thigh; let trunk; let lift = 0;
      if (c < 0.35) { const d = c / 0.35; shank = 4 + 30 * d; thigh = -6 - 56 * d; trunk = 6 + 30 * d; }
      else if (c < 0.7) { const d = (c - 0.35) / 0.35; shank = 2; thigh = -2; trunk = 3; lift = Math.sin(d * Math.PI) * 26; }
      else { const d = (c - 0.7) / 0.3; const k = Math.sin(d * Math.PI); shank = 4 + 26 * k; thigh = -6 - 46 * k; trunk = 6 + 26 * k; }
      const p = fromAnkleUp(92, ground - lift * 0.7, shank, thigh, trunk);
      return { kind: 'stand', ...p, flex: shank - thigh };
    }
    case 'run':
    default: {
      const ph = (t / 0.9) * 2 * Math.PI;
      const H = [100, 54 - Math.abs(Math.sin(ph)) * 3];
      const legA = runLeg(H, ph);
      const legB = runLeg(H, ph + Math.PI);
      return { kind: 'run', H, leg: legA, other: legB, S: [H[0] + 6, H[1] - L.trunk] };
    }
  }
}
function runLeg(H, ph) {
  const thigh = 28 * Math.sin(ph); // degrees from vertical
  const knee = 20 + 45 * Math.max(0, Math.sin(ph - 1.1));
  const K = [H[0] + L.thigh * Math.sin(rad(thigh)), H[1] + L.thigh * Math.cos(rad(thigh))];
  const sh = thigh - knee;
  const A = [K[0] + L.shank * Math.sin(rad(sh)), K[1] + L.shank * Math.cos(rad(sh))];
  return { H, K, A };
}
function circleJoin(P, Q, r1, r2, side = 1) {
  const dx = Q[0] - P[0]; const dy = Q[1] - P[1];
  const d = Math.max(Math.min(Math.hypot(dx, dy), r1 + r2 - 0.01), Math.abs(r1 - r2) + 0.01);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = P[0] + (a * dx) / d; const my = P[1] + (a * dy) / d;
  return [mx + (side * h * dy) / d, my - (side * h * dx) / d];
}
const line = (a, b, cls = 'bone') => html`<line class=${cls} x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} />`;
const joint = (p, r = 3.2) => html`<circle class="joint" cx=${p[0]} cy=${p[1]} r=${r} />`;

function renderPose(p) {
  const els = [];
  const floor = html`<line class="floor" x1="6" y1="104" x2="194" y2="104" />`;
  els.push(floor);
  if (p.kind === 'supine' || p.kind === 'bridge') {
    const H = p.H;
    const S = [H[0] - L.trunk - 4, H[1] + (p.kind === 'bridge' ? (104 - 5 - H[1]) * 0.85 : 0)];
    const headC = [S[0] - 9, S[1] - 1];
    if (p.prop) els.push(html`<rect class="prop" x=${p.leg.A[0] - 8} y=${p.leg.A[1] + 3} width="18" height=${Math.max(4, 104 - p.leg.A[1] - 3)} rx="5" />`);
    if (p.other) { els.push(line(p.other.H, p.other.K, 'bone bone-op')); els.push(line(p.other.K, p.other.A, 'bone bone-op')); }
    els.push(line(S, H));
    els.push(html`<circle class="head" cx=${headC[0]} cy=${headC[1]} r=${L.head} />`);
    els.push(line([S[0] + 6, S[1]], [S[0] + 26, S[1] + 2]));
    els.push(line(p.leg.H, p.leg.K)); els.push(line(p.leg.K, p.leg.A));
    const footAng = rad(-80 + (p.ankle || 0));
    els.push(line(p.leg.A, [p.leg.A[0] + L.foot * Math.cos(footAng) * 0.3, p.leg.A[1] + L.foot * Math.sin(footAng)]));
    if (p.pulse) els.push(html`<circle cx=${(p.leg.H[0] + p.leg.K[0]) / 2} cy=${(p.leg.H[1] + p.leg.K[1]) / 2 - 2} r=${4 + 6 * p.pulse} fill="none" stroke="var(--series-2)" stroke-width="2" opacity=${1 - p.pulse} />`);
    [p.leg.H, p.leg.K, p.leg.A].forEach((j) => els.push(joint(j)));
  } else if (p.kind === 'seated' || p.kind === 'bike') {
    const H = p.H;
    const S = [H[0] - 4, H[1] - L.trunk];
    if (p.kind === 'seated') els.push(html`<rect class="prop" x=${H[0] - 26} y=${H[1] + 4} width="44" height="8" rx="3" /><line class="floor" x1=${H[0] - 20} y1=${H[1] + 12} x2=${H[0] - 20} y2="104" /><line class="floor" x1=${H[0] + 12} y1=${H[1] + 12} x2=${H[0] + 12} y2="104" />`);
    if (p.kind === 'bike') els.push(html`<circle class="prop" cx=${p.crank[0]} cy=${p.crank[1]} r="13" fill="none" /><line class="floor" x1=${H[0]} y1=${H[1] + 4} x2=${p.crank[0]} y2=${p.crank[1]} /><rect class="prop" x=${H[0] - 10} y=${H[1] + 2} width="20" height="5" rx="2" />`);
    if (p.other) { els.push(line(p.other.H, p.other.K, 'bone bone-op')); els.push(line(p.other.K, p.other.A, 'bone bone-op')); }
    els.push(line(H, S));
    els.push(html`<circle class="head" cx=${S[0]} cy=${S[1] - 9} r=${L.head} />`);
    els.push(line(S, [S[0] + 10, S[1] + 18])); els.push(line([S[0] + 10, S[1] + 18], [S[0] + 26, S[1] + 22]));
    els.push(line(p.leg.H, p.leg.K)); els.push(line(p.leg.K, p.leg.A));
    els.push(line(p.leg.A, [p.leg.A[0] + 10, p.leg.A[1] + 1]));
    [p.leg.H, p.leg.K, p.leg.A].forEach((j) => els.push(joint(j)));
  } else if (p.kind === 'run') {
    const H = p.H; const S = p.S;
    els.push(line(p.other.H, p.other.K, 'bone bone-op')); els.push(line(p.other.K, p.other.A, 'bone bone-op'));
    els.push(line(H, S));
    els.push(html`<circle class="head" cx=${S[0] + 2} cy=${S[1] - 9} r=${L.head} />`);
    els.push(line(S, [S[0] - 8, S[1] + 18])); els.push(line([S[0] - 8, S[1] + 18], [S[0] + 4, S[1] + 26]));
    els.push(line(p.leg.H, p.leg.K)); els.push(line(p.leg.K, p.leg.A));
    els.push(line(p.leg.A, [p.leg.A[0] + 10, p.leg.A[1] + 2]));
    [p.leg.H, p.leg.K, p.leg.A].forEach((j) => els.push(joint(j)));
  } else {
    // standing family
    const { A, K, H, S } = p;
    if (p.step) els.push(html`<rect class="prop" x=${A[0] - 18} y=${A[1]} width="52" height=${Math.max(2, 104 - A[1])} rx="3" />`);
    if (p.wall) els.push(html`<line class="floor" x1=${H[0] - 4} y1="10" x2=${H[0] - 4} y2="104" />`);
    if (p.back) { els.push(line(p.back.H, p.back.K, 'bone bone-op')); els.push(line(p.back.K, p.back.A, 'bone bone-op')); }
    els.push(line(H, S));
    const dir = [S[0] - H[0], S[1] - H[1]]; const len = Math.hypot(dir[0], dir[1]) || 1;
    const headC = [S[0] + (dir[0] / len) * 9, S[1] + (dir[1] / len) * 9];
    els.push(html`<circle class="head" cx=${headC[0]} cy=${headC[1]} r=${L.head} />`);
    els.push(line(S, [S[0] + 6, S[1] + 18])); els.push(line([S[0] + 6, S[1] + 18], [S[0] + 18, S[1] + 22]));
    els.push(line(A, K)); els.push(line(K, H));
    const heelLift = p.heel ? 8 * p.heel : 0;
    els.push(line(A, [A[0] + L.foot, A[1] + Math.min(heelLift, 8) + (p.heel ? 0 : 0)]));
    [A, K, H].forEach((j) => els.push(joint(j)));
  }
  return els;
}

const MOTION_LABEL = {
  heelSlide: 'سحب الكعب', slr: 'رفع الساق', quadSet: 'شد الفخذ', heelProp: 'فرد الركبة', anklePump: 'ضخ الكاحل',
  bridge: 'الجسر', seatedExt: 'مد الركبة جالسًا', seatedFlex: 'ثني الركبة جالسًا', bike: 'الدراجة', squat: 'القرفصاء',
  wallSit: 'الجلوس على الحائط', legPress: 'ضغط الأرجل', splitSquat: 'القرفصاء المنقسم', stepUp: 'الصعود على درجة',
  stepDown: 'النزول من درجة', calfRaise: 'رفع الكعبين', balance: 'الوقوف على رجل', hinge: 'الرفعة الرومانية',
  hamCurl: 'ثني الركبة', jump: 'القفز والهبوط', run: 'الجري',
};

export function Figure({ motion = 'squat', playing = true, showAngle = true }) {
  const [t, setT] = useState(0.6);
  useEffect(() => {
    if (!playing || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf; let start;
    const loop = (ts) => { if (start === undefined) start = ts; setT((ts - start) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, motion]);
  const p = poseFor(motion, t);
  const flex = Number.isFinite(p.flex) ? Math.round(p.flex) : null;
  return html`<svg class="figure-svg" viewBox="0 0 200 112" role="img" aria-label=${`عرض حركة: ${MOTION_LABEL[motion] || ''}`}>
    ${renderPose(p)}
    ${showAngle && flex !== null && flex > 4 ? html`<text class="angle-text" x="46" y="16" text-anchor="middle">ثني الركبة ${flex}°</text>` : null}
  </svg>`;
}
