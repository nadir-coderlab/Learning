// Plain-node test for public/det-scoring.js (no framework).
// Run:  node tests/det-scoring.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const jsPath = path.join(root, 'public', 'det-scoring.js');
const wordsPath = path.join(root, 'public', 'det-words.txt');

// Load the classic script with a fake window (no fetch in the sandbox on purpose).
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(jsPath, 'utf8'), ctx, { filename: 'det-scoring.js' });
const D = ctx.window.DetScore;

let passed = 0, failed = 0;
const failures = [];
const queue = [];
function test(name, fn) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); passed++; console.log('  ok   ' + name); }
    catch (e) { failed++; failures.push(name + ': ' + e.message); console.log('  FAIL ' + name + '\n       ' + e.message); }
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); }
const flagsOf = (r, types = ['grammar', 'article', 'spelling']) => r.issues.filter(i => types.includes(i.type));
const hasSnippet = (r, snippet, type) => r.issues.some(i => (!type || i.type === type) && i.text.toLowerCase().includes(snippet.toLowerCase()));
const fmt = (r) => JSON.stringify(flagsOf(r).map(i => i.type + ':' + i.text + '->' + i.fix));

console.log('det-scoring tests');

test('DetScore defined with expected API and >= 45 grammar rules', () => {
  assert(D && typeof D.writing === 'function' && typeof D.speaking === 'function' && typeof D.loadWords === 'function', 'API missing');
  assert(D.rules.length >= 45, 'rules: ' + D.rules.length);
  assert(D.dictSize() >= 1500, 'fallback dict size ' + D.dictSize());
});

test('loadWords without fetch resolves to fallback count; addWords loads det-words.txt', async () => {
  const fallback = D.dictSize();
  const n = await D.loadWords('does-not-exist.txt');
  eq(n, fallback, 'fallback count');
  const txt = fs.readFileSync(wordsPath, 'utf8');
  const lines = txt.trim().split('\n');
  assert(lines.length >= 30000 && lines.length <= 45000, 'word list size ' + lines.length);
  assert(lines.every(w => /^[a-z]+$/.test(w)), 'all lowercase a-z');
  D.addWords(txt);
  assert(D.dictSize() >= 30000, 'dict after load ' + D.dictSize());
});

// ---------- dictionary / inflections ----------
test('inflection-aware word check', () => {
  for (const w of ['studying', 'stopped', 'happier', 'families', 'quickly', 'running', 'boxes', 'biggest', 'cities', 'loved', 'planning', 'simply', 'children', 'the'])
    assert(D.checkWord(w), 'should accept ' + w);
  for (const w of ['xyzzyq', 'becuase', 'goverment', 'qwrtyp']) assert(!D.checkWord(w), 'should reject ' + w);
});

test('spelling suggestions (fixed list + edit distance 1)', () => {
  eq(D.suggest('becuase'), 'because');
  eq(D.suggest('goverment'), 'government');
  eq(D.suggest('freinds'), 'friends');
  eq(D.suggest('wich'), 'which');
});

// ---------- bad essay ----------
const BAD = `In this day and age, peoples is very like technology. Yesterday I go to the univercity and my father he is tell me that I must to study hard becuase the exam is in Monday. I am agree with him but I dont have nothing to do since 3 years. An university is a apple of my eye and it is more better then school. I have 20 years old and I very like my freind. There is many students who is enter to the class and listen music. He go to school everyday and he dont like it. We discuss about the enviroment and it depend of the goverment. My sister is married with a doctor, she explain me everything.`;

test('bad essay: grammar issues with correct snippets', () => {
  const r = D.writing({ text: BAD, kind: 'sample', keywords: ['technology', 'education'] });
  const expect = ['peoples', 'yesterday i go', 'my father he is', 'must to', 'in monday', 'i am agree', 'dont have nothing', 'since 3 years',
    'more better', 'i have 20 years old', 'i very like', 'there is many students', 'students who is', 'enter to the', 'listen music',
    'he go', 'he dont', 'discuss about', 'depend of', 'married with', 'explain me'];
  const missing = expect.filter(s => !hasSnippet(r, s, 'grammar'));
  assert(missing.length === 0, 'missing grammar snippets: ' + JSON.stringify(missing) + ' got ' + fmt(r));
  assert(r.score < 55, 'bad essay score should be low, got ' + r.score);
  assert(r.subscores.grammar < 40, 'grammar subscore ' + r.subscores.grammar);
});

