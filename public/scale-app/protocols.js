/* ============================================================
   scale-app/protocols.js — فك بيانات موازين الجسم بالبلوتوث (BLE)

   ملف «نقي» بدون أي واجهة أو بلوتوث فعلي: ياخذ البايتات اللي يرسلها الميزان
   ويطلع منها قراءة وزن مفهومة، ويقول للتطبيق وش يكتب للميزان (لو يحتاج).
   عشان كذا نقدر نختبره بـ node بدون ميزان.

   الموازين المدعومة:
     • المعيار الرسمي للبلوتوث: Weight Scale 0x181D و Body Composition 0x181B
     • شاومي Mi Scale (الإصدار 1) و Mi Body Composition Scale (الإصدار 2)
     • موازين QN / Yolanda / Renpho / FITINDEX (خدمة 0xFFE0 أو 0xFFF0)
   وأي ميزان ثاني: البايتات تنعرض كما هي في «وضع الفحص» عشان نضيف دعمه.

   مراجع البروتوكولات: مواصفات Bluetooth SIG، وملاحظات مشروع openScale المفتوح
   (الكود هنا مكتوب من الصفر، والمأخوذ منها ترتيب البايتات فقط).

   الواجهة (window.ScaleProto أو module.exports):
     uuid16(n), S, C, OPTIONAL_SERVICES, REQUEST_FILTERS
     detectKind(name, serviceUuids)            ← 'xiaomi' | 'standard' | 'qn' | 'unknown'
     createSession({kind, variant, chars, uniq, profile, now})
         .start()                → {before:[write], after:[write]}
         .onData(svc, chr, u8)   → {readings:[reading], writes:[write], note}
     createAssembler({now})
         .push(reading)          → [event]  (live | final | update | off | old)
     parseStdWeight, parseStdBodyComp, parseMiLive13, parseMi10, parseQN
     buildMiLive13, buildStdWeight  (لوضع التجربة والاختبارات)
     bmi, bmiClass, toKg, hex
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- معرّفات الخدمات والخصائص ---------- */
  const BASE = '-0000-1000-8000-00805f9b34fb';
  function uuid16(n) { return '0000' + n.toString(16).padStart(4, '0') + BASE; }

  const S = {
    WEIGHT: uuid16(0x181D),        // Weight Scale
    BODY: uuid16(0x181B),          // Body Composition
    USER_DATA: uuid16(0x181C),
    DEVICE_INFO: uuid16(0x180A),
    BATTERY: uuid16(0x180F),
    CURRENT_TIME: uuid16(0x1805),
    QN1: uuid16(0xFFE0),
    QN2: uuid16(0xFFF0),
    QN_AE: uuid16(0xAE00),
    MI_CFG: '00001530-0000-3512-2118-0009af100700'
  };

  const C = {
    WEIGHT_MEAS: uuid16(0x2A9D),
    BODY_MEAS: uuid16(0x2A9C),
    CURRENT_TIME: uuid16(0x2A2B),
    BATTERY_LEVEL: uuid16(0x2A19),
    MANUFACTURER: uuid16(0x2A29),
    MODEL: uuid16(0x2A24),
    MI_HISTORY: '00002a2f-0000-3512-2118-0009af100700',
    MI_CONFIG: '00001542-0000-3512-2118-0009af100700',
    QN_T1_NOTIFY: uuid16(0xFFE1),
    QN_T1_INDICATE: uuid16(0xFFE2),
    QN_T1_CONFIG: uuid16(0xFFE3),
    QN_T1_TIME: uuid16(0xFFE4),
    QN_T2_NOTIFY: uuid16(0xFFF1),
    QN_T2_WRITE: uuid16(0xFFF2)
  };

  // كروم ما يسمح نقرأ أي خدمة ما ذكرناها هنا — فنذكر المعروفة + خدمات شائعة في
  // الموازين الصينية عشان «وضع الفحص» يشوف بياناتها.
  const OPTIONAL_SERVICES = [
    S.WEIGHT, S.BODY, S.USER_DATA, S.DEVICE_INFO, S.BATTERY, S.CURRENT_TIME,
    S.QN1, S.QN2, S.QN_AE, S.MI_CFG,
    uuid16(0xFFA0), uuid16(0xFFB0), uuid16(0xFFC0), uuid16(0xFFD0),
    uuid16(0x1A10), uuid16(0xFEE7), uuid16(0xFFF5)
  ];

  // فلاتر قائمة الأجهزة: تطلع الموازين المعروفة فقط (وفيه زر «كل الأجهزة» للباقي)
  const REQUEST_FILTERS = [
    { services: [S.WEIGHT] }, { services: [S.BODY] },
    { services: [S.QN1] }, { services: [S.QN2] },
    { namePrefix: 'MI' }, { namePrefix: 'QN' },
    { namePrefix: 'Renpho' }, { namePrefix: 'RENPHO' }, { namePrefix: 'Yolanda' }
  ];

  /* ---------- أدوات صغيرة ---------- */
  const u8 = (d, i) => d[i] & 0xFF;
  const u16le = (d, i) => (d[i] & 0xFF) | ((d[i + 1] & 0xFF) << 8);
  const u16be = (d, i) => ((d[i] & 0xFF) << 8) | (d[i + 1] & 0xFF);
  const round = (x, n) => { const p = Math.pow(10, n == null ? 2 : n); return Math.round(x * p) / p; };
  function hex(d) { return Array.from(d || [], b => (b & 0xFF).toString(16).padStart(2, '0')).join(' '); }
  function fromHex(s) { return Uint8Array.from(String(s).trim().split(/[\s:,-]+/).filter(Boolean).map(h => parseInt(h, 16))); }
  function sum8(arr) { let s = 0; for (const b of arr) s = (s + (b & 0xFF)) & 0xFF; return s; }

  const LB = 0.45359237;
  function toKg(v, unit) { return unit === 'lb' ? v * LB : unit === 'jin' ? v * 0.5 : v; }
  const plausibleKg = w => typeof w === 'number' && isFinite(w) && w >= 2 && w <= 300;

  function bmi(weightKg, heightCm) {
    if (!plausibleKg(weightKg) || !(heightCm >= 50 && heightCm <= 250)) return null;
    const m = heightCm / 100;
    return round(weightKg / (m * m), 1);
  }
  // تصنيف منظمة الصحة العالمية للكبار
  function bmiClass(b) {
    if (b == null) return null;
    if (b < 18.5) return { key: 'under', label: 'أقل من الطبيعي' };
    if (b < 25) return { key: 'normal', label: 'طبيعي' };
    if (b < 30) return { key: 'over', label: 'زيادة وزن' };
    return { key: 'obese', label: 'سمنة' };
  }

  function readTime(d, i) {
    const y = u16le(d, i), mo = u8(d, i + 2), da = u8(d, i + 3), h = u8(d, i + 4), mi = u8(d, i + 5), s = u8(d, i + 6);
    if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || da < 1 || da > 31 || h > 23 || mi > 59 || s > 59) return null;
    return new Date(y, mo - 1, da, h, mi, s).getTime();
  }

  /* ---------- المعيار الرسمي: Weight Measurement 0x2A9D ---------- */
  function parseStdWeight(d) {
    if (!d || d.length < 3) return null;
    const flags = u8(d, 0);
    const unit = (flags & 0x01) ? 'lb' : 'kg';
    let o = 1;
    const raw = u16le(d, o); o += 2;
    const native = raw * (unit === 'lb' ? 0.01 : 0.005);
    const r = { kind: 'std-weight', flags, unit, weightKg: round(toKg(native, unit), 2) };
    if (raw === 0xFFFF) r.weightKg = null; // «القياس فشل» حسب المواصفة
    if (flags & 0x02) { if (d.length >= o + 7) r.ts = readTime(d, o); o += 7; }
    if (flags & 0x04) { if (d.length > o) r.userIndex = u8(d, o); o += 1; }
    if (flags & 0x08) {
      if (d.length >= o + 4) { r.bmi = round(u16le(d, o) * 0.1, 1); r.heightCm = round(u16le(d, o + 2) * (unit === 'lb' ? 2.54 * 0.1 : 0.1), 1); }
      o += 4;
    }
    return r;
  }

  /* ---------- المعيار الرسمي: Body Composition Measurement 0x2A9C ---------- */
  function parseStdBodyComp(d) {
    if (!d || d.length < 4) return null;
    const flags = u16le(d, 0);
    const unit = (flags & 0x0001) ? 'lb' : 'kg';
    const mass = v => round(toKg(v * (unit === 'lb' ? 0.01 : 0.005), unit), 2);
    let o = 2;
    const r = { kind: 'std-body', flags, unit };
    const fatRaw = u16le(d, o); o += 2;
    if (fatRaw !== 0xFFFF) r.fatPct = round(fatRaw * 0.1, 1);
    const need = n => d.length >= o + n;
    if (flags & 0x0002) { if (need(7)) r.ts = readTime(d, o); o += 7; }
    if (flags & 0x0004) { if (need(1)) r.userIndex = u8(d, o); o += 1; }
    if (flags & 0x0008) { if (need(2)) r.bmrKcal = Math.round(u16le(d, o) / 4.1868); o += 2; }
    if (flags & 0x0010) { if (need(2)) r.musclePct = round(u16le(d, o) * 0.1, 1); o += 2; }
    if (flags & 0x0020) { if (need(2)) r.muscleKg = mass(u16le(d, o)); o += 2; }
    if (flags & 0x0040) { if (need(2)) r.fatFreeKg = mass(u16le(d, o)); o += 2; }
    if (flags & 0x0080) { if (need(2)) r.softLeanKg = mass(u16le(d, o)); o += 2; }
    if (flags & 0x0100) { if (need(2)) r.waterKg = mass(u16le(d, o)); o += 2; }
    if (flags & 0x0200) { if (need(2)) r.impedance = round(u16le(d, o) * 0.1, 1); o += 2; }
    if (flags & 0x0400) { if (need(2)) r.weightKg = mass(u16le(d, o)); o += 2; }
    if (flags & 0x0800) { if (need(2)) r.heightCm = round(u16le(d, o) * (unit === 'lb' ? 0.254 : 0.1), 1); o += 2; }
    r.multiPacket = !!(flags & 0x1000);
    return r;
  }

  /* ---------- شاومي ---------- */
  // إطار حي 13 بايت (الإصدار 2): [c0][c1][سنة LE][شهر][يوم][س][د][ث][مقاومة LE][وزن LE]
  function parseMiLive13(d) {
    if (!d || d.length !== 13) return null;
    const c0 = u8(d, 0), c1 = u8(d, 1);
    const unit = (c0 & 0x01) ? 'lb' : (c1 & 0x40) ? 'jin' : 'kg';
    const raw = u16le(d, 11);
    const native = unit === 'kg' ? raw / 200 : raw / 100;
    const r = {
      kind: 'mi-live', unit,
      weightKg: round(toKg(native, unit), 2),
      stable: !!(c1 & 0x20),
      removed: !!(c1 & 0x80),
      ts: readTime(d, 2)
    };
    if (c1 & 0x02) { const imp = u16le(d, 9); if (imp > 0 && imp < 3000) r.impedance = imp; }
    return r;
  }
  // هل يشبه إطار شاومي الحي؟ (نفرّقه عن إطار المعيار اللي بنفس الطول)
  function looksMiLive13(d) {
    if (!d || d.length !== 13) return false;
    const y = u16le(d, 2), mo = u8(d, 4), da = u8(d, 5);
    return y >= 2000 && y <= 2100 && mo >= 1 && mo <= 12 && da >= 1 && da <= 31;
  }
  // سجل 10 بايت (الإصدار 1 والسجل): [حالة][وزن LE][سنة LE][شهر][يوم][س][د][ث]
  function parseMi10(d) {
    if (!d || d.length !== 10) return null;
    const st = u8(d, 0);
    const unit = (st & 0x01) ? 'lb' : (st & 0x10) ? 'jin' : 'kg';
    const raw = u16le(d, 1);
    const native = unit === 'kg' ? raw / 200 : raw / 100;
    return {
      kind: 'mi-10', unit,
      weightKg: round(toKg(native, unit), 2),
      stable: !!(st & 0x20),
      removed: !!(st & 0x80),
      ts: readTime(d, 3)
    };
  }

  /* ---------- QN / Renpho / FITINDEX ---------- */
  const QN_EPOCH = 946702800; // ثواني من 2000-01-01 بنفس قيمة openScale المجرّبة
  function parseQN(d, factor) {
    // كل إطار: [رمز][الطول][نوع البروتوكول]...[مجموع تحقق]
    if (!d || d.length < 3 || u8(d, 1) !== d.length) return null;
    const op = u8(d, 0);
    const r = { kind: 'qn', op, proto: u8(d, 2), checksumOk: sum8(d.slice(0, d.length - 1)) === u8(d, d.length - 1) };
    if (op === 0x12 && d.length > 10) r.factor = u8(d, 10) === 1 ? 100 : 10;
    if (op === 0x10) {
      const f = factor || 100;
      const b4 = u8(d, 4);
      let raw, imp;
      if (b4 <= 0x02 && f === 10 && d.length >= 11) {
        r.format = 'es30m';
        r.stable = r.proto === 0xFF ? b4 === 0x02 : (b4 === 0x02 || b4 === 0x01);
        raw = u16be(d, 5); imp = u16be(d, 7);
      } else if (d.length >= 10) {
        r.format = 'classic';
        r.stable = u8(d, 5) === 1;
        raw = u16be(d, 3); imp = u16be(d, 6);
      } else return r;
      let w = raw / f;
      if (w >= 250) w = w / 10;
      r.weightKg = round(w, 2);
      const ohm = r.proto === 0xFF ? imp / 10 : imp;
      if (ohm > 0 && ohm < 3000) r.impedance = round(ohm, 1);
    }
    return r;
  }
  function qnFrame(bytes) { const a = bytes.slice(); a.push(0); a[a.length - 1] = sum8(a.slice(0, -1)); return Uint8Array.from(a); }
  function le32(t) { return [t & 0xFF, (t >>> 8) & 0xFF, (t >>> 16) & 0xFF, (t >>> 24) & 0xFF]; }

  /* ---------- كشف نوع الميزان ---------- */
  function detectKind(name, serviceUuids) {
    const n = String(name || '').toUpperCase();
    const has = u => (serviceUuids || []).indexOf(u) !== -1;
    if (n.startsWith('MIBCS') || n.startsWith('MIBFS') || n === 'MI SCALE2' || n.startsWith('MI_SCALE') || has(S.MI_CFG)) return 'xiaomi';
    if (has(S.WEIGHT) || has(S.BODY)) return 'standard';
    if (has(S.QN1) || has(S.QN2)) return 'qn';
    return 'unknown';
  }
  function miVariant(name, serviceUuids) {
    const n = String(name || '').toUpperCase();
    return ((serviceUuids || []).indexOf(S.MI_CFG) !== -1 || n === 'MIBCS' || n === 'MIBFS' || n === 'MI SCALE2' || n.startsWith('MIBCS') || n.startsWith('MIBFS')) ? 2 : 1;
  }

  /* ---------- الجلسة: تفهم البيانات وتقرر وش نكتب للميزان ---------- */
  // chars: [{svc, chr, props:{write, writeWithoutResponse, notify, indicate}}]
  function createSession(opts) {
    opts = opts || {};
    const kind = opts.kind || 'unknown';
    const variant = opts.variant || 2;
    const chars = opts.chars || [];
    const now = opts.now || (() => Date.now());
    const uniq = (opts.uniq || 0x1234) & 0xFFFF;
    const profile = opts.profile || {};
    const find = (chr, preferSvc) => {
      const all = chars.filter(c => c.chr === chr);
      return all.find(c => c.svc === preferSvc) || all[0] || null;
    };
    const w = (target, data, label) => target ? { svc: target.svc, chr: target.chr, data: Uint8Array.from(data), label } : null;

    let histBuf = [];
    let qnProto = null, qnFactor = 100, qnConfigured = false;

    function timePayload() {
      const t = new Date(now());
      const y = t.getFullYear();
      return [y & 0xFF, (y >> 8) & 0xFF, t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(), 0, 0, 1];
    }

    function start() {
      const before = [], after = [];
      if (kind === 'xiaomi') {
        const prefer = variant === 2 ? S.BODY : S.WEIGHT;
        const hist = find(C.MI_HISTORY, prefer);
        const ct = find(C.CURRENT_TIME, prefer);
        if (ct) after.push(w(ct, timePayload(), 'ضبط ساعة الميزان'));
        if (hist) {
          const magic = w(hist, [0x01, 0x96, 0x8A, 0xBD, 0x62], 'تفعيل السجل');
          if (variant === 1) before.push(magic); else after.push(magic);
          after.push(w(hist, [0x01, 0xFF, 0xFF, (uniq >> 8) & 0xFF, uniq & 0xFF], 'طلب آخر قياس'));
          after.push(w(hist, [0x02], 'بدء الإرسال'));
        }
      } else if (kind === 'standard') {
        const ct = find(C.CURRENT_TIME, S.CURRENT_TIME);
        if (ct && (ct.props || {}).write) after.push(w(ct, timePayload(), 'ضبط ساعة الميزان'));
      }
      return { before: before.filter(Boolean), after: after.filter(Boolean) };
    }

    function miHistory(d, out) {
      if (d.length === 1 && d[0] === 0x03) { // نهاية السجل → نأكد الاستلام
        flushHist(out, true);
        const hist = find(C.MI_HISTORY);
        out.writes.push(w(hist, [0x03], 'تأكيد نهاية السجل'));
        out.writes.push(w(hist, [0x04, 0xFF, 0xFF, (uniq >> 8) & 0xFF, uniq & 0xFF], 'تأكيد الاستلام'));
        out.note = 'انتهى سجل الميزان';
        return;
      }
      if (d.length >= 6 && d[0] === 0x01) { histBuf = []; out.note = 'رد تحكم من الميزان'; return; }
      if (d.length === 13 || d.length === 26) {
        for (let i = 0; i < d.length; i += 13) {
          const r = parseMiLive13(d.slice(i, i + 13));
          if (r) out.readings.push(Object.assign(r, { source: 'live' }));
        }
        return;
      }
      histBuf = histBuf.concat(Array.from(d));
      flushHist(out, false);
    }
    function flushHist(out, end) {
      while (histBuf.length >= 10) {
        const r = parseMi10(Uint8Array.from(histBuf.slice(0, 10)));
        histBuf = histBuf.slice(10);
        if (r && r.stable && !r.removed) out.readings.push(Object.assign(r, { source: 'history' }));
      }
      if (end) histBuf = [];
    }

    function qn(d, out) {
      const r = parseQN(d, qnFactor);
      if (!r) return false;
      if (qnProto == null) qnProto = r.proto;
      const t1cfg = find(C.QN_T1_CONFIG), t1time = find(C.QN_T1_TIME), t2 = find(C.QN_T2_WRITE);
      const send = (frame, label) => {
        const target = t2 || t1cfg;
        if (target) out.writes.push(w(target, frame, label));
      };
      if (r.op === 0x12) {
        if (r.factor) qnFactor = r.factor;
        if (!qnConfigured) {
          qnConfigured = true;
          const real = qnProto === 0xFF;
          const h = real ? Math.max(60, Math.min(220, Math.round(profile.heightCm || 170))) : 0;
          const cfg = Array.from(qnFrame([0x13, 0x09, qnProto, 0x01, 0x10, h, real ? 30 : 0, 0]));
          if (t1cfg) out.writes.push(w(t1cfg, cfg, 'إعداد الوحدة (كجم)'));
          if (t2) out.writes.push(w(t2, cfg, 'إعداد الوحدة (كجم)'));
          const t = Math.floor(now() / 1000) - QN_EPOCH;
          const tm = [0x02].concat(le32(t));
          if (t1time) out.writes.push(w(t1time, tm, 'ضبط الساعة'));
          if (t2) out.writes.push(w(t2, tm, 'ضبط الساعة'));
        }
        out.note = 'معلومات الميزان (دقة ' + (qnFactor === 100 ? '0.01' : '0.1') + ')';
      } else if (r.op === 0x14) {
        const t = Math.floor(now() / 1000) - QN_EPOCH;
        send(Array.from(qnFrame([0x20, 0x08, qnProto].concat(le32(t)))), 'مزامنة الوقت');
      } else if (r.op === 0x21) {
        send(Array.from(qnFrame([0xA0, 0x0D, 0x04, 0xFE, 0, 0, 0, 0, 0, 0, 0, 0])), 'رد المصافحة 1');
        send(Array.from(qnFrame([0xA0, 0x0D, 0x02, 0x01, 0x00, 0x08, 0x00, 0x21, 0x06, 0xB8, 0x04, 0x02])), 'رد المصافحة 2');
      } else if (r.op === 0x10 && r.weightKg != null) {
        out.readings.push({ kind: 'qn', source: 'live', weightKg: r.weightKg, stable: !!r.stable, impedance: r.stable ? r.impedance : undefined });
        if (r.stable && qnProto === 0xFF) send(Array.from(qnFrame([0x1F, 0x05, qnProto, 0x10])), 'تأكيد القراءة');
      }
      return true;
    }

    function onData(svc, chr, data) {
      const d = data instanceof Uint8Array ? data : Uint8Array.from(data || []);
      const out = { readings: [], writes: [], note: '' };
      if (!d.length) return out;
      if (chr === C.MI_HISTORY) { miHistory(d, out); }
      else if (chr === C.WEIGHT_MEAS) {
        const r = parseStdWeight(d);
        if (r) {
          // شاومي 1 يستخدم نفس الشكل لكن يضيف بت «ثابت» و«نزل من الميزان»
          if (kind === 'xiaomi') { r.stable = !!(r.flags & 0x20); r.removed = !!(r.flags & 0x80); r.source = 'live'; r.ts = null; }
          else { r.stable = true; r.final = true; r.source = 'live'; }
          out.readings.push(r);
        }
      } else if (chr === C.BODY_MEAS) {
        if (looksMiLive13(d)) { const r = parseMiLive13(d); r.source = 'live'; out.readings.push(r); }
        else { const r = parseStdBodyComp(d); if (r) { r.stable = true; r.final = true; r.source = 'live'; out.readings.push(r); } }
      } else if (chr === C.QN_T1_NOTIFY || chr === C.QN_T2_NOTIFY || chr === C.QN_T1_INDICATE) {
        if (!qn(d, out)) out.note = 'إطار غير معروف';
      } else {
        out.note = 'بيانات من خاصية غير معروفة';
      }
      out.writes = out.writes.filter(Boolean);
      return out;
    }

    return { kind, variant, start, onData };
  }

  /* ---------- المجمّع: يحوّل القراءات إلى «قياس واحد» لكل وقفة ---------- */
  // الأحداث:
  //   {type:'live', weightKg}                 ← رقم يتحرك أثناء الوقوف
  //   {type:'final', m}                       ← قياس ثابت جديد (يُحفظ)
  //   {type:'update', m}                      ← معلومة زيادة لنفس القياس (مقاومة/دهون)
  //   {type:'off'}                            ← نزل من الميزان
  //   {type:'old', m}                         ← قياس قديم من سجل الميزان (ما يُحفظ تلقائي)
  function createAssembler(opts) {
    opts = opts || {};
    const now = opts.now || (() => Date.now());
    const windowMs = opts.windowMs || 90000;
    const historyMaxAgeMs = opts.historyMaxAgeMs || 10 * 60000;
    let cur = null;       // القياس الحالي
    let pending = null;   // معلومات وصلت قبل الوزن (مثل دهون المعيار)
    const EXTRA = ['impedance', 'fatPct', 'musclePct', 'muscleKg', 'waterKg', 'bmrKcal', 'fatFreeKg'];

    function extrasOf(r) { const e = {}; for (const k of EXTRA) if (r[k] != null) e[k] = r[k]; return e; }
    function merge(m, e) {
      let changed = false;
      for (const k in e) if (m[k] !== e[k]) { m[k] = e[k]; changed = true; }
      if (m.waterKg != null && m.weightKg) { const p = round(m.waterKg / m.weightKg * 100, 1); if (m.waterPct !== p) { m.waterPct = p; changed = true; } }
      return changed;
    }

    function push(r) {
      const ev = [];
      if (!r) return ev;
      const t = now();
      if (r.removed) { if (cur) cur.closed = true; cur = null; ev.push({ type: 'off' }); return ev; }
      const hasW = plausibleKg(r.weightKg);
      const ex = extrasOf(r);

      if (r.source === 'history') {
        if (!hasW) return ev;
        const m = Object.assign({ weightKg: r.weightKg, at: r.ts || t, source: 'history' }, ex);
        if (r.ts && t - r.ts <= historyMaxAgeMs && !cur) { cur = m; ev.push({ type: 'final', m: cur }); }
        else ev.push({ type: 'old', m });
        return ev;
      }

      if (!hasW) { // معلومات بدون وزن
        if (Object.keys(ex).length) {
          if (cur && t - cur.at <= windowMs) { if (merge(cur, ex)) ev.push({ type: 'update', m: cur }); }
          else pending = { ex, at: t };
        }
        return ev;
      }

      if (!r.stable) {
        if (cur && Math.abs(r.weightKg - cur.weightKg) > 1.5) cur = null; // شخص ثاني أو وقفة جديدة
        ev.push({ type: 'live', weightKg: r.weightKg });
        return ev;
      }

      // قراءة ثابتة
      if (cur && Math.abs(r.weightKg - cur.weightKg) <= 0.3 && t - cur.at <= windowMs) {
        let changed = false;
        if (cur.weightKg !== r.weightKg) { cur.weightKg = r.weightKg; changed = true; }
        if (merge(cur, ex)) changed = true;
        if (changed) ev.push({ type: 'update', m: cur });
        return ev;
      }
      cur = { weightKg: r.weightKg, at: t, source: 'live' };
      merge(cur, ex);
      if (pending && t - pending.at <= 15000) merge(cur, pending.ex);
      pending = null;
      ev.push({ type: 'final', m: cur });
      return ev;
    }
    return { push, reset() { cur = null; pending = null; } };
  }

  /* ---------- مولّدات إطارات (للتجربة والاختبارات) ---------- */
  function buildMiLive13(weightKg, o) {
    o = o || {};
    const t = new Date(o.time || Date.now());
    const raw = Math.round(weightKg * 200);
    let c1 = 0x00;
    if (o.stable) c1 |= 0x20;
    if (o.removed) c1 |= 0x80;
    if (o.impedance) c1 |= 0x02;
    const y = t.getFullYear(), imp = o.impedance || 0;
    return Uint8Array.from([0x02, c1, y & 0xFF, y >> 8, t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(),
      imp & 0xFF, imp >> 8, raw & 0xFF, raw >> 8]);
  }
  function buildStdWeight(weightKg) {
    const raw = Math.round(weightKg / 0.005);
    return Uint8Array.from([0x00, raw & 0xFF, raw >> 8]);
  }

  const API = {
    uuid16, S, C, OPTIONAL_SERVICES, REQUEST_FILTERS,
    detectKind, miVariant, createSession, createAssembler,
    parseStdWeight, parseStdBodyComp, parseMiLive13, parseMi10, parseQN, looksMiLive13,
    buildMiLive13, buildStdWeight, qnFrame,
    bmi, bmiClass, toKg, hex, fromHex, plausibleKg, round
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ScaleProto = API;
})(typeof window !== 'undefined' ? window : globalThis);
