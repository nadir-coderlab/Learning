// Catalog content the clinical team manages from the admin side (CMS): pathway, phases,
// criteria, exercise library, education, questionnaires, alert rules, milestones.
// Thresholds marked `example` are placeholders for the team to confirm; nothing here is hard-coded
// into the screens, so a new pathway (TKA, shoulder, low back) is new data, not new code.

export const CATEGORIES = {
  ROM: 'المدى الحركي',
  Quadriceps: 'العضلة الرباعية',
  Hamstrings: 'الهامسترينج',
  Hip: 'الورك',
  Calf: 'السمانة',
  Gait: 'المشي',
  Balance: 'التوازن',
  Proprioception: 'الإحساس العميق',
  Strength: 'القوة',
  Core: 'الجذع',
  Cardiovascular: 'اللياقة القلبية',
  Running: 'الجري',
  Plyometrics: 'البليومترك',
  Agility: 'الرشاقة',
  COD: 'تغيير الاتجاه',
  Sport: 'خاص بالرياضة',
};

export const EFFUSION_GRADES = ['Zero', 'Trace', '1+', '2+', '3+'];

// Metrics the engine understands: extDeficit, flex, flexPctOther, flexDiffOther, effusion, slrLag, gait,
// noRedAlerts, painAdl, quadLSI, hamLSI, hopLSI, jumpLSI, singleLegStance, runTolerated, landingQuality,
// hopPrereq, aclRsi, ikdc, monthsPostOp, sportDrills.
// `src` cites where a threshold comes from; `example: true` marks a team-consensus placeholder.
export const PHASES = [
  {
    id: 1, key: 'protect', nameAr: 'الحماية والتعافي المبكر', nameEn: 'Protection & Early Recovery', typical: 'الأسابيع 0–2 تقريبًا',
    goalAr: 'حماية العملية، السيطرة على الألم والتورم، استعادة فرد الركبة الكامل وتفعيل العضلة الرباعية.',
    goals: ['حماية العملية وفق تعليمات الجراح', 'السيطرة على الألم والتورم', 'استعادة فرد الركبة الكامل', 'تحسين الثني تدريجيًا', 'تفعيل العضلة الرباعية', 'تحسين المشي'],
  },
  {
    id: 2, key: 'movement', nameAr: 'استعادة الحركة والقوة الأساسية', nameEn: 'Restore Movement & Basic Strength', typical: 'الأسابيع 2–6 تقريبًا',
    goalAr: 'استعادة الحركة الكاملة والمشي الطبيعي والقوة الأساسية والتحكم العصبي العضلي.',
    goals: ['ثني يقارب الطرف السليم', 'مشي طبيعي بدون مساعدة', 'قوة أساسية للفخذ والورك', 'توازن على رجل واحدة'],
  },
  {
    id: 3, key: 'strength', nameAr: 'القوة والتحكم العصبي العضلي', nameEn: 'Strength & Neuromuscular Control', typical: 'الأشهر 2–3 تقريبًا',
    goalAr: 'بناء قوة حقيقية للطرف السفلي وتحسين التحكم بالحركة على رجل واحدة.',
    goals: ['زيادة الأحمال تدريجيًا وتسجيلها', 'تحكم على رجل واحدة', 'لياقة قلبية', 'تحضير للجري'],
  },
  {
    id: 4, key: 'running', nameAr: 'العودة للجري', nameEn: 'Return to Running', typical: 'بعد تحقق المعايير — غالبًا من الأسبوع 12',
    goalAr: 'العودة التدريجية للجري ضمن برنامج متدرج يعتمد على استجابة الركبة.',
    goals: ['برنامج جري متدرج', 'مراقبة الألم والتورم بعد الجلسات', 'استمرار القوة'],
  },
  {
    id: 5, key: 'plyo', nameAr: 'البليومترك والقوة المتقدمة', nameEn: 'Plyometrics & Advanced Strength', typical: 'بعد تحقق المعايير — غالبًا الشهر 4–6',
    goalAr: 'القفز والهبوط الآمن والقوة المتقدمة على مستويات تُفتح بقرار الأخصائي.',
    goals: ['ميكانيكا هبوط سليمة', 'تدرج من رجلين إلى رجل واحدة', 'قوة متقدمة'],
  },
  {
    id: 6, key: 'agility', nameAr: 'الرشاقة والتحضير للعودة للرياضة', nameEn: 'Agility & Return to Sport Preparation', typical: 'بعد تحقق المعايير — غالبًا الشهر 6–9',
    goalAr: 'التسارع والتباطؤ وتغيير الاتجاه وتمارين خاصة برياضة المريض.',
    goals: ['تغيير اتجاه مخطط ثم تفاعلي', 'وحدة الرياضة الخاصة', 'تحضير لاختبارات العودة'],
  },
];

