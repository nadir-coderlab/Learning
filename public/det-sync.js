// ============================================================
// det-sync.js — طبقة المزامنة السحابية لمدرّب ديولينجو (det-train.html)
//
// الفكرة: المدرّب يشتغل كامل من المتصفح (localStorage)، وهذا الملف يضيف له
// نسخة احتياطية خاصة في Firestore تحت المسار:
//   detLogs/{uid}                 ← حالة المدرّب كاملة (state) — مستند واحد
//   detLogs/{uid}/attempts/{id}   ← كل محاولة على حدة (سجل تفصيلي)
//
// الخصوصية: قواعد Firestore تسمح لصاحب الحساب فقط بالقراءة والكتابة
// (request.auth.uid == uid). ما فيه أي مستخدم ثاني يشوف سجلك.
//
// طريقة التحميل في المدرّب:
//   <script type="module" src="det-sync.js"></script>
// وبعدها كل شي متاح من window.DetSync (انظر الواجهة في آخر الملف).
//
// نفس إعدادات Firebase المستخدمة في assets/js/firebase-config.js — مشروع
// supportive-med، والدخول باسم مستخدم يُحوَّل لبريد <user>@edu.app وإذا
// ما زبط نجرّب <user>@supportive.app (حساب المدير من بوابة الخدمات المساندة).
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ------------------------------------------------------------
// إعدادات المشروع (منسوخة حرفيًا من assets/js/firebase-config.js)
// ------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyALwiyhiHRYmMZCNg7rCMAyjwyAdbet0XQ",
  authDomain: "supportive-med.firebaseapp.com",
  projectId: "supportive-med",
  storageBucket: "supportive-med.firebasestorage.app",
  messagingSenderId: "650172296223",
  appId: "1:650172296223:web:5918cde99da316799b792a",
  measurementId: "G-4258ECJQZF"
};

// نطاق حسابات الطلاب أولًا، ثم نطاق بوابة الخدمات المساندة كبديل
const USERNAME_DOMAIN = "edu.app";
const FALLBACK_DOMAIN = "supportive.app";

// اسم المجموعة الرئيسية في Firestore
const ROOT = "detLogs";
// حجم الدفعة الواحدة عند رفع المحاولات (حد Firestore 500 — نخليها 200 للأمان)
const BATCH_SIZE = 200;
// أقصى حجم لحالة المدرّب (Firestore يرفض المستند فوق 1 MB تقريبًا)
const MAX_STATE_CHARS = 900000;

// ------------------------------------------------------------
// أدوات مساعدة
// ------------------------------------------------------------

// اسم المستخدم → بريد (إذا كتب بريدًا كاملًا نخليه كما هو)
function usernameToEmail(input, domain = USERNAME_DOMAIN) {
  const v = String(input || "").trim().toLowerCase();
  if (!v) return "";
  return v.includes("@") ? v : `${v}@${domain}`;
}

// البريد → اسم المستخدم (الجزء قبل @)
function emailToName(email) {
  const v = String(email || "");
  const i = v.indexOf("@");
  return i > 0 ? v.slice(0, i) : v;
}

// رسائل أخطاء عربية مفهومة — نفس خريطة auth.js
function friendlyError(e) {
  const code = e?.code || "";
  const map = {
    "auth/invalid-credential": "اسم المستخدم أو كلمة المرور غير صحيحة",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/user-not-found": "اسم المستخدم غير موجود",
    "auth/user-disabled": "هذا الحساب معطّل",
    "auth/too-many-requests": "محاولات كثيرة — انتظر شوي وحاول مرة ثانية",
    "auth/email-already-in-use": "اسم المستخدم مستخدم مسبقًا",
    "auth/weak-password": "كلمة المرور ضعيفة (6 أحرف على الأقل)",
    "auth/invalid-email": "اسم المستخدم فيه رموز غير مسموحة",
    "auth/network-request-failed": "ما قدرنا نوصل للشبكة — تأكد من الإنترنت",
    "auth/requires-recent-login": "سجّل خروج ثم دخول مرة ثانية وحاول من جديد",
    "auth/missing-password": "اكتب كلمة المرور",
    "auth/invalid-login-credentials": "اسم المستخدم أو كلمة المرور غير صحيحة",
    "permission-denied": "ما عندك صلاحية لهذي العملية",
    "unavailable": "الخدمة غير متاحة حاليًا — حاول بعد شوي",
    "resource-exhausted": "تجاوزنا الحد المسموح مؤقتًا — حاول بعد شوي",
    "deadline-exceeded": "الاتصال أخذ وقت طويل — حاول مرة ثانية"
  };
  return map[code] || (e?.message || "صار خطأ غير متوقع");
}

