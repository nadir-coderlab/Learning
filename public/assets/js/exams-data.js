// بيانات «مذاكرة الاختبارات»
//
// كل اختبار = أقسام بنفس ترتيب ورقة الأبلة، وكل قسم فيه دروس، وكل درس فيه عناصر (أسئلة محلولة).
// لكل عنصر: الإجابة + معناها بالعربي + طريقة نطقها بالحروف العربية + «حيلة» تساعد على الحفظ.
// ⚠️ الأسئلة والخيارات كلها من أوراق الاختبار نفسها فقط — لا نضيف أسئلة من برا (الهدف الحفظ).
//
// لإضافة اختبار جديد لأي بنت: أضف كائنًا جديدًا في EXAMS بنفس الشكل
// (والصور في /assets/img/exams/<مجلد الاختبار>/).

// رقم واتساب ولي الأمر (اختياري) بالصيغة الدولية بدون + أو أصفار — مثال: "9665XXXXXXXX".
// إذا بقي فارغًا: يفتح واتساب وتختار البنت «بابا» من جهات الاتصال.
export const PARENT_WHATSAPP = "";

const img = (n) => `/assets/img/exams/tg2/${n}.webp`;

export const MONTHS = [
  { en: "January", ar: "يناير", say: "جانيوري" },
  { en: "February", ar: "فبراير", say: "فيبرواري" },
  { en: "March", ar: "مارس", say: "مارتش" },
  { en: "April", ar: "أبريل", say: "إيبرِل" },
  { en: "May", ar: "مايو", say: "مَي" },
  { en: "June", ar: "يونيو", say: "جون" },
  { en: "July", ar: "يوليو", say: "جولاي" },
  { en: "August", ar: "أغسطس", say: "أوقَست" },
  { en: "September", ar: "سبتمبر", say: "سِبتمبر" },
  { en: "October", ar: "أكتوبر", say: "أكتوبر" },
  { en: "November", ar: "نوفمبر", say: "نوفمبر" },
  { en: "December", ar: "ديسمبر", say: "دِسمبر" }
];

// ======================================================================
// اختبار الإنجليزي — Top Goal 2 — الفترة الأولى (الصف الخامس)
// المصادر: A = نموذج ١ (وزارة)، C = نموذج ٢ (مدرستي)، B = ورقة مراجعة أ. تهاني
// ======================================================================

