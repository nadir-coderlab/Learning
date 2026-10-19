// Clinical decision-support logic: transparent rules, never a decision.
// Every output carries its reason so the clinician can see why a patient is green, yellow or red.
import * as D from './data.js';
import { TODAY, addDays, daysBetween, mean, last, linreg, round, isoDate } from './util.js';

export const DEFAULT_CATALOG = {
  phases: D.PHASES, gates: D.GATES, exercises: D.EXERCISES, education: D.EDUCATION,
  questionnaires: D.QUESTIONNAIRES, rules: D.ALERT_RULES, corridor: D.CORRIDOR, milestones: D.MILESTONES,
};

export function exMap(cat = DEFAULT_CATALOG) {
  if (!cat._exMap) Object.defineProperty(cat, '_exMap', { value: Object.fromEntries(cat.exercises.map((e) => [e.id, e])), writable: true, enumerable: false });
  return cat._exMap;
}
export function getEx(id, cat = DEFAULT_CATALOG) { return exMap(cat)[id] || cat.exercises.find((e) => e.id === id); }
export function phaseOf(id, cat = DEFAULT_CATALOG) { return cat.phases.find((x) => x.id === id); }

export function postOpDay(p) { return daysBetween(p.surgeryDate, TODAY); }
export function dateOfDay(p, day) { return addDays(p.surgeryDate, day); }
export function weekOf(day) { return Math.floor(day / 7) + 1; }
export const GRAFT_AR = { BPTB: 'وتر الرضفة (BPTB)', HS: 'أوتار الهامسترينج (HS)', QT: 'وتر العضلة الرباعية (QT)', ALLO: 'طعم من متبرع (Allograft)' };
export const SIDE_AR = { R: 'اليمنى', L: 'اليسرى' };

/* ---------- frequency & adherence ---------- */
export function perWeek(freqText = '') {
  if (freqText.includes('يوم بعد يوم')) return 3.5;
  if (freqText.includes('أسبوعيًا')) {
    if (freqText.includes('مرتين')) return 2;
    const m = freqText.match(/(\d+)/);
    return m ? Number(m[1]) : 3;
  }
  if (freqText.includes('قبل الجري')) return 3;
  return 7;
}
// Which days a non-daily exercise is due: spread evenly across the week by post-op day number.
export function isDueOn(item, ex, day) {
  const pw = perWeek(item.freq || ex?.freq);
  if (pw >= 7) return true;
  if (pw === 3.5) return day % 2 === 0;
  const slots = pw === 2 ? [1, 4] : pw === 3 ? [0, 2, 4] : [0, 1, 2, 3, 4, 5, 6].slice(0, Math.round(pw));
  return slots.includes(((day % 7) + 7) % 7);
}
// The programme in force on a given post-op day (programmes change at phase approvals).
export function programOn(p, day) {
  let prog = p.program;
  for (const h of p.programHistory || []) if (day >= h.fromDay) prog = h.program;
  return prog;
}
export function dueToday(p, day = postOpDay(p), cat = DEFAULT_CATALOG) {
  const prog = day >= postOpDay(p) ? p.program : programOn(p, day);
  return prog.filter((it) => isDueOn(it, getEx(it.exId, cat), day));
}
export function doneOn(p, day) { return new Set(p.exlog.filter((l) => l.day === day && l.done).map((l) => l.exId)); }
export function adherence(p, days = 7, cat = DEFAULT_CATALOG) {
  const today = postOpDay(p);
  let planned = 0; let done = 0;
  for (let d = today - days; d < today; d++) {
    if (d < 1) continue;
    const due = dueToday(p, d, cat);
    const ok = doneOn(p, d);
    planned += due.length;
    done += due.filter((it) => ok.has(it.exId)).length;
  }
  return { pct: planned ? Math.round((done / planned) * 100) : null, done, planned };
}
export function adherenceByDay(p, days = 14, cat = DEFAULT_CATALOG) {
  const today = postOpDay(p);
  const out = [];
  for (let d = today - days + 1; d <= today; d++) {
    if (d < 1) continue;
    const due = dueToday(p, d, cat);
    const ok = doneOn(p, d);
    const n = due.filter((it) => ok.has(it.exId)).length;
    out.push({ day: d, pct: due.length ? Math.round((n / due.length) * 100) : 0, done: n, planned: due.length, rest: due.length === 0 });
  }
  return out;
}
export function streak(p, cat = DEFAULT_CATALOG) {
  // consecutive days (ending yesterday or today) with ≥ 80% of due exercises, or a clinician-approved rest day
  let s = 0;
  const today = postOpDay(p);
  const ok = (d) => {
    if ((p.restDays || []).includes(d)) return true;
    const due = dueToday(p, d, cat); const done = doneOn(p, d);
    return due.length && due.filter((it) => done.has(it.exId)).length / due.length >= 0.8;
  };
  let d = ok(today) ? today : today - 1;
  while (d >= 1 && ok(d)) { s += 1; d -= 1; }
  return s;
}