test('bad essay: spelling issues with fixes', () => {
  const r = D.writing({ text: BAD, kind: 'sample' });
  const sp = Object.fromEntries(r.issues.filter(i => i.type === 'spelling').map(i => [i.text, i.fix]));
  eq(sp.univercity, 'university'); eq(sp.becuase, 'because'); eq(sp.freind, 'friend'); eq(sp.enviroment, 'environment'); eq(sp.goverment, 'government');
  assert(hasSnippet(r, 'an university', 'article') && hasSnippet(r, 'a apple', 'article'), 'article issues');
  assert(hasSnippet(r, 'in this day and age', 'template'), 'template flagged');
  assert(r.issues.every(i => typeof i.ar === 'string' && /[؀-ۿ]/.test(i.ar)), 'every issue has Arabic explanation');
});

// ---------- good essay ----------
const GOOD = `Many people believe that technology has made our lives easier, and I agree with this opinion for several reasons. First of all, smartphones allow us to communicate with our families at any time, even when we are travelling abroad. In addition, online learning has become a real option for students who cannot attend a university in person. However, there are also some disadvantages. For example, children spend too much time on screens, which can affect their sleep and their concentration at school. Although these problems are serious, I still think the benefits outweigh the drawbacks. If parents set clear rules, technology can be a powerful tool rather than a distraction. In conclusion, we should use these devices wisely instead of avoiding them completely, because the future will certainly depend on them.`;

test('good 130-word essay scores > 70 with no grammar/spelling flags', () => {
  const r = D.writing({ text: GOOD, kind: 'sample', prompt: 'Has technology made our lives easier? Give reasons and examples.', keywords: ['technology', 'easier', 'reasons', 'examples'] });
  assert(r.words >= 125, 'words ' + r.words);
  assert(r.score > 70, 'score ' + r.score + ' ' + JSON.stringify(r.subscores));
  eq(flagsOf(r).length, 0, 'false positives: ' + fmt(r));
  assert(r.strengths.length >= 2, 'strengths');
  assert(r.tips.length >= 1 && r.tips.length <= 4, 'tips count');
  assert(r.band.startsWith('تقدير:'), 'band label');
});

test('correct English paragraphs produce zero grammar/article/spelling/mechanics flags', () => {
  const texts = [
    `In the picture, I can see a young woman who is sitting on a wooden bench in a busy park. She is wearing a blue jacket and holding a cup of coffee. Behind her, there are several tall trees, and the sky looks cloudy. Two children are playing with a red ball on the grass, while an old man walks his dog along the path. It seems like a calm afternoon, and everyone appears relaxed.`,
    `Yesterday I went to the mall with my brother. We bought some clothes and ate lunch at a small restaurant. The number of people is growing every year, and my father and he go there together every weekend. Does it make sense to visit on a Friday? Last week I saw a film that came out last month. She researches climate change and has worked in Riyadh since 2020. The story was told to me by my uncle, who has lived in London for ten years. You can tell that he is tired. It is like a dream. There is a need for more parks. The book is read by thousands of students. He was married with two children when I met him. The manager suggested that he go home early. Which of you is ready? In the last year, prices have risen a lot. I look forward to seeing you. An hour later, a European company offered me a job at a university.`,
    `When I was a child, my family lived in a small village near the sea. My mother used to wake up early to bake bread, and the smell filled the whole house. On Fridays we visited my grandparents, who told us stories about the old days. Nowadays I live in Jeddah, where life is much faster. I work as an engineer at a large company, and I usually spend my weekends hiking in the mountains or reading novels. Even though I miss the quiet of the village, I enjoy the opportunities that the city offers. The more you practise, the better you get. I will write more later.`,
    `The two speakers talked about their plans for the weekend. Sarah wanted to go to the beach, but Tom said that the weather would be rainy. They discussed a few options and finally agreed to visit the new museum downtown instead. Tom promised to buy the tickets online, and Sarah said she would bring lunch. It cost them twenty riyals each.`
  ];
  for (const t of texts) {
    const r = D.writing({ text: t, kind: 'sample' });
    const f = flagsOf(r, ['grammar', 'article', 'spelling', 'mechanics']);
    eq(f.length, 0, 'false positives in: "' + t.slice(0, 40) + '…" ' + JSON.stringify(f.map(i => i.type + ':' + i.text)));
  }
});

