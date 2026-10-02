// Demo data: 38 active patients (10 hand-written scenarios + 28 generated) and 16 discharged
// patients for the management dashboard. Every name and number is fictional. Dates are relative
// to today, so the demo always looks current. Deterministic: the same on every open.
import * as D from './data.js';
import { TODAY, addDays, rng, noise, clamp, round } from './util.js';

export const DEMO_CLINICIAN = 'أ. سامي الأنصاري';
export const DEMO_SURGEONS = ['د. عادل المحمدي', 'د. هشام الرحيلي', 'د. ماجد الصاعدي'];
const PTS = ['أ. سامي الأنصاري', 'أ. منى الحازمي', 'أ. بدر السهلي'];

const PHASE_DAYS = { 2: 15, 3: 46, 4: 100, 5: 150, 6: 205 };
const EXMAP = Object.fromEntries(D.EXERCISES.map((e) => [e.id, e]));

function phaseForDay(day) {
  let ph = 1;
  for (const [p, d] of Object.entries(PHASE_DAYS)) if (day >= d) ph = Number(p);
  return ph;
}

function programFor(phase, graft, meniscus, r) {
  const pick = {
    1: ['ankle_pumps', 'quad_sets', 'heel_slides', 'heel_prop', 'slr', 'patellar_mob', 'weight_shift'],
    2: ['heel_prop', 'slr', 'bike', 'mini_squat', 'bridge', 'step_up', 'leg_press', graft === 'HS' ? 'sls_balance' : 'ham_curl'],
    3: ['bike', 'split_squat', 'step_down', 'sl_rdl', 'knee_ext_okc', 'goblet_squat', 'sl_leg_press', 'unstable_balance', 'lateral_walk'],
    4: ['walk_jog', 'pogo', 'split_squat', 'reverse_lunge', 'sl_leg_press', 'knee_ext_okc', 'sl_rdl', 'y_balance'],
    5: ['treadmill_run', 'dl_jump', 'box_jump', 'reverse_lunge', 'goblet_squat', 'sl_leg_press', 'nordic', 'y_balance'],
    6: ['treadmill_run', 'accel', 'decel', 'shuffle', 'cut45', 'cut90', 'fb_passing', 'fb_dribble', 'nordic', 'sl_hop_stick'],
  }[phase];
  return pick.filter((id) => !(meniscus && phase <= 2 && ['mini_squat', 'leg_press'].includes(id) && r() < 0.0)).map((id) => {
    const ex = EXMAP[id];
    return { exId: id, sets: ex.sets, reps: ex.reps, hold: ex.hold, freq: ex.freq, note: '' };
  });
}

