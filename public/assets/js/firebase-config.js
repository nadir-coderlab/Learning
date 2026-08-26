// إعدادات الربط بمشروع Firebase — نفس مشروع بوابة الخدمات المساندة (supportive-med)
// الموقع منفصل تمامًا عن البوابة، لكنه يستفيد من نفس الربط والمصادقة.
export const firebaseConfig = {
  apiKey: "AIzaSyALwiyhiHRYmMZCNg7rCMAyjwyAdbet0XQ",
  authDomain: "supportive-med.firebaseapp.com",
  projectId: "supportive-med",
  storageBucket: "supportive-med.firebasestorage.app",
  messagingSenderId: "650172296223",
  appId: "1:650172296223:web:5918cde99da316799b792a",
  measurementId: "G-4258ECJQZF"
};

// حسابات الطالبات تُنشأ بنطاق مستقل حتى لا تتداخل أسماء المستخدمين
// مع حسابات موظفي بوابة الخدمات المساندة
export const USERNAME_DOMAIN = "edu.app";

// نطاق بوابة الخدمات المساندة — يسمح للمدير بالدخول هنا بنفس حسابه هناك
export const FALLBACK_DOMAIN = "supportive.app";

export function usernameToEmail(input, domain = USERNAME_DOMAIN) {
  const v = String(input || "").trim().toLowerCase();
  if (!v) return "";
  return v.includes("@") ? v : `${v}@${domain}`;
}

export function emailToUsername(email) {
  const v = String(email || "");
  for (const d of [USERNAME_DOMAIN, FALLBACK_DOMAIN]) {
    if (v.endsWith(`@${d}`)) return v.slice(0, -(d.length + 1));
  }
  return v;
}
