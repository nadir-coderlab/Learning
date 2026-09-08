window.installPath120Drills = function (api) {
  'use strict';
  const P = window.DetPath120, esc = P.escape;
  api.drills.evidence = () => {
    const state = api.state();
    const item = api.pick(P.bank, x => x.level, 'evidence', 1, { keyFn: x => x.id })[0];
    let index = 0, answers = [], finished = false;
    const started = Date.now(), f = api.frame('readDrill', 'الاستنتاج والدليل · تدريب مهاري', 240, () => finish(true));
    const show = () => {
      const q = item.questions[index];
      f.body.innerHTML = `<p class="hl-tip">${esc(item.level)} · سؤال ${index + 1} من ${item.questions.length} · اختر الإجابة ثم راجع الدليل. هذا تدريب مهاري وليس نوع سؤال رسمي مستقل.</p><h3 dir="ltr">${esc(item.title)}</h3><div class="p120-question">${esc(item.passage)}</div><h3 class="p120-question">${esc(q.prompt)}</h3><div class="opts"></div><div id="evidence-feedback" aria-live="polite"></div>`;
      q.options.forEach((option, n) => {
        const b = document.createElement('button'); b.className = 'opt p120-question'; b.textContent = option;
        b.onclick = () => {
          if (finished || answers[index] != null) return;
          answers[index] = n;
          f.body.querySelectorAll('.opt').forEach((button, k) => { button.disabled = true; if (k === q.answer) button.classList.add('ok'); });
          if (n !== q.answer) b.classList.add('bad');
          f.body.querySelector('#evidence-feedback').innerHTML = `<div class="p120-evidence"><b>${n === q.answer ? 'إجابة صحيحة' : 'راجع الدليل'}</b><blockquote class="p120-question">${esc(q.evidence)}</blockquote><p>${esc(q.explain)}</p></div><button class="btn" id="evidence-next">${index + 1 === item.questions.length ? 'إنهاء الجولة' : 'السؤال التالي'}</button>`;
          f.body.querySelector('#evidence-next').onclick = () => { index++; if (index === item.questions.length) finish(false); else show(); };
        };
        f.body.querySelector('.opts').appendChild(b);
      });
    };
    const finish = timedOut => {
      if (finished) return; finished = true; f.timer.stop();
      let correct = 0;
      item.questions.forEach((q, i) => {
        const ok = answers[i] === q.answer; if (ok) correct++;
        api.learn('evidence', item.level, ok);
        api.log('evidence', { q: item.title + ': ' + q.prompt, a: q.options[answers[i]] || '', ok, sc: ok ? 100 : 0, lvl: item.level, ms: Math.round((Date.now() - started) / item.questions.length), extra: { evidence: q.evidence, explanation: q.explain, category: 'inference', timedOut } });
        if (!ok) api.miss('evidence', q.prompt, q.options[q.answer], q.explain + '\nEvidence: ' + q.evidence);
      });
      const score = Math.round(100 * correct / item.questions.length); api.best('evidence', score);
      f.body.innerHTML = `<div class="res"><div class="score">${score}%</div><p>${correct} من ${item.questions.length}${timedOut ? ' · انتهى الوقت' : ''}</p></div>${item.questions.map((q, i) => `<div class="card"><h3 class="p120-question">${esc(q.prompt)}</h3><p>إجابتك: <bdi>${esc(q.options[answers[i]] || 'بدون إجابة')}</bdi></p><p>الصحيح: <bdi>${esc(q.options[q.answer])}</bdi></p><blockquote class="p120-question">${esc(q.evidence)}</blockquote><p>${esc(q.explain)}</p></div>`).join('')}<div class="row"><button class="btn" id="evidence-again">قطعة أخرى</button><a class="btn ghost" href="#write/iw">انتقل للكتابة</a></div>`;
      f.body.querySelector('#evidence-again').onclick = api.drills.evidence;
    };
    show(); f.timer.start();
  };
  api.drills.rewrite = () => {
    const state = api.state(), p = P.profile(state);
    const candidates = state.log.filter(a => ['wp', 'iw', 'ws', 'sum', 'rewrite'].includes(a.drill) && a.a && a.a.trim().split(/\s+/).length >= 8).slice(-12).reverse();
    const starter = { id: 'starter', q: 'Describe a time when a system stopped working. What happened, how did you respond, and what did you learn?', a: 'Last week the system go down. I was check patient files when it happened. We make sure all orders was registered. It was difficult but we keep working.', extra: { issues: [
      { type: 'grammar', text: 'the system go down', fix: 'the system went down' }, { type: 'grammar', text: 'I was check', fix: 'I was checking' }, { type: 'grammar', text: 'We make sure', fix: 'We made sure' }, { type: 'grammar', text: 'all orders was registered', fix: 'all orders were registered' }, { type: 'grammar', text: 'we keep working', fix: 'we kept working' }
    ] } };
    const sources = candidates.length ? candidates : [starter];
    const f = api.frame('writeDrill', 'ورشة الكتابة · اكتب وراجع وأعد الصياغة', null);
    let source = sources.find(a => a.id === p.draft?.sourceId) || sources[0];
    function open() {
      const original = source.a.split('\n\n--- part 2 ---')[0], prompt = source.q.split(' || ')[0];
      const issues = P.collectIssues(source);
      f.body.innerHTML = `<p class="hl-tip">${source.id === 'starter' ? 'تمرين افتتاحي على الماضي وتوافق الفاعل والفعل. ليس إجابة من اختبارك الرسمي.' : 'هذه إجابة سابقة من سجل تدريبك. أعد صياغتها بعد مراجعة الملاحظات.'}</p><label>الإجابة السابقة <select id="rewrite-source" class="in">${sources.map((a, i) => `<option value="${i}" ${a.id === source.id ? 'selected' : ''}>${esc(a.q.slice(0, 65))}</option>`).join('')}</select></label><h3>السؤال</h3><div class="p120-question">${esc(prompt)}</div><h3>الإجابة السابقة</h3><div class="p120-review">${esc(original)}</div><h3>نقاط للمراجعة</h3>${issues.length ? issues.slice(0, 6).map(i => `<p><bdi>${esc(i.text)}</bdi> ← <bdi>${esc(i.fix || 'راجع السياق')}</bdi></p>`).join('') : '<p>وضح فكرتك وادعمها بسبب ومثال. راجع الأزمنة وتوافق الفعل مع الفاعل. غياب الملاحظات الآلية لا يعني خلو النص من الأخطاء.</p>'}<label for="rewrite-text"><b>صياغتك الجديدة</b></label><textarea class="ta" id="rewrite-text" dir="ltr" spellcheck="false" placeholder="Write your revised answer here..."></textarea><p id="rewrite-count" class="hl-tip"></p><div class="p120-checks">${['أجبت عن جميع أجزاء السؤال','أضفت سببا أو مثالا محددا','راجعت الأزمنة وتوافق الفاعل والفعل','حذفت التكرار والجمل غير المرتبطة'].map((t, i) => `<label><input type="checkbox" data-check="${i}">${t}</label>`).join('')}</div><button class="btn" id="rewrite-save">حفظ الصياغة ومقارنتها</button><p id="rewrite-status" role="status"></p><div id="rewrite-result"></div>`;
      const text = f.body.querySelector('#rewrite-text'), counter = f.body.querySelector('#rewrite-count');
      text.value = p.draft?.sourceId === source.id ? p.draft.text || '' : '';
      const count = () => counter.textContent = `${text.value.trim() ? text.value.trim().split(/\s+/).length : 0} كلمة · الجودة والارتباط بالسؤال أهم من العدد`;
      text.oninput = () => { p.draft = { sourceId: source.id, text: text.value.slice(0, 12000) }; api.save(); count(); };
      count();
      f.body.querySelector('#rewrite-source').onchange = e => { source = sources[Number(e.target.value)]; open(); };
      f.body.querySelector('#rewrite-save').onclick = () => {
        const answer = text.value.trim(), status = f.body.querySelector('#rewrite-status');
        if (answer.split(/\s+/).length < 8) { status.textContent = 'اكتب إجابة من 8 كلمات على الأقل حتى يمكن مراجعتها.'; return; }
        if (answer === original.trim()) { status.textContent = 'الصياغة مطابقة للإجابة السابقة. عدلها ثم قارنها.'; return; }
        const checks = [...f.body.querySelectorAll('[data-check]')].map(c => c.checked);
        const context = { prompt, keywords: api.keywords(prompt), min: source.drill === 'wp' || source.drill === 'sum' ? 40 : 100, kind: 'sample' };
        const before = api.grade(original, context), after = api.grade(answer, context);
        api.log('rewrite', { q: prompt, a: answer, sc: after ? after.score : null, extra: { sourceId: source.id, before: original, checks, issues: after?.issues?.slice(0, 10).map(i => ({ type: i.type, text: i.text || '', fix: i.fix || '' })) || [], beforePractice: before?.score ?? null, afterPractice: after?.score ?? null } });
        if (after) api.best('rewrite', after.score);
        p.draft = null; api.save();
        f.body.querySelector('#rewrite-result').innerHTML = `<h3>المقارنة التدريبية</h3><p>${before && after ? `قبل: ${before.score}% · بعد: ${after.score}%` : 'التقييم الآلي غير متاح. حفظت الإجابة للمراجعة.'}</p><p class="hl-tip">هذه إشارات نصية محدودة. ارتفاع النسبة لا يثبت تحسن درجة الاختبار. راجع معنى الإجابة ووضوحها أيضا.</p>${after ? api.rubric(after) : ''}${source.id === 'starter' ? '' : '<p class="hl-tip">المثال التالي يوضح البناء فقط. طبقه على موضوع سؤالك بتفاصيل مناسبة.</p>'}<details><summary>مثال على تطوير إجابة الموقف</summary><p class="p120-review">While I was reviewing patient files, the system suddenly went down. We switched to the downtime procedure and recorded the orders on paper so that care could continue. Once the system was restored, we checked the records for missing information. This experience showed me why clear responsibilities and regular practice are essential during unexpected disruptions.</p><p>لاحظ ترتيب الحدث ثم الإجراء والسبب ثم ما تعلمته. استخدم هذا البناء مع تفاصيل حقيقية تخص السؤال. لا تحفظ المثال كإجابة لكل موضوع.</p></details><a class="btn sm" href="#write/iw">طبق المهارة على سؤال جديد</a>`;
        status.textContent = 'حفظت الصياغة الجديدة في سجل تدريبك.';
        f.body.querySelector('#rewrite-save').disabled = true;
        text.oninput = () => { p.draft = { sourceId: source.id, text: text.value.slice(0, 12000) }; api.save(); count(); f.body.querySelector('#rewrite-save').disabled = false; };
      };
    }
    open();
  };
};
