// Setup guides for the measurement lab: one illustration + three steps per setup. The drawn
// pictogram ships with the app; a real illustration (assets/guide/<file>) replaces it when present.
import { html, useState } from './h.js';

export const GUIDES = {
  flexSide: {
    title: 'ثني الركبة من الجانب', file: 'knee-flexion-side.jpg', pict: 'sideLying',
    steps: ['استلقِ على ظهرك والساق المصابة أقرب للكاميرا.', 'ثبّت الجوال على كرسي بمستوى الركبة، على بعد مترين تقريبًا، والشاشة باتجاهك.', 'شورت أو ملابس ضيقة، وإضاءة من الأمام لا من الخلف.'],
  },
  extProp: {
    title: 'فرد الركبة والكعب على لفافة', file: 'knee-extension-heel-prop.jpg', pict: 'extProp',
    steps: ['استلقِ وضع الكعب على منشفة ملفوفة، والركبة مرتخية.', 'صوّر الساق كاملة من الجانب والجوال بمستوى الركبة.', 'لا تضغط الركبة بيدك أثناء التصوير.'],
  },
  phoneLeg: {
    title: 'الجوال كمنقلة على الساق', file: 'phone-inclinometer.jpg', pict: 'phoneThigh',
    steps: ['اجلس أو استلقِ واثنِ الركبة إلى أقصى ما تقدر براحة.', 'ضع الجوال على مقدمة الفخذ (الحافة الطويلة على طول العظم) وثبّت القراءة.', 'ثم ضعه على مقدمة الساق بنفس الطريقة وثبّت القراءة الثانية.'],
  },
  slr: {
    title: 'رفع الساق مستقيمة', file: 'straight-leg-raise.jpg', pict: 'slr',
    steps: ['استلقِ على ظهرك والساق الأخرى مثنية والقدم على الأرض.', 'الجوال على الجانب بمستوى الورك وعلى بعد مترين، والجسم كامل ظاهر.', 'شد الفخذ أولًا ثم ارفع الساق مستقيمة ببطء.'],
  },
  squatSide: {
    title: 'القرفصاء من الجانب', file: 'squat-side.jpg', pict: 'squatSide',
    steps: ['قف جانبًا للكاميرا على بعد مترين والجسم كامل ظاهر.', 'الجوال على كرسي بمستوى الركبة.', 'انزل واطلع بهدوء، ثانيتين نزول وثانيتين صعود.'],
  },
  valgusFront: {
    title: 'اتجاه الركبة من الأمام', file: 'knee-valgus-front.jpg', pict: 'valgusFront',
    steps: ['واجه الكاميرا وقف على بعد مترين، والساقان ظاهرتان من الورك للقدم.', 'الجوال بمستوى الركبة على كرسي.', 'انزل في قرفصاء خفيفة وراقب أن الركبة فوق القدم لا داخلها.'],
  },
  wound: {
    title: 'صورة الجرح', file: 'wound-photo.jpg', pict: 'wound',
    steps: ['إضاءة نهار وبدون فلاش قريب.', 'الجوال على بعد 20–30 سم والجرح في منتصف الصورة.', 'المس الشاشة على الجرح ليركّز ثم صوّر.'],
  },
  girth: {
    title: 'محيط الركبة', file: 'knee-girth-tape.jpg', pict: 'girth',
    steps: ['الساق مفرودة ومرتخية.', 'لف شريط القياس حول منتصف الرضفة بدون شد.', 'قِس الركبتين بنفس الطريقة وسجّل الرقمين.'],
  },
};

const S = {
  stroke: 'stroke', thin: 'thin', leg: 'leg', floor: 'floor', prop: 'prop', head: 'head', label: 'label', ray: 'cam-ray', phone: 'phone', screen: 'phone-screen',
};
const line = (a, b, cls = S.stroke) => html`<line class=${cls} x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} />`;
const head = (c, r = 6) => html`<circle class=${S.head} cx=${c[0]} cy=${c[1]} r=${r} />`;
const phone = (x, y, w = 7, h = 14, rot = 0) => html`<g transform=${`rotate(${rot} ${x + w / 2} ${y + h / 2})`}><rect class=${S.phone} x=${x} y=${y} width=${w} height=${h} rx="1.6" /><rect class=${S.screen} x=${x + 1.2} y=${y + 1.6} width=${w - 2.4} height=${h - 3.2} rx="0.8" /></g>`;
const ray = (a, b) => html`<line class=${S.ray} x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} />`;
const stand = (x, y, hgt) => html`<rect class=${S.prop} x=${x - 9} y=${y} width="18" height=${hgt} rx="2" />`;
const label = (x, y, t, anchor = 'middle') => html`<text class=${S.label} x=${x} y=${y} text-anchor=${anchor}>${t}</text>`;
const floor = html`<line class=${S.floor} x1="6" y1="104" x2="154" y2="104" />`;