function build(spec) {
  const r = rng(spec.id);
  const day = spec.day;
  const surgeryDate = addDays(TODAY, -day);
  const phase = spec.phase ?? phaseForDay(day);
  const p = {
    id: spec.id, name: spec.name, sex: spec.sex, age: spec.age, mrn: spec.mrn || `DEMO-${String(Math.floor(r() * 90000) + 10000)}`,
    phone: '05XXXXXXXX', side: spec.side || (r() < 0.55 ? 'R' : 'L'),
    injuryDate: addDays(surgeryDate, -(spec.waitDays ?? Math.round(30 + r() * 90))), surgeryDate,
    surgery: 'ACL reconstruction', graft: spec.graft || (r() < 0.45 ? 'BPTB' : r() < 0.7 ? 'HS' : 'QT'),
    meniscusRepair: Boolean(spec.meniscusRepair), meniscectomy: Boolean(spec.meniscectomy), additional: spec.additional || '',
    surgeon: spec.surgeon || DEMO_SURGEONS[Math.floor(r() * 3)], pt: spec.pt || PTS[Math.floor(r() * 3)],
    surgeonInstructions: spec.surgeonInstructions || 'تحميل حسب التحمل بالعكازات حتى المشي الطبيعي. بدون دعامة.',
    wb: spec.wb || 'تحميل حسب التحمل (WBAT)', brace: spec.brace || 'بدون دعامة', romRestriction: spec.romRestriction || 'لا قيود',
    comorbidities: spec.comorbidities || 'لا يوجد', tegnerPre: spec.tegnerPre ?? Math.round(5 + r() * 4),
    sport: spec.sport || 'كرة القدم', sportLevel: spec.sportLevel || 'Recreational', goal: spec.goal || 'العودة للعب كرة القدم مع الأصدقاء',
    modifiers: spec.modifiers || [], phase, phaseHistory: [], plyoLevel: spec.plyoLevel ?? (phase >= 5 ? 1 : 0), rtsStage: spec.rtsStage || 0,
    sportDrillsDone: Boolean(spec.sportDrillsDone), contralateral: { flex: spec.otherFlex || 145, ext: 0 },
    program: [], checkins: [], exlog: [], rom: [], assessments: [], strength: [], hops: [], jumps: [], loads: [], proms: [],
    appointments: [], runs: [], messages: [], acks: {}, notes: [], restDays: [], measures: [],
  };
  if (p.graft === 'HS' && !spec.modifiers) p.modifiers = [{ id: 'mod_hs', textAr: 'طعم هامسترينج: بدون مقاومة لثني الركبة حتى الأسبوع 6', untilDay: 42 }];
  // phase history
  for (let ph = 2; ph <= phase; ph++) {
    const d = spec.phaseDays?.[ph] ?? PHASE_DAYS[ph] + Math.round(noise(r, 4));
    p.phaseHistory.push({ phase: ph, day: Math.min(d, day - 1), by: p.pt });
  }
  const phaseStart = (ph) => (ph === 1 ? 0 : p.phaseHistory.find((h) => h.phase === ph)?.day ?? 0);
  p.program = spec.program || programFor(phase, p.graft, p.meniscusRepair, r);
  p.programHistory = [];
  for (let ph = 1; ph < phase; ph++) p.programHistory.push({ fromDay: phaseStart(ph), program: programFor(ph, p.graft, p.meniscusRepair, r) });
  p.programHistory.push({ fromDay: phaseStart(phase), program: p.program });

  // curves
  const otherFlex = p.contralateral.flex;
  const flexMax = spec.flexMax ?? otherFlex - Math.round(r() * 4);
  const tau = spec.flexTau ?? 13 + r() * 4;
  const flexAt = spec.flexAt || ((d) => flexMax - (flexMax - 55) * Math.exp(-Math.max(0, d - 2) / tau));
  const extAt = spec.extAt || ((d) => 7 * Math.exp(-d / 4.5));
  const painAt = spec.painAt || ((d) => 1 + 5.5 * Math.exp(-d / 9));
  const adh = spec.adherence ?? 0.82 + r() * 0.14;
  const lastCheckinDay = day - (spec.noDataDays ?? 0);
  const checkToday = spec.checkedInToday ?? r() < 0.55;

  // daily check-ins and exercise logs
  for (let d = 1; d <= day; d++) {
    const daily = d < 42 || d % 2 === 0 || d > day - 6;
    const isToday = d === day;
    if (d > lastCheckinDay) continue;
    if (isToday && !checkToday && !spec.todayCheckin) continue;
    if (daily) {
      const pain = clamp(Math.round(painAt(d) + noise(r, 1.1)), 0, 10);
      const prev = p.checkins[p.checkins.length - 1];
      const swelling = prev ? (pain > prev.pain ? 'more' : pain < prev.pain ? 'less' : 'same') : 'same';
      const c = { day: d, pain, swelling, givingWay: false, warmth: false, calf: false, breath: false, fever: false, wound: false, note: '', sites: [], confidence: clamp(Math.round(4 + d / 30 + noise(r, 1.2)), 1, 10), ts: addDays(surgeryDate, d).getTime() + (8 + Math.floor(r() * 12)) * 3600000 };
      if (spec.checkinOverride?.[d]) Object.assign(c, spec.checkinOverride[d]);
      if (isToday && spec.todayCheckin) Object.assign(c, spec.todayCheckin);
      p.checkins.push(c);
    }
    if (isToday && spec.todayExercisesDone === 0) continue;
    const prog = programOnDay(p, d);
    const dayAdh = (spec.adherenceAt ? spec.adherenceAt(d) : adh) * (isToday ? 0.5 : 1);
    for (const it of prog) {
      const ex = EXMAP[it.exId];
      if (!ex) continue;
      if (!isDue(it, ex, d)) continue;
      if (r() < dayAdh) p.exlog.push({ day: d, exId: it.exId, done: true, painDuring: clamp(Math.round(painAt(d) - 1 + noise(r, 1)), 0, 10), difficulty: clamp(Math.round(5 + noise(r, 2)), 1, 10) });
    }
  }

  // ROM: home every ~5 days, clinic on assessment days
  const clinicDays = [2, 10, 24, 42, 70, 98, 126, 168, 210, 252].filter((d) => d < day);
  if (spec.extraClinicDay && spec.extraClinicDay < day) clinicDays.push(spec.extraClinicDay);
  clinicDays.sort((a, b) => a - b);
  for (let d = 4; d < day; d += 5) {
    if (d > lastCheckinDay) break;
    if (d > 150) break;
    const src = d < 21 ? 'phone' : r() < 0.5 ? 'camera' : 'photo';
    p.rom.push({ day: d, flex: Math.round(flexAt(d) + noise(r, 3)), ext: Math.max(0, Math.round(extAt(d) + noise(r, 1))), source: src });
  }
  for (const d of clinicDays) {
    p.rom.push({ day: d, flex: Math.round(flexAt(d) + noise(r, 1.5)), ext: Math.max(0, Math.round(extAt(d))), source: 'clinic' });
    const eff = d < 7 ? 3 : d < 20 ? 2 : d < 40 ? 1 : (r() < 0.75 ? 0 : 1);
    p.assessments.push({
      day: d, effusion: spec.effusionAt ? spec.effusionAt(d) : eff, slrLag: d < 9, gait: d >= (spec.gaitDay ?? 20), sls: d < 20 ? 0 : d < 35 ? 18 : 30 + Math.round(r() * 15),
      landingQuality: d >= (spec.landingDay ?? 90), hopPrereq: d >= (spec.hopDay ?? 90), by: p.pt,
    });
    p.appointments.push({ id: `${p.id}_ap_${d}`, day: d, hour: 9 + Math.floor(r() * 6), type: 'inperson', purpose: d < 5 ? 'التقييم الأولي' : 'تقييم حضوري', status: 'done' });
  }
  p.rom.sort((a, b) => a.day - b.day);
  // virtual visits between clinic visits
  for (let d = 7; d < day; d += 7) {
    if (clinicDays.some((c) => Math.abs(c - d) < 3)) continue;
    const missed = spec.missedDay === d;
    p.appointments.push({ id: `${p.id}_vv_${d}`, day: d, hour: 10 + Math.floor(r() * 5), type: 'virtual', purpose: 'عيادة افتراضية', status: missed ? 'missed' : 'done' });
  }
  // upcoming
  const nextV = spec.nextVirtual ?? 2 + Math.floor(r() * 4);
  p.appointments.push({ id: `${p.id}_next_v`, day: day + nextV, hour: 10, type: 'virtual', purpose: 'عيادة افتراضية', status: 'scheduled' });
  const nextIP = spec.nextInPerson ?? 7 + Math.floor(r() * 10);
  p.appointments.push({ id: `${p.id}_next_ip`, day: day + nextIP, hour: 9, type: 'inperson', purpose: phase >= 3 ? 'تقييم القوة والاختبارات الوظيفية' : 'تقييم حضوري للمدى والتورم', status: 'scheduled' });
  p.appointments.sort((a, b) => a.day - b.day);

  // strength, hops, jumps
  const strengthDays = [84, 120, 168, 210, 252].filter((d) => d < day);
  if (spec.extraClinicDay && spec.extraClinicDay < day && phase >= 3) { strengthDays.push(spec.extraClinicDay); strengthDays.sort((a, b) => a - b); }
  for (const d of strengthDays) {
    const q = spec.quadAt ? spec.quadAt(d) : clamp(58 + d * 0.16 + noise(r, 3), 50, 100);
    const h = clamp((p.graft === 'HS' ? 72 : 82) + d * 0.07 + noise(r, 3), 55, 102);
    const other = 210 + Math.round(r() * 40);
    const hOther = 120 + Math.round(r() * 25);
    p.strength.push({ day: d, method: d < 150 ? 'HHD' : 'Isokinetic 60°/s', quadOp: Math.round((other * q) / 100), quadOther: other, hamOp: Math.round((hOther * (spec.hamAt ? spec.hamAt(d) : h)) / 100), hamOther: hOther });
  }
  for (const d of [168, 210, 252].filter((x) => x < day)) {
    const base = spec.hopAt ? spec.hopAt(d) : clamp(70 + d * 0.09 + noise(r, 2), 60, 100);
    p.hops.push({ day: d, single: round(base + noise(r, 2)), triple: round(base + 1 + noise(r, 2)), crossover: round(base - 1 + noise(r, 2)), timed: round(base + 2 + noise(r, 2)) });
    const cmjOther = 30 + Math.round(r() * 8);
    p.jumps.push({ day: d, cmjOp: round((cmjOther * clamp(base - 2 + noise(r, 2), 60, 100)) / 100, 1), cmjOther });
  }
  // loads (kg) for loaded exercises
  for (const exId of ['leg_press', 'sl_leg_press', 'knee_ext_okc', 'goblet_squat']) {
    const startDay = { leg_press: 35, sl_leg_press: 60, knee_ext_okc: 60, goblet_squat: 70 }[exId];
    const k0 = { leg_press: 30, sl_leg_press: 20, knee_ext_okc: 5, goblet_squat: 8 }[exId];
    const step = { leg_press: 5, sl_leg_press: 3.5, knee_ext_okc: 1.5, goblet_squat: 2 }[exId];
    for (let d = startDay, w = 0; d < Math.min(day, 240); d += 7, w++) p.loads.push({ exId, day: d, kg: Math.round(k0 + step * w + noise(r, 2)) });
  }
  // PROMs
  const ikdcAt = (d) => clamp(46 + d * 0.16 + noise(r, 3), 30, 98);
  for (const d of [0, 42, 90, 180, 240, 270].filter((x) => x <= day)) p.proms.push({ day: d, ikdc: Math.round(spec.ikdcAt ? spec.ikdcAt(d) : ikdcAt(d)) });
  for (const d of [120, 180, 240].filter((x) => x <= day)) p.proms.push({ day: d, aclrsi: Math.round(spec.rsiAt ? spec.rsiAt(d) : clamp(52 + d * 0.08 + noise(r, 4), 20, 100)) });
  for (let d = 7; d <= day; d += 7) p.proms.push({ day: d, sane: Math.round(clamp(30 + d * 0.28 + noise(r, 4), 10, 98)) });
  p.proms.sort((a, b) => a.day - b.day);
  // running sessions
  if (phase >= 4) {
    const start = phaseStart(4);
    let level = 1;
    for (let d = start + 1, i = 0; d < day; d += 2, i++) {
      if (phase === 4 || d < phaseStart(5)) {
        const pd = clamp(Math.round(2 + noise(r, 1.2)), 0, 10);
        const pa = clamp(Math.round(pd - 0.5 + noise(r, 1)), 0, 10);
        p.runs.push({ day: d, level, painDuring: pd, painAfter: pa, swelling: pa >= 4 ? 'mild' : 'none', completed: pa > 5 ? 'partial' : 'yes' });
        if (i % 3 === 2 && level < 6) level += 1;
      }
    }
    p.runLevel = level;
  }
  // messages
  p.messages = spec.messages || [
    { id: `${p.id}_m1`, from: 'pt', text: 'أهلًا بك في البرنامج. سجّل حالة ركبتك يوميًا قبل التمارين، ولا تتردد في السؤال.', ts: addDays(surgeryDate, 2).getTime() + 10 * 3600000 },
  ];
  Object.assign(p, spec.extra || {});
  return p;
}
function programOnDay(p, d) { let prog = p.program; for (const h of p.programHistory) if (d >= h.fromDay) prog = h.program; return prog; }
function isDue(item, ex, day) {
  const f = item.freq || ex.freq || '';
  if (f.includes('يوم بعد يوم')) return day % 2 === 0;
  if (f.includes('أسبوعيًا')) {
    const n = f.includes('مرتين') ? 2 : Number((f.match(/(\d+)/) || [0, 3])[1]);
    const slots = n === 2 ? [1, 4] : [0, 2, 4];
    return slots.includes(((day % 7) + 7) % 7);
  }
  return true;
}

