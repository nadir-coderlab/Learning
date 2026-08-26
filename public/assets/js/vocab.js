// كلمات البيت — أشياء موجودة في كل شقة، مقسمة بالغرف
export const ROOMS = [
  {
    id: "living", name: "الصالة", icon: "🛋️",
    words: [
      { en: "Sofa", ar: "كنب", emoji: "🛋️" },
      { en: "TV", ar: "تلفزيون", emoji: "📺" },
      { en: "Chair", ar: "كرسي", emoji: "🪑" },
      { en: "Lamp", ar: "لمبة", emoji: "💡" },
      { en: "Clock", ar: "ساعة الحائط", emoji: "🕰️" },
      { en: "Picture", ar: "لوحة", emoji: "🖼️" },
      { en: "Window", ar: "نافذة", emoji: "🪟" },
      { en: "Door", ar: "باب", emoji: "🚪" },
      { en: "Phone", ar: "جوال", emoji: "📱" },
      { en: "Key", ar: "مفتاح", emoji: "🔑" }
    ]
  },
  {
    id: "kitchen", name: "المطبخ", icon: "🍳",
    words: [
      { en: "Spoon", ar: "ملعقة", emoji: "🥄" },
      { en: "Fork", ar: "شوكة", emoji: "🍴" },
      { en: "Knife", ar: "سكين", emoji: "🔪" },
      { en: "Plate", ar: "صحن", emoji: "🍽️" },
      { en: "Cup", ar: "كوب", emoji: "☕" },
      { en: "Kettle", ar: "إبريق الشاهي", emoji: "🫖" },
      { en: "Bread", ar: "خبز", emoji: "🍞" },
      { en: "Milk", ar: "حليب", emoji: "🥛" },
      { en: "Egg", ar: "بيضة", emoji: "🥚" },
      { en: "Rice", ar: "رز", emoji: "🍚" },
      { en: "Salt", ar: "ملح", emoji: "🧂" },
      { en: "Banana", ar: "موزة", emoji: "🍌" }
    ]
  },
  {
    id: "bedroom", name: "غرفة البنات", icon: "🛏️",
    words: [
      { en: "Bed", ar: "سرير", emoji: "🛏️" },
      { en: "Teddy bear", ar: "دبدوب", emoji: "🧸" },
      { en: "Doll", ar: "دمية", emoji: "🪆" },
      { en: "Mirror", ar: "مرآة", emoji: "🪞" },
      { en: "Clock", ar: "منبه", emoji: "⏰" },
      { en: "Book", ar: "كتاب", emoji: "📖" },
      { en: "Bag", ar: "شنطة", emoji: "🎒" },
      { en: "Pen", ar: "قلم", emoji: "🖊️" },
      { en: "Crayon", ar: "لون شمعي", emoji: "🖍️" },
      { en: "Scissors", ar: "مقص", emoji: "✂️" }
    ]
  },
  {
    id: "bathroom", name: "الحمام", icon: "🛁",
    words: [
      { en: "Soap", ar: "صابون", emoji: "🧼" },
      { en: "Toothbrush", ar: "فرشاة أسنان", emoji: "🪥" },
      { en: "Shampoo", ar: "شامبو", emoji: "🧴" },
      { en: "Bathtub", ar: "بانيو", emoji: "🛁" },
      { en: "Toilet", ar: "مرحاض", emoji: "🚽" },
      { en: "Water", ar: "ماء", emoji: "💧" },
      { en: "Duck", ar: "بطة الحمام", emoji: "🦆" },
      { en: "Bubbles", ar: "فقاعات", emoji: "🫧" }
    ]
  }
];

export const ALL_WORDS = ROOMS.flatMap((r) => r.words.map((w) => ({ ...w, room: r.id, roomName: r.name })));

export function roomById(id) {
  return ROOMS.find((r) => r.id === id);
}
