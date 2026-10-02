// App state = deterministic seed + a log of user actions replayed on top.
// Only the action log is saved (in this browser), so "reset demo" is just clearing it.
// In the real platform each action becomes an API call and a row in the audit trail.
import { useEffect, useReducer } from './h.js';
import { buildPatients, buildDischarged, DEMO_CLINICIAN } from './seed.js';
import { DEFAULT_CATALOG, postOpDay } from './engine.js';
import { storage, uid } from './util.js';

const KEY = 'msr-proto-events-v2';
let state = null;
const listeners = new Set();

function freshCatalog() {
  return JSON.parse(JSON.stringify({
    phases: DEFAULT_CATALOG.phases, gates: DEFAULT_CATALOG.gates, exercises: DEFAULT_CATALOG.exercises,
    education: DEFAULT_CATALOG.education, questionnaires: DEFAULT_CATALOG.questionnaires, rules: DEFAULT_CATALOG.rules,
    corridor: DEFAULT_CATALOG.corridor,
  }));
}

function seed() {
  const catalog = freshCatalog();
  catalog.milestones = DEFAULT_CATALOG.milestones; // functions, not serialisable
  return { catalog, patients: buildPatients(), discharged: buildDischarged(), audit: seedAudit(), events: [] };
}
function seedAudit() {
  const now = Date.now();
  const h = 3600000;
  return [
    { ts: now - 26 * h, by: DEMO_CLINICIAN, action: 'تعديل جرعة تمرين', target: 'أحمد الحربي · القرفصاء الجزئي', from: '3×10', to: '3×12' },
    { ts: now - 3 * 24 * h, by: DEMO_CLINICIAN, action: 'اعتماد انتقال مرحلة', target: 'أحمد الحربي', from: 'المرحلة 1', to: 'المرحلة 2' },
    { ts: now - 5 * 24 * h, by: 'أ. منى الحازمي', action: 'إضافة تمرين', target: 'يوسف العنزي · الدراجة الثابتة', from: '—', to: 'يوميًا 10 د' },
    { ts: now - 6 * 24 * h, by: 'مدير المحتوى', action: 'تعديل فيديو تمرين', target: 'مكتبة التمارين · النزول الأمامي من درجة', from: 'v1', to: 'v2' },
  ];
}

export function patientById(id) { return state.patients.find((p) => p.id === id); }

function audit(s, by, action, target, from = '—', to = '—') {
  s.audit.unshift({ ts: Date.now(), by: by || DEMO_CLINICIAN, action, target, from: String(from), to: String(to) });
}
const doseText = (it) => `${it.sets}×${it.reps}${it.hold ? ` · ثبات ${it.hold}ث` : ''}`;