// Criteria to ENTER each phase (key = target phase). The platform shows them, the clinician decides.
export const GATES = {
  2: [
    { id: 'g2_ext', textAr: 'فرد كامل للركبة', metric: 'extDeficit', op: '<=', target: 0, src: 'Adams 2012' },
    { id: 'g2_flex', textAr: 'ثني 110° على الأقل', metric: 'flex', op: '>=', target: 110, src: 'MOON 2015 · Adams 2012' },
    { id: 'g2_eff', textAr: 'التورم تحت السيطرة (Trace أو أقل)', metric: 'effusion', op: '<=', target: 1 },
    { id: 'g2_slr', textAr: 'رفع الساق مستقيمة بدون تأخر', metric: 'slrLag', op: '==', target: false, src: 'Adams 2012' },
    { id: 'g2_gait', textAr: 'مشية مناسبة للمرحلة', metric: 'gait', op: '==', target: true },
    { id: 'g2_comp', textAr: 'لا مضاعفات مقلقة بعد العملية', metric: 'noRedAlerts', op: '==', target: true },
  ],
  3: [
    { id: 'g3_ext', textAr: 'فرد كامل محافظ عليه', metric: 'extDeficit', op: '<=', target: 0 },
    { id: 'g3_flex', textAr: 'الثني في حدود 10° من الطرف السليم', metric: 'flexDiffOther', op: '<=', target: 10, src: 'Adams 2012' },
    { id: 'g3_eff', textAr: 'تورم Trace أو أقل بعد التمارين', metric: 'effusion', op: '<=', target: 1 },
    { id: 'g3_gait', textAr: 'مشي طبيعي بدون عكازات', metric: 'gait', op: '==', target: true },
    { id: 'g3_sls', textAr: 'الوقوف على رجل 30 ثانية بثبات', metric: 'singleLegStance', op: '>=', target: 30, example: true },
    { id: 'g3_comp', textAr: 'لا تنبيهات سريرية مفتوحة', metric: 'noRedAlerts', op: '==', target: true },
  ],
  4: [
    { id: 'g4_ext', textAr: 'فرد كامل للركبة', metric: 'extDeficit', op: '<=', target: 0, src: 'Aspetar 2023' },
    { id: 'g4_flex', textAr: 'ثني 95% على الأقل من الطرف السليم', metric: 'flexPctOther', op: '>=', target: 95, src: 'Aspetar 2023' },
    { id: 'g4_eff', textAr: 'لا تورم أو Trace فقط', metric: 'effusion', op: '<=', target: 1, src: 'Aspetar 2023' },
    { id: 'g4_pain', textAr: 'استجابة ألم مناسبة (2/10 أو أقل في الأنشطة)', metric: 'painAdl', op: '<=', target: 2, example: true },
    { id: 'g4_quad', textAr: 'قوة العضلة الرباعية: LSI أعلى من 80%', metric: 'quadLSI', op: '>=', target: 80, src: 'Aspetar 2023' },
    { id: 'g4_load', textAr: 'تحمّل التحميل الوظيفي (نزول درجة بجودة جيدة)', metric: 'landingQuality', op: '==', target: true },
    { id: 'g4_hop', textAr: 'قفزات متكررة على رجل بدون ألم', metric: 'hopPrereq', op: '==', target: true, src: 'Aspetar 2023' },
  ],
  5: [
    { id: 'g5_run', textAr: 'تحمّل برنامج الجري بدون تورم لاحق', metric: 'runTolerated', op: '==', target: true },
    { id: 'g5_quad', textAr: 'قوة العضلة الرباعية: LSI 80% على الأقل', metric: 'quadLSI', op: '>=', target: 80, example: true },
    { id: 'g5_land', textAr: 'جودة هبوط جيدة على رجلين', metric: 'landingQuality', op: '==', target: true },
    { id: 'g5_eff', textAr: 'لا تورم', metric: 'effusion', op: '<=', target: 1 },
  ],
  6: [
    { id: 'g6_quad', textAr: 'قوة العضلة الرباعية: LSI 85% على الأقل', metric: 'quadLSI', op: '>=', target: 85, example: true },
    { id: 'g6_hop', textAr: 'اختبارات القفز: LSI 85% على الأقل', metric: 'hopLSI', op: '>=', target: 85, src: 'MOON 2015' },
    { id: 'g6_land', textAr: 'جودة حركة وهبوط جيدة على رجل واحدة', metric: 'landingQuality', op: '==', target: true },
    { id: 'g6_eff', textAr: 'لا تورم بعد الأحمال العالية', metric: 'effusion', op: '<=', target: 0 },
  ],
  rts: [
    { id: 'rts_time', textAr: 'مرور 9 أشهر على الأقل من العملية', metric: 'monthsPostOp', op: '>=', target: 9, src: 'Grindem 2016' },
    { id: 'rts_quad', textAr: 'تماثل قوة الرباعية 90% على الأقل (100% للرياضات الالتفافية)', metric: 'quadLSI', op: '>=', target: 90, src: 'Grindem 2016 · Aspetar 2023' },
    { id: 'rts_ham', textAr: 'تماثل قوة الهامسترينج 90% على الأقل', metric: 'hamLSI', op: '>=', target: 90, src: 'Aspetar 2023' },
    { id: 'rts_hop', textAr: 'اختبارات القفز الأربعة 90% على الأقل', metric: 'hopLSI', op: '>=', target: 90 },
    { id: 'rts_jump', textAr: 'القفز العمودي والقفز الارتدادي أعلى من 90% تماثلًا', metric: 'jumpLSI', op: '>=', target: 90, src: 'Aspetar 2023' },
    { id: 'rts_ikdc', textAr: 'IKDC ضمن المعدل الطبيعي', metric: 'ikdc', op: '>=', target: 85, example: true },
    { id: 'rts_rsi', textAr: 'جاهزية نفسية: ACL-RSI ‏62 أو أكثر', metric: 'aclRsi', op: '>=', target: 62, src: 'Webster 2018' },
    { id: 'rts_sport', textAr: 'إنهاء التدريب الخاص بالرياضة', metric: 'sportDrills', op: '==', target: true },
  ],
};