/* ---------- latest values ---------- */
export function latestRom(p, preferClinicWithin = 0) {
  const all = p.rom || [];
  if (preferClinicWithin) {
    const c = last(all.filter((r) => r.source === 'clinic'));
    if (c && postOpDay(p) - c.day <= preferClinicWithin) return c;
  }
  return last(all);
}
export function lastWhere(arr, fn) { for (let i = (arr || []).length - 1; i >= 0; i--) if (fn(arr[i])) return arr[i]; return undefined; }

export function latest(p) {
  const today = postOpDay(p);
  const flexRec = lastWhere(p.rom, (r) => Number.isFinite(r.flex));
  const extRec = lastWhere(p.rom, (r) => Number.isFinite(r.ext));
  const a = last(p.assessments);
  const st = last(p.strength);
  const hop = last(p.hops);
  const jump = last(p.jumps);
  const ikdc = lastWhere(p.proms, (x) => Number.isFinite(x.ikdc));
  const rsi = lastWhere(p.proms, (x) => Number.isFinite(x.aclrsi));
  const recentPain = (p.checkins || []).filter((c) => today - c.day < 7).map((c) => c.pain);
  const runs = (p.runs || []).slice(-3);
  const quadLSI = st && st.quadOther ? (st.quadOp / st.quadOther) * 100 : undefined;
  const hamLSI = st && st.hamOther ? (st.hamOp / st.hamOther) * 100 : undefined;
  const hopLSI = hop ? Math.min(hop.single, hop.triple, hop.crossover, hop.timed) : undefined;
  const jumpLSI = jump && jump.cmjOther ? (jump.cmjOp / jump.cmjOther) * 100 : undefined;
  return {
    day: today,
    flex: flexRec?.flex, flexRec, ext: extRec?.ext, extDeficit: extRec ? Math.max(0, extRec.ext) : undefined, extRec,
    flexOther: p.contralateral?.flex,
    flexPctOther: flexRec && p.contralateral?.flex ? (flexRec.flex / p.contralateral.flex) * 100 : undefined,
    flexDiffOther: flexRec && p.contralateral?.flex ? p.contralateral.flex - flexRec.flex : undefined,
    effusion: a?.effusion, slrLag: a?.slrLag, gait: a?.gait, singleLegStance: a?.sls, landingQuality: a?.landingQuality, hopPrereq: a?.hopPrereq,
    assessment: a,
    painAdl: recentPain.length ? mean(recentPain) : undefined,
    strength: st, quadLSI, hamLSI, hop, hopLSI, jump, jumpLSI,
    ikdc: ikdc?.ikdc, ikdcRec: ikdc, aclRsi: rsi?.aclrsi, aclRsiRec: rsi,
    runTolerated: runs.length >= 3 ? runs.every((r) => r.completed !== 'no' && r.swelling !== 'increased' && r.painAfter <= 3) : undefined,
    monthsPostOp: today / 30.4,
    sportDrills: p.sportDrillsDone,
  };
}