function apply(s, e) {
  const p = e.pid ? s.patients.find((x) => x.id === e.pid) : null;
  const today = p ? postOpDay(p) : 0;
  switch (e.type) {
    case 'checkin/add': {
      p.checkins = p.checkins.filter((c) => c.day !== today);
      p.checkins.push({ ...e.checkin, day: today, ts: e.ts });
      break;
    }
    case 'exercise/done': {
      p.exlog = p.exlog.filter((l) => !(l.day === today && l.exId === e.exId));
      p.exlog.push({ day: today, exId: e.exId, done: true, painDuring: e.painDuring, difficulty: e.difficulty, verified: e.verified || null });
      break;
    }
    case 'exercise/undo': p.exlog = p.exlog.filter((l) => !(l.day === today && l.exId === e.exId)); break;
    case 'rom/add': p.rom.push({ day: today, ...e.rom }); p.rom.sort((a, b) => a.day - b.day); break;
    case 'measure/add': p.measures.push({ day: today, ts: e.ts, ...e.measure }); break;
    case 'message/send': p.messages.push({ id: e.id, from: e.from, text: e.text, ts: e.ts }); break;
    case 'alert/ack': p.acks[e.key] = { by: e.by, ts: e.ts, note: e.note || '' }; audit(s, e.by, 'إغلاق تنبيه بعد المراجعة', `${p.name} · ${e.label || e.key}`, 'مفتوح', 'تمت المراجعة'); break;
    case 'program/update': {
      const it = p.program.find((x) => x.exId === e.exId);
      if (!it) break;
      const before = doseText(it);
      Object.assign(it, e.changes);
      audit(s, e.by, 'تعديل جرعة تمرين', `${p.name} · ${e.exName || e.exId}`, before, doseText(it));
      break;
    }
    case 'program/add': p.program.push(e.item); audit(s, e.by, 'إضافة تمرين', `${p.name} · ${e.exName || e.item.exId}`, '—', doseText(e.item)); break;
    case 'program/remove': {
      const it = p.program.find((x) => x.exId === e.exId);
      p.program = p.program.filter((x) => x.exId !== e.exId);
      audit(s, e.by, 'حذف تمرين', `${p.name} · ${e.exName || e.exId}`, it ? doseText(it) : '—', '—');
      break;
    }
    case 'phase/approve': {
      const from = p.phase;
      p.phase = e.toPhase;
      p.phaseHistory.push({ phase: e.toPhase, day: today, by: e.by, note: e.note, criteria: e.criteria });
      if (Array.isArray(e.program)) { p.program = e.program; p.programHistory = [...(p.programHistory || []), { fromDay: today, program: p.program }]; }
      if (e.toPhase >= 5 && !p.plyoLevel) p.plyoLevel = 1;
      audit(s, e.by, 'اعتماد انتقال مرحلة', p.name, `المرحلة ${from}`, `المرحلة ${e.toPhase}`);
      break;
    }
    case 'plyo/unlock': p.plyoLevel = e.level; audit(s, e.by, 'فتح مستوى قفز', p.name, `المستوى ${e.level - 1}`, `المستوى ${e.level}`); break;
    case 'rts/stage': p.rtsStage = e.stage; audit(s, e.by, 'اعتماد مرحلة العودة للرياضة', p.name, `${e.from ?? '—'}`, `${e.label || e.stage}`); break;
    case 'appointment/add': p.appointments.push({ id: e.id, ...e.appointment }); p.appointments.sort((a, b) => a.day - b.day); audit(s, e.by, 'حجز موعد', p.name, '—', `${e.appointment.type === 'virtual' ? 'افتراضي' : 'حضوري'} · اليوم ${e.appointment.day}`); break;
    case 'assessment/add': p.assessments.push({ day: today, ...e.assessment }); if (e.rom) p.rom.push({ day: today, source: 'clinic', ...e.rom }); p.rom.sort((a, b) => a.day - b.day); audit(s, e.by, 'تسجيل تقييم حضوري', p.name); break;
    case 'strength/add': p.strength.push({ day: today, ...e.entry }); audit(s, e.by, 'تسجيل اختبار قوة', p.name, '—', e.summary || ''); break;
    case 'hops/add': p.hops.push({ day: today, ...e.entry }); audit(s, e.by, 'تسجيل اختبارات القفز', p.name); break;
    case 'prom/add': p.proms.push({ day: today, ...e.prom }); break;
    case 'run/log': p.runs.push({ day: today, ...e.run }); break;
    case 'note/add': p.notes.push({ day: today, ts: e.ts, by: e.by, text: e.text }); audit(s, e.by, 'إضافة ملاحظة', p.name); break;
    case 'restday/add': if (!p.restDays.includes(today)) p.restDays.push(today); break;
    case 'catalog/exercise/upsert': {
      const i = s.catalog.exercises.findIndex((x) => x.id === e.exercise.id);
      const before = i >= 0 ? s.catalog.exercises[i] : null;
      if (i >= 0) s.catalog.exercises[i] = { ...before, ...e.exercise }; else s.catalog.exercises.push(e.exercise);
      s.catalog._exMap = undefined;
      audit(s, e.by || 'مدير المحتوى', before ? 'تعديل تمرين في المكتبة' : 'إضافة تمرين للمكتبة', `مكتبة التمارين · ${e.exercise.nameAr}`, before ? doseText(before) : '—', doseText({ ...before, ...e.exercise }));
      break;
    }
    case 'catalog/rule/toggle': {
      const rule = s.catalog.rules.find((x) => x.id === e.ruleId);
      if (rule) { rule.enabled = e.enabled; audit(s, e.by || 'مدير المحتوى', 'تعديل قاعدة تنبيه', rule.nameAr, e.enabled ? 'متوقفة' : 'مفعلة', e.enabled ? 'مفعلة' : 'متوقفة'); }
      break;
    }
    case 'catalog/gate/target': {
      const c = (s.catalog.gates[e.gate] || []).find((x) => x.id === e.criterionId);
      if (c) { const before = c.target; c.target = e.target; audit(s, e.by || 'مدير المحتوى', 'تعديل معيار انتقال', c.textAr, before, e.target); }
      break;
    }
    case 'catalog/education/upsert': {
      const i = s.catalog.education.findIndex((x) => x.id === e.item.id);
      if (i >= 0) s.catalog.education[i] = { ...s.catalog.education[i], ...e.item }; else s.catalog.education.push(e.item);
      audit(s, e.by || 'مدير المحتوى', i >= 0 ? 'تعديل مادة تثقيفية' : 'إضافة مادة تثقيفية', e.item.titleAr);
      break;
    }
    default: break;
  }
}

export function initStore() {
  state = seed();
  const events = storage.get(KEY, []);
  for (const e of events) { try { apply(state, e); } catch { /* skip a stale event */ } }
  state.events = events;
  return state;
}
export function getState() { return state; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { state = { ...state }; listeners.forEach((fn) => fn(state)); }

export function dispatch(action) {
  const e = { ...action, ts: action.ts || Date.now(), id: action.id || uid('ev') };
  apply(state, e);
  state.events.push(e);
  storage.set(KEY, state.events);
  emit();
  return e;
}
export function resetDemo() {
  storage.remove(KEY);
  initStore();
  emit();
}
export function useStore() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => subscribe(force), []);
  return state;
}
export { DEMO_CLINICIAN };
