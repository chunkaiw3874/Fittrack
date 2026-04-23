// Service Worker - 讓App可以離線使用
const CACHE_NAME = 'fittrack-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/app.js',
    '/icon-192.png',
    '/icon-512.png',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// 安裝時緩存資源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ 快取已開啟');
                return cache.addAll(URLS_TO_CACHE).catch(err => {
                    console.warn('⚠️ 部分資源無法快取', err);
                });
            })
    );
    self.skipWaiting();
});

// 啟動時清除舊快取
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ 清除舊快取', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 攔截請求 - 優先使用快取
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 找到快取就直接回傳
                if (response) {
                    return response;
                }
                // 否則發送網路請求
                return fetch(event.request).then(response => {
                    // 不緩存非成功回應
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // 複製回應並存入快取
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return response;
                });
            })
            .catch(() => {
                // 網路失敗時，回傳離線頁面
                return new Response('離線模式 - 請連接網路後再試', {
                    headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
                });
            })
    );
});