/** Supine person, head at the left; thigh angle a (deg above floor) and knee flexion f. */
function supine(hipX, flexion, thighDeg, { prop = false, legUpOnly = false } = {}) {
  const rad = (d) => (d * Math.PI) / 180;
  const H = [hipX, 96];
  const K = [H[0] + 30 * Math.cos(rad(thighDeg)), H[1] - 30 * Math.sin(rad(thighDeg))];
  const shankDeg = thighDeg - flexion;
  const A = [K[0] + 28 * Math.cos(rad(shankDeg)), K[1] - 28 * Math.sin(rad(shankDeg))];
  const S0 = [H[0] - 34, 96];
  const els = [];
  if (prop) els.push(html`<circle class=${S.prop} cx=${A[0] + 2} cy="99" r="5" />`);
  els.push(line(S0, H)); // trunk
  els.push(head([S0[0] - 9, 95]));
  els.push(line([S0[0] + 8, 96], [S0[0] + 24, 98], S.thin)); // arm
  if (!legUpOnly) { const K2 = [H[0] + 26, 84]; els.push(line(H, K2, S.thin)); els.push(line(K2, [K2[0] + 10, 102], S.thin)); } // other leg bent
  els.push(line(H, K, S.leg)); els.push(line(K, A, S.leg));
  els.push(html`<circle class=${S.stroke} cx=${K[0]} cy=${K[1]} r="2.4" />`);
  return { els, K, H, A };
}

