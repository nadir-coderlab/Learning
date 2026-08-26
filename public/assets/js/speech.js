// النطق عبر Web Speech API — إنجليزي للحروف والكلمات، وعربي للتشجيع والشرح
let voices = [];
function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
loadVoices();
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;

function pickVoice(langPrefix) {
  if (!voices.length) loadVoices();
  const list = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix));
  return list.find((v) => /google|natural|premium/i.test(v.name)) || list[0] || null;
}

export function speechSupported() {
  return !!window.speechSynthesis;
}

export function speak(text, { rate = 0.75, pitch = 1.05, lang = "en-US" } = {}) {
  return new Promise((resolve) => {
    if (!speechSupported()) return resolve(false);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = pickVoice(lang.toLowerCase().startsWith("ar") ? "ar" : "en-us") || pickVoice(lang.slice(0, 2).toLowerCase());
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}

// تشجيع وشرح بالعربي
export function speakAr(text, { rate = 0.95, pitch = 1.05 } = {}) {
  return speak(text, { rate, pitch, lang: "ar-SA" });
}

// نطق صوت الحرف فقط — نستخدم الحرف الصغير دائمًا حتى لا يقول
// بعض المتصفحات "Capital A" مع الحرف الكبير
export function speakSound(letter, opts = {}) {
  return speak(letter.l, { rate: 0.6, ...opts });
}

// نطق الحرف ثم كلمة المثال فقط: "a … Apple" (بدون «A for»)
export async function speakLetter(letter) {
  await speakSound(letter);
  await new Promise((r) => setTimeout(r, 300));
  await speak(letter.word, { rate: 0.75 });
}
