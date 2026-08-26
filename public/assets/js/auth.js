// طبقة المصادقة لموقع تعليم الإنجليزية (يعمل بالكامل من المتصفح — لا يحتاج سيرفر)
// نفس أسلوب بوابة الخدمات المساندة لكن ببيانات منفصلة (مجموعات edu*)
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  firebaseConfig, usernameToEmail, emailToUsername, USERNAME_DOMAIN, FALLBACK_DOMAIN
} from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// long-polling تلقائي خلف البروكسي/الجدران النارية
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

// حساب المدير الرئيسي — نفس حساب مدير بوابة الخدمات المساندة
export const BOOTSTRAP_ADMIN_UID = "Nq91M2BICHQlf848bJrVq8yTKMk1";

export { serverTimestamp, increment, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc, query, where };

// ---------------------------------------------------------------
// الجلسة الحالية + ملف الطالبة من eduUsers
// ---------------------------------------------------------------

export function watchSession(callback) {
  // callback(session): null (غير مسجل) أو { user, profile, profileError }
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return callback(null);
    let profile = null, profileError = false, lastErr = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const snap = await getDoc(doc(db, "eduUsers", user.uid));
        profile = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        profileError = false; lastErr = null;
        break;
      } catch (e) {
        lastErr = e; profileError = true;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    if (profileError) {
      console.error("تعذّر جلب الملف بعد عدة محاولات:", lastErr);
      return callback({ user, profile: null, profileError: true });
    }
    // المدير الرئيسي: يُنشأ ملفه في eduUsers تلقائيًا عند أول دخول
    if (!profile && user.uid === BOOTSTRAP_ADMIN_UID) {
      const data = {
        username: emailToUsername(user.email),
        displayName: "بابا (المدير)",
        role: "admin",
        avatar: "🧑‍💼",
        disabled: false,
        createdAt: serverTimestamp()
      };
      try {
        await setDoc(doc(db, "eduUsers", user.uid), data);
        profile = { id: user.uid, ...data };
      } catch (e) {
        console.error("فشل إنشاء ملف المدير:", e);
      }
    }
    callback({ user, profile, profileError: false });
  });
}

export function isAdminSession(session) {
  if (!session) return false;
  if (session.user.uid === BOOTSTRAP_ADMIN_UID) return true;
  return session.profile?.role === "admin";
}

// ---------------------------------------------------------------
// حارس الصفحات الداخلية: يعيد التوجيه للرئيسية إذا لا توجد جلسة صالحة
// ---------------------------------------------------------------

export function requireSession(onReady, { adminOnly = false } = {}) {
  const go = (reason) => location.replace("/?reason=" + reason);
  let settled = false;
  const timer = setTimeout(() => { if (!settled) go("timeout"); }, 20000);
  watchSession((session) => {
    if (settled) { if (!session) go("login-required"); return; }
    if (!session) { settled = true; clearTimeout(timer); return go("login-required"); }
    if (session.profileError) { settled = true; clearTimeout(timer); return go("conn"); }
    if (!session.profile) { settled = true; clearTimeout(timer); return go("no-profile"); }
    if (session.profile.disabled) { settled = true; clearTimeout(timer); return go("disabled"); }
    if (adminOnly && !isAdminSession(session)) { settled = true; clearTimeout(timer); return go("no-access"); }
    settled = true; clearTimeout(timer);
    onReady(session);
  });
}

// ---------------------------------------------------------------
// الدخول / الخروج
// ---------------------------------------------------------------

export async function login(username, password) {
  await setPersistence(auth, browserLocalPersistence);
  const tryDomains = String(username).includes("@")
    ? [null] // بريد كامل — كما هو
    : [USERNAME_DOMAIN, FALLBACK_DOMAIN]; // طالبة أولًا، ثم حساب المدير من البوابة
  let lastErr = null;
  for (const d of tryDomains) {
    const email = d ? usernameToEmail(username, d) : String(username).trim().toLowerCase();
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      lastErr = e;
      const code = e?.code || "";
      // نجرب النطاق التالي فقط عند خطأ «بيانات غير صحيحة» — غير ذلك نتوقف
      if (!["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(code)) throw e;
    }
  }
  throw lastErr;
}

export function logout() {
  return signOut(auth);
}

// تغيير كلمة مرور المستخدم الحالي
export function changeMyPassword(newPassword) {
  if (!auth.currentUser) return Promise.reject(new Error("لا توجد جلسة"));
  return updatePassword(auth.currentUser, newPassword);
}

// ---------------------------------------------------------------
// إدارة الطالبات (للمدير فقط — قواعد Firestore تتحقق)
// ---------------------------------------------------------------

export async function listStudents() {
  const snap = await getDocs(collection(db, "eduUsers"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// إنشاء حساب طالبة دون إخراج المدير من جلسته (نسخة Firebase ثانوية مؤقتة)
export async function createStudent({ username, displayName, password, avatar = "👧" }) {
  const email = usernameToEmail(username);
  const secondary = initializeApp(firebaseConfig, "edu-user-creation-" + Math.random().toString(36).slice(2));
  const secondaryAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await setDoc(doc(db, "eduUsers", cred.user.uid), {
      username: emailToUsername(email),
      displayName: displayName || username,
      role: "student",
      avatar,
      disabled: false,
      createdAt: serverTimestamp()
    });
    await signOut(secondaryAuth);
    return cred.user.uid;
  } finally {
    await deleteApp(secondary).catch(() => {});
  }
}

export function updateStudent(uid, data) {
  return updateDoc(doc(db, "eduUsers", uid), data);
}

export function deleteStudentProfile(uid) {
  // يحذف مستند eduUsers فقط — حساب Auth يبقى لكنه يفقد الدخول للموقع
  return deleteDoc(doc(db, "eduUsers", uid));
}

// ---------------------------------------------------------------
// جلسات المذاكرة ونتائج الاختبارات
// ---------------------------------------------------------------

export async function listAllSessions() {
  const snap = await getDocs(collection(db, "eduSessions"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listAllQuizzes() {
  const snap = await getDocs(collection(db, "eduQuizzes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function listMyQuizzes(uid) {
  const snap = await getDocs(query(collection(db, "eduQuizzes"), where("uid", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveQuizResult(session, result) {
  return addDoc(collection(db, "eduQuizzes"), {
    uid: session.user.uid,
    username: session.profile?.username || "",
    displayName: session.profile?.displayName || "",
    ts: serverTimestamp(),
    ...result
  });
}

// ---------------------------------------------------------------
// رسائل أخطاء عربية مفهومة
// ---------------------------------------------------------------

export function friendlyError(e) {
  const code = e?.code || "";
  const map = {
    "auth/invalid-credential": "اسم المستخدم أو كلمة المرور غير صحيحة",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/user-not-found": "اسم المستخدم غير موجود",
    "auth/user-disabled": "هذا الحساب معطّل",
    "auth/too-many-requests": "محاولات كثيرة — انتظري قليلًا ثم حاولي مجددًا",
    "auth/email-already-in-use": "اسم المستخدم مستخدم مسبقًا",
    "auth/weak-password": "كلمة المرور ضعيفة (6 أحرف على الأقل)",
    "auth/invalid-email": "اسم المستخدم يحتوي رموزًا غير مسموحة",
    "auth/network-request-failed": "تعذر الاتصال بالشبكة",
    "auth/requires-recent-login": "سجّلي الخروج ثم الدخول مرة أخرى وحاولي مجددًا",
    "permission-denied": "ليست لديك صلاحية لهذه العملية"
  };
  return map[code] || (e?.message || "حدث خطأ غير متوقع");
}
