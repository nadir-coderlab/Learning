// الحروف الإنجليزية الـ26: كبير/صغير + الاسم بالعربي + كلمة مثال مع إيموجي
export const LETTERS = [
  { u: "A", l: "a", name: "إيه",    word: "Apple",     ar: "تفاحة",     emoji: "🍎" },
  { u: "B", l: "b", name: "بي",     word: "Ball",      ar: "كرة",       emoji: "⚽" },
  { u: "C", l: "c", name: "سي",     word: "Cat",       ar: "قطة",       emoji: "🐱" },
  { u: "D", l: "d", name: "دي",     word: "Dog",       ar: "كلب",       emoji: "🐶" },
  { u: "E", l: "e", name: "إي",     word: "Egg",       ar: "بيضة",      emoji: "🥚" },
  { u: "F", l: "f", name: "إف",     word: "Fish",      ar: "سمكة",      emoji: "🐟" },
  { u: "G", l: "g", name: "جي",     word: "Grapes",    ar: "عنب",       emoji: "🍇" },
  { u: "H", l: "h", name: "إتش",    word: "House",     ar: "بيت",       emoji: "🏠" },
  { u: "I", l: "i", name: "آي",     word: "Ice cream", ar: "آيس كريم",  emoji: "🍦" },
  { u: "J", l: "j", name: "جيه",    word: "Juice",     ar: "عصير",      emoji: "🧃" },
  { u: "K", l: "k", name: "كيه",    word: "Key",       ar: "مفتاح",     emoji: "🔑" },
  { u: "L", l: "l", name: "إل",     word: "Lion",      ar: "أسد",       emoji: "🦁" },
  { u: "M", l: "m", name: "إم",     word: "Moon",      ar: "قمر",       emoji: "🌙" },
  { u: "N", l: "n", name: "إن",     word: "Nose",      ar: "أنف",       emoji: "👃" },
  { u: "O", l: "o", name: "أو",     word: "Orange",    ar: "برتقالة",   emoji: "🍊" },
  { u: "P", l: "p", name: "بي",     word: "Pizza",     ar: "بيتزا",     emoji: "🍕" },
  { u: "Q", l: "q", name: "كيو",    word: "Queen",     ar: "ملكة",      emoji: "👑" },
  { u: "R", l: "r", name: "آر",     word: "Rabbit",    ar: "أرنب",      emoji: "🐰" },
  { u: "S", l: "s", name: "إس",     word: "Sun",       ar: "شمس",       emoji: "☀️" },
  { u: "T", l: "t", name: "تي",     word: "Tree",      ar: "شجرة",      emoji: "🌳" },
  { u: "U", l: "u", name: "يو",     word: "Umbrella",  ar: "مظلة",      emoji: "☂️" },
  { u: "V", l: "v", name: "ڤي",     word: "Violin",    ar: "كمان",      emoji: "🎻" },
  { u: "W", l: "w", name: "دبليو",  word: "Watch",     ar: "ساعة",      emoji: "⌚" },
  { u: "X", l: "x", name: "إكس",    word: "Xylophone", ar: "إكسيليفون", emoji: "🎵" },
  { u: "Y", l: "y", name: "واي",    word: "Yo-yo",     ar: "يويو",      emoji: "🪀" },
  { u: "Z", l: "z", name: "زد",     word: "Zebra",     ar: "حمار وحشي", emoji: "🦓" }
];

export function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