// Exercise library. `motion` drives the demo animation; `camera` names the home measurement
// that can verify the exercise.
export const EXERCISES = [
  // Phase 1
  { id: 'ankle_pumps', nameAr: 'ضخ الكاحل', nameEn: 'Ankle pumps', cat: 'Calf', phases: [1, 2], sets: 3, reps: 20, hold: 0, freq: 'كل ساعة وأنت مستيقظ', motion: 'anklePump',
    cues: ['استلقِ والساق ممدودة', 'حرّك القدم لأعلى ولأسفل بإيقاع ثابت'], precautions: 'يساعد الدورة الدموية؛ أبلغ الفريق فورًا عن أي ألم أو تورم في الساق.', prog: null, reg: null },
  { id: 'quad_sets', nameAr: 'شد العضلة الرباعية', nameEn: 'Quadriceps sets', cat: 'Quadriceps', phases: [1, 2], sets: 3, reps: 10, hold: 5, freq: '3 مرات يوميًا', motion: 'quadSet',
    cues: ['اجلس والساق ممدودة ومنشفة صغيرة تحت الركبة', 'اضغط الركبة على المنشفة وشد الفخذ حتى ترتفع الرضفة', 'اثبت 5 ثوانٍ ثم استرخِ'], precautions: 'لا تحبس النفس أثناء الشد.', prog: 'slr', reg: null },
  { id: 'heel_slides', nameAr: 'سحب الكعب', nameEn: 'Heel slides', cat: 'ROM', phases: [1, 2], sets: 3, reps: 10, hold: 3, freq: '3 مرات يوميًا', motion: 'heelSlide', camera: 'flex',
    cues: ['استلقِ على ظهرك', 'اسحب الكعب نحو المقعدة ببطء حتى تشعر بشد مريح', 'اثبت 3 ثوانٍ ثم ارجع'], precautions: 'التزم بحدود المدى التي حددها الجراح (مثلًا 90° عند إصلاح الغضروف الهلالي).', prog: 'seated_flex_assist', reg: null },
  { id: 'heel_prop', nameAr: 'فرد الركبة بسند الكعب', nameEn: 'Heel prop (passive extension)', cat: 'ROM', phases: [1, 2], sets: 3, reps: 1, hold: 300, freq: '3–4 مرات يوميًا', motion: 'heelProp', camera: 'ext',
    cues: ['ضع لفافة تحت الكعب وليس تحت الركبة', 'اترك الركبة ترتخي نحو الأرض', 'استمر 5 دقائق'], precautions: 'لا تضع وسادة تحت الركبة عند النوم؛ الفرد الكامل أولوية في هذه المرحلة.', prog: 'prone_hang', reg: null },
  { id: 'prone_hang', nameAr: 'تعليق الساق على البطن', nameEn: 'Prone hang', cat: 'ROM', phases: [1, 2], sets: 3, reps: 1, hold: 300, freq: 'مرتين يوميًا', motion: 'heelProp', camera: 'ext',
    cues: ['استلقِ على بطنك والركبتان خارج حافة السرير', 'اترك الساق تتدلى بوزنها'], precautions: 'أوقف التمرين إذا زاد الألم بوضوح.', prog: null, reg: 'heel_prop' },
  { id: 'patellar_mob', nameAr: 'تحريك الرضفة', nameEn: 'Patellar mobilization', cat: 'ROM', phases: [1, 2], sets: 2, reps: 10, hold: 0, freq: 'مرتين يوميًا', motion: 'quadSet',
    cues: ['الساق مرتخية', 'حرّك الرضفة بلطف لأعلى ولأسفل ولليمين واليسار'], precautions: 'بعد التئام الجرح وبإذن الأخصائي.', prog: null, reg: null },
  { id: 'slr', nameAr: 'رفع الساق مستقيمة', nameEn: 'Straight leg raise', cat: 'Quadriceps', phases: [1, 2], sets: 3, reps: 10, hold: 2, freq: 'مرتين يوميًا', motion: 'slr', camera: 'slr',
    cues: ['شد الفخذ أولًا حتى تستقيم الركبة', 'ارفع الساق 30–40 سم وهي مستقيمة', 'انزل ببطء'], precautions: 'إذا انثنت الركبة أثناء الرفع (تأخر) ارجع لتمرين شد العضلة الرباعية.', prog: 'tke', reg: 'quad_sets' },
  { id: 'sl_hip_abd', nameAr: 'إبعاد الورك جانبًا', nameEn: 'Side-lying hip abduction', cat: 'Hip', phases: [1, 2], sets: 3, reps: 10, hold: 0, freq: 'مرة يوميًا', motion: 'slr',
    cues: ['استلقِ على الجنب السليم', 'ارفع الساق للأعلى باستقامة مع الكعب للخلف قليلًا'], precautions: 'لا تدوّر الحوض للخلف.', prog: 'clam', reg: null },
  { id: 'glute_sets', nameAr: 'شد عضلات المؤخرة', nameEn: 'Glute sets', cat: 'Hip', phases: [1], sets: 3, reps: 10, hold: 5, freq: '3 مرات يوميًا', motion: 'quadSet',
    cues: ['استلقِ على ظهرك', 'اضغط عضلات المؤخرة واثبت 5 ثوانٍ'], precautions: '—', prog: 'bridge', reg: null },
  { id: 'seated_flex_assist', nameAr: 'ثني الركبة جالسًا بمساعدة الساق الأخرى', nameEn: 'Seated assisted knee flexion', cat: 'ROM', phases: [1, 2], sets: 3, reps: 10, hold: 5, freq: '3 مرات يوميًا', motion: 'seatedFlex', camera: 'flex',
    cues: ['اجلس على كرسي', 'ادفع الساق المصابة للخلف بالساق السليمة حتى شد مريح'], precautions: 'ضمن حدود المدى المسموح.', prog: 'bike', reg: 'heel_slides' },
  { id: 'calf_band', nameAr: 'دفع القدم بالمطاط', nameEn: 'Calf press with band', cat: 'Calf', phases: [1, 2], sets: 3, reps: 15, hold: 0, freq: 'مرة يوميًا', motion: 'anklePump',
    cues: ['لف المطاط حول مقدمة القدم', 'ادفع القدم للأمام ببطء ثم ارجع'], precautions: '—', prog: 'calf_raise', reg: 'ankle_pumps' },
  { id: 'weight_shift', nameAr: 'نقل الوزن واقفًا', nameEn: 'Weight shifting', cat: 'Balance', phases: [1, 2], sets: 3, reps: 10, hold: 3, freq: 'مرتين يوميًا', motion: 'balance',
    cues: ['قف ممسكًا بسطح ثابت', 'انقل وزنك تدريجيًا نحو الساق المصابة'], precautions: 'حسب قيود التحميل التي حددها الجراح.', prog: 'sls_balance', reg: null },
  { id: 'gait_crutches', nameAr: 'المشي بالعكازات', nameEn: 'Gait with crutches', cat: 'Gait', phases: [1], sets: 1, reps: 1, hold: 0, freq: 'حسب التعليمات', motion: 'run',
    cues: ['العكازان ثم الساق المصابة ثم السليمة', 'اثنِ الركبة قليلًا أثناء الخطوة ولا تمشِ والركبة متيبسة'], precautions: 'نوع التحميل والدعامة حسب الجراح.', prog: null, reg: null },
  // Phase 2
  { id: 'bike', nameAr: 'الدراجة الثابتة', nameEn: 'Stationary cycling', cat: 'Cardiovascular', phases: [2, 3, 4], sets: 1, reps: 1, hold: 600, freq: 'يوميًا', motion: 'bike',
    cues: ['ابدأ بأنصاف دورات للأمام والخلف', 'انتقل للدورة الكاملة عندما يسمح الثني', 'مقاومة خفيفة'], precautions: 'ارفع المقعد في البداية لتقليل الثني المطلوب.', prog: 'elliptical', reg: 'seated_flex_assist' },
  { id: 'mini_squat', nameAr: 'القرفصاء الجزئي', nameEn: 'Mini squat (0–45°)', cat: 'Quadriceps', phases: [2, 3], sets: 3, reps: 12, hold: 0, freq: 'يوميًا', motion: 'squat', camera: 'squat',
    cues: ['القدمان بعرض الحوض', 'انزل حتى 45° تقريبًا والركبة فوق القدم', 'الوزن متساوٍ على الرجلين'], precautions: 'لا تترك الركبة تميل للداخل.', prog: 'goblet_squat', reg: 'wall_sit' },
  { id: 'bridge', nameAr: 'الجسر', nameEn: 'Bridge', cat: 'Hip', phases: [2, 3], sets: 3, reps: 12, hold: 2, freq: 'يوميًا', motion: 'bridge',
    cues: ['استلقِ والركبتان مثنيتان', 'ارفع الحوض حتى يستقيم الجذع مع الفخذين'], precautions: 'عند طعم الهامسترينج: بدون مقاومة إضافية حتى يسمح الجراح.', prog: 'sl_rdl', reg: 'glute_sets' },
  { id: 'calf_raise', nameAr: 'رفع الكعبين واقفًا', nameEn: 'Standing calf raises', cat: 'Calf', phases: [2, 3], sets: 3, reps: 15, hold: 1, freq: 'يوميًا', motion: 'calfRaise',
    cues: ['قف ممسكًا بسطح', 'ارتفع على أطراف الأصابع ثم انزل ببطء'], precautions: '—', prog: null, reg: 'calf_band' },
  { id: 'step_up', nameAr: 'الصعود الأمامي على درجة', nameEn: 'Forward step-up', cat: 'Strength', phases: [2, 3], sets: 3, reps: 10, hold: 0, freq: 'يوميًا', motion: 'stepUp',
    cues: ['ابدأ بدرجة منخفضة (10 سم)', 'اصعد بالساق المصابة والركبة فوق القدم'], precautions: 'ارتفاع الدرجة يزيد تدريجيًا.', prog: 'step_down', reg: 'mini_squat' },
  { id: 'leg_press', nameAr: 'ضغط الأرجل', nameEn: 'Leg press', cat: 'Strength', phases: [2, 3], sets: 3, reps: 12, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'legPress', load: true,
    cues: ['ضمن المدى المحدد (مثلًا 0–60° في البداية)', 'ادفع بالرجلين ثم برجل واحدة لاحقًا'], precautions: 'الحمل يحدده الأخصائي ويُسجل في كل جلسة.', prog: 'sl_leg_press', reg: 'mini_squat' },
  { id: 'tke', nameAr: 'مد الركبة النهائي بالمطاط', nameEn: 'Terminal knee extension (band)', cat: 'Quadriceps', phases: [2, 3], sets: 3, reps: 15, hold: 2, freq: 'يوميًا', motion: 'squat',
    cues: ['المطاط خلف الركبة', 'افرد الركبة بالكامل ضد المطاط'], precautions: '—', prog: null, reg: 'slr' },
  { id: 'sls_balance', nameAr: 'الوقوف على رجل واحدة', nameEn: 'Single-leg stance', cat: 'Balance', phases: [2, 3], sets: 3, reps: 1, hold: 30, freq: 'يوميًا', motion: 'balance',
    cues: ['قف على الساق المصابة والركبة مرتخية قليلًا', 'ابدأ بجانب سطح للأمان'], precautions: '—', prog: 'unstable_balance', reg: 'weight_shift' },
  { id: 'ham_curl', nameAr: 'ثني الركبة واقفًا', nameEn: 'Standing hamstring curl', cat: 'Hamstrings', phases: [2, 3], sets: 3, reps: 12, hold: 0, freq: 'يوميًا', motion: 'hamCurl',
    cues: ['قف ممسكًا بسطح', 'اثنِ الركبة للخلف ببطء'], precautions: 'عند طعم الهامسترينج: بدون مقاومة حتى يسمح الجراح.', prog: 'sl_rdl', reg: null },
  { id: 'clam', nameAr: 'تمرين المحارة', nameEn: 'Clamshell', cat: 'Hip', phases: [2, 3], sets: 3, reps: 15, hold: 0, freq: 'يوميًا', motion: 'bridge',
    cues: ['استلقِ على الجنب والركبتان مثنيتان', 'افتح الركبة العليا مع بقاء القدمين متلاصقتين'], precautions: '—', prog: 'lateral_walk', reg: 'sl_hip_abd' },
  { id: 'lateral_walk', nameAr: 'المشي الجانبي بالمطاط', nameEn: 'Lateral band walk', cat: 'Hip', phases: [2, 3], sets: 3, reps: 10, hold: 0, freq: 'يوميًا', motion: 'squat',
    cues: ['المطاط حول الكاحلين', 'خطوات جانبية والركبتان مثنيتان قليلًا'], precautions: '—', prog: null, reg: 'clam' },
  { id: 'dead_bug', nameAr: 'تمرين الحشرة الميتة', nameEn: 'Dead bug', cat: 'Core', phases: [2, 3, 4], sets: 3, reps: 10, hold: 0, freq: 'يوميًا', motion: 'slr',
    cues: ['استلقِ والذراعان للأعلى', 'مد ذراعًا وساقًا متعاكستين مع ثبات أسفل الظهر'], precautions: '—', prog: null, reg: null },
  { id: 'wall_sit', nameAr: 'الجلوس على الحائط', nameEn: 'Wall sit (shallow)', cat: 'Quadriceps', phases: [2, 3], sets: 3, reps: 1, hold: 30, freq: 'يوميًا', motion: 'wallSit',
    cues: ['الظهر على الحائط', 'انزل حتى زاوية مريحة واثبت'], precautions: 'ضمن المدى المسموح.', prog: 'mini_squat', reg: 'quad_sets' },
  // Phase 3
  { id: 'split_squat', nameAr: 'القرفصاء المنقسم', nameEn: 'Split squat', cat: 'Strength', phases: [3, 4, 5], sets: 3, reps: 10, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'splitSquat',
    cues: ['خطوة طويلة للأمام', 'انزل عموديًا والركبة الأمامية فوق القدم'], precautions: '—', prog: 'reverse_lunge', reg: 'mini_squat' },
  { id: 'reverse_lunge', nameAr: 'الطعن الخلفي', nameEn: 'Reverse lunge', cat: 'Strength', phases: [3, 4, 5], sets: 3, reps: 10, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'splitSquat',
    cues: ['خطوة للخلف والنزول بتحكم', 'ارجع بدفعة من الرجل الأمامية'], precautions: '—', prog: null, reg: 'split_squat' },
  { id: 'step_down', nameAr: 'النزول الأمامي من درجة', nameEn: 'Forward step-down', cat: 'Strength', phases: [3, 4], sets: 3, reps: 10, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'stepDown', camera: 'valgus',
    cues: ['قف على درجة بالساق المصابة', 'انزل بالكعب الآخر نحو الأرض ببطء', 'الركبة فوق منتصف القدم'], precautions: 'راقب ميل الركبة للداخل؛ صوّر من الأمام عند الطلب.', prog: null, reg: 'step_up' },
  { id: 'sl_rdl', nameAr: 'الرفعة الرومانية على رجل', nameEn: 'Single-leg Romanian deadlift', cat: 'Hamstrings', phases: [3, 4, 5], sets: 3, reps: 10, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'hinge',
    cues: ['انحنِ من الورك والظهر مستقيم', 'الساق الخلفية تمتد للخلف'], precautions: '—', prog: 'nordic', reg: 'bridge' },
  { id: 'knee_ext_okc', nameAr: 'مد الركبة جالسًا بالجهاز', nameEn: 'Seated knee extension', cat: 'Quadriceps', phases: [3, 4, 5], sets: 3, reps: 12, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'seatedExt', load: true,
    cues: ['المدى والحمل حسب الخطة السريرية', 'حركة بطيئة متحكم بها'], precautions: 'يبدأ بمدى محدد (مثل 90–45°) ويتقدم حسب الخطة السريرية.', prog: null, reg: 'tke' },
  { id: 'goblet_squat', nameAr: 'القرفصاء بالثقل', nameEn: 'Goblet squat', cat: 'Strength', phases: [3, 4, 5], sets: 4, reps: 8, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'squat', load: true,
    cues: ['امسك الثقل أمام الصدر', 'انزل بعمق مريح والظهر مستقيم'], precautions: '—', prog: null, reg: 'mini_squat' },
  { id: 'sl_leg_press', nameAr: 'ضغط الأرجل برجل واحدة', nameEn: 'Single-leg leg press', cat: 'Strength', phases: [3, 4, 5], sets: 3, reps: 10, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'legPress', load: true,
    cues: ['حمل أقل من الرجلين', 'قارن الحمل بين الطرفين'], precautions: '—', prog: null, reg: 'leg_press' },
  { id: 'nordic', nameAr: 'تمرين نوردك للهامسترينج', nameEn: 'Nordic hamstring curl', cat: 'Hamstrings', phases: [4, 5, 6], sets: 3, reps: 5, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'hinge',
    cues: ['على الركبتين مع تثبيت الكاحلين', 'انزل للأمام ببطء قدر ما تستطيع'], precautions: 'يُضاف بقرار الأخصائي.', prog: null, reg: 'sl_rdl' },
  { id: 'y_balance', nameAr: 'الوصول بالاتجاهات على رجل', nameEn: 'Y-balance reach', cat: 'Proprioception', phases: [3, 4, 5], sets: 3, reps: 5, hold: 0, freq: 'يوميًا', motion: 'balance',
    cues: ['قف على رجل', 'مد الأخرى للأمام ثم للخلف الجانبي'], precautions: '—', prog: null, reg: 'sls_balance' },
  { id: 'unstable_balance', nameAr: 'الوقوف على سطح غير ثابت', nameEn: 'Single-leg balance on foam', cat: 'Proprioception', phases: [3, 4], sets: 3, reps: 1, hold: 30, freq: 'يوميًا', motion: 'balance',
    cues: ['قف على وسادة إسفنجية', 'أضف حركة الذراعين أو إغلاق العينين تدريجيًا'], precautions: '—', prog: 'y_balance', reg: 'sls_balance' },
  { id: 'elliptical', nameAr: 'جهاز الإليبتكال', nameEn: 'Elliptical', cat: 'Cardiovascular', phases: [3, 4], sets: 1, reps: 1, hold: 900, freq: '3 مرات أسبوعيًا', motion: 'run',
    cues: ['15–20 دقيقة بشدة متوسطة'], precautions: '—', prog: 'walk_jog', reg: 'bike' },
  // Phase 4 — running
  { id: 'pogo', nameAr: 'القفز الخفيف على الرجلين', nameEn: 'Pogo hops', cat: 'Plyometrics', phases: [4], sets: 3, reps: 20, hold: 0, freq: '3 مرات أسبوعيًا', motion: 'jump',
    cues: ['قفزات صغيرة سريعة على أطراف القدمين', 'هبوط هادئ'], precautions: 'تمهيد للجري؛ أوقف عند الألم.', prog: null, reg: 'calf_raise' },
  { id: 'walk_jog', nameAr: 'المشي والهرولة المتقطعة', nameEn: 'Walk-jog intervals', cat: 'Running', phases: [4], sets: 5, reps: 1, hold: 0, freq: 'يوم بعد يوم', motion: 'run', running: true,
    cues: ['5 دقائق مشي للإحماء', 'دقيقة هرولة ثم دقيقتان مشي', 'كرر 5 مرات'], precautions: 'سجل الألم أثناء الجلسة وبعدها والتورم في اليوم التالي.', prog: 'treadmill_run', reg: 'elliptical' },
  { id: 'a_skip', nameAr: 'تمرين A-skip', nameEn: 'A-skip drill', cat: 'Running', phases: [4, 5], sets: 3, reps: 20, hold: 0, freq: 'قبل الجري', motion: 'run',
    cues: ['رفع الركبة مع خطوة قصيرة إيقاعية'], precautions: '—', prog: null, reg: null },
  { id: 'treadmill_run', nameAr: 'الجري المستمر', nameEn: 'Continuous run', cat: 'Running', phases: [4, 5, 6], sets: 1, reps: 1, hold: 1200, freq: 'يوم بعد يوم', motion: 'run', running: true,
    cues: ['15–20 دقيقة بسرعة مريحة'], precautions: 'يُفتح بعد إنهاء برنامج المشي والهرولة.', prog: null, reg: 'walk_jog' },
  // Phase 5 — plyometrics (levels)
  { id: 'dl_jump', nameAr: 'القفز على الرجلين في المكان', nameEn: 'Double-leg jumps', cat: 'Plyometrics', phases: [5], level: 1, sets: 3, reps: 10, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'jump',
    cues: ['هبوط ناعم والركبتان فوق القدمين'], precautions: '—', prog: 'cmj', reg: 'pogo' },
  { id: 'box_jump', nameAr: 'القفز على صندوق', nameEn: 'Box jump (land up)', cat: 'Plyometrics', phases: [5], level: 1, sets: 3, reps: 6, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'jump',
    cues: ['اقفز للأعلى واهبط على الصندوق', 'انزل مشيًا لا قفزًا'], precautions: '—', prog: 'drop_land', reg: 'dl_jump' },
  { id: 'drop_land', nameAr: 'الهبوط الثابت من صندوق', nameEn: 'Drop landing & stick', cat: 'Plyometrics', phases: [5], level: 2, sets: 3, reps: 6, hold: 2, freq: 'مرتين أسبوعيًا', motion: 'jump', camera: 'valgus',
    cues: ['انزل من صندوق منخفض', 'اثبت الهبوط ثانيتين'], precautions: 'صوّر من الأمام لمراجعة جودة الهبوط.', prog: 'sl_hop_stick', reg: 'box_jump' },
  { id: 'cmj', nameAr: 'القفز العمودي بثني مسبق', nameEn: 'Countermovement jump', cat: 'Plyometrics', phases: [5, 6], level: 2, sets: 3, reps: 6, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'jump',
    cues: ['ثنِ سريع ثم قفزة قصوى'], precautions: '—', prog: null, reg: 'dl_jump' },
  { id: 'broad_jump', nameAr: 'القفز الأفقي', nameEn: 'Broad jump', cat: 'Plyometrics', phases: [5, 6], level: 2, sets: 3, reps: 5, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'jump',
    cues: ['اقفز للأمام واهبط ثابتًا'], precautions: '—', prog: null, reg: 'dl_jump' },
  { id: 'sl_hop_stick', nameAr: 'القفز على رجل والثبات', nameEn: 'Single-leg hop & stick', cat: 'Plyometrics', phases: [5, 6], level: 3, sets: 3, reps: 6, hold: 2, freq: 'مرتين أسبوعيًا', motion: 'jump', camera: 'valgus',
    cues: ['قفزة قصيرة على رجل واحدة', 'اثبت الهبوط ثانيتين'], precautions: 'يُفتح بقرار الأخصائي.', prog: 'lateral_hop', reg: 'drop_land' },
  { id: 'lateral_hop', nameAr: 'القفز الجانبي على رجل', nameEn: 'Lateral single-leg hops', cat: 'Plyometrics', phases: [5, 6], level: 3, sets: 3, reps: 8, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'jump',
    cues: ['قفزات جانبية فوق خط'], precautions: '—', prog: null, reg: 'sl_hop_stick' },
  // Phase 6 — agility & sport
  { id: 'accel', nameAr: 'التسارع لمسافة قصيرة', nameEn: 'Acceleration sprints', cat: 'Agility', phases: [6], sets: 6, reps: 1, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'run',
    cues: ['10 أمتار تسارع تدريجي'], precautions: '—', prog: null, reg: null },
  { id: 'decel', nameAr: 'التباطؤ والتوقف', nameEn: 'Deceleration drill', cat: 'Agility', phases: [6], sets: 6, reps: 1, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'run',
    cues: ['جري ثم توقف بثلاث خطوات متحكم بها'], precautions: '—', prog: null, reg: null },
  { id: 'shuffle', nameAr: 'الحركة الجانبية السريعة', nameEn: 'Lateral shuffle', cat: 'Agility', phases: [6], sets: 4, reps: 1, hold: 20, freq: 'مرتين أسبوعيًا', motion: 'squat',
    cues: ['وضعية منخفضة وخطوات جانبية سريعة'], precautions: '—', prog: null, reg: 'lateral_walk' },
  { id: 'cut45', nameAr: 'تغيير الاتجاه 45° المخطط', nameEn: 'Planned 45° cutting', cat: 'COD', phases: [6], sets: 3, reps: 6, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'run',
    cues: ['جري ثم تغيير اتجاه عند القمع'], precautions: 'مخطط قبل التفاعلي.', prog: 'cut90', reg: null },
  { id: 'cut90', nameAr: 'تغيير الاتجاه 90°', nameEn: '90° cutting', cat: 'COD', phases: [6], sets: 3, reps: 6, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'run',
    cues: ['تباطؤ ثم دفع جانبي'], precautions: '—', prog: 'reactive', reg: 'cut45' },
  { id: 'reactive', nameAr: 'تغيير الاتجاه التفاعلي', nameEn: 'Reactive agility', cat: 'COD', phases: [6], sets: 3, reps: 6, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'run',
    cues: ['غيّر الاتجاه حسب إشارة المدرب'], precautions: 'آخر خطوة قبل التدريب مع الفريق.', prog: null, reg: 'cut90' },
  { id: 'fb_passing', nameAr: 'التمرير بالكرة', nameEn: 'Football passing', cat: 'Sport', sport: 'football', phases: [6], sets: 3, reps: 20, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'run',
    cues: ['تمرير قصير ثم طويل بالقدمين'], precautions: '—', prog: 'fb_dribble', reg: null },
  { id: 'fb_dribble', nameAr: 'المراوغة بين الأقماع', nameEn: 'Dribbling slalom', cat: 'Sport', sport: 'football', phases: [6], sets: 4, reps: 1, hold: 0, freq: 'مرتين أسبوعيًا', motion: 'run',
    cues: ['مراوغة بسرعة متزايدة'], precautions: '—', prog: null, reg: 'fb_passing' },
];