test('proper nouns and capitalised words are never spell-flagged', () => {
  const r = D.writing({ text: 'I visited Riyadh and met Dr. Alqahtani at Kingdom Tower with Mohammed and Khalid from Aramco. We ate Kabsa at Najd Village.', kind: 'photo' });
  eq(r.issues.filter(i => i.type === 'spelling').length, 0, 'spelling flags: ' + fmt(r));
});

test('keywords protect unknown words from spelling flags', () => {
  const r1 = D.writing({ text: 'We cooked jareesh and drank karak in the majlis after the game.', kind: 'photo', keywords: ['jareesh', 'karak'] });
  eq(r1.issues.filter(i => i.type === 'spelling' && (i.text === 'jareesh' || i.text === 'karak')).length, 0, 'protected words flagged');
});

// ---------- articles ----------
test("'a apple' flagged with fix 'an apple'; 'an apple' not flagged", () => {
  const bad = D.writing({ text: 'I ate a apple this morning.', kind: 'photo' });
  const hit = bad.issues.find(i => i.type === 'article' && /a apple/i.test(i.text));
  assert(hit, 'not flagged: ' + fmt(bad));
  eq(hit.fix, 'an apple');
  eq(flagsOf(D.writing({ text: 'I ate an apple this morning.', kind: 'photo' }), ['article']).length, 0);
});

test("'an university' flagged; 'a university', 'an hour', 'a European' not flagged; 'a hour' flagged", () => {
  assert(hasSnippet(D.writing({ text: 'She studies at an university in Jeddah.' }), 'an university', 'article'), 'an university');
  assert(hasSnippet(D.writing({ text: 'It took a hour to arrive.' }), 'a hour', 'article'), 'a hour');
  const ok = D.writing({ text: 'She studies at a university for an hour with a European friend and an honest man and a one-day plan.' });
  eq(flagsOf(ok, ['article']).length, 0, 'false article flags: ' + fmt(ok));
});

// ---------- subject-verb agreement ----------
test("'He go' flagged, 'He goes' / 'Does he go' / 'my father and he go' not flagged", () => {
  const bad = D.writing({ text: 'He go to school every day.' });
  const hit = bad.issues.find(i => i.type === 'grammar' && /he go/i.test(i.text));
  assert(hit, 'he go not flagged: ' + fmt(bad));
  eq(hit.fix.toLowerCase(), 'he goes');
  for (const t of ['He goes to school every day.', 'Does he go to school every day?', 'My father and he go to school together.', 'I will let it go.', 'She wants to see it work.'])
    eq(flagsOf(D.writing({ text: t })).length, 0, 'false flag in: ' + t + ' ' + fmt(D.writing({ text: t })));
});

test("'a lot of people is' flagged but 'the number of people is' not", () => {
  assert(hasSnippet(D.writing({ text: 'A lot of people is coming to the party.' }), 'a lot of people is', 'grammar'), 'not flagged');
  eq(flagsOf(D.writing({ text: 'The number of people is growing fast.' })).length, 0, 'false flag');
});

// ---------- tense / time ----------
test("'since 3 years' flagged with fix 'for 3 years'; 'since 2020' not flagged", () => {
  const r = D.writing({ text: 'I have lived here since 3 years.' });
  const hit = r.issues.find(i => /since 3 years/i.test(i.text));
  assert(hit, 'not flagged'); eq(hit.fix, 'for 3 years');
  eq(flagsOf(D.writing({ text: 'I have lived here since 2020 and for three years before that.' })).length, 0, 'false flag');
});

test("'Yesterday I go' flagged; 'Yesterday I went' not; 'in the last night' flagged, 'in the last year' not", () => {
  assert(hasSnippet(D.writing({ text: 'Yesterday I go to the market with my mother.' }), 'yesterday i go', 'grammar'), 'yesterday I go');
  eq(flagsOf(D.writing({ text: 'Yesterday I went to the market with my mother.' })).length, 0, 'yesterday I went');
  assert(hasSnippet(D.writing({ text: 'We watched a film in the last night.' }), 'in the last night', 'grammar'), 'in the last night');
  eq(flagsOf(D.writing({ text: 'In the last year, I have learned a lot.' })).length, 0, 'in the last year');
});