/* ---------- criteria ---------- */
const OPS = {
  '<=': (v, t) => v <= t, '>=': (v, t) => v >= t, '==': (v, t) => v === t,
};
function fmtMetric(metric, v) {
  if (v === undefined || v === null) return '—';
  switch (metric) {
    case 'extDeficit': return v === 0 ? '0° (كامل)' : `ينقص ${round(v)}°`;
    case 'flex': return `${round(v)}°`;
    case 'flexPctOther': return `${round(v)}% من السليمة`;
    case 'flexDiffOther': return `فرق ${round(v)}°`;
    case 'effusion': return D.EFFUSION_GRADES[v] || String(v);
    case 'slrLag': return v ? 'يوجد تأخر' : 'بدون تأخر';
    case 'gait': return v ? 'طبيعية' : 'غير طبيعية';
    case 'singleLegStance': return `${v} ث`;
    case 'painAdl': return `${round(v, 1)}/10`;
    case 'quadLSI': case 'hamLSI': case 'hopLSI': case 'jumpLSI': return `${round(v)}%`;
    case 'monthsPostOp': return `${round(v, 1)} شهر`;
    case 'aclRsi': case 'ikdc': return `${round(v)}`;
    case 'noRedAlerts': return v ? 'لا توجد' : 'يوجد تنبيه مفتوح';
    default: return v === true ? 'نعم' : v === false ? 'لا' : String(v);
  }
}
const SOURCE_AR = { clinic: 'قياس حضوري', camera: 'كاميرا المريض', photo: 'صورة المريض', phone: 'الجوال كمنقلة', patient: 'المريض' };
export function criteriaFor(p, toPhase, cat = DEFAULT_CATALOG) {
  const gate = cat.gates[toPhase] || [];
  const L = latest(p);
  const openRed = computeAlerts(p, cat).some((a) => a.level === 'red' && !a.acked);
  return gate.map((c) => {
    let v = c.metric === 'noRedAlerts' ? !openRed : L[c.metric];
    let src = '';
    if (['flex', 'flexPctOther', 'flexDiffOther'].includes(c.metric) && L.flexRec) src = `${SOURCE_AR[L.flexRec.source] || ''} · اليوم ${L.flexRec.day}`;
    if (c.metric === 'extDeficit' && L.extRec) src = `${SOURCE_AR[L.extRec.source] || ''} · اليوم ${L.extRec.day}`;
    if (['effusion', 'slrLag', 'gait', 'singleLegStance', 'landingQuality', 'hopPrereq'].includes(c.metric) && L.assessment) src = `تقييم حضوري · اليوم ${L.assessment.day}`;
    if (['quadLSI', 'hamLSI'].includes(c.metric) && L.strength) src = `${L.strength.method} · اليوم ${L.strength.day}`;
    if (c.metric === 'hopLSI' && L.hop) src = `أدنى اختبار من 4 · اليوم ${L.hop.day}`;
    if (c.metric === 'aclRsi' && L.aclRsiRec) src = `استبيان · اليوم ${L.aclRsiRec.day}`;
    if (c.metric === 'ikdc' && L.ikdcRec) src = `استبيان · اليوم ${L.ikdcRec.day}`;
    if (c.metric === 'painAdl') src = 'متوسط 7 أيام من تسجيل المريض';
    if (c.metric === 'runTolerated') src = 'آخر 3 جلسات جري';
    if (c.metric === 'jumpLSI' && L.jump) src = `قفز عمودي بثني مسبق · اليوم ${L.jump.day}`;
    if (c.metric === 'monthsPostOp') src = `اليوم ${L.day} بعد العملية`;
    if (c.metric === 'sportDrills') src = 'يحدده الأخصائي بعد التدريب الخاص بالرياضة';
    if (c.metric === 'noRedAlerts') src = 'التنبيهات المفتوحة الآن';
    // Home measurements alone never satisfy a criterion that needs an in-person value.
    const homeOnly = ['flex', 'flexPctOther', 'flexDiffOther'].includes(c.metric) ? L.flexRec && L.flexRec.source !== 'clinic'
      : c.metric === 'extDeficit' ? L.extRec && L.extRec.source !== 'clinic' : false;
    if (v === undefined || v === null || Number.isNaN(v)) return { c, state: 'unknown', valueText: 'لا يوجد قياس', src, homeOnly };
    const met = OPS[c.op](v, c.target);
    return { c, state: met ? 'met' : 'unmet', valueText: fmtMetric(c.metric, v), src, homeOnly };
  });
}
export function readyForNext(p, cat = DEFAULT_CATALOG) {
  if (p.phase >= 6) {
    const r = criteriaFor(p, 'rts', cat);
    return { to: 'rts', results: r, allMet: r.every((x) => x.state === 'met'), metCount: r.filter((x) => x.state === 'met').length };
  }
  const r = criteriaFor(p, p.phase + 1, cat);
  return { to: p.phase + 1, results: r, allMet: r.length > 0 && r.every((x) => x.state === 'met'), metCount: r.filter((x) => x.state === 'met').length };
}

