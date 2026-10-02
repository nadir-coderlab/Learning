// Measurement lab — the patient's "قياس" tab (MeasureHub) and the camera check opened from an
// exercise card (CameraCheck). Demo data only.
// Every number here is for follow-up, never for a decision: the in-clinic measurement is the
// reference. Photos and video stay on the device; only numbers are saved to the record.
import { html, useEffect, useRef, useState } from '../lib/h.js';
import { Icon, Gauge, Modal, Pill, Ring, toast } from '../lib/ui.js';
import { dispatch, useStore, patientById } from '../lib/store.js';
import { postOpDay, latest, lastWhere, readyForNext, SIDE_AR } from '../lib/engine.js';
import { relDay } from '../lib/util.js';
import { LineChart, Sparkline } from '../lib/charts.js';
import {
  loadPose, poseLoaded, createAnalyzer, flexionFromPoints, fppaFromPoints, pickLeg, median, LEG, POSE_LINKS, otherSide, kneeFlexion, fppa,
} from '../lib/pose.js';
import { assessFrame, createCoach, createVoice, COACH_SPEECH, VOICE_LINES, uprightError, rateReps, scoreConfidence, CONF_AR, REP_Q_AR, arabicCount, flexTarget } from '../lib/coach.js';
import { Guide, GuideFigure } from '../lib/guides.js';
import {
  cssVar, openCamera, stopStream, cameraBlockedByPolicy, videoReady, requestMotionPermission, watchOrientation,
  decodeImage, toCanvas, imageQuality, onceEvent, seekTo, videoDuration, sampleLuma,
} from '../lib/sensors.js';

const FOLLOW_UP = 'للمتابعة وليس للقرار — القياس الحضوري هو المرجع';
const ON_DEVICE = 'التحليل داخل جهازك ولا يُرفع الفيديو';
const VISUAL_ONLY = 'للمراجعة البصرية فقط — ليس رقمًا للقرار';
const SOURCE_AR = { clinic: 'قياس حضوري', camera: 'الكاميرا', photo: 'صورة', phone: 'الجوال كمنقلة', patient: 'المريض' };
const METHOD_AR = { live: 'كاميرا مباشرة', video: 'فيديو مسجل', photo: 'صورة', phone: 'الجوال كمنقلة' };
const MAX_VIDEO_SEC = 90;
const VIDEO_STEP = 0.1; // seconds between analysed frames (~10 per second)

const fin = Number.isFinite;
const iso = (s) => `\u2066${s}\u2069`; // keeps "95°" readable inside Arabic sentences
const degTxt = (v) => (fin(v) ? `${Math.round(v)}°` : '—');
const signedTxt = (v) => {
  if (!fin(v)) return '—';
  const r = Math.round(v);
  return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r)}°`;
};
const Deg = ({ v, signed }) => html`<span class="ltr">${signed ? signedTxt(v) : degTxt(v)}</span>`;
const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- small building blocks ---------- */
function MxSeg({ id, options, value, onChange, label, disabled }) {
  return html`<div class="seg" role="group" aria-label=${label} id=${id}>
    ${options.map((o) => html`<button type="button" id=${`${id}-${o.id}`} aria-pressed=${String(value === o.id)} disabled=${disabled}
      onClick=${() => onChange(o.id)}>${o.label}</button>`)}
  </div>`;
}

function FileButton({ id, accept, capture, label, icon = 'camera', primary, onFile, disabled }) {
  return html`<span class="mx-filebtn">
    <input class="mx-file" type="file" id=${id} accept=${accept} capture=${capture} disabled=${disabled}
      onChange=${(e) => { const f = e.currentTarget.files && e.currentTarget.files[0]; e.currentTarget.value = ''; if (f) onFile(f); }} />
    <label for=${id} class=${`btn ${primary ? 'btn-primary' : ''}`} aria-disabled=${disabled ? 'true' : undefined}><${Icon} name=${icon} size=${16} />${label}</label>
  </span>`;
}

function Stat({ id, label, children, live }) {
  return html`<div class="stat" id=${id} aria-live=${live ? 'polite' : undefined}><span class="label">${label}</span><span class="value num">${children}</span></div>`;
}

/** Box with the media's aspect ratio, capped in height so phones keep the controls in view. */
function StageBox({ w, h, maxH = '56vh', className = '', children }) {
  const ar = w && h ? w / h : 4 / 3;
  return html`<div class="measure-stage"><div class=${`mx-box ${className}`} style=${`aspect-ratio:${w || 4} / ${h || 3};width:min(100%, calc(${maxH} * ${ar.toFixed(4)}))`}>${children}</div></div>`;
}

function Empty({ icon, text }) {
  return html`<div class="measure-stage"><div class="mx-empty"><${Icon} name=${icon} size=${30} /><span>${text}</span></div></div>`;
}

/* ---------- canvas drawing ---------- */
function themeColors() {
  return {
    op: cssVar('--series-2', '#C9731C'),
    accent: cssVar('--accent', '#1F5FAE'),
    font: cssVar('--font-body', 'sans-serif'),
  };
}

function textTag(ctx, text, x, y, { size, font, color = '#fff', bg = 'rgba(11,17,20,0.78)', dir = 'ltr', align = 'center' }) {
  ctx.save();
  ctx.direction = dir;
  ctx.font = `700 ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width;
  const pad = size * 0.45;
  // keep the whole tag inside the canvas
  const half = align === 'center' ? w / 2 : 0;
  x = clampNum(x, half + pad + 2, ctx.canvas.width - (align === 'center' ? half : w) - pad - 2);
  y = clampNum(y, size * 0.75 + 2, ctx.canvas.height - size * 0.75 - 2);
  const left = align === 'center' ? x - w / 2 : align === 'left' ? x : x - w;
  ctx.fillStyle = bg;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(left - pad, y - size * 0.75, w + pad * 2, size * 1.5, size * 0.4); else ctx.rect(left - pad, y - size * 0.75, w + pad * 2, size * 1.5);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y + size * 0.04);
  ctx.restore();
}

function haloLine(ctx, a, b, color, width) {
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = width + Math.max(2, width * 0.6); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}

/** Skeleton overlay. The measured leg is drawn thicker in the operated-leg color. */
function drawSkeleton(ctx, lm, w, h, { side, mirror, colors, label }) {
  if (!lm) return;
  const s = Math.max(1, Math.min(w, h) / 360);
  const P = (i) => { const p = lm[i]; return p ? { x: (mirror ? 1 - p.x : p.x) * w, y: p.y * h, v: p.visibility ?? 1 } : null; };
  const l = LEG[side] || LEG.R;
  const legSet = new Set([l.hip, l.knee, l.ankle, l.heel, l.toe]);
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [a, b] of POSE_LINKS) {
    if (legSet.has(a) && legSet.has(b)) continue;
    const A = P(a); const B = P(b);
    if (A && B && A.v > 0.3 && B.v > 0.3) haloLine(ctx, A, B, 'rgba(255,255,255,0.85)', 3 * s);
  }
  const head = P(0);
  if (head && head.v > 0.3) { ctx.beginPath(); ctx.arc(head.x, head.y, 7 * s, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); }
  for (const [a, b] of [[l.hip, l.knee], [l.knee, l.ankle], [l.ankle, l.heel], [l.heel, l.toe], [l.ankle, l.toe]]) {
    const A = P(a); const B = P(b);
    if (!A || !B) continue;
    ctx.globalAlpha = Math.min(A.v, B.v) < 0.5 ? 0.45 : 1; // a guessed (hidden) leg is drawn faint
    haloLine(ctx, A, B, colors.op, 7 * s);
  }
  ctx.globalAlpha = 1;
  for (const i of [l.hip, l.knee, l.ankle]) {
    const p = P(i);
    if (!p) continue;
    ctx.beginPath(); ctx.arc(p.x, p.y, 6 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3 * s; ctx.strokeStyle = colors.op; ctx.stroke();
  }
  const K = P(l.knee);
  if (label && K) textTag(ctx, label, K.x + (K.x > w * 0.7 ? -46 : 46) * s, K.y - 20 * s, { size: 17 * s, font: colors.font });
  ctx.restore();
}