const TG2 = {
  id: "tg2-p1",
  title: "English — Top Goal 2",
  titleAr: "اختبار الإنجليزي — الفترة الأولى",
  unit: "Welcome!",
  grade: "الخامس الابتدائي",
  date: "2026-10-18",
  icon: "🎒",
  marks: 20,
  sources: {
    A: { name: "نموذج ١", full: "اختبار الفترة الأولى (وزارة التعليم) — من 20" },
    C: { name: "نموذج ٢", full: "First Period Exam (مدرستي) — التحريري من 10" },
    B: { name: "المراجعة", full: "ورقة المراجعة Welcome! — أ. تهاني" }
  },

  sections: [
    // ------------------------------------------------------------------
    {
      id: "general", n: "I", en: "General Questions", ar: "أسئلة عامة", icon: "💬", marks: 4,
      lessons: [{
        id: "gen", title: "وصّلي السؤال بالجواب", icon: "🔗",
        instr: { en: "A- Match the questions with the correct answers:", ar: "وصّلي كل سؤال بجوابه الصحيح", how: "اكتبي رقم السؤال جنب الجواب الصح" },
        rule: `شوفي <b>أول كلمة</b> في السؤال — هي تدلك على الجواب:<br>
          <b>Which month</b> ← اسم شهر 📅 مثل <b>September</b><br>
          <b>How many</b> ← رقم 🔢 مثل <b>3</b> أو <b>six</b><br>
          <b>How long</b> ← وقت ⏱️ مثل <b>minutes</b><br>
          <b>Who</b> ← اسم شخص 👦 مثل <b>Ali</b><br>
          <b>What do you use</b> ← الجواب يبدأ بـ <b>I use</b><br>
          ⭐ وأغلب الأجوبة تكرر <b>نفس كلمة السؤال</b>:<br><b>bedrooms · classes · birthday · tallest</b>`,
        rounds: ["choice", "write"],
        items: [
          {
            id: "g1", type: "qa", src: ["A"], emoji: "🔑🚪",
            q: "What do you use to unlock a door?", qAr: "وش تستخدمين عشان تفتحين الباب؟", qSay: "وَت دو يو يوز تو أنلوك أ دور؟",
            a: "I use a key.", aAr: "أستخدم مفتاح.", aSay: "آي يوز أ كي",
            qKey: "door", aKey: "key", blank: "key",
            trick: "في السؤال <b>door</b> 🚪 (باب) ← الجواب اللي فيه <b>key</b> 🔑 (مفتاح)"
          },
          {
            id: "g2", type: "qa", src: ["A", "C"], emoji: "⚽🎮",
            q: "What is your favorite interest?", qAr: "وش هوايتك المفضلة؟", qSay: "وَت إز يور فيفرِت إنترِست؟",
            a: "I like playing football.", aAr: "أحب ألعب كرة قدم.", aSay: "آي لايك بلايينق فوتبول",
            qKey: "interest", aKey: "playing", blank: "football",
            also: ["playing video games"], wrong: ["Yes, I like it."],
            cfmt: { opts: ["Yes, I like it.", "playing video games"], answer: "playing video games" },
            trick: "<b>interest</b> = هواية ← الجواب فيه <b>playing</b> (لعب) ⚽🎮<br>⚠️ لا تختارين <b>Yes</b>! السؤال يبدأ بـ What مو Do"
          },
          {
            id: "g3", type: "qa", src: ["A", "C"], emoji: "🇸🇦", dup: "natday",
            q: "Which month has the national day in Saudi Arabia?", qAr: "أي شهر فيه اليوم الوطني في السعودية؟", qSay: "وِتش مَنث هاز ذا ناشونال دَي إن ساودي أريبيا؟",
            a: "In September.", aAr: "في سبتمبر.", aSay: "إن سِبتمبر",
            qKey: "national day", aKey: "September", blank: "September",
            also: ["In September 23rd."], wrong: ["On Saturday."],
            cfmt: { opts: ["In September 23rd.", "On Saturday."], answer: "In September 23rd." },
            trick: "<b>national day</b> 🇸🇦 (اليوم الوطني) ← <b>September</b> سبتمبر (23 سبتمبر)<br>⚠️ <b>month</b> = شهر، و Saturday يوم مو شهر ❌"
          },
          {
            id: "g4", type: "qa", src: ["B"], emoji: "🇸🇦", dup: "natday",
            q: "In which month is the Saudi National Day holiday?", qAr: "في أي شهر إجازة اليوم الوطني السعودي؟", qSay: "إن وِتش مَنث إز ذا ساودي ناشونال دَي هوليدَي؟",
            a: "It is in September.", aAr: "هي في سبتمبر.", aSay: "إت إز إن سِبتمبر",
            qKey: "National Day", aKey: "September", blank: "September",
            trick: "نفس السؤال اللي قبله بشكل ثاني: <b>National Day</b> 🇸🇦 ← <b>September</b>"
          },
          {
            id: "g5", type: "qa", src: ["A"], emoji: "🛏️",
            q: "How many bedrooms in your house?", qAr: "كم غرفة نوم في بيتك؟", qSay: "هاو ميني بِدرومز إن يور هاوس؟",
            a: "There are 3 bedrooms.", aAr: "فيه 3 غرف نوم.", aSay: "ذير آر ثري بِدرومز",
            qKey: "bedrooms", aKey: "bedrooms", blank: "3", blankAccept: ["3", "three"],
            trick: "<b>How many</b> (كم عدد) ← الجواب فيه رقم <b>3</b> 🔢 + نفس الكلمة <b>bedrooms</b> 🛏️<br>📄 في الورقة ممكن تجي مكتوبة: There 3 bedrooms — نفس الجواب"
          },
          {
            id: "g6", type: "qa", src: ["B"], emoji: "🧍‍♂️",
            q: "Who is the tallest student in the class?", qAr: "مين أطول طالب في الفصل؟", qSay: "هو إز ذا تولِست ستيودِنت إن ذا كلاس؟",
            a: "I think Ali is the tallest student.", aAr: "أظن علي هو أطول طالب.", aSay: "آي ثِنك علي إز ذا تولِست ستيودِنت",
            qKey: "tallest", aKey: "tallest", blank: "Ali",
            trick: "<b>Who</b> (مين) ← اسم شخص: <b>Ali</b> 👦 + نفس الكلمة <b>tallest</b> تتكرر"
          },
          {
            id: "g7", type: "qa", src: ["B"], emoji: "⏱️🥪",
            q: "How long is the lunch break?", qAr: "كم مدة فسحة الغدا؟", qSay: "هاو لونق إز ذا لانش بريك؟",
            a: "About thirty minutes.", aAr: "تقريبًا ثلاثين دقيقة.", aSay: "أباوت ثيرتي مِنِتس",
            qKey: "How long", aKey: "minutes", blank: "minutes",
            trick: "<b>How long</b> (كم مدة) ← وقت ⏱️ <b>minutes</b> (دقائق)"
          },
          {
            id: "g8", type: "qa", src: ["B"], emoji: "➕",
            q: "What is one hundred thirty plus twenty?", qAr: "كم مية وثلاثين زائد عشرين؟", qSay: "وَت إز وَن هَندرد ثيرتي بلَس توينتي؟",
            a: "I think it's one hundred fifty.", aAr: "أظن إنها مية وخمسين.", aSay: "آي ثِنك إتس وَن هَندرد فِفتي",
            qKey: "plus", aKey: "one hundred fifty", blank: "fifty",
            trick: "<b>plus</b> ➕ (زائد) ← الجواب رقم:<br><span class=\"en\">130 + 20 = 150</span> = <b>one hundred fifty</b>"
          },
          {
            id: "g9", type: "qa", src: ["B"], emoji: "🎂",
            q: "Which month is your birthday in?", qAr: "في أي شهر عيد ميلادك؟", qSay: "وِتش مَنث إز يور بيرثدَي إن؟",
            a: "My birthday is in October.", aAr: "عيد ميلادي في أكتوبر.", aSay: "ماي بيرثدَي إز إن أكتوبر",
            qKey: "birthday", aKey: "birthday", blank: "October",
            trick: "<b>birthday</b> 🎂 في السؤال ← <b>My birthday</b> في الجواب (نفس الكلمة!)"
          },
          {
            id: "g10", type: "qa", src: ["B"], emoji: "🏫",
            q: "How many classes do you have on Tuesday?", qAr: "كم حصة عندك يوم الثلاثاء؟", qSay: "هاو ميني كلاسِز دو يو هاف أون تيوزدَي؟",
            a: "I have six classes on Tuesday.", aAr: "عندي ست حصص يوم الثلاثاء.", aSay: "آي هاف سِكس كلاسِز أون تيوزدَي",
            qKey: "classes", aKey: "classes", blank: "six", blankAccept: ["six", "6"],
            trick: "<b>How many</b> ← رقم <b>six</b> (6) + نفس الكلمات <b>classes</b> و <b>Tuesday</b> تتكرر"
          }
        ]
      }]
    },

    // ------------------------------------------------------------------
    {
      id: "writing", n: "II", en: "Controlled Writing", ar: "الكتابة الموجهة", icon: "✍️", marks: 2,
      lessons: [
        {
          id: "order", title: "رتّبي الجملة", icon: "🔀",
          instr: { en: "A. Rearrange the words to form sentences:", ar: "رتّبي الكلمات وكوّني جملة", how: "انسخي الجملة مرتبة على السطر" },
          rule: `١) ابدئي بالكلمة اللي <b>أولها حرف كبير</b>:<br><b>We · His · How · My · This</b><br>
            ٢) الكلمة اللي معها علامة <b>?</b> تجي <b>آخر شي</b><br>
            ٣) احفظي كل جملة مثل الأغنية 🎵 — قطعة قطعة`,
          rounds: ["choice", "build", "write"],
          items: [
            {
              id: "o1", type: "order", src: ["A"],
              words: ["weekend", "go", "shopping", "this", "will", "We"],
              target: ["We", "will", "go", "shopping", "this", "weekend"], end: ".",
              ar: "راح نروح نتسوق هالويكند.", say: "وي ويل قو شوبِنق ذِس ويكِند",
              chunks: ["We will", "go shopping", "this weekend."],
              trick: "<b>We</b> (حرفها كبير) أول ← <b>will</b> ← <b>go shopping</b> ← <b>this weekend</b> 🛍️"
            },
            {
              id: "o2", type: "order", src: ["A"],
              words: ["His", "not", "tidy", "room", "is"],
              target: ["His", "room", "is", "not", "tidy"], end: ".",
              ar: "غرفته مو مرتبة.", say: "هِز روم إز نوت تايدي",
              chunks: ["His room", "is not", "tidy."],
              trick: "<b>His room</b> (غرفته) ← <b>is not</b> (مو) ← <b>tidy</b> (مرتبة) 🧹"
            },
            {
              id: "o3", type: "order", src: ["B"],
              words: ["long", "was", "your vacation?", "How"],
              target: ["How", "long", "was", "your vacation?"], end: "",
              ar: "كم كانت مدة إجازتك؟", say: "هاو لونق وَز يور فيكيشِن؟",
              chunks: ["How long", "was", "your vacation?"],
              trick: "<b>How</b> (حرف كبير) أول ← <b>long</b> ← <b>was</b> ← <b>your vacation?</b> (فيها ؟ ← آخر شي)"
            },
            {
              id: "o4", type: "order", src: ["B"],
              words: ["December", "My favourite", "is", "month"],
              target: ["My favourite", "month", "is", "December"], end: ".",
              ar: "شهري المفضل هو ديسمبر.", say: "ماي فيفرِت مَنث إز دِسمبر",
              chunks: ["My favourite month", "is", "December."],
              trick: "<b>My favourite month</b> (شهري المفضل) ← <b>is</b> ← <b>December</b><br>⚠️ December حرفها كبير لأنها اسم شهر، بس تجي آخر الجملة"
            },
            {
              id: "o5", type: "order", src: ["B"],
              words: ["the biggest", "is", "This", "classroom"],
              target: ["This", "is", "the biggest", "classroom"], end: ".",
              ar: "هذا أكبر فصل.", say: "ذِس إز ذا بِقِست كلاسروم",
              chunks: ["This is", "the biggest", "classroom."],
              trick: "<b>This is</b> (هذا) ← <b>the biggest</b> (الأكبر) ← <b>classroom</b> (فصل) 🏫"
            }
          ]
        },
        {
          id: "months", title: "الشهور بالترتيب", icon: "📅",
          instr: { en: "Write the months of the year in the correct order.", ar: "اكتبي شهور السنة بالترتيب — و (Rearrange) يعني رتّبي", how: "كمّلي الشهر الناقص حسب رقمه" },
          rule: `الشهور بالإنجليزي <b>نفس أسماء الشهور الميلادية بالعربي</b>!<br>
            شوفي الجدول تحت واسمعيها بالترتيب 🔊<br>
            الشهور اللي تجي ناقصة في الورقة:<br>
            3 <b>March</b> مارس · 4 <b>April</b> أبريل<br>
            6 <b>June</b> يونيو · 8 <b>August</b> أغسطس<br>
            11 <b>November</b> نوفمبر`,
          rounds: ["choice", "write"],
          showMonths: true,
          box: ["August", "November", "March", "June", "April"],
          items: [
            { id: "mo1", type: "month", src: ["B", "C"], m: 3, trick: "<b>March</b> = مارس — نفس الاسم بالعربي! تبدأ بـ M" },
            { id: "mo2", type: "month", src: ["B", "C"], m: 4, trick: "<b>April</b> = أبريل — نفس الاسم! تبدأ بـ A" },
            { id: "mo3", type: "month", src: ["B"], m: 6, trick: "<b>June</b> = يونيو — تنقرأ «جون»، 4 حروف بس" },
            { id: "mo4", type: "month", src: ["B"], m: 8, trick: "<b>August</b> = أغسطس — تبدأ بـ Au" },
            { id: "mo5", type: "month", src: ["B"], m: 11, trick: "<b>November</b> = نوفمبر — نفس الاسم بالعربي!" },
            {
              id: "mo6", type: "monthOrder", src: ["C"],
              given: ["April", "March", "February", "January"],
              target: ["January", "February", "March", "April"],
              trick: "(Rearrange) = رتّبي. ابدئي بأول شهر في السنة <b>January</b> ← February ← March ← April"
            }
          ]
        },
        {
          id: "opp", title: "العكس و un", icon: "↔️",
          instr: { en: "B- Write the opposite of the following words:", ar: "اكتبي عكس الكلمات — و (Rewrite the words using un) = حطي un في أول الكلمة", how: "اكتبي الكلمة الجديدة على السطر" },
          rule: `<b>opposite</b> = العكس:<br>
            <b>early</b> بدري ↔ <b>late</b> متأخر ⏰<br>
            <b>difficult</b> صعب ↔ <b>easy</b> سهل<br>
            <b>small</b> صغير ↔ <b>big</b> كبير<br>
            <b>un</b> في أول الكلمة تقلب معناها:<br>
            <b>lucky → unlucky</b><br><b>clean → unclean</b>`,
          rounds: ["choice", "write"],
          items: [
            { id: "op1", type: "pair", kind: "opp", src: ["B"], w: "early", wAr: "بدري", a: "late", aAr: "متأخر", aSay: "ليت", trick: "<b>early</b> ☀️ بدري ↔ <b>late</b> 🌙 متأخر — late قصيرة: l-a-t-e" },
            { id: "op2", type: "pair", kind: "opp", src: ["B"], w: "difficult", wAr: "صعب", a: "easy", aAr: "سهل", aSay: "إيزي", trick: "<b>difficult</b> كلمة طويلة وصعبة 😣 ↔ <b>easy</b> قصيرة وسهلة 😊" },
            { id: "op3", type: "pair", kind: "opp", src: ["B"], w: "small", wAr: "صغير", a: "big", aAr: "كبير", aSay: "بِق", accept: ["big", "large"], trick: "<b>small</b> 🐭 ↔ <b>big</b> 🐘 — big ثلاث حروف بس: b-i-g" },
            { id: "un1", type: "pair", kind: "un", src: ["C"], w: "lucky", wAr: "محظوظ", a: "unlucky", aAr: "مو محظوظ", aSay: "أنلَكي", trick: "<b>un</b> + lucky = <b>unlucky</b> — انسخي الكلمة وحطي un قبلها" },
            { id: "un2", type: "pair", kind: "un", src: ["C"], w: "clean", wAr: "نظيف", a: "unclean", aAr: "مو نظيف", aSay: "أنكلين", trick: "<b>un</b> + clean = <b>unclean</b>" }
          ]
        },
        {
          id: "past", title: "جدول الماضي", icon: "📋",
          instr: { en: "Complete the chart. (Verb — Past form)", ar: "كمّلي الجدول: الفعل ← الماضي حقه", how: "اكتبي الكلمة الناقصة في المربع الفاضي" },
          rule: `هالأفعال <b>يتغير شكلها</b> في الماضي — احفظيها مثل الأغنية 🎵<br>
            <b>buy → bought</b><br>
            <b>go → went</b><br>
            <b>wake up → woke up</b><br>
            <b>take → took</b><br>
            <b>make → made</b><br>
            <b>is/am/are → was/were</b><br>
            ⚠️ الجدول أحيانًا يعطيك الماضي ويبي الفعل: <b>went</b> ← <b>go</b>`,
          rounds: ["choice", "write"],
          items: [
            { id: "p1", type: "pair", kind: "past", dir: "fwd", src: ["B"], w: "buy", wAr: "يشتري", a: "bought", aAr: "اشترى", aSay: "بوت", trick: "buy ← <b>bought</b> (تتغير كلها) — تذكري: b...ought" },
            { id: "p2", type: "pair", kind: "past", dir: "rev", src: ["B"], w: "went", wAr: "راح", a: "go", aAr: "يروح", aSay: "قو", trick: "<b>went</b> هي ماضي <b>go</b> (يروح) — go ← went" },
            { id: "p3", type: "pair", kind: "past", dir: "fwd", src: ["B"], w: "wake up", wAr: "يصحى", a: "woke up", aAr: "صحى", aSay: "ووك أب", accept: ["woke up", "woke"], trick: "wake up ← <b>woke up</b>: حرف a يصير o" },
            { id: "p4", type: "pair", kind: "past", dir: "fwd", src: ["B"], w: "take", wAr: "ياخذ", a: "took", aAr: "أخذ", aSay: "توك", trick: "take ← <b>took</b>: نفس بداية t — و ook" },
            { id: "p5", type: "pair", kind: "past", dir: "rev", src: ["B"], w: "made", wAr: "سوّى", a: "make", aAr: "يسوي", aSay: "ميك", trick: "<b>made</b> هي ماضي <b>make</b> — بس d صارت k" },
            { id: "p6", type: "pair", kind: "past", dir: "rev", src: ["B"], w: "was/were", wAr: "كان/كانوا", a: "is/am/are", aAr: "يكون", aSay: "إز / آم / آر", accept: ["is/am/are", "is am are", "be", "is", "am", "are", "am/is/are", "is / am / are"], trick: "<b>was</b> ← is و am · <b>were</b> ← are — اكتبي: is/am/are" }
          ]
        }
      ]
    },

    // ------------------------------------------------------------------
    {
      id: "reading", n: "III", en: "Reading", ar: "القراءة", icon: "📖", marks: 4,
      lessons: [
        {
          id: "tf", title: "صح أو خطأ ✓ ✗", icon: "✅",
          instr: { en: "A. Read and choose True or False.", ar: "اقري واختاري صح ✓ أو خطأ ✗", how: "حوطي ✓ أو ✗ تحت كل جملة" },
          rule: `١) شوفي <b>الصورة</b> أول 👀<br>
            ٢) دوري <b>الكلمة المهمة</b> في الجملة (الملونة)<br>
            ٣) إذا الكلمة تطابق الصورة ← <b>✓ صح</b> · إذا ما تطابق ← <b>✗ خطأ</b>`,
          rounds: ["choice", "again"],
          items: [
            { id: "t1", type: "tf", src: ["A"], pic: img("origami"), s: "Origami is an art of making soaps.", sAr: "الأوريغامي فن صناعة الصابون.", say: "أوريقامي إز أن آرت أوف ميكِنق سوبس", key: "soaps", keyAr: "صابون", answer: false, why: "Origami = فن <b>طي الورق</b> 📄🦢 مو صابون 🧼" },
            { id: "t2", type: "tf", src: ["A"], pic: img("cal7"), s: "There are 7 months in the year.", sAr: "فيه 7 شهور في السنة.", say: "ذير آر سِفِن مَنثس إن ذا يير", key: "7 months", keyAr: "7 شهور", answer: false, why: "السنة فيها <b>12</b> شهر مو 7 ← ✗" },
            { id: "t3", type: "tf", src: ["A"], pic: img("messy"), s: "He is messy.", sAr: "هو فوضوي (موسّخ).", say: "هي إز مِسي", key: "messy", keyAr: "فوضوي / موسّخ", answer: true, why: "<b>messy</b> = فوضوي موسّخ 🤪 والصورة ولد موسّخ ← ✓" },
            { id: "t4", type: "tf", src: ["A"], pic: img("architect"), s: "An architect is a doctor.", sAr: "المهندس المعماري دكتور.", say: "أن آركِتِكت إز أ دوكتر", key: "doctor", keyAr: "دكتور", answer: false, why: "<b>architect</b> = مهندس معماري 👷📐 (معه خوذة ومخطط) مو دكتور 👨‍⚕️" },
            { id: "t5", type: "tf", src: ["C"], pic: img("n122"), s: "One hundred twenty two.", sAr: "مية واثنين وعشرين.", say: "وَن هَندرد توينتي تو", key: "One hundred twenty two", keyAr: "مية واثنين وعشرين (122)", answer: true, why: "one hundred = 100 · twenty two = 22 ← <b>122</b> ✓<br>📄 في الورقة مكتوبة On hundred (غلطة طباعة) — نفس الشي" },
            { id: "t6", type: "tf", src: ["C"], pic: img("exercise"), s: "I do exercise.", sAr: "أنا أتمرّن.", say: "آي دو إكسِرسايز", key: "exercise", keyAr: "تمارين رياضة", answer: true, why: "<b>exercise</b> = تمارين 🤸 والولد يتمرّن ← ✓" },
            { id: "t7", type: "tf", src: ["C"], pic: img("sleep"), s: "I'll dance down here!", sAr: "راح أرقص هنا!", say: "آيل دانس داون هير", key: "dance", keyAr: "يرقص", answer: false, why: "<b>dance</b> = يرقص 💃 — والولد <b>نايم</b> 😴 ← ✗" }
          ]
        },
        {
          id: "pics", title: "الجملة والصورة", icon: "🖼️",
          instr: { en: "Read the sentences then match them with the correct pictures.", ar: "اقري الجملتين واختاري اللي توصف الصورة — و (Read and complete) = كمّلي من المربع", how: "اختاري a أو b — وانسخي الكلمة من المربع" },
          rule: `الجملتين <b>يختلفون في كلمة وحدة بس</b>! دوري عليها وطابقيها مع الصورة 👀<br>
            <b>tall</b> طويل · <b>tired</b> تعبان 🥱<br>
            <b>hundred</b> = 100 · <b>thousand</b> = 1000<br>
            ملك الغابة ← <b>lion</b> 🦁<br>
            يمشي ببطء ← <b>snail</b> 🐌<br>
            يقرأ ← <b>comic book</b> 📖<br>
            حفلة ← <b>calendar</b> 📅`,
          rounds: ["choice", "write"],
          items: [
            { id: "s1", type: "pick2", src: ["B"], pic: img("tired"), opts: ["He is a tall boy.", "He is a tired boy."], answer: 1, key: "tired", other: "tall", keyAr: "تعبان / نعسان", say: "هي إز أ تايرد بوي", trick: "الولد <b>نعسان</b> 🥱 = <b>tired</b> — انتبهي: tall (طويل) و tired يبدون بنفس الحرف t" },
            { id: "s2", type: "pick2", src: ["B"], pic: img("thousand"), opts: ["It is one hundred.", "It is one thousand."], answer: 1, key: "thousand", other: "hundred", keyAr: "ألف", say: "إت إز وَن ثاوزَند", trick: "1000 فيها <b>3 أصفار</b> = <b>thousand</b> (ألف) · hundred = 100 (صفرين)" },
            { id: "s3", type: "pick2", src: ["B"], pic: img("mountain"), opts: ["It is a rainbow.", "It is a mountain."], answer: 1, key: "mountain", other: "rainbow", keyAr: "جبل", say: "إت إز أ ماونتِن", trick: "<b>mountain</b> ⛰️ = جبل · rainbow 🌈 = قوس قزح" },
            { id: "s4", type: "pick2", src: ["B"], pic: img("festival"), opts: ["They go to food festival.", "They go to school."], answer: 0, key: "food festival", other: "school", keyAr: "مهرجان أكل", say: "ذَي قو تو فود فِستِفال", trick: "أكل 🍔 وخيام ملونة = <b>food festival</b> (مهرجان أكل) مو مدرسة" },
            { id: "c1", type: "complete", src: ["B"], pic: img("lion-b"), s: "It is the king of the jungle.", sAr: "هو ملك الغابة.", say: "إت إز ذا كِنق أوف ذا جَنقل", answer: "lion", ansAr: "أسد", trick: "<b>king</b> = ملك 👑 ← ملك الغابة هو <b>lion</b> 🦁" },
            { id: "c2", type: "complete", src: ["B"], pic: img("comic"), s: "He likes to read a ___.", sAr: "يحب يقرأ ...", say: "هي لايكس تو ريد أ كومِك بوك", answer: "comic book", ansAr: "مجلة قصص مصورة", trick: "<b>read</b> = يقرأ 📖 ← <b>comic book</b> (قصة مصورة)" },
            { id: "c3", type: "complete", src: ["B"], pic: img("snail"), s: "It moves slowly.", sAr: "يمشي ببطء.", say: "إت موفز سلولي", answer: "snail", ansAr: "حلزون", trick: "<b>slowly</b> = ببطء 🐌 ← <b>snail</b> الحلزون" },
            { id: "c4", type: "complete", src: ["B"], pic: img("calendar"), s: "I marked my party on the ___.", sAr: "حددت حفلتي على ...", say: "آي ماركت ماي بارتي أون ذا كالِندر", answer: "calendar", ansAr: "التقويم", trick: "<b>party</b> حفلة 🎉 تنكتب على <b>calendar</b> 📅 (التقويم)" }
          ]
        }
      ]
    },

    // ------------------------------------------------------------------
    {
      id: "grammar", n: "IV", en: "Grammar", ar: "القواعد", icon: "🧩", marks: 4,
      lessons: [
        {
          id: "how", title: "How many / How long", icon: "🔢",
          instr: { en: "A- Choose the correct answer:", ar: "اختاري الإجابة الصحيحة", how: "حوطي الكلمة الصحيحة اللي بين القوسين" },
          rule: `شوفي الكلمة اللي <b>بعد الفراغ</b>:<br>
            كلمة جمع تنتهي بـ <b>s</b> مثل <b>students</b> و <b>classes</b><br>← <b>How many</b> 🔢 (كم عدد)<br>
            بعدها <b>is</b> أو <b>was</b> + وقت مثل <b>break</b> و <b>vacation</b><br>← <b>How long</b> ⏱️ (كم مدة)`,
          rounds: ["choice", "write"],
          items: [
            { id: "h1", type: "choose", rule: "long", src: ["B"], s: "___ is the lunch break?", opts: ["How many", "How long"], answer: "How long", clue: "is the lunch break", ar: "كم مدة فسحة الغدا؟", say: "هاو لونق إز ذا لانش بريك؟", trick: "بعدها <b>is</b> + break (فسحة = وقت ⏱️) ← <b>How long</b>" },
            { id: "h2", type: "choose", rule: "many", src: ["B", "C"], s: "___ students are in your class?", opts: ["How many", "How long"], answer: "How many", clue: "students", ar: "كم طالب في فصلك؟", say: "هاو ميني ستيودِنتس آر إن يور كلاس؟", trick: "<b>students</b> (جمع ينعد 👧👧👧) ← <b>How many</b>" },
            { id: "h3", type: "choose", rule: "long", src: ["B"], s: "___ was your vacation?", opts: ["How many", "How long"], answer: "How long", clue: "was your vacation", ar: "كم كانت مدة إجازتك؟", say: "هاو لونق وَز يور فيكيشِن؟", trick: "بعدها <b>was</b> + vacation (إجازة = وقت) ← <b>How long</b>" },
            { id: "h4", type: "choose", rule: "many", src: ["B"], s: "___ classes do you have on Sunday?", opts: ["How many", "How long"], answer: "How many", clue: "classes", ar: "كم حصة عندك يوم الأحد؟", say: "هاو ميني كلاسِز دو يو هاف أون سَندَي؟", trick: "<b>classes</b> (حصص تنعد) ← <b>How many</b>" }
          ]
        },
        {
          id: "time", title: "الماضي والمستقبل", icon: "⏳",
          instr: { en: "Choose the correct word:", ar: "اختاري الكلمة الصحيحة", how: "حوطي الكلمة الصحيحة" },
          rule: `دوري <b>كلمة الوقت</b> في الجملة:<br>
            <b>yesterday</b> (أمس) أو <b>last</b> (الماضي) ← فعل ماضي:<br>
            <b>cooked · painted · ate · met · did</b><br>
            <b>now</b> (الحين) أو <b>is ringing</b> ← <b>will</b> (راح)`,
          rounds: ["choice", "write"],
          items: [
            { id: "tm1", type: "choose", rule: "past", src: ["A"], s: "Last week I ___ my favourite dishes.", opts: ["cook", "cooked"], answer: "cooked", clue: "Last week", ar: "الأسبوع الماضي طبخت أطباقي المفضلة.", say: "لاست ويك آي كُكت ماي فيفرِت دِشِز", trick: "<b>Last week</b> = الأسبوع الماضي ← ماضي ← <b>cooked</b> (تنتهي بـ ed)" },
            { id: "tm2", type: "choose", rule: "will", src: ["A"], s: "The phone is ringing. I ___ answer it.", opts: ["will", "had"], answer: "will", clue: "is ringing", ar: "الجوال يرن. راح أرد عليه.", say: "ذا فون إز رِنقِنق. آي ويل آنسر إت", trick: "الجوال <b>يرن الحين</b> 📱 ← <b>will</b> (راح أرد)" },
            { id: "tm3", type: "choose", rule: "past", src: ["A"], s: "What ___ your mom do last night?", opts: ["do", "did"], answer: "did", clue: "last night", ar: "وش سوّت أمك البارحة؟", say: "وَت دِد يور مام دو لاست نايت؟", trick: "<b>last night</b> = البارحة ← ماضي ← <b>did</b>" },
            { id: "tm4", type: "choose", rule: "past", src: ["B"], s: "I ___ fruit with yogurt yesterday.", opts: ["eat", "ate", "eating"], answer: "ate", clue: "yesterday", ar: "أكلت فواكه مع زبادي أمس.", say: "آي إيت فروت وِذ يوقَرت يِسترديه", trick: "<b>yesterday</b> = أمس ← ماضي eat هو <b>ate</b>" },
            { id: "tm5", type: "choose", rule: "past", src: ["B"], s: "They ___ their friends last weekend.", opts: ["met", "meet", "meeting"], answer: "met", clue: "last weekend", ar: "قابلوا أصحابهم الويكند الماضي.", say: "ذَي مِت ذير فرِندز لاست ويكِند", trick: "<b>last weekend</b> ← ماضي meet هو <b>met</b> (قصيرة)" },
            { id: "tm6", type: "choose", rule: "past", src: ["C"], s: "She ___ an amazing landscape yesterday.", opts: ["paints", "painted", "painting"], answer: "painted", clue: "yesterday", ar: "رسمت منظر طبيعي رائع أمس.", say: "شي بَينتِد أن أميزِنق لاندسكيب يِسترديه", trick: "<b>yesterday</b> ← ماضي ← <b>painted</b> (تنتهي بـ ed)" },
            { id: "tm7", type: "choose", rule: "will", src: ["C"], s: "I ___ call her now.", opts: ["will", "going to", "am"], answer: "will", clue: "now", ar: "راح أتصل عليها الحين.", say: "آي ويل كول هير ناو", trick: "<b>I ___ call</b>: بعد الفراغ فعل مباشرة ← <b>will</b><br>(going to تبي am قبلها، و am ما تجي قبل call)" }
          ]
        },
        {
          id: "compare", title: "المقارنة er / est", icon: "📏",
          instr: { en: "Choose the correct answer:", ar: "اختاري الإجابة الصحيحة", how: "حوطي الكلمة الصحيحة" },
          rule: `<b>than</b> (من) ← نقارن بين اثنين ← <b>er</b>:<br><b>taller than</b><br>
            <b>the</b> قبل الفراغ ← الأكثر من الكل ← <b>est</b> أو <b>most</b>:<br><b>the tallest · the most difficult</b>`,
          rounds: ["choice", "write"],
          items: [
            { id: "cp1", type: "choose", rule: "than", src: ["A"], s: "Huda is ___ than Rana.", opts: ["taller", "tallest"], answer: "taller", clue: "than", ar: "هدى أطول من رنا.", say: "هُدى إز تولَر ذان رنا", trick: "شفتي <b>than</b>؟ ← <b>er</b> ← <b>taller</b>" },
            { id: "cp2", type: "choose", rule: "the", src: ["B"], s: "He is the ___ student.", opts: ["tall", "taller", "tallest"], answer: "tallest", clue: "the", ar: "هو أطول طالب.", say: "هي إز ذا تولِست ستيودِنت", trick: "شفتي <b>the</b> قبل الفراغ؟ ← <b>est</b> ← <b>tallest</b>" },
            { id: "cp3", type: "choose", rule: "the", src: ["B"], s: "This is the ___ class for me.", opts: ["difficult", "more difficult", "most difficult"], answer: "most difficult", clue: "the", ar: "هذي أصعب حصة عندي.", say: "ذِس إز ذا موست دِفِكلت كلاس فور مي", trick: "<b>the</b> + كلمة طويلة ← <b>most</b> ← <b>most difficult</b>" }
          ]
        }
      ]
    },

    // ------------------------------------------------------------------
    {
      id: "vocab", n: "V", en: "Vocabulary", ar: "المفردات", icon: "🖼️", marks: 4,
      lessons: [
        {
          id: "voc1", title: "اكتبي الكلمة تحت الصورة", icon: "✍️",
          instr: { en: "B- Write the words under the correct pictures:", ar: "اكتبي الكلمات تحت الصور الصحيحة", how: "انسخي الكلمة من المربع تحت صورتها" },
          rule: `في الاختبار <b>الكلمات مكتوبة لك في المربع</b> 📦 — بس لازم تعرفين أي كلمة لأي صورة!<br>
            احفظي <b>الصورة + أول حرف</b> من كل كلمة 👀`,
          rounds: ["choice", "write"],
          items: [
            { id: "v1", type: "word", src: ["A"], pic: img("ride"), w: "ride", ar: "لعبة / ركوب", say: "رايد", trick: "<b>ride</b> = نركب 🎠 — اللعبة الدوارة اللي نركبها" },
            { id: "v2", type: "word", src: ["A"], pic: img("snail-a"), w: "snail", ar: "حلزون", say: "سنيل", trick: "<b>snail</b> 🐌 — حرف <b>S</b> ملتوي مثل صدفة الحلزون" },
            { id: "v3", type: "word", src: ["A"], pic: img("layout"), w: "layout", ar: "مخطط البيت", say: "لَي آوت", trick: "<b>layout</b> = مخطط / خريطة البيت 🏠📐 (الرسمة اللي فيها غرف)" },
            { id: "v4", type: "word", src: ["A"], pic: img("gate-a"), w: "Gate", ar: "بوابة", say: "قَيت", trick: "<b>Gate</b> = بوابة 🚪 — تبدأ بـ <b>G</b> · لا تخلطينها مع Date" },
            { id: "v5", type: "word", src: ["B"], pic: img("date"), w: "date", ar: "تاريخ", say: "دَيت", trick: "<b>date</b> = تاريخ 📅 (April 6) — تبدأ بـ <b>d</b>" },
            { id: "v6", type: "word", src: ["B"], pic: img("classroom"), w: "classroom", ar: "فصل", say: "كلاسروم", trick: "<b>class</b> + <b>room</b> = غرفة الفصل 🏫 (سبورة وطاولات)" },
            { id: "v7", type: "word", src: ["B"], pic: img("months"), w: "months", ar: "شهور", say: "مَنثس", trick: "أسماء الشهور كلها (January, February...) ← <b>months</b>" },
            { id: "v8", type: "word", src: ["B"], pic: img("late"), w: "late", ar: "متأخر", say: "ليت", trick: "الولد يركض لأنه <b>متأخر</b> 🏃⏰ ← <b>late</b>" },
            { id: "v9", type: "word", src: ["B"], pic: img("plus"), w: "plus", ar: "زائد", say: "بلَس", trick: "علامة <b>+</b> = <b>plus</b> (زائد)" }
          ]
        },
        {
          id: "voc2", title: "اختاري الكلمة الصحيحة", icon: "👆",
          instr: { en: "Choose the correct word:", ar: "اختاري الكلمة الصحيحة للصورة", how: "تحت كل صورة كلمتين — حوطي الصح" },
          rule: `تحت كل صورة <b>كلمتين</b> — وحدة صح ووحدة غلط.<br>
            احفظي الصورة مع كلمتها 👀 — في الاختبار نفس الصور!`,
          rounds: ["choice", "write"],
          items: [
            { id: "w1", type: "word", src: ["C"], pic: img("lion"), w: "Lion", alt: "Horse", ar: "أسد", say: "لايَن", trick: "<b>Lion</b> 🦁 أسد · Horse 🐴 = حصان" },
            { id: "w2", type: "word", src: ["C"], pic: img("rainbow-c"), w: "Rainbow", alt: "Snow", ar: "قوس قزح", say: "رَين بو", trick: "<b>Rainbow</b> 🌈 = rain (مطر) + bow (قوس) · Snow ❄️ = ثلج" },
            { id: "w3", type: "word", src: ["C"], pic: img("horrible"), w: "horrible", alt: "tidy", ar: "مرعب / فظيع", say: "هورِبل", trick: "<b>horrible</b> 👹 مرعب — الصورة وحش مخيف · tidy = مرتب" },
            { id: "w4", type: "word", src: ["C"], pic: img("reporter"), w: "reporter", alt: "doctor", ar: "مراسل / مذيع", say: "ريبورتر", trick: "<b>reporter</b> 🎤 معه مايك = مراسل · doctor = دكتور" },
            { id: "w5", type: "word", src: ["C"], pic: img("screen"), w: "screen", alt: "entrance", ar: "شاشة", say: "سكرين", trick: "<b>screen</b> 📺 = شاشة · entrance = مدخل" },
            { id: "w6", type: "word", src: ["C"], pic: img("gate"), w: "Gate", alt: "Date", ar: "بوابة", say: "قَيت", trick: "<b>Gate</b> = بوابة 🚪 (G) · Date = تاريخ 📅 (D)" }
          ]
        }
      ]
    },

    // ------------------------------------------------------------------
    {
      id: "ortho", n: "VI", en: "Orthography", ar: "الإملاء", icon: "🔤", marks: 2,
      lessons: [
        {
          id: "spell1", title: "الحرف الناقص ١", icon: "🔤",
          instr: { en: "C- Fill in the missing letters:", ar: "كمّلي الحرف الناقص (الحروف في المربع: i – o – e – u)", how: "اكتبي الحرف مكان الشرطة _" },
          rule: `قولي الكلمة بصوت عالي <b>حرف حرف</b> 🗣️ — الحرف الناقص هو الصوت اللي ما تشوفينه.<br>
            نموذج ١: <b>Oven · Rainbow · Funny · Phone</b><br>
            نموذج ٢: <b>Fridge · origami · Wake up</b>`,
          rounds: ["choice", "write"],
          items: [
            { id: "sp1", type: "spell", src: ["A"], pic: img("oven"), w: "Oven", shape: "Ov_n", letter: "e", opts: ["i", "o", "e", "u"], ar: "فرن", say: "أوفِن", trick: "O-v-<b>e</b>-n — الناقص <b>e</b>" },
            { id: "sp2", type: "spell", src: ["A"], pic: img("rainbow-a"), w: "Rainbow", shape: "Ra_nbow", letter: "i", opts: ["i", "o", "e", "u"], ar: "قوس قزح", say: "رَين بو", trick: "rain = مطر: r-a-<b>i</b>-n — الناقص <b>i</b>" },
            { id: "sp3", type: "spell", src: ["A"], pic: img("funny"), w: "Funny", shape: "F_nny", letter: "u", opts: ["i", "o", "e", "u"], ar: "مضحك", say: "فَني", trick: "F-<b>u</b>-nny — حرف u صوته «آ» — الناقص <b>u</b>" },
            { id: "sp4", type: "spell", src: ["A"], pic: img("phone"), w: "Phone", shape: "Ph_ne", letter: "o", opts: ["i", "o", "e", "u"], ar: "جوال", say: "فون", trick: "Ph = ف · <b>o</b> = أو ← Ph<b>o</b>ne «فون»" },
            { id: "sp5", type: "spell", src: ["C"], pic: img("fridge"), w: "Fridge", shape: "F_idge", letter: "r", opts: ["l", "r"], ar: "ثلاجة", say: "فرِدج", trick: "«<b>فرِ</b>دج» فيها صوت ر ← <b>r</b>" },
            { id: "sp6", type: "spell", src: ["C"], pic: img("origami2"), w: "origami", shape: "ori_ami", letter: "g", opts: ["g", "k"], ar: "فن طي الورق", say: "أوريقامي", trick: "«أوري<b>قا</b>مي» صوت ق ← <b>g</b>" },
            { id: "sp7", type: "spell", src: ["C"], pic: img("wakeup"), w: "Wake up", shape: "Wa_e up", letter: "k", opts: ["k", "d"], ar: "يصحى", say: "وَيك أب", trick: "«وَي<b>ك</b> أب» صوت ك ← <b>k</b>" }
          ]
        },
        {
          id: "spell2", title: "الحرف الناقص ٢", icon: "🔡",
          instr: { en: "A- Fill in the missing letters:", ar: "كمّلي الحرف الناقص (ورقة المراجعة — بدون مربع حروف)", how: "اكتبي الحرف مكان الفراغ" },
          rule: `هنا <b>ما فيه مربع حروف</b> — لازم تحفظين الكلمة كاملة:<br>
            <b>tall · rainbow · tired · mountain</b><br>
            <b>hundred · calendar · snail</b>`,
          rounds: ["choice", "write"],
          items: [
            { id: "sb1", type: "spell", src: ["B"], pic: img("tall"), w: "tall", shape: "t_ll", letter: "a", ar: "طويل", say: "تول", trick: "t-<b>a</b>-ll «تول» — الناقص <b>a</b>" },
            { id: "sb2", type: "spell", src: ["B"], pic: img("rainbow"), w: "rainbow", shape: "rain_ow", letter: "b", ar: "قوس قزح", say: "رَين بو", trick: "rain + <b>b</b>ow «بو» ← <b>b</b>" },
            { id: "sb3", type: "spell", src: ["B"], pic: img("tired"), w: "tired", shape: "t_red", letter: "i", ar: "تعبان / نعسان", say: "تايرد", trick: "«تايرد» صوت آي ← <b>i</b>" },
            { id: "sb4", type: "spell", src: ["B"], pic: img("mountain"), w: "mountain", shape: "moun_ain", letter: "t", ar: "جبل", say: "ماونتِن", trick: "«ماون<b>ت</b>ن» صوت ت ← <b>t</b>" },
            { id: "sb5", type: "spell", src: ["B"], pic: img("hundred"), w: "hundred", shape: "hund_ed", letter: "r", ar: "مية (100)", say: "هَندرِد", trick: "«هَند<b>ر</b>د» صوت ر ← <b>r</b>" },
            { id: "sb6", type: "spell", src: ["B"], pic: img("calendar"), w: "calendar", shape: "_alendar", letter: "c", ar: "تقويم", say: "كالِندر", trick: "«<b>ك</b>الندر» صوت ك — بس تنكتب <b>c</b> مو k!" },
            { id: "sb7", type: "spell", src: ["B"], pic: img("snail"), w: "snail", shape: "s_ail", letter: "n", ar: "حلزون", say: "سنيل", trick: "«س<b>ن</b>يل» صوت ن ← <b>n</b>" }
          ]
        }
      ]
    }
  ],

  // ------------------------------------------------------------------
  // النماذج كما هي (بنفس ترتيبها وأسئلتها) — للحل المعروض وللاختبار «بالضبط»
  papers: [
    {
      id: "A", name: "الورقة الأولى", title: "نموذج ١ — اختبار الفترة الأولى", sub: "وزارة التعليم · من 20", marks: 20,
      parts: [
        {
          h: "I. General Questions:", sub: "A- Match the questions with the correct answers:", marks: 4, as: "match",
          items: ["g1", "g2", "g3", "g5"], matchOrder: ["g3", "g1", "g5", "g2"],
          t: "وصّلي السؤال بجوابه 🔗",
          how: ["اقري السؤال اللي في اليسار.", "دوري جوابه في العمود اللي جنبه.", "اكتبي رقم السؤال في المربع الصغير اللي جنب الجواب."]
        },
        {
          h: "II. Controlled Writing:", sub: "A. Rearrange the words to form sentences:", marks: 2, as: "build", items: ["o1", "o2"],
          t: "رتّبي الكلمات 🔀",
          how: ["الكلمات ملخبطة.", "الكلمة اللي أول حرف فيها كبير (مثل We) تجي أول.", "رتّبي الباقي واكتبي الجملة كاملة على السطر."]
        },
        {
          h: "III. Reading:", sub: "A. Read and choose True or False.", marks: 4, as: "choice", items: ["t1", "t2", "t3", "t4"],
          t: "صح أو خطأ ✅❌",
          how: ["شوفي الصورة.", "اقري الجملة.", "إذا الجملة نفس الصورة حوطي ✓ ، وإذا غلط حوطي ✗"]
        },
        {
          h: "IV. Grammar:", sub: "A- Choose the correct answer:", marks: 4, as: "choice", items: ["tm1", "tm2", "tm3", "cp1"],
          t: "اختاري الكلمة الصح 👆",
          how: ["اقري الجملة.", "دوري كلمة تساعدك، مثل: Last week (الأسبوع الماضي) أو than (من).", "حوطي الكلمة الصح من اللي بين القوسين."]
        },
        {
          h: "V. Vocabulary:", sub: "B- Write the words under the correct pictures:", marks: 4, as: "box", box: ["Gate", "ride", "layout", "snail"], items: ["v1", "v2", "v3", "v4"],
          t: "اكتبي الكلمة تحت الصورة 🖼️",
          how: ["الكلمات مكتوبة لك في المربع.", "شوفي الصورة واعرفي وش هي.", "انسخي الكلمة تحت صورتها."]
        },
        {
          h: "VI. Orthography:", sub: "C- Fill in the missing letters:", marks: 2, as: "box", box: ["i", "o", "e", "u"], items: ["sp1", "sp2", "sp3", "sp4"],
          t: "كمّلي الحرف الناقص 🔤",
          how: ["الحروف مكتوبة لك في المربع: i – o – e – u", "قولي الكلمة بصوت عالي.", "اكتبي الحرف الناقص مكان الشرطة _"]
        }
      ]
    },
    {
      id: "C", name: "الورقة الثانية", title: "نموذج ٢ — First Period Exam", sub: "مدرستي · من 10", marks: 10,
      parts: [
        {
          h: "Choose the correct answer:", marks: 1, as: "cfmt", items: ["g3", "g2"],
          t: "اختاري الجواب الصح 👆",
          how: ["اقري السؤال.", "عندك جوابين: A و B.", "حوطي الجواب الصح."]
        },
        {
          h: "Choose ✓ or ✗:", marks: 1.5, as: "choice", items: ["t5", "t6", "t7"],
          t: "صح أو خطأ ✅❌",
          how: ["اقري الجملة وشوفي الصورة اللي تحتها.", "إذا الجملة نفس الصورة حوطي ✓", "إذا غلط حوطي ✗"]
        },
        {
          h: "Do as shown between brackets:", marks: 1.5, as: "write", items: ["mo6", "un1", "un2"],
          t: "سوّي اللي بين القوسين 📌",
          how: ["(Rearrange) يعني: رتّبي الشهور من أول السنة.", "(Rewrite the words using un) يعني: اكتبي الكلمة وحطي un في أولها.", "اكتبي الجواب على السطر."]
        },
        {
          h: "Choose the correct word:", marks: 1.5, as: "choice", items: ["h2", "tm6", "tm7"],
          t: "كمّلي الفراغ بالكلمة الصح 👆",
          how: ["اقري الجملة.", "جنبها كلمات، اختاري اللي تناسب الفراغ.", "حوطي الكلمة الصح."]
        },
        {
          h: "Choose the correct word:", marks: 3, as: "pair", items: ["w1", "w2", "w3", "w4", "w5", "w6"],
          t: "اختاري اسم الصورة 🖼️",
          how: ["تحت كل صورة كلمتين.", "وحدة صح ووحدة غلط.", "حوطي الكلمة اللي هي اسم الصورة."]
        },
        {
          h: "Choose the correct letter to fill in the blank:", marks: 1.5, as: "choice", items: ["sp5", "sp6", "sp7"],
          t: "اختاري الحرف الناقص 🔤",
          how: ["شوفي الصورة واقري الكلمة.", "تحت الكلمة حرفين.", "حوطي الحرف اللي يكمّل الكلمة."]
        }
      ]
    },
    {
      id: "B", name: "الورقة الثالثة", title: "ورقة المراجعة — Welcome!", sub: "أ. تهاني", marks: null,
      parts: [
        {
          h: "I. General Questions:", sub: "A- Match the questions with the correct answers:", as: "match",
          items: ["g6", "g4", "g7", "g8", "g9", "g10"], matchOrder: ["g4", "g9", "g8", "g10", "g6", "g7"],
          t: "وصّلي السؤال بجوابه 🔗",
          how: ["اقري السؤال اللي في اليسار.", "دوري جوابه في العمود اللي جنبه.", "اكتبي رقم السؤال في المربع الصغير اللي جنب الجواب."]
        },
        {
          h: "II. Controlled Writing:", sub: "A- Rearrange the words to form sentences:", as: "build", items: ["o3", "o4", "o5"],
          t: "رتّبي الكلمات 🔀",
          how: ["الكلمات ملخبطة.", "الكلمة اللي أول حرف فيها كبير تجي أول.", "الكلمة اللي معها علامة ؟ تجي آخر شي."]
        },
        {
          h: "", sub: "B- Write the opposite of the following words:", as: "write", items: ["op1", "op2", "op3"],
          t: "اكتبي العكس ↔️",
          how: ["opposite يعني: العكس.", "مثل: صغير عكسه كبير.", "اكتبي الكلمة العكس بعد علامة ≠"]
        },
        {
          h: "", sub: "C- 1. Write the months of the year in the correct order:", as: "box", box: ["August", "November", "March", "June", "April"], items: ["mo1", "mo2", "mo3", "mo4", "mo5"],
          t: "كمّلي الشهور 📅",
          how: ["الشهور الناقصة مكتوبة لك في المربع.", "شوفي رقم الشهر.", "اكتبي اسم الشهر في مكانه."]
        },
        {
          h: "", sub: "C- 2. Complete the chart:", as: "write", items: ["p1", "p2", "p3", "p4", "p5", "p6"],
          t: "كمّلي جدول الماضي 📋",
          how: ["Verb = الفعل ، و Past form = الماضي حقه.", "بعض المربعات فاضية.", "اكتبي الكلمة الناقصة في المربع الفاضي."]
        },
        {
          h: "IV. Reading Short Sentence:", sub: "A- Read the sentences then match them with the correct pictures:", as: "choice", items: ["s1", "s2", "s3", "s4"],
          t: "اختاري الجملة اللي تناسب الصورة 🖼️",
          how: ["تحت كل صورة جملتين: a و b.", "الجملتين يختلفون في كلمة وحدة بس.", "اختاري الجملة اللي توصف الصورة."]
        },
        {
          h: "", sub: "B- Read and complete. Use the words in the box:", as: "box", box: ["comic book", "calendar", "lion", "snail"], items: ["c1", "c2", "c3", "c4"],
          t: "كمّلي من المربع 📦",
          how: ["الكلمات مكتوبة لك في المربع.", "اقري الجملة وشوفي الصورة.", "انسخي الكلمة المناسبة."]
        },
        {
          h: "V. Grammar:", sub: "A- Choose the correct answer:", as: "choice", items: ["h1", "h2", "h3", "h4", "tm4", "tm5", "cp2", "cp3"],
          t: "اختاري الجواب الصح 👆",
          how: ["اقري الجملة.", "الاختيارات مكتوبة بين القوسين.", "حوطي الصح."]
        },
        {
          h: "VI. Vocabulary:", sub: "A- Write the words under the correct pictures:", as: "box", box: ["months", "late", "date", "plus", "classroom"], items: ["v5", "v6", "v7", "v8", "v9"],
          t: "اكتبي الكلمة تحت الصورة 🖼️",
          how: ["الكلمات مكتوبة لك في المربع.", "شوفي الصورة واعرفي وش هي.", "انسخي الكلمة تحت صورتها."]
        },
        {
          h: "VII. Orthography:", sub: "A- Fill in the missing letters:", as: "write", items: ["sb1", "sb2", "sb3", "sb4", "sb5", "sb6", "sb7"],
          t: "كمّلي الحرف الناقص 🔤",
          how: ["هنا ما فيه مربع حروف.", "قولي الكلمة بصوت عالي.", "اكتبي الحرف الناقص مكان الشرطتين __"]
        }
      ]
    }
  ]
};

export const EXAMS = [TG2];
