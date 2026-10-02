// Device sensors and media helpers for the measurement lab: camera access with friendly Arabic
// errors, the motion sensor (phone as inclinometer), image decoding, video frame stepping and the
// photo quality check. Nothing here uploads anything; pixels stay in memory on the device.
// Safe to import in Node (tests): no DOM access at module load.

/** Current value of a CSS custom property (for canvas drawing that follows the theme). */
export function cssVar(name, fallback = '') {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch { return fallback; }
}

/* ---------- camera ---------- */
const CAM_MSG = {
  denied: 'ما سُمح باستخدام الكاميرا هنا. سجّل فيديو بكاميرا الجوال وحلّله، أو استخدم صورة.',
  policy: 'الكاميرا المباشرة غير متاحة داخل هذه الصفحة المضمّنة. سجّل فيديو بالجوال وحلّله، أو استخدم صورة.',
  insecure: 'الكاميرا المباشرة تحتاج رابطًا آمنًا (https). سجّل فيديو بالجوال وحلّله، أو استخدم صورة.',
  nocamera: 'ما لقينا كاميرا في هذا الجهاز. سجّل فيديو بالجوال وحلّله هنا، أو استخدم صورة.',
  busy: 'الكاميرا مستخدمة في تطبيق ثاني. أغلقه وحاول مرة ثانية.',
  error: 'تعذّر تشغيل الكاميرا. جرّب الفيديو المسجل أو الصورة.',
};

/** False when the page's permissions policy forbids a feature (e.g. inside an embedded frame). */
export function policyAllows(feature) {
  try {
    const pol = document.permissionsPolicy || document.featurePolicy;
    return pol && typeof pol.allowsFeature === 'function' ? pol.allowsFeature(feature) : true;
  } catch { return true; }
}

/** True when this frame is not allowed to use the camera at all (e.g. an embedded artifact). */
export function cameraBlockedByPolicy() {
  return !policyAllows('camera');
}

export function cameraError(e) {
  const name = (e && e.name) || '';
  let code = 'error';
  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(name)) code = cameraBlockedByPolicy() ? 'policy' : 'denied';
  else if (['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(name)) code = 'nocamera';
  else if (['NotReadableError', 'TrackStartError', 'AbortError'].includes(name)) code = 'busy';
  return { code, message: CAM_MSG[code], name };
}

/** Opens the camera. facing: 'user' (front) | 'environment' (back). Rejects with { code, message }. */
export async function openCamera(facing = 'user') {
  if (typeof window === 'undefined' || !window.isSecureContext) throw { code: 'insecure', message: CAM_MSG.insecure };
  // Asking anyway would only log a policy violation and fail; answer straight away instead.
  if (cameraBlockedByPolicy()) throw { code: 'policy', message: CAM_MSG.policy };
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') throw { code: 'nocamera', message: CAM_MSG.nocamera };
  const ideal = { audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } } };
  try {
    return await navigator.mediaDevices.getUserMedia(ideal);
  } catch (e) {
    if (e && e.name === 'OverconstrainedError') {
      try { return await navigator.mediaDevices.getUserMedia({ audio: false, video: true }); } catch (e2) { throw cameraError(e2); }
    }
    throw cameraError(e);
  }
}

export function stopStream(stream) {
  try { if (stream) stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
}

/** Resolves once the video element knows its frame size (or after a short wait). */
export function videoReady(video, timeoutMs = 4000) {
  if (video.videoWidth && video.readyState >= 2) return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = (ok) => { clearTimeout(t); video.removeEventListener('loadeddata', on); video.removeEventListener('resize', on); resolve(ok); };
    const on = () => { if (video.videoWidth) done(true); };
    const t = setTimeout(() => done(Boolean(video.videoWidth)), timeoutMs);
    video.addEventListener('loadeddata', on);
    video.addEventListener('resize', on);
  });
}

/* ---------- motion sensor (phone as inclinometer) ---------- */
/**
 * iOS 13+ asks for motion permission. MUST be called synchronously inside a click handler.
 * Resolves to 'granted' | 'denied' | 'not-needed' | 'unsupported'.
 */
