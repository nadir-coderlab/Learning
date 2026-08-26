// محرك المهارات التكيفي — ذاكرة إتقان لكل حرف لكل طالبة (eduSkills/{uid})
//
// لكل حرف «صندوق إتقان» box من 0 إلى 5 (نظام لايتنر المبسط):
//   إجابة صحيحة → يرتفع درجة. إجابة خاطئة → يهبط درجتين ويُسجل الحرف
//   الذي اختارته بالخطأ (خريطة الخلط confuse) حتى نستهدفه في التمويهات.
// الحروف الضعيفة تُختار أكثر في الأسئلة والبطاقات، وتُعاد داخل نفس
// الاختبار بعد سؤالين حتى تترسخ.
import { db, doc, getDoc, setDoc, serverTimestamp } from "./auth.js";
import { LETTERS, shuffled } from "./letters.js";

export const MAX_BOX = 5;

// مجموعات الحروف المتشابهة شكلًا — تُستخدم تمويهات للمستويات الأعلى
const SIMILAR = [
  ["B", "D", "P", "Q", "R"],
  ["M", "N", "W"],
  ["U", "V", "W", "Y"],
  ["I", "L", "J", "T"],
  ["C", "E", "O", "G", "Q"],
  ["F", "E", "T"],
  ["A", "E", "H"],
  ["K", "X", "Y"],
  ["S", "Z", "C"],
  ["G", "J", "P"],
  ["H", "N", "M"]
];

export function similarTo(upper) {
  const set = new Set();
  SIMILAR.forEach((g) => { if (g.includes(upper)) g.forEach((x) => x !== upper && set.add(x)); });
  return [...set];
}

export async function openSkills(session) {
  const uid = session.user.uid;
  const ref = doc(db, "eduSkills", uid);
  let letters = {};
  // سلة التغطية: ترتيب عشوائي لبقية الحروف التي لم تظهر بعد في الاختبارات —
  // تضمن المرور على كل الحروف الـ26 قبل إعادة أي حرف، وبترتيب جديد كل دورة
  let bag = [];
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      letters = snap.data().letters || {};
      bag = Array.isArray(snap.data().bag) ? snap.data().bag : [];
    }
  } catch (e) { console.warn("تعذر تحميل المهارات:", e); }

  let saveTimer = null;
  function save(now = false) {
    clearTimeout(saveTimer);
    const doSave = () => setDoc(ref, {
      uid,
      username: session.profile?.username || "",
      displayName: session.profile?.displayName || "",
      letters,
      bag,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch((e) => console.warn("تعذر حفظ المهارات:", e));
    if (now) doSave(); else saveTimer = setTimeout(doSave, 2500);
  }
  window.addEventListener("pagehide", () => save(true));

  const entry = (U) => (letters[U] = letters[U] || { box: 0, seen: 0, ok: 0, no: 0, confuse: {} });

  const api = {
    letters,
    boxOf: (U) => letters[U]?.box || 0,

    // مشاهدة/استماع في التعلم أو البطاقات
    recordSeen(U) {
      const e = entry(U);
      e.seen++;
      save();
    },

    // إجابة سؤال: صح/خطأ + الحرف الذي اختارته بالخطأ إن وُجد
    recordAnswer(U, correct, chosenUpper = null) {
      const e = entry(U);
      e.seen++;
      if (correct) {
        e.ok++;
        e.box = Math.min(MAX_BOX, (e.box || 0) + 1);
      } else {
        e.no++;
        e.box = Math.max(0, (e.box || 0) - 2);
        if (chosenUpper && chosenUpper !== U) {
          e.confuse[chosenUpper] = (e.confuse[chosenUpper] || 0) + 1;
        }
      }
      save();
    },

    // متوسط الإتقان على كل الحروف الـ26 (غير المجرَّب = 0)
    avgBox() {
      return LETTERS.reduce((a, L) => a + (letters[L.u]?.box || 0), 0) / LETTERS.length;
    },

    // مستوى الصعوبة الحالي
    tier() {
      const avg = api.avgBox();
      if (avg < 1.3) return "beginner";
      if (avg < 3.2) return "mid";
      return "pro";
    },

    tierLabel() {
      return { beginner: "🌱 مبتدئة", mid: "😊 متوسطة", pro: "🏆 متقدمة" }[api.tier()];
    },

    // الحروف التي تحتاج تركيزًا (الأضعف أولًا)
    weakLetters(n = 5) {
      return [...LETTERS]
        .map((L) => ({ L, e: letters[L.u] }))
        .sort((a, b) =>
          ((a.e?.box || 0) - (b.e?.box || 0))
          || ((b.e?.no || 0) - (a.e?.no || 0))
          || ((a.e?.seen || 0) - (b.e?.seen || 0)))
        .slice(0, n)
        .map((x) => x.L);
    },

    // وزن اختيار الحرف في الأسئلة: الضعيف والمخطَأ فيه يظهر أكثر
    weightOf(U) {
      const e = letters[U];
      const box = e?.box || 0;
      let w = Math.pow(MAX_BOX + 1 - box, 2); // box0 → 36 … box5 → 1
      if (e && e.no > e.ok) w *= 1.6;         // أخطاؤه أكثر من صوابه
      if (!e || e.seen === 0) w *= 1.2;       // لم يُجرَّب بعد
      return w;
    },

    // سحب n حروف من سلة التغطية — كل الحروف تظهر قبل أن يتكرر أي حرف،
    // وعند فراغ السلة يعاد خلطها بترتيب عشوائي جديد
    drawCoverage(n) {
      const out = [];
      while (out.length < n) {
        if (!bag.length) {
          bag = shuffled(LETTERS.map((L) => L.u).filter((u) => !out.includes(u)));
        }
        out.push(bag.shift());
      }
      save();
      return out.map((u) => LETTERS.find((x) => x.u === u));
    },

    // اختيار n حروف بالأوزان (بلا تكرار)
    pickLetters(n) {
      const pool = [...LETTERS];
      const chosen = [];
      while (chosen.length < n && pool.length) {
        const total = pool.reduce((a, L) => a + api.weightOf(L.u), 0);
        let r = Math.random() * total;
        let idx = 0;
        for (let i = 0; i < pool.length; i++) {
          r -= api.weightOf(pool[i].u);
          if (r <= 0) { idx = i; break; }
        }
        chosen.push(pool.splice(idx, 1)[0]);
      }
      return chosen;
    },

    // تمويهات ذكية: خلطها السابق + المتشابه شكلًا ثم عشوائي
    distractorsFor(L, count = 3, smart = true) {
      const out = [];
      const used = new Set([L.u]);
      const add = (u) => {
        const cand = LETTERS.find((x) => x.u === u);
        if (cand && !used.has(u)) { out.push(cand); used.add(u); }
      };
      if (smart) {
        const conf = Object.entries(letters[L.u]?.confuse || {})
          .sort((a, b) => b[1] - a[1]).map(([u]) => u);
        conf.forEach((u) => out.length < count && add(u));
        shuffled(similarTo(L.u)).forEach((u) => out.length < count && add(u));
      }
      shuffled(LETTERS).forEach((x) => out.length < count && add(x.u));
      return out;
    },

    saveNow: () => save(true)
  };
  return api;
}
