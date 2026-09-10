import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const read = name => fs.readFileSync(new URL('../public/' + name, import.meta.url), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(read('assets/det/practice-bank.js'), context);
const { banks, meta } = context.window.DetPracticeBank;
test('200 original practice items with intact first and last reading sentences', () => {
  assert.equal(meta.passages, 40);
  assert.equal(banks.readcomplete.passages.length, 40);
  assert.equal(banks.fib.items.length, 80);
  assert.equal(banks.listentype.items.length, 80);
  assert.equal(meta.total, 200);
  assert.equal(meta.official, false);
  assert.equal(new Set(banks.readcomplete.passages.map(p => p.text)).size, 40);
  assert.equal(new Set(banks.listentype.items.map(p => p.text)).size, 80);
  for (const p of banks.readcomplete.passages) {
    const s = p.text.match(/[^.!?]+[.!?]+/g);
    assert(!s[0].includes('{'), p.title);
    assert(!s.at(-1).includes('{'), p.title);
    assert(p.text.split(/\s+/).length >= 80, p.title);
    const gaps = [...p.text.matchAll(/\{([^}]+)\}/g)].map(x => x[1]);
    assert(gaps.length >= 8, p.title);
    assert.equal(new Set(gaps).size, gaps.length, p.title + ': duplicate gap word loses its gaps_ar entry');
    for (const gap of gaps) assert(p.gaps_ar[gap]?.length, `${p.title}: ${gap}`);
  }
  for (const x of banks.fib.items) {
    assert(x.sentence.includes(x.answer)); assert(x.answer.startsWith(x.stem));
    assert(x.stem.length < x.answer.length); assert(x.hint_ar.length > 1);
    assert(x.clue_ar.includes('____') && !x.clue_ar.includes(x.answer), x.answer + ': clue must show the sentence with the gap, never the answer');
    assert(!x.clue_ar.startsWith('المعنى: '), x.answer + ': clue must not repeat the gloss that hint_ar already shows');
  }
});
test('integration merges the bank synchronously and preserves contextual variants', () => {
  const html = read('det-train.html');
  const json = html.match(/<script id="banks" type="application\/json">([\s\S]*?)<\/script>/)[1];
  const base = JSON.parse(json);
  const c = { BANKS: base, keyStr: x => String(x).toLowerCase(), WORD_AR: null, VTHEME: null };
  vm.createContext(c);
  vm.runInContext(html.match(/function mergeBanks\(banks\) \{[\s\S]*?\n\}/)[0], c);
  const before = [base.readcomplete.passages.length, base.fib.items.length, base.listentype.items.length];
  c.mergeBanks(banks); c.mergeBanks(banks);
  assert.deepEqual([base.readcomplete.passages.length, base.fib.items.length, base.listentype.items.length], before.map((v, i) => v + [40, 80, 80][i]));
  assert(html.indexOf('mergeBanks(window.DetPracticeBank.banks)') < html.indexOf("await fetch('det-bank2"));
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/src=|application\/json|type="module"/.test(match[1])) new vm.Script(match[2]);
  }
});
class Element {
  constructor(doc, text = '') { this.ownerDocument = doc; this.textContent = text; this.nodes = []; this.listeners = {}; this.attributes = {}; this.style = {}; this.classList = { toggle() {}, remove() {} }; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  removeEventListener(name, fn) { if (this.listeners[name] === fn) delete this.listeners[name]; }
  appendChild(node) { this.nodes.push(node); }
  contains(node) { return node === this || this.nodes.includes(node); }
  querySelectorAll() { return this.nodes.filter(n => n instanceof Element); }
  setAttribute(k, v) { this.attributes[k] = v; }
}
function fixture() {
  let selected = '', outside = false;
  const doc = new Element();
  doc.createElement = () => new Element(doc);
  doc.createTextNode = text => ({ textContent: text });
  const passage = new Element(doc), preview = new Element(doc);
  doc.getSelection = () => ({ rangeCount: selected ? 1 : 0, isCollapsed: !selected, toString: () => selected, removeAllRanges() { selected = ''; }, getRangeAt: () => ({ startContainer: outside ? preview : passage, endContainer: passage }) });
  const c = { window: {} }; vm.createContext(c); vm.runInContext(read('assets/det/highlight.js'), c);
  const mounted = c.window.DetHighlight.mount(passage, preview, 'The small green library opens early.');
  return { doc, passage, preview, mounted, set(value, out = false) { selected = value; outside = out; doc.listeners.selectionchange?.(); } };
}
test('iPhone-style selection collapse on pressing submit does not lose the answer', () => {
  const f = fixture(); f.set('small green library'); f.set('');
  assert.equal(f.mounted.value(), 'small green library');
  f.set('outside content', true); assert.equal(f.mounted.value(), 'small green library');
  f.mounted.clear(); assert.equal(f.mounted.value(), '');
  f.mounted.destroy(); assert.equal(f.doc.listeners.selectionchange, undefined);
});
test('touch start/end selection supports reverse ranges, one word, reset and keyboard clicks', () => {
  const f = fixture(); f.mounted.tapMode(); const words = f.passage.querySelectorAll();
  words[3].listeners.click(); words[1].listeners.click();
  assert.equal(f.mounted.value(), 'small green library');
  assert.equal(words[2].attributes['aria-pressed'], 'true');
  words[5].listeners.click(); assert.equal(f.mounted.value(), 'early.');
  assert.equal(words[0].attributes.tabindex, '0'); assert.equal(words[1].attributes.tabindex, '-1');
  // Clearing leaves tap mode (the plain passage comes back), so the learner can drag-select or tap again.
  f.mounted.clear(); assert.equal(f.mounted.value(), ''); assert.equal(f.mounted.tapping(), false);
  f.mounted.tapMode(); const again = f.passage.querySelectorAll().slice(-6);
  again[0].listeners.click(); again[5].listeners.click();
  assert.equal(f.mounted.value(), 'The small green library opens early.');
});
