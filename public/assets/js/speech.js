// نطق الحروف والكلمات بالإنجليزية عبر Web Speech API — بلا ملفات صوتية
let voices = [];
function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
loadVoices();
if (window.speechSynthesis) speechSynthesis.onvoiceschanged = loadVoices;

function pickVoice() {
  if (!voices.length) loadVoices();
  const en = voices.filter((v) => /^en(-|_)/i.test(v.lang));
  // نفضّل أصوات Google/Natural الأمريكية ثم أي صوت إنجليزي
  return en.find((v) => /en(-|_)US/i.test(v.lang) && /google|natural|premium/i.test(v.name))
    || en.find((v) => /en(-|_)US/i.test(v.lang))
    || en[0]
    || null;
}

export function speechSupported() {
  return !!window.speechSynthesis;
}

export function speak(text, { rate = 0.75, pitch = 1.05 } = {}) {
  return new Promise((resolve) => {
    if (!speechSupported()) return resolve(false);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}

// نطق الحرف ثم كلمة المثال: "A … A for Apple"
export async function speakLetter(letter, { withWord = true } = {}) {
  await speak(letter.u, { rate: 0.6 });
  if (withWord) {
    await new Promise((r) => setTimeout(r, 350));
    await speak(`${letter.u} for ${letter.word}`, { rate: 0.75 });
  }
}
