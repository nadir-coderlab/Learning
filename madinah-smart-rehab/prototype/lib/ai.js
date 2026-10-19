// Generative-AI helpers. In this prototype they run through Claude inside the artifact viewer
// (the `sample` capability). In the real platform the same prompts would go to a model hosted
// inside the Kingdom, with de-identified data, logging, and clinician review.
import { latest, postOpDay, adherence, statusOf, phaseOf, GRAFT_AR, DEFAULT_CATALOG } from './engine.js';
import { round } from './util.js';

let samplePromise = null;
export function getSample() {
  if (typeof window === 'undefined' || !window.claude?.use) return Promise.resolve(null);
  if (!samplePromise) samplePromise = window.claude.use('sample').catch(() => null);
  return samplePromise;
}

export function aiErrorText(code) {
  switch (code) {
    case 'not_granted': case 'sampling_disabled': case 'not_declared': case 'capability_disabled': case 'capability_removed':
      return 'الذكاء الاصطناعي غير مفعل في هذا العرض. في المنصة الحقيقية يعمل عبر نموذج مستضاف داخل المملكة.';
    case 'rate_limited': return 'طلبات كثيرة الآن. جرّب بعد قليل.';
    case 'session_expired': return 'انتهت الجلسة. سجّل الدخول من جديد.';
    case 'refused': return 'تعذر الرد على هذا السؤال. صِغه بطريقة أخرى أو اسأل أخصائيك.';
    case 'invalid_json': return 'وصل رد غير مكتمل. اضغط "إعادة المحاولة".';
    case 'cancelled': return '';
    case 'unavailable': return 'المساعد الذكي يعمل داخل Claude فقط في هذا النموذج. في المنصة الحقيقية يُربط بنموذج لغوي معتمد.';
    default: return 'حدث خطأ مؤقت في الاتصال. حاول مرة أخرى.';
  }
}

export function libraryText(cat = DEFAULT_CATALOG, phase) {
  return cat.education
    .filter((e) => !phase || e.phases.includes(phase) || e.pinned)
    .map((e) => `### ${e.titleAr}\n${e.body.map((b) => `- ${b}`).join('\n')}`)
    .join('\n\n')
    .slice(0, 12000);
}

export function assistantRules(p, cat = DEFAULT_CATALOG) {
  const ph = phaseOf(p.phase, cat);
  return [
    'أنت "مساعد التأهيل" في منصة لتأهيل مرضى عملية الرباط الصليبي الأمامي. هذا نموذج تجريبي ببيانات وهمية.',
    'قواعد ملزمة:',
    '1) تكلم باللهجة السعودية البيضاء، بجمل قصيرة وواضحة، من 2 إلى 6 جمل.',
    '2) اعتمد فقط على "المكتبة التثقيفية المعتمدة" أدناه وعلى خطة المريض. لا تضف معلومات طبية من خارجها.',
    '3) لا تشخّص، ولا تغيّر البرنامج أو الجرعات أو تواريخ العودة. قل إن أخصائيه هو من يقرر.',
    '4) إذا ذكر المريض عرضًا مقلقًا (ألم أو تورم في الساق، ضيق تنفس، ألم صدر، حرارة مع احمرار، إفرازات أو انفتاح الجرح، خدر أو برودة القدم): ابدأ بتوجيهه للتواصل مع فريقه فورًا، وللإسعاف 997 في ضيق التنفس أو ألم الصدر.',
    '5) إذا لم تجد الإجابة في المكتبة قل: "هذا السؤال أحوّله لأخصائيك" واقترح كتابته في الرسائل.',
    '6) اختم بسطر: "المصدر: <عنوان المادة>" إذا استخدمت مادة من المكتبة.',
    '',
    `خطة المريض: المرحلة ${p.phase} (${ph?.nameAr || ''})، اليوم ${postOpDay(p)} بعد العملية، الطعم: ${GRAFT_AR[p.graft] || p.graft}${p.meniscusRepair ? '، مع إصلاح الغضروف الهلالي' : ''}.`,
    `قيود الجراح: ${p.surgeonInstructions || 'لا يوجد'}.`,
    `معدّلات البروتوكول: ${(p.modifiers || []).map((m) => m.textAr).join('؛ ') || 'لا يوجد'}.`,
    '',
    'المكتبة التثقيفية المعتمدة:',
    libraryText(cat),
  ].join('\n');
}