const SCENARIOS = [
  { id: 'p_ahmed', name: 'أحمد الحربي', sex: 'M', age: 24, side: 'R', graft: 'BPTB', day: 18, phase: 2, phaseDays: { 2: 15 }, sport: 'كرة القدم', sportLevel: 'Recreational', tegnerPre: 7,
    goal: 'العودة للعب كرة القدم مع الفريق في الحي', checkedInToday: false, todayExercisesDone: 0, adherence: 0.9, nextVirtual: 2, nextInPerson: 6, mrn: 'DEMO-20418', pt: DEMO_CLINICIAN, flexTau: 12,
    messages: [
      { id: 'a1', from: 'pt', text: 'أهلًا أحمد، تم اعتماد انتقالك للمرحلة الثانية. ركّز على فرد الركبة الكامل والدراجة الثابتة.', ts: addDays(TODAY, -3).getTime() + 11 * 3600000 },
      { id: 'a2', from: 'patient', text: 'تمام، متى أقدر أرجع للصلاة واقف بدون كرسي؟', ts: addDays(TODAY, -2).getTime() + 20 * 3600000 },
      { id: 'a3', from: 'pt', text: 'القيام تقدر عليه الآن إذا كان مريح. السجود نتدرج فيه، ونقيّمه في الزيارة القادمة إن شاء الله.', ts: addDays(TODAY, -1).getTime() + 9 * 3600000 },
    ] },
  { id: 'p_sara', name: 'سارة الجهني', sex: 'F', age: 19, side: 'L', graft: 'HS', meniscusRepair: true, day: 9, phase: 1, sport: 'كرة السلة', sportLevel: 'Competitive', tegnerPre: 8,
    goal: 'العودة لفريق كرة السلة في الجامعة', wb: 'تحميل جزئي بالعكازات 4 أسابيع', brace: 'دعامة مقفلة على الفرد للمشي 4 أسابيع', romRestriction: '0–90° لمدة 4 أسابيع',
    surgeonInstructions: 'إصلاح الغضروف الهلالي الداخلي: تحميل جزئي 4 أسابيع، المدى 0–90°، لا ثني تحت حمل أكثر من 90° حتى الشهر الرابع.',
    modifiers: [
      { id: 'mod_mr1', textAr: 'إصلاح الغضروف الهلالي: المدى 0–90° حتى اليوم 28', untilDay: 28 },
      { id: 'mod_mr2', textAr: 'لا ثني تحت حمل أكثر من 90° حتى اليوم 120', untilDay: 120 },
      { id: 'mod_hs', textAr: 'طعم هامسترينج: بدون مقاومة لثني الركبة حتى الأسبوع 6', untilDay: 42 },
    ],
    checkedInToday: true, todayCheckin: { pain: 6, swelling: 'more', calf: true, note: 'الساق اليسار منتفخة شوي وتوجعني تحت الركبة من ورا', sites: ['calf'] }, flexMax: 90, adherence: 0.85 },
  { id: 'p_fahad', name: 'فهد المطيري', sex: 'M', age: 27, side: 'R', graft: 'QT', day: 132, phase: 4, phaseDays: { 2: 14, 3: 44, 4: 104 }, sport: 'كرة القدم', sportLevel: 'Competitive', tegnerPre: 9,
    goal: 'العودة لنادي الدرجة الأولى', quadAt: (d) => (d < 100 ? 74 : 84), extraClinicDay: 102 },
  { id: 'p_khalid', name: 'خالد الشمري', sex: 'M', age: 22, side: 'L', graft: 'BPTB', additional: 'LET', day: 262, phase: 6, phaseDays: { 2: 14, 3: 42, 4: 98, 5: 148, 6: 200 }, sport: 'كرة القدم', sportLevel: 'Competitive', tegnerPre: 9,
    goal: 'العودة للعب الأساسي في الفريق', quadAt: (d) => clamp(60 + d * 0.12, 50, 93), hamAt: () => 95, hopAt: (d) => (d < 220 ? 86 : 93), rsiAt: (d) => (d < 200 ? 49 : 58), ikdcAt: (d) => clamp(48 + d * 0.16, 30, 90), sportDrillsDone: false, rtsStage: 0, plyoLevel: 3 },
  { id: 'p_noura', name: 'نورة السلمي', sex: 'F', age: 31, side: 'R', graft: 'HS', day: 6, phase: 1, sport: 'البادل', sportLevel: 'Recreational', tegnerPre: 5, goal: 'العودة للبادل والمشي اليومي', adherence: 0.3, checkedInToday: false },
  { id: 'p_abdullah', name: 'عبدالله الزهراني', sex: 'M', age: 35, side: 'L', graft: 'BPTB', day: 70, phase: 3, phaseDays: { 2: 16, 3: 52 }, sport: 'البادل', sportLevel: 'Recreational', tegnerPre: 6, goal: 'العودة للبادل مرتين أسبوعيًا',
    painAt: (d) => (d < 66 ? 1 + 5.5 * Math.exp(-d / 9) : Math.min(6, 1.5 + (d - 65) * 1.0)), checkedInToday: true, todayCheckin: { note: 'الألم زاد بعد تمرين القرفصاء بالثقل، خصوصًا تحت الرضفة' } },
  { id: 'p_reem', name: 'ريم القحطاني', sex: 'F', age: 26, side: 'R', graft: 'QT', day: 96, phase: 3, phaseDays: { 2: 14, 3: 44 }, sport: 'الكرة الطائرة', sportLevel: 'Recreational', tegnerPre: 6, goal: 'العودة للكرة الطائرة الترفيهية',
    extraClinicDay: 94, quadAt: (d) => (d < 90 ? 72 : 83), hopDay: 90, landingDay: 90, flexMax: 140, otherFlex: 143 },
  { id: 'p_yousef', name: 'يوسف العنزي', sex: 'M', age: 29, side: 'R', graft: 'HS', meniscectomy: true, day: 33, phase: 2, phaseDays: { 2: 19 }, sport: 'كرة القدم', sportLevel: 'Recreational', tegnerPre: 6,
    extAt: (d) => 5 + 4 * Math.exp(-d / 6), flexTau: 17, gaitDay: 30 },
  { id: 'p_mohammed', name: 'محمد الغامدي', sex: 'M', age: 20, side: 'L', graft: 'BPTB', day: 190, phase: 5, phaseDays: { 2: 13, 3: 42, 4: 95, 5: 152 }, sport: 'كرة القدم', sportLevel: 'Professional', tegnerPre: 10,
    goal: 'العودة للدوري مع النادي', plyoLevel: 1, quadAt: (d) => clamp(62 + d * 0.13, 50, 95) },
  { id: 'p_haifa', name: 'هيفاء المالكي', sex: 'F', age: 41, side: 'L', graft: 'HS', day: 45, phase: 2, phaseDays: { 2: 18 }, sport: 'المشي والهايكنج', sportLevel: 'Recreational', tegnerPre: 4, goal: 'المشي في الهايكنج بدون ألم', noDataDays: 6 },
];

