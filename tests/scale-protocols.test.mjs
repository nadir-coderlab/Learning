// «ميزاني»: فك بيانات موازين البلوتوث — إطارات حقيقية مسجّلة من موازين + حالات التجميع.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const P = require(path.join(here, '..', 'public', 'scale-app', 'protocols.js'));
const H = P.fromHex;
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test('uuid16 builds full lowercase Bluetooth UUIDs', () => {
  assert.equal(P.uuid16(0x181D), '0000181d-0000-1000-8000-00805f9b34fb');
  assert.equal(P.S.BODY, '0000181b-0000-1000-8000-00805f9b34fb');
  assert.ok(P.OPTIONAL_SERVICES.includes(P.S.MI_CFG));
});

test('standard weight frame (real Beurer BF105 capture): 79.44 kg with time, user, BMI and height', () => {
  const r = P.parseStdWeight(H('0E 10 3E E4 07 06 11 12 33 2C 02 F5 00 08 07'));
  near(r.weightKg, 79.44);
  assert.equal(r.unit, 'kg');
  assert.equal(r.userIndex, 2);
  near(r.bmi, 24.5);
  near(r.heightCm, 180);
  const d = new Date(r.ts);
  assert.deepEqual([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()], [2020, 6, 17, 18, 51, 44]);
});

test('standard body composition frame (real capture): fat 19.7 %, muscle 38 %, impedance 469 Ω, water 52.3 %', () => {
  const r = P.parseStdBodyComp(H('98 03 C5 00 A0 1B 7C 01 3C 2F 74 20 52 12'));
  near(r.fatPct, 19.7);
  near(r.musclePct, 38.0);
  near(r.impedance, 469.0);
  near(r.waterKg, 41.54);
  near(r.waterKg / 79.44 * 100, 52.29, 0.05); // نفس نسبة تطبيق Beurer
  assert.equal(r.bmrKcal, 1689);
});

test('standard weight in pounds converts to kg', () => {
  const raw = 15950; // 159.50 lb
  const r = P.parseStdWeight(Uint8Array.from([0x01, raw & 0xFF, raw >> 8]));
  near(r.weightKg, 72.35);
});

test('Xiaomi live frame (13 bytes): weight, stable/removed flags, impedance, date', () => {
  const t = new Date(2026, 9, 17, 8, 30, 5).getTime();
  const f = P.buildMiLive13(72.35, { stable: true, impedance: 512, time: t });
  assert.ok(P.looksMiLive13(f));
  const r = P.parseMiLive13(f);
  near(r.weightKg, 72.35);
  assert.equal(r.stable, true);
  assert.equal(r.removed, false);
  assert.equal(r.impedance, 512);
  assert.equal(r.ts, t);
  // نفس الإطار بدون «ثابت» ومع «نزل»
  const off = P.parseMiLive13(P.buildMiLive13(0, { removed: true, time: t }));
  assert.equal(off.removed, true);
  // وحدة الرطل: c0 bit0 → القسمة على 100
  const lb = Uint8Array.from(f); lb[0] |= 0x01; const raw = 15950; lb[11] = raw & 0xFF; lb[12] = raw >> 8;
  near(P.parseMiLive13(lb).weightKg, 72.35);
});

test('Xiaomi v1 / history record (10 bytes)', () => {
  const raw = Math.round(68.4 * 200);
  const r = P.parseMi10(Uint8Array.from([0x22, raw & 0xFF, raw >> 8, 0xEA, 0x07, 10, 17, 7, 45, 0]));
  near(r.weightKg, 68.4);
  assert.equal(r.stable, true);
  assert.equal(new Date(r.ts).getFullYear(), 2026);
});

test('a standard 13-byte body-composition frame is not mistaken for a Xiaomi frame', () => {
  // flags 0x0602: وقت + وزن + طول ← 13 بايت بالضبط
  const d = Uint8Array.from([0x02, 0x06, 0xD2, 0x00, 0xEA, 0x07, 10, 17, 8, 0, 0, 0x86, 0x38]);
  assert.equal(P.looksMiLive13(d), false);
});