// تحويل أي قيمة إلى شيء يقبله Firestore (بدون undefined ولا دوال)
function plain(v) {
  try {
    return JSON.parse(JSON.stringify(v === undefined ? null : v));
  } catch {
    return null;
  }
}

// معرّف محاولة صالح كاسم مستند (بدون / ولا فراغات)
function safeId(id) {
  const s = String(id ?? "").trim().replace(/[\/\s]+/g, "_");
  return s.slice(0, 200);
}

// ------------------------------------------------------------
// الحالة الداخلية للوحدة
// ------------------------------------------------------------
let app = null, auth = null, db = null;
let initError = null; // إذا فشل تهيئة Firebase نفسه (نادر) نحفظ السبب هنا

try {
  app = initializeApp(firebaseConfig, "det-sync");
  auth = getAuth(app);
  // long-polling تلقائي خلف البروكسي/الجدران النارية (نفس أسلوب auth.js)
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch (e) {
  initError = e;
  console.error("[DetSync] فشل تهيئة Firebase:", e);
}

const listeners = new Set();

// الكائن العام — نبنيه ثم نعلّقه على window
const DetSync = {
  user: null,
  status: { state: "off", pending: 0, lastSync: null, error: null },
  ready: null
};

// إشعار كل المستمعين + حدث على window — ما نرمي خطأ أبدًا من هنا
function emit() {
  for (const cb of listeners) {
    try { cb(); } catch (e) { console.error("[DetSync] خطأ في مستمع onChange:", e); }
  }
  try {
    window.dispatchEvent(new CustomEvent("detsync-change", {
      detail: { user: DetSync.user, status: { ...DetSync.status } }
    }));
  } catch (e) { /* تجاهل */ }
}

function setStatus(patch) {
  Object.assign(DetSync.status, patch);
  emit();
}

// الحالة المناسبة عند الخمول: off إذا ما فيه مستخدم، وإلا ok
function idleState() {
  return DetSync.user ? "ok" : "off";
}

// ------------------------------------------------------------
// متابعة حالة الدخول — ready تُحلّ عند أول معرفة للحالة
// ------------------------------------------------------------
DetSync.ready = new Promise((resolve) => {
  if (!auth) {
    // Firebase ما اشتغل أصلًا — نعتبر الحالة «مطفأة» ونكمل بدون تعطيل المدرّب
    DetSync.status.state = "off";
    DetSync.status.error = initError ? friendlyError(initError) : null;
    resolve();
    return;
  }
  let first = true;
  try {
    onAuthStateChanged(auth, (u) => {
      try {
        DetSync.user = u ? { uid: u.uid, email: u.email || "", name: emailToName(u.email) } : null;
        DetSync.status.state = idleState();
        DetSync.status.error = null;
        if (!u) DetSync.status.pending = 0;
        emit();
      } catch (e) {
        console.error("[DetSync] خطأ داخل onAuthStateChanged:", e);
      } finally {
        if (first) { first = false; resolve(); }
      }
    }, (err) => {
      // خطأ في المراقب نفسه — لا نرمي، نسجّل ونحلّ ready
      console.error("[DetSync] خطأ مراقب المصادقة:", err);
      try { setStatus({ state: "off", error: friendlyError(err) }); } catch { /* تجاهل */ }
      if (first) { first = false; resolve(); }
    });
  } catch (e) {
    console.error("[DetSync] تعذّر تسجيل مراقب المصادقة:", e);
    resolve();
  }
  // شبكة معلّقة؟ ما نخلي المدرّب ينتظر للأبد
  setTimeout(() => { if (first) { first = false; resolve(); } }, 15000);
});

// ------------------------------------------------------------
// onChange: تسجيل مستمع (يُستدعى فورًا مرة واحدة)
// ------------------------------------------------------------
DetSync.onChange = function (cb) {
  if (typeof cb !== "function") return () => {};
  listeners.add(cb);
  try { cb(); } catch (e) { console.error("[DetSync] خطأ في مستمع onChange:", e); }
  return () => listeners.delete(cb);
};

// ------------------------------------------------------------
// login: اسم مستخدم + كلمة مرور، مع تجربة النطاقين
// ------------------------------------------------------------
DetSync.login = async function (username, password) {
  if (!auth) throw new Error(initError ? friendlyError(initError) : "المزامنة غير متاحة الآن");
  const uname = String(username || "").trim();
  if (!uname) throw new Error("اكتب اسم المستخدم");
  if (!password) throw new Error("اكتب كلمة المرور");
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    // بعض المتصفحات (وضع التصفح الخاص) ترفض التخزين — نكمل بدون حفظ الجلسة
    console.warn("[DetSync] تعذّر ضبط حفظ الجلسة:", e);
  }
  const tryDomains = uname.includes("@")
    ? [null] // بريد كامل — كما هو
    : [USERNAME_DOMAIN, FALLBACK_DOMAIN]; // الطالب أولًا ثم حساب المدير من البوابة
  let lastErr = null;
  for (const d of tryDomains) {
    const email = d ? usernameToEmail(uname, d) : uname.toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const u = cred.user;
      DetSync.user = { uid: u.uid, email: u.email || "", name: emailToName(u.email) };
      setStatus({ state: "ok", error: null });
      return DetSync.user;
    } catch (e) {
      lastErr = e;
      const code = e?.code || "";
      // نجرّب النطاق الثاني فقط عند «بيانات غير صحيحة» — غير كذا نوقف
      const retryable = ["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-login-credentials"];
      if (!retryable.includes(code)) break;
    }
  }
  const err = new Error(friendlyError(lastErr));
  err.code = lastErr?.code || "";
  err.cause = lastErr;
  setStatus({ state: "off", error: err.message });
  throw err;
};