test('double negative and double comparative flagged', () => {
  assert(hasSnippet(D.writing({ text: "I don't have nothing to say." }), "don't have nothing", 'grammar'), 'double negative');
  assert(hasSnippet(D.writing({ text: 'This phone is more better than mine.' }), 'more better', 'grammar'), 'more better');
  eq(flagsOf(D.writing({ text: 'The more you read, the better you write.' })).length, 0, 'the more the better');
});

test('look forward to + ing', () => {
  assert(hasSnippet(D.writing({ text: 'I look forward to see you.' }), 'look forward to see', 'grammar'));
  eq(flagsOf(D.writing({ text: 'I look forward to seeing you.' })).length, 0);
});

// ---------- templates / relevance ----------
test('memorized-template text is flagged and lowers the score', () => {
  const plain = 'Working from home has clear benefits for employees. They save time on the commute and can organise their day around family needs. However, some people feel isolated without colleagues around them, so companies should offer a mix of both options.';
  const templ = 'In this day and age, every coin has two sides and it goes without saying that working from home is a controversial topic. There is no doubt that from my point of view I strongly believe it has benefits. In a nutshell, companies should offer a mix of both options.';
  const r1 = D.writing({ text: plain, kind: 'interactive', keywords: ['working from home', 'benefits'] });
  const r2 = D.writing({ text: templ, kind: 'interactive', keywords: ['working from home', 'benefits'] });
  assert(r2.issues.filter(i => i.type === 'template').length >= 3, 'template count ' + r2.issues.filter(i => i.type === 'template').length);
  eq(r1.issues.filter(i => i.type === 'template').length, 0, 'plain text has no template flags');
  assert(r2.score < r1.score, 'template score ' + r2.score + ' should be < ' + r1.score);
  assert(r2.tips.some(t => /محفوظ/.test(t)), 'tip about memorized phrases');
});

test('relevance drops when text ignores the keywords', () => {
  const text = 'My favourite hobby is swimming. I go to the pool three times a week because it keeps me fit and helps me relax after work. Sometimes my brother joins me and we race each other.';
  const on = D.writing({ text, kind: 'photo', prompt: 'Describe your favourite hobby.', keywords: ['hobby', 'swimming', 'pool', 'relax'] });
  const off = D.writing({ text, kind: 'photo', prompt: 'Describe the traffic problems in your city.', keywords: ['traffic', 'city', 'cars', 'pollution'] });
  assert(off.subscores.task < on.subscores.task - 15, 'task on=' + on.subscores.task + ' off=' + off.subscores.task);
  assert(off.score < on.score, 'score');
  assert(off.issues.some(i => i.type === 'relevance'), 'relevance issue present');
  assert(!on.issues.some(i => i.type === 'relevance'), 'no relevance issue when on topic');
});

// ---------- length / kinds ----------
test('score is not driven by word count alone: short correct photo text beats long bad text', () => {
  const short = D.writing({ text: 'In this photo, a young man is standing next to a red car in front of a small house. He is wearing a white shirt and holding his keys, and he looks happy because it is probably his first car. The weather seems sunny and warm.', kind: 'photo' });
  const longBad = D.writing({ text: BAD + ' ' + BAD, kind: 'photo' });
  assert(longBad.words > short.words * 2, 'long is longer');
  assert(short.score > longBad.score, 'short=' + short.score + ' longBad=' + longBad.score);
  assert(short.issues.some(i => i.type === 'length') === false, 'photo of ' + short.words + ' words should not be flagged short');
});

test('too-short text gets a length issue and tip', () => {
  const r = D.writing({ text: 'Technology is good. I like my phone.', kind: 'interactive' });
  assert(r.issues.some(i => i.type === 'length'), 'length issue');
  assert(r.tips.some(t => /طوّل|كلمة/.test(t)), 'length tip');
  assert(r.score < 50, 'score ' + r.score);
});