/* ---------- alerts ---------- */
export function redFlagsInCheckin(c, p, cat = DEFAULT_CATALOG) {
  const rules = Object.fromEntries(cat.rules.map((r) => [r.id, r]));
  const on = (id) => rules[id]?.enabled !== false;
  const out = [];
  if (on('r_calf') && c.calf) out.push({ ruleId: 'r_calf', text: 'ألم أو تورم في الساق/السمانة' });
  if (on('r_breath') && c.breath) out.push({ ruleId: 'r_breath', text: 'ضيق تنفس أو ألم صدر', emergency: true });
  if (on('r_infect') && c.fever && (c.warmth || c.wound)) out.push({ ruleId: 'r_infect', text: 'حرارة مع احمرار/حرارة موضعية أو مشكلة في الجرح' });
  if (on('r_wound') && c.wound) out.push({ ruleId: 'r_wound', text: 'مشكلة في الجرح' });
  if (on('r_spike') && p) {
    const prev = (p.checkins || []).filter((x) => x.day < c.day && x.day >= c.day - 3).map((x) => x.pain);
    if (c.pain >= 8 && prev.length && c.pain - mean(prev) >= 3) out.push({ ruleId: 'r_spike', text: `ألم ${c.pain}/10 بزيادة واضحة عن متوسطه (${round(mean(prev), 1)})` });
  }
  if (on('r_givingway') && p && c.givingWay) {
    const n = (p.checkins || []).filter((x) => x.day > c.day - 7 && x.day < c.day && x.givingWay).length + 1;
    if (n >= 2) out.push({ ruleId: 'r_givingway', text: `عدم ثبات ${n === 2 ? 'مرتين' : `${n} مرات`} خلال 7 أيام` });
  }
  if (on('r_freetext') && c.note) {
    const hit = D.RED_WORDS.find((w) => c.note.includes(w));
    if (hit) out.push({ ruleId: 'r_freetext', text: `كلمة خطر في وصف المريض: «${hit}» — يحتاج مراجعة` });
  }
  return out;
}

export function computeAlerts(p, cat = DEFAULT_CATALOG) {
  const today = postOpDay(p);
  const rules = Object.fromEntries(cat.rules.map((r) => [r.id, r]));
  const on = (id) => rules[id]?.enabled !== false;
  const out = [];
  const push = (a) => { const key = `${a.ruleId}:${a.day}`; out.push({ ...a, key, acked: Boolean(p.acks?.[key]), ack: p.acks?.[key] }); };
  // red: from check-ins in the last 7 days
  for (const c of (p.checkins || []).filter((x) => today - x.day <= 7)) {
    for (const f of redFlagsInCheckin(c, p, cat)) push({ level: 'red', ruleId: f.ruleId, day: c.day, text: f.text, emergency: f.emergency });
  }
  // yellow: computed on the current state
  const checks = (p.checkins || []);
  const lastC = last(checks);
  const sinceLast = lastC ? today - lastC.day : 99;
  if (on('y_nodata') && sinceLast >= 3 && sinceLast < 5) push({ level: 'yellow', ruleId: 'y_nodata', day: today, text: `لا تسجيل يومي منذ ${sinceLast} أيام` });
  const adh = adherence(p, 7, cat);
  if (on('y_adherence') && adh.pct !== null && adh.pct < 50 && today > 3) push({ level: 'yellow', ruleId: 'y_adherence', day: today, text: `الالتزام ${adh.pct}% خلال 7 أيام (${adh.done}/${adh.planned})` });
  const recent = checks.filter((c) => today - c.day < 3).map((c) => c.pain);
  const before = checks.filter((c) => today - c.day >= 3 && today - c.day < 7).map((c) => c.pain);
  if (on('y_paintrend') && recent.length >= 2 && before.length >= 2 && mean(recent) - mean(before) >= 2) {
    push({ level: 'yellow', ruleId: 'y_paintrend', day: today, text: `الألم يزداد: ${round(mean(before), 1)} ← ${round(mean(recent), 1)}` });
  }
  const last3 = checks.slice(-3);
  if (on('y_swelling') && last3.length === 3 && last3.every((c) => c.swelling === 'more')) push({ level: 'yellow', ruleId: 'y_swelling', day: today, text: 'التورم أكثر 3 أيام متتالية' });
  const L = latest(p);
  if (on('y_trajectory')) {
    if (today > 21 && L.extDeficit >= 3) push({ level: 'yellow', ruleId: 'y_trajectory', day: today, text: `خارج المسار: الفرد ينقص ${L.extDeficit}° في اليوم ${today}` });
    else if (today > 28 && L.flex < 110) push({ level: 'yellow', ruleId: 'y_trajectory', day: today, text: `خارج المسار: الثني ${L.flex}° في اليوم ${today}` });
  }
  if (on('y_plateau') && today > 21 && L.flex < 125) {
    const old = lastWhere(p.rom, (r) => Number.isFinite(r.flex) && today - r.day >= 14);
    if (old && L.flex - old.flex < 5) push({ level: 'yellow', ruleId: 'y_plateau', day: today, text: `الثني ثابت تقريبًا خلال 14 يومًا (${old.flex}° ← ${L.flex}°)` });
  }
  if (on('y_psych') && p.phase >= 5 && Number.isFinite(L.aclRsi) && L.aclRsi < 60) push({ level: 'yellow', ruleId: 'y_psych', day: L.aclRsiRec.day, text: `ACL-RSI ‏${L.aclRsi} — جاهزية نفسية منخفضة` });
  for (const ap of (p.appointments || []).filter((a) => a.status === 'missed' && today - a.day <= 14)) {
    if (on('y_missed')) push({ level: 'yellow', ruleId: 'y_missed', day: ap.day, text: `فوّت موعدًا ${ap.type === 'virtual' ? 'افتراضيًا' : 'حضوريًا'}` });
  }
  return out;
}