// ------------------------------------------------------------
// logout
// ------------------------------------------------------------
DetSync.logout = async function () {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (e) {
    console.error("[DetSync] فشل تسجيل الخروج:", e);
    throw new Error(friendlyError(e));
  }
  DetSync.user = null;
  setStatus({ state: "off", pending: 0, error: null });
};

// ------------------------------------------------------------
// pushAttempts: رفع قائمة محاولات على دفعات (200 لكل دفعة)
// كل محاولة تُكتب في detLogs/{uid}/attempts/{id} مع merge حتى لا تتكرر
// ------------------------------------------------------------
DetSync.pushAttempts = async function (list) {
  const arr = Array.isArray(list) ? list.filter((a) => a && a.id != null) : [];
  const uid = DetSync.user?.uid;
  if (!uid || !db) return { ok: 0, failed: arr.length };
  if (!arr.length) return { ok: 0, failed: 0 };

  let ok = 0, failed = 0;
  setStatus({ state: "syncing", pending: arr.length, error: null });
  try {
    for (let i = 0; i < arr.length; i += BATCH_SIZE) {
      const chunk = arr.slice(i, i + BATCH_SIZE);
      try {
        const batch = writeBatch(db);
        for (const a of chunk) {
          const id = safeId(a.id);
          if (!id) { failed++; continue; }
          const data = plain(a) || {};
          batch.set(
            doc(db, ROOT, uid, "attempts", id),
            { ...data, id, uid, savedAt: serverTimestamp() },
            { merge: true }
          );
        }
        await batch.commit();
        ok += chunk.length;
      } catch (e) {
        console.error("[DetSync] فشلت دفعة محاولات:", e);
        failed += chunk.length;
        DetSync.status.error = friendlyError(e);
      }
      DetSync.status.pending = Math.max(0, arr.length - ok - failed);
      emit();
    }
  } catch (e) {
    console.error("[DetSync] خطأ غير متوقع في pushAttempts:", e);
    DetSync.status.error = friendlyError(e);
  }
  setStatus({
    state: failed ? "error" : idleState(),
    pending: 0,
    lastSync: ok ? Date.now() : DetSync.status.lastSync
  });
  return { ok, failed };
};