/** Lines, angle arc and draggable handles for the photo goniometer. P in canvas pixels. */
function drawGoniometer(ctx, P, { dpr, active, value, measure, colors }) {
  const op = colors.op;
  ctx.save();
  ctx.lineCap = 'round';
  if (P.length >= 2) haloLine(ctx, P[0], P[1], op, 3.5 * dpr);
  if (P.length >= 3) haloLine(ctx, P[1], P[2], op, 3.5 * dpr);
  if (P.length === 3 && fin(value)) {
    const [H, K, A] = P;
    if (measure === 'fppa') {
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      haloLine(ctx, H, A, 'rgba(255,255,255,0.9)', 1.5 * dpr);
      ctx.setLineDash([]);
    } else {
      // dashed continuation of the thigh: flexion is the angle between it and the shank
      const ux = K.x - H.x; const uy = K.y - H.y; const lu = Math.hypot(ux, uy) || 1;
      const len = Math.max(30 * dpr, Math.hypot(A.x - K.x, A.y - K.y) * 0.8);
      const E = { x: K.x + (ux / lu) * len, y: K.y + (uy / lu) * len };
      ctx.setLineDash([6 * dpr, 6 * dpr]);
      haloLine(ctx, K, E, 'rgba(255,255,255,0.9)', 1.5 * dpr);
      ctx.setLineDash([]);
      const a1 = Math.atan2(uy, ux); const a2 = Math.atan2(A.y - K.y, A.x - K.x);
      let d = a2 - a1;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const r = 30 * dpr;
      ctx.beginPath(); ctx.arc(K.x, K.y, r, a1, a1 + d, d < 0);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 * dpr; ctx.stroke();
      const mid = a1 + d / 2;
      textTag(ctx, degTxt(value), K.x + Math.cos(mid) * (r + 26 * dpr), K.y + Math.sin(mid) * (r + 26 * dpr), { size: 14 * dpr, font: colors.font });
    }
  }
  const names = ['الورك', 'الركبة', 'الكاحل'];
  P.forEach((p, i) => {
    const isActive = i === active;
    ctx.beginPath(); ctx.arc(p.x, p.y, (isActive ? 12 : 10) * dpr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    ctx.lineWidth = (isActive ? 4 : 3) * dpr; ctx.strokeStyle = isActive ? colors.accent : op; ctx.stroke();
    ctx.fillStyle = '#132029'; ctx.font = `700 ${11 * dpr}px ${colors.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.fillText(String(i + 1), p.x, p.y + 0.5 * dpr);
    // put the name on the side facing away from the other points so close joints stay readable
    const others = P.filter((_, j) => j !== i);
    let dx = 0; let dy = -1;
    if (others.length) {
      const cx = others.reduce((a, q) => a + q.x, 0) / others.length; const cy = others.reduce((a, q) => a + q.y, 0) / others.length;
      const len = Math.hypot(p.x - cx, p.y - cy);
      if (len > 1) { dx = (p.x - cx) / len; dy = (p.y - cy) / len; }
    }
    textTag(ctx, names[i], p.x + dx * 30 * dpr, p.y + dy * 26 * dpr, { size: 11 * dpr, font: colors.font, dir: 'rtl' });
  });
  ctx.restore();
}

/** A drawn side view of a supine leg at a known angle, so the tool can be tried without a photo. */
const DEMO = { flex: { flex: 95 }, ext: { flex: 6, prop: true }, lag: { flex: 9, thigh: 32 } };
function makeDemoLeg({ flex = 95, thigh, prop } = {}) {
  const c = document.createElement('canvas');
  c.width = 960; c.height = 640;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 640);
  g.addColorStop(0, '#e3e8ea'); g.addColorStop(1, '#cfd7da');
  x.fillStyle = g; x.fillRect(0, 0, 960, 640);
  x.fillStyle = '#a8957d'; x.fillRect(0, 520, 960, 120);
  x.fillStyle = '#56656d'; x.beginPath(); if (x.roundRect) x.roundRect(30, 478, 900, 44, 14); else x.rect(30, 478, 900, 44); x.fill();
  const rad = (d) => (d * Math.PI) / 180;
  const hip = { x: 360, y: 430 };
  const alpha = thigh ?? Math.min(43, flex * 0.45); const beta = flex - alpha;
  const knee = { x: hip.x + 250 * Math.cos(rad(alpha)), y: hip.y - 250 * Math.sin(rad(alpha)) };
  const ankle = { x: knee.x + 240 * Math.cos(rad(beta)), y: knee.y + 240 * Math.sin(rad(beta)) };
  const seg = (a, b, w, col) => { x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.lineWidth = w; x.strokeStyle = col; x.lineCap = 'round'; x.stroke(); };
  const skin = '#d4a284';
  seg({ x: 120, y: 418 }, { x: hip.x, y: hip.y - 4 }, 112, '#2f5d8a'); // torso
  seg({ x: 150, y: 452 }, { x: 300, y: 462 }, 30, skin); // arm
  x.fillStyle = skin; x.beginPath(); x.arc(70, 404, 46, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#2b2622'; x.beginPath(); x.arc(62, 392, 44, Math.PI * 0.95, Math.PI * 1.9); x.fill();
  if (prop) { x.fillStyle = '#e8e2d6'; x.beginPath(); x.arc(ankle.x + 6, ankle.y + 34, 26, 0, Math.PI * 2); x.fill(); } // towel roll under the heel
  seg(knee, ankle, 64, skin); // shank
  if (beta > 30) seg({ x: ankle.x - 6, y: ankle.y + 8 }, { x: ankle.x + 92, y: ankle.y + 16 }, 30, skin); // foot flat on the mat
  else seg(ankle, { x: ankle.x + 70 * Math.cos(rad(beta - 90)), y: ankle.y + 70 * Math.sin(rad(beta - 90)) }, 28, skin); // toes up
  seg(hip, knee, 84, skin); // thigh
  seg(hip, { x: hip.x + 0.42 * (knee.x - hip.x), y: hip.y + 0.42 * (knee.y - hip.y) }, 98, '#2b2f33'); // shorts
  x.fillStyle = 'rgba(19,32,41,0.55)'; x.font = '600 22px sans-serif'; x.direction = 'rtl'; x.textAlign = 'right';
  x.fillText('صورة توضيحية مرسومة', 930, 44);
  return c;
}

/* ---------- photo goniometer ---------- */
const PHOTO_LABEL = { flex: 'ثني الركبة', ext: 'نقص الفرد', lag: 'انثناء الركبة والساق مرفوعة', depth: 'عمق القرفصاء', fppa: 'ميل الركبة للداخل' };

function PhotoResult({ idp, measure, value }) {
  if (!fin(value)) return null;
  if (measure === 'fppa') {
    return html`<div class="mx-result" id=${`${idp}-photo-value`} data-value=${Math.round(value)}>
      <span class="mx-big">${signedTxt(value)}</span>
      <span class="small muted">${value >= 0 ? 'ميل الركبة للداخل' : 'ميل الركبة للخارج'} (FPPA)</span>
      <span class="pill pill-gold">${VISUAL_ONLY}</span></div>`;
  }
  const v = measure === 'ext' || measure === 'lag' ? Math.max(0, value) : value;
  const max = measure === 'ext' || measure === 'lag' ? 30 : 150;
  return html`<div class="mx-result" id=${`${idp}-photo-value`} data-value=${Math.round(v)}>
    <${Gauge} value=${v} max=${max} label=${PHOTO_LABEL[measure]} target=${measure === 'ext' ? [0, 2] : undefined} />
    ${measure === 'ext' && v < 2 ? html`<span class="small muted">فرد كامل تقريبًا</span>` : null}
  </div>`;
}

function PhotoTool({ idp, side = 'R', measure = 'flex', measures, onMeasure, onResult, onSave, maxH = '56vh', compact }) {
  const [img, setImg] = useState(null); // { canvas, w, h, demo, id }
  const [pts, setPts] = useState([]);
  const [active, setActive] = useState(-1);
  const [auto, setAuto] = useState(null); // { tone, text }
  const [busy, setBusy] = useState(false);
  const [midline, setMidline] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const imgId = useRef(0);
  const view = measure === 'fppa' ? 'front' : 'side';
  const value = pts.length === 3
    ? (measure === 'fppa' ? fppaFromPoints(pts[0], pts[1], pts[2], midline || (side === 'L' ? -1 : 1)) : flexionFromPoints(pts[0], pts[1], pts[2]))
    : NaN;
  const resultKey = fin(value) ? `${measure}:${Math.round(value * 10)}` : null;

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  useEffect(() => { if (onResultRef.current) onResultRef.current(fin(value) ? { method: 'photo', measure, value } : null); }, [resultKey]);

  const take = (canvas, demo = false) => {
    imgId.current += 1;
    setImg({ canvas, w: canvas.width, h: canvas.height, demo, id: imgId.current });
    setPts([]); setActive(-1); setAuto(null); setMidline(null); setSavedKey(null);
  };
  const onFile = async (file) => {
    setBusy(true); setAuto(null);
    try {
      const d = await decodeImage(file);
      const c = toCanvas(d.source, d.width, d.height, 1600);
      d.close();
      take(c);
    } catch {
      setAuto({ tone: 'warn', text: 'تعذّر فتح الصورة. جرّب صورة ثانية.' });
    } finally { setBusy(false); }
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c || !img) return;
    const rect = c.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(rect.width * dpr); const H = Math.round(rect.height * dpr);
    if (c.width !== W) c.width = W;
    if (c.height !== H) c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img.canvas, 0, 0, W, H);
    const P = pts.map((p) => ({ x: (p.x * W) / img.w, y: (p.y * H) / img.h }));
    drawGoniometer(ctx, P, { dpr, active, value, measure, colors: themeColors() });
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => { drawRef.current(); });
  useEffect(() => {
    const c = canvasRef.current;
    if (!img || !c || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => drawRef.current());
    ro.observe(c);
    return () => ro.disconnect();
  }, [img]);

  const toImg = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * img.w, y: ((e.clientY - r.top) / r.height) * img.h, k: img.w / r.width };
  };
  const onDown = (e) => {
    if (!img || (e.button !== undefined && e.button > 0)) return;
    const p = toImg(e);
    let idx = -1; let best = 26 * p.k;
    pts.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < best) { best = d; idx = i; } });
    let off = { x: 0, y: 0 };
    if (idx < 0) {
      if (pts.length >= 3) return;
      idx = pts.length;
      setPts([...pts, { x: clampNum(p.x, 0, img.w), y: clampNum(p.y, 0, img.h) }]);
    } else off = { x: pts[idx].x - p.x, y: pts[idx].y - p.y };
    setActive(idx);
    setSavedKey(null);
    drag.current = { idx, id: e.pointerId, off };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    e.preventDefault();
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !img) return;
    const p = toImg(e);
    setPts((xs) => xs.map((q, i) => (i === d.idx ? { x: clampNum(p.x + d.off.x, 0, img.w), y: clampNum(p.y + d.off.y, 0, img.h) } : q)));
  };
  const onUp = (e) => { if (drag.current && drag.current.id === e.pointerId) drag.current = null; };
  const onKey = (e) => {
    if (!img) return;
    if (['1', '2', '3'].includes(e.key)) { const i = Number(e.key) - 1; if (i < pts.length) { setActive(i); e.preventDefault(); } return; }
    if ((e.key === 'Enter' || e.key === ' ') && pts.length < 3) {
      // keyboard users: drop the next point near the middle, then move it with the arrows
      const prev = pts[pts.length - 1];
      const next = prev ? { x: clampNum(prev.x + img.w * 0.12, 0, img.w), y: clampNum(prev.y + img.h * 0.08, 0, img.h) } : { x: img.w * 0.4, y: img.h * 0.4 };
      setPts([...pts, next]); setActive(pts.length); setSavedKey(null); e.preventDefault();
      return;
    }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!dir) return;
    const i = active >= 0 ? active : pts.length - 1;
    if (i < 0) return;
    e.preventDefault();
    const k = img.w / canvasRef.current.getBoundingClientRect().width;
    const step = (e.shiftKey ? 10 : 1) * k;
    setSavedKey(null);
    setPts((xs) => xs.map((q, j) => (j === i ? { x: clampNum(q.x + dir[0] * step, 0, img.w), y: clampNum(q.y + dir[1] * step, 0, img.h) } : q)));
  };

  const runAuto = async () => {
    if (!img) return;
    const id = img.id;
    setBusy(true);
    setAuto({ tone: 'info', text: poseLoaded() ? 'نبحث عن الساق في الصورة…' : 'نجهّز أداة التعرف على الجسم (أول مرة فقط، قد تأخذ دقيقة)…' });
    try {
      const pose = await loadPose('IMAGE');
      const lm = pose.detect(img.canvas);
      if (imgId.current !== id) return;
      const pick = pickLeg(lm, side);
      if (!lm || !pick) { setAuto({ tone: 'warn', text: 'ما قدرنا نحدد الساق بوضوح — ضع النقاط بيدك.' }); return; }
      const l = LEG[pick.side]; const o = LEG[otherSide(pick.side)];
      setPts([l.hip, l.knee, l.ankle].map((i) => ({ x: clampNum(lm[i].x, 0, 1) * img.w, y: clampNum(lm[i].y, 0, 1) * img.h })));
      setActive(-1); setSavedKey(null);
      const dx = lm[o.hip] ? lm[o.hip].x - lm[l.hip].x : 0;
      setMidline(Math.abs(dx) > 0.005 ? Math.sign(dx) : null);
      setAuto(pick.swapped
        ? { tone: 'warn', text: `استخدمنا الساق الأوضح في الصورة — تأكد أنها الساق المصابة (${SIDE_AR[side]}) وعدّل النقاط إن لزم.` }
        : pick.confident
          ? { tone: 'ok', text: 'وضعنا النقاط تلقائيًا — راجعها واسحب أي نقطة لتعديلها.' }
          : { tone: 'warn', text: 'الساق غير واضحة تمامًا — راجع النقاط واسحبها لمكانها الصحيح.' });
    } catch (e) {
      if (imgId.current === id) setAuto({ tone: 'warn', text: (e && e.message) || 'تعذّر التعرف التلقائي — ضع النقاط بيدك.' });
    } finally { setBusy(false); }
  };

  const ptsKey = `${measure}:${pts.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join(';')}`;
  const saved = savedKey === ptsKey;
  const nextName = ['الورك', 'الركبة', 'الكاحل'][pts.length];
  return html`<div class="stack" id=${`${idp}-photo`}>
    ${measures ? html`<${MxSeg} id=${`${idp}-photo-type`} label="نوع القياس" options=${measures} value=${measure} onChange=${(m) => { onMeasure(m); setSavedKey(null); }} />` : null}
    ${compact ? null : html`<${Guide} id=${measure === 'fppa' ? 'valgusFront' : measure === 'ext' ? 'extProp' : measure === 'lag' ? 'slr' : measure === 'depth' ? 'squatSide' : 'flexSide'} extra="التقط الصورة ثم اضغط على الورك والركبة والكاحل بالترتيب، أو اترك المنصة تقترح النقاط." />`}
    <div class="row">
      <${FileButton} id=${`${idp}-photo-file`} accept="image/*" capture="environment" label=${img ? 'صورة ثانية' : 'التقط صورة'} icon="camera" primary=${!img} onFile=${onFile} />
      ${DEMO[measure] ? html`<button type="button" class="btn btn-ghost btn-sm" id=${`${idp}-photo-demo`} onClick=${() => take(makeDemoLeg(DEMO[measure]), DEMO[measure].flex)}><${Icon} name="image" size=${16} />صورة توضيحية</button>` : null}
    </div>
    ${img ? html`
      <div class="steps-inline" aria-hidden="true">${['الورك', 'الركبة', 'الكاحل'].map((n, i) => html`<span data-on=${String(i === pts.length)}>${i + 1} ${n}</span>`)}</div>
      <p class="hint" id=${`${idp}-photo-hint`}><${Icon} name="info" size=${16} />${pts.length < 3 ? `اضغط على ${nextName} في الصورة` : 'اسحب أي نقطة لتعديلها، أو اختر رقمها واستخدم الأسهم'}</p>
      <${StageBox} w=${img.w} h=${img.h} maxH=${maxH}>
        <canvas ref=${canvasRef} class="mx-canvas" id=${`${idp}-photo-canvas`} tabindex="0" role="img"
          aria-label="صورة الساق. اضغط لوضع النقاط بالترتيب: الورك ثم الركبة ثم الكاحل. بلوحة المفاتيح: Enter يضع نقطة والأسهم تحركها."
          onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onPointerCancel=${onUp} onKeyDown=${onKey}></canvas>
      </${StageBox}>
      <div class="row">
        <button type="button" class="btn btn-sm" id=${`${idp}-photo-auto`} disabled=${busy || img.demo} onClick=${runAuto}><${Icon} name="sparkle" size=${16} />اقتراح النقاط تلقائيًا</button>
        <button type="button" class="btn btn-sm btn-ghost" id=${`${idp}-photo-reset`} disabled=${!pts.length} onClick=${() => { setPts([]); setActive(-1); setSavedKey(null); }}><${Icon} name="refresh" size=${16} />إعادة النقاط</button>
      </div>
      ${img.demo ? html`<p class="small muted">صورة مرسومة للتجربة (انثناء الركبة فيها قرابة ${iso(`${img.demo}°`)}). التعرف التلقائي يحتاج صورة حقيقية.</p>` : null}
      ${auto ? html`<div class=${`note note-${auto.tone}`} role="status" id=${`${idp}-photo-auto-msg`}>${auto.text}</div>` : null}
      <${PhotoResult} idp=${idp} measure=${measure} value=${value} />
      ${fin(value) ? html`<p class="small muted" style="text-align:center">${FOLLOW_UP}</p>` : null}
      ${onSave ? html`<button type="button" class="btn btn-primary btn-block" id=${`${idp}-photo-save`} disabled=${!fin(value) || saved}
        onClick=${() => { onSave({ measure, value }); setSavedKey(ptsKey); }}>${saved ? html`<${Icon} name="check" size=${16} />تم الحفظ` : 'حفظ القياس'}</button>` : null}`
    : html`<${Empty} icon="image" text=${measure === 'fppa' ? 'لا توجد صورة بعد. صوّر الساقين من الأمام.' : DEMO[measure] ? 'لا توجد صورة بعد. صوّر الساق من الجانب أو جرّب الصورة التوضيحية.' : 'لا توجد صورة بعد. صوّر من الجانب والجسم كامل ظاهر.'} />`}
  </div>`;
}

/* ---------- live camera & recorded video (shared readout) ---------- */
function SessionStats({ idp, kind, s, frame }) {
  const f = frame && frame.visible ? frame : null;
  const count = s ? s.count : 0;
  const best = s && fin(s.heldMax) && s.heldMax > 0 ? s.heldMax : s && s.maxFlex;
  let items;
  if (kind === 'slr') {
    items = [['ثني الركبة الآن', html`<${Deg} v=${f && f.knee} />`], ['رفع الساق', html`<${Deg} v=${f && f.hip} />`], ['تأخر الفرد', html`<${Deg} v=${s && s.lag} />`], ['مرات الرفع', count]];
  } else if (kind === 'valgus') {
    items = [['ميل الركبة الآن', html`<${Deg} v=${f && f.fppa} signed />`], ['أعلى ميل', html`<${Deg} v=${s && s.fppaPeak} signed />`], ['متوسط الميل', html`<${Deg} v=${s && s.fppa} signed />`], ['التكرارات', count]];
  } else if (kind === 'squat') {
    items = [['الزاوية الآن', html`<${Deg} v=${f && f.knee} />`], ['أعمق نزول', html`<${Deg} v=${best} />`], ['متوسط العمق', html`<${Deg} v=${s && s.avgDepth} />`], ['التكرارات', count]];
  } else {
    items = [['الزاوية الآن', html`<${Deg} v=${f && f.knee} />`], ['أعلى ثني مثبّت', html`<${Deg} v=${best} />`], ['أفضل فرد', s && fin(s.extDeficit) ? html`<span class="ltr">${degTxt(s.extDeficit)}</span>` : '—'], ['التكرارات', count]];
  }
  return html`<div class="mx-stats" id=${`${idp}-stats`}>
    ${items.map(([label, val], i) => html`<${Stat} id=${`${idp}-stat-${i}`} label=${label} live=${i === 3}>${val}</${Stat}>`)}
  </div>`;
}

function sessionNote(kind, s) {
  if (!s || !s.used) return null;
  if (kind === 'slr' && fin(s.lag)) {
    return s.lagFlag
      ? { tone: 'warn', text: `الركبة تنثني أثناء الرفع (تأخر ${iso(degTxt(s.lag))}). شد الفخذ أكثر قبل الرفع، ويراجعها أخصائيك.` }
      : { tone: 'ok', text: 'الركبة بقيت مستقيمة أثناء الرفع.' };
  }
  if (kind === 'valgus') return { tone: 'info', text: VISUAL_ONLY };
  return null;
}

function LegPicker({ id, side, value, onChange, disabled }) {
  const opts = ['R', 'L'].map((s) => ({ id: s, label: `${s === 'R' ? 'اليمنى' : 'اليسرى'}${s === side ? ' (المصابة)' : ''}` }));
  return html`<div class="row" style="gap:6px"><span class="small muted">الساق المقاسة</span>
    <${MxSeg} id=${id} label="الساق المقاسة" options=${opts} value=${value} onChange=${onChange} disabled=${disabled} /></div>`;
}

/** Per-rep bars (height = peak against the target), colored by quality. */
function RepStrip({ reps, target, max = 150 }) {
  if (!reps || !reps.length) return null;
  const top = Math.max(max, target || 0, ...reps.map((r) => r.peak || 0));
  const style = fin(target) ? `--target-y:${Math.round(100 - (target / top) * 100)}%` : '';
  return html`<div class="stack-sm" style="gap:4px">
    <div class=${`rep-strip ${fin(target) ? 'rep-strip-target' : ''}`} style=${style} role="img" aria-label=${`${reps.length} تكرارات`}>
      ${reps.map((r, i) => html`<span key=${i} data-q=${r.q} style=${`height:${Math.max(6, Math.round((r.peak / top) * 100))}%`} title=${`تكرار ${i + 1}: ${degTxt(r.peak)}${fin(r.dur) ? ` · ${r.dur.toFixed(1)} ث` : ''} · ${REP_Q_AR[r.q]}`}></span>`)}
    </div>
    <div class="row small muted" style="gap:10px">
      <span><span class="dot" style="background:var(--accent)"></span> كاملة ${reps.filter((r) => r.q === 'full').length}</span>
      ${reps.some((r) => r.q === 'low') ? html`<span><span class="dot" style="background:var(--warn-mark)"></span> قصيرة ${reps.filter((r) => r.q === 'low').length}</span>` : null}
      ${reps.some((r) => r.q === 'fast') ? html`<span><span class="dot" style="background:var(--series-2)"></span> سريعة ${reps.filter((r) => r.q === 'fast').length}</span>` : null}
      ${fin(target) ? html`<span>الخط المتقطع: الهدف ${iso(`${Math.round(target)}°`)}</span>` : null}
    </div>
  </div>`;
}

function Confidence({ q, frames }) {
  if (!q) return null;
  const c = scoreConfidence({ ...q, frames });
  return html`<div class="stack-sm" style="gap:4px">
    <span class="quality" data-level=${c.level} title=${`${c.score}/100`}><${Icon} name=${c.level === 'high' ? 'check' : 'info'} size=${14} stroke=${2.2} />${CONF_AR[c.level]} · ${c.score}/100</span>
    ${c.reasons.length ? html`<ul class="mx-tips">${c.reasons.map((r, i) => html`<li key=${i}>${r}</li>`)}</ul>` : null}
  </div>`;
}

/** Dashed target line + arc at the knee: where the shank needs to reach for the goal angle. */
function drawTarget(ctx, lm, w, h, { side, mirror, target, s, colors }) {
  const l = LEG[side] || LEG.R;
  const P = (i) => { const p = lm[i]; return p ? { x: (mirror ? 1 - p.x : p.x) * w, y: p.y * h } : null; };
  const H = P(l.hip); const K = P(l.knee); const A = P(l.ankle);
  if (!H || !K || !A) return;
  const tx = K.x - H.x; const ty = K.y - H.y; const lt = Math.hypot(tx, ty) || 1;
  const ux = tx / lt; const uy = ty / lt; // thigh direction, hip → knee
  const len = Math.max(40 * s, Math.hypot(A.x - K.x, A.y - K.y));
  // bend toward the side the real shank is on
  const cross = ux * (A.y - K.y) - uy * (A.x - K.x);
  const sign = cross >= 0 ? 1 : -1;
  const a = (target * Math.PI) / 180;
  const cos = Math.cos(a); const sin = Math.sin(a) * sign;
  const dx = ux * cos - uy * sin; const dy = ux * sin + uy * cos; // thigh direction rotated by target
  const E = { x: K.x + dx * len, y: K.y + dy * len };
  ctx.save();
  ctx.setLineDash([7 * s, 6 * s]);
  haloLine(ctx, K, E, colors.brass, 3 * s);
  ctx.setLineDash([]);
  const a0 = Math.atan2(uy, ux); const r = 34 * s;
  ctx.beginPath(); ctx.arc(K.x, K.y, r, a0, a0 + a * sign, sign < 0);
  ctx.strokeStyle = colors.brass; ctx.lineWidth = 2 * s; ctx.stroke();
  textTag(ctx, `${Math.round(target)}°`, E.x, E.y - 14 * s, { size: 12 * s, font: colors.font, bg: 'rgba(166,118,28,0.9)' });
  ctx.restore();
}

function paintOverlay(canvas, lm, frame, { side, mirror, skeletonOnly, colors, kind, w, h, video, target, hit }) {
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  if (skeletonOnly) { ctx.fillStyle = '#0b1114'; ctx.fillRect(0, 0, w, h); } else if (video) ctx.drawImage(video, 0, 0, w, h);
  const label = frame && frame.visible ? (kind === 'valgus' ? signedTxt(frame.fppa) : degTxt(frame.knee)) : '';
  if (lm && fin(target) && (kind === 'rom' || kind === 'squat')) drawTarget(ctx, lm, w, h, { side, mirror, target, s: Math.max(1, Math.min(w, h) / 360), colors });
  drawSkeleton(ctx, lm, w, h, { side, mirror, colors: hit ? { ...colors, op: colors.accent } : colors, label });
}

const COUNTDOWN_FROM = 3;

function LiveTool({ idp, side: opSide = 'R', kind = 'rom', onResult, onSave, onFallback, maxH = '56vh', compact, target, guide }) {
  const [status, setStatus] = useState('idle'); // idle | starting | running | stopped | error
  const [phase, setPhase] = useState('aim'); // while running: aim (coaching only) | count | rec
  const [count, setCount] = useState(0);
  const [coach, setCoach] = useState(null); // { code, text, tone, ok, ready }
  const [err, setErr] = useState(null);
  const [facing, setFacing] = useState('user');
  const [skeleton, setSkeleton] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [auto, setAuto] = useState(true);
  const [legSide, setLegSide] = useState(opSide);
  const [read, setRead] = useState(null); // { s, f }
  const [dims, setDims] = useState({ w: 640, h: 480 });
  const [slow, setSlow] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState(0);
  const [blocked] = useState(() => cameraBlockedByPolicy());
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const run = useRef({
    token: 0, stream: null, raf: 0, pose: null, analyzer: null, coach: null, voice: null, lastTime: -1, lastUi: 0, colors: null, errors: 0,
    luma: NaN, lumaAt: 0, tilt: NaN, stopTilt: null, phase: 'aim', countTimer: 0, coachCode: null, coachUiAt: 0, coachSpokenAt: 0, hitSpokenRep: -1,
  });
  const opts = useRef({});
  opts.current = { skeleton, facing, legSide, kind, onResult, auto, target };
  if (!run.current.voice) run.current.voice = createVoice();
  run.current.voice.enabled = voiceOn;

  const halt = () => {
    const r = run.current;
    r.token += 1;
    cancelAnimationFrame(r.raf); r.raf = 0;
    clearInterval(r.countTimer); r.countTimer = 0;
    stopStream(r.stream); r.stream = null;
    if (r.stopTilt) { r.stopTilt(); r.stopTilt = null; }
    r.voice.stop();
    if (videoRef.current) videoRef.current.srcObject = null;
  };
  useEffect(() => halt, []);

  const publish = (force) => {
    const r = run.current;
    const now = performance.now();
    if (!r.analyzer || (!force && now - r.lastUi < 125)) return;
    r.lastUi = now;
    const s = r.analyzer.summary();
    setRead({ s, f: r.analyzer.current });
    if (opts.current.onResult) opts.current.onResult({ method: 'live', ...s });
  };

  const setPhaseBoth = (p) => { run.current.phase = p; setPhase(p); };
  const startRecording = () => {
    const r = run.current;
    clearInterval(r.countTimer); r.countTimer = 0;
    r.analyzer = createAnalyzer({ kind: opts.current.kind, side: opts.current.legSide });
    r.hitSpokenRep = -1;
    setRead(null); setSaved(false);
    setPhaseBoth('rec');
    r.voice.say(VOICE_LINES.start, { force: true, interrupt: true });
  };
  const beginCountdown = () => {
    const r = run.current;
    if (r.phase !== 'aim') return;
    setPhaseBoth('count');
    let n = COUNTDOWN_FROM;
    setCount(n);
    r.voice.say(arabicCount(n), { force: true, interrupt: true });
    r.countTimer = setInterval(() => {
      n -= 1;
      if (n <= 0) { startRecording(); return; }
      setCount(n);
      r.voice.say(arabicCount(n), { force: true, interrupt: true });
    }, 1000);
  };
  const cancelCountdown = () => {
    const r = run.current;
    clearInterval(r.countTimer); r.countTimer = 0;
    setPhaseBoth('aim');
  };

  const start = async (face = facing) => {
    halt();
    const r = run.current;
    const token = r.token;
    setErr(null); setStatus('starting'); setSlow(false); setSaved(false); setCoach(null); setRead(null);
    setPhaseBoth('aim');
    const slowTimer = setTimeout(() => { if (run.current.token === token) setSlow(true); }, 6000);
    const [cam, model] = await Promise.allSettled([openCamera(face), loadPose('VIDEO')]);
    clearTimeout(slowTimer);
    setSlow(false);
    if (token !== r.token) { if (cam.status === 'fulfilled') stopStream(cam.value); return; }
    if (cam.status === 'rejected') { setErr(cam.reason); setStatus('error'); return; }
    if (model.status === 'rejected') { stopStream(cam.value); setErr(model.reason); setStatus('error'); return; }
    const v = videoRef.current;
    if (!v) { stopStream(cam.value); setStatus('idle'); return; }
    r.stream = cam.value; r.pose = model.value;
    r.stream.getVideoTracks().forEach((t) => t.addEventListener('ended', () => { if (token === run.current.token) { publish(true); halt(); setStatus('stopped'); } }));
    v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = r.stream;
    try { await v.play(); } catch { /* autoplay muted is allowed; keep going */ }
    await videoReady(v);
    if (token !== r.token) return;
    setDims({ w: v.videoWidth || 640, h: v.videoHeight || 480 });
    r.analyzer = null;
    r.coach = createCoach({ holdMs: 1500 });
    r.colors = { ...themeColors(), brass: cssVar('--brass', '#A6761C') };
    r.lastTime = -1; r.errors = 0; r.luma = NaN; r.lumaAt = 0; r.tilt = NaN; r.coachCode = null; r.coachSpokenAt = 0;
    // phone tilt, where the browser hands it over without a permission prompt (never asks on iOS)
    r.stopTilt = watchOrientation({ timeoutMs: 2500, onReading: ({ beta, gamma }) => { r.tilt = uprightError(beta, gamma); }, onNoSensor: () => { r.tilt = NaN; } });
    setStatus('running');
    r.voice.warm();
    r.voice.say(VOICE_LINES.intro, { force: true });
    const loop = () => {
      if (token !== run.current.token) return;
      r.raf = requestAnimationFrame(loop);
      const c = canvasRef.current;
      if (!c || v.readyState < 2 || !v.videoWidth || v.currentTime === r.lastTime) return;
      r.lastTime = v.currentTime;
      const now = performance.now();
      let lm = null;
      try { lm = r.pose.detectForVideo(v, now); r.errors = 0; } catch (e) {
        r.errors += 1;
        if (r.errors > 30) { halt(); setErr(e && e.message ? e : { message: 'توقف التحليل على هذا الجهاز. جرّب الفيديو المسجل.' }); setStatus('error'); }
        return;
      }
      const o = opts.current;
      const W = v.videoWidth; const H = v.videoHeight;
      if (now - r.lumaAt > 1000) { r.luma = sampleLuma(v); r.lumaAt = now; }
      const a = assessFrame({ lm, world: lm && lm.world, w: W, h: H, side: o.legSide, view: o.kind === 'valgus' ? 'front' : 'side', luma: r.luma, tilt: r.tilt });
      const cs = r.coach.push(a, now);
      if (cs.code !== r.coachCode || now - r.coachUiAt > 400) { r.coachCode = cs.code; r.coachUiAt = now; setCoach(cs); }
      if (!cs.ok && r.phase !== 'count' && now - r.coachSpokenAt > 4500) { if (r.voice.say(COACH_SPEECH[cs.code])) r.coachSpokenAt = now; }
      let frame;
      if (r.phase === 'rec') {
        frame = r.analyzer.push(lm, W, H, now);
        if (frame.counted) {
          setFlash(now);
          r.voice.say(arabicCount(frame.count), { force: true, interrupt: true });
        } else if (fin(o.target) && frame.visible && fin(frame.knee) && frame.knee >= o.target && r.hitSpokenRep !== frame.count) {
          r.hitSpokenRep = frame.count;
          r.voice.say(VOICE_LINES.target, { force: true });
        }
      } else {
        if (r.phase === 'count' && !cs.ok) cancelCountdown();
        if (r.phase === 'aim' && cs.ready && o.auto) beginCountdown();
        const knee = lm && a.code !== 'none' && a.code !== 'leg' ? (o.kind === 'valgus' ? fppa(lm, o.legSide, W, H) : kneeFlexion(lm, o.legSide, W, H)) : NaN;
        frame = { visible: fin(knee), knee: o.kind === 'valgus' ? NaN : knee, fppa: o.kind === 'valgus' ? knee : NaN, count: 0 };
        if (now - r.lastUi > 125) { r.lastUi = now; setRead((x) => ({ s: x && x.s, f: frame })); }
      }
      const hit = fin(o.target) && frame && frame.visible && fin(frame.knee) && frame.knee >= o.target - 1;
      paintOverlay(c, lm, frame, { side: o.legSide, mirror: o.facing === 'user', skeletonOnly: o.skeleton, colors: r.colors, kind: o.kind, w: W, h: H, target: o.target, hit });
      if (r.phase === 'rec') publish(false);
    };
    r.raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    const r = run.current;
    if (r.phase === 'rec') publish(true);
    const s = r.analyzer && r.analyzer.summary();
    halt();
    setStatus('stopped');
    if (s && s.used && (s.count || fin(s.heldMax))) r.voice.say(VOICE_LINES.done, { force: true, interrupt: true });
  };
  const resetSession = () => {
    const r = run.current;
    if (status === 'running') { clearInterval(r.countTimer); r.countTimer = 0; r.analyzer = null; setPhaseBoth('aim'); if (r.coach) r.coach.reset(); }
    setRead(null); setSaved(false);
  };
  const changeLeg = (s) => {
    setLegSide(s);
    opts.current.legSide = s;
    const r = run.current;
    if (r.analyzer) { r.analyzer = createAnalyzer({ kind, side: s }); setRead(null); setSaved(false); }
  };
  const changeFacing = (f) => { setFacing(f); if (status === 'running' || status === 'starting') start(f); };

  const s = read && read.s;
  const f = read && read.f;
  const running = status === 'running';
  const note = sessionNote(kind, s);
  const canSave = s && s.used > 0 && !saved && (fin(s.maxFlex) || fin(s.extDeficit) || s.count > 0);
  const saveNow = () => {
    let final = s;
    if (running && run.current.analyzer) { final = run.current.analyzer.summary(); stop(); }
    onSave(final, 'camera');
    setSaved(true);
  };
  const reps = s ? rateReps(s.reps, { target: kind === 'rom' || kind === 'squat' ? target : undefined, minDur: kind === 'slr' ? 1 : 1.2 }) : [];
  const hit = fin(target) && f && f.visible && fin(f.knee) && f.knee >= target - 1;
  const angleLabel = kind === 'valgus' ? 'ميل الركبة' : kind === 'slr' ? 'ثني الركبة' : 'زاوية الركبة';
  const voice = run.current.voice;
  return html`<div class="stack" id=${`${idp}-live`}>
    ${compact ? null : html`<${Guide} id=${guide || (kind === 'valgus' ? 'valgusFront' : kind === 'squat' ? 'squatSide' : kind === 'slr' ? 'slr' : 'flexSide')} />`}
    ${compact ? null : html`<p class="small muted">الكاميرا تدرّبك بنفسها: تخبرك إذا كان الجوال بعيدًا أو مايلًا أو الإضاءة ضعيفة، وتبدأ العد تلقائيًا عندما يصبح الوضع صحيحًا${voice.available ? '، وتعدّ التكرارات بصوت عربي' : ''}.</p>`}
    <div class="live-controls">
      ${running || status === 'starting'
        ? html`<button type="button" class="btn" id=${`${idp}-live-stop`} onClick=${stop}><${Icon} name="x" size=${16} />إيقاف</button>`
        : html`<button type="button" class="btn btn-primary" id=${`${idp}-live-start`} onClick=${() => start()}><${Icon} name="camera" size=${16} />${status === 'stopped' ? 'تشغيل من جديد' : 'تشغيل الكاميرا'}</button>`}
      ${running && phase === 'aim' ? html`<button type="button" class="btn btn-ok" id=${`${idp}-live-go`} onClick=${startRecording}><${Icon} name="play" size=${16} fill=${true} />ابدأ الآن</button>` : null}
      ${running && phase === 'count' ? html`<button type="button" class="btn btn-ghost" onClick=${cancelCountdown}>إلغاء العد</button>` : null}
      <${MxSeg} id=${`${idp}-live-facing`} label="الكاميرا" options=${[{ id: 'user', label: 'أمامية' }, { id: 'environment', label: 'خلفية' }]} value=${facing} onChange=${changeFacing} />
      ${voice.available ? html`<button type="button" class="btn btn-sm toggle-btn" id=${`${idp}-live-voice`} aria-pressed=${String(voiceOn)} onClick=${() => setVoiceOn(!voiceOn)} title="الإرشاد الصوتي"><${Icon} name="speaker" size=${16} />${voiceOn ? 'الصوت مفعّل' : 'الصوت متوقف'}</button>` : null}
      <button type="button" class="btn btn-sm toggle-btn" id=${`${idp}-live-auto`} aria-pressed=${String(auto)} onClick=${() => setAuto(!auto)} title="يبدأ العد بنفسه عندما يصبح الوضع صحيحًا"><${Icon} name="bolt" size=${16} />بدء تلقائي</button>
    </div>
    <label class="mx-check" for=${`${idp}-live-skeleton`}>
      <input type="checkbox" id=${`${idp}-live-skeleton`} checked=${skeleton} onChange=${(e) => setSkeleton(e.currentTarget.checked)} />
      <span><strong>الهيكل فقط</strong> — تختفي الصورة وتبقى النقاط.${compact ? '' : ' في المنصة الفعلية النقاط فقط هي ما قد يُرسل لأخصائيك، لا الفيديو.'}</span>
    </label>
    ${blocked && status !== 'running' ? html`<div class="note note-warn" id=${`${idp}-live-blocked`}>الكاميرا المباشرة غير متاحة داخل هذه الصفحة المضمّنة غالبًا. جرّب، أو استخدم الفيديو المسجل أو الصورة.</div>` : null}
    ${status === 'starting' ? html`<p class="hint" role="status"><${Icon} name="clock" size=${16} />${slow ? 'ننتظر إذن الكاميرا… إذا لم يظهر طلب الإذن استخدم الفيديو المسجل.' : 'نشغّل الكاميرا ونجهّز التعرف على الجسم…'}</p>` : null}
    ${status === 'error' && err ? html`<div class="note note-warn stack-sm" role="alert" id=${`${idp}-live-error`}>
      <span>${err.message || 'تعذّر تشغيل القياس المباشر.'}</span>
      ${onFallback ? html`<div class="row">
        <button type="button" class="btn btn-sm" id=${`${idp}-live-fallback-video`} onClick=${() => onFallback('video')}><${Icon} name="video" size=${16} />تحليل فيديو مسجل</button>
        <button type="button" class="btn btn-sm" id=${`${idp}-live-fallback-photo`} onClick=${() => onFallback('photo')}><${Icon} name="image" size=${16} />استخدام صورة</button></div>` : null}
    </div>` : null}
    ${running || status === 'starting'
      ? html`<${StageBox} w=${dims.w} h=${dims.h} maxH=${maxH} className=${skeleton ? 'mx-skeleton' : ''}>
          <video ref=${videoRef} id=${`${idp}-live-video`} class=${facing === 'user' ? 'mx-mirror' : ''} muted playsinline autoplay aria-hidden="true"></video>
          <canvas ref=${canvasRef} id=${`${idp}-live-canvas`} role="img" aria-label="هيكل الجسم وزاوية الركبة"></canvas>
          ${running ? html`<div class="hud" aria-hidden="true">
            <div class="hud-top">${coach ? html`<div class="hud-coach" data-tone=${phase === 'rec' && coach.ok ? 'rec' : coach.tone} id=${`${idp}-live-coach`}>
              ${phase === 'rec' && coach.ok ? html`<span class="rec-dot"></span>يسجّل… استمر` : phase === 'aim' && coach.ok ? (auto ? 'الوضع ممتاز — يبدأ العد خلال لحظات' : 'الوضع ممتاز — اضغط «ابدأ الآن»') : coach.text}
            </div>` : null}</div>
            <div class="hud-mid">${phase === 'count' ? html`<div class="hud-count" key=${count}>${count}</div>` : null}</div>
            <div class="hud-bottom">
              <div class="hud-angle"><span class=${`v ${hit ? 'hit' : ''}`}>${kind === 'valgus' ? signedTxt(f && f.fppa) : degTxt(f && f.knee)}</span><span class="l">${angleLabel}${fin(target) && kind !== 'valgus' ? ` · الهدف ${Math.round(target)}°` : ''}</span></div>
              ${phase === 'rec' ? html`<div class="hud-reps"><${Ring} value=${Math.min(100, ((s && s.count) || 0) * 10)} size=${64} stroke=${7}><span class="ring-num">${(s && s.count) || 0}</span><span class="ring-cap">تكرار</span><//></div>` : null}
            </div>
          </div>` : null}
          ${flash ? html`<div class="hud-flash" key=${flash}></div>` : null}
        </${StageBox}>`
      : html`<${Empty} icon="camera" text=${status === 'stopped' ? 'توقفت الكاميرا. النتائج محفوظة أدناه حتى تحفظها أو تبدأ من جديد.' : 'شغّل الكاميرا، وضع الجوال بمستوى الركبة.'} />`}
    <p class="small muted row" style="gap:6px"><${Icon} name="shield" size=${16} />${ON_DEVICE}</p>
    ${running || s ? html`<${SessionStats} idp=${`${idp}-live`} kind=${kind} s=${s} frame=${running ? f : null} />` : null}
    ${s && s.used && (kind === 'rom' || kind === 'squat' || kind === 'slr') && reps.length ? html`<${RepStrip} reps=${reps} target=${kind === 'slr' ? undefined : target} max=${kind === 'slr' ? 90 : 150} />` : null}
    ${status === 'stopped' && s && s.used ? html`<${Confidence} q=${s.quality} frames=${s.frames} />` : null}
    ${running || s ? html`<${LegPicker} id=${`${idp}-live-leg`} side=${opSide} value=${legSide} onChange=${changeLeg} />` : null}
    ${note ? html`<div class=${`note note-${note.tone}`}>${note.text}</div>` : null}
    ${running || s ? html`<div class="row">
      <button type="button" class="btn btn-sm btn-ghost" id=${`${idp}-live-reset`} onClick=${resetSession}><${Icon} name="refresh" size=${16} />تصفير الجلسة</button>
      ${onSave ? html`<button type="button" class="btn btn-primary btn-sm" id=${`${idp}-live-save`} disabled=${!canSave}
        onClick=${saveNow}>${saved ? 'تم الحفظ' : running ? 'إيقاف وحفظ' : 'حفظ الجلسة'}</button>` : null}
    </div>` : null}
  </div>`;
}

function VideoChart({ kind, series, duration }) {
  if (series.length < 2) return null;
  const every = Math.max(1, Math.ceil(series.length / 240));
  const pts = series.filter((_, i) => i % every === 0);
  const main = { points: pts.map((p) => ({ x: p.t, y: Math.round(p.v) })), color: 'var(--series-2)', label: kind === 'valgus' ? 'ميل الركبة' : 'ثني الركبة' };
  const sets = [main];
  if (kind === 'slr') sets.push({ points: pts.filter((p) => fin(p.h)).map((p) => ({ x: p.t, y: Math.round(p.h) })), color: 'var(--series-1)', label: 'رفع الساق' });
  const ys = sets.flatMap((x) => x.points.map((p) => p.y));
  const yDomain = kind === 'valgus' ? [Math.min(-10, ...ys), Math.max(20, ...ys)] : [0, Math.max(60, Math.ceil(Math.max(...ys) / 30) * 30)];
  return html`<${LineChart} series=${sets} xDomain=${[0, Math.max(1, Math.ceil(duration))]} yDomain=${yDomain} height=${170}
    unit="°" xFormat=${(x) => `${x}ث`} yFormat=${(y) => Math.round(y)} label=${kind === 'valgus' ? 'ميل الركبة خلال الفيديو' : 'زاوية الركبة خلال الفيديو'} xTitle="الثانية" />`;
}

function VideoTool({ idp, side: opSide = 'R', kind = 'rom', onResult, onSave, maxH = '56vh', compact, target }) {
  const [status, setStatus] = useState('idle'); // idle | opening | loading | analyzing | done | error
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState(0);
  const [series, setSeries] = useState([]);
  const [sum, setSum] = useState(null);
  const [frame, setFrame] = useState(null);
  const [dims, setDims] = useState({ w: 16, h: 9 });
  const [duration, setDuration] = useState(0);
  const [legSide, setLegSide] = useState(opSide);
  const [saved, setSaved] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const token = useRef(0);
  const urlRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  useEffect(() => () => { token.current += 1; if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const analyze = async (side = legSide) => {
    const v = videoRef.current;
    if (!v || !urlRef.current) return;
    const my = ++token.current;
    setErr(''); setSaved(false); setProgress(0); setSeries([]); setSum(null); setFrame(null); setStatus('loading');
    let pose;
    try { pose = await loadPose('VIDEO'); } catch (e) {
      if (my === token.current) { setErr((e && e.message) || 'تعذّر تجهيز التحليل.'); setStatus('error'); }
      return;
    }
    if (my !== token.current) return;
    const dur = await videoDuration(v);
    if (my !== token.current) return;
    if (!dur) { setErr('ما قدرنا نقرأ مدة الفيديو. جرّب تسجيله من جديد.'); setStatus('error'); return; }
    const limit = Math.min(dur, MAX_VIDEO_SEC);
    setDuration(limit);
    setStatus('analyzing');
    const an = createAnalyzer({ kind, side, fps: 1 / VIDEO_STEP });
    const base = pose.now();
    const colors = themeColors();
    const pts = [];
    const n = Math.max(1, Math.floor(limit / VIDEO_STEP));
    const k = Math.min(1, 960 / (v.videoWidth || 960));
    let stuck = 0;
    for (let i = 0; i <= n; i++) {
      if (my !== token.current) return;
      const t = Math.min(limit - 0.02, i * VIDEO_STEP);
      stuck = (await seekTo(v, Math.max(0, t))) ? 0 : stuck + 1;
      if (my !== token.current) return;
      if (stuck >= 3) { setErr('تعذّر التنقل داخل هذا الفيديو. جرّب تسجيله من جديد (يفضّل صيغة MP4).'); setStatus('error'); return; }
      let lm = null;
      try { lm = pose.detectForVideo(v, base + t * 1000); } catch { /* skip this frame */ }
      const fr = an.push(lm, v.videoWidth, v.videoHeight, t * 1000);
      const c = canvasRef.current;
      if (c && v.videoWidth) paintOverlay(c, lm, fr, { side, mirror: false, skeletonOnly: false, colors, kind, w: Math.round(v.videoWidth * k), h: Math.round(v.videoHeight * k), video: v });
      if (fr.visible) pts.push({ t: Math.round(t * 10) / 10, v: kind === 'valgus' ? fr.fppa : fr.knee, h: fr.hip });
      if (i % 5 === 0 || i === n) {
        setProgress(i / n); setSum(an.summary()); setFrame(fr);
        await new Promise((res) => { setTimeout(res, 0); });
      }
    }
    if (my !== token.current) return;
    const s = an.summary();
    setSeries(pts); setSum(s); setFrame(null); setProgress(1);
    if (!s.used) { setErr('ما ظهرت الساق بوضوح في الفيديو. صوّر من الجانب والساق كاملة ظاهرة.'); setStatus('error'); return; }
    setStatus('done');
    if (onResultRef.current) onResultRef.current({ method: 'video', ...s });
  };

  const onFile = async (file) => {
    token.current += 1;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setHasFile(true); setStatus('opening'); setErr(''); setSum(null); setSeries([]); setSaved(false);
    if (onResultRef.current) onResultRef.current(null);
    const v = videoRef.current;
    v.src = url;
    v.load();
    const ev = await onceEvent(v, ['loadeddata', 'error'], 20000);
    if (urlRef.current !== url) return;
    if (ev !== 'loadeddata' || !v.videoWidth) { setErr('تعذّر فتح هذا الفيديو على المتصفح. جرّب تسجيله من جديد (يفضّل صيغة MP4).'); setStatus('error'); return; }
    setDims({ w: v.videoWidth, h: v.videoHeight });
    analyze();
  };
  const cancel = () => {
    token.current += 1;
    // keep what was analysed so far
    setStatus(sum && sum.used ? 'done' : 'idle');
    if (sum && sum.used && onResultRef.current) onResultRef.current({ method: 'video', ...sum });
  };
  const busy = status === 'opening' || status === 'loading' || status === 'analyzing';
  const note = status === 'done' ? sessionNote(kind, sum) : null;
  return html`<div class="stack" id=${`${idp}-video`}>
    ${compact ? html`<p class="small muted">10–30 ثانية تكفي (نحلل أول 90 ثانية).</p>` : html`<${Guide} id=${kind === 'valgus' ? 'valgusFront' : kind === 'squat' ? 'squatSide' : kind === 'slr' ? 'slr' : 'flexSide'} extra="سجّل 10–30 ثانية بكاميرا الجوال ثم اختر الفيديو هنا؛ نحلل أول 90 ثانية." />`}
    <div class="row">
      <${FileButton} id=${`${idp}-video-file`} accept="video/*" capture="environment" label=${hasFile ? 'فيديو ثاني' : 'سجّل أو اختر فيديو'} icon="video" primary=${!hasFile} onFile=${onFile} disabled=${busy} />
      ${busy ? html`<button type="button" class="btn btn-sm btn-ghost" id=${`${idp}-video-cancel`} onClick=${cancel}>إيقاف التحليل</button>` : null}
    </div>
    <video ref=${videoRef} id=${`${idp}-video-el`} class="mx-hidden-video" muted playsinline preload="auto" aria-hidden="true" tabindex="-1"></video>
    ${hasFile ? html`<${StageBox} w=${dims.w} h=${dims.h} maxH=${maxH}><canvas ref=${canvasRef} id=${`${idp}-video-canvas`} role="img" aria-label="الإطار الذي يُحلل الآن مع هيكل الجسم"></canvas></${StageBox}>`
      : html`<${Empty} icon="video" text="سجّل التمرين بكاميرا الجوال ثم حلّله هنا. الفيديو لا يُرفع." />`}
    ${busy ? html`<div class="stack-sm" id=${`${idp}-video-progress`} role="status">
      <span class="small muted">${status === 'analyzing' ? `نحلل الفيديو… ${Math.round(progress * 100)}%` : status === 'loading' ? (poseLoaded() ? 'نجهّز التحليل…' : 'نجهّز أداة التعرف على الجسم (أول مرة فقط)…') : 'نفتح الفيديو…'}</span>
      <div class="meter meter-thin" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(progress * 100)} aria-label="تقدم التحليل"><span style=${`width:${Math.round(progress * 100)}%`}></span></div>
    </div>` : null}
    ${err ? html`<div class="note note-warn" role="alert" id=${`${idp}-video-error`}>${err}</div>` : null}
    ${sum && sum.used ? html`<${SessionStats} idp=${`${idp}-video`} kind=${kind} s=${sum} frame=${busy ? frame : null} />` : null}
    ${status === 'done' || (status === 'error' && hasFile) ? html`<${LegPicker} id=${`${idp}-video-leg`} side=${opSide} value=${legSide} onChange=${(s2) => { setLegSide(s2); analyze(s2); }} />` : null}
    ${status === 'done' && sum ? html`<p class="small muted" id=${`${idp}-video-frames`}>إطارات ظهرت فيها الساق: <span class="ltr">${sum.used} / ${sum.frames}</span></p>` : null}
    ${status === 'done' ? html`<${VideoChart} kind=${kind} series=${series} duration=${duration} />` : null}
    ${status === 'done' && sum && sum.used && kind !== 'valgus' && sum.reps && sum.reps.length ? html`<${RepStrip} reps=${rateReps(sum.reps, { target: kind === 'slr' ? undefined : target, minDur: kind === 'slr' ? 1 : 1.2 })} target=${kind === 'slr' ? undefined : target} max=${kind === 'slr' ? 90 : 150} />` : null}
    ${status === 'done' && sum && sum.used ? html`<${Confidence} q=${sum.quality} frames=${sum.frames} />` : null}
    ${note ? html`<div class=${`note note-${note.tone}`}>${note.text}</div>` : null}
    <p class="small muted row" style="gap:6px"><${Icon} name="shield" size=${16} />${ON_DEVICE}</p>
    ${onSave && status === 'done' ? html`<button type="button" class="btn btn-primary btn-block" id=${`${idp}-video-save`} disabled=${saved}
      onClick=${() => { onSave(sum, 'video'); setSaved(true); }}>${saved ? 'تم الحفظ' : 'حفظ النتيجة'}</button>` : null}
  </div>`;
}

/* ---------- phone as inclinometer ---------- */
function PhoneTool({ idp, measure = 'flex', measures, onMeasure, onResult, onSave }) {
  const [status, setStatus] = useState('idle'); // idle | waiting | live | sim
  const [note, setNote] = useState('');
  const [step, setStep] = useState(0); // 0 thigh, 1 shin, 2 done
  const [b1, setB1] = useState(NaN);
  const [b2, setB2] = useState(NaN);
  const [live, setLive] = useState(NaN);
  const [sim, setSim] = useState(measure === 'ext' ? 2 : 35);
  const [saved, setSaved] = useState(false);
  const stopRef = useRef(null);
  const buf = useRef([]);
  const lastUi = useRef(0);
  const startTok = useRef(0);
  useEffect(() => () => { startTok.current = -1; if (stopRef.current) stopRef.current(); }, []);
  const isSim = status === 'sim';
  const current = isSim ? sim : live;
  const sum = fin(b1) && fin(b2) ? b1 + b2 : NaN;
  const value = measure === 'ext' ? Math.max(0, sum) : sum;
  const resultKey = fin(value) ? `${measure}:${value}:${isSim}` : null;
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  useEffect(() => { if (onResultRef.current) onResultRef.current(fin(value) ? { method: 'phone', measure, value, sim: isSim } : null); }, [resultKey]);

  const restart = (m = measure) => { setStep(0); setB1(NaN); setB2(NaN); setSaved(false); setSim(m === 'ext' ? 2 : 35); };
  const start = () => {
    const perm = requestMotionPermission(); // must run synchronously inside this click (iOS)
    if (stopRef.current) stopRef.current();
    stopRef.current = null;
    buf.current = [];
    restart();
    setNote(''); setStatus('waiting');
    const tok = ++startTok.current;
    perm.then((p) => {
      if (tok !== startTok.current) return; // unmounted, or started again meanwhile
      if (p === 'denied') { setStatus('sim'); setNote('ما سُمح بالوصول لمستشعر الحركة، فنعرض محاكاة للفكرة.'); return; }
      stopRef.current = watchOrientation({
        timeoutMs: 1500,
        onReading: ({ beta }) => {
          buf.current.push(beta);
          if (buf.current.length > 9) buf.current.shift();
          const now = performance.now();
          if (now - lastUi.current > 100) { lastUi.current = now; setLive(median(buf.current)); setStatus('live'); }
        },
        onNoSensor: (why) => {
          if (stopRef.current) stopRef.current();
          stopRef.current = null;
          setStatus('sim');
          setNote(why === 'policy' ? 'مستشعر الحركة غير متاح داخل هذه الصفحة المضمّنة، فنعرض محاكاة لشرح الفكرة.'
            : why === 'unsupported' ? 'هذا المتصفح لا يوفّر مستشعر الميل، فنعرض محاكاة لشرح الفكرة.'
              : 'ما وصلت قراءات من مستشعر الحركة (غالبًا جهاز حاسوب)، فنعرض محاكاة لشرح الفكرة.');
        },
      });
    });
  };
  const capture = () => {
    if (!fin(current)) return;
    const v = Math.round(current);
    if (step === 0) { setB1(v); setStep(1); if (isSim) setSim(measure === 'ext' ? 3 : 60); } else if (step === 1) { setB2(v); setStep(2); }
  };
  const started = status !== 'idle';
  return html`<div class="stack" id=${`${idp}-phone`}>
    ${measures ? html`<${MxSeg} id=${`${idp}-phone-type`} label="نوع القياس" options=${measures} value=${measure} onChange=${(m) => { onMeasure(m); restart(m); }} />` : null}
    ${measures ? html`<${Guide} id=${measure === 'ext' ? 'extProp' : 'phoneLeg'} extra=${measure === 'ext' ? 'ضع الجوال على الفخذ ثم على الساق كما في القياس العادي؛ الفرد الكامل يقرأ قريبًا من الصفر.' : 'الثني = ميل الفخذ + ميل الساق.'} />`
      : html`<p class="small">ضع الجوال على مقدمة الفخذ وأعلاه نحو الركبة والشاشة للخارج، ثبّت القراءة، ثم كرر على الساق. <strong>الثني = ميل الفخذ + ميل الساق</strong>.</p>`}
    <div class="row">
      <button type="button" class=${started ? 'btn' : 'btn btn-primary'} id=${`${idp}-phone-start`} onClick=${start}><${Icon} name="target" size=${16} />${started ? 'إعادة تشغيل المستشعر' : 'تشغيل المستشعر'}</button>
      ${isSim ? html`<${Pill} tone="gold" icon="info">محاكاة للعرض</${Pill}>` : null}
    </div>
    ${note ? html`<div class="note note-warn" role="status" id=${`${idp}-phone-note`}>${note}</div>` : null}
    ${status === 'waiting' ? html`<p class="hint" role="status"><${Icon} name="clock" size=${16} />ننتظر قراءة المستشعر…</p>` : null}
    ${status === 'live' || isSim ? html`
      <div class="steps-inline" aria-hidden="true"><span data-on=${String(step === 0)}>1 الفخذ</span><span data-on=${String(step === 1)}>2 الساق</span></div>
      <div class="card card-flat stack-sm" style="align-items:center;text-align:center">
        <span class="small muted">${isSim ? 'ميل الجوال (محاكاة)' : 'ميل الجوال الآن'}</span>
        <span class="mx-big" id=${`${idp}-phone-live`}>${degTxt(current)}</span>
        ${isSim ? html`<label class="sr-only" for=${`${idp}-phone-sim`}>ميل الجوال للمحاكاة</label>
          <input type="range" class="mx-range" id=${`${idp}-phone-sim`} min="-20" max="140" step="1" value=${sim} disabled=${step > 1}
            onInput=${(e) => setSim(Number(e.currentTarget.value))} />` : null}
      </div>
      <div class="row">
        <button type="button" class="btn btn-primary" id=${`${idp}-phone-capture`} disabled=${step > 1 || !fin(current)} onClick=${capture}>
          <${Icon} name="check" size=${16} />${step === 0 ? 'ثبّت قراءة الفخذ' : 'ثبّت قراءة الساق'}</button>
        <button type="button" class="btn btn-ghost btn-sm" id=${`${idp}-phone-redo`} disabled=${step === 0} onClick=${() => restart()}><${Icon} name="refresh" size=${16} />إعادة</button>
      </div>
      <p class="small muted">الفخذ: <span class="ltr">${degTxt(b1)}</span> · الساق: <span class="ltr">${degTxt(b2)}</span></p>` : null}
    ${fin(value) ? html`<div class="mx-result" id=${`${idp}-phone-value`} data-value=${Math.round(value)}>
        <${Gauge} value=${value} max=${measure === 'ext' ? 30 : 150} label=${measure === 'ext' ? 'نقص الفرد' : 'ثني الركبة'} target=${measure === 'ext' ? [0, 2] : undefined} />
        ${isSim ? html`<span class="pill pill-gold">نتيجة محاكاة للعرض</span>` : null}
        <span class="small muted">${FOLLOW_UP}</span></div>` : null}
    ${onSave && fin(value) ? html`<button type="button" class="btn btn-primary btn-block" id=${`${idp}-phone-save`} disabled=${saved}
      onClick=${() => { onSave({ measure, value, sim: isSim }); setSaved(true); }}>${saved ? 'تم الحفظ' : 'حفظ القياس'}</button>` : null}
  </div>`;
}

/* ---------- wound photo ---------- */
function WoundTool({ patient }) {
  const [shot, setShot] = useState(null); // { url, q }
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => () => { if (shot && shot.url) URL.revokeObjectURL(shot.url); }, [shot]);
  const last = lastWhere(patient.measures, (m) => m.kind === 'wound');
  const onFile = async (file) => {
    setBusy(true); setErr(''); setSent(false);
    try {
      const d = await decodeImage(file);
      const q = imageQuality(d.source, d.width, d.height);
      d.close();
      setShot({ url: URL.createObjectURL(file), q });
    } catch {
      setErr('تعذّر فتح الصورة. جرّب مرة ثانية.');
    } finally { setBusy(false); }
  };
  const send = () => {
    if (!shot || !consent) return;
    const { q } = shot;
    // Metadata only — the image itself is never put in the store or in localStorage.
    dispatch({ type: 'measure/add', pid: patient.id, measure: { kind: 'wound', quality: { brightness: Math.round(q.brightness), sharpness: Math.round(q.sharpness), ok: q.ok }, note: note.trim() } });
    setShot(null); setNote(''); setConsent(false); setSent(true);
    toast('وصلت صورة الجرح لأخصائيك');
  };
  const q = shot && shot.q;
  return html`<div class="stack" id="mx-wound">
    <${Guide} id="wound" />
    ${sent ? html`<div class="note note-ok stack-sm" role="status" id="mx-wound-sent">
        <strong>وصلت لأخصائيك — لا يوجد تشخيص آلي للصور</strong>
        <span class="small">يراجعها أخصائيك ويرد عليك في الرسائل.</span>
        <div><button type="button" class="btn btn-sm" id="mx-wound-new" onClick=${() => setSent(false)}>صورة جديدة</button></div></div>`
      : html`
      <div class="row">
        <${FileButton} id="mx-wound-file" accept="image/*" capture="environment" label=${shot ? 'إعادة التصوير' : 'صوّر الجرح'} icon="camera" primary=${!shot} onFile=${onFile} disabled=${busy} />
      </div>
      ${busy ? html`<p class="hint" role="status"><${Icon} name="clock" size=${16} />نفحص جودة الصورة…</p>` : null}
      ${err ? html`<div class="note note-warn" role="alert">${err}</div>` : null}
      ${shot ? html`
        <div class="measure-stage"><img class="mx-preview" src=${shot.url} alt="معاينة صورة الجرح (تبقى على جهازك)" /></div>
        <div class="row" id="mx-wound-quality" role="status" aria-label="فحص جودة الصورة">
          ${q.checks.map((c) => html`<span class=${`pill pill-${c.ok ? 'ok' : 'alert'}`} data-check=${c.id} data-ok=${String(c.ok)}><${Icon} name=${c.ok ? 'check' : 'alert'} size=${14} stroke=${2.2} />${c.label}</span>`)}
        </div>
        ${q.ok ? null : html`<div class="note note-warn stack-sm"><strong>نقترح إعادة التصوير:</strong>
          <ul class="mx-tips">${q.checks.filter((c) => !c.ok).map((c) => html`<li>${c.fix}</li>`)}</ul></div>`}
        <div class="field"><label for="mx-wound-note">ملاحظة لأخصائيك (اختياري)</label>
          <textarea class="textarea" id="mx-wound-note" rows="2" placeholder="مثال: احمرار خفيف حول الغرزة العلوية" value=${note} onInput=${(e) => setNote(e.currentTarget.value)}></textarea></div>
        <label class="mx-check" for="mx-wound-consent">
          <input type="checkbox" id="mx-wound-consent" checked=${consent} onChange=${(e) => setConsent(e.currentTarget.checked)} />
          <span>أوافق على إرسال هذه الصورة لأخصائي العلاج الطبيعي المتابع لحالتي فقط.</span>
        </label>
        <button type="button" class=${`btn btn-block ${q.ok ? 'btn-primary' : ''}`} id="mx-wound-send" disabled=${!consent} onClick=${send}>
          <${Icon} name="send" size=${16} />${q.ok ? 'إرسال للأخصائي' : 'إرسال كما هي'}</button>` : html`<${Empty} icon="shield" text="لا توجد صورة بعد." />`}`}
    <p class="small muted">في هذا النموذج لا تُحفظ الصورة نفسها — تُسجَّل بيانات الجودة فقط. إذا لاحظت صديدًا أو حرارة أو احمرارًا يزيد، تواصل مع الفريق فورًا ولا تنتظر الرد.</p>
    ${last ? html`<p class="small muted">آخر صورة أُرسلت: اليوم ${last.day} بعد العملية${last.quality ? ` · ${last.quality.ok ? 'جودة مناسبة' : 'جودة أقل من المطلوب'}` : ''}.</p>` : null}
  </div>`;
}

/* ---------- knee girth ---------- */
function GirthTool({ patient }) {
  const [op, setOp] = useState('');
  const [other, setOther] = useState('');
  const prev = lastWhere(patient.measures, (m) => m.kind === 'girth');
  const a = parseFloat(String(op).replace(',', '.'));
  const b = parseFloat(String(other).replace(',', '.'));
  const valid = (v) => fin(v) && v >= 20 && v <= 90;
  const ok = valid(a) && valid(b);
  const diff = ok ? Math.round((a - b) * 10) / 10 : NaN;
  const prevDiff = prev ? Math.round((prev.op - prev.other) * 10) / 10 : NaN;
  const change = fin(diff) && fin(prevDiff) ? Math.round((diff - prevDiff) * 10) / 10 : NaN;
  const fmt = (v) => iso(`${v > 0 ? '+' : ''}${v.toFixed(1)}`);
  const save = () => {
    dispatch({ type: 'measure/add', pid: patient.id, measure: { kind: 'girth', op: a, other: b } });
    toast(`حُفظ قياس المحيط: الفرق ${fmt(diff)} سم`);
    setOp(''); setOther('');
  };
  return html`<div class="stack" id="mx-girth">
    <${Guide} id="girth" />
    <div class="grid-2" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <div class="field"><label for="mx-girth-op">الساق المصابة (سم)</label>
        <input class="input num" id="mx-girth-op" type="number" inputmode="decimal" step="0.1" min="20" max="90" placeholder="مثال 41.5" value=${op} onInput=${(e) => setOp(e.currentTarget.value)} /></div>
      <div class="field"><label for="mx-girth-other">الساق السليمة (سم)</label>
        <input class="input num" id="mx-girth-other" type="number" inputmode="decimal" step="0.1" min="20" max="90" placeholder="مثال 39.5" value=${other} onInput=${(e) => setOther(e.currentTarget.value)} /></div>
    </div>
    ${(op || other) && !ok ? html`<p class="small muted">أدخل القياسين بالسنتيمتر (بين 20 و90).</p>` : null}
    ${ok ? html`<div class="card card-flat stack-sm" id="mx-girth-diff" role="status">
        <span class="small muted">الفرق (المصابة − السليمة)</span>
        <span class="mx-big">${fmt(diff)} <span class="small">سم</span></span>
        <span class="small">${diff > 0 ? `الركبة المصابة أكبر بـ ${iso(Math.abs(diff).toFixed(1))} سم` : diff < 0 ? 'الركبة المصابة أصغر من السليمة' : 'لا فرق بين الركبتين'}</span>
        ${fin(change) ? html`<span class=${`small ${change >= 1 ? 'strong' : 'muted'}`}>${change >= 1 ? `الفرق زاد ${iso(change.toFixed(1))} سم عن آخر قياس — أخبر أخصائيك، خاصة إذا صاحبه ألم أو حرارة.` : `مقارنة بآخر قياس (اليوم ${prev.day}): ${change <= -0.5 ? 'التورم أقل' : 'بدون تغير واضح'}.`}</span>` : null}
      </div>` : null}
    <button type="button" class="btn btn-primary btn-block" id="mx-girth-save" disabled=${!ok} onClick=${save}>حفظ القياس</button>
    ${prev ? html`<p class="small muted">آخر قياس: المصابة <span class="ltr">${prev.op}</span> سم · السليمة <span class="ltr">${prev.other}</span> سم (اليوم ${prev.day} بعد العملية)</p>` : null}
  </div>`;
}

/* ---------- ROM history ---------- */
function romText(r) {
  const parts = [];
  if (fin(r.flex)) parts.push(html`<span>ثني <span class="ltr">${degTxt(r.flex)}</span></span>`);
  if (fin(r.ext)) parts.push(html`<span>${r.ext <= 0 ? 'فرد كامل' : html`فرد ينقص <span class="ltr">${degTxt(r.ext)}</span>`}</span>`);
  return parts.length === 2 ? html`${parts[0]} · ${parts[1]}` : parts[0] || '—';
}

function RomHistory({ patient }) {
  const today = postOpDay(patient);
  const rows = (patient.rom || []).slice(-6).reverse();
  const trend = (patient.rom || []).filter((r) => fin(r.flex)).slice(-12).map((r) => r.flex);
  return html`<section class="card" id="mx-history" aria-labelledby="mx-history-title">
    <div class="card-head"><h3 id="mx-history-title">آخر قياسات المدى</h3>
      ${trend.length > 1 ? html`<${Sparkline} values=${trend} label="اتجاه ثني الركبة في آخر القياسات" color="var(--series-2)" />` : null}</div>
    ${rows.length ? html`<div class="list">${rows.map((r) => html`<div class="list-row">
        <div class="grow stack-sm" style="gap:0"><span class="strong">${romText(r)}</span>
          <span class="small muted">اليوم ${r.day} بعد العملية · ${relDay(r.day - today)}</span></div>
        <span class="stack-sm" style="gap:3px;align-items:flex-end">
          <${Pill} tone=${r.source === 'clinic' ? 'info' : 'plain'} icon=${r.source === 'clinic' ? 'check' : undefined}>${SOURCE_AR[r.source] || r.source || '—'}${r.sim ? ' · محاكاة' : ''}</${Pill}>
          ${r.conf ? html`<span class="quality" data-level=${r.conf} style="font-size:0.68rem;padding:1px 7px">${CONF_AR[r.conf]}</span>` : null}
        </span>
      </div>`)}</div>` : html`<p class="small muted">لا توجد قياسات بعد.</p>`}
    <p class="small muted" style="margin-top:8px">القياس الحضوري هو المرجع؛ قياسات البيت تساعد على متابعة الاتجاه بين الزيارات.</p>
  </section>`;
}

/* ---------- hub ---------- */
const TOOLS = [
  { id: 'live', icon: 'camera', guide: 'flexSide', title: 'الكاميرا الذكية', sub: 'تدرّبك على الوضع، وتبدأ بنفسها، وتعدّ التكرارات بصوتك' },
  { id: 'photo', icon: 'image', guide: 'flexSide', title: 'زاوية الركبة من صورة', sub: 'صورة جانبية والمنصة تقترح النقاط' },
  { id: 'video', icon: 'video', guide: 'squatSide', title: 'تحليل فيديو مسجل', sub: 'سجّل التمرين بالجوال ونحلله هنا' },
  { id: 'phone', icon: 'target', guide: 'phoneLeg', title: 'الجوال كمنقلة', sub: 'ضع الجوال على الفخذ ثم على الساق' },
  { id: 'wound', icon: 'shield', guide: 'wound', title: 'صورة الجرح', sub: 'فحص جودة الصورة ثم إرسالها لأخصائيك' },
  { id: 'girth', icon: 'knee', guide: 'girth', title: 'محيط الركبة', sub: 'متابعة التورم بشريط القياس' },
];
const FLEX_EXT = [{ id: 'flex', label: 'ثني' }, { id: 'ext', label: 'فرد' }];

function ToolCard({ tool, open, onToggle, children }) {
  return html`<section class="card mx-tool" id=${`mx-tool-${tool.id}`}>
    <button type="button" class="mx-tool-head" id=${`mx-tool-${tool.id}-toggle`} aria-expanded=${String(open)} aria-controls=${`mx-tool-${tool.id}-body`} onClick=${onToggle}>
      ${tool.guide ? html`<${GuideFigure} id=${tool.guide} thumb />` : html`<span class="icon-tile" aria-hidden="true"><${Icon} name=${tool.icon} size=${20} /></span>`}
      <span class="grow stack-sm" style="gap:0"><strong>${tool.title}</strong><span class="small muted">${tool.sub}</span></span>
      <span class="mx-chev" aria-hidden="true"><${Icon} name="forward" size=${18} /></span>
    </button>
    ${open ? html`<div class="mx-tool-body" id=${`mx-tool-${tool.id}-body`}>${children}</div>` : null}
  </section>`;
}

function LatestTile({ label, rec, text }) {
  return html`<div class="stat"><span class="label">${label}</span><span class="value">${text}</span>
    <span class="sub">${rec ? `${SOURCE_AR[rec.source] || rec.source} · اليوم\u00a0${rec.day}` : 'لا يوجد بعد'}</span></div>`;
}

export function MeasureHub({ patient }) {
  const state = useStore();
  const p = (patient && patientById(patient.id)) || patient;
  const [open, setOpen] = useState(null);
  const [photoMeasure, setPhotoMeasure] = useState('flex');
  const [phoneMeasure, setPhoneMeasure] = useState('flex');
  if (!p) return html`<div class="card">لا توجد بيانات مريض.</div>`;
  const L = latest(p);
  const ready = readyForNext(p, state.catalog);
  const tgt = flexTarget({ results: ready.results, contralateral: p.contralateral && p.contralateral.flex, lastFlex: L.flex });
  const openTool = (id) => {
    setOpen(id);
    setTimeout(() => {
      const el = document.getElementById(`mx-tool-${id}`);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      const t = document.getElementById(`mx-tool-${id}-toggle`);
      if (t) t.focus({ preventScroll: true });
    }, 30);
  };
  const addRom = (rom, text) => { dispatch({ type: 'rom/add', pid: p.id, rom }); toast(text); };
  const saveAngle = (source) => ({ measure, value, sim }) => {
    const v = Math.round(value);
    const extra = sim ? { sim: true } : {};
    if (measure === 'ext') addRom({ ext: Math.max(0, v), source, ...extra }, `حُفظ القياس: نقص الفرد ${iso(`${Math.max(0, v)}°`)}${sim ? ' (محاكاة)' : ''}`);
    else addRom({ flex: v, source, ...extra }, `حُفظ القياس: ثني ${iso(`${v}°`)}${sim ? ' (محاكاة)' : ''}`);
  };
  const saveSession = (s, origin) => {
    const rom = { source: 'camera' };
    const best = fin(s.heldMax) && s.heldMax >= 15 ? s.heldMax : s.maxFlex; // the sustained peak, not a one-frame spike
    if (fin(best) && best >= 15) rom.flex = Math.round(best);
    if (fin(s.extDeficit)) rom.ext = Math.max(0, Math.round(s.extDeficit));
    if (s.quality) rom.conf = scoreConfidence({ ...s.quality, frames: s.frames }).level;
    const parts = [];
    if (rom.flex !== undefined || rom.ext !== undefined) {
      dispatch({ type: 'rom/add', pid: p.id, rom });
      if (rom.flex !== undefined) parts.push(`ثني ${iso(`${rom.flex}°`)}`);
      if (rom.ext !== undefined) parts.push(rom.ext ? `فرد ينقص ${iso(`${rom.ext}°`)}` : 'فرد كامل');
    }
    dispatch({ type: 'measure/add', pid: p.id, measure: { kind: 'reps', count: s.count || 0, source: origin } });
    parts.push(`${s.count || 0} تكرار`);
    toast(`حُفظت الجلسة: ${parts.join(' · ')}`);
  };
  const bodies = {
    photo: () => html`<${PhotoTool} idp="mx" side=${p.side} measure=${photoMeasure} measures=${FLEX_EXT} onMeasure=${setPhotoMeasure} onSave=${saveAngle('photo')} />`,
    live: () => html`<${LiveTool} idp="mx" side=${p.side} kind="rom" onSave=${saveSession} onFallback=${openTool} target=${tgt && tgt.value} />`,
    video: () => html`<${VideoTool} idp="mx" side=${p.side} kind="rom" onSave=${saveSession} target=${tgt && tgt.value} />`,
    phone: () => html`<${PhoneTool} idp="mx" measure=${phoneMeasure} measures=${FLEX_EXT} onMeasure=${setPhoneMeasure} onSave=${saveAngle('phone')} />`,
    wound: () => html`<${WoundTool} patient=${p} />`,
    girth: () => html`<${GirthTool} patient=${p} />`,
  };
  return html`<div class="mx-hub" id="mx-hub">
    <section class="card mx-intro">
      <div class="mx-intro-head">
        <span class="icon-tile" aria-hidden="true"><${Icon} name="knee" size=${20} /></span>
        <div class="grow stack-sm" style="gap:2px"><h2>مختبر القياس</h2>
          <p class="small muted">قِس ركبتك ${SIDE_AR[p.side] ? `${SIDE_AR[p.side]} ` : ''}في البيت ويتابعها أخصائيك بين الزيارات.</p></div>
      </div>
      <div class="mx-latest">
        <${LatestTile} label="آخر ثني" rec=${L.flexRec} text=${html`<span class="ltr">${degTxt(L.flex)}</span>`} />
        <${LatestTile} label="آخر فرد" rec=${L.extRec} text=${fin(L.ext) ? (L.ext <= 0 ? 'كامل' : html`ينقص <span class="ltr">${degTxt(L.ext)}</span>`) : '—'} />
      </div>
      ${tgt ? html`<p class="small row" style="gap:6px;flex-wrap:nowrap;align-items:flex-start"><${Icon} name="target" size=${16} /><span>هدف الثني الحالي <strong class="ltr">${Math.round(tgt.value)}°</strong> <span class="muted">(${tgt.why})</span> — يظهر كخط ذهبي في الكاميرا.</span></p>` : null}
      <p class="small muted row" style="gap:6px;flex-wrap:nowrap;align-items:flex-start"><${Icon} name="info" size=${16} />${FOLLOW_UP}</p>
    </section>
    ${TOOLS.map((t) => html`<${ToolCard} key=${t.id} tool=${t} open=${open === t.id} onToggle=${() => setOpen(open === t.id ? null : t.id)}>
      ${open === t.id ? bodies[t.id]() : null}</${ToolCard}>`)}
    <${RomHistory} patient=${p} />
  </div>`;
}

/* ---------- camera check from an exercise card ---------- */
const CHECK_MODES = {
  flex: { title: 'ثني الركبة', kind: 'rom', photo: 'flex', methods: ['live', 'video', 'photo'],
    hint: 'صوّر من الجانب والساق المصابة أقرب للكاميرا. اسحب الكعب ببطء ثم ارجع — نعدّ التكرارات ونقيس أعلى ثني.' },
  ext: { title: 'فرد الركبة', kind: 'rom', photo: 'ext', methods: ['photo', 'phone'],
    hint: 'استلقِ والكعب على لفافة والركبة مرتخية. صوّر الساق من الجانب، أو استخدم الجوال كمنقلة.' },
  slr: { title: 'رفع الساق مستقيمة', kind: 'slr', photo: 'lag', methods: ['live', 'video', 'photo'],
    hint: 'صوّر من الجانب والجسم كامل ظاهر. شد الفخذ ثم ارفع الساق — نتأكد أن الركبة تبقى مستقيمة (لا تنثني أكثر من 5°).' },
  squat: { title: 'القرفصاء', kind: 'squat', photo: 'depth', methods: ['live', 'video', 'photo'],
    hint: 'صوّر من الجانب والجسم كامل ظاهر. انزل واطلع بهدوء — نعدّ التكرارات ونقيس العمق.' },
  valgus: { title: 'اتجاه الركبة', kind: 'valgus', photo: 'fppa', methods: ['live', 'video', 'photo'],
    hint: 'صوّر من الأمام والجوال بمستوى الركبة. نراقب هل تميل الركبة للداخل أثناء النزول.' },
};

function verifiedFrom(mode, r) {
  if (!r) return null;
  const single = r.method === 'photo' || r.method === 'phone';
  const v = { method: r.method, methodLabel: METHOD_AR[r.method] || r.method, count: null, maxFlex: null, extDeficit: null, lag: null, note: '' };
  if (!single && fin(r.count)) v.count = r.count;
  const reps = v.count ? ` · ${v.count} تكرار` : '';
  if (mode === 'flex') {
    const flex = single ? r.value : (fin(r.heldMax) && r.heldMax >= 15 ? r.heldMax : r.maxFlex);
    if (!fin(flex) || flex < 5) return null;
    v.maxFlex = Math.round(flex);
    v.note = `أعلى ثني ${iso(`${v.maxFlex}°`)}${reps}`;
  } else if (mode === 'ext') {
    const ext = single ? r.value : r.extDeficit;
    if (!fin(ext)) return null;
    v.extDeficit = Math.max(0, Math.round(ext));
    v.note = v.extDeficit === 0 ? 'فرد كامل' : `ينقص الفرد ${iso(`${v.extDeficit}°`)}`;
  } else if (mode === 'slr') {
    const lag = single ? r.value : r.lag;
    if (!fin(lag)) return null;
    v.lag = Math.max(0, Math.round(lag));
    v.note = v.lag > 5 ? `الركبة انثنت أثناء الرفع (تأخر ${iso(`${v.lag}°`)}) — يراجعها أخصائيك${reps}` : `الركبة بقيت مستقيمة أثناء الرفع${reps}`;
  } else if (mode === 'squat') {
    const depth = single ? r.value : r.maxFlex;
    if (!fin(depth)) return null;
    v.maxFlex = Math.round(depth);
    v.note = `أعمق نزول ${iso(`${v.maxFlex}°`)}${reps}`;
  } else if (mode === 'valgus') {
    const f = single ? r.value : r.fppaPeak;
    if (!fin(f)) return null;
    v.fppa = Math.round(f);
    v.note = `ميل الركبة ${iso(signedTxt(f))} — ${VISUAL_ONLY}${reps}`;
  }
  if (r.sim) { v.sim = true; v.note += ' (محاكاة)'; }
  return v;
}

export function CameraCheck({ patient, mode = 'flex', exercise, onDone, onClose }) {
  const state = useStore();
  const p = (patient && patientById(patient.id)) || patient;
  const cfg = CHECK_MODES[mode] || CHECK_MODES.flex;
  const [method, setMethod] = useState(cfg.methods[0]);
  const [result, setResult] = useState(null);
  const side = (p && p.side) || 'R';
  const verified = verifiedFrom(mode, result);
  const tgt = p && mode === 'flex' ? flexTarget({ results: readyForNext(p, state.catalog).results, contralateral: p.contralateral && p.contralateral.flex, lastFlex: latest(p).flex }) : null;
  const pick = (m) => { setResult(null); setMethod(m); };
  const confirm = () => {
    if (!verified) return;
    const source = method === 'photo' ? 'photo' : method === 'phone' ? 'phone' : 'camera';
    const extra = verified.sim ? { sim: true } : {};
    if (p && mode === 'flex' && fin(verified.maxFlex)) dispatch({ type: 'rom/add', pid: p.id, rom: { flex: verified.maxFlex, source, ...extra } });
    if (p && mode === 'ext' && fin(verified.extDeficit)) dispatch({ type: 'rom/add', pid: p.id, rom: { ext: verified.extDeficit, source, ...extra } });
    if (onDone) onDone({ verified });
    if (onClose) onClose();
  };
  const title = `تحقق بالكاميرا · ${(exercise && exercise.nameAr) || cfg.title}`;
  const footer = html`<button type="button" class="btn btn-ghost" id="cc-cancel" onClick=${onClose}>إلغاء</button>
    <button type="button" class="btn btn-primary" id="cc-confirm" disabled=${!verified} onClick=${confirm}><${Icon} name="check" size=${16} />اعتماد النتيجة</button>`;
  const common = { idp: 'cc', side, maxH: '40vh', onResult: setResult, compact: true, target: tgt ? tgt.value : undefined };
  return html`<${Modal} title=${title} onClose=${onClose} footer=${footer}><div class="mx-cc" id="cc-body">
    <p class="small">${cfg.hint}</p>
    ${cfg.methods.length > 1 ? html`<${MxSeg} id="cc-method" label="طريقة القياس" options=${cfg.methods.map((m) => ({ id: m, label: METHOD_AR[m] }))} value=${method} onChange=${pick} />` : null}
    ${mode === 'valgus' ? html`<div class="note note-warn" id="cc-visual-only"><strong>${VISUAL_ONLY}</strong></div>` : null}
    ${method === 'live' ? html`<${LiveTool} key="live" ...${common} kind=${cfg.kind} onFallback=${pick} />` : null}
    ${method === 'video' ? html`<${VideoTool} key="video" ...${common} kind=${cfg.kind} />` : null}
    ${method === 'photo' ? html`<${PhotoTool} key="photo" ...${common} measure=${cfg.photo} />` : null}
    ${method === 'phone' ? html`<${PhoneTool} key="phone" idp="cc" measure="ext" onResult=${setResult} />` : null}
    <div class=${`note ${verified ? 'note-info' : ''}`} id="cc-summary" role="status">
      ${verified ? html`<strong>النتيجة: </strong>${verified.note}` : 'ابدأ القياس لتظهر النتيجة هنا، ثم اعتمدها.'}
    </div>
    <p class="small muted">${FOLLOW_UP}</p>
  </div></${Modal}>`;
}