export function statusOf(p, cat = DEFAULT_CATALOG) {
  const alerts = computeAlerts(p, cat).filter((a) => !a.acked);
  const today = postOpDay(p);
  const lastC = last(p.checkins || []);
  const sinceLast = lastC ? today - lastC.day : 99;
  const reasons = [];
  let code = 'green';
  const reds = alerts.filter((a) => a.level === 'red');
  // A reviewed red alert keeps the patient visible (yellow) for 3 days instead of turning green at once.
  const followUps = computeAlerts(p, cat).filter((a) => a.level === 'red' && a.acked && today - a.day <= 3)
    .map((a) => ({ ...a, level: 'yellow', text: `متابعة بعد تنبيه أحمر تمت مراجعته: ${a.text}` }));
  const yellows = [...alerts.filter((a) => a.level === 'yellow'), ...followUps];
  if (reds.length) { code = 'red'; reasons.push(...reds.map((a) => a.text)); }
  else if (sinceLast >= 5) { code = 'idle'; reasons.push(`آخر تسجيل قبل ${sinceLast} أيام`); }
  else if (yellows.length) { code = 'yellow'; reasons.push(...yellows.map((a) => a.text)); }
  else reasons.push('لا تنبيهات، والالتزام والقياسات ضمن المتوقع');
  const ready = readyForNext(p, cat);
  return { code, reasons, alerts, awaitingApproval: ready.allMet && p.phase < 6, ready };
}

/* ---------- trajectory ---------- */
export function corridorAt(series, day) {
  if (!series?.length) return null;
  if (day <= series[0].x) return series[0];
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1]; const b = series[i];
    if (day <= b.x) { const t = (day - a.x) / (b.x - a.x); return { x: day, lo: a.lo + t * (b.lo - a.lo), hi: a.hi + t * (b.hi - a.hi) }; }
  }
  return last(series);
}
export function projectFlex(p, target = 120) {
  const today = postOpDay(p);
  const pts = (p.rom || []).filter((r) => Number.isFinite(r.flex) && today - r.day <= 21).map((r) => ({ x: r.day, y: r.flex }));
  const cur = last(pts);
  if (!cur || cur.y >= target || pts.length < 3) return null;
  const fit = linreg(pts);
  if (!fit || fit.slope < 0.25) return { stalled: true, slope: fit?.slope || 0 };
  const days = Math.ceil((target - cur.y) / fit.slope);
  const line = [{ x: cur.x, y: cur.y }, { x: cur.x + Math.min(days, 28), y: Math.min(target, cur.y + fit.slope * Math.min(days, 28)) }];
  return { days: Math.max(1, days - (today - cur.x)), slopePerWeek: round(fit.slope * 7, 1), line, target };
}