// ------------------------------------------------------------
// saveState: حفظ حالة المدرّب كاملة في detLogs/{uid} (استبدال كامل)
// ------------------------------------------------------------
DetSync.saveState = async function (state, meta) {
  const uid = DetSync.user?.uid;
  if (!uid || !db) return false;
  const data = plain(state) ?? {};
  let size = 0;
  try { size = JSON.stringify(data).length; } catch { size = 0; }
  if (size > MAX_STATE_CHARS) {
    throw new Error("حجم بيانات المدرّب كبير جدًا على المزامنة — نظّف السجل القديم وحاول مرة ثانية");
  }
  setStatus({ state: "syncing", error: null });
  try {
    await setDoc(doc(db, ROOT, uid), {
      uid,
      app: "det-train",
      v: 1,
      updatedAt: serverTimestamp(),
      clientUpdatedAt: Number(meta?.t) || Date.now(),
      state: data
    }, { merge: false });
    setStatus({ state: "ok", lastSync: Date.now(), error: null });
    return true;
  } catch (e) {
    console.error("[DetSync] فشل حفظ الحالة:", e);
    setStatus({ state: "error", error: friendlyError(e) });
    return false;
  }
};

// ------------------------------------------------------------
// loadState: جلب آخر حالة محفوظة (null إذا ما فيه أو غير مسجّل)
// ------------------------------------------------------------
DetSync.loadState = async function () {
  const uid = DetSync.user?.uid;
  if (!uid || !db) return null;
  try {
    const snap = await getDoc(doc(db, ROOT, uid));
    if (!snap.exists()) return null;
    const d = snap.data() || {};
    const ts = d.updatedAt;
    const updatedAt = ts && typeof ts.toMillis === "function" ? ts.toMillis() : (Number(ts) || null);
    return {
      state: d.state ?? null,
      clientUpdatedAt: Number(d.clientUpdatedAt) || null,
      updatedAt
    };
  } catch (e) {
    console.error("[DetSync] فشل جلب الحالة:", e);
    setStatus({ state: "error", error: friendlyError(e) });
    return null;
  }
};

// ------------------------------------------------------------
// listAttempts: آخر N محاولة (الأحدث أولًا حسب t)
// ------------------------------------------------------------
DetSync.listAttempts = async function (opts) {
  const uid = DetSync.user?.uid;
  if (!uid || !db) return [];
  const n = Math.max(1, Math.min(1000, Number(opts?.limit) || 50));
  try {
    const q = query(collection(db, ROOT, uid, "attempts"), orderBy("t", "desc"), fsLimit(n));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const a = d.data() || {};
      // savedAt طابع زمني من السيرفر — نحوّله لملّي ثانية حتى يسهل استخدامه
      if (a.savedAt && typeof a.savedAt.toMillis === "function") a.savedAt = a.savedAt.toMillis();
      return { id: d.id, ...a };
    });
  } catch (e) {
    console.error("[DetSync] فشل جلب المحاولات:", e);
    setStatus({ state: "error", error: friendlyError(e) });
    return [];
  }
};

// ------------------------------------------------------------
// تعليق الواجهة على window
// ------------------------------------------------------------
try {
  window.DetSync = DetSync;
  // إشعار أولي حتى تعرف الصفحة أن الوحدة تحمّلت
  emit();
} catch (e) {
  console.error("[DetSync] تعذّر تعليق الواجهة على window:", e);
}

export default DetSync;