export const RUN_PROGRAM = [
  { level: 1, textAr: '5 د مشي + (1 د هرولة / 2 د مشي) × 5' },
  { level: 2, textAr: '5 د مشي + (2 د هرولة / 2 د مشي) × 5' },
  { level: 3, textAr: '5 د مشي + (3 د هرولة / 1 د مشي) × 5' },
  { level: 4, textAr: '5 د مشي + (5 د هرولة / 1 د مشي) × 3' },
  { level: 5, textAr: '20 د هرولة مستمرة' },
  { level: 6, textAr: '25–30 د جري مع تغيير السرعة' },
];

export const PLYO_LEVELS = [
  { level: 1, nameAr: 'المستوى 1 — القفز على الرجلين', ex: ['dl_jump', 'box_jump'] },
  { level: 2, nameAr: 'المستوى 2 — الهبوط والقفز العمودي', ex: ['drop_land', 'cmj', 'broad_jump'] },
  { level: 3, nameAr: 'المستوى 3 — رجل واحدة', ex: ['sl_hop_stick', 'lateral_hop'] },
];

export const EDUCATION = [
  { id: 'ed_expect', titleAr: 'ماذا أتوقع بعد عملية الرباط الصليبي؟', phases: [1], minutes: 2, cat: 'قبل وبعد العملية',
    body: ['الأسابيع الأولى هدفها حماية العملية والسيطرة على التورم واستعادة فرد الركبة.', 'التقدم في البرنامج لا يعتمد على التاريخ فقط، بل على تحقيق معايير يراجعها أخصائيك.', 'العودة للرياضة تأخذ عادة 9 أشهر أو أكثر، وفريقك يحدد الجاهزية بالاختبارات.'] },
  { id: 'ed_swelling', titleAr: 'الألم والتورم: ماذا أفعل؟', phases: [1, 2], minutes: 2, cat: 'الألم والتورم',
    body: ['الثلج 15–20 دقيقة مع رفع الساق أعلى من مستوى القلب يخففان التورم.', 'خذ الأدوية كما وصفها طبيبك فقط.', 'ألم 0–2 بعد التمرين مقبول، وإذا زاد الألم والتورم في اليوم التالي خفف الجرعة وأخبر أخصائيك.'] },
  { id: 'ed_redflags', titleAr: 'علامات تستدعي التواصل مع الفريق فورًا', phases: [1, 2, 3], minutes: 1, cat: 'السلامة', pinned: true,
    body: ['ألم أو تورم أو احمرار في الساق أو السمانة.', 'ضيق في التنفس أو ألم في الصدر: اتصل بالإسعاف 997 فورًا.', 'حرارة 38° أو أعلى مع احمرار أو إفرازات من الجرح.', 'انفتاح الجرح أو نزيف لا يتوقف.', 'خدر أو برودة أو تغير لون القدم.', 'تورم مفاجئ كبير أو ألم شديد لا يخف.'] },
  { id: 'ed_extension', titleAr: 'لماذا فرد الركبة الكامل أهم شيء الآن؟', phases: [1, 2], minutes: 2, cat: 'التمارين',
    body: ['فقدان الفرد المبكر قد يسبب عرجًا وألمًا أماميًا ويؤخر التأهيل.', 'ضع اللفافة تحت الكعب وليس تحت الركبة.', 'لا تنم والوسادة تحت ركبتك.'] },
  { id: 'ed_crutches', titleAr: 'العكازات والدعامة حسب تعليمات الجراح', phases: [1], minutes: 1, cat: 'الحماية',
    body: ['مقدار التحميل على الساق يحدده الجراح ويظهر في ملفك.', 'عند إصلاح الغضروف الهلالي قد تختلف القيود؛ التزم بما في خطتك.'] },
  { id: 'ed_why', titleAr: 'لماذا التمارين مهمة؟ وكيف ألتزم؟', phases: [1, 2, 3], minutes: 2, cat: 'التمارين',
    body: ['التمرين المنتظم يعيد الحركة والقوة ويحمي الطعم الجديد.', 'اربط التمارين بعادة يومية: بعد صلاة الفجر أو بعد المغرب مثلًا.', 'إذا فاتك يوم فلا تضاعف الجرعة في اليوم التالي.'] },
  { id: 'ed_graft', titleAr: 'حماية الطعم بلغة بسيطة', phases: [1, 2, 3], minutes: 2, cat: 'الحماية',
    body: ['الطعم الجديد يحتاج شهورًا ليتحول إلى رباط قوي.', 'لهذا نتدرج في التمارين ولا نقفز للجري أو الالتفاف مبكرًا حتى لو شعرت أنك بخير.'] },
  { id: 'ed_sleep', titleAr: 'النوم والتعافي', phases: [1, 2, 3, 4, 5, 6], minutes: 1, cat: 'التعافي',
    body: ['النوم الجيد يساعد على التئام الأنسجة وتحمل التمارين.', 'في البداية قد تساعدك وسادة بين الركبتين عند النوم على الجنب.'] },
  { id: 'ed_nutrition', titleAr: 'التغذية العامة للتعافي', phases: [1, 2, 3, 4, 5, 6], minutes: 1, cat: 'التعافي',
    body: ['وزّع البروتين على الوجبات واشرب الماء بانتظام، خصوصًا في الصيف.', 'هذه معلومات عامة؛ لأي حمية خاصة راجع أخصائي التغذية.'] },
  { id: 'ed_prayer', titleAr: 'العودة للصلاة: الكرسي ثم السجود ثم التشهد', phases: [1, 2, 3], minutes: 2, cat: 'الحياة اليومية',
    body: ['في البداية تصلي جالسًا على كرسي إذا كان القيام أو السجود صعبًا.', 'السجود يحتاج ثنيًا للركبة يقارب 116°، وجلسة التشهد قرابة 150°، لذلك يعودان تدريجيًا وبإذن أخصائيك.', 'بعد إصلاح الغضروف الهلالي يُمنع غالبًا الثني العميق تحت الحمل لفترة يحددها الجراح.'] },
  { id: 'ed_driving', titleAr: 'متى أعود لقيادة السيارة؟', phases: [2, 3], minutes: 1, cat: 'الحياة اليومية',
    body: ['القرار طبي: عندما تتحكم بالرجل جيدًا وتستطيع الضغط على الفرامل بسرعة.', 'لا تقد إذا كنت تتناول دواءً يسبب النعاس.'] },
  { id: 'ed_work', titleAr: 'العودة للعمل أو الدراسة', phases: [2, 3], minutes: 1, cat: 'الحياة اليومية',
    body: ['العمل المكتبي غالبًا أبكر من العمل الذي يحتاج وقوفًا طويلًا أو حملًا.', 'ناقش طبيعة عملك مع أخصائيك لتخطيط التدرج.'] },
  { id: 'ed_running', titleAr: 'العودة للجري: كيف أعرف أني جاهز؟', phases: [3, 4], minutes: 2, cat: 'العودة للنشاط',
    body: ['الجري لا يبدأ بتاريخ، بل بعد تقييم حضوري يتحقق من الفرد والتورم والقوة والقفز الخفيف.', 'بعد كل جلسة جري سجل الألم أثناءها وبعدها والتورم صباح اليوم التالي.', 'في الصيف اختر الصباح الباكر أو بعد المغرب، أو الجري داخل صالة.'] },
  { id: 'ed_rts', titleAr: 'العودة للرياضة: معايير لا تاريخ', phases: [5, 6], minutes: 2, cat: 'العودة للنشاط',
    body: ['العودة تمر بثلاث خطوات: المشاركة الجزئية، ثم العودة للرياضة، ثم العودة لمستوى الأداء.', 'كل خطوة تحتاج اعتمادًا من فريقك بعد اختبارات القوة والقفز والجاهزية النفسية.'] },
  { id: 'ed_fear', titleAr: 'الخوف من الإصابة مرة أخرى', phases: [4, 5, 6], minutes: 2, cat: 'الجانب النفسي',
    body: ['الخوف شعور طبيعي، ويُقاس بمقياس ACL-RSI ليساعدك فريقك عليه.', 'التدرج في المهام المخيفة مع النجاح المتكرر يبني الثقة.', 'تحدث مع أخصائيك عن المواقف التي تقلقك.'] },
  { id: 'ed_ramadan', titleAr: 'التمارين في رمضان', phases: [1, 2, 3, 4, 5, 6], minutes: 1, cat: 'الحياة اليومية',
    body: ['أفضل وقت للتمارين بعد الإفطار بساعة أو قبل السحور.', 'اشرب كمية كافية من الماء بين الإفطار والسحور.', 'أخصائيك قد يعدل الجرعة خلال الشهر.'] },
];