/* ---------- notes ---------- */
const GRAFT_EN = { BPTB: 'BPTB autograft', HS: 'hamstring autograft', QT: 'quadriceps tendon autograft', ALLO: 'allograft' };
const SW_EN = { less: 'less', same: 'same', more: 'more' };
export function soapNote(p, { plan = [], visitType = 'virtual', by = 'PT' } = {}, cat = DEFAULT_CATALOG) {
  const day = postOpDay(p);
  const L = latest(p);
  const ph = phaseOf(p.phase, cat);
  const adh = adherence(p, 7, cat);
  const st = statusOf(p, cat);
  const pains = (p.checkins || []).filter((c) => day - c.day < 7).map((c) => c.pain);
  const lastC = last(p.checkins || []);
  const ready = st.ready;
  const lines = [];
  lines.push(`ACLR rehabilitation — ${visitType === 'virtual' ? 'Virtual follow-up' : 'In-person assessment'} (Madinah Smart Rehab)`);
  lines.push(`Date: ${isoDate(TODAY)} | POD ${day} (week ${weekOf(day)}) | ${p.side === 'R' ? 'Right' : 'Left'} ACLR, ${GRAFT_EN[p.graft] || p.graft}${p.meniscusRepair ? ' + meniscal repair' : ''}${p.meniscectomy ? ' + partial meniscectomy' : ''}${p.additional ? ` + ${p.additional}` : ''}`);
  lines.push(`Phase ${p.phase}: ${ph?.nameEn || ''}`);
  lines.push('');
  lines.push(`S: 7-day mean pain ${pains.length ? round(mean(pains), 1) : 'n/a'}/10${lastC ? `; last check-in POD ${lastC.day}: pain ${lastC.pain}/10, swelling ${SW_EN[lastC.swelling] || lastC.swelling} vs yesterday, giving way ${lastC.givingWay ? 'YES' : 'no'}` : ''}. Home programme adherence ${adh.pct ?? 'n/a'}% (${adh.done}/${adh.planned} sessions, 7 days).`);
  const objective = [];
  if (L.flexRec) objective.push(`knee flexion ${L.flex}° (${L.flexRec.source}, POD ${L.flexRec.day})`);
  if (L.extRec) objective.push(`extension ${L.extDeficit === 0 ? 'full (0°)' : `deficit ${L.extDeficit}°`} (${L.extRec.source}, POD ${L.extRec.day})`);
  if (L.assessment) objective.push(`effusion ${D.EFFUSION_GRADES[L.assessment.effusion]} (stroke test), SLR lag ${L.assessment.slrLag ? 'present' : 'absent'}, gait ${L.assessment.gait ? 'normal' : 'abnormal'} (POD ${L.assessment.day})`);
  if (Number.isFinite(L.quadLSI)) objective.push(`quadriceps LSI ${round(L.quadLSI)}%${Number.isFinite(L.hamLSI) ? `, hamstring LSI ${round(L.hamLSI)}%` : ''} (${L.strength.method}, POD ${L.strength.day})`);
  if (Number.isFinite(L.hopLSI)) objective.push(`hop battery lowest LSI ${round(L.hopLSI)}%`);
  if (Number.isFinite(L.ikdc)) objective.push(`IKDC ${L.ikdc}`);
  if (Number.isFinite(L.aclRsi)) objective.push(`ACL-RSI ${L.aclRsi}`);
  lines.push(`O: ${objective.join('; ') || 'no new objective data'}.`);
  const statusEn = { green: 'on track', yellow: 'needs review', red: 'clinical alert', idle: 'inactive / no data' }[st.code];
  const alertsTxt = st.alerts.length ? ` Open flags: ${st.alerts.map((a) => a.ruleId).join(', ')}.` : '';
  lines.push(`A: Status ${statusEn}.${alertsTxt} Criteria for ${ready.to === 'rts' ? 'return-to-sport' : `phase ${ready.to}`}: ${ready.metCount}/${ready.results.length} met${ready.allMet ? ' — criteria appear completed, clinical review required' : ''}.`);
  lines.push(`P: ${plan.length ? plan.join('; ') : 'continue current home programme; review at next scheduled visit'}.`);
  lines.push(`Clinician: ${by}`);
  return lines.join('\n');
}