test('empty writing text gives score 0 and an Arabic note', () => {
  const r = D.writing({ text: '', kind: 'photo' });
  eq(r.score, 0); eq(r.words, 0);
  assert(r.issues.length === 1 && /[؀-ۿ]/.test(r.issues[0].ar));
});

// ---------- summary ----------
test('summary kind rewards past tense and a decision', () => {
  const past = 'Two friends talked about their weekend plans. Ali wanted to go camping, but Sara said she was tired. They discussed several ideas and finally decided to stay home and watch a film because the weather was bad.';
  const present = 'Two friends talk about their weekend plans. Ali wants to go camping, but Sara says she is tired. They discuss several ideas and stay home and watch a film because the weather is bad.';
  const r1 = D.writing({ text: past, kind: 'summary' });
  const r2 = D.writing({ text: present, kind: 'summary' });
  assert(r1.subscores.task > r2.subscores.task, 'task past=' + r1.subscores.task + ' present=' + r2.subscores.task);
  assert(r1.score > r2.score, 'score past=' + r1.score + ' present=' + r2.score);
  assert(r2.issues.some(i => /الماضي/.test(i.ar)), 'present-tense summary gets a past-tense note');
  eq(flagsOf(r1).length, 0, 'no false flags in past summary ' + fmt(r1));
});

// ---------- mechanics / repetition ----------
test('mechanics: lowercase i, missing final punctuation, double spaces', () => {
  const r = D.writing({ text: 'yesterday i went to the park with my friend.  we played football and then i went home', kind: 'photo' });
  const mech = r.issues.filter(i => i.type === 'mechanics');
  assert(mech.some(i => i.text === 'i' && i.fix === 'I'), 'lowercase i');
  assert(mech.some(i => /نقطة/.test(i.ar)), 'final punctuation');
  assert(mech.some(i => /مسافتين/.test(i.ar)), 'double space');
  assert(r.subscores.mechanics < 70, 'mechanics subscore ' + r.subscores.mechanics);
});

test('repetition of the same word is flagged', () => {
  const r = D.writing({ text: 'Technology is important. Technology helps students. Technology helps teachers. Technology makes life easy. I love technology and technology loves me.', kind: 'photo' });
  assert(r.issues.some(i => i.type === 'repetition' && i.text === 'technology'), 'repetition issue');
});

// ---------- speaking ----------
const TRANSCRIPT = 'in this picture i can see a busy street in the middle of the city there are many cars and buses and people are walking on both sides of the road on the left there is a tall building with big windows and a small coffee shop next to it the weather looks sunny and warm so i think it is summer some people are wearing sunglasses and one man is holding an umbrella maybe because the sun is very strong in the background i can see some trees and a bridge i think this is a normal working day because everyone looks busy and nobody is smiling it reminds me of the main street in my hometown where i used to walk with my friends after school';

