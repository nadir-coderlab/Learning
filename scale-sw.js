/* ميزاني — يخلي التطبيق يفتح بدون نت.
   الطريقة: من الشبكة أول (عشان التحديثات توصل)، ولو ما فيه نت نرجع للنسخة المحفوظة.
   يشتغل فقط على صفحات ميزاني (النطاق ./scale) وما يلمس باقي الموقع. */
const CACHE = 'mizani-v1';
const ASSETS = [
  'scale-app/app.js', 'scale-app/protocols.js', 'scale-app/style.css',
  'scale-app/manifest.webmanifest', 'scale-app/icon.svg', 'scale-app/icon-192.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new URL(a, self.registration.scope.replace(/scale$/, '')).href))).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mizani-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && !res.redirected && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match(req.url.replace(/\/scale$/, '/scale.html')) : undefined)).then(hit => hit || Response.error()))
  );
});