export function preVisitBrief(p, cat = DEFAULT_CATALOG) {
  // Rule-based summary that always works; the AI version only rewrites it more naturally.
  const day = postOpDay(p);
  const st = statusOf(p, cat);
  const L = latest(p);
  const adh = adherence(p, 7, cat);
  const pains = (p.checkins || []).filter((c) => day - c.day < 14).map((c) => c.pain);
  const firstHalf = pains.slice(0, Math.floor(pains.length / 2));
  const secondHalf = pains.slice(Math.floor(pains.length / 2));
  const painDir = firstHalf.length && secondHalf.length ? mean(secondHalf) - mean(firstHalf) : 0;
  const points = [];
  points.push(`الحالة: ${({ green: 'على المسار', yellow: 'يحتاج مراجعة', red: 'تنبيه سريري', idle: 'غير نشط' })[st.code]} — ${st.reasons[0]}`);
  points.push(`الألم خلال أسبوعين: ${pains.length ? `${round(mean(firstHalf), 1)} ← ${round(mean(secondHalf), 1)} (${painDir <= -0.5 ? 'يتحسن' : painDir >= 0.5 ? 'يزداد' : 'مستقر'})` : 'لا بيانات'}`);
  points.push(`الالتزام 7 أيام: ${adh.pct ?? '—'}% (${adh.done}/${adh.planned})`);
  if (L.flexRec) points.push(`المدى: ثني ${L.flex}°، فرد ${L.extDeficit === 0 ? 'كامل' : `ينقص ${L.extDeficit}°`} (آخر قياس اليوم ${L.flexRec.day})`);
  const ready = st.ready;
  points.push(`معايير ${ready.to === 'rts' ? 'العودة للرياضة' : `المرحلة ${ready.to}`}: ${ready.metCount} من ${ready.results.length} محققة`);
  const discuss = [];
  if (st.alerts.length) discuss.push(...st.alerts.slice(0, 3).map((a) => a.text));
  const unmet = ready.results.filter((r) => r.state !== 'met').slice(0, 2);
  for (const u of unmet) discuss.push(`معيار غير محقق: ${u.c.textAr} (${u.valueText})`);
  const notes = (p.checkins || []).filter((c) => c.note && day - c.day < 14).slice(-2);
  for (const n of notes) discuss.push(`كتب المريض (اليوم ${n.day}): «${n.note}»`);
  if (!discuss.length) discuss.push('لا نقاط عاجلة؛ راجع تقدم الجرعات وحدد موعد التقييم القادم.');
  return { points, discuss };
}

export function milestonesFor(p, cat = DEFAULT_CATALOG) {
  const L = latest(p);
  const ctx = { latest: L, day: postOpDay(p), phase: p.phase, rtsStage: p.rtsStage || 0, meniscusRepairActive: p.meniscusRepair && postOpDay(p) < 120 };
  return cat.milestones.map((m) => ({ ...m, done: Boolean(m.test(ctx)) }));
}

export function phaseProgress(p, cat = DEFAULT_CATALOG) {
  const r = readyForNext(p, cat);
  if (!r.results.length) return 0;
  return Math.round((r.metCount / r.results.length) * 100);
}

export function riskOfDropout(p, cat = DEFAULT_CATALOG) {
  // Explainable heuristic, not a trained model: falling adherence + missing check-ins + low confidence.
  const a7 = adherence(p, 7, cat).pct ?? 100;
  const a14 = adherence(p, 14, cat).pct ?? 100;
  const today = postOpDay(p);
  const lastC = last(p.checkins || []);
  const gap = lastC ? today - lastC.day : 10;
  let score = 0; const why = [];
  if (a7 < 60) { score += 2; why.push(`التزام ${a7}%`); }
  if (a7 < a14 - 15) { score += 1; why.push('الالتزام يتراجع'); }
  if (gap >= 3) { score += 2; why.push(`لا تسجيل منذ ${gap} أيام`); }
  const conf = (p.checkins || []).slice(-5).map((c) => c.confidence).filter(Number.isFinite);
  if (conf.length && mean(conf) < 4) { score += 1; why.push('ثقة منخفضة'); }
  return { level: score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low', why };
}