test('QN real capture (GE "Fit Plus", protocol 0xFF): state 0/1 not stable, state 2 = 85.35 kg, 435 Ω, ack sent', () => {
  const chars = [
    { svc: P.S.QN2, chr: P.C.QN_T2_NOTIFY, props: {} },
    { svc: P.S.QN2, chr: P.C.QN_T2_WRITE, props: { write: true } }
  ];
  const s = P.createSession({ kind: 'qn', chars, profile: { heightCm: 175 } });
  const info = s.onData(P.S.QN2, P.C.QN_T2_NOTIFY, H('12 12 FF 11 22 33 44 55 66 13 07 10 00 01 05 9F 32 89'));
  assert.ok(info.writes.some(w => w.data[0] === 0x13), 'unit config sent after 0x12');
  const cfg = info.writes.find(w => w.data[0] === 0x13).data;
  assert.equal(cfg[5], 175); // الطول الحقيقي لعائلة 0xFF
  assert.equal(cfg[cfg.length - 1], [...cfg.slice(0, -1)].reduce((a, b) => (a + b) & 0xFF, 0));

  const s0 = s.onData(P.S.QN2, P.C.QN_T2_NOTIFY, H('10 0F FF FE 00 21 57 00 00 00 00 00 00 00 94'));
  assert.equal(s0.readings[0].stable, false);
  const s1 = s.onData(P.S.QN2, P.C.QN_T2_NOTIFY, H('10 0F FF FE 01 21 57 00 00 00 00 00 00 00 95'));
  assert.equal(s1.readings[0].stable, false);
  const s2 = s.onData(P.S.QN2, P.C.QN_T2_NOTIFY, H('10 0F FF FE 02 21 57 10 FE 10 FC 00 AC 00 5C'));
  assert.equal(s2.readings[0].stable, true);
  near(s2.readings[0].weightKg, 85.35);
  near(s2.readings[0].impedance, 435.0);
  assert.deepEqual([...s2.writes[0].data], [0x1F, 0x05, 0xFF, 0x10, (0x1F + 0x05 + 0xFF + 0x10) & 0xFF]);
});

test('QN classic frame: 71.68 kg with low byte 0x00 is not misread as ES-30M', () => {
  const s = P.createSession({ kind: 'qn', chars: [{ svc: P.S.QN2, chr: P.C.QN_T2_NOTIFY, props: {} }] });
  s.onData(P.S.QN2, P.C.QN_T2_NOTIFY, Uint8Array.from([0x12, 0x0B, 0x07, 0, 0, 0, 0, 0, 0, 0, 0x01]));
  const out = s.onData(P.S.QN2, P.C.QN_T2_NOTIFY, Uint8Array.from([0x10, 0x0A, 0x07, 0x1C, 0x00, 0x01, 0x01, 0xF4, 0x01, 0xF4]));
  near(out.readings[0].weightKg, 71.68);
  assert.equal(out.readings[0].stable, true);
  assert.equal(out.writes.length, 0); // ما نرسل تأكيد إلا لعائلة 0xFF
});

test('frames with a wrong length byte are not treated as QN', () => {
  assert.equal(P.parseQN(Uint8Array.from([0x10, 0x05, 0x07, 0x1C, 0x00, 0x01, 0x01, 0xF4, 0x01, 0xF4])), null);
});

test('Xiaomi session: start writes time + history commands; live frames come through the history characteristic', () => {
  const chars = [
    { svc: P.S.BODY, chr: P.C.CURRENT_TIME, props: { write: true } },
    { svc: P.S.BODY, chr: P.C.MI_HISTORY, props: { write: true } },
    { svc: P.S.BODY, chr: P.C.BODY_MEAS, props: {} }
  ];
  const s = P.createSession({ kind: 'xiaomi', variant: 2, chars, uniq: 0xABCD });
  const plan = s.start();
  assert.equal(plan.before.length, 0);
  assert.deepEqual(plan.after.map(w => P.hex(w.data)), [
    plan.after[0] && P.hex(plan.after[0].data), '01 96 8a bd 62', '01 ff ff ab cd', '02'
  ]);
  assert.equal(plan.after[0].chr, P.C.CURRENT_TIME);
  const live = s.onData(P.S.BODY, P.C.MI_HISTORY, P.buildMiLive13(80.1, { stable: false }));
  near(live.readings[0].weightKg, 80.1);
  const viaBody = s.onData(P.S.BODY, P.C.BODY_MEAS, P.buildMiLive13(80.1, { stable: true }));
  assert.equal(viaBody.readings[0].stable, true);
  // نهاية السجل ← تأكيدان
  const end = s.onData(P.S.BODY, P.C.MI_HISTORY, Uint8Array.from([0x03]));
  assert.deepEqual(end.writes.map(w => P.hex(w.data)), ['03', '04 ff ff ab cd']);
});

