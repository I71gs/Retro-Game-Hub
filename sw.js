const CACHE_NAME = 'retro-game-hub-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/css/main.css',
  '/js/main.js',
  '/js/network.js',
  '/js/player.js',
  '/js/ui.js',
  '/js/sound.js',
  '/games/tictactoe.js',
  '/games/dots.js',
  '/games/connectfour.js',
  '/games/snl.js',
  '/games/memorymatch.js',
  '/games/battleship.js',
  '/games/hangman.js',
  '/games/pong.js',
  '/games/tetris.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || !networkResponse.ok) return networkResponse;
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
