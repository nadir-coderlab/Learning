// دروس الأصوات والمقاطع الإنجليزية (phonics) — القاعدة بالعربي + كلمات أمثلة
export const SOUNDS = [
  {
    id: "sh", label: "sh", arSound: "ش",
    rule: "حرفا s و h لما يجون مع بعض ينطقان صوت «ش»",
    words: [
      { en: "Ship", ar: "سفينة", emoji: "🚢" },
      { en: "Shoe", ar: "حذاء", emoji: "👟" },
      { en: "Sheep", ar: "خروف", emoji: "🐑" },
      { en: "Fish", ar: "سمكة", emoji: "🐟" },
      { en: "Shower", ar: "دش", emoji: "🚿" }
    ]
  },
  {
    id: "ch", label: "ch", arSound: "تش",
    rule: "حرفا c و h مع بعض ينطقان صوت «تش»",
    words: [
      { en: "Chair", ar: "كرسي", emoji: "🪑" },
      { en: "Cheese", ar: "جبن", emoji: "🧀" },
      { en: "Chicken", ar: "دجاجة", emoji: "🐔" },
      { en: "Chocolate", ar: "شوكولاتة", emoji: "🍫" },
      { en: "Peach", ar: "خوخ", emoji: "🍑" }
    ]
  },
  {
    id: "th", label: "th", arSound: "ث",
    rule: "حرفا t و h مع بعض ينطقان صوت «ث» (اللسان بين الأسنان)",
    words: [
      { en: "Three", ar: "ثلاثة", emoji: "3️⃣" },
      { en: "Teeth", ar: "أسنان", emoji: "🦷" },
      { en: "Bath", ar: "استحمام", emoji: "🛁" },
      { en: "Mouth", ar: "فم", emoji: "👄" },
      { en: "Thumb", ar: "إبهام", emoji: "👍" }
    ]
  },
  {
    id: "ph", label: "ph", arSound: "ف",
    rule: "حرفا p و h مع بعض ينطقان صوت «ف» مثل حرف f",
    words: [
      { en: "Phone", ar: "جوال", emoji: "📱" },
      { en: "Photo", ar: "صورة", emoji: "📸" },
      { en: "Dolphin", ar: "دولفين", emoji: "🐬" },
      { en: "Elephant", ar: "فيل", emoji: "🐘" }
    ]
  },
  {
    id: "wh", label: "wh", arSound: "و",
    rule: "حرفا w و h مع بعض ينطقان صوت «و»",
    words: [
      { en: "Whale", ar: "حوت", emoji: "🐋" },
      { en: "Wheel", ar: "عجلة", emoji: "🛞" },
      { en: "White", ar: "أبيض", emoji: "⬜" }
    ]
  },
  {
    id: "ck", label: "ck", arSound: "ك",
    rule: "حرفا c و k في آخر الكلمة ينطقان صوت «ك» واحد",
    words: [
      { en: "Duck", ar: "بطة", emoji: "🦆" },
      { en: "Sock", ar: "جورب", emoji: "🧦" },
      { en: "Clock", ar: "ساعة", emoji: "🕐" },
      { en: "Truck", ar: "شاحنة", emoji: "🚚" }
    ]
  },
  {
    id: "ee", label: "ee", arSound: "إي طويلة",
    rule: "حرفا e و e مع بعض ينطقان «إيـي» طويلة",
    words: [
      { en: "Bee", ar: "نحلة", emoji: "🐝" },
      { en: "Tree", ar: "شجرة", emoji: "🌳" },
      { en: "Green", ar: "أخضر", emoji: "🟢" },
      { en: "Sleep", ar: "نوم", emoji: "😴" }
    ]
  },
  {
    id: "oo", label: "oo", arSound: "و طويلة",
    rule: "حرفا o و o مع بعض ينطقان «أوو» طويلة",
    words: [
      { en: "Moon", ar: "قمر", emoji: "🌙" },
      { en: "Spoon", ar: "ملعقة", emoji: "🥄" },
      { en: "Zoo", ar: "حديقة حيوانات", emoji: "🦓" },
      { en: "Boot", ar: "جزمة", emoji: "🥾" }
    ]
  },
  {
    id: "c-hard", label: "c (ك)", arSound: "ك",
    rule: "حرف c غالبًا ينطق «ك» — مثل: cat, cup",
    words: [
      { en: "Cat", ar: "قطة", emoji: "🐱" },
      { en: "Cup", ar: "كوب", emoji: "☕" },
      { en: "Car", ar: "سيارة", emoji: "🚗" },
      { en: "Cake", ar: "كيكة", emoji: "🎂" }
    ]
  },
  {
    id: "c-soft", label: "c (س)", arSound: "س",
    rule: "حرف c قبل e أو i أو y ينطق «س» — مثل: ice, face",
    words: [
      { en: "Ice", ar: "ثلج", emoji: "🧊" },
      { en: "Rice", ar: "رز", emoji: "🍚" },
      { en: "Face", ar: "وجه", emoji: "🙂" },
      { en: "Pencil", ar: "قلم رصاص", emoji: "✏️" }
    ]
  }
];

export function soundById(id) {
  return SOUNDS.find((s) => s.id === id);
}