export const QUESTIONNAIRES = [
  { id: 'ikdc', nameAr: 'IKDC — نموذج تقييم الركبة', nameEn: 'IKDC Subjective Knee Form', items: 18, range: '0–100', schedule: ['البداية', '6 أسابيع', '3 أشهر', '6 أشهر', '9 أشهر / العودة للرياضة', 'الخروج'], higherBetter: true },
  { id: 'aclrsi', nameAr: 'ACL-RSI — الجاهزية النفسية', nameEn: 'ACL Return to Sport after Injury', items: 12, range: '0–100', schedule: ['4 أشهر', '6 أشهر', '9 أشهر / العودة للرياضة'], higherBetter: true },
  { id: 'sane', nameAr: 'SANE — تقييم وظيفة الركبة بسؤال واحد', nameEn: 'Single Assessment Numeric Evaluation', items: 1, range: '0–100%', schedule: ['أسبوعيًا'], higherBetter: true },
  { id: 'tsk', nameAr: 'TSK-11 — الخوف من الحركة', nameEn: 'Tampa Scale of Kinesiophobia', items: 11, range: '11–44', schedule: ['عند الحاجة'], higherBetter: false },
];

// Alert rules. `level` red = clinical alert, yellow = needs review. Thresholds are examples for
// the clinical lead to approve before go-live.
export const ALERT_RULES = [
  { id: 'r_calf', level: 'red', nameAr: 'ألم أو تورم في الساق/السمانة', why: 'قد يشير إلى جلطة وريدية عميقة', enabled: true },
  { id: 'r_breath', level: 'red', nameAr: 'ضيق تنفس أو ألم صدر', why: 'قد يشير إلى انصمام رئوي — طوارئ', enabled: true },
  { id: 'r_infect', level: 'red', nameAr: 'حرارة 38° أو أعلى مع احمرار/حرارة موضعية أو إفرازات', why: 'قد يشير إلى عدوى', enabled: true },
  { id: 'r_wound', level: 'red', nameAr: 'مشكلة في الجرح يبلغ عنها المريض', why: 'انفتاح أو إفرازات أو نزيف', enabled: true },
  { id: 'r_spike', level: 'red', nameAr: 'ألم 8/10 أو أكثر بزيادة 3 نقاط عن متوسطه', why: 'تدهور مفاجئ واضح', enabled: true },
  { id: 'r_givingway', level: 'red', nameAr: 'عدم ثبات (Giving way) مرتين أو أكثر خلال 7 أيام', why: 'قد يشير إلى مشكلة في الطعم أو الغضروف', enabled: true },
  { id: 'r_freetext', level: 'red', nameAr: 'كلمات خطر في النص الحر (صدر، تنفس، صديد...)', why: 'شبكة أمان إضافية للأسئلة المنظمة', enabled: true },
  { id: 'y_adherence', level: 'yellow', nameAr: 'التزام أقل من 50% خلال 7 أيام', why: 'خطر الانقطاع', enabled: true },
  { id: 'y_nodata', level: 'yellow', nameAr: 'لا تسجيل يومي منذ 3 أيام', why: 'انقطاع البيانات', enabled: true },
  { id: 'y_paintrend', level: 'yellow', nameAr: 'اتجاه الألم يزداد (متوسط 3 أيام أعلى بنقطتين)', why: 'قد يحتاج تعديل الجرعة', enabled: true },
  { id: 'y_swelling', level: 'yellow', nameAr: 'التورم "أكثر" 3 أيام متتالية', why: 'استجابة غير مناسبة للحمل', enabled: true },
  { id: 'y_trajectory', level: 'yellow', nameAr: 'خارج المسار المتوقع: فرد ناقص 3° أو أكثر بعد اليوم 21، أو ثني أقل من 110° بعد اليوم 28', why: 'نقص الفرد عند 6 أسابيع رفع خطر إعادة العملية بسبب Cyclops ‏7.96 مرة (Delaloye 2020)', enabled: true },
  { id: 'y_plateau', level: 'yellow', nameAr: 'توقف تحسن الثني 14 يومًا', why: 'ثبات التقدم', enabled: true },
  { id: 'y_psych', level: 'yellow', nameAr: 'ACL-RSI أقل من 60 في المراحل المتقدمة', why: 'جاهزية نفسية منخفضة', enabled: true },
  { id: 'y_missed', level: 'yellow', nameAr: 'تفويت موعد افتراضي', why: 'متابعة الالتزام', enabled: true },
];