export function requestMotionPermission() {
  try {
    if (typeof window === 'undefined' || typeof window.DeviceOrientationEvent === 'undefined') return Promise.resolve('unsupported');
    const ask = window.DeviceOrientationEvent.requestPermission;
    if (typeof ask !== 'function') return Promise.resolve('not-needed');
    return ask.call(window.DeviceOrientationEvent).then((s) => (s === 'granted' ? 'granted' : 'denied'), () => 'denied');
  } catch { return Promise.resolve('denied'); }
}

/**
 * Streams device tilt (beta = front/back tilt in degrees). Calls onNoSensor(reason) if no real
 * reading arrives within timeoutMs — reason 'policy' (embedded frame), 'unsupported' or 'timeout'
 * (desktop browsers usually). Returns a stop function.
 */
export function watchOrientation({ onReading, onNoSensor, timeoutMs = 1500 } = {}) {
  let got = false; let stopped = false;
  const handler = (e) => {
    if (stopped) return;
    const b = e.beta;
    if (typeof b !== 'number' || !Number.isFinite(b)) return;
    got = true;
    if (onReading) onReading({ beta: b, gamma: e.gamma, alpha: e.alpha });
  };
  const supported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
  const allowed = supported && policyAllows('accelerometer') && policyAllows('gyroscope');
  const reason = !supported ? 'unsupported' : !allowed ? 'policy' : 'timeout';
  if (allowed) window.addEventListener('deviceorientation', handler);
  const timer = setTimeout(() => { if (!got && !stopped && onNoSensor) onNoSensor(reason); }, allowed ? timeoutMs : 0);
  return () => { stopped = true; clearTimeout(timer); if (allowed) window.removeEventListener('deviceorientation', handler); };
}

/* ---------- images ---------- */
/** Decodes an image file honoring EXIF rotation. Returns { source, width, height, close() }. */
export async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close && bmp.close() };
    } catch { /* fall back to <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await (img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; }));
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Draws a decoded image into a new canvas whose long side is at most maxSide. */
export function toCanvas(source, width, height, maxSide = 1600) {
  const k = Math.min(1, maxSide / Math.max(width, height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width * k));
  c.height = Math.max(1, Math.round(height * k));
  c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
  return c;
}

/** Luma (0–255) from RGBA bytes. */
export function grayscale(rgba, w, h) {
  const g = new Float32Array(w * h);
  for (let i = 0, j = 0; j < g.length; i += 4, j += 1) g[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
  return g;
}

/** Variance of the 3×3 Laplacian ([0 1 0; 1 −4 1; 0 1 0]) — low means blurry. */
export function laplacianVariance(gray, w, h) {
  let n = 0; let sum = 0; let sum2 = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
      sum += v; sum2 += v * v; n += 1;
    }
  }
  if (!n) return 0;
  const m = sum / n;
  return Math.max(0, sum2 / n - m * m);
}

/**
 * Focus measure: the 3×3 Laplacian variance computed per tile on an n×n grid; returns the
 * second-highest tile. A wound close-up is mostly smooth skin, so a whole-image variance would call
 * a sharp photo "blurry"; asking "is some region clearly in focus?" does not.
 */
export function focusMeasure(gray, w, h, n = 4) {
  const vals = [];
  for (let ty = 0; ty < n; ty++) {
    for (let tx = 0; tx < n; tx++) {
      const y0 = Math.max(1, Math.floor((ty * h) / n)); const y1 = Math.min(h - 1, Math.floor(((ty + 1) * h) / n));
      const x0 = Math.max(1, Math.floor((tx * w) / n)); const x1 = Math.min(w - 1, Math.floor(((tx + 1) * w) / n));
      let c = 0; let s1 = 0; let s2 = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * w + x;
          const v = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i];
          s1 += v; s2 += v * v; c += 1;
        }
      }
      vals.push(c ? Math.max(0, s2 / c - (s1 / c) ** 2) : 0);
    }
  }
  vals.sort((a, b) => b - a);
  return vals.length > 1 ? vals[1] : vals[0] || 0;
}

