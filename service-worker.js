// Service Worker v3 - 強制清除舊快取版本
const CACHE_NAME = ‘fittrack-v99’;  // 改大版本號強制更新
const URLS_TO_CACHE = [
‘./’,
‘./index.html’,
‘./manifest.json’,
‘./app.js’,
‘./icon-192.png’,
‘./icon-512.png’
];

// 安裝時：清除所有舊快取，建立新快取
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.keys().then(cacheNames => {
// 先刪除所有舊快取
return Promise.all(
cacheNames.map(name => {
console.log(‘🗑️ 清除舊快取:’, name);
return caches.delete(name);
})
);
}).then(() => {
// 然後建立新快取
return caches.open(CACHE_NAME);
}).then(cache => {
console.log(‘✨ 建立新快取:’, CACHE_NAME);
return cache.addAll(URLS_TO_CACHE).catch(err => {
console.warn(‘部分資源無法快取’, err);
});
})
);
self.skipWaiting();
});

// 啟動時：再次確認清除舊快取
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(cacheNames => {
return Promise.all(
cacheNames.map(cacheName => {
if (cacheName !== CACHE_NAME) {
console.log(‘🗑️ 啟動時清除:’, cacheName);
return caches.delete(cacheName);
}
})
);
}).then(() => self.clients.claim())
);
});

// Fetch: Network-first 策略（優先用網路，失敗才用快取）
// 這樣更新更即時
self.addEventListener(‘fetch’, event => {
event.respondWith(
fetch(event.request)
.then(response => {
// 成功就更新快取
if (response && response.status === 200 && response.type === ‘basic’) {
const responseToCache = response.clone();
caches.open(CACHE_NAME).then(cache => {
cache.put(event.request, responseToCache);
});
}
return response;
})
.catch(() => {
// 網路失敗才用快取
return caches.match(event.request).then(cached => {
return cached || new Response(‘離線模式’, {
headers: { ‘Content-Type’: ‘text/plain; charset=UTF-8’ }
});
});
})
);
});