export const RED_WORDS = ['صدر', 'تنفس', 'نفسي ضيق', 'ضيق', 'صديد', 'إفراز', 'افراز', 'نزيف', 'ينزف', 'خدر', 'تنميل', 'برودة', 'سمانة', 'الربلة', 'الساق منتفخ', 'حرارة', 'حمى', 'سخونة', 'دوخة', 'إغماء', 'اغماء'];

// Expected recovery corridor ("growth chart"). Anchors from Adams et al. JOSPT 2012: full extension and
// flexion >110° by week 2, flexion within 10° of the other knee by week 4, full range by weeks 6–8.
// The clinical team owns these numbers.
export const CORRIDOR = {
  source: 'Adams 2012 — يضبطه الفريق',
  flex: [
    { x: 3, lo: 60, hi: 90 }, { x: 7, lo: 80, hi: 105 }, { x: 14, lo: 105, hi: 120 }, { x: 21, lo: 112, hi: 128 },
    { x: 28, lo: 118, hi: 135 }, { x: 42, lo: 125, hi: 142 }, { x: 56, lo: 130, hi: 146 }, { x: 84, lo: 133, hi: 150 },
    { x: 120, lo: 135, hi: 150 }, { x: 180, lo: 135, hi: 150 }, { x: 270, lo: 135, hi: 150 },
  ],
  ext: [
    { x: 3, lo: 0, hi: 6 }, { x: 7, lo: 0, hi: 3 }, { x: 14, lo: 0, hi: 0 }, { x: 28, lo: 0, hi: 0 }, { x: 84, lo: 0, hi: 0 }, { x: 270, lo: 0, hi: 0 },
  ],
};

