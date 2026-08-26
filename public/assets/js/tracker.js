// متتبّع وقت المذاكرة: ينشئ مستند جلسة في eduSessions ويحدّثه دوريًا
// يحتسب الوقت فقط عندما تكون الصفحة ظاهرة وهناك تفاعل حديث
import {
  db, collection, addDoc, updateDoc, serverTimestamp, increment
} from "./auth.js";

const HEARTBEAT_MS = 20000;       // كل 20 ثانية
const IDLE_LIMIT_MS = 120000;     // يتوقف العدّ بعد دقيقتين بلا تفاعل

function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function startTracking(session, activity) {
  let ref = null;
  let pendingLetters = 0;
  let lastInteraction = Date.now();
  let lastTick = Date.now();
  let stopped = false;

  const markInteraction = () => { lastInteraction = Date.now(); };
  ["click", "keydown", "touchstart", "pointerdown"].forEach((ev) =>
    document.addEventListener(ev, markInteraction, { passive: true })
  );

  const created = addDoc(collection(db, "eduSessions"), {
    uid: session.user.uid,
    username: session.profile?.username || "",
    displayName: session.profile?.displayName || "",
    activity,
    date: todayKey(),
    seconds: 0,
    letters: 0,
    startTs: serverTimestamp(),
    lastTs: serverTimestamp()
  }).then((r) => { ref = r; return r; })
    .catch((e) => { console.warn("تعذر بدء تتبع الجلسة:", e); return null; });

  async function flush() {
    if (!ref || stopped === "done") return;
    const now = Date.now();
    let delta = 0;
    if (document.visibilityState === "visible" && now - lastInteraction < IDLE_LIMIT_MS) {
      delta = Math.round((now - lastTick) / 1000);
      // لا نحتسب فجوات كبيرة (نوم الجهاز مثلًا)
      if (delta > HEARTBEAT_MS / 1000 + 15) delta = Math.round(HEARTBEAT_MS / 1000);
    }
    lastTick = now;
    if (delta <= 0 && pendingLetters === 0) return;
    const data = { lastTs: serverTimestamp() };
    if (delta > 0) data.seconds = increment(delta);
    if (pendingLetters > 0) { data.letters = increment(pendingLetters); pendingLetters = 0; }
    try { await updateDoc(ref, data); } catch (e) { console.warn("تعذر تحديث الجلسة:", e); }
  }

  const timer = setInterval(flush, HEARTBEAT_MS);
  const onHide = () => { if (document.visibilityState === "hidden") flush(); };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);

  return {
    ready: created,
    // يسجّل عدد الحروف التي سمعتها/استعرضتها الطالبة
    addLetters(n = 1) { pendingLetters += n; markInteraction(); },
    async stop() {
      if (stopped === "done") return;
      await flush();
      stopped = "done";
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    }
  };
}

export function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} س ${m} د`;
  if (m > 0) return `${m} دقيقة`;
  return `${s} ثانية`;
}