test('Xiaomi history chunks split across notifications are reassembled into 10-byte records', () => {
  const s = P.createSession({ kind: 'xiaomi', variant: 1, chars: [{ svc: P.S.WEIGHT, chr: P.C.MI_HISTORY, props: { write: true } }] });
  const raw = Math.round(70 * 200);
  const rec = [0x22, raw & 0xFF, raw >> 8, 0xEA, 0x07, 10, 17, 7, 0, 0];
  const a = s.onData(P.S.WEIGHT, P.C.MI_HISTORY, Uint8Array.from(rec.slice(0, 7)));
  assert.equal(a.readings.length, 0);
  const b = s.onData(P.S.WEIGHT, P.C.MI_HISTORY, Uint8Array.from(rec.slice(7)));
  assert.equal(b.readings.length, 1);
  assert.equal(b.readings[0].source, 'history');
  near(b.readings[0].weightKg, 70);
});

test('detectKind picks the right protocol', () => {
  assert.equal(P.detectKind('MIBFS', [P.S.BODY]), 'xiaomi');
  assert.equal(P.detectKind('MI SCALE2', [P.S.WEIGHT]), 'xiaomi');
  assert.equal(P.detectKind('BF105', [P.S.WEIGHT, P.S.BODY]), 'standard');
  assert.equal(P.detectKind('QN-Scale', [P.S.QN1]), 'qn');
  assert.equal(P.detectKind('Something', []), 'unknown');
  assert.equal(P.miVariant('MIBFS', []), 2);
  assert.equal(P.miVariant('MI_SCALE', []), 1);
});

test('assembler: live → one final per weigh-in, extras merge as updates, step-off resets', () => {
  let t = 1_000_000;
  const A = P.createAssembler({ now: () => t });
  const ev = r => A.push(Object.assign({ source: 'live' }, r)).map(e => e.type);
  assert.deepEqual(ev({ weightKg: 40, stable: false }), ['live']);
  assert.deepEqual(ev({ weightKg: 72.3, stable: false }), ['live']);
  assert.deepEqual(ev({ weightKg: 72.35, stable: true }), ['final']);
  t += 500;
  assert.deepEqual(ev({ weightKg: 72.35, stable: true }), []);          // تكرار بدون جديد
  assert.deepEqual(ev({ weightKg: 72.35, stable: true, impedance: 500 }), ['update']);
  assert.deepEqual(ev({ weightKg: 0, removed: true }), ['off']);
  t += 2000;
  assert.deepEqual(ev({ weightKg: 72.35, stable: true }), ['final']);    // وقفة جديدة = قياس جديد
  t += 1000;
  assert.deepEqual(ev({ weightKg: 55, stable: true }), ['final']);       // شخص ثاني
});

test('assembler: standard body composition arriving after the weight merges into it', () => {
  let t = 5_000;
  const A = P.createAssembler({ now: () => t });
  const w = A.push({ source: 'live', weightKg: 79.44, stable: true, final: true });
  assert.equal(w[0].type, 'final');
  t += 300;
  const b = A.push({ source: 'live', fatPct: 19.7, waterKg: 41.54, stable: true, final: true });
  assert.equal(b[0].type, 'update');
  near(b[0].m.fatPct, 19.7);
  near(b[0].m.waterPct, 52.3, 0.05);
});

test('assembler: old history records are reported but not saved; recent ones are', () => {
  const now = Date.now();
  const A = P.createAssembler({ now: () => now });
  assert.equal(A.push({ source: 'history', weightKg: 70, ts: now - 3 * 86400000, stable: true })[0].type, 'old');
  assert.equal(A.push({ source: 'history', weightKg: 70, ts: now - 60000, stable: true })[0].type, 'final');
});

test('implausible weights never become a measurement', () => {
  const A = P.createAssembler();
  assert.deepEqual(A.push({ source: 'live', weightKg: 0.4, stable: true }), []);
  assert.deepEqual(A.push({ source: 'live', weightKg: 900, stable: true }), []);
});

test('BMI and its adult category', () => {
  assert.equal(P.bmi(72, 175), 23.5);
  assert.equal(P.bmiClass(23.5).key, 'normal');
  assert.equal(P.bmiClass(17).key, 'under');
  assert.equal(P.bmiClass(27).key, 'over');
  assert.equal(P.bmiClass(31).key, 'obese');
  assert.equal(P.bmi(72, null), null);
});

