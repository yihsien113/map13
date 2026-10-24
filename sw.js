// Version: 1.0
// 需要更新時修改下方版本字串即可自動清除舊快取
const CACHE_NAME = 'draw-and-guess-pwa-v1.0';

// 獨立遊戲核心檔案清單
const CORE_ASSETS = [
  './',
  './index.html',
  './bopomofo.js',
  './manifest.json',
  'icon.png'
];

// 1. 安裝階段：預載核心檔案並立即啟用
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 使用 allSettled 確保即使缺少選用圖示也不會中斷安裝
      return Promise.allSettled(
        CORE_ASSETS.map((url) => cache.add(url))
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. 啟用階段：清除舊版本快取並立即接管頁面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. 攔截請求：優先讀取快取，沒有才走網路並動態寫入快取
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});