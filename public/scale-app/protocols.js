/* ============================================================
   scale-app/protocols.js — فك بيانات موازين الجسم بالبلوتوث (BLE)

   ملف «نقي» بدون أي واجهة أو بلوتوث فعلي: ياخذ البايتات اللي يرسلها الميزان
   ويطلع منها قراءة وزن مفهومة، ويقول للتطبيق وش يكتب للميزان (لو يحتاج).
   عشان كذا نقدر نختبره بـ node بدون ميزان.

   الموازين المدعومة:
     • المعيار الرسمي للبلوتوث: Weight Scale 0x181D و Body Composition 0x181B
     • شاومي Mi Scale (الإصدار 1) و Mi Body Composition Scale (الإصدار 2)
     • موازين QN / Yolanda / Renpho / FITINDEX (خدمة 0xFFE0 أو 0xFFF0)
     • هواوي Body Fat Scale AH100 / CH100 (خدمة 0xFAA0) — مشفّر، ويحتاج عنوان MAC الميزان
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
     bmi, bmiClass, toKg, hex, parseMac, macFromAdvert
     Huawei: {aesCtr, encryptBlock, decodeMeasurement, buildPlain, buildEncrypted, authToken, magicKey}
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
    MI_CFG: '00001530-0000-3512-2118-0009af100700',
    HUAWEI: uuid16(0xFAA0)
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
    QN_T2_WRITE: uuid16(0xFFF2),
    HW_TX: uuid16(0xFAA1),   // من الجوال للميزان
    HW_RX: uuid16(0xFAA2)    // من الميزان للجوال
  };

  // كروم ما يسمح نقرأ أي خدمة ما ذكرناها هنا — فنذكر المعروفة + خدمات شائعة في
  // الموازين الصينية عشان «وضع الفحص» يشوف بياناتها.
  const OPTIONAL_SERVICES = [
    S.WEIGHT, S.BODY, S.USER_DATA, S.DEVICE_INFO, S.BATTERY, S.CURRENT_TIME,
    S.QN1, S.QN2, S.QN_AE, S.MI_CFG, S.HUAWEI,
    uuid16(0xFFA0), uuid16(0xFFB0), uuid16(0xFFC0), uuid16(0xFFD0),
    uuid16(0x1A10), uuid16(0xFEE7), uuid16(0xFFF5)
  ];

  // فلاتر قائمة الأجهزة: تطلع الموازين المعروفة فقط (وفيه زر «كل الأجهزة» للباقي)
  const REQUEST_FILTERS = [
    { services: [S.WEIGHT] }, { services: [S.BODY] },
    { services: [S.QN1] }, { services: [S.QN2] },
    { namePrefix: 'MI' }, { namePrefix: 'QN' },
    { namePrefix: 'Renpho' }, { namePrefix: 'RENPHO' }, { namePrefix: 'Yolanda' },
    { services: [S.HUAWEI] }, { namePrefix: 'AH100' }, { namePrefix: 'CH100' }, { namePrefix: 'HUAWEI' }
  ];

  /* ---------- أدوات صغيرة ---------- */
  const u8 = (d, i) => d[i] & 0xFF;
  const u16le = (d, i) => (d[i] & 0xFF) | ((d[i + 1] & 0xFF) << 8);
  const u16be = (d, i) => ((d[i] & 0xFF) << 8) | (d[i + 1] & 0xFF);
  const round = (x, n) => { const p = Math.pow(10, n == null ? 2 : n); return Math.round(x * p) / p; };
  function hex(d) { return Array.from(d || [], b => (b & 0xFF).toString(16).padStart(2, '0')).join(' '); }
  function fromHex(s) { const h = String(s || '').replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, ''); return Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16)); }
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

  /* ---------- AES-128 (للتشفير بوضع CTR فقط) ---------- */
  // تطبيق صغير متزامن لأن فك البيانات يصير داخل حدث البلوتوث مباشرة.
  const xtime = a => ((a << 1) ^ (a & 0x80 ? 0x1B : 0)) & 0xFF;
  const SBOX = (() => {
    const sb = new Uint8Array(256);
    const rotl = (x, k) => ((x << k) | (x >>> (8 - k))) & 0xFF;
    let p = 1, q = 1;
    do {
      p = (p ^ xtime(p)) & 0xFF;                       // p × 3
      q = (q ^ (q << 1)) & 0xFF; q = (q ^ (q << 2)) & 0xFF; q = (q ^ (q << 4)) & 0xFF;
      if (q & 0x80) q ^= 0x09;                          // q ÷ 3
      sb[p] = (q ^ rotl(q, 1) ^ rotl(q, 2) ^ rotl(q, 3) ^ rotl(q, 4) ^ 0x63) & 0xFF;
    } while (p !== 1);
    sb[0] = 0x63;
    return sb;
  })();
  function expandKey(key) {
    const e = new Uint8Array(176);
    e.set(key.slice(0, 16));
    let rcon = 1;
    for (let i = 16; i < 176; i += 4) {
      let t = [e[i - 4], e[i - 3], e[i - 2], e[i - 1]];
      if (i % 16 === 0) { t = [SBOX[t[1]] ^ rcon, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rcon = xtime(rcon); }
      for (let j = 0; j < 4; j++) e[i + j] = e[i - 16 + j] ^ t[j];
    }
    return e;
  }
  function encryptBlock(block, key) {
    const k = key.length === 176 ? key : expandKey(key);
    let st = Uint8Array.from(block.slice(0, 16));
    for (let i = 0; i < 16; i++) st[i] ^= k[i];
    for (let r = 1; r <= 10; r++) {
      const sh = new Uint8Array(16);
      for (let c = 0; c < 4; c++) for (let row = 0; row < 4; row++) sh[row + 4 * c] = SBOX[st[row + 4 * ((c + row) % 4)]];
      if (r < 10) {
        for (let c = 0; c < 4; c++) {
          const a0 = sh[4 * c], a1 = sh[4 * c + 1], a2 = sh[4 * c + 2], a3 = sh[4 * c + 3];
          sh[4 * c] = xtime(a0) ^ xtime(a1) ^ a1 ^ a2 ^ a3;
          sh[4 * c + 1] = a0 ^ xtime(a1) ^ xtime(a2) ^ a2 ^ a3;
          sh[4 * c + 2] = a0 ^ a1 ^ xtime(a2) ^ xtime(a3) ^ a3;
          sh[4 * c + 3] = xtime(a0) ^ a0 ^ a1 ^ a2 ^ xtime(a3);
        }
      }
      for (let i = 0; i < 16; i++) sh[i] ^= k[16 * r + i];
      st = sh;
    }
    return st;
  }
  // AES/CTR/NoPadding — نفس العملية للتشفير وفكه
  function aesCtr(data, key, iv) {
    const k = expandKey(Uint8Array.from(key));
    const ctr = Uint8Array.from(iv.slice(0, 16));
    const out = new Uint8Array(data.length);
    for (let off = 0; off < data.length; off += 16) {
      const ks = encryptBlock(ctr, k);
      for (let i = 0; i < 16 && off + i < data.length; i++) out[off + i] = data[off + i] ^ ks[i];
      for (let i = 15; i >= 0; i--) { ctr[i] = (ctr[i] + 1) & 0xFF; if (ctr[i] !== 0) break; }
    }
    return out;
  }

  /* ---------- هواوي AH100 / CH100 ---------- */
  // كل البيانات «مخلوطة» (XOR) بعنوان MAC الميزان، والقياسات فوقها AES-CTR.
  const HW_KEY = fromHex('3D A2 78 4A FB 87 B1 2A 98 0F DE 34 56 73 21 56');
  const HW_IV = fromHex('4E F7 64 32 2F DA 76 32 12 3D EB 87 90 FE A2 19');
  function parseMac(s) {
    const h = String(s || '').replace(/[^0-9a-fA-F]/g, '');
    if (h.length !== 12) return null;
    const b = fromHex(h);
    return b.every(x => x === 0) || b.every(x => x === 0xFF) ? null : b;
  }
  function macText(b) { return Array.from(b, x => x.toString(16).padStart(2, '0').toUpperCase()).join(':'); }
  function xorMac(data, mac) { const o = Uint8Array.from(data); if (!mac || !mac.length) return o; for (let i = 0; i < o.length; i++) o[i] ^= mac[i % mac.length]; return o; }
  function hwAuthToken(userId) {
    const a = [0x11, 0x22, 0x33, 0x44, 0x55, 0x00, userId & 0xFF];
    a[5] = a.reduce((x, y) => x ^ y, 0);
    return Uint8Array.from(a);
  }
  function hwMagicKey(auth, mac) { const k = new Uint8Array(16); k.set(xorMac(auth, mac), 0); k.set(HW_KEY.slice(7), 7); return k; }
  function hwPlain(cmd, payload, mac, len) { return Uint8Array.from([0xDB, (len == null ? payload.length + 1 : len) & 0xFF, cmd].concat(Array.from(xorMac(payload, mac)))); }
  function hwEncrypted(cmd, payload, key, mac, len) { return Uint8Array.from([0xDC, (len == null ? payload.length : len) & 0xFF, cmd].concat(Array.from(xorMac(aesCtr(payload, key, HW_IV), mac)))); }
  // نص القياس بعد فك التشفير: [مستخدم][وزن/10 LE][دهون/10 LE][سنة LE][شهر][يوم][س][د][ث][يوم الأسبوع][مقاومة LE]
  function hwDecode(frame, key, mac) {
    const plain = aesCtr(xorMac(frame.slice(3), mac), key, HW_IV);
    if (plain.length < 15) return null;
    const y = u16le(plain, 5), mo = u8(plain, 7), da = u8(plain, 8), h = u8(plain, 9), mi = u8(plain, 10), se = u8(plain, 11);
    const ok = y >= 2000 && y <= 2100 && mo >= 1 && mo <= 12 && da >= 1 && da <= 31 && h < 24 && mi < 60 && se < 60;
    const imp = u16le(plain, 13);
    return {
      userId: u8(plain, 0),
      weightKg: u16le(plain, 1) / 10,
      fatPct: u16le(plain, 3) / 10,
      impedance: imp >= 1 && imp <= 3999 ? imp : undefined,
      ts: ok ? new Date(y, mo - 1, da, h, mi, se).getTime() : null,
      valid: ok,
      plain
    };
  }
  // بعض المتصفحات تعطي بيانات الإعلان؛ موازين Chipsea تحط عنوانها فيها أحياناً
  function macFromAdvert(chunks) {
    const OUIS = [[0x5C, 0xCA, 0xD3]];
    for (const d of chunks || []) {
      const b = Array.from(d || []);
      for (let i = 0; i + 6 <= b.length; i++) {
        for (const o of OUIS) {
          if (b[i] === o[0] && b[i + 1] === o[1] && b[i + 2] === o[2]) return Uint8Array.from(b.slice(i, i + 6));
          if (b[i + 5] === o[0] && b[i + 4] === o[1] && b[i + 3] === o[2]) return Uint8Array.from(b.slice(i, i + 6).reverse());
        }
      }
    }
    return null;
  }

  /* ---------- كشف نوع الميزان ---------- */
  function huaweiName(name) {
    const n = String(name || '').replace(/\u0000/g, '').trim().toUpperCase();
    const c = [n, n.replace(/^HUAWEI /, '').trim(), n.replace(/^HONOR /, '').trim(), n.split('-')[0], n.split('_')[0], n.split(' ')[0]];
    return c.indexOf('AH100') !== -1 || c.indexOf('CH100') !== -1;
  }
  function detectKind(name, serviceUuids) {
    const n = String(name || '').toUpperCase();
    const has = u => (serviceUuids || []).indexOf(u) !== -1;
    if (huaweiName(name) || (has(S.HUAWEI) && !/CH100S/.test(n))) return 'huawei';
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
    let profile = opts.profile || {};
    const find = (chr, preferSvc) => {
      const all = chars.filter(c => c.chr === chr);
      return all.find(c => c.svc === preferSvc) || all[0] || null;
    };
    const w = (target, data, label) => target ? { svc: target.svc, chr: target.chr, data: Uint8Array.from(data), label } : null;

    let histBuf = [];
    let qnProto = null, qnFactor = 100, qnConfigured = false;
    const mac = opts.mac || null;
    const hw = { auth: hwAuthToken(opts.hwUser || 1), key: null, authorised: false, authSent: false, woke: false, tries: 0, binds: 0, pending: null, lastW: opts.lastWeightKg || null };

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

    /* ----- هواوي ----- */
    function hwSend(frame, label) { const tx = find(C.HW_TX, S.HUAWEI); return w(tx, frame, label); }
    function hwAuth(out) { hw.authSent = true; out.writes.push(hwSend(hwPlain(36, hw.auth, mac), 'تحقق')); }
    function hwUserInfo() {
      const male = profile.sex !== 'f';
      const age = Math.max(10, Math.min(99, Math.round(profile.age || 30)));
      const hcm = Math.max(90, Math.min(220, Math.round(profile.heightCm || 170)));
      const wkg = hw.lastW || (22 * (hcm / 100) * (hcm / 100));
      const wt = Math.max(1, Math.round(wkg * 10));
      const payload = Array.from(hw.auth).concat([(age & 0x7F) | (male ? 0 : 0x80), hcm, 0x00, wt & 0xFF, wt >> 8, 0xFF, 0xFF, 0x1C, 0xE2]);
      return hwSend(hwEncrypted(9, payload, hw.key, mac, payload.length - 2), 'بيانات الشخص (للدهون)');
    }
    function hwTime() {
      const t = new Date(now()); const y = t.getFullYear();
      const dow = ((t.getDay() + 6) % 7) + 1; // الإثنين = 1
      return hwSend(hwPlain(8, [y & 0xFF, y >> 8, t.getMonth() + 1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(), dow], mac), 'ضبط الساعة');
    }
    function hwMeasurement(frame, op, out) {
      const m = hwDecode(frame, hw.key, mac);
      if (!m || !m.valid || !plausibleKg(m.weightKg)) { out.error = 'decode'; out.note = 'فك التشفير طلع أرقام غلط — غالباً عنوان MAC غلط'; return; }
      hw.lastW = m.weightKg;
      out.readings.push({ kind: 'huawei', source: op === 0x10 ? 'history' : 'live', weightKg: m.weightKg, fatPct: m.fatPct > 0 && m.fatPct < 75 ? m.fatPct : undefined, impedance: m.impedance, ts: m.ts, stable: true, final: true });
      out.writes.push(hwSend(hwPlain(19, [0x00], mac), 'تأكيد استلام القياس'));
      if (op === 0x10) out.writes.push(hwSend(hwPlain(11, [0x01], mac), 'السجل التالي'));
    }
    function huawei(d, out) {
      if (!mac) { out.error = 'mac'; out.note = 'يحتاج عنوان MAC الميزان'; return; }
      if (d.length < 3) return;
      const op = d[2], tail = xorMac(d.slice(3), mac);
      if (op === 0x00) { // صحى
        hw.woke = true; out.note = 'الميزان صحى';
        if (!hw.authorised) hwAuth(out);
      } else if (op === 0x26) { // نتيجة التحقق
        if (tail[0] === 1 && hw.authorised) { out.note = 'تحقق مكرر'; }
        else if (tail[0] === 1) {
          hw.authorised = true;
          hw.key = hwMagicKey(hw.auth, mac);
          out.note = 'تم التحقق ✓'; out.hint = 'متصل ✓ اطلع على الميزان واثبت';
          out.writes.push(hwSend(hwPlain(2, [0x01], mac), 'الوحدة كجم'), hwTime(), hwUserInfo(), hwSend(hwPlain(12, [], mac), 'رقم الإصدار'));
        } else if (hw.tries++ < 2) { out.note = 'رفض التحقق، نحاول مرة ثانية'; hwAuth(out); }
        else if (hw.binds++ < 2) { out.note = 'نربط الميزان بالتطبيق'; out.hint = 'نربط الميزان أول مرة… خلك واقف عليه'; out.writes.push(hwSend(hwPlain(37, hw.auth, mac), 'ربط')); }
        else { out.error = 'auth'; out.note = 'الميزان رفض التحقق — تأكد من عنوان MAC'; }
      } else if (op === 0x27) { // تم الربط
        out.note = 'تم الربط ✓'; hw.tries = 0; hwAuth(out);
      } else if (op === 0x20) { // يطلب بيانات الشخص
        if (hw.authorised) out.writes.push(hwUserInfo());
      } else if (op === 0x0F) {
        out.note = 'الوزن ثبت، يحلل الدهون'; out.hint = 'ثبت الوزن… لا تنزل، يحلل الدهون'; out.status = 'measure';
      } else if ((op === 0x0E || op === 0x10) && d[0] === 0xBC) {
        if (!hw.key) { out.note = 'قياس وصل قبل التحقق'; return; }
        if (tail.length >= 15) { hw.pending = null; hwMeasurement(d, op, out); } else hw.pending = { d, op };
      } else if ((op === 0x8E || op === 0x90) && d[0] === 0xBC) {
        if (hw.pending && hw.key) { const p = hw.pending; hw.pending = null; hwMeasurement(p.d, p.op, out); }
      } else if (op === 0x01) { out.note = 'الميزان بينام'; }
      else if (op === 0x02 || op === 0x08 || op === 0x0C || op === 0x19) { out.note = 'رد من الميزان'; }
      else if (op === 0x13) { out.note = 'الوزن فوق حد الميزان'; out.hint = 'الوزن أكثر من حد الميزان'; }
      else if (op === 0x14) { out.note = 'بطارية الميزان ضعيفة'; out.hint = 'بطارية الميزان ضعيفة — غيّرها'; }
      else if (op === 0x15) { out.note = 'خطأ قياس من الميزان'; out.hint = 'الميزان ما قدر يقيس. اطلع حافي وثابت'; }
    }
    // لو ما وصلت إشارة «صحى» بعد الاتصال بشوي، نبدأ التحقق بنفسنا
    function kick() {
      const out = { readings: [], writes: [], note: '' };
      if (kind === 'huawei' && mac && !hw.authorised && !hw.authSent) { out.note = 'نبدأ التحقق'; hwAuth(out); }
      out.writes = out.writes.filter(Boolean);
      return out;
    }

    // تغيّر الشخص المختار وهو متصل ← هواوي يحتاج بياناته عشان يحسب الدهون له
    function setProfile(p) {
      profile = p || {};
      const out = { readings: [], writes: [], note: '' };
      if (kind === 'huawei' && hw.authorised) out.writes.push(hwUserInfo());
      out.writes = out.writes.filter(Boolean);
      return out;
    }

    function onData(svc, chr, data) {
      const d = data instanceof Uint8Array ? data : Uint8Array.from(data || []);
      const out = { readings: [], writes: [], note: '' };
      if (!d.length) return out;
      if (chr === C.HW_RX) { huawei(d, out); }
      else if (chr === C.MI_HISTORY) { miHistory(d, out); }
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

    return { kind, variant, start, onData, kick, setProfile, needsMac: kind === 'huawei' && !mac };
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
    parseMac, macText, macFromAdvert, huaweiName,
    Huawei: { aesCtr, encryptBlock, expandKey, xorMac, authToken: hwAuthToken, magicKey: hwMagicKey, buildPlain: hwPlain, buildEncrypted: hwEncrypted, decodeMeasurement: hwDecode, IV: HW_IV, KEY: HW_KEY, SBOX },
    bmi, bmiClass, toKg, hex, fromHex, plausibleKg, round
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.ScaleProto = API;
})(typeof window !== 'undefined' ? window : globalThis);
