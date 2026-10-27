// 팀톡 서비스워커 — 설치/오프라인 셸 캐시 (네트워크 우선)
const CACHE = "teamtalk-v22";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 시스템 알림 클릭 → 앱 열기(이미 열려있으면 포커스)
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ("focus" in w) return w.focus(); }
    if (clients.openWindow) return clients.openWindow("./");
  }));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 페이지 이동: 네트워크 우선, 끊기면 캐시된 셸
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("./index.html")));
    return;
  }
  // 같은 출처 정적 파일만 캐시. Firebase/gstatic/cdnjs 등 외부는 손대지 않음(실시간 통신 보호)
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
                .catch(() => caches.match(req))
    );
  }
});
