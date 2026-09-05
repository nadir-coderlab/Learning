/*!
 * det-scoring.js — rubric-style scorer for DET (Duolingo English Test) writing & speaking practice.
 * Classic script (no modules). Defines window.DetScore.
 *
 *   DetScore.loadWords(url)  -> Promise<number>   (loads public/det-words.txt; safe to call many times)
 *   DetScore.writing({ text, prompt, keywords, minWords, kind })  -> Report
 *   DetScore.speaking({ transcript, seconds, prompt, keywords, kind }) -> Report
 *
 * Score weights (DET rubric approximation):
 *   writing : task 30 · vocab 25 · grammar 25 · structure 15 · mechanics 5
 *   speaking: task 30 · vocab 25 · grammar 25 · structure 10 · fluency 10 (reported in the "mechanics" slot)
 * The band is an ESTIMATE of the DET 10–160 scale and is labelled as such in the report.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Dictionary                                                          */
  /* ------------------------------------------------------------------ */

  // Built-in fallback: ~2000 most frequent English words (works before det-words.txt loads).
  var FALLBACK = 'the you i of and to a in that it was his he me what is with for this as know had no have not be my her just on at do by which your or from we him so but all she well are they were oh about right get one here their out an going like said them yeah if who would been can up will want think when now there go more how got into any did why has see come man could good other really than our some look very time upon may okay back its mean only tell hey little then should yes made us something such because great before must two say these ok take over much way down after first make mr need gonna men never own too love most sure old shall day where sorry those came let himself thing am maybe work life without uh through being anything long might even off def please again doing many thank give thought every help people talk went same god last still away wait under find found nothing hand eyes things call place told while also better ever young night yet though against believe feel everything years fine face home once another keep left does part put saw around house stop world guy head three always took listen new wanted guys mrs huh big each king lot between happened thanks mind trying heart kind few wrong talking whom far seemed guess looked called hi care whole bad de mom set both remember getting together dad done heard leave mother name days understand actually hear baby lord country nice asked father else seen stay p course having knew side enough moment try hell among someone hands family woman words jack soon full yourself end idea ask gave best room almost coming small thou cannot looking water hello however light quite brought money nor word tonight whose given real door son hope turned taken um use hmm morning happy myself gutenberg pretty felt girl until since sir power show friend themselves already used rather saying began next present voice job others problem white minute works less thinking poor death honey matter stood form exactly within ah till probably thy happen large hurt boy often certain dead herself gotta year alone half excuse order round start kill true hard today car sent ready wife means passed whatever feet wants hold near public wanna state deal hundred children thus gone above case supposed dear friends thee says stuff person high read worry city second live received fact truth school forget known business times least cause perhaps indeed knows english open telling body itself along chance land run move return anyone air bye nature answered j either somebody dr law lay miss point child married letter four later making wish fire meet anyway cried women phone speak number reason damn therefore hour lost looks bring held free turn war during several tomorrow kids trust whether check er change manner late anymore replied five united general town ha behind working became john makes become taking brother earth play hate ago forth thousand beautiful soul crazy party england sit spirit afraid question important ground rest fun kid different watch glad everyone possible fell sister towards human minutes everybody kept bit short couple following whoa feeling met daughter evening returned wow gets strong able break french promise lady subject close sn answer easy sea fear doctor tried terms doubt walk needs trouble arms mine sense seems black killed hospital anybody followed sam alright dark wedding shut character die sort perfect sight police ten stand comes hit story ye ya mm common waiting book dinner electronic funny account husband mark interest stupid pay written bed necessary age office cool force news longer art spoke across yours early sleep ought sometimes started line sounds table appeared sonny lucky river continued pick eye ety sun date information plan hours reached lose suddenly past strange deep serious leo miles shit act inside ahead paid further week purpose wonderful t added fight seem cut blood rose sick south beyond s cold game eat neither forward nobody goes view position sound none save entered clear finally lives road worried upset suppose theresa carly la ethan nearly laws knowledge safe living toward leaving copy front shot loved six asking france running peace figure low hot north effect natural parents drink absolutely fall daddy fair service sweet alive below except paul american hair meant happens london david laid pass special bet led copyright kidding army lie horse meeting future coffee opened pleasure seeing history fault west fuck red hath note although welcome buy gold months desire master jen thinks christmas lived outside certainly hang wind receive worse attention company government mistake ooh unto church handle spend strength c length totally giving placed control paper letters marriage realize d especially president greater unless sex fellow girls bear send needed opinion o window ran died faith scared agreement picture charge talked beauty jake al lips ass remained arm changed latter completely duty explain distance playing silence foot sign boys wild object relationship michael loves fucking gentleman trees green lying choice anywhere smile books secret various weird luck max persons blockquote luis particular drew touch kiss crane hardly questions walked chief obviously wonder according pain beginning calling action somewhere throw straight grace visit follow fast standing natalie presence r food heavy drive plain donations feelings immediately worked marry wrote mouth rich test drop thoughts frank u paris dream single joy protect enemy twenty broken class lucy states surprise ship condition sweetheart carry forever exclaimed including filled mad gun influence dance write takes appear appreciate situation besides parts weeks appearance pull evil march george worth sheridan amazing slowly tears top horses expect places ben caught instead julian involved struck blue swear piece york busy impossible period decided battle joey happening mary movie raised catch occasion antonio former youth learned step merely reach watching system darling dog ms quiet easily win moved afterwards honor personal moving stopped admit laughed language problems expression murder hall danger definitely feels property honest usual born broke court missed generally dollars grew showed tired jason ancient respect third starting ross simple tree entire remain trip brooke society e club wall niles result heaven calm william imagine command todd tone regard b expected blame mere month street beside sitting favor silent apartment experience terrible clean writing tony circumstances learn alison entirely fresh rick duke covered bound frasier east relax wood million stone charity quickly accident notice bright wake christ prove boat danny noble smart message missing somewhat forgot sudden value direction interested chair due craig support tom pregnant middle billy christian ring village careful reading agree dude lines team considered ride field figured observed wear scarcely shoot stick wished ray greatest bo permission angry success british buddy ex charles formed angel speaking nick conversation proper hill forgive music jail opportunity german wearing afternoon miguel cry ladies cost kinda allowed lunch cristian considerable eight greenlee gotten honour hoping phoebe seven private ridge luke scene discovered tough tape emily garden count race begin college boyfriend per individual proud birthday bill political difficult timmy speech henry share offer cast hurry ow authority floor wondering ill decision ways building officers offered ones finish original happiness flowers chris produced list summer kay provide mess study deserve religion evidence cute walls jerry america dress richard interesting pleased jesus leaves declared james hotel enjoy understood effort ryan lindsay prepared escape attempt concerned eve staying author indian m beat brown determined sweetie mention clothes spring finished drawn soldiers houses mmm beneath fix victor turning century spent prison steps intended holding soft calls matters likely surprised bar corner beth trademark justice keeping simply gift produce putting appears rome self laugh owe using europe nora ice passage helping bitch closed normal ourselves aunt gives lawyer apart passing plans required jax medium efforts girlfriend sake breath wise possession jessica pleasant box perfectly dawson memory cover usually grave judge fixed upstairs alexis modern shawn spot troops mommy rise possibly fifty worst island station acting accept camp blow nation existence reply saved copies ivy sky plane equal mama fortune yesterday lied shore domain quick lately named stuck lovely security orders report barbara degree difference rid winter tv adam allow store bag pale conduct mike bought ball religious kevin roman cases listening major lead walking cops names dangerous higher buffy et park threw sleeping built chloe rafe spoken glass shh board record vain affairs erica instance join key loss captain card crime complete gentlemen access willing lower repeated forms darkness guilty brenda military likes warm fighting passion joke physical example ears magic favorite uncle promised smiled bother spite jim shown directly seriously cell hart knowing hat advice silver somehow sufficient blair main losing mentioned push servant helped pride crowd killing train earlier boss moral instant laura associated liked path greek innocent doc meaning fit rules elizabeth ordered sabrina proved obliged cop enter rule sword thirty attack risk letting seat phillip health officer paragraph ridiculous statement social refund eric courage dreams members apologize official nervous worthy rock song olivia provided patient cassie shook request brain mighty glance hide detective heads aaron movement fee kendall planning nine spread huge opposite breakfast glory horrible twelve space awful engaged peter driving wine hanging ordinary mountains picked taste iron sell distribute quit apparently trade consider dying greatly accepted josh congratulations forced advantage ideas simon gay ho rate hal aw edmund native brady decide anxious double troy sad press extent fool watched curious foreign smell method excellent spell confidence courtney marked alan importance pictures slow joe vast tim fancy seconds hungry sought hearing prevent neck roz hearts kitchen bob liberty fly sides legal dry realized serve aside kick pure concerning grab forgotten sharon discuss powers possessed cat thrown distant responsible jennifer philip progress similar fat narrow altogether idiot page yep particularly agent settled bunch destroy mountain bucks search track shoes sin lies pieces clearly demon diane price bridget ships brad livvie papers bank medical fate incredible dropped witch judgment conditions drunk attorney charlie hills removed tells forest knock karen measure species eh seek belle highest cash otherwise stream department carefully nose obtained skye ear turns bread keeps beer bottom additional jealous drug presented aid molly fingers sooner cares q plenty remembered choose extra agreed tea animal won events fully delight outta rights amount kyle l obtain tax weekend servants sons cross type alex shoulders gosh thick points stranger woods facts dare machine grow waste creature pretend hung rain false liz tall gate ian nations created jump eating refused proof quietly surface freely slept career holy arrest streets star july phyllis mac regarded breathe fashion coast daily pulled file maria shoulder twice easier faces killer goin succeeded birds dating distribution suit romantic royal drugs comfortable wealth comfort isaac failed finds freedom checked peculiar advance divorce gentle surely animals closer ruin waited secure desired grass fish touched abigail occupied draw treat stage anna portion expressed simone amber opening june excited spirits mail hiding tongue capital growing stole pacey served carriage noticed liza weather breast fired daphne presently snow whitney bringing necessity pop practice claim piper hast education sharp prince bathroom permitted flight group chad enemies robert honestly played sing throughout katie pity expense games add n mitch pray remind taught explained rory charges leading witness finding shadow companion weight mass established suffered gray brave steal princess thin satisfied silly contact teach virtue golden shop numerous plus colonel frequently famous trial invited powerful roll radio waters national weak divine heh dirty material principal emergency gathered suggested butt credit valley obvious locked yellow heat larry loving remains bent positive nuts seized guard equally prue naturally goodbye remarkable gods fuckin moon slight cake style mood pointed bianca total windows crap crossed crying louis paige pounds evidently k belong principle immediate partner consequence trick pressure ohh principles characters dressed cup season remarked bus science tender grown nurse whispered raise quarter midst lots advanced mister bore active whoever eddie aware drinking breaking lock august computer yo genius rebecca internet online mobile email website app video photo photos media technology jobs university student students teacher shopping travel sport sports exercise restaurant disagree planned cheap expensive moreover smiling beach market airport medicine customer summary ended visited stayed enjoyed discussed complained apologized cancelled postponed recommended'.split(' ');

  var dict = new Set();        // every known word (lowercase)
  var rankMap = new Map();     // word -> 1-based frequency rank
  var loadedCount = 0;
  var loadPromise = null;

  function addWords(list) {
    var arr = Array.isArray(list) ? list : String(list || '').split(/\r?\n|\s+/);
    var added = 0;
    for (var i = 0; i < arr.length; i++) {
      var w = arr[i].trim().toLowerCase();
      if (!w || !/^[a-z]+$/.test(w)) continue;
      if (!rankMap.has(w)) { rankMap.set(w, rankMap.size + 1); added++; }
      dict.add(w);
    }
    return added;
  }
  addWords(FALLBACK);
  var fallbackCount = dict.size;

  function loadWords(url) {
    url = url || 'det-words.txt';
    if (loadedCount > 0) return Promise.resolve(loadedCount);
    if (loadPromise) return loadPromise;
    if (typeof fetch !== 'function') return Promise.resolve(fallbackCount);
    loadPromise = fetch(url, { cache: 'force-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (txt) {
      // File order is frequency order; rebuild ranks so file words come first.
      var fileWords = txt.split(/\r?\n/);
      var fresh = new Map(); var freshSet = new Set();
      for (var i = 0; i < fileWords.length; i++) {
        var w = fileWords[i].trim().toLowerCase();
        if (!w || !/^[a-z]+$/.test(w) || fresh.has(w)) continue;
        fresh.set(w, fresh.size + 1); freshSet.add(w);
      }
      if (fresh.size < 1000) throw new Error('word list too small');
      rankMap.forEach(function (rank, w) { if (!fresh.has(w)) { fresh.set(w, fresh.size + 1); freshSet.add(w); } });
      rankMap = fresh; dict = freshSet;
      loadedCount = dict.size;
      return loadedCount;
    }).catch(function () {
      loadPromise = null;
      return fallbackCount;
    });
    return loadPromise;
  }

  // Inflection-aware lookup: word, or base form after stripping s/es/ies/ed/ing/er/est/ly (+ doubling / e-restoration).
  function inList(w) {
    if (!w) return false;
    w = w.toLowerCase();
    if (dict.has(w)) return true;
    var cands = baseForms(w);
    for (var i = 0; i < cands.length; i++) if (dict.has(cands[i])) return true;
    return false;
  }

  function baseForms(w) {
    var c = [];
    var n = w.length;
    function push(x) { if (x && x.length >= 2 && c.indexOf(x) < 0) c.push(x); }
    if (n > 3 && /ies$/.test(w)) push(w.slice(0, -3) + 'y');
    if (n > 3 && /(s|x|z|ch|sh)es$/.test(w)) push(w.slice(0, -2));
    if (n > 2 && /s$/.test(w) && !/ss$/.test(w)) push(w.slice(0, -1));
    if (n > 3 && /es$/.test(w)) push(w.slice(0, -1));           // drives -> drive (via s), handled above too
    if (n > 3 && /ied$/.test(w)) push(w.slice(0, -3) + 'y');
    if (n > 3 && /ed$/.test(w)) { push(w.slice(0, -2)); push(w.slice(0, -1)); if (/([b-df-hj-np-tv-z])\1ed$/.test(w)) push(w.slice(0, -3)); }
    if (n > 4 && /ing$/.test(w)) { push(w.slice(0, -3)); push(w.slice(0, -3) + 'e'); if (/([b-df-hj-np-tv-z])\1ing$/.test(w)) push(w.slice(0, -4)); }
    if (n > 3 && /ier$/.test(w)) push(w.slice(0, -3) + 'y');
    if (n > 4 && /iest$/.test(w)) push(w.slice(0, -4) + 'y');
    if (n > 3 && /er$/.test(w)) { push(w.slice(0, -2)); push(w.slice(0, -1)); if (/([b-df-hj-np-tv-z])\1er$/.test(w)) push(w.slice(0, -3)); }
    if (n > 4 && /est$/.test(w)) { push(w.slice(0, -3)); push(w.slice(0, -2)); if (/([b-df-hj-np-tv-z])\1est$/.test(w)) push(w.slice(0, -4)); }
    if (n > 4 && /ily$/.test(w)) push(w.slice(0, -3) + 'y');
    if (n > 4 && /ally$/.test(w)) push(w.slice(0, -4)); // basically -> basic (also 'al' kept below)
    if (n > 3 && /ly$/.test(w)) { push(w.slice(0, -2)); if (/ly$/.test(w) && /[^aeiou]ly$/.test(w)) push(w.slice(0, -2) + 'e'); } // simply -> simple
    if (n > 5 && /ness$/.test(w)) { push(w.slice(0, -4)); if (/iness$/.test(w)) push(w.slice(0, -5) + 'y'); }
    if (n > 5 && /ments?$/.test(w)) push(w.replace(/ments?$/, ''));
    if (n > 4 && /^un/.test(w)) push(w.slice(2));
    if (n > 4 && /^re/.test(w)) push(w.slice(2));
    return c;
  }

  function rankOf(w) {
    w = w.toLowerCase();
    if (rankMap.has(w)) return rankMap.get(w);
    var c = baseForms(w);
    var best = Infinity;
    for (var i = 0; i < c.length; i++) if (rankMap.has(c[i])) best = Math.min(best, rankMap.get(c[i]));
    return best;
  }

  /* ------------------------------------------------------------------ */
  /* Static data                                                         */
  /* ------------------------------------------------------------------ */

  var STOP = new Set(('a an the and or but so because if when while of to in on at by for with from as into about over after before between under ' +
    'is am are was were be been being have has had do does did will would can could should may might must shall ' +
    'i me my mine you your yours he him his she her hers it its we us our ours they them their theirs this that these those ' +
    'there here what which who whom whose how why where not no yes very too also just then than more most much many some any ' +
    'all both each every few little other another such only own same up down out off again further once s t ll re ve d m').split(' '));

  var CONNECTORS = ['however', 'therefore', 'moreover', 'furthermore', 'in addition', 'additionally', 'for example', 'for instance',
    'as a result', 'consequently', 'nevertheless', 'nonetheless', 'on the other hand', 'in contrast', 'in conclusion', 'to sum up',
    'although', 'even though', 'whereas', 'despite', 'in spite of', 'in my opinion', 'firstly', 'secondly', 'finally', 'overall',
    'in particular', 'especially', 'such as', 'because of', 'due to', 'as well as', 'in other words', 'to conclude', 'meanwhile',
    'on the contrary', 'apart from', 'in fact', 'first of all', 'last but not least', 'as long as', 'unless', 'otherwise', 'thus'];

  var SUBORDINATORS = /\b(because|although|though|which|that|when|whenever|if|unless|while|since|so that|until|after|before|whereas|as|who|where|whether|even though|in order to)\b/i;

  var TEMPLATES = [
    'in this day and age', 'every coin has two sides', 'in a nutshell', 'it goes without saying', 'as everyone knows',
    'is a controversial topic', 'there is no doubt that', 'from my point of view i strongly believe', 'is a double-edged sword',
    'is a hot topic', 'since the dawn of time', 'as we all know', 'last but not least', 'in today\'s modern world',
    'with the development of society', 'plays an important role in our daily life', 'it is universally acknowledged',
    'every cloud has a silver lining', 'at the end of the day', 'as the saying goes', 'nowadays with the development of',
    'is a widely discussed topic', 'there are many advantages and disadvantages', 'people have different opinions about'
  ];

  var FILLERS = /\b(um+|uh+|erm+|er|hmm+|mmm+|ah+|you know|like like|i mean i mean|sort of sort of|kind of kind of)\b/gi;

  var MISSPELL = {
    wich: 'which', becuase: 'because', becouse: 'because', beacuse: 'because', becasue: 'because', thier: 'their', recieve: 'receive',
    enviroment: 'environment', enviorment: 'environment', goverment: 'government', diffrent: 'different', diferent: 'different',
    definately: 'definitely', definitly: 'definitely', occured: 'occurred', untill: 'until', alot: 'a lot', seperate: 'separate',
    tommorow: 'tomorrow', tomorow: 'tomorrow', begining: 'beginning', writting: 'writing', studing: 'studying', familly: 'family',
    freind: 'friend', frend: 'friend', beautifull: 'beautiful', beutiful: 'beautiful', peaple: 'people', poeple: 'people',
    importent: 'important', importnat: 'important', intresting: 'interesting', interesing: 'interesting', exersise: 'exercise',
    excercise: 'exercise', favourit: 'favourite', favorit: 'favorite', exemple: 'example', univercity: 'university',
    sucess: 'success', succes: 'success', sucessful: 'successful', buisness: 'business', bussiness: 'business', oppinion: 'opinion',
    developement: 'development', adress: 'address', accomodation: 'accommodation', acheive: 'achieve', achive: 'achieve',
    beleive: 'believe', belive: 'believe', truely: 'truly', realy: 'really', finaly: 'finally', usualy: 'usually',
    grammer: 'grammar', tecnology: 'technology', technolgy: 'technology', teachnology: 'technology', knowlege: 'knowledge',
    knowladge: 'knowledge', langauge: 'language', languge: 'language', exprience: 'experience', experiance: 'experience',
    comunication: 'communication', comittee: 'committee', neccessary: 'necessary', necesary: 'necessary', necessery: 'necessary',
    independant: 'independent', responsable: 'responsible', responsability: 'responsibility', oportunity: 'opportunity',
    opportunty: 'opportunity', libary: 'library', restaurent: 'restaurant', resturant: 'restaurant', vegetabels: 'vegetables',
    wether: 'whether', wheather: 'weather', coudl: 'could', shoud: 'should', woud: 'would', wich: 'which', thoght: 'thought',
    thru: 'through', thrugh: 'through', throught: 'through', proffesor: 'professor', profesor: 'professor', calender: 'calendar',
    embarassing: 'embarrassing', existance: 'existence', enviromental: 'environmental', goverments: 'governments',
    polution: 'pollution', populer: 'popular', prefered: 'preferred', priviledge: 'privilege', recomend: 'recommend',
    reccomend: 'recommend', rythm: 'rhythm', shedule: 'schedule', speach: 'speech', suprise: 'surprise', teh: 'the',
    tounge: 'tongue', wierd: 'weird', minite: 'minute', alway: 'always', allways: 'always', evrything: 'everything',
    everthing: 'everything', somthing: 'something', sometime: 'sometimes', infront: 'in front', alright: 'all right',
    everytime: 'every time', eachother: 'each other', incase: 'in case', aswell: 'as well', atleast: 'at least',
    nowdays: 'nowadays', nowaday: 'nowadays', becoming: 'becoming', comming: 'coming', runing: 'running', geting: 'getting',
    puting: 'putting', stoped: 'stopped', planing: 'planning', droped: 'dropped', shoping: 'shopping', swiming: 'swimming',
    traveled: 'travelled', hapened: 'happened', happend: 'happened', wanted: 'wanted', arguement: 'argument', judgement: 'judgment',
    persue: 'pursue', perpose: 'purpose', pourpose: 'purpose', questoin: 'question', qustion: 'question', mesage: 'message',
    collegue: 'colleague', colleage: 'colleague', maintainance: 'maintenance', mantain: 'maintain', concious: 'conscious',
    dissapoint: 'disappoint', dissapointed: 'disappointed', apparant: 'apparent', agressive: 'aggressive', amature: 'amateur',
    basicly: 'basically', catagory: 'category', cemetary: 'cemetery', collegue: 'colleague', dilemna: 'dilemma', discribe: 'describe',
    dicribe: 'describe', excelent: 'excellent', exagerate: 'exaggerate', fourty: 'forty', foriegn: 'foreign', forign: 'foreign',
    garantee: 'guarantee', guarentee: 'guarantee', harrass: 'harass', immediatly: 'immediately', imediately: 'immediately',
    lenght: 'length', liesure: 'leisure', lisence: 'license', millenium: 'millennium', mispell: 'misspell', noticable: 'noticeable',
    occassion: 'occasion', ocasion: 'occasion', occurence: 'occurrence', paralel: 'parallel', pavillion: 'pavilion',
    perseverence: 'perseverance', posession: 'possession', posible: 'possible', possable: 'possible', prefference: 'preference',
    publically: 'publicly', recieved: 'received', refered: 'referred', relevent: 'relevant', religous: 'religious', repitition: 'repetition',
    sacrafice: 'sacrifice', scedule: 'schedule', sieze: 'seize', similiar: 'similar', simmilar: 'similar', strenght: 'strength',
    supercede: 'supersede', tendancy: 'tendency', threshhold: 'threshold', truley: 'truly', unforseen: 'unforeseen',
    unfortunatly: 'unfortunately', vaccum: 'vacuum', vehical: 'vehicle', visable: 'visible', wellcome: 'welcome', whould: 'would',
    childern: 'children', childs: 'children', womens: 'women', mens: 'men', peoples: 'people', enough: 'enough', enogh: 'enough',
    enoug: 'enough', beacause: 'because', bcause: 'because', becaus: 'because', becuse: 'because', thnik: 'think', thik: 'think',
    thinking: 'thinking', ther: 'there', theyre: 'they\'re', dont: 'don\'t', doesnt: 'doesn\'t', didnt: 'didn\'t', cant: 'can\'t',
    wont: 'won\'t', isnt: 'isn\'t', im: 'I\'m', ive: 'I\'ve', youre: 'you\'re', thats: 'that\'s', whats: 'what\'s', lets: 'let\'s'
  };
  // remove entries that are actually valid words (kept above for readability of the source list)
  ['becoming', 'wanted', 'thinking', 'enough', 'sometime', 'traveled', 'judgement', 'alright', 'lets'].forEach(function (k) { delete MISSPELL[k]; });

  // Words that are correct but absent from an old frequency list, or that must never be spell-flagged.
  var SAFE_WORDS = new Set(('okay ok wifi app apps online offline email emails internet website websites smartphone smartphones selfie selfies ' +
    'covid youtube facebook instagram twitter tiktok snapchat whatsapp netflix google iphone ipad android laptop laptops tablet tablets ' +
    'riyadh jeddah makkah mecca madinah medina dammam saudi arabia ramadan eid hajj umrah abaya thobe kabsa halal souq majlis ' +
    'kebab kebabs shawarma falafel hummus biryani mandi jareesh karak oud iftar suhoor ' +
    'riyal riyals halala halalas dirham dirhams dinar dinars sar usd gonna wanna kinda lol tv pc cv usa uk uae gcc ai vr ar gps dvd cd id pm am').split(' '));

  /* ------------------------------------------------------------------ */
  /* Grammar rules  (precision over recall)                             */
  /* ------------------------------------------------------------------ */

  var V_BASE = 'go|eat|want|like|need|think|say|make|play|work|live|study|get|take|come|know|feel|look|give|use|help|watch|buy|talk|see|try|start|love|hate|enjoy|prefer|seem|stay|learn|write|drive|walk|run|sleep|cook|wear|speak|teach|visit|happen|rain|bring|tell|become|forget|remember|decide|understand|spend|open|close|call|send|wait|meet|leave|move|change|finish|believe|hope|mean|keep|hold|turn|show|hear|ask|pay|sell|lose|win|grow|fall|sit|stand|carry|wash|clean|draw|sing|dance|swim|read|listen';
  var AUX_BEFORE = '(?<!\\b(?:do|does|did|can|could|will|would|should|may|might|must|shall|to|that|than|let|lets|make|makes|made|help|helps|helped|see|saw|seen|watch|watched|hear|heard|have|has|had|is|was|are|were|be|been|and|or|nor|if|whether|lest)\\s)';

  var PAST_STRONG = 'went|came|ate|saw|took|gave|did|wrote|spoke|drove|ran|knew|began|became|forgot|drank|flew|grew|threw|drew|chose|broke|fell|rose|swam|sang|rang|woke|wore';
  var TIME_PAST = '(?:yesterday|last\\s+(?:night|week|month|year|summer|winter|weekend|time|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:\\d+|two|three|four|five|six|seven|eight|nine|ten|few|several|many)\\s+(?:years|months|weeks|days|hours|minutes)\\s+ago)';
  var TIME_PREFIX = '(?<!\\b(?:in|during|over|for|since|of|until|till|by|from)\\s+the\\s)(?<!\\b(?:since|until|till|from|than|as)\\s)';
  var V_PRES_AFTER_TIME = 'go|eat|see|buy|meet|visit|play|watch|come|take|get|make|give|do|say|tell|think|feel|find|leave|drive|write|sleep|wake|cook|sit|speak|run|walk|talk|work|study|start|finish|enjoy|decide|want|need|like|try|call|send|spend|lose|win|forget|learn|arrive|travel|stay|wear|help|clean|swim|dance|sing|open|close|move|begin|bring|drink|fly|grow|throw|draw|choose|break|fall|rise';

  // Each rule: id, re (must have g flag), type, weight, fix(m) -> string, ar
  var RULES = [
    // --- plural / countability ---
    { id: 'plural-uncount', re: /\b(peoples|informations|advices|childrens|mens|womens|furnitures|homeworks|equipments|knowledges|luggages|baggages|feedbacks|stuffs|softwares|musics|funs|traffics)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { var w = m[1].toLowerCase(); var map = { peoples: 'people', childrens: 'children', mens: 'men', womens: 'women', homeworks: 'homework' }; return map[w] || w.replace(/s$/, ''); },
      ar: 'هالكلمة ما لها جمع بـ s، تنكتب بدون s على طول' },
    { id: 'a-uncount', re: /\b(a|an)\s+(advice|information|furniture|equipment|news|homework|luggage|baggage|money|evidence|feedback|research|progress|traffic|weather|software|rubbish|garbage|stuff|music|fun|advertising|accommodation|transportation|pollution)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return 'some ' + m[2] + ' / a piece of ' + m[2]; }, ar: 'هالاسم ما يُعد، ما نحط قبله a/an — نقول some أو a piece of' },
    { id: 'much-count', re: /\bmuch\s+(people|students|friends|children|things|cars|books|jobs|problems|hours|days|years|times|countries|houses|women|men|kids|places|words|ideas|reasons|questions)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return 'many ' + m[1]; }, ar: 'مع الجمع نستخدم many مو much' },
    { id: 'less-count', re: /\bless\s+(people|students|friends|children|cars|books|jobs|problems|hours|days|years|countries|houses|women|men|kids|places|words|ideas|reasons|questions|accidents|mistakes)\b/gi, type: 'grammar', weight: 3,
      fix: function (m) { return 'fewer ' + m[1]; }, ar: 'مع الجمع الأصح fewer مو less' },
    { id: 'many-uncount', re: /\bmany\s+(information|advice|money|time|work|homework|furniture|traffic|research|knowledge|equipment|luggage|news|food|water|music|stuff|pollution|progress|evidence|help|fun)\b(?!\s+(?:a|an|the)\b)/gi, type: 'grammar', weight: 5,
      fix: function (m) { return 'much ' + m[1] + ' / a lot of ' + m[1]; }, ar: 'هالاسم ما يُعد، نستخدم much أو a lot of مو many' },
    { id: 'every-plural', re: /\b(every|each)\s+(days|weeks|months|years|times|mornings|nights|students|people)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return m[1] + ' ' + (m[2].toLowerCase() === 'people' ? 'person' : m[2].replace(/s$/, '')); }, ar: 'بعد every/each الاسم يجي مفرد: every day' },
    { id: 'this-plural', re: /\bthis\s+(things|people|days|problems|students|reasons|kinds|types|ways|cars|books|places|countries|years|times|ideas|issues|children|advantages|factors|skills|habits)\b/gi, type: 'grammar', weight: 4,
      fix: function (m) { return 'these ' + m[1]; }, ar: 'مع الجمع نقول these مو this' },
    { id: 'these-singular', re: /\bthese\s+(kind|type|thing|problem|day|way|reason|person|place|idea|issue|student|child|car|book|year|habit|skill|country)\b/gi, type: 'grammar', weight: 4,
      fix: function (m) { return 'this ' + m[1] + ' / these ' + m[1] + 's'; }, ar: 'these تجي مع جمع، والمفرد ياخذ this' },
    { id: 'one-of-singular', re: /\bone\s+of\s+(?:the|my|his|her|their|our|these|those)\s+((?:most\s+\w+\s+|best\s+|biggest\s+|greatest\s+|main\s+|important\s+|worst\s+|hardest\s+|easiest\s+)?)(reason|problem|thing|way|country|city|advantage|disadvantage|benefit|person|place|student|friend|challenge|issue|factor|cause|effect|solution|option|example|aspect|feature|job|skill|question|difference|goal|lesson|habit|activity|hobby|sport|game|food|animal|book|movie|subject|language|company|university|teacher|memory|moment|day)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { var n = m[2]; return 'one of the ' + (m[1] || '') + (/y$/.test(n) && !/[aeiou]y$/.test(n) ? n.slice(0, -1) + 'ies' : n + 's'); }, ar: 'بعد one of the الاسم لازم جمع: one of the reasons' },

    // --- subject–verb agreement ---
    { id: 'sva-3sg-base', re: new RegExp(AUX_BEFORE + '\\b(he|she|it)\\s+(' + V_BASE + ')\\b(?!-)', 'gi'), type: 'grammar', weight: 8,
      fix: function (m) { return m[1] + ' ' + thirdSg(m[2]); }, ar: 'بعد he/she/it الفعل في المضارع ياخذ s: he goes مو he go' },
    { id: 'sva-3sg-dont', re: /\b(he|she|it)\s+(don't|dont|do\s+not)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + " doesn't"; }, ar: 'مع he/she/it النفي يكون doesn\'t مو don\'t' },
    { id: 'sva-pl-is', re: /(?<!\b(?:of|among|between)\s)\b(they|we|you|these|those)\s+(is|was|has|goes|does|doesn't|wasn't|isn't)\b/gi, type: 'grammar', weight: 8,
      fix: function (m) { var v = m[2].toLowerCase(); var map = { is: 'are', was: 'were', has: 'have', goes: 'go', does: 'do', "doesn't": "don't", "wasn't": "weren't", "isn't": "aren't" }; return m[1] + ' ' + map[v]; }, ar: 'مع they/we/you الفعل جمع: they are / they were / they have' },
    { id: 'sva-i', re: /\bI\s+(is|are|has|goes|does|doesn't|wasn't)\b/g, type: 'grammar', weight: 8,
      fix: function (m) { var map = { is: 'am', are: 'am', has: 'have', goes: 'go', does: 'do', "doesn't": "don't", "wasn't": "wasn't" }; return 'I ' + (map[m[1].toLowerCase()] || m[1]); }, ar: 'مع I نقول am / have / go / do' },
    { id: 'sva-quant-plural', re: /\b(a lot of|lots of|many|most|several|few|a few|some|both|all|these|those)\s+(people|students|children|men|women|friends|things|countries|families|parents|workers|employees|companies|cars|houses|animals|teachers|kids|boys|girls|persons|cities|schools)\s+(is|was|has|goes|does|doesn't|likes|wants|needs|thinks|lives|works|prefers|believes|says)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { var map = { is: 'are', was: 'were', has: 'have', goes: 'go', does: 'do', "doesn't": "don't" }; var v = m[3].toLowerCase(); return m[1] + ' ' + m[2] + ' ' + (map[v] || v.replace(/s$/, '')); }, ar: 'الفاعل جمع (a lot of people) فالفعل جمع: a lot of people are' },
    { id: 'sva-people', re: /(?<!\b(?:number|amount|percentage|percent|majority|group|one|each|none|kind|type|sort|half|quarter|third|rest|proportion|population|variety|range|category|class|part|generation|crowd)\s+of\s)\b(people|children|men|women|police)\s+(is|was|has|goes|does|doesn't|wasn't|isn't)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { var map = { is: 'are', was: 'were', has: 'have', goes: 'go', does: 'do', "doesn't": "don't", "wasn't": "weren't", "isn't": "aren't" }; return m[1] + ' ' + map[m[2].toLowerCase()]; }, ar: 'people/children/men/women جمع، فالفعل جمع: people are' },
    { id: 'sva-who', re: /\b(people|those|students|children|friends|parents|teachers)\s+who\s+(is|was|has|doesn't|goes|does|likes|wants|lives|works|thinks|needs)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { var map = { is: 'are', was: 'were', has: 'have', "doesn't": "don't", goes: 'go', does: 'do' }; var v = m[2].toLowerCase(); return m[1] + ' who ' + (map[v] || v.replace(/s$/, '')); }, ar: 'who هنا ترجع لجمع، فالفعل جمع: people who are' },
    { id: 'sva-indef', re: /(?<!\b(?:do|does|did|would|could|can|will|should|might|must|may|help|let|make|made|see|hear|watch)\s)\b(everyone|everybody|someone|somebody|nobody|no one|anyone|anybody)\s+(are|have|were|go|do|like|want|need|think|know|say|live|work)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { var map = { are: 'is', have: 'has', were: 'was' }; var v = m[2].toLowerCase(); return m[1] + ' ' + (map[v] || thirdSg(v)); }, ar: 'everyone/someone/nobody مفرد نحوياً: everyone is / everyone has' },
    { id: 'there-is-plural', re: /\bthere\s+(is|was)\s+(many|several|two|three|four|five|six|seven|eight|nine|ten|some|a few|few|lots of|a lot of|so many|too many)\s+(?!(?:news|lots|class|glass|bus|process|progress|success|business|stress|address|mass|gas|kindness|happiness|access|series|species|analysis|basis|crisis|means|status|focus|chaos|plus|this|those)\b)(people|children|men|women|[a-z]+s)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { return 'there ' + (m[1].toLowerCase() === 'is' ? 'are' : 'were') + ' ' + m[2] + ' ' + m[3]; }, ar: 'بعدها جمع، فنقول there are / there were' },
    { id: 'there-are-singular', re: /\bthere\s+are\s+(a|an)\s+(?!(?:lot|few|number|couple|great|wide|variety|range|series|bunch|large|small|huge|big|total|handful|host|multitude|plethora|myriad|dozen|hundred|thousand|million|good|whole|significant|growing|increasing|considerable|substantial|vast|lack|shortage|mix|selection|lots|maximum|minimum)\b)([a-z]+)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return 'there is ' + m[1] + ' ' + m[2]; }, ar: 'بعدها مفرد (a/an) فنقول there is' },

    // --- verb forms ---
    { id: 'be-agree', re: /\b(I'm|I am|he's|she's|we're|they're|you're|am|is|are|was|were)\s+(not\s+)?(agree|disagree)\b/gi, type: 'grammar', weight: 8,
      fix: function (m) { var s = m[1].replace(/\s*(am|is|are|was|were|'m|'s|'re)$/i, '').trim(); if (/^i$/i.test(s)) s = 'I'; return (s ? s + ' ' : '') + (m[2] ? "don't " : '') + m[3].toLowerCase(); }, ar: 'agree فعل مو صفة: نقول I agree مو I am agree' },
    { id: 'very-verb', re: /\b(I|we|they|you|he|she|people)\s+very\s+(like|love|enjoy|want|need|appreciate|recommend|hope)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { return m[1] + ' really ' + m[2]; }, ar: 'very ما تجي قبل فعل، نقول really like أو like very much' },
    { id: 'be-base-verb', re: /\b(am|is|are)\s+(not\s+)?(go|eat|want|think|live|make|do|take|come|know|get|say|see|try|learn|write|buy|cook|watch|feel|give|speak|visit|enjoy|prefer|stay|wear|meet|send|wait|teach|bring|tell|become|forget|remember|decide|happen|understand|study|agree|believe|hope|spend)\b(?!-)/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + ' ' + (m[2] ? 'not ' : '') + ing(m[3]) + ' / ' + (m[2] ? "don't " : '') + m[3]; }, ar: 'بعد am/is/are الفعل ياخذ ing أو نشيل الـ be: I am going أو I go' },
    { id: 'be-past-simple', re: new RegExp('\\b(am|is|are|was|were)\\s+(' + PAST_STRONG + ')\\b', 'gi'), type: 'grammar', weight: 7,
      fix: function (m) { return m[2]; }, ar: 'ما نحط am/is/was قبل الماضي البسيط: I went مو I was went' },
    { id: 'have-past-simple', re: new RegExp('\\b(have|has|had|having)\\s+(' + PAST_STRONG + ')\\b', 'gi'), type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + ' ' + participle(m[2]); }, ar: 'بعد have/has/had نحتاج التصريف الثالث: have gone مو have went' },
    { id: 'did-past', re: new RegExp('\\b(did|didn\'t)\\s+(you|he|she|it|they|we|i)\\s+(' + PAST_STRONG + '|got|had|made|bought|said|told|thought|found|felt|left|met|slept|lost|paid|sent|spent|understood|won|worked|played|studied|visited|watched|wanted|liked|needed|enjoyed|talked|walked|started|finished|helped|cooked|lived|learned|stayed|tried|used|asked|called|looked|listened|moved|loved|decided)\\b', 'gi'), type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + ' ' + m[2] + ' ' + baseOf(m[3]); }, ar: 'بعد did الفعل يرجع للمصدر: did you go مو did you went' },
    { id: 'do-not-3rd', re: /\b(didn't|did not|doesn't|does not|don't|do not|didnt|doesnt|dont)\s+(went|had|was|were|got|made|took|came|saw|said|knew|thought|wanted|liked|needed|played|worked|studied|watched|visited|helped|started|finished|goes|has|wants|likes|needs|makes|takes|gives|says|comes|gets|knows|thinks|works|plays|lives|studies|eats|helps|uses|tries|starts)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + ' ' + baseOf(m[2]); }, ar: 'بعد don\'t/doesn\'t/didn\'t الفعل مصدر بدون s وبدون ماضي' },
    { id: 'modal-to', re: /(?<!\b(?:the|his|her|my|their|our|a|strong|free|political|good|own|its|your)\s)\b(can|could|will|would|should|must|might)\s+to\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[1]; }, ar: 'بعد can/should/will ما نحط to: I can go' },
    { id: 'modal-s', re: /\b(can|could|will|would|should|must|might)\s+(goes|went|has|does|did|wants|likes|needs|makes|takes|gives|says|comes|gets|knows|thinks|works|plays|lives|studies|eats|helps|uses|tries|starts|enjoyed|played|worked|wanted|liked|needed|visited|studied|helped|started|finished|learned|watched|talked|walked|looked|stayed|cooked)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + ' ' + baseOf(m[2]); }, ar: 'بعد can/should/will الفعل مصدر: she can go' },
    { id: 'double-modal', re: /\b(will|would|can|could|should|must|might)\s+(can|could|will|would|should|must|might)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { var m2 = m[2].toLowerCase(); return m[1] + ' be able to'.replace('be able to', m2 === 'can' || m2 === 'could' ? 'be able to' : 'have to'); }, ar: 'ما نجمع فعلين ناقصين: will be able to مو will can' },
    { id: 'modal-of', re: /\b(should|could|would|must|might)\s+of\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return m[1] + ' have'; }, ar: 'الصح should have مو should of' },
    { id: 'to-past', re: /\bto\s+(went|was|were|got|took|came|saw|said|knew|thought|wanted|liked|needed|played|watched|visited|helped|bought|did|had)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return 'to ' + baseOf(m[1]); }, ar: 'بعد to الفعل مصدر: to go مو to went' },
    { id: 'past-adverb-present', re: new RegExp(TIME_PREFIX + '\\b' + TIME_PAST + '\\s*,?\\s+(I|we|they|he|she|you)\\s+(' + V_PRES_AFTER_TIME + ')\\b', 'gi'), type: 'grammar', weight: 8,
      fix: function (m) { return m[0].replace(new RegExp('\\b' + m[2] + '$'), pastOf(m[2])); }, ar: 'الجملة عن الماضي (yesterday / last week) فالفعل لازم ماضي: went مو go' },
    { id: 'present-past-adverb', re: new RegExp('(?<!\\b(?:since|until|from|than|as|of|in|during|for|by|before|after|till|to)\\s)\\b(I|we|they|he|she|you)\\s+(go|eat|see|buy|meet|visit|play|watch|come|take|make|give|do|find|leave|drive|write|sleep|cook|speak|run|walk|talk|work|study|start|finish|enjoy|decide|try|call|send|spend|lose|win|arrive|travel|stay|wear|help|clean|swim|dance|sing|open|close|move|begin|bring|drink|fly|grow|throw|draw|choose|break|fall)(?:\\s+(?!(?:that|which|who|i|he|she|they|we|you|it|and|but|or|because|since|until|when|if|so)\\b)[a-z\']+){0,3}\\s+(yesterday|last\\s+(?:night|week|month|year|summer|winter|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\\b', 'gi'), type: 'grammar', weight: 8,
      fix: function (m) { return m[0].replace(new RegExp('^' + m[1] + '\\s+' + m[2]), m[1] + ' ' + pastOf(m[2])); }, ar: 'فيه yesterday / last week فالفعل لازم يكون ماضي' },
    { id: 'past-adverb-be', re: new RegExp(TIME_PREFIX + '\\b' + TIME_PAST + '\\s*,?\\s+(?:(I|he|she|it)\\s+(am|is)|(we|they|you)\\s+(are))\\b', 'gi'), type: 'grammar', weight: 7,
      fix: function (m) { return m[1] ? m[1] + ' was' : m[3] + ' were'; }, ar: 'الحدث في الماضي فنستخدم was/were مو am/is/are' },
    { id: 'since-for', re: /\bsince\s+(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|twenty|several|many|few|a few|some)\s+(years?|months?|weeks?|days?|hours?|minutes?|decades?|centuries)\b(?!\s+ago)/gi, type: 'grammar', weight: 7,
      fix: function (m) { return 'for ' + m[1] + ' ' + m[2]; }, ar: 'مع المدة نقول for: for 3 years — و since تجي مع نقطة بداية (since 2020)' },
    { id: 'look-forward', re: /\blook(s|ed|ing)?\s+forward\s+to\s+(see|meet|hear|work|visit|go|be|start|join|learn|receive|get|have|do|talk|speak|travel)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return 'look' + (m[1] || '') + ' forward to ' + ing(m[2]); }, ar: 'بعد look forward to الفعل ياخذ ing: looking forward to seeing' },
    { id: 'enjoy-to', re: /\b(enjoy|enjoys|enjoyed|avoid|avoids|avoided|finish|finished)\s+to\s+(go|do|make|be|have|eat|play|watch|read|write|study|learn|work|travel|visit|swim|cook|talk|speak|listen|buy|use|see|meet|drive|walk|run|sit|help|get|take|spend|stay|live|drink|sing|dance|shop|exercise|relax|sleep|say|tell|think|feel|come|start|open|close|clean|draw|paint|teach|wait|pay|lose|win|hear|answer|ask|call|send|bring)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return m[1] + ' ' + ing(m[2]); }, ar: 'بعد enjoy/avoid/finish الفعل ياخذ ing: enjoy playing' },
    { id: 'want-to-ing', re: /\b(want|wants|wanted|need|needs|needed|would like|decide|decided|hope|hoped|plan|planned|try|tried|learn|learned)\s+to\s+(?!(?:bring|sing|ring|swing|string|spring|cling|fling|sting|wring|ding|ping|king|thing|wing|zing|sling|bing|ting|ing|nothing|anything|something|everything|evening|morning|building|meeting|wedding|shopping|parking|clothing|ceiling|feeling|training|housing|reading|writing|beginning|ending|opening|painting|drawing|swimming|cooking|hiking|camping)\b)([a-z]+ing)\b/gi, type: 'grammar', weight: 4,
      fix: function (m) { return m[1] + ' to ' + baseOf(m[2]); }, ar: 'بعد to الفعل مصدر بدون ing: want to go' },
    { id: 'used-to-ing', re: /\b(I|we|they|he|she|you)\s+used\s+to\s+(?!(?:bring|sing|ring|swing|string|spring|thing|king|wing|nothing|anything|something|everything)\b)([a-z]+ing)\b/gi, type: 'grammar', weight: 4,
      fix: function (m) { return m[1] + ' used to ' + baseOf(m[2]); }, ar: 'used to (كنت أسوي) بعدها مصدر: I used to swim — أما be used to فبعدها ing' },
    { id: 'let-me-to', re: /\b(let|lets|made|make|makes)\s+(me|him|her|us|them|you)\s+to\s+([a-z]+)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { return m[1] + ' ' + m[2] + ' ' + m[3]; }, ar: 'بعد let/make + شخص ما نحط to: let me go' },
    { id: 'can-able', re: /\b(can|could|cannot|can't|couldn't)\s+(not\s+)?(be\s+)?able\b/gi, type: 'grammar', weight: 4,
      fix: function (m) { return (m[1].toLowerCase().indexOf('not') >= 0 || /n't/.test(m[1]) || m[2]) ? "am not able / can't" : 'am able / can'; }, ar: 'can و able نفس المعنى، نختار وحدة بس' },
    { id: 'spend-to', re: /\bsp(end|ends|ent|ending)\s+(time|hours|hour|day|days|the day|the whole day|my time)\s+to\s+([a-z]+)\b/gi, type: 'grammar', weight: 3,
      fix: function (m) { return 'sp' + m[1] + ' ' + m[2] + ' ' + ing(m[3]); }, ar: 'بعد spend time الفعل ياخذ ing: spend time studying' },

    // --- comparatives / negation / subjects ---
    { id: 'double-comp', re: /\b(more|most)\s+(better|best|worse|worst|easier|easiest|harder|hardest|bigger|biggest|smaller|smallest|faster|fastest|cheaper|cheapest|higher|highest|lower|lowest|stronger|strongest|happier|happiest|healthier|healthiest|safer|safest|older|oldest|younger|youngest|richer|richest|larger|largest|longer|longest|shorter|shortest|greater|greatest|nicer|nicest|earlier|earliest|prettier|funnier|busier|closer|quieter|hotter|colder|warmer|cooler|taller|smarter|cleaner|dirtier|louder|slower|newer|weaker|deeper|wider|simpler)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[2]; }, ar: 'ما نجمع more مع er: نقول better أو easier بدون more' },
    { id: 'double-neg', re: /\b(don't|doesn't|didn't|can't|couldn't|won't|wouldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|dont|doesnt|didnt|cant|never)\s+(?:[a-z]+\s+){0,2}?(nothing|nobody|no one|nowhere|none)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { var map = { nothing: 'anything', nobody: 'anybody', 'no one': 'anyone', nowhere: 'anywhere', none: 'any' }; return m[0].replace(/(nothing|nobody|no one|nowhere|none)$/i, map[m[2].toLowerCase()]); }, ar: 'نفي مرتين غلط بالإنجليزي: don\'t have anything مو don\'t have nothing' },
    { id: 'double-neg-no', re: /\b(don't|doesn't|didn't|can't|couldn't|won't|wouldn't|haven't|hasn't|dont|doesnt|didnt|cant)\s+(?:[a-z]+\s+){0,2}?no\s+(money|time|idea|friends|problem|problems|one|thing|way|reason|choice|job|food|work|experience|chance|car|house|family|children|kids)\b/gi, type: 'grammar', weight: 6,
      fix: function (m) { return m[0].replace(/\bno\b/i, 'any'); }, ar: 'نفي مرتين: بعد don\'t نقول any مو no' },
    { id: 'double-subject', re: /\b(my|our|his|her|their|your)\s+(father|mother|brother|sister|friend|friends|teacher|husband|wife|son|daughter|uncle|aunt|cousin|family|parents|boss|manager|neighbor|neighbour|grandfather|grandmother|dad|mom|mum|colleague|roommate|classmate|country|city)\s+(he|she|they|it)\s+(is|was|are|were|has|have|had|can|will|would|go|goes|went|do|does|did|like|likes|want|wants|work|works|live|lives|think|thinks|say|says|said|always|never|usually|often|told|gave|came|loves|love|doesn't|don't)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + ' ' + m[2] + ' ' + m[4]; }, ar: 'فاعل مكرر: my father he is — نشيل الضمير ونقول my father is' },
    { id: 'double-subject-people', re: /(^|[.!?]\s+)(some|many|most|the|those|these|all|young|old|a lot of)\s+(people|students|children|teachers|parents|kids|workers|employees|young people|old people|men|women)\s+they\s+(are|were|don't|always|never|usually|also|think|say|believe|prefer|like|want|need|can|will|should|must|go|do)\b/gi, type: 'grammar', weight: 7,
      fix: function (m) { return m[1] + m[2] + ' ' + m[3] + ' ' + m[4]; }, ar: 'فاعل مكرر: some people they think — نشيل they' },
    { id: 'i-and-my', re: /\bI\s+and\s+(my|his|her|our|their)\s+([a-z]+)\b/g, type: 'grammar', weight: 3,
      fix: function (m) { return m[1] + ' ' + m[2] + ' and I'; }, ar: 'بالإنجليزي نأخر I: my friend and I' },

    // --- articles ---
    { id: 'a-vowel', re: /\ba\s+(?!(?:one|once|ones|onetime|uni(?=[tqvfcso])|use|used|user|users|useful|usual|usually|using|usage|utensil|utility|utopia|euro|european|eulogy|eucalyptus|ewe|unanimous|unicorn|unit|united|union|universe|university|universal|unique|uniform|uranium|urine|utilise|utilize|urinal)\b)([aeio][a-z]+|u(?:n(?![i])[a-z]+|ni(?![tqvfcso])[a-z]+|mb[a-z]*|p[a-z]+|g[a-z]+|l[a-z]+|rg[a-z]+)|hour|hours|honest|honor|honour|honorable|honourable|heir|heiress|herb)\b/gi, type: 'article', weight: 5,
      fix: function (m) { return 'an ' + m[1]; }, ar: 'قبل صوت الحرف المتحرك (a, e, i, o, u الصوتية) نستخدم an: an apple, an hour' },
    { id: 'an-consonant', re: /\b[Aa]n\s+((?![aeiou]|hour|honest|honor|honour|heir|herb)[a-z][a-z]*|uni(?=[tqvfcso])[a-z]*|use[a-z]*|usual[a-z]*|user[a-z]*|utensil[a-z]*|utilit[a-z]*|utopia[a-z]*|euro[a-z]*|eulog[a-z]*|ewe|one|once|unanimous|uranium|urine|urinal)\b/g, type: 'article', weight: 5,
      fix: function (m) { return 'a ' + m[1]; }, ar: 'قبل صوت ساكن نستخدم a مو an: a book, a university (صوتها yu)' },
    { id: 'most-of-noun', re: /\b(most|some|many|all|few)\s+of\s+(people|students|children|men|women|countries|companies|teachers|parents|families|things|cities|friends|time)\b/gi, type: 'article', weight: 4,
      fix: function (m) { return m[1] + ' ' + m[2] + ' / ' + m[1] + ' of the ' + m[2]; }, ar: 'إما most people أو most of the people — لازم the بعد of' },
    { id: 'the-most-of', re: /\bthe\s+most\s+of\s+(the|people|them|us|students)\b/gi, type: 'article', weight: 4,
      fix: function (m) { return 'most of ' + m[1]; }, ar: 'نقول most of the… بدون the قبل most' },

    // --- prepositions ---
    { id: 'depend-of', re: /\bdepend(s|ed|ing)?\s+(of|in|from)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'depend' + (m[1] || '') + ' on'; }, ar: 'depend تجي مع on: depends on' },
    { id: 'discuss-about', re: /\bdiscuss(es|ed|ing)?\s+about\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'discuss' + (m[1] || ''); }, ar: 'discuss ما تحتاج about: discuss the problem' },
    { id: 'explain-me', re: /\b(explain|explains|explained|suggest|suggested|describe|described)\s+(me|us|you)\b/gi, type: 'grammar', weight: 6, fix: function (m) { return m[1] + ' to ' + m[2]; }, ar: 'explain تحتاج to قبل الشخص: explain to me' },
    { id: 'married-with', re: /\b(married|marry|marries|marrying)\s+with\b(?!\s+(?:children|kids|a\s+child|no\s+children|two|three|four|\d))/gi, type: 'grammar', weight: 5, fix: function (m) { return m[1] + ' to'; }, ar: 'married تجي مع to: married to' },
    { id: 'listen-no-to', re: /\blisten(s|ed|ing)?\s+(music|songs?|radio|podcasts?|the|him|her|them|me|us|it|this|that|my|your|his|their|our|a|an|what)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'listen' + (m[1] || '') + ' to ' + m[2]; }, ar: 'listen تجي مع to: listen to music' },
    { id: 'enter-to', re: /\benter(s|ed|ing)?\s+to\s+(the|a|an|my|our|his|her|their|university|college|school|room|class)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'enter' + (m[1] || '') + ' ' + m[2]; }, ar: 'enter ما تحتاج to: enter the room' },
    { id: 'arrive-to', re: /\barriv(e|es|ed|ing)\s+to\s+(the|a|an|my|our|his|her|their|home|school|work|riyadh|jeddah|london|paris|dubai|there|here)\b/gi, type: 'grammar', weight: 5, fix: function (m) { var p = m[2].toLowerCase(); return 'arriv' + m[1] + ' ' + (p === 'home' || p === 'there' || p === 'here' ? m[2] : (/^(the|a|an|my|our|his|her|their)$/.test(p) ? 'at ' + m[2] : 'in ' + m[2])); }, ar: 'arrive تجي مع at (مكان) أو in (مدينة) — مو to' },
    { id: 'reach-to', re: /\breach(es|ed|ing)?\s+to\s+(the|a|an|my|our|his|her|their)\b/gi, type: 'grammar', weight: 4, fix: function (m) { return 'reach' + (m[1] || '') + ' ' + m[2]; }, ar: 'reach ما تحتاج to: reach the top' },
    { id: 'go-to-home', re: /\b(go|goes|went|going|come|came|comes|coming|get|got|arrive|arrived|return|returned|back)\s+to\s+(home|there|here|abroad|downtown|downstairs|upstairs|somewhere|everywhere|nowhere|anywhere|inside|outside)\b(?!\s+page)/gi, type: 'grammar', weight: 5, fix: function (m) { return m[1] + ' ' + m[2]; }, ar: 'مع home/there/here ما نحط to: go home' },
    { id: 'go-to-shopping', re: /\b(go|goes|went|going)\s+to\s+(shopping|swimming|fishing|jogging|camping|hiking|running|walking|skiing|sightseeing)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return m[1] + ' ' + m[2]; }, ar: 'نقول go shopping / go swimming بدون to' },
    { id: 'in-day', re: /\bin\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'on ' + m[1]; }, ar: 'مع أيام الأسبوع نستخدم on: on Monday' },
    { id: 'on-at-year', re: /\b(on|at)\s+((?:19|20)\d\d)\b(?!\s*(?:[-\/:]|m\b|meters|metres|feet|km|dollars|riyals|people|words|pm|am))/gi, type: 'grammar', weight: 5, fix: function (m) { return 'in ' + m[2]; }, ar: 'مع السنة نستخدم in: in 2020' },
    { id: 'in-clock', re: /\bin\s+(\d{1,2}(?::\d\d)?)\s*(am|pm|o'clock)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'at ' + m[1] + ' ' + m[2]; }, ar: 'مع الساعة نستخدم at: at 5 pm' },
    { id: 'at-morning', re: /\b(at|on)\s+the\s+(morning|afternoon|evening)\b(?!\s+of)/gi, type: 'grammar', weight: 5, fix: function (m) { return 'in the ' + m[2]; }, ar: 'نقول in the morning / in the evening — و at night' },
    { id: 'in-night', re: /\bin\s+(night|noon|midnight)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'at ' + m[1]; }, ar: 'نقول at night / at noon' },
    { id: 'in-weekend', re: /\bin\s+(the\s+)?weekends?\b/gi, type: 'grammar', weight: 4, fix: function (m) { return 'on the weekend / at the weekend'; }, ar: 'مع الويكند نقول on/at the weekend مو in' },
    { id: 'on-month', re: /\bon\s+(january|february|march|april|june|july|august|september|october|november|december)\b(?!\s+\d)/gi, type: 'grammar', weight: 5, fix: function (m) { return 'in ' + m[1]; }, ar: 'مع الشهر نستخدم in: in January (و on مع التاريخ الكامل)' },
    { id: 'prep-today', re: /\b(in|on|at)\s+(yesterday|tomorrow|today|tonight|nowadays)\b(?!'s)/gi, type: 'grammar', weight: 5, fix: function (m) { return m[2]; }, ar: 'today/yesterday/tomorrow تجي بدون حرف جر' },
    { id: 'prep-next-last', re: /\b(in|on|at)\s+(next|last)\s+(week|month|year|summer|winter|weekend|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, type: 'grammar', weight: 4, fix: function (m) { return m[2] + ' ' + m[3]; }, ar: 'next week / last week تجي بدون حرف جر' },
    { id: 'in-the-last-night', re: /\bin\s+the\s+last\s+night\b/gi, type: 'grammar', weight: 4, fix: function () { return 'last night'; }, ar: 'نقول last night بدون in the' },
    { id: 'in-this-morning', re: /\bin\s+(this|that)\s+(morning|afternoon|evening|night|weekend)\b/gi, type: 'grammar', weight: 4, fix: function (m) { return m[1] + ' ' + m[2]; }, ar: 'this morning تجي بدون in' },
    { id: 'in-internet', re: /\b(in|at)\s+the\s+(internet|tv|television)\b/gi, type: 'grammar', weight: 4, fix: function (m) { return 'on ' + (m[2].toLowerCase() === 'internet' ? 'the internet' : 'TV'); }, ar: 'نقول on the internet و on TV' },
    { id: 'despite-of', re: /\bdespite\s+of\b/gi, type: 'grammar', weight: 5, fix: function () { return 'despite / in spite of'; }, ar: 'despite ما تجي معها of — إما despite أو in spite of' },
    { id: 'although-but', re: /\b(although|though|even though|while|despite)\b[^.!?,]*,\s*but\b/gi, type: 'grammar', weight: 5, fix: function (m) { return m[0].replace(/,\s*but$/i, ','); }, ar: 'ما نستخدم although و but بنفس الجملة، وحدة تكفي' },
    { id: 'because-of-clause', re: /\bbecause\s+of\s+(I|we|they|he|she|it|you|there)\s+(am|is|are|was|were|have|has|had|do|did|can|could|will|would|want|like|need|think|go|went)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'because ' + m[1] + ' ' + m[2]; }, ar: 'because of بعدها اسم بس — إذا بعدها جملة نقول because' },
    { id: 'other-hand', re: /\b(in|at)\s+(the\s+)?other\s+hand\b/gi, type: 'grammar', weight: 4, fix: function () { return 'on the other hand'; }, ar: 'التعبير الصحيح on the other hand' },
    { id: 'according-me', re: /\baccording\s+to\s+(me|my opinion)\b/gi, type: 'grammar', weight: 4, fix: function () { return 'in my opinion'; }, ar: 'ما نقول according to me — نقول in my opinion' },
    { id: 'same-like', re: /\bthe\s+same\s+like\b/gi, type: 'grammar', weight: 4, fix: function () { return 'the same as'; }, ar: 'the same تجي مع as' },
    { id: 'similar-with', re: /\bsimilar\s+with\b/gi, type: 'grammar', weight: 4, fix: function () { return 'similar to'; }, ar: 'similar تجي مع to' },
    { id: 'interested-on', re: /\binterested\s+(on|for|about|with)\b/gi, type: 'grammar', weight: 4, fix: function () { return 'interested in'; }, ar: 'interested تجي مع in' },
    { id: 'interesting-in', re: /\b(am|is|are|was|were|I'm|he's|she's)\s+(very\s+|so\s+|really\s+)?interesting\s+(in|on|about)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return m[1] + ' ' + (m[2] || '') + 'interested in'; }, ar: 'الشخص يكون interested (مهتم) — interesting معناها ممتع' },
    { id: 'good-in', re: /\b(good|bad|great|excellent|terrible)\s+in\s+(english|math|maths|sports?|football|cooking|drawing|singing|playing|swimming|speaking|writing|reading|science|languages|art|driving)\b/gi, type: 'grammar', weight: 4, fix: function (m) { return m[1] + ' at ' + m[2]; }, ar: 'good at مو good in' },
    { id: 'afraid-from', re: /\b(afraid|scared|frightened)\s+from\b/gi, type: 'grammar', weight: 4, fix: function (m) { return m[1] + ' of'; }, ar: 'afraid تجي مع of' },
    { id: 'responsible-of', re: /\bresponsible\s+(of|about)\b/gi, type: 'grammar', weight: 4, fix: function () { return 'responsible for'; }, ar: 'responsible تجي مع for' },
    { id: 'consist-from', re: /\bconsist(s|ed|ing)?\s+from\b/gi, type: 'grammar', weight: 4, fix: function (m) { return 'consist' + (m[1] || '') + ' of'; }, ar: 'consist تجي مع of' },
    { id: 'search-about', re: /\bsearch(es|ed|ing)?\s+about\b/gi, type: 'grammar', weight: 4, fix: function (m) { return 'search' + (m[1] || '') + ' for'; }, ar: 'search تجي مع for' },
    { id: 'ask-to', re: /\bask(s|ed|ing)?\s+to\s+(him|her|me|them|us|you|my|the)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'ask' + (m[1] || '') + ' ' + m[2]; }, ar: 'ask بعدها الشخص مباشرة: ask him' },
    { id: 'tell-to', re: /\btell(s|ing)?\s+to\s+(him|her|me|them|us|you)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return 'tell' + (m[1] || '') + ' ' + m[2]; }, ar: 'tell بعدها الشخص مباشرة: tell me' },
    { id: 'said-me', re: /\bsa(id|ys|y)\s+(me|us)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return (m[1] === 'id' ? 'told' : m[1] === 'ys' ? 'tells' : 'tell') + ' ' + m[2]; }, ar: 'say ما ياخذ مفعول شخص مباشر — نقول told me أو said to me' },
    { id: 'told-that', re: /(?<!\b(?:was|were|been|be|is|are|am|get|got|gets|getting|can|could|to|hard|easy|difficult|possible|impossible|cannot|can't|couldn't|always|never|not|just|really)\s)\b(told|tells|tell|telling)\s+that\b/gi, type: 'grammar', weight: 4, fix: function (m) { return m[1] + ' me/him that'; }, ar: 'tell لازم بعدها شخص: told me that' },
    { id: 'make-do', re: /\b(make|makes|made|making)\s+(my|the|some|his|her|their|our|a|an)?\s*(homework|exercise|exercises|sport|sports|research|shopping|photo|photos|picture|pictures|party|test|exam|mistake)\b/gi, type: 'grammar', weight: 5,
      fix: function (m) { var n = m[3].toLowerCase(); var v = /^(photo|photos|picture|pictures)$/.test(n) ? 'take' : /^(party)$/.test(n) ? 'have' : /^(shopping)$/.test(n) ? 'go' : /^(mistake)$/.test(n) ? 'make' : 'do'; if (v === 'make') return m[0]; return v + ' ' + (m[2] ? m[2] + ' ' : '') + m[3]; }, ar: 'تركيب كلمات: do homework / take a photo / go shopping — مو make' },
    { id: 'do-make', re: /\b(do|does|did|doing)\s+(a|many|some|the same|lots of|a lot of|no|several)\s+(mistake|mistakes|decision|decisions|effort|efforts|money|noise|friends|progress|plan|plans)\b/gi, type: 'grammar', weight: 5, fix: function (m) { return ({ do: 'make', does: 'makes', did: 'made', doing: 'making' })[m[1].toLowerCase()] + ' ' + m[2] + ' ' + m[3]; }, ar: 'تركيب كلمات: make a mistake / make a decision — مو do' },
    { id: 'age-have', re: /\b(I|he|she|you|they|we)\s+(have|has|had)\s+(\d{1,2}|twenty|thirty|forty|fifty|sixty|eighteen|nineteen|fifteen|sixteen|seventeen|twenty[- ](?:one|two|three|four|five|six|seven|eight|nine))\s+years?\s*(old\b|[.,!?]|$)/gi, type: 'grammar', weight: 6,
      fix: function (m) { var be = { I: 'am', he: 'is', she: 'is', you: 'are', they: 'are', we: 'are' }[m[1]] || 'am'; return m[1] + ' ' + be + ' ' + m[3] + ' years old'; }, ar: 'العمر بالإنجليزي مع be: I am 20 years old مو I have' },
    { id: 'everyday-adv', re: /\b(go|goes|went|come|comes|do|does|work|works|study|studies|play|plays|eat|eats|exercise|exercises|practice|practices|read|reads|train|trains|drink|drinks|use|uses|walk|walks|run|runs|it|him|them|there|here|school|work|gym|coffee)\s+everyday\b/gi, type: 'grammar', weight: 3, fix: function (m) { return m[1] + ' every day'; }, ar: 'كظرف زمن تنكتب كلمتين: every day — everyday صفة (everyday life)' },
    { id: 'then-than', re: /\b(more|better|bigger|smaller|less|rather|other|higher|lower|easier|harder|faster|cheaper|older|younger|greater|worse|larger|longer|shorter|stronger)\s+then\b/gi, type: 'grammar', weight: 4, fix: function (m) { return m[1] + ' than'; }, ar: 'للمقارنة نستخدم than مو then' },
    { id: 'its-its', re: /\bits\s+(a|an|the|not|been|because|my|our|your|going|so)\b(?!-)/gi, type: 'mechanics', weight: 3, fix: function (m) { return "it's " + m[1]; }, ar: 'هنا المقصود it is فتنكتب it\'s بالفاصلة العليا' },
    { id: 'your-youre', re: /\byour\s+(welcome|going|the|a|an|not|very|so)\b(?!\s+(?:to|hand|arm|side|leg|eye|foot|own))/gi, type: 'mechanics', weight: 3, fix: function (m) { return "you're " + m[1]; }, ar: 'هنا المقصود you are فتنكتب you\'re' },
    { id: 'loose-lose', re: /\b(loose|looses|loosing)\s+(weight|my|the|his|her|their|our|your|money|time|hope|control|interest|track|touch|sight|patience|a|an)\b/gi, type: 'spelling', weight: 3, fix: function (m) { return ({ loose: 'lose', looses: 'loses', loosing: 'losing' })[m[1].toLowerCase()] + ' ' + m[2]; }, ar: 'lose (يخسر) بحرف o واحد — loose معناها واسع/مرخي' },
    { id: 'affect-noun', re: /\b(an|the|this|that|its|their|negative|positive|bad|good|big|huge|great|major|significant|no)\s+affect\s+(on|of)\b/gi, type: 'grammar', weight: 3, fix: function (m) { return m[1] + ' effect ' + m[2]; }, ar: 'الاسم effect والفعل affect' },
    { id: 'affect-on', re: /\b(affect|affects|affected|affecting)\s+on\b/gi, type: 'grammar', weight: 3, fix: function (m) { return m[1]; }, ar: 'affect فعل مباشر بدون on: affects health' },
    { id: 'effect-verb', re: /\b(will|can|could|might|would|to|not|negatively|positively|badly|directly)\s+effect\s+(the|my|our|his|her|their|your|people|students|children|health|society|us|them|me|you|it)\b(?!\s+(?:change|changes))/gi, type: 'grammar', weight: 3, fix: function (m) { return m[1] + ' affect ' + m[2]; }, ar: 'الفعل affect والاسم effect' },
    { id: 'advice-verb', re: /\b(I|we|they|you|he|she|doctors|experts|teachers|parents)\s+(strongly\s+|would\s+|always\s+|highly\s+)?advice\b/gi, type: 'spelling', weight: 3, fix: function (m) { return m[1] + ' ' + (m[2] || '') + 'advise'; }, ar: 'الفعل advise بحرف s — advice اسم' },
    { id: 'advise-noun', re: /\b(an|some|good|the|my|his|her|your|their|useful)\s+advise\b/gi, type: 'spelling', weight: 3, fix: function (m) { return m[1].toLowerCase() === 'an' ? 'some advice' : m[1] + ' advice'; }, ar: 'الاسم advice بحرف c' }
  ];

  /* helpers used in fixes */
  function thirdSg(v) {
    v = v.toLowerCase();
    var irr = { go: 'goes', do: 'does', have: 'has', be: 'is', say: 'says' };
    if (irr[v]) return irr[v];
    if (/(s|x|z|ch|sh)$/.test(v)) return v + 'es';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
    return v + 's';
  }
  function ing(v) {
    v = v.toLowerCase();
    if (/ie$/.test(v)) return v.slice(0, -2) + 'ying';
    if (/[^e]e$/.test(v) && !/ee$/.test(v)) return v.slice(0, -1) + 'ing';
    if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v) && v.length <= 5) return v + v.slice(-1) + 'ing';
    return v + 'ing';
  }
  var IRREG = { went: 'go', came: 'come', ate: 'eat', saw: 'see', took: 'take', gave: 'give', did: 'do', wrote: 'write', spoke: 'speak', drove: 'drive', ran: 'run', knew: 'know', began: 'begin', became: 'become', forgot: 'forget', drank: 'drink', flew: 'fly', grew: 'grow', threw: 'throw', drew: 'draw', chose: 'choose', broke: 'break', fell: 'fall', rose: 'rise', swam: 'swim', sang: 'sing', rang: 'ring', woke: 'wake', wore: 'wear', got: 'get', had: 'have', made: 'make', bought: 'buy', said: 'say', told: 'tell', thought: 'think', found: 'find', felt: 'feel', left: 'leave', met: 'meet', slept: 'sleep', lost: 'lose', paid: 'pay', sent: 'send', spent: 'spend', understood: 'understand', won: 'win', was: 'be', were: 'be', goes: 'go', has: 'have', does: 'do' };
  var PART = { go: 'gone', come: 'come', eat: 'eaten', see: 'seen', take: 'taken', give: 'given', do: 'done', write: 'written', speak: 'spoken', drive: 'driven', run: 'run', know: 'known', begin: 'begun', become: 'become', forget: 'forgotten', drink: 'drunk', fly: 'flown', grow: 'grown', throw: 'thrown', draw: 'drawn', choose: 'chosen', break: 'broken', fall: 'fallen', rise: 'risen', swim: 'swum', sing: 'sung', ring: 'rung', wake: 'woken', wear: 'worn' };
  var PAST = { go: 'went', eat: 'ate', see: 'saw', have: 'had', buy: 'bought', meet: 'met', come: 'came', take: 'took', get: 'got', make: 'made', give: 'gave', do: 'did', say: 'said', tell: 'told', think: 'thought', feel: 'felt', find: 'found', leave: 'left', drive: 'drove', write: 'wrote', sleep: 'slept', wake: 'woke', sit: 'sat', speak: 'spoke', run: 'ran', lose: 'lost', win: 'won', forget: 'forgot', send: 'sent', spend: 'spent', begin: 'began', bring: 'brought', drink: 'drank', fly: 'flew', grow: 'grew', throw: 'threw', draw: 'drew', choose: 'chose', break: 'broke', fall: 'fell', rise: 'rose', swim: 'swam', sing: 'sang', wear: 'wore', study: 'studied', try: 'tried', stop: 'stopped', plan: 'planned', travel: 'travelled', visit: 'visited', play: 'played', watch: 'watched', enjoy: 'enjoyed', decide: 'decided', want: 'wanted', need: 'needed', like: 'liked', call: 'called', learn: 'learned', arrive: 'arrived', stay: 'stayed', help: 'helped', clean: 'cleaned', dance: 'danced', open: 'opened', close: 'closed', move: 'moved', cook: 'cooked', walk: 'walked', talk: 'talked', work: 'worked', start: 'started', finish: 'finished' };
  function baseOf(v) {
    var l = v.toLowerCase();
    if (IRREG[l]) return IRREG[l];
    if (/ing$/.test(l)) { var b = baseForms(l); for (var i = 0; i < b.length; i++) if (dict.has(b[i])) return b[i]; return l.replace(/ing$/, ''); }
    if (/ied$/.test(l)) return l.slice(0, -3) + 'y';
    if (/ed$/.test(l)) { if (dict.has(l.slice(0, -1))) return l.slice(0, -1); return l.slice(0, -2); }
    if (/ies$/.test(l)) return l.slice(0, -3) + 'y';
    if (/(s|x|z|ch|sh)es$/.test(l)) return l.slice(0, -2);
    if (/s$/.test(l)) return l.slice(0, -1);
    return l;
  }
  function participle(v) { var b = IRREG[v.toLowerCase()] || v.toLowerCase(); return PART[b] || (b + 'ed'); }
  function pastOf(v) {
    var l = v.toLowerCase();
    if (PAST[l]) return PAST[l];
    if (/e$/.test(l)) return l + 'd';
    if (/[^aeiou]y$/.test(l)) return l.slice(0, -1) + 'ied';
    return l + 'ed';
  }

  /* ------------------------------------------------------------------ */
  /* Text utilities                                                      */
  /* ------------------------------------------------------------------ */

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function round(x) { return Math.round(x); }

  function tokenize(text) { return (String(text || '').match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []); }

  function splitSentences(text) {
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return [];
    var parts = t.split(/(?<=[.!?])\s+(?=["'(]?[A-Za-z0-9])|\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    return parts.filter(function (s) { return /[A-Za-z]/.test(s); });
  }

  function editDistance1Candidates(w) {
    var letters = 'abcdefghijklmnopqrstuvwxyz';
    var c = [];
    var i, j;
    for (i = 0; i < w.length; i++) c.push(w.slice(0, i) + w.slice(i + 1));                  // deletion
    for (i = 0; i < w.length - 1; i++) c.push(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2)); // transposition
    for (i = 0; i < w.length; i++) for (j = 0; j < 26; j++) if (letters[j] !== w[i]) c.push(w.slice(0, i) + letters[j] + w.slice(i + 1)); // substitution
    for (i = 0; i <= w.length; i++) for (j = 0; j < 26; j++) c.push(w.slice(0, i) + letters[j] + w.slice(i));  // insertion
    return c;
  }

  function suggestSpelling(w) {
    if (MISSPELL[w]) return MISSPELL[w];
    var c = editDistance1Candidates(w);
    // Only suggest reasonably common words: an obscure dictionary neighbour (kebabs -> rebabs) is more likely
    // to be a false alarm than the intended word.
    var MAX_RANK = 15000;
    var best = null, bestRank = Infinity;
    for (var i = 0; i < c.length; i++) {
      var x = c[i];
      if (x.length < 2) continue;
      if (rankMap.has(x)) { var r = rankMap.get(x); if (r < bestRank) { bestRank = r; best = x; } }
    }
    if (best && bestRank > MAX_RANK) best = null;
    if (!best) {
      // allow inflected candidates (e.g. "freinds" -> "friends" via base "friend")
      for (i = 0; i < c.length; i++) { if (c[i].length > 3 && rankOf(c[i]) <= MAX_RANK) { best = c[i]; break; } }
    }
    return best;
  }

  /* ------------------------------------------------------------------ */
  /* Analysis                                                            */
  /* ------------------------------------------------------------------ */

  function KIND_DEFAULTS(mode, kind) {
    var W = {
      photo: { min: 40, ideal: 55, sentMin: 3, paragraphs: false, conn: 1 },
      interactive: { min: 80, ideal: 110, sentMin: 5, paragraphs: true, conn: 3 },
      sample: { min: 100, ideal: 130, sentMin: 6, paragraphs: true, conn: 3 },
      summary: { min: 40, ideal: 60, sentMin: 3, sentMax: 6, paragraphs: false, conn: 1 }
    };
    var S = {
      photo: { min: 70, ideal: 120, secs: 90, sentMin: 4, conn: 1 },
      rts: { min: 70, ideal: 120, secs: 90, sentMin: 4, conn: 2 },
      interactive: { min: 30, ideal: 55, secs: 35, sentMin: 2, conn: 1 },
      sample: { min: 150, ideal: 260, secs: 180, sentMin: 8, conn: 3 }
    };
    var table = mode === 'speaking' ? S : W;
    return table[kind] || (mode === 'speaking' ? S.photo : W.photo);
  }

  function contentWords(tokens) {
    return tokens.map(function (t) { return t.toLowerCase().replace(/'.*$/, ''); }).filter(function (w) { return w.length > 2 && !STOP.has(w); });
  }
  function stem(w) { var b = baseForms(w); return b.length ? b[b.length - 1].slice(0, 5) : w.slice(0, 5); }

  function analyze(opts, mode) {
    var text = String(mode === 'speaking' ? (opts.transcript || '') : (opts.text || '')).replace(/\r/g, '');
    var kind = opts.kind || (mode === 'speaking' ? 'photo' : 'photo');
    var cfg = KIND_DEFAULTS(mode, kind);
    if (opts.minWords) cfg = Object.assign({}, cfg, { min: opts.minWords, ideal: Math.max(cfg.ideal, opts.minWords) });
    var keywords = (opts.keywords || []).map(function (k) { return String(k).toLowerCase().trim(); }).filter(Boolean);
    var promptWords = contentWords(tokenize(opts.prompt || ''));
    var kwTokens = [];
    keywords.forEach(function (k) { kwTokens = kwTokens.concat(contentWords(tokenize(k))); });
    var protectedWords = new Set(promptWords.concat(kwTokens).concat(keywords));

    var tokens = tokenize(text);
    var words = tokens.length;
    var lower = tokens.map(function (t) { return t.toLowerCase(); });
    var sentences = splitSentences(text);
    var hasPunct = /[.!?]/.test(text);
    var sentenceCount = sentences.length;
    if (mode === 'speaking' && !hasPunct && words > 0) sentenceCount = Math.max(1, Math.round(words / 14));

    var issues = [];
    var seen = new Set();
    function addIssue(o) {
      var key = o.type + '|' + (o.text || '').toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      issues.push({ type: o.type, text: o.text || '', fix: o.fix || '', ar: o.ar, weight: o.weight || 0, rule: o.rule || '' });
    }

    /* ---- grammar rules ---- */
    var spans = [];
    var grammarWeight = 0;
    var grammarCount = 0;
    if (words > 0) {
      RULES.forEach(function (rule) {
        rule.re.lastIndex = 0;
        var m;
        var guard = 0;
        while ((m = rule.re.exec(text)) && guard++ < 50) {
          var start = m.index, end = m.index + m[0].length;
          if (!m[0].length) { rule.re.lastIndex++; continue; }
          // skip a match that mostly overlaps an earlier (higher-priority) match; small overlaps (e.g. a shared "is") are allowed
          var overlap = spans.some(function (s) { var ov = Math.min(end, s[1]) - Math.max(start, s[0]); return ov > 0 && ov / (end - start) >= 0.5; });
          if (overlap) continue;
          spans.push([start, end]);
          var snippet = m[0].trim();
          var fix = ''; try { fix = rule.fix(m) || ''; } catch (e) { fix = ''; }
          var before = issues.length;
          addIssue({ type: rule.type, text: snippet, fix: fix, ar: rule.ar, weight: rule.weight, rule: rule.id });
          if (issues.length > before && rule.type !== 'mechanics' && rule.type !== 'spelling') { grammarWeight += rule.weight; grammarCount++; }
        }
      });
    }

    /* ---- spelling ---- */
    var misspelled = 0;
    var spellSeen = new Set();
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      if (!/^[a-z]+$/.test(tok)) continue;             // lowercase letters only (no caps, digits, apostrophes)
      if (tok.length < 4) continue;
      if (spellSeen.has(tok)) continue;
      if (SAFE_WORDS.has(tok) || protectedWords.has(tok)) continue;
      if (!MISSPELL[tok] && inList(tok)) continue;   // known misspellings win over a lucky inflection match (studing -> stud+ing)
      var sug = suggestSpelling(tok);
      if (!sug) continue;
      spellSeen.add(tok);
      misspelled++;
      addIssue({ type: 'spelling', text: tok, fix: sug, ar: 'إملاء: الصح ' + sug, weight: 0, rule: 'spelling' });
    }
    // fused / apostrophe-less forms that the tokenizer sees as plain words
    ['dont', 'doesnt', 'didnt', 'cant', 'wont', 'isnt', 'im', 'ive', 'youre', 'thats', 'whats', 'alot', 'infront', 'everytime', 'eachother', 'incase', 'aswell', 'atleast', 'nowdays'].forEach(function (w) {
      if (lower.indexOf(w) >= 0 && !spellSeen.has(w) && !SAFE_WORDS.has(w)) { spellSeen.add(w); misspelled++; addIssue({ type: 'spelling', text: w, fix: MISSPELL[w], ar: 'إملاء: تنكتب ' + MISSPELL[w], weight: 0, rule: 'spelling' }); }
    });

    /* ---- templates ---- */
    var lowerText = text.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
    var templateHits = 0;
    TEMPLATES.forEach(function (ph) {
      var idx = lowerText.indexOf(ph);
      if (idx >= 0) {
        templateHits++;
        addIssue({ type: 'template', text: text.replace(/\s+/g, ' ').substr(idx, ph.length), fix: '', ar: 'عبارة محفوظة وجاهزة — اختبار DET يعاقب الكلام المحفوظ، اكتب بأسلوبك وعن الموضوع نفسه', weight: 0, rule: 'template' });
      }
    });

    /* ---- repetition ---- */
    var freq = {};
    lower.forEach(function (w) { if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
    var repeated = Object.keys(freq).filter(function (w) { return freq[w] >= 4 && freq[w] / Math.max(words, 1) > 0.045; }).sort(function (a, b) { return freq[b] - freq[a]; });
    repeated.slice(0, 2).forEach(function (w) {
      addIssue({ type: 'repetition', text: w, fix: '', ar: 'كررت كلمة «' + w + '» ' + freq[w] + ' مرات — نوّع بمرادفات أو ضمائر', weight: 0, rule: 'repetition' });
    });
    var dup = text.match(/\b([A-Za-z]+)\s+\1\b/g);
    if (dup && mode !== 'speaking') dup.slice(0, 2).forEach(function (d) { if (!/^(that that|had had|is is)$/i.test(d)) addIssue({ type: 'repetition', text: d, fix: d.split(/\s+/)[0], ar: 'كلمة مكررة ورا بعض', weight: 0, rule: 'dup' }); });

    /* ---- fillers (speaking) ---- */
    var fillerCount = 0;
    if (mode === 'speaking' && words > 0) {
      var fm = text.match(FILLERS) || [];
      fillerCount = fm.length;
      if (fillerCount >= 2) {
        var uniq = {}; fm.forEach(function (f) { uniq[f.toLowerCase()] = (uniq[f.toLowerCase()] || 0) + 1; });
        addIssue({ type: 'filler', text: Object.keys(uniq).slice(0, 4).join(', '), fix: '', ar: 'كلمات حشو (' + fillerCount + ' مرة) — اسكت ثانية بدل um/uh، السكوت القصير أحسن من الحشو', weight: 0, rule: 'filler' });
      }
    }

    /* ---- mechanics ---- */
    var mechIssues = 0;
    if (mode !== 'speaking' && words > 0) {
      var lowerI = text.match(/(^|[\s(])i(?=\s|'m\b|'ll\b|'ve\b|'d\b|,|\.)/g);
      if (lowerI && lowerI.length) { mechIssues++; addIssue({ type: 'mechanics', text: 'i', fix: 'I', ar: 'ضمير المتكلم I دايم كبير حتى في وسط الجملة', weight: 0, rule: 'lower-i' }); }
      var lowStart = text.match(/(^|[.!?]\s+)([a-z][a-z']*)/g);
      if (lowStart && lowStart.length) { mechIssues += Math.min(lowStart.length, 3); addIssue({ type: 'mechanics', text: lowStart[0].trim(), fix: lowStart[0].trim().replace(/[a-z](?=[a-z']*$)/, function (c) { return c.toUpperCase(); }).replace(/^([.!?]\s+)?([a-z])/, function (a, p, c) { return (p || '') + c.toUpperCase(); }), ar: 'أول حرف في الجملة لازم كبير', weight: 0, rule: 'cap-start' }); }
      if (!/[.!?]["')]?\s*$/.test(text.trim())) { mechIssues++; addIssue({ type: 'mechanics', text: text.trim().slice(-25), fix: '', ar: 'اختم آخر جملة بنقطة', weight: 0, rule: 'final-punct' }); }
      if (/[^\S\n]{2,}/.test(text)) { mechIssues++; addIssue({ type: 'mechanics', text: '  ', fix: ' ', ar: 'مسافتين ورا بعض — مسافة وحدة تكفي', weight: 0, rule: 'double-space' }); }
      var spaceBefore = text.match(/\s+[,.!?;:]/);
      if (spaceBefore) { mechIssues++; addIssue({ type: 'mechanics', text: spaceBefore[0], fix: spaceBefore[0].trim(), ar: 'ما فيه مسافة قبل الفاصلة أو النقطة', weight: 0, rule: 'space-punct' }); }
      if (!hasPunct && words > 25) { mechIssues += 2; addIssue({ type: 'mechanics', text: '', fix: '', ar: 'النص كله بدون نقاط — قسّمه لجمل واضحة', weight: 0, rule: 'no-punct' }); }
      if (words > 20 && !/[A-Z]/.test(text)) { mechIssues += 1; }
    }

    /* ---- structure ---- */
    var structIssues = [];
    var sentLens = sentences.map(function (s) { return tokenize(s).length; });
    var avgLen = sentLens.length ? sentLens.reduce(function (a, b) { return a + b; }, 0) / sentLens.length : words;
    var sd = 0;
    if (sentLens.length > 1) { var mean = avgLen; sd = Math.sqrt(sentLens.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / sentLens.length); }
    var cv = avgLen ? sd / avgLen : 0;
    var runOns = sentences.filter(function (s, idx) { return sentLens[idx] > 45; });
    if (mode !== 'speaking') runOns.slice(0, 2).forEach(function (s) { addIssue({ type: 'structure', text: s.slice(0, 40) + '…', fix: '', ar: 'جملة طويلة مرة (' + tokenize(s).length + ' كلمة) — قسّمها لجملتين أو ثلاث', weight: 0, rule: 'run-on' }); });
    var starts = {};
    sentences.forEach(function (s) { var f = (tokenize(s)[0] || '').toLowerCase(); if (f) starts[f] = (starts[f] || 0) + 1; });
    var maxStart = 0, maxStartWord = '';
    Object.keys(starts).forEach(function (k) { if (starts[k] > maxStart) { maxStart = starts[k]; maxStartWord = k; } });
    var sameStartShare = sentences.length ? maxStart / sentences.length : 0;
    if (sentences.length >= 4 && sameStartShare >= 0.5) addIssue({ type: 'structure', text: maxStartWord, fix: '', ar: 'أغلب جملك تبدأ بنفس الكلمة «' + maxStartWord + '» — غيّر بداية الجمل', weight: 0, rule: 'same-start' });
    var paragraphs = text.split(/\n\s*\n|\n/).filter(function (p) { return p.trim().length > 0; }).length;
    if (mode !== 'speaking' && cfg.paragraphs && words >= 150 && paragraphs < 2) addIssue({ type: 'structure', text: '', fix: '', ar: 'نص طويل بفقرة وحدة — قسّمه لفقرتين أو ثلاث (مقدمة، أفكار، خاتمة)', weight: 0, rule: 'paragraphs' });
    if (words > 0 && sentenceCount < cfg.sentMin) addIssue({ type: 'structure', text: '', fix: '', ar: 'عدد الجمل قليل (' + sentenceCount + ') — المطلوب ' + cfg.sentMin + ' جمل على الأقل', weight: 0, rule: 'few-sentences' });
    if (kind === 'summary' && mode !== 'speaking' && cfg.sentMax && sentenceCount > cfg.sentMax + 2) addIssue({ type: 'structure', text: '', fix: '', ar: 'الملخص طويل — 3 إلى 5 جمل تكفي، ركّز على الأهم', weight: 0, rule: 'summary-long' });
    var complexShare = sentences.length ? sentences.filter(function (s) { return SUBORDINATORS.test(s); }).length / sentences.length : 0;
    var connHits = CONNECTORS.filter(function (c) { return new RegExp('\\b' + c.replace(/\s+/g, '\\s+') + '\\b', 'i').test(text); });

    /* ---- vocabulary ---- */
    var alpha = lower.map(function (w) { return w.replace(/'.*$/, ''); }).filter(function (w) { return /^[a-z]+$/.test(w); });
    var ttr = alpha.length ? new Set(alpha).size / alpha.length : 0;
    var mattr = ttr;
    if (alpha.length > 50) {
      var win = 50, sum = 0, n = 0;
      for (var s0 = 0; s0 + win <= alpha.length; s0 += 5) { sum += new Set(alpha.slice(s0, s0 + win)).size / win; n++; }
      mattr = n ? sum / n : ttr;
    }
    var rareCount = 0, knownCount = 0;
    alpha.forEach(function (w) {
      if (w.length < 4 || STOP.has(w)) return;
      var r = rankOf(w);
      if (r === Infinity) { if (protectedWords.has(w) || SAFE_WORDS.has(w)) knownCount++; return; }
      knownCount++;
      if (r > 3000 && w.length >= 5) rareCount++;
    });
    var rareShare = knownCount ? rareCount / knownCount : 0;

    /* ---- relevance ---- */
    var textStems = new Set(alpha.filter(function (w) { return w.length > 2 && !STOP.has(w); }).map(stem));
    var kwHit = 0, kwMissing = [];
    var kwStems = keywords.map(function (k) { return contentWords(tokenize(k)).map(stem); });
    kwStems.forEach(function (st, idx) {
      var ok = st.length ? st.some(function (x) { return textStems.has(x); }) : lowerText.indexOf(keywords[idx]) >= 0;
      if (ok) kwHit++; else kwMissing.push(keywords[idx]);
    });
    var promptStems = [];
    var pseen = new Set();
    promptWords.forEach(function (w) { var s = stem(w); if (!pseen.has(s)) { pseen.add(s); promptStems.push(s); } });
    var promptHit = promptStems.filter(function (s) { return textStems.has(s); }).length;
    var relevance;
    var kwScore = keywords.length ? kwHit / Math.min(keywords.length, 6) : null;
    var promptScore = promptStems.length ? promptHit / Math.min(promptStems.length, 8) : null;
    if (kwScore === null && promptScore === null) relevance = 0.85;
    else if (kwScore === null) relevance = clamp(0.35 + promptScore, 0, 1);
    else if (promptScore === null) relevance = clamp(0.2 + kwScore, 0, 1);
    else relevance = clamp(0.15 + 0.6 * kwScore + 0.4 * promptScore, 0, 1);
    if (words > 0 && keywords.length && kwHit / keywords.length < 0.34) addIssue({ type: 'relevance', text: kwMissing.slice(0, 4).join(', '), fix: '', ar: 'ما تطرقت لأشياء أساسية في السؤال — اربط كلامك بالموضوع المطلوب بشكل مباشر', weight: 0, rule: 'relevance' });

    /* ---- summary features ---- */
    var summaryScore = 1;
    if (kind === 'summary' && mode !== 'speaking' && words > 0) {
      var pastVerbs = (lowerText.match(/\b(was|were|had|did|went|said|told|asked|wanted|decided|agreed|suggested|offered|explained|complained|mentioned|called|needed|thought|felt|planned|talked|discussed|apologized|apologised|promised|refused|accepted|invited|recommended|cancelled|canceled|postponed|arranged|met|spoke|gave|took|came|made|got|left|bought|found|[a-z]{3,}ed)\b/g) || []).length;
      var presentVerbs = (lowerText.match(/\b(is|are|am|wants|says|asks|tells|needs|decides|agrees|suggests|thinks|talks|goes|has|does)\b/g) || []).length;
      var pastRatio = pastVerbs / Math.max(1, pastVerbs + presentVerbs);
      var decisionWords = (lowerText.match(/\b(decided|agreed|because|so|finally|in the end|suggested|offered|plan|planned|will|would|going to)\b/g) || []).length;
      var whoWords = /\b(he|she|they|the (man|woman|student|customer|teacher|caller|friend|speaker|first|second)|[A-Z][a-z]+ (said|told|asked|wanted|decided|agreed|suggested))\b/.test(text);
      summaryScore = 0.5 * clamp((pastRatio - 0.3) / 0.5, 0, 1) + 0.3 * clamp(decisionWords / 2, 0, 1) + 0.2 * (whoWords ? 1 : 0);
      if (pastRatio < 0.5) addIssue({ type: 'grammar', text: '', fix: '', ar: 'الملخص يكون بصيغة الماضي: they discussed… she decided…', weight: 0, rule: 'summary-past' });
      if (decisionWords === 0) addIssue({ type: 'relevance', text: '', fix: '', ar: 'اذكر وش صار ووش قرروا في النهاية (decided / agreed to…)', weight: 0, rule: 'summary-decision' });
    }

    /* ---- speaking timing ---- */
    var seconds = mode === 'speaking' ? Math.max(0, Number(opts.seconds) || 0) : 0;
    var wpm = mode === 'speaking' && seconds > 0 ? round(words / (seconds / 60)) : 0;
    var timeRatio = mode === 'speaking' && cfg.secs ? seconds / cfg.secs : 1;

    /* ------------------------------------------------------------------ */
    /* Sub-scores                                                          */
    /* ------------------------------------------------------------------ */
    var lengthScore = words >= cfg.ideal ? 1 : words >= cfg.min ? 0.85 + 0.15 * (words - cfg.min) / Math.max(1, cfg.ideal - cfg.min) : 0.85 * Math.pow(words / cfg.min, 1.3);
    if (mode !== 'speaking' && kind === 'photo' && words > 140) lengthScore = 0.95;
    if (words > 0 && words < cfg.min) addIssue({ type: 'length', text: '', fix: '', ar: 'النص قصير (' + words + ' كلمة) — المطلوب ' + cfg.min + ' على الأقل والأفضل ' + cfg.ideal + '+', weight: 0, rule: 'short' });

    var task = 100 * (kind === 'summary' && mode !== 'speaking' ? 0.35 * lengthScore + 0.35 * relevance + 0.30 * summaryScore : 0.5 * lengthScore + 0.5 * relevance);
    task -= Math.min(18, templateHits * 6);
    if (mode === 'speaking') {
      if (timeRatio < 0.4) { task *= 0.45; addIssue({ type: 'length', text: '', fix: '', ar: 'تكلمت ' + round(seconds) + ' ثانية بس من ' + cfg.secs + ' — املأ الوقت كله، الوقت الفاضي يخسّرك درجات', weight: 0, rule: 'short-time' }); }
      else if (timeRatio < 0.7) { task *= 0.8; addIssue({ type: 'length', text: '', fix: '', ar: 'ما استخدمت كل الوقت (' + round(seconds) + ' من ' + cfg.secs + ' ثانية) — كمّل بتفاصيل أو أمثلة', weight: 0, rule: 'time-partial' }); }
    }
    task = clamp(round(task), 0, 100);

    var ttrScore = clamp((mattr - 0.45) / 0.4, 0, 1);
    var rareScore = clamp(rareShare / 0.12, 0, 1);
    var connScore = clamp(connHits.length / cfg.conn, 0, 1);
    var vocab = 100 * (0.4 * ttrScore + 0.35 * rareScore + 0.25 * connScore);
    vocab -= Math.min(35, misspelled * 7);
    vocab -= templateHits * 4;
    if (repeated.length) vocab -= 5 * repeated.length;
    vocab = clamp(round(vocab), 0, 100);

    var per100 = words ? grammarWeight / Math.max(words, 60) * 100 : 0;
    var grammar = clamp(round(100 - per100), 0, 100);
    if (kind === 'summary' && mode !== 'speaking' && words > 0 && summaryScore < 0.4) grammar = Math.min(grammar, 80);

    var sentScore = clamp(sentenceCount / cfg.sentMin, 0, 1);
    if (cfg.sentMax && sentenceCount > cfg.sentMax + 2) sentScore *= 0.8;
    var varietyScore = clamp(cv / 0.35, 0, 1) * (avgLen >= 8 && avgLen <= 26 ? 1 : 0.7);
    if (sentences.length < 2) varietyScore = 0.3;
    var startScore = 1 - clamp((sameStartShare - 0.34) / 0.5, 0, 1) * (sentences.length >= 3 ? 1 : 0);
    var complexScore = clamp(complexShare / 0.5, 0, 1);
    var structure = 100 * (0.35 * sentScore + 0.25 * varietyScore + 0.2 * startScore + 0.2 * complexScore);
    structure -= Math.min(16, runOns.length * 8);
    if (mode !== 'speaking' && cfg.paragraphs && words >= 150 && paragraphs < 2) structure -= 10;
    if (mode === 'speaking' && !hasPunct) structure = 0.6 * structure + 40 * clamp(words / cfg.ideal, 0, 1) * clamp(connHits.length / 2 + 0.5, 0, 1);
    structure = clamp(round(structure), 0, 100);

    var mechanics;
    if (mode === 'speaking') {
      // fluency: words per minute + fillers
      var wpmScore = wpm >= 110 && wpm <= 175 ? 1 : wpm > 175 ? clamp(1 - (wpm - 175) / 120, 0.5, 1) : clamp((wpm - 40) / 70, 0, 1);
      var fillerPer100 = words ? fillerCount / words * 100 : 0;
      mechanics = 100 * wpmScore - Math.min(35, fillerPer100 * 4);
      if (wpm && wpm < 90) addIssue({ type: 'filler', text: '', fix: '', ar: 'سرعتك ' + wpm + ' كلمة/دقيقة — بطيئة، حاول توصل 120–150 بدون توقفات طويلة', weight: 0, rule: 'slow' });
    } else {
      mechanics = 100 - Math.min(70, mechIssues * 14);
      if (words > 20 && !/[A-Z]/.test(text)) mechanics = Math.min(mechanics, 45);
    }
    mechanics = clamp(round(mechanics), 0, 100);

    var subs = { task: task, vocab: vocab, grammar: grammar, structure: structure, mechanics: mechanics };
    var score;
    if (mode === 'speaking') score = 0.30 * task + 0.25 * vocab + 0.25 * grammar + 0.10 * structure + 0.10 * mechanics;
    else score = 0.30 * task + 0.25 * vocab + 0.25 * grammar + 0.15 * structure + 0.05 * mechanics;
    // A text far below the minimum length gives little evidence for the other sub-scores: scale the total down.
    if (words > 0 && words < cfg.min) score *= 0.6 + 0.4 * (words / cfg.min);

    // empty input
    var empty = words === 0;
    if (empty) {
      if (mode === 'speaking') {
        score = 25 * clamp(timeRatio, 0, 1);
        subs = { task: round(score), vocab: 0, grammar: 0, structure: 0, mechanics: 0 };
        issues.length = 0; seen.clear();
        addIssue({ type: 'length', text: '', fix: '', ar: 'ما وصلنا أي كلام من المايك (النص فاضي) — تأكد إن المايك شغال وتكلم بصوت واضح، الدرجة هنا على الوقت بس', weight: 0, rule: 'empty' });
      } else {
        score = 0; subs = { task: 0, vocab: 0, grammar: 0, structure: 0, mechanics: 0 };
        issues.length = 0; seen.clear();
        addIssue({ type: 'length', text: '', fix: '', ar: 'ما فيه نص — اكتب شي عشان نقيّمه', weight: 0, rule: 'empty' });
      }
    }
    score = clamp(round(score), 0, 100);

    /* ---- ordering issues: grammar (by weight) → spelling → article → relevance/length → others ---- */
    var ORDER = { relevance: 0, length: 1, grammar: 2, article: 3, spelling: 4, template: 5, structure: 6, repetition: 7, mechanics: 8, filler: 9 };
    issues.sort(function (a, b) { return (ORDER[a.type] - ORDER[b.type]) || (b.weight - a.weight); });
    var issueOut = issues.map(function (o) { return { type: o.type, text: o.text, fix: o.fix, ar: o.ar }; });

    /* ---- strengths & tips ---- */
    var strengths = [];
    var tips = [];
    if (!empty) {
      if (task >= 80) strengths.push(mode === 'speaking' ? 'غطيت الموضوع وملأت الوقت — ممتاز' : 'جاوبت على المطلوب وبطول مناسب');
      if (relevance >= 0.8 && (keywords.length || promptWords.length)) strengths.push('كلامك مرتبط بالسؤال بشكل مباشر');
      if (grammar >= 85 && words >= 30) strengths.push('القواعد سليمة تقريباً' + (grammarCount ? ' (ملاحظة أو اثنتين بس)' : ' — ما لقينا أخطاء'));
      if (vocab >= 70) strengths.push('مفرداتك متنوعة' + (rareShare >= 0.1 ? ' وفيها كلمات أقل شيوعاً — هذا اللي يرفع الدرجة' : ''));
      if (connHits.length >= 2) strengths.push('استخدمت روابط جيدة: ' + connHits.slice(0, 3).join(', '));
      if (structure >= 75 && sentences.length >= 3) strengths.push('جملك متنوعة الطول والتركيب');
      if (!misspelled && words >= 30) strengths.push('إملاؤك سليم');
      if (mode === 'speaking' && wpm >= 110 && wpm <= 175) strengths.push('سرعة كلامك طبيعية (' + wpm + ' كلمة/دقيقة)');
      if (mode !== 'speaking' && mechanics >= 90 && words >= 20) strengths.push('علامات الترقيم والحروف الكبيرة مضبوطة');

      var cand = []; // [impact, text]
      if (mode === 'speaking' && timeRatio < 0.4) cand.push([100, 'املأ الوقت — استمر بالكلام لين ينتهي العداد، حتى لو تعيد الفكرة بصياغة ثانية']);
      if (words < cfg.min) cand.push([90, 'طوّل شوي: اكتب ' + cfg.ideal + '+ كلمة — أضف مثال أو سبب لكل فكرة']);
      if (keywords.length && kwHit / keywords.length < 0.5) cand.push([85, 'اربط كلامك بالسؤال: اذكر ' + (kwMissing.slice(0, 3).join(' / ') || 'الكلمات المفتاحية') + ' صراحةً']);
      if (templateHits) cand.push([80, 'شيل العبارات المحفوظة (' + templateHits + ') — DET يكشفها ويخصم عليها، خليك طبيعي ومحدد']);
      if (kind === 'summary' && mode !== 'speaking' && summaryScore < 0.6) cand.push([80, 'الملخص: ابدأ بمن تكلم وعن إيش، استخدم الماضي، واختم بالقرار (they decided to…)']);
      var firstGrammar = issues.filter(function (o) { return (o.type === 'grammar' || o.type === 'article') && o.text; })[0];
      if (grammarCount >= 3) cand.push([75, 'ركّز على القواعد: عندك ' + grammarCount + (grammarCount <= 10 ? ' أخطاء' : ' خطأ') + ' — راجع الملاحظات فوق' + (firstGrammar ? '، أهمها: ' + firstGrammar.text : '')]);
      else if (grammarCount > 0 && firstGrammar) cand.push([50, 'راجع ملاحظة القواعد: ' + firstGrammar.text + (firstGrammar.fix ? ' ← ' + firstGrammar.fix : '')]);
      if (misspelled >= 2) cand.push([70, 'الإملاء: ' + misspelled + (misspelled <= 10 ? ' كلمات غلط' : ' كلمة غلط') + ' — اقرأ نصك مرة قبل ما ترسل']);
      if (rareShare < 0.06 && words >= 40) cand.push([65, 'ارفع مستوى المفردات: بدّل good → beneficial، big → significant، very important → crucial']);
      if (mattr < 0.6 && words >= 40) cand.push([60, 'تكرار كثير — استخدم مرادفات وضمائر بدل ما تعيد نفس الكلمات']);
      if (connHits.length < cfg.conn) cand.push([55, 'أضف روابط بين الأفكار: However, In addition, For example, As a result']);
      if (complexShare < 0.3 && sentences.length >= 3) cand.push([50, 'نوّع الجمل: اربط جملتين بـ because / although / which بدل جمل قصيرة متفرقة']);
      if (sentences.length >= 4 && sameStartShare >= 0.5) cand.push([45, 'غيّر بداية الجمل — لا تبدأ كل جملة بـ «' + maxStartWord + '»']);
      if (mode !== 'speaking' && cfg.paragraphs && words >= 150 && paragraphs < 2) cand.push([45, 'قسّم النص لفقرات: مقدمة، فكرتين، خاتمة']);
      if (mode === 'speaking' && fillerCount >= 3) cand.push([50, 'قلّل الحشو (um / uh / you know) — خذ نفس واسكت لحظة بدلها']);
      if (mode === 'speaking' && wpm && wpm < 90) cand.push([55, 'تكلم أسرع شوي وبثقة — الهدف 120–150 كلمة بالدقيقة']);
      if (mode !== 'speaking' && mechIssues >= 2) cand.push([35, 'الترقيم: حرف كبير أول الجملة، I دايم كبيرة، ونقطة في النهاية']);
      if (kind === 'photo' && mode !== 'speaking' && words >= cfg.min && !/\b(wearing|holding|sitting|standing|looking|smiling|seems|looks like|maybe|probably|in the background|on the left|on the right)\b/i.test(text)) cand.push([40, 'في وصف الصورة: اذكر المكان، الأشخاص ووش يسوون (is wearing / is holding)، وتوقع الجو أو الشعور (seems / probably)']);
      if (!cand.length) cand.push([10, 'ممتاز — حافظ على المستوى وجرّب كلمات أدق ومواضيع أصعب']);
      cand.sort(function (a, b) { return b[0] - a[0]; });
      tips = cand.slice(0, 4).map(function (c) { return c[1]; });
    } else {
      tips = [mode === 'speaking' ? 'تأكد من إذن المايك في المتصفح وتكلم بصوت واضح — املأ الوقت كله' : 'اكتب أي شي مرتبط بالسؤال — حتى نص قصير أحسن من فاضي'];
    }

    var band = bandOf(score);
    var report = {
      score: score, band: band, words: words, sentences: sentenceCount, ttr: Math.round(ttr * 100) / 100,
      subscores: subs, issues: issueOut, strengths: strengths, tips: tips
    };
    if (mode === 'speaking') { report.wpm = wpm; report.seconds = seconds; report.fillers = fillerCount; }
    report.html = renderHtml(report, mode, kind);
    return report;
  }

  function bandOf(score) {
    if (score < 35) return 'تقدير: 40–60';
    if (score < 50) return 'تقدير: 55–75';
    if (score < 65) return 'تقدير: 70–90';
    if (score < 78) return 'تقدير: 85–105';
    if (score < 90) return 'تقدير: 100–120';
    return 'تقدير: 115–135';
  }

  var TYPE_AR = { grammar: 'قواعد', spelling: 'إملاء', article: 'أدوات a/an/the', relevance: 'الموضوع', length: 'الطول', repetition: 'تكرار', structure: 'التنظيم', template: 'عبارة محفوظة', mechanics: 'ترقيم', filler: 'طلاقة' };

  function renderHtml(r, mode, kind) {
    var subLabels = mode === 'speaking'
      ? [['task', 'المهمة'], ['vocab', 'المفردات'], ['grammar', 'القواعد'], ['structure', 'التنظيم'], ['mechanics', 'الطلاقة']]
      : [['task', 'المهمة'], ['vocab', 'المفردات'], ['grammar', 'القواعد'], ['structure', 'التنظيم'], ['mechanics', 'الترقيم']];
    var h = '<div class="sc-report" dir="rtl">';
    h += '<div class="sc-head"><span class="sc-score">' + r.score + '<small>/100</small></span> <span class="sc-band">' + esc(r.band) + '</span>';
    h += '<span class="sc-meta">' + r.words + ' كلمة · ' + r.sentences + ' جملة' + (mode === 'speaking' ? ' · ' + r.wpm + ' كلمة/دقيقة' : '') + '</span></div>';
    h += '<ul class="sc-subs">';
    subLabels.forEach(function (p) {
      var v = r.subscores[p[0]];
      h += '<li class="sc-sub"><span class="sc-sub-label">' + p[1] + '</span><span class="sc-bar"><span class="sc-bar-fill" style="width:' + v + '%"></span></span><span class="sc-val">' + v + '</span></li>';
    });
    h += '</ul>';
    if (r.issues.length) {
      h += '<div class="sc-issues"><h4>ملاحظات</h4>';
      r.issues.slice(0, 12).forEach(function (o) {
        h += '<div class="sc-issue sc-issue-' + esc(o.type) + '"><span class="sc-tag">' + (TYPE_AR[o.type] || esc(o.type)) + '</span> ';
        if (o.text) h += '<span class="en2">' + esc(o.text) + '</span>';
        if (o.fix) h += ' <span class="sc-arrow">←</span> <span class="en2 sc-fix">' + esc(o.fix) + '</span>';
        h += '<div class="sc-ar">' + esc(o.ar) + '</div></div>';
      });
      if (r.issues.length > 12) h += '<div class="sc-more">+' + (r.issues.length - 12) + ' ملاحظات ثانية</div>';
      h += '</div>';
    }
    if (r.strengths.length) {
      h += '<div class="sc-goods"><h4>نقاط قوة</h4>';
      r.strengths.forEach(function (s) { h += '<div class="sc-good">' + esc(s) + '</div>'; });
      h += '</div>';
    }
    if (r.tips.length) {
      h += '<div class="sc-tips"><h4>عشان ترفع درجتك</h4>';
      r.tips.forEach(function (t) { h += '<div class="sc-tip">' + esc(t) + '</div>'; });
      h += '</div>';
    }
    h += '<p class="sc-note">التقدير تقريبي ومبني على قواعد آلية، مو درجة رسمية من Duolingo.</p>';
    h += '</div>';
    return h;
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  var DetScore = {
    version: '1.0.0',
    loadWords: loadWords,
    addWords: addWords,
    writing: function (opts) { return analyze(opts || {}, 'writing'); },
    speaking: function (opts) { return analyze(opts || {}, 'speaking'); },
    checkWord: inList,
    rankOf: rankOf,
    suggest: suggestSpelling,
    band: bandOf,
    dictSize: function () { return dict.size; },
    rules: RULES.map(function (r) { return r.id; })
  };

  root.DetScore = DetScore;
})(typeof window !== 'undefined' ? window : this);