const PICTS = {
  sideLying() {
    const { els, K } = supine(62, 92, 48);
    return html`${floor}${els}${stand(132, 78, 26)}${phone(128.5, 64, 7, 14)}${ray([128, 71], [K[0] + 4, K[1]])}${label(100, 60, '≈ 2 م')}${label(154, 112, 'كرسي بمستوى الركبة', 'end')}`;
  },
  extProp() {
    const { els, K } = supine(62, 4, 8, { prop: true, legUpOnly: true });
    return html`${floor}${els}${stand(132, 78, 26)}${phone(128.5, 64, 7, 14)}${ray([128, 71], [K[0], K[1] + 2])}${label(100, 60, '≈ 2 م')}${label(154, 112, 'الكعب على لفافة', 'end')}`;
  },
  phoneThigh() {
    const { els, K, H, A } = supine(60, 70, 40, { legUpOnly: true });
    const mid = (P, Q, t = 0.5) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
    const T = mid(H, K, 0.5); const Sh = mid(K, A, 0.5);
    return html`${floor}${els}
      <g transform=${`translate(${T[0]} ${T[1] - 6}) rotate(-40)`}>${phone(-7, -3.5, 14, 7)}</g>
      <g transform=${`translate(${Sh[0]} ${Sh[1] - 6}) rotate(30)`} opacity="0.45">${phone(-7, -3.5, 14, 7)}</g>
      ${label(T[0] - 2, T[1] - 16, '1 الفخذ')}${label(Sh[0] + 10, Sh[1] - 12, '2 الساق')}${label(154, 112, 'الثني = ميل الفخذ + ميل الساق', 'end')}`;
  },
  slr() {
    const { els } = supine(60, 0, 28);
    return html`${floor}${els}${stand(132, 78, 26)}${phone(128.5, 64, 7, 14)}${ray([128, 71], [96, 86])}${label(100, 60, '≈ 2 م')}${label(80, 114, 'الركبة مستقيمة أثناء الرفع')}`;
  },
  squatSide() {
    const H = [66, 62]; const K = [80, 80]; const A = [74, 104]; const Sh = [60, 36];
    return html`${floor}${line(Sh, H)}${head([Sh[0] + 2, 27])}${line(Sh, [78, 50], S.thin)}${line(H, K, S.leg)}${line(K, A, S.leg)}${line(A, [86, 104], S.leg)}
      <circle class=${S.stroke} cx=${K[0]} cy=${K[1]} r="2.4" />
      ${stand(134, 78, 26)}${phone(130.5, 64, 7, 14)}${ray([130, 71], [84, 80])}${label(108, 60, '≈ 2 م')}${label(56, 114, 'الجسم كامل ظاهر')}`;
  },
  valgusFront() {
    return html`${floor}${head([80, 24])}${line([80, 30], [80, 58])}${line([68, 36], [92, 36], S.thin)}
      ${line([72, 58], [70, 80], S.leg)}${line([70, 80], [68, 104], S.leg)}${line([88, 58], [90, 80], S.leg)}${line([90, 80], [92, 104], S.leg)}
      <circle class=${S.stroke} cx="70" cy="80" r="2.4" /><circle class=${S.stroke} cx="90" cy="80" r="2.4" />
      ${line([70, 80], [66, 104], S.ray)}${label(80, 114, 'الركبة فوق القدم')}
      ${stand(136, 78, 26)}${phone(132.5, 64, 7, 14)}${ray([132, 71], [96, 80])}`;
  },
  wound() {
    return html`${line([40, 40], [52, 70], S.leg)}${line([52, 70], [46, 104], S.leg)}<circle class=${S.stroke} cx="52" cy="70" r="2.4" />
      ${line([54, 62], [50, 80], 'stroke')}${html`<circle class="target" cx="52" cy="71" r="1.8" />`}
      ${phone(104, 58, 10, 20)}${ray([104, 68], [58, 70])}${label(82, 56, '20–30 سم')}
      <circle class=${S.thin} cx="130" cy="30" r="8" />${line([130, 16], [130, 20], S.thin)}${line([130, 40], [130, 44], S.thin)}${line([116, 30], [120, 30], S.thin)}${line([140, 30], [144, 30], S.thin)}
      ${label(130, 56, 'ضوء النهار')}${label(80, 114, 'الجرح في منتصف الصورة')}`;
  },
  girth() {
    return html`${line([60, 14], [66, 58], S.leg)}${line([66, 58], [62, 106], S.leg)}<circle class=${S.stroke} cx="66" cy="58" r="2.4" />
      <ellipse class=${S.stroke} cx="66" cy="58" rx="13" ry="5" />
      ${line([79, 58], [122, 58], S.stroke)}${line([122, 54], [122, 62], S.stroke)}
      ${label(100, 52, 'شريط القياس')}${label(66, 78, 'منتصف الرضفة')}${label(80, 114, 'الساق مفرودة ومرتخية')}`;
  },
};

export function Pictogram({ kind, title }) {
  const draw = PICTS[kind] || PICTS.sideLying;
  return html`<svg class="pict" viewBox="0 0 160 120" role="img" aria-label=${title || ''}>${draw()}</svg>`;
}

/** The illustration: assets/guide/<file> when it exists, else the drawn pictogram. */
export function GuideFigure({ id, thumb }) {
  const g = GUIDES[id];
  const [missing, setMissing] = useState(false);
  if (!g) return null;
  const base = typeof document !== 'undefined' ? new URL('assets/guide/', document.baseURI).href : 'assets/guide/';
  return html`<div class=${thumb ? 'guide-thumb' : 'guide-figure'} aria-hidden=${thumb ? 'true' : undefined}>
    ${missing ? html`<${Pictogram} kind=${g.pict} title=${g.title} />` : html`<img src=${`${base}${g.file}`} alt=${thumb ? '' : g.title} loading="lazy" onError=${() => setMissing(true)} />`}
  </div>`;
}

/** Figure + numbered steps, shown at the top of each tool. */
export function Guide({ id, extra }) {
  const g = GUIDES[id];
  if (!g) return null;
  return html`<div class="guide" id=${`guide-${id}`}>
    <${GuideFigure} id=${id} />
    <ol class="guide-steps"><strong>${g.title}</strong>${g.steps.map((s, i) => html`<li key=${i}>${s}</li>`)}${extra ? html`<li>${extra}</li>` : null}</ol>
  </div>`;
}