export const MILESTONES = [
  { id: 'm_ext', textAr: 'فرد كامل للركبة', test: (p) => p.latest.extDeficit <= 0 },
  { id: 'm_slr', textAr: 'رفع الساق بدون تأخر', test: (p) => p.latest.slrLag === false },
  { id: 'm_chair', textAr: 'الصلاة على الكرسي بثبات', test: (p) => p.day >= 5 },
  { id: 'm_flex90', textAr: 'ثني 90°', test: (p) => p.latest.flex >= 90 },
  { id: 'm_walk', textAr: 'مشي طبيعي بدون عكازات', test: (p) => p.latest.gait === true && p.day > 14 },
  { id: 'm_bike', textAr: 'دورة كاملة على الدراجة', test: (p) => p.latest.flex >= 110 },
  { id: 'm_flex120', textAr: 'ثني 120°', test: (p) => p.latest.flex >= 120 },
  { id: 'm_sujood', textAr: 'السجود — يحتاج ثنيًا 116° تقريبًا (بإذن الفريق)', test: (p) => p.latest.flex >= 120 && p.phase >= 2 && !p.meniscusRepairActive },
  { id: 'm_strength', textAr: 'إنهاء مرحلة القوة', test: (p) => p.phase >= 4 },
  { id: 'm_run', textAr: 'العودة للجري', test: (p) => p.phase >= 4 },
  { id: 'm_tashahhud', textAr: 'جلسة التشهد — ثني عميق 150° تقريبًا (بإذن الفريق)', test: (p) => p.latest.flex >= 145 && p.phase >= 3 && !p.meniscusRepairActive },
  { id: 'm_plyo', textAr: 'القفز والهبوط', test: (p) => p.phase >= 5 },
  { id: 'm_rts', textAr: 'اختبارات العودة للرياضة', test: (p) => p.rtsStage >= 1 },
];

export const RTS_CONTINUUM = [
  { id: 1, nameAr: 'العودة للمشاركة', nameEn: 'Return to Participation', descAr: 'مشاركة جزئية في التدريب' },
  { id: 2, nameAr: 'العودة للرياضة', nameEn: 'Return to Sport', descAr: 'عودة لرياضته دون الوصول لمستواه السابق بالضرورة' },
  { id: 3, nameAr: 'العودة للأداء', nameEn: 'Return to Performance', descAr: 'عودة لمستوى الأداء المطلوب أو أعلى' },
];

export const EMERGENCY = { ambulance: '997', clinicLine: '— يحدده المركز —', note: 'الأرقام قابلة للضبط حسب مسار المنشأة' };