const MALE = ['محمد', 'عبدالعزيز', 'سلطان', 'تركي', 'نايف', 'بندر', 'ماجد', 'فيصل', 'سعود', 'راكان', 'زياد', 'حمد', 'مشعل', 'عبدالرحمن', 'إبراهيم', 'صالح', 'عمر', 'علي', 'ياسر', 'بدر'];
const FEMALE = ['لمى', 'جود', 'ريما', 'أمل', 'شهد', 'منيرة', 'العنود', 'دانة', 'غادة', 'لجين'];
const FAMILY = ['الحربي', 'الجهني', 'الصاعدي', 'الأحمدي', 'المحمدي', 'الردادي', 'السهلي', 'الحازمي', 'الرحيلي', 'المغامسي', 'العتيبي', 'الرشيدي', 'البلوي', 'الجابري', 'العوفي', 'المزيني'];
const SPORTS = [['كرة القدم', 'العودة لكرة القدم'], ['كرة السلة', 'العودة لكرة السلة'], ['البادل', 'العودة للبادل'], ['الجري', 'العودة للجري 10 كم'], ['المشي', 'المشي بدون ألم']];

function generated() {
  const r = rng('generated-patients-v1');
  const issues = ['red_givingway', 'red_wound', 'y_adherence', 'y_adherence', 'y_paintrend', 'y_swelling', 'y_missed', 'y_plateau'];
  const out = [];
  for (let i = 0; i < 28; i++) {
    const female = r() < 0.3;
    const name = `${female ? FEMALE[Math.floor(r() * FEMALE.length)] : MALE[Math.floor(r() * MALE.length)]} ${FAMILY[Math.floor(r() * FAMILY.length)]}`;
    const day = Math.round(5 + r() ** 1.3 * 290);
    const [sport, goal] = SPORTS[Math.floor(r() * SPORTS.length)];
    const spec = { id: `p_g${i}`, name, sex: female ? 'F' : 'M', age: Math.round(17 + r() * 26), day, sport, goal, sportLevel: r() < 0.7 ? 'Recreational' : 'Competitive', checkedInToday: r() < 0.6 };
    const issue = i % 3 === 0 ? issues[i / 3] ?? null : null;
    if (issue === 'red_givingway') { const dd = Math.max(day, 60); spec.day = dd; spec.checkinOverride = { [dd - 1]: { givingWay: true }, [dd - 4]: { givingWay: true } }; }
    if (issue === 'red_wound') { spec.day = 12; spec.checkinOverride = { 11: { wound: true, note: 'في إفرازات خفيفة من الجرح' } }; }
    if (issue === 'y_adherence') spec.adherence = 0.35;
    if (issue === 'y_paintrend') spec.painAt = (d) => (d < day - 5 ? 1.5 : 4.5);
    if (issue === 'y_swelling') { spec.checkinOverride = { [day - 2]: { swelling: 'more' }, [day - 1]: { swelling: 'more' } }; spec.checkedInToday = true; spec.todayCheckin = { swelling: 'more' }; }
    if (issue === 'y_missed') spec.missedDay = Math.floor((day - 5) / 7) * 7;
    if (issue === 'y_plateau') { spec.day = 40; spec.flexAt = (d) => Math.min(104, 55 + d * 2.6); }
    out.push(spec);
  }
  return out;
}

export function buildPatients() {
  return [...SCENARIOS, ...generated()].map(build);
}

export function buildDischarged() {
  const r = rng('discharged-v1');
  const out = [];
  for (let i = 0; i < 16; i++) {
    const dropout = i % 6 === 5;
    out.push({
      id: `d_${i}`, graft: ['BPTB', 'HS', 'QT'][i % 3], durationDays: dropout ? Math.round(40 + r() * 80) : Math.round(250 + r() * 80),
      adherence: Math.round(dropout ? 35 + r() * 20 : 72 + r() * 22), ikdcStart: Math.round(42 + r() * 10), ikdcEnd: dropout ? null : Math.round(78 + r() * 18),
      rts: dropout ? 0 : r() < 0.15 ? 1 : r() < 0.75 ? 2 : 3, inPerson: Math.round(dropout ? 3 + r() * 3 : 9 + r() * 5), virtual: Math.round(dropout ? 2 + r() * 3 : 12 + r() * 8),
      satisfaction: dropout ? null : Math.round((4 + r()) * 10) / 10, dropout, rtrDay: dropout ? null : Math.round(88 + r() * 30),
    });
  }
  return out;
}