export async function askAssistant(p, turns, { onText, signal, cat } = {}) {
  const sample = await getSample();
  if (!sample) throw { code: 'unavailable' };
  const input = [{ role: 'user', content: assistantRules(p, cat) }, { role: 'assistant', content: 'تمام، فهمت القواعد.' }, ...turns.slice(-8)];
  return sample(input, { onText, signal, cache: false, modelTier: 'default' });
}

export function summaryPrompt(p, cat = DEFAULT_CATALOG) {
  const day = postOpDay(p);
  const L = latest(p);
  const st = statusOf(p, cat);
  const adh = adherence(p, 7, cat);
  const checks = (p.checkins || []).filter((c) => day - c.day < 14)
    .map((c) => `اليوم ${c.day}: ألم ${c.pain}/10، تورم ${c.swelling}${c.givingWay ? '، عدم ثبات' : ''}${c.calf ? '، ألم بالساق' : ''}${c.note ? `، ملاحظة: "${c.note}"` : ''}`).join('\n');
  const rom = (p.rom || []).slice(-6).map((r) => `اليوم ${r.day}: ثني ${r.flex ?? '—'}°، نقص فرد ${r.ext ?? '—'}° (${r.source})`).join('\n');
  const crit = st.ready.results.map((r) => `- ${r.c.textAr}: ${r.state === 'met' ? 'محقق' : r.state === 'unmet' ? 'غير محقق' : 'لا قياس'} (${r.valueText})`).join('\n');
  return [
    'أنت تساعد أخصائي علاج طبيعي يستعد لعيادة افتراضية لمريض بعد عملية الرباط الصليبي. البيانات وهمية لنموذج تجريبي.',
    'اكتب ملخصًا دقيقًا من البيانات فقط، بدون استنتاجات طبية جديدة أو تشخيص. لا تقترح قرار انتقال مرحلة؛ القرار للأخصائي.',
    'أعد JSON فقط بهذا الشكل:',
    '{"summary":"جملتان بالعربية","concerns":["حتى 3 نقاط بالعربية"],"discuss":["حتى 4 أسئلة أو نقاط للنقاش مع المريض بالعربية"],"soapEn":{"S":"English","O":"English","A":"English, no diagnosis, cite data","P":"English: suggestions for the clinician to confirm"}}',
    '',
    `المريض: ${p.name}، ${p.age} سنة، الركبة ${p.side === 'R' ? 'اليمنى' : 'اليسرى'}، الطعم ${p.graft}${p.meniscusRepair ? ' + إصلاح غضروف' : ''}.`,
    `اليوم ${day} بعد العملية، المرحلة ${p.phase}. الحالة: ${st.code} — ${st.reasons.join('؛ ')}.`,
    `الالتزام 7 أيام: ${adh.pct ?? '—'}% (${adh.done}/${adh.planned}).`,
    `آخر قيم: ثني ${L.flex ?? '—'}°، نقص الفرد ${L.extDeficit ?? '—'}°، LSI الرباعية ${Number.isFinite(L.quadLSI) ? round(L.quadLSI) : '—'}%، ACL-RSI ${L.aclRsi ?? '—'}.`,
    'التسجيل اليومي (14 يومًا):', checks || 'لا يوجد',
    'المدى الحركي (آخر 6 قياسات):', rom || 'لا يوجد',
    `معايير ${st.ready.to === 'rts' ? 'العودة للرياضة' : `المرحلة ${st.ready.to}`}:`, crit || 'لا يوجد',
  ].join('\n');
}

export async function aiPreVisit(p, { onText, signal, cat } = {}) {
  const sample = await getSample();
  if (!sample) throw { code: 'unavailable' };
  return sample.json(summaryPrompt(p, cat), { onText, signal, modelTier: 'default' });
}