/* ---------------- هواوي AH100 / CH100 ---------------- */
// المراجع: اختبارات openScale (HuaweiAhCh100HandlerTest) — منها إطاران حقيقيان من ميزان CH100
// فُكّا وطابقا شاشة الميزان (126.6 كجم / 33.8% / 306 Ω).
const HW = P.Huawei;
const CAPTURE_MAC = '5C:CA:D3:14:2B:B3';
const CAPTURE_1 = 'bc110eabf78678303ba462fc93d1db4b348861';
const CAPTURE_2 = 'bc110eabf48679303ba462fc93dce84b3f8861';
const hwChars = [
  { svc: P.S.HUAWEI, chr: P.C.HW_TX, props: { write: true } },
  { svc: P.S.HUAWEI, chr: P.C.HW_RX, props: {} }
];
const scaleFrame = (op, payload, mac) => Uint8Array.from([0xBD, payload.length + 1, op, ...HW.xorMac(Uint8Array.from(payload), mac)]);

test('AES-128 matches FIPS-197 and Node crypto in CTR mode', () => {
  assert.equal(P.hex(HW.encryptBlock(H('00112233445566778899aabbccddeeff'), H('000102030405060708090a0b0c0d0e0f'))), '69 c4 e0 d8 6a 7b 04 30 d8 cd b7 80 70 b4 c5 5a');
  for (let i = 0; i < 200; i++) {
    const k = crypto.randomBytes(16), iv = crypto.randomBytes(16), d = crypto.randomBytes(1 + (i % 45));
    const c = crypto.createCipheriv('aes-128-ctr', k, iv);
    assert.equal(P.hex(HW.aesCtr(d, k, iv)), P.hex(Buffer.concat([c.update(d), c.final()])));
  }
});

test('Huawei auth token and session key match the openScale reference', () => {
  const mac = P.parseMac('5C:CA:D3:08:7B:4F');
  assert.equal(P.hex(HW.authToken(1)).replace(/ /g, ''), '11223344551001');
  assert.equal(P.hex(HW.magicKey(HW.authToken(1), mac)).replace(/ /g, ''), '4de8e04c2e5f5d2a980fde3456732156');
});

test('Huawei reference frame decodes to 97.0 kg, 28.0 % fat, 540 Ω', () => {
  const mac = P.parseMac('5C:CA:D3:08:7B:4F');
  const m = HW.decodeMeasurement(H('bc100edef702c9bbf2176c755b6eccdd5b92b0'), HW.magicKey(HW.authToken(1), mac), mac);
  near(m.weightKg, 97.0); near(m.fatPct, 28.0); assert.equal(m.impedance, 540);
  const d = new Date(m.ts);
  assert.deepEqual([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()], [2026, 5, 19, 8, 12, 33]);
});

test('Huawei REAL hardware frames decode to what the scale display showed', () => {
  const mac = P.parseMac(CAPTURE_MAC);
  const key = HW.magicKey(HW.authToken(1), mac);
  const a = HW.decodeMeasurement(H(CAPTURE_1), key, mac);
  near(a.weightKg, 126.6); near(a.fatPct, 33.8); assert.equal(a.impedance, 306); assert.equal(a.valid, true);
  const b = HW.decodeMeasurement(H(CAPTURE_2), key, mac);
  near(b.weightKg, 126.5); near(b.fatPct, 33.9); assert.equal(b.impedance, 313);
  const d = new Date(b.ts);
  assert.deepEqual([d.getHours(), d.getMinutes(), d.getSeconds()], [10, 12, 21]);
});

