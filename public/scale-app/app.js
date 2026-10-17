/* ============================================================
   scale-app/app.js — «ميزاني»: تطبيق ويب يتصل بميزان الجسم بالبلوتوث

   - الاتصال عبر Web Bluetooth (كروم أندرويد / كروم الكمبيوتر)
   - فك البيانات في protocols.js (ScaleProto)
   - كل شي ينحفظ في الجوال نفسه (localStorage مفتاح mizani.v1)
   ============================================================ */
(function () {
  'use strict';
  const P = window.ScaleProto;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const KEY = 'mizani.v1';

  /* ---------- التخزين ---------- */
  function rid(prefix) { return (prefix || 'r') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function newProfile(name) { return { id: rid('p'), name, heightCm: null, goalKg: null, uniq: 1 + Math.floor(Math.random() * 0xFFFE) }; }
  function fresh() { const p = newProfile('أنا'); return { v: 1, profiles: [p], activeId: p.id, records: [], settings: { voice: true }, device: null }; }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1 && Array.isArray(s.profiles) && s.profiles.length) {
        s.records = Array.isArray(s.records) ? s.records : [];
        s.settings = s.settings || { voice: true };
        if (!s.profiles.find(p => p.id === s.activeId)) s.activeId = s.profiles[0].id;
        return s;
      }
    } catch (e) { /* أول مرة أو التخزين مقفل */ }
    return null;
  }
  let db = load() || fresh();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast('ما قدرت أحفظ في الجوال'); }
  }
  const profile = id => db.profiles.find(p => p.id === id);
  const active = () => profile(db.activeId) || db.profiles[0];
  const recordsOf = pid => db.records.filter(r => r.pid === pid).sort((a, b) => a.t - b.t);

  /* ---------- تنسيق ---------- */
  const fmtW = w => (w == null ? '0.0' : (Math.round(w * 10) / 10).toFixed(1));
  const LOC = 'ar-SA-u-ca-gregory-nu-latn';
  const dfDay = new Intl.DateTimeFormat(LOC, { weekday: 'short', day: 'numeric', month: 'short' });
  const dfShort = new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short' });
  const dfTime = new Intl.DateTimeFormat(LOC, { hour: 'numeric', minute: '2-digit' });
  const signed = (x, d) => { const n = d == null ? 1 : d; const a = Math.abs(x).toFixed(n); return (+a === 0 ? '' : x > 0 ? '+' : '−') + a; };
  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(kids || [])) if (c != null) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  }

  /* ---------- رسائل صغيرة ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  /* ---------- سجل الفحص ---------- */
  const logLines = [];
  const short = u => {
    const m = /^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/.exec(u || '');
    return m ? m[1].toUpperCase() : (u || '').slice(0, 8);
  };
  function log(msg) {
    const t = new Date();
    const stamp = [t.getHours(), t.getMinutes(), t.getSeconds()].map(x => String(x).padStart(2, '0')).join(':');
    logLines.push(stamp + '  ' + msg);
    if (logLines.length > 400) logLines.splice(0, logLines.length - 400);
    const pre = $('#log');
    if (pre && !$('#diag').hidden && $('#diag').open) pre.textContent = logLines.join('\n');
  }

  /* ---------- حالة الشاشة الرئيسية ---------- */
  const STATUS = {
    idle: { pill: 'غير متصل', cls: 'off' },
    connecting: { pill: 'يتصل…', cls: 'busy' },
    connected: { pill: 'متصل', cls: 'on' },
    sleep: { pill: 'ينتظر الميزان', cls: 'busy' },
    demo: { pill: 'تجربة', cls: 'demo' }
  };
  let conn = 'idle';
  function setConn(state, hint) {
    conn = state;
    const s = STATUS[state];
    const pill = $('#connPill');
    pill.className = 'pill ' + s.cls;
    $('#connText').textContent = s.pill;
    const btn = $('#btnConnect');
    if (state === 'idle') {
      btn.textContent = db.device && ble.device ? 'اتصل بـ ' + db.device.name : 'اتصل بالميزان';
      btn.dataset.action = 'connect';
    } else if (state === 'demo') {
      btn.textContent = 'أوقف التجربة'; btn.dataset.action = 'stop';
    } else {
      btn.textContent = 'قطع الاتصال'; btn.dataset.action = 'stop';
    }
    $('#btnAll').hidden = state !== 'idle';
    if (hint) setHint(hint);
    else if (state === 'idle') setHint(db.device ? 'اطلع على الميزان عشان يصحى، وبعدين اضغط «اتصل»' : 'اطلع على الميزان عشان يصحى، وبعدين اضغط «اتصل بالميزان» واختره من القائمة');
    else if (state === 'connecting') setHint('لحظة… نتصل بالميزان');
    else if (state === 'connected') setHint('متصل ✓ اطلع على الميزان واثبت');
    else if (state === 'sleep') setHint('الميزان نام. اطلع عليه وراح أتصل تلقائي');
    else if (state === 'demo') setHint('هذي تجربة بأرقام وهمية — ما تنحفظ');
    if (state !== 'connected' && state !== 'demo') setRing(state === 'connecting' || state === 'sleep' ? 'wait' : 'idle');
    else setRing('wait');
  }
  function setHint(t) { $('#hint').textContent = t; }
  function setRing(mode) { $('#dial').dataset.mode = mode; }
  function showNumber(w) { const n = $('#weight'); n.textContent = fmtW(w); n.classList.toggle('empty', w == null); }

  /* ---------- البلوتوث ---------- */
  const ble = { device: null, chars: [], session: null, want: false, timer: null, until: 0, queue: Promise.resolve(), kind: null, battery: null };
  let assembler = P.createAssembler();
  let demo = null;

  function gattOp(fn) { const p = ble.queue.then(fn, fn); ble.queue = p.catch(() => {}); return p; }

  function bluetoothProblem() {
    if (!window.isSecureContext) return 'لازم تفتح التطبيق من رابط يبدأ بـ https';
    if (!navigator.bluetooth) {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'سفاري في الآيفون ما يدعم البلوتوث للمواقع. نزّل متصفح «Bluefy» من App Store وافتح الرابط منه.';
      return 'المتصفح هذا ما يدعم البلوتوث. افتح الرابط من Google Chrome على أندرويد.';
    }
    return null;
  }

  async function choose(all) {
    const prob = bluetoothProblem();
    if (prob) { toast(prob); return; }
    stopDemo();
    const opts = all
      ? { acceptAllDevices: true, optionalServices: P.OPTIONAL_SERVICES }
      : { filters: P.REQUEST_FILTERS, optionalServices: P.OPTIONAL_SERVICES };
    let dev;
    try {
      dev = await navigator.bluetooth.requestDevice(opts);
    } catch (e) {
      if (e && e.name === 'NotFoundError') setHint(all ? 'ما اخترت جهاز. تأكد إن البلوتوث شغال والميزان صاحي' : 'ما اخترت جهاز. ميزانك ما طلع؟ جرّب «اعرض كل الأجهزة»');
      else { log('خطأ اختيار الجهاز: ' + (e && e.message)); toast('ما قدرت أفتح قائمة الأجهزة: ' + ((e && e.message) || '')); }
      return;
    }
    useDevice(dev);
    connect(true);
  }

  function useDevice(dev) {
    if (ble.device && ble.device !== dev) ble.device.removeEventListener('gattserverdisconnected', onDisconnected);
    ble.device = dev;
    dev.addEventListener('gattserverdisconnected', onDisconnected);
    const prev = db.device;
    const same = prev && (prev.id === dev.id || (prev.name && prev.name === dev.name));
    db.device = { name: dev.name || 'الميزان', id: dev.id, mac: same ? prev.mac || null : null };
    save();
    renderDevice();
  }

  async function connect(first) {
    if (!ble.device) return;
    ble.want = true;
    clearTimeout(ble.timer);
    if (first) ble.until = Date.now() + 3 * 60000;
    setConn(first ? 'connecting' : 'sleep');
    log('الاتصال بـ ' + (ble.device.name || ble.device.id) + ' …');
    sniffMac();
    try {
      const server = await ble.device.gatt.connect();
      const services = await server.getPrimaryServices();
      const svcUuids = services.map(s => s.uuid);
      log('الخدمات: ' + svcUuids.map(short).join('، '));
      const chars = [];
      for (const s of services) {
        let cs = [];
        try { cs = await s.getCharacteristics(); } catch (e) { /* خدمة بدون خصائص مسموحة */ }
        for (const c of cs) chars.push({ svc: s.uuid, chr: c.uuid, props: c.properties, ref: c });
      }
      log('الخصائص: ' + chars.map(c => short(c.svc) + '/' + short(c.chr) + '[' + propsText(c.props) + ']').join(' '));
      ble.chars = chars;
      ble.kind = P.detectKind(ble.device.name, svcUuids);
      ble.variant = P.miVariant(ble.device.name, svcUuids);
      log('نوع الميزان: ' + kindLabel(ble.kind) + (ble.kind === 'xiaomi' ? ' (الإصدار ' + ble.variant + ')' : ''));
      makeSession();
      assembler.reset();
      const plan = ble.session.start();
      for (const w of plan.before) await write(w);
      let subs = 0;
      for (const c of chars) {
        if (!(c.props.notify || c.props.indicate)) continue;
        try {
          await gattOp(() => c.ref.startNotifications());
          c.ref.addEventListener('characteristicvaluechanged', onValue); // نفس الدالة ← ما تتكرر
          subs++;
        } catch (e) { log('ما قدرت أشترك في ' + short(c.chr) + ': ' + e.message); }
      }
      for (const w of plan.after) await write(w);
      readInfo();
      setConn('connected');
      if (ble.kind === 'huawei') {
        if (ble.session.needsMac) showMac('ميزان هواوي يشفّر بياناته بعنوانه (MAC)، وكروم ما يعطينا هذا العنوان. اكتبه مرة وحدة وبعدها يشتغل على طول.');
        else { clearTimeout(ble.kickTimer); ble.kickTimer = setTimeout(() => { if (ble.session) applyOut(ble.session.kick()); }, 1200); }
      }
      if (!subs) setHint('اتصلت، بس الميزان هذا ما يرسل بيانات بطريقة أعرفها. افتح «وضع الفحص» من الإعدادات وأرسل السجل.');
      else if (ble.kind === 'unknown') setHint('اتصلت بجهاز ما أعرف نوعه. اطلع على الميزان، ولو ما طلع وزن افتح «وضع الفحص» من الإعدادات.');
      keepAwake(true);
      renderDevice();
    } catch (e) {
      log('فشل الاتصال: ' + (e && e.message));
      if (ble.device && ble.device.gatt.connected) { try { ble.device.gatt.disconnect(); } catch (_) { /* */ } }
      if (ble.want) retryLater();
    }
  }

  function retryLater() {
    clearTimeout(ble.timer);
    if (Date.now() > ble.until) {
      ble.want = false;
      setConn('idle', 'ما لقيت الميزان. اطلع عليه عشان يصحى، وبعدين اضغط «اتصل»');
      return;
    }
    setConn('sleep');
    ble.timer = setTimeout(() => { if (ble.want && ble.device && !ble.device.gatt.connected) connect(false); }, 2500);
  }

  function onDisconnected() {
    log('انقطع الاتصال');
    keepAwake(false);
    if (ble.want) { ble.until = Date.now() + 3 * 60000; retryLater(); }
    else setConn('idle');
  }

  function disconnect() {
    ble.want = false;
    clearTimeout(ble.timer);
    if (ble.device && ble.device.gatt.connected) ble.device.gatt.disconnect();
    setConn('idle');
  }

  function onValue(e) {
    const ch = e.target, dv = ch.value;
    const bytes = new Uint8Array(dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength));
    handleData(ch.service.uuid, ch.uuid, bytes);
  }

  function handleData(svc, chr, bytes) {
    if (!demo) log('← ' + short(chr) + '  ' + P.hex(bytes));
    if (!ble.session) return;
    applyOut(ble.session.onData(svc, chr, bytes));
  }
  function applyOut(out) {
    if (!out) return;
    if (out.note && !demo) log('   ' + out.note);
    for (const w of out.writes) write(w);
    if (out.hint) setHint(out.hint);
    if (out.status === 'measure') setRing('measure');
    if (out.error === 'mac') showMac('ميزان هواوي يحتاج عنوانه (MAC) عشان نفك بياناته. اكتبه تحت.');
    else if (out.error === 'auth') showMac('الميزان رفض الاتصال. غالباً العنوان غلط — تأكد منه. ولو هو صح: اطفي البلوتوث وشغله، وجرب مرة ثانية.');
    else if (out.error === 'decode') showMac('وصل قياس بس الأرقام طلعت غلط، يعني العنوان غالباً غلط. تأكد منه.');
    for (const r of out.readings) for (const ev of assembler.push(r)) onEvent(ev);
  }
  function makeSession() {
    const last = recordsOf(db.activeId).slice(-1)[0];
    ble.session = P.createSession({
      kind: ble.kind, variant: ble.variant,
      chars: ble.chars.map(c => ({ svc: c.svc, chr: c.chr, props: { write: c.props.write, writeWithoutResponse: c.props.writeWithoutResponse } })),
      uniq: active().uniq, profile: active(),
      mac: db.device && P.parseMac(db.device.mac), lastWeightKg: last ? last.w : null
    });
  }

  /* ---------- عنوان ميزان هواوي (MAC) ---------- */
  function showMac(why) {
    const card = $('#macCard');
    if (why) $('#macWhy').textContent = why;
    $('#macInput').value = db.device && db.device.mac ? db.device.mac : '';
    card.hidden = false;
    setHint('اكتب عنوان الميزان تحت عشان نكمّل');
    try { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* */ }
  }
  function formatMacInput() {
    const i = $('#macInput');
    const h = i.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 12);
    i.value = (h.match(/.{1,2}/g) || []).join(':');
  }
  function saveMac(e) {
    e.preventDefault();
    const b = P.parseMac($('#macInput').value);
    if (!b) { toast('العنوان 12 خانة، مثل 5C:CA:D3:12:34:56'); $('#macInput').focus(); return; }
    setMac(P.macText(b), 'انحفظ العنوان ✓');
  }
  function setMac(text, msg) {
    if (!db.device) db.device = { name: (ble.device && ble.device.name) || 'الميزان', id: ble.device ? ble.device.id : null };
    db.device.mac = text; save();
    $('#macCard').hidden = true;
    renderDevice();
    toast(msg);
    log('عنوان الميزان: ' + text);
    if (ble.device && ble.device.gatt.connected && ble.kind === 'huawei') {
      makeSession();
      assembler.reset();
      applyOut(ble.session.kick());
      setHint('متصل ✓ نتحقق من الميزان…');
    }
  }
  // بعض نسخ كروم تسمح نقرأ إعلانات الجهاز؛ نحاول نلقى العنوان فيها
  async function sniffMac() {
    const dev = ble.device;
    if (!dev || !dev.watchAdvertisements || (db.device && db.device.mac)) return;
    if (!dev._mizaniSniff) {
      dev._mizaniSniff = true;
      dev.addEventListener('advertisementreceived', ev => {
        const chunks = [];
        const add = (label, dv) => { const b = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength); chunks.push(Uint8Array.from(b)); log('إعلان ' + label + ': ' + P.hex(b)); };
        if (ev.manufacturerData) ev.manufacturerData.forEach((dv, id) => add('0x' + id.toString(16), dv));
        if (ev.serviceData) ev.serviceData.forEach((dv, u) => add(short(u), dv));
        const mac = P.macFromAdvert(chunks);
        if (mac && db.device && !db.device.mac) setMac(P.macText(mac), 'لقيت عنوان الميزان تلقائي ✓');
      });
    }
    try { await dev.watchAdvertisements(); } catch (e) { log('قراءة إعلانات الجهاز غير متاحة: ' + (e && e.message)); }
  }

  async function write(w) {
    if (demo || !w) return;
    const c = ble.chars.find(x => x.svc === w.svc && x.chr === w.chr) || ble.chars.find(x => x.chr === w.chr);
    if (!c) return;
    log('→ ' + short(w.chr) + '  ' + P.hex(w.data) + (w.label ? '  (' + w.label + ')' : ''));
    try {
      await gattOp(() => {
        if (c.props.write && c.ref.writeValueWithResponse) return c.ref.writeValueWithResponse(w.data);
        if (c.props.writeWithoutResponse && c.ref.writeValueWithoutResponse) return c.ref.writeValueWithoutResponse(w.data);
        return c.ref.writeValue(w.data);
      });
    } catch (e) { log('   فشلت الكتابة: ' + e.message); }
  }

  async function readInfo() {
    const dec = new TextDecoder();
    for (const [chr, label] of [[P.C.MANUFACTURER, 'الشركة'], [P.C.MODEL, 'الموديل']]) {
      const c = ble.chars.find(x => x.chr === chr && x.props.read);
      if (!c) continue;
      try { const v = await gattOp(() => c.ref.readValue()); log(label + ': ' + dec.decode(v).replace(/\0+$/, '')); } catch (e) { /* اختياري */ }
    }
    const b = ble.chars.find(x => x.chr === P.C.BATTERY_LEVEL && x.props.read);
    if (b) {
      try { const v = await gattOp(() => b.ref.readValue()); ble.battery = v.getUint8(0); log('البطارية: ' + ble.battery + '%'); renderDevice(); } catch (e) { /* اختياري */ }
    }
  }

  function propsText(p) {
    return ['read', 'write', 'writeWithoutResponse', 'notify', 'indicate'].filter(k => p[k]).map(k => ({ read: 'R', write: 'W', writeWithoutResponse: 'w', notify: 'N', indicate: 'I' })[k]).join('');
  }
  function kindLabel(k) { return ({ huawei: 'هواوي AH100 / CH100', xiaomi: 'شاومي', standard: 'قياسي (Bluetooth SIG)', qn: 'QN / Renpho / FITINDEX', unknown: 'غير معروف' })[k] || k; }

  /* ---------- إبقاء الشاشة شغالة أثناء الوزن ---------- */
  let wake = null;
  async function keepAwake(on) {
    try {
      if (on && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
      if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) { wake = null; }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (conn === 'connected' || conn === 'sleep')) keepAwake(true); });

  /* ---------- أحداث القياس ---------- */
  let current = null; // {rec, demo}
  function onEvent(ev) {
    if (ev.type === 'live') {
      showNumber(ev.weightKg);
      setRing('measure');
      setHint('اثبت شوي… يقيس');
    } else if (ev.type === 'final') {
      showNumber(ev.m.weightKg);
      setRing('done');
      const rec = toRecord(ev.m);
      if (demo) { rec.demo = true; } else { db.records.push(rec); save(); }
      current = { rec, m: ev.m };
      setHint(demo ? 'تمام ✓ (تجربة — ما انحفظ)' : 'تمام ✓ انحفظ القياس');
      if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* */ } }
      speak(rec.w);
      renderResult();
      if (!demo) renderHistory();
    } else if (ev.type === 'update') {
      if (!current || current.m !== ev.m) return;
      Object.assign(current.rec, extrasOf(ev.m), { w: P.round(ev.m.weightKg, 2) });
      if (!current.rec.demo) save();
      showNumber(ev.m.weightKg);
      renderResult();
      if (!current.rec.demo) renderHistory();
    } else if (ev.type === 'off') {
      if (current) setHint('نزلت من الميزان. اللي بعدك يقدر يطلع');
      setRing(conn === 'connected' || conn === 'demo' ? 'wait' : 'idle');
    } else if (ev.type === 'old') {
      log('   قياس قديم في ذاكرة الميزان: ' + fmtW(ev.m.weightKg) + ' كجم (' + dfDay.format(new Date(ev.m.at)) + ') — ما انحفظ');
    }
  }
  function extrasOf(m) {
    const o = {};
    if (m.impedance != null) o.imp = m.impedance;
    if (m.fatPct != null) o.fat = m.fatPct;
    if (m.musclePct != null) o.mus = m.musclePct;
    if (m.waterPct != null) o.wat = m.waterPct;
    return o;
  }
  function toRecord(m) {
    const pid = pickProfile(m.weightKg);
    const rec = Object.assign({ id: rid('r'), pid, t: m.at || Date.now(), w: P.round(m.weightKg, 2), src: m.source || 'live' }, extrasOf(m));
    // ميزان هواوي يحسب الدهون بعمر وطول وجنس الشخص المختار؛ نحفظ لمن انحسبت
    if (ble.kind === 'huawei' && !demo) { rec.dev = 'huawei'; rec.fatFor = db.activeId; }
    return rec;
  }
  // الدهون تنعرض بس لو انحسبت لنفس صاحب القياس
  const fatOf = r => (r.fat != null && (!r.fatFor || r.fatFor === r.pid) ? r.fat : null);
  // لو فيه أكثر من شخص: نختار اللي آخر وزن له أقرب (فرق 3 كجم أو أقل)، وإلا الشخص المختار
  function pickProfile(w) {
    if (db.profiles.length < 2) return db.activeId;
    let best = null, bestD = 3.01;
    for (const p of db.profiles) {
      const rs = recordsOf(p.id);
      if (!rs.length) continue;
      const d = Math.abs(rs[rs.length - 1].w - w);
      if (d < bestD) { bestD = d; best = p.id; }
    }
    const act = recordsOf(db.activeId);
    if (act.length && Math.abs(act[act.length - 1].w - w) <= 3) return db.activeId;
    return best || db.activeId;
  }

  /* ---------- الصوت ---------- */
  function speak(w) {
    if (!db.settings.voice || !window.speechSynthesis) return;
    try {
      const u = new SpeechSynthesisUtterance('وزنك ' + fmtW(w) + ' كيلو');
      u.lang = 'ar-SA'; u.rate = 0.95;
      const v = speechSynthesis.getVoices().find(x => /^ar/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* الصوت اختياري */ }
  }

  /* ---------- وضع التجربة ---------- */
  function startDemo() {
    if (ble.want) disconnect();
    stopDemo();
    demo = { timers: [] };
    ble.session = P.createSession({ kind: 'xiaomi', variant: 2, chars: [] });
    assembler = P.createAssembler();
    setConn('demo');
    showTab('scale');
    const last = recordsOf(db.activeId).slice(-1)[0];
    const target = P.round(last ? last.w + (Math.random() - 0.5) * 1.2 : 62 + Math.random() * 25, 2);
    const frames = [];
    for (let i = 1; i <= 14; i++) {
      const k = i / 14;
      frames.push({ w: target * (1 - Math.pow(1 - k, 3)) + (Math.random() - 0.5) * (1 - k) * 3, stable: false });
    }
    for (let i = 0; i < 3; i++) frames.push({ w: target, stable: true });
    for (let i = 0; i < 2; i++) frames.push({ w: target, stable: true, impedance: 480 + Math.round(Math.random() * 80) });
    frames.push({ w: 0, removed: true });
    let at = 900;
    frames.forEach((f, i) => {
      at += f.stable ? 700 : 220;
      if (i === frames.length - 1) at += 1600;
      demo.timers.push(setTimeout(() => handleData(P.S.BODY, P.C.MI_HISTORY, P.buildMiLive13(Math.max(0, f.w), f)), at));
    });
    demo.timers.push(setTimeout(() => { stopDemo(); setHint('خلصت التجربة. اربط ميزانك الحقيقي من «اتصل بالميزان»'); }, at + 1800));
    setRing('wait');
    showNumber(null);
    setHint('تجربة: كأنك طلعت على الميزان الحين…');
  }
  function stopDemo() {
    if (!demo) return;
    demo.timers.forEach(clearTimeout);
    demo = null;
    ble.session = null;
    assembler = P.createAssembler();
    setConn('idle');
  }

  /* ---------- بطاقة النتيجة ---------- */
  function renderResult() {
    const box = $('#result');
    if (!current) { box.hidden = true; return; }
    const rec = current.rec;
    const p = profile(rec.pid) || active();
    box.hidden = false;
    box.replaceChildren();

    const head = el('div', { class: 'result-head' }, [
      el('div', {}, [
        el('div', { class: 'result-who', text: (rec.demo ? 'تجربة · ' : 'انحفظ لـ ') + p.name }),
        el('div', { class: 'muted small', text: dfDay.format(new Date(rec.t)) + ' · ' + dfTime.format(new Date(rec.t)) })
      ])
    ]);
    box.append(head);

    const tiles = el('div', { class: 'tiles' });
    const b = P.bmi(rec.w, p.heightCm);
    const bc = P.bmiClass(b);
    if (b != null) {
      tiles.append(tile('مؤشر كتلة الجسم', b.toFixed(1), el('span', { class: 'badge ' + bc.key, text: bc.label })));
    } else {
      tiles.append(tile('مؤشر كتلة الجسم', '—', el('button', { class: 'link', type: 'button', text: 'أضف طولك', onclick: () => editProfile(p.id) })));
    }
    const prev = recordsOf(p.id).filter(r => r.id !== rec.id && r.t < rec.t).slice(-1)[0];
    if (prev) {
      const d = rec.w - prev.w;
      tiles.append(tile('عن آخر مرة', signed(d) + ' كجم', el('span', { class: 'muted small', text: dfShort.format(new Date(prev.t)) })));
    } else {
      tiles.append(tile('عن آخر مرة', '—', el('span', { class: 'muted small', text: 'أول قياس' })));
    }
    if (p.goalKg) {
      const left = rec.w - p.goalKg;
      tiles.append(tile('الهدف ' + fmtW(p.goalKg), Math.abs(left) < 0.05 ? 'وصلت 🎉' : (left > 0 ? 'باقي ' + left.toFixed(1) : 'تحت بـ ' + Math.abs(left).toFixed(1)), el('span', { class: 'muted small', text: Math.abs(left) < 0.05 ? '' : 'كجم' })));
    }
    if (fatOf(rec) != null) tiles.append(tile('الدهون', fatOf(rec).toFixed(1) + '%', el('span', { class: 'muted small', text: 'من الميزان' })));
    else if (rec.fat != null) tiles.append(tile('الدهون', '—', el('span', { class: 'muted small', text: 'انحسبت لـ ' + ((profile(rec.fatFor) || {}).name || 'شخص ثاني') })));
    if (rec.mus != null) tiles.append(tile('العضل', rec.mus.toFixed(1) + '%', null));
    if (rec.wat != null) tiles.append(tile('الماء', rec.wat.toFixed(1) + '%', null));
    if (rec.imp != null) tiles.append(tile('مقاومة الجسم', Math.round(rec.imp) + ' Ω', el('span', { class: 'muted small', text: 'تُستخدم لحساب الدهون' })));
    box.append(tiles);

    if (!rec.demo) {
      const others = db.profiles.filter(x => x.id !== rec.pid);
      const row = el('div', { class: 'result-actions' });
      if (others.length) {
        row.append(el('span', { class: 'muted small', text: 'مو ' + p.name + '؟' }));
        for (const o of others) row.append(el('button', { class: 'chip', type: 'button', text: o.name, onclick: () => { rec.pid = o.id; save(); renderResult(); renderHistory(); toast('انتقل القياس لـ ' + o.name); } }));
      }
      row.append(el('button', { class: 'link danger', type: 'button', text: 'احذف القياس', onclick: () => { if (confirm('تحذف هذا القياس؟')) { deleteRecord(rec.id); current = null; renderResult(); } } }));
      box.append(row);
    }
  }
  function tile(label, value, extra) {
    return el('div', { class: 'tile' }, [el('div', { class: 'tile-label', text: label }), el('div', { class: 'tile-value', text: value }), extra]);
  }

  /* ---------- اختيار الشخص ---------- */
  function renderWho() {
    for (const box of $$('.who')) {
      box.replaceChildren();
      for (const p of db.profiles) {
        box.append(el('button', {
          class: 'chip' + (p.id === db.activeId ? ' on' : ''), type: 'button', 'aria-pressed': String(p.id === db.activeId), text: p.name,
          onclick: () => {
            db.activeId = p.id; save(); renderWho(); renderHistory();
            if (ble.session && ble.session.setProfile && conn === 'connected') applyOut(ble.session.setProfile(p));
          }
        }));
      }
      box.append(el('button', { class: 'chip add', type: 'button', 'aria-label': 'أضف شخص', text: '+ شخص', onclick: () => editProfile(null) }));
    }
  }

  /* ---------- السجل والرسم ---------- */
  let range = 30, showAll = false;
  function renderHistory() {
    const p = active();
    const all = recordsOf(p.id);
    const from = range ? Date.now() - range * 86400000 : 0;
    const pts = all.filter(r => r.t >= from);
    $('#histTitle').textContent = 'وزن ' + p.name;

    const stats = $('#stats');
    stats.replaceChildren();
    if (pts.length) {
      const ws = pts.map(r => r.w);
      const lastR = pts[pts.length - 1];
      stats.append(
        tile('آخر وزن', fmtW(lastR.w), el('span', { class: 'muted small', text: dfShort.format(new Date(lastR.t)) })),
        tile('التغيّر بالفترة', pts.length > 1 ? signed(lastR.w - pts[0].w) : '—', el('span', { class: 'muted small', text: 'كجم' })),
        tile('أقل', fmtW(Math.min.apply(null, ws)), null),
        tile('أعلى', fmtW(Math.max.apply(null, ws)), null)
      );
    }
    drawChart($('#chart'), pts, p.goalKg);

    const list = $('#list');
    list.replaceChildren();
    if (!all.length) { list.append(el('p', { class: 'empty', text: 'ما فيه قياسات لـ ' + p.name + ' للحين. اطلع على الميزان أو أضف وزن يدوي.' })); return; }
    const rev = all.slice().reverse();
    const shown = showAll ? rev : rev.slice(0, 30);
    shown.forEach((r, i) => {
      const prev = rev[i + 1];
      const d = prev ? r.w - prev.w : null;
      const b = P.bmi(r.w, p.heightCm);
      list.append(el('li', { class: 'row' }, [
        el('div', { class: 'row-main' }, [
          el('div', { class: 'row-w' }, [fmtW(r.w), el('small', { text: ' كجم' })]),
          el('div', { class: 'muted small', text: dfDay.format(new Date(r.t)) + ' · ' + dfTime.format(new Date(r.t)) + (r.src === 'manual' ? ' · يدوي' : '') })
        ]),
        el('div', { class: 'row-side' }, [
          d == null ? null : el('span', { class: 'delta ' + (d > 0.05 ? 'up' : d < -0.05 ? 'down' : 'same'), text: signed(d) }),
          b == null ? null : el('span', { class: 'muted small', text: 'BMI ' + b.toFixed(1) }),
          fatOf(r) != null ? el('span', { class: 'muted small', text: 'دهون ' + fatOf(r).toFixed(1) + '%' }) : null
        ]),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'احذف', title: 'احذف', text: '✕', onclick: () => { if (confirm('تحذف قياس ' + fmtW(r.w) + ' كجم؟')) deleteRecord(r.id); } })
      ]));
    });
    if (rev.length > shown.length) list.append(el('li', { class: 'more' }, [el('button', { class: 'btn small', type: 'button', text: 'اعرض الكل (' + rev.length + ')', onclick: () => { showAll = true; renderHistory(); } })]));
  }
  function deleteRecord(id) {
    db.records = db.records.filter(r => r.id !== id);
    save(); renderHistory();
    if (current && current.rec.id === id) { current = null; renderResult(); }
  }

  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function niceStep(span) { const raw = span / 4; for (const s of [0.2, 0.5, 1, 2, 5, 10, 20]) if (raw <= s) return s; return 50; }
  function drawChart(host, pts, goal) {
    host.replaceChildren();
    const tip = $('#chartTip');
    tip.hidden = true;
    if (pts.length < 2) {
      host.append(el('p', { class: 'empty', text: pts.length ? 'قياس واحد بالفترة هذي — الرسم يطلع من قياسين وفوق' : 'ما فيه قياسات بالفترة هذي' }));
      return;
    }
    const W = Math.max(280, host.clientWidth || 320), H = 210;
    const pad = { l: 40, r: 46, t: 16, b: 28 };
    let lo = Math.min.apply(null, pts.map(p => p.w)), hi = Math.max.apply(null, pts.map(p => p.w));
    if (goal) { lo = Math.min(lo, goal); hi = Math.max(hi, goal); }
    if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
    const step = niceStep(hi - lo);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    const x = t => pad.l + (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)) * (W - pad.l - pad.r);
    const y = w => pad.t + (1 - (w - lo) / (hi - lo)) * (H - pad.t - pad.b);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'رسم تغيّر الوزن' });

    for (let v = lo; v <= hi + 1e-9; v += step) {
      s.append(svg('line', { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: 'grid' }));
      const t = svg('text', { x: pad.l - 8, y: y(v) + 4, class: 'axis', 'text-anchor': 'end' });
      t.textContent = step < 1 ? v.toFixed(1) : String(Math.round(v));
      s.append(t);
    }
    const nTicks = Math.min(4, pts.length);
    for (let i = 0; i < nTicks; i++) {
      const tt = t0 + (t1 - t0) * (nTicks === 1 ? 0.5 : i / (nTicks - 1));
      const t = svg('text', { x: x(tt), y: H - 8, class: 'axis', 'text-anchor': i === 0 ? 'start' : i === nTicks - 1 ? 'end' : 'middle' });
      t.textContent = dfShort.format(new Date(tt));
      s.append(t);
    }
    if (goal) {
      s.append(svg('line', { x1: pad.l, x2: W - pad.r, y1: y(goal), y2: y(goal), class: 'goal' }));
      const gt = svg('text', { x: pad.l + 4, y: y(goal) - 6, class: 'axis' });
      gt.textContent = 'الهدف ' + fmtW(goal);
      s.append(gt);
    }
    const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p.w).toFixed(1)).join(' ');
    s.append(svg('path', { d: d + ' L' + x(t1).toFixed(1) + ' ' + y(lo) + ' L' + x(t0).toFixed(1) + ' ' + y(lo) + ' Z', class: 'area' }));
    s.append(svg('path', { d, class: 'line' }));
    const last = pts[pts.length - 1];
    s.append(svg('circle', { cx: x(last.t), cy: y(last.w), r: 4, class: 'dot' }));
    const lt = svg('text', { x: x(last.t) + 8, y: y(last.w) + 4, class: 'end-label', 'text-anchor': 'start' });
    lt.textContent = fmtW(last.w);
    s.append(lt);

    const cross = svg('line', { y1: pad.t, y2: H - pad.b, class: 'cross', visibility: 'hidden' });
    const hot = svg('circle', { r: 5, class: 'dot', visibility: 'hidden' });
    s.append(cross, hot);
    const hit = svg('rect', { x: pad.l, y: 0, width: W - pad.l - pad.r, height: H, fill: 'transparent' });
    s.append(hit);
    const move = ev => {
      const box = s.getBoundingClientRect();
      const px = (ev.clientX - box.left) * (W / box.width);
      let best = pts[0];
      for (const p of pts) if (Math.abs(x(p.t) - px) < Math.abs(x(best.t) - px)) best = p;
      const bx = x(best.t), by = y(best.w);
      cross.setAttribute('x1', bx); cross.setAttribute('x2', bx); cross.setAttribute('visibility', 'visible');
      hot.setAttribute('cx', bx); hot.setAttribute('cy', by); hot.setAttribute('visibility', 'visible');
      tip.replaceChildren(el('strong', { text: fmtW(best.w) + ' كجم' }), el('span', { text: dfDay.format(new Date(best.t)) }));
      tip.hidden = false;
      const left = bx / W * box.width;
      tip.style.left = Math.max(4, Math.min(box.width - tip.offsetWidth - 4, left - tip.offsetWidth / 2)) + 'px';
      tip.style.top = Math.max(0, by / H * box.height - 58) + 'px';
    };
    const leave = () => { cross.setAttribute('visibility', 'hidden'); hot.setAttribute('visibility', 'hidden'); tip.hidden = true; };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', leave);
    host.append(s);
  }

  /* ---------- الأشخاص ---------- */
  function editProfile(id) {
    const dlg = $('#profileDlg');
    const p = id ? profile(id) : null;
    $('#pdTitle').textContent = p ? 'تعديل ' + p.name : 'شخص جديد';
    $('#pdName').value = p ? p.name : '';
    $('#pdHeight').value = p && p.heightCm ? p.heightCm : '';
    $('#pdGoal').value = p && p.goalKg ? p.goalKg : '';
    $('#pdSex').value = p && p.sex ? p.sex : '';
    $('#pdAge').value = p && p.age ? p.age : '';
    $('#pdDelete').hidden = !p || db.profiles.length < 2;
    dlg.dataset.id = id || '';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    setTimeout(() => $('#pdName').focus(), 50);
  }
  function numOrNull(v, lo, hi) { const n = parseFloat(String(v).replace(/[,٫]/, '.').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return isFinite(n) && n >= lo && n <= hi ? P.round(n, 1) : null; }
  function saveProfileFromDialog(e) {
    e.preventDefault();
    const dlg = $('#profileDlg');
    const name = $('#pdName').value.trim();
    if (!name) { $('#pdName').focus(); return; }
    let p = dlg.dataset.id ? profile(dlg.dataset.id) : null;
    if (!p) { p = newProfile(name); db.profiles.push(p); db.activeId = p.id; }
    p.name = name.slice(0, 24);
    p.heightCm = numOrNull($('#pdHeight').value, 50, 250);
    p.goalKg = numOrNull($('#pdGoal').value, 10, 300);
    p.sex = $('#pdSex').value || null;
    const age = numOrNull($('#pdAge').value, 5, 110);
    p.age = age == null ? null : Math.round(age);
    if (p.id === db.activeId && ble.session && ble.session.setProfile) applyOut(ble.session.setProfile(p));
    save(); dlg.close();
    renderAll();
  }
  function deleteProfile() {
    const dlg = $('#profileDlg');
    const p = profile(dlg.dataset.id);
    if (!p || db.profiles.length < 2) return;
    const n = recordsOf(p.id).length;
    if (!confirm('تحذف ' + p.name + (n ? ' و ' + n + ' قياس؟' : '؟'))) return;
    db.profiles = db.profiles.filter(x => x.id !== p.id);
    db.records = db.records.filter(r => r.pid !== p.id);
    if (db.activeId === p.id) db.activeId = db.profiles[0].id;
    save(); dlg.close(); renderAll();
  }
  function renderProfiles() {
    const box = $('#profiles');
    box.replaceChildren();
    for (const p of db.profiles) {
      const n = recordsOf(p.id).length;
      box.append(el('li', { class: 'row' }, [
        el('div', { class: 'row-main' }, [
          el('div', { class: 'row-title', text: p.name }),
          el('div', { class: 'muted small', text: [p.heightCm ? 'الطول ' + p.heightCm + ' سم' : 'الطول غير محدد', p.sex ? (p.sex === 'f' ? 'أنثى' : 'ذكر') : null, p.age ? p.age + ' سنة' : null, p.goalKg ? 'الهدف ' + fmtW(p.goalKg) : null, n + ' قياس'].filter(Boolean).join(' · ') })
        ]),
        el('button', { class: 'btn small', type: 'button', text: 'تعديل', onclick: () => editProfile(p.id) })
      ]));
    }
  }

  /* ---------- الجهاز ---------- */
  function renderDevice() {
    const box = $('#deviceInfo');
    if (!db.device) { box.textContent = 'ما ربطت ميزان للحين.'; $('#btnForget').hidden = true; return; }
    box.textContent = db.device.name + (ble.kind ? ' · ' + kindLabel(ble.kind) : '') + (ble.battery != null ? ' · البطارية ' + ble.battery + '%' : '') + (db.device.mac ? ' · ' + db.device.mac : '');
    $('#btnForget').hidden = false;
  }
  async function forgetDevice() {
    disconnect();
    try { if (ble.device && ble.device.forget) await ble.device.forget(); } catch (e) { /* */ }
    ble.device = null; ble.kind = null; ble.battery = null; db.device = null; save();
    renderDevice(); setConn('idle');
    toast('نسيت الميزان. تقدر تربطه من جديد');
  }
  // كروم يتذكر الأجهزة اللي سمحت لها (لو المتصفح يدعم getDevices)
  async function restoreDevice() {
    if (!navigator.bluetooth || !navigator.bluetooth.getDevices || !db.device) return;
    try {
      const list = await navigator.bluetooth.getDevices();
      const dev = list.find(d => d.id === db.device.id) || list[0];
      if (dev) { useDevice(dev); setConn('idle'); }
    } catch (e) { /* غير مدعوم */ }
  }

  /* ---------- إضافة يدوية + تصدير/استيراد ---------- */
  function addManual(e) {
    e.preventDefault();
    const w = numOrNull($('#manW').value, 2, 300);
    if (w == null) { toast('اكتب وزن صحيح بالكيلو'); return; }
    const dt = $('#manT').value ? new Date($('#manT').value).getTime() : Date.now();
    db.records.push({ id: rid('r'), pid: db.activeId, t: isFinite(dt) ? dt : Date.now(), w, src: 'manual' });
    save(); $('#manW').value = ''; setManualNow();
    renderHistory(); toast('انحفظ ' + fmtW(w) + ' كجم');
  }
  function setManualNow() {
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $('#manT').value = now.toISOString().slice(0, 16);
  }
  function download(name, text, type) {
    const a = el('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function exportCsv() {
    const rows = [['الشخص', 'التاريخ', 'الوزن (كجم)', 'BMI', 'الدهون %', 'العضل %', 'الماء %', 'المقاومة', 'المصدر']];
    for (const r of db.records.slice().sort((a, b) => a.t - b.t)) {
      const p = profile(r.pid) || {};
      const b = P.bmi(r.w, p.heightCm);
      rows.push([p.name || '', new Date(r.t).toISOString().replace('T', ' ').slice(0, 16), r.w, b == null ? '' : b, fatOf(r) == null ? '' : fatOf(r), r.mus == null ? '' : r.mus, r.wat == null ? '' : r.wat, r.imp == null ? '' : r.imp, r.src]);
    }
    const csv = '﻿' + rows.map(r => r.map(c => /[",\n]/.test(String(c)) ? '"' + String(c).replace(/"/g, '""') + '"' : c).join(',')).join('\n');
    download('mizani-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
  }
  function exportJson() { download('mizani-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(db, null, 1), 'application/json'); }
  function importJson(file) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const s = JSON.parse(rd.result);
        if (!s || s.v !== 1 || !Array.isArray(s.profiles) || !Array.isArray(s.records)) throw new Error('bad');
        if (!confirm('تستبدل بياناتك الحالية بالنسخة هذي؟ (' + s.records.length + ' قياس)')) return;
        db = s; if (!profile(db.activeId)) db.activeId = db.profiles[0].id; db.settings = db.settings || { voice: true };
        save(); renderAll(); toast('رجعت النسخة ✓');
      } catch (e) { toast('الملف هذا مو نسخة من ميزاني'); }
    };
    rd.readAsText(file);
  }

  /* ---------- التبويبات ---------- */
  function showTab(name) {
    for (const s of $$('main > section')) s.hidden = s.id !== 'tab-' + name;
    for (const b of $$('.tabs button')) b.setAttribute('aria-current', String(b.dataset.tab === name));
    if (name === 'history') { renderHistory(); if (document.activeElement !== $('#manT')) setManualNow(); }
    if (name === 'settings') { renderProfiles(); renderDevice(); }
    window.scrollTo(0, 0);
  }

  /* ---------- التثبيت كتطبيق ---------- */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#btnInstall').hidden = false; $('#installHelp').hidden = true; });
  window.addEventListener('appinstalled', () => { $('#btnInstall').hidden = true; toast('تثبّت ميزاني ✓'); });

  function renderAll() { renderWho(); renderResult(); renderHistory(); renderProfiles(); renderDevice(); }

  /* ---------- التشغيل ---------- */
  function init() {
    const prob = bluetoothProblem();
    if (prob) { const b = $('#support'); b.textContent = prob; b.hidden = false; }
    $('#btnConnect').addEventListener('click', () => {
      const a = $('#btnConnect').dataset.action;
      if (a === 'stop') { if (demo) stopDemo(); else disconnect(); return; }
      if (ble.device) { ble.until = Date.now() + 3 * 60000; connect(true); } else choose(false);
    });
    $('#btnAll').addEventListener('click', () => choose(true));
    $('#btnDemo').addEventListener('click', startDemo);
    $('#btnDemo2').addEventListener('click', startDemo);
    for (const b of $$('.tabs button')) b.addEventListener('click', () => showTab(b.dataset.tab));
    for (const b of $$('#range button')) b.addEventListener('click', () => {
      range = +b.dataset.days;
      for (const x of $$('#range button')) x.setAttribute('aria-pressed', String(x === b));
      renderHistory();
    });
    $('#profileForm').addEventListener('submit', saveProfileFromDialog);
    $('#pdCancel').addEventListener('click', () => $('#profileDlg').close());
    $('#pdDelete').addEventListener('click', deleteProfile);
    $('#btnAddProfile').addEventListener('click', () => editProfile(null));
    $('#manualForm').addEventListener('submit', addManual);
    $('#btnCsv').addEventListener('click', exportCsv);
    $('#btnJson').addEventListener('click', exportJson);
    $('#fileImport').addEventListener('change', e => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
    $('#btnForget').addEventListener('click', forgetDevice);
    $('#btnMac').addEventListener('click', () => { showTab('scale'); showMac(null); $('#macInput').focus(); });
    $('#macCard').addEventListener('submit', saveMac);
    $('#macInput').addEventListener('input', formatMacInput);
    const voice = $('#optVoice');
    voice.checked = db.settings.voice !== false;
    voice.addEventListener('change', () => { db.settings.voice = voice.checked; save(); if (voice.checked) speak(70.5); });
    $('#btnInstall').addEventListener('click', async () => { if (!installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; $('#btnInstall').hidden = true; });
    $('#diag').addEventListener('toggle', () => { if ($('#diag').open) $('#log').textContent = logLines.join('\n') || '—'; });
    $('#btnCopyLog').addEventListener('click', async () => {
      const text = 'ميزاني — سجل الفحص\n' + navigator.userAgent + '\n\n' + logLines.join('\n');
      try {
        if (navigator.share) await navigator.share({ title: 'سجل ميزاني', text });
        else { await navigator.clipboard.writeText(text); toast('انسخ السجل ✓'); }
      } catch (e) { try { await navigator.clipboard.writeText(text); toast('انسخ السجل ✓'); } catch (_) { toast('ما قدرت أنسخ'); } }
    });
    $('#btnClearLog').addEventListener('click', () => { logLines.length = 0; $('#log').textContent = ''; });
    let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (!$('#tab-history').hidden) renderHistory(); }, 150); });

    setManualNow();

    renderAll();
    setConn('idle');
    restoreDevice();
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('scale-sw.js', { scope: './scale' }).catch(() => { /* التطبيق يشتغل بدونه */ });
    }
    // للاختبارات الآلية فقط
    window.__mizani = { handleData, onEvent, get db() { return db; }, startDemo, stopDemo };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