test('speaking: wpm computed from words and seconds', () => {
  const r = D.speaking({ transcript: TRANSCRIPT, seconds: 60, kind: 'photo' });
  eq(r.wpm, Math.round(r.words / (60 / 60)));
  const r2 = D.speaking({ transcript: 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty', seconds: 10 });
  eq(r2.wpm, 120);
  eq(typeof r.html, 'string');
  assert(r.html.includes('كلمة/دقيقة'), 'wpm in html');
});

test('speaking: short answer (seconds < 40% of target) gets a big task penalty and "املأ الوقت" tip', () => {
  const full = D.speaking({ transcript: TRANSCRIPT, seconds: 85, kind: 'photo' });
  const short = D.speaking({ transcript: TRANSCRIPT.split(' ').slice(0, 45).join(' '), seconds: 20, kind: 'photo' });
  assert(short.subscores.task < full.subscores.task * 0.6, 'task full=' + full.subscores.task + ' short=' + short.subscores.task);
  assert(short.issues.some(i => i.type === 'length'), 'length issue');
  assert(short.tips.some(t => t.includes('املأ الوقت')), 'tip: ' + JSON.stringify(short.tips));
  assert(short.score < full.score, 'score');
});

test('speaking: empty transcript scores only on duration with a microphone note', () => {
  const r = D.speaking({ transcript: '', seconds: 45, kind: 'photo' });
  eq(r.words, 0); eq(r.wpm, 0);
  assert(r.score > 0 && r.score <= 25, 'score ' + r.score);
  assert(r.issues.length === 1 && /المايك/.test(r.issues[0].ar), 'mic note');
  const r0 = D.speaking({ transcript: '', seconds: 0, kind: 'photo' });
  eq(r0.score, 0);
});

test('speaking: fillers counted and flagged', () => {
  const r = D.speaking({ transcript: 'um so in this picture uh there is um a man and uh he is like like walking you know to the um shop', seconds: 30, kind: 'interactive' });
  assert(r.fillers >= 5, 'fillers ' + r.fillers);
  assert(r.issues.some(i => i.type === 'filler'), 'filler issue');
  const clean = D.speaking({ transcript: TRANSCRIPT, seconds: 80, kind: 'photo' });
  eq(clean.fillers, 0);
});

test('speaking: no false grammar flags on a clean unpunctuated transcript', () => {
  const r = D.speaking({ transcript: TRANSCRIPT, seconds: 80, kind: 'photo' });
  eq(flagsOf(r, ['grammar', 'article', 'spelling', 'mechanics']).length, 0, fmt(r));
  assert(r.score >= 65, 'score ' + r.score + ' ' + JSON.stringify(r.subscores));
});

// ---------- report shape / html ----------
test('report shape and band mapping', () => {
  const r = D.writing({ text: GOOD, kind: 'sample' });
  for (const k of ['score', 'band', 'words', 'sentences', 'ttr', 'subscores', 'issues', 'strengths', 'tips', 'html']) assert(k in r, 'missing ' + k);
  assert(Number.isInteger(r.score) && r.score >= 0 && r.score <= 100);
  assert(r.ttr > 0 && r.ttr <= 1);
  for (const k of ['task', 'vocab', 'grammar', 'structure', 'mechanics']) assert(Number.isInteger(r.subscores[k]) && r.subscores[k] >= 0 && r.subscores[k] <= 100, 'subscore ' + k);
  eq(D.band(20), 'تقدير: 40–60'); eq(D.band(40), 'تقدير: 55–75'); eq(D.band(60), 'تقدير: 70–90');
  eq(D.band(70), 'تقدير: 85–105'); eq(D.band(85), 'تقدير: 100–120'); eq(D.band(95), 'تقدير: 115–135');
});

test('html is RTL, uses sc-issue/sc-good/sc-tip classes and escapes English snippets', () => {
  // no final punctuation on purpose: the mechanics issue quotes the raw tail of the text, which contains a tag
  const r = D.writing({ text: 'He go to the school & he dont like <b>it</b>', kind: 'photo' });
  assert(r.html.includes('dir="rtl"'), 'rtl');
  assert(r.html.includes('class="sc-issue') && r.html.includes('class="sc-tip"'), 'classes');
  assert(r.html.includes('<span class="en2">'), 'en2 spans');
  assert(r.issues.some(i => i.text.includes('<b>it</b>')), 'issue text carries the raw snippet');
  assert(!r.html.includes('<b>it</b>'), 'raw html leaked');
  assert(r.html.includes('&lt;b&gt;it&lt;/b&gt;') && r.html.includes('&amp;'), 'escaped');
  assert(/تقريبي/.test(r.html), 'estimate note');
  const g = D.writing({ text: GOOD, kind: 'sample' });
  assert(g.html.includes('class="sc-good"'), 'sc-good present for a good essay');
});

test('every user-facing string in the report is Arabic (tips/strengths)', () => {
  const r = D.writing({ text: BAD, kind: 'sample' });
  for (const s of r.tips.concat(r.strengths)) assert(/[؀-ۿ]/.test(s), 'not Arabic: ' + s);
});

test('scoring is fast enough (300 words in < 300ms after warm-up)', () => {
  const text = (GOOD + ' ' + GOOD + ' ' + GOOD).slice(0, 2200);
  D.writing({ text, kind: 'sample' });
  const t0 = Date.now();
  for (let i = 0; i < 5; i++) D.writing({ text, kind: 'sample' });
  const per = (Date.now() - t0) / 5;
  assert(per < 300, 'took ' + per + 'ms');
});

await runAll();
console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed) { console.log(failures.join('\n')); process.exit(1); }