test('Huawei session: auth → config writes → real measurement → ack', () => {
  const mac = P.parseMac(CAPTURE_MAC);
  const s = P.createSession({ kind: 'huawei', chars: hwChars, mac, profile: { heightCm: 180, age: 35, sex: 'm' }, lastWeightKg: 126 });
  assert.equal(s.needsMac, false);
  const k = s.kick();
  assert.equal(P.hex(k.writes[0].data), P.hex(Uint8Array.from([0xDB, 0x08, 36, ...HW.xorMac(HW.authToken(1), mac)])));
  assert.equal(k.writes[0].chr, P.C.HW_TX);

  const ok = s.onData(P.S.HUAWEI, P.C.HW_RX, scaleFrame(0x26, [0x01], mac));
  assert.deepEqual(ok.writes.map(w => w.data[2]), [2, 8, 9, 12]); // وحدة، ساعة، بيانات الشخص، الإصدار
  const ui = ok.writes[2].data;
  assert.equal(ui[0], 0xDC); assert.equal(ui[1], 14); assert.equal(ui.length, 3 + 16);
  const key = HW.magicKey(HW.authToken(1), mac);
  const plain = HW.aesCtr(HW.xorMac(ui.slice(3), mac), key, HW.IV);
  assert.equal(P.hex(plain), P.hex(Uint8Array.from([...HW.authToken(1), 35, 180, 0, 1260 & 0xFF, 1260 >> 8, 0xFF, 0xFF, 0x1C, 0xE2])));
  assert.equal(s.onData(P.S.HUAWEI, P.C.HW_RX, scaleFrame(0x26, [0x01], mac)).writes.length, 0); // تحقق مكرر ← لا شي

  const st = s.onData(P.S.HUAWEI, P.C.HW_RX, scaleFrame(0x0F, [0, 0, 0], mac));
  assert.equal(st.status, 'measure');
  const m = s.onData(P.S.HUAWEI, P.C.HW_RX, H(CAPTURE_1));
  assert.equal(m.readings.length, 1);
  near(m.readings[0].weightKg, 126.6); near(m.readings[0].fatPct, 33.8); assert.equal(m.readings[0].impedance, 306);
  assert.equal(m.readings[0].stable, true);
  assert.deepEqual([...m.writes[0].data], [0xDB, 0x02, 19, 0x00 ^ mac[0]]);
  // النصف الثاني من نفس القياس ما يكرر القراءة
  assert.equal(s.onData(P.S.HUAWEI, P.C.HW_RX, Uint8Array.from([0xBC, 0x11, 0x8E, 1, 2, 3])).readings.length, 0);
  // المرأة: بت الجنس 0x80
  const f = s.setProfile({ heightCm: 160, age: 30, sex: 'f' });
  const fp = HW.aesCtr(HW.xorMac(f.writes[0].data.slice(3), mac), key, HW.IV);
  assert.equal(fp[7], 30 | 0x80); assert.equal(fp[8], 160);
});

test('Huawei session: refused auth retries, then binds, then re-auths', () => {
  const mac = P.parseMac(CAPTURE_MAC);
  const s = P.createSession({ kind: 'huawei', chars: hwChars, mac });
  const no = () => s.onData(P.S.HUAWEI, P.C.HW_RX, scaleFrame(0x26, [0x00], mac)).writes.map(w => w.data[2]);
  assert.deepEqual(no(), [36]);
  assert.deepEqual(no(), [36]);
  assert.deepEqual(no(), [37]); // ربط
  assert.deepEqual(s.onData(P.S.HUAWEI, P.C.HW_RX, scaleFrame(0x27, [0x01], mac)).writes.map(w => w.data[2]), [36]);
});

test('Huawei: no MAC → asks for it; wrong MAC → decode error instead of a bogus weight', () => {
  const s = P.createSession({ kind: 'huawei', chars: hwChars });
  assert.equal(s.needsMac, true);
  assert.equal(s.onData(P.S.HUAWEI, P.C.HW_RX, Uint8Array.from([0xBD, 0x01, 0x00])).error, 'mac');
  const wrong = P.parseMac('5C:CA:D3:14:2B:B4');
  const s2 = P.createSession({ kind: 'huawei', chars: hwChars, mac: wrong });
  s2.onData(P.S.HUAWEI, P.C.HW_RX, scaleFrame(0x26, [0x01], wrong));
  const out = s2.onData(P.S.HUAWEI, P.C.HW_RX, H(CAPTURE_1));
  assert.equal(out.readings.length, 0);
  assert.equal(out.error, 'decode');
});

test('Huawei name detection and MAC parsing', () => {
  assert.equal(P.detectKind('AH100', []), 'huawei');
  assert.equal(P.detectKind('HUAWEI AH100', []), 'huawei');
  assert.equal(P.detectKind('CH100-1234', []), 'huawei');
  assert.equal(P.detectKind('CH100S', [P.S.HUAWEI]), 'unknown');
  assert.equal(P.detectKind('Scale', [P.S.HUAWEI]), 'huawei');
  assert.equal(P.macText(P.parseMac('5cca d314 2bb3')), '5C:CA:D3:14:2B:B3');
  assert.equal(P.parseMac('5C:CA:D3'), null);
  assert.equal(P.parseMac('00:00:00:00:00:00'), null);
  assert.equal(P.macText(P.macFromAdvert([Uint8Array.from([0x01, 0xB3, 0x2B, 0x14, 0xD3, 0xCA, 0x5C, 0x09])])), '5C:CA:D3:14:2B:B3');
});