export function meanOf(gray) {
  let s = 0;
  for (let i = 0; i < gray.length; i++) s += gray[i];
  return gray.length ? s / gray.length : 0;
}

// Calibrated on 512 px (long side) copies of a test photo: in-focus images scored 1300–2100,
// a slight 0.5 px blur ~340, clearly blurry ones (≥ 1 px blur at 512 px) 30–95. Brightness is mean
// luma 0–255 (a 4× darkened photo ≈ 43, an overexposed one ≈ 244).
export const QUALITY_LIMITS = { dark: 60, bright: 205, sharp: 100, minShortSide: 720, workSide: 512 };

/** Pure verdict from the measured numbers. */
export function assessQuality({ brightness, sharpness, width, height }, L = QUALITY_LIMITS) {
  const shortSide = Math.min(width, height);
  const light = brightness < L.dark ? 'dark' : brightness > L.bright ? 'bright' : 'ok';
  const checks = [
    { id: 'light', ok: light === 'ok', label: light === 'dark' ? 'الإضاءة ضعيفة' : light === 'bright' ? 'الإضاءة قوية جدًا' : 'الإضاءة مناسبة',
      fix: light === 'dark' ? 'صوّر قرب نافذة أو شغّل نور الغرفة، بدون فلاش قريب.' : light === 'bright' ? 'ابتعد عن الشمس المباشرة أو الفلاش.' : '' },
    { id: 'sharp', ok: sharpness >= L.sharp, label: sharpness >= L.sharp ? 'الصورة واضحة' : 'الصورة مهزوزة أو غير مركّزة',
      fix: sharpness >= L.sharp ? '' : 'ثبّت الجوال بيدين، والمس الشاشة على الجرح ليركّز، ثم صوّر.' },
    { id: 'size', ok: shortSide >= L.minShortSide, label: shortSide >= L.minShortSide ? 'الدقة كافية' : 'دقة الصورة منخفضة',
      fix: shortSide >= L.minShortSide ? '' : 'استخدم الكاميرا الخلفية بدقتها الكاملة.' },
  ];
  return { ok: checks.every((c) => c.ok), checks };
}

/** Quality check on a downscaled copy (never stored). source: canvas, ImageBitmap or <img>. */
export function imageQuality(source, width, height) {
  const c = toCanvas(source, width, height, QUALITY_LIMITS.workSide);
  const { data } = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height);
  const gray = grayscale(data, c.width, c.height);
  const brightness = meanOf(gray);
  const sharpness = focusMeasure(gray, c.width, c.height);
  return { brightness, sharpness, width, height, ...assessQuality({ brightness, sharpness, width, height }) };
}

/* ---------- recorded video ---------- */
/** Waits for one of the events (or the timeout). Resolves with the event name, or 'timeout'. */
export function onceEvent(target, names, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const offs = [];
    const done = (name) => { clearTimeout(t); offs.forEach((f) => f()); resolve(name); };
    names.forEach((n) => { const f = () => done(n); target.addEventListener(n, f); offs.push(() => target.removeEventListener(n, f)); });
    const t = setTimeout(() => done('timeout'), timeoutMs);
  });
}

/** Seeks and resolves true once the frame at time t is ready to read (false on timeout). */
export function seekTo(video, t, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const done = (ok) => { clearTimeout(timer); video.removeEventListener('seeked', onSeeked); resolve(ok); };
    const onSeeked = () => done(true);
    const timer = setTimeout(() => done(false), timeoutMs);
    video.addEventListener('seeked', onSeeked);
    video.currentTime = t;
  });
}

/** Duration in seconds; works around recordings (e.g. MediaRecorder WebM) that report Infinity. */
export async function videoDuration(video) {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  await new Promise((resolve) => {
    const done = () => { clearTimeout(t); video.removeEventListener('durationchange', on); resolve(); };
    const on = () => { if (Number.isFinite(video.duration)) done(); };
    const t = setTimeout(done, 4000);
    video.addEventListener('durationchange', on);
    video.currentTime = 1e7;
  });
  const d = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  await seekTo(video, 0);
  return d;
}
