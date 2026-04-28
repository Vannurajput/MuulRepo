const CACHE_NAME = 'critter-catcher-cache-v22';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest-unique-kids-games.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/critter-catcher.png',
  '/images/memory-match.png',
  '/images/puzzle-palace.png',
  '/images/bubble-shooter-bg.png',
  '/images/jungle-bg.png',
  '/images/banana.png',
  '/images/pineapple.png',
  '/images/mango.png',
  '/images/snail.png',
  '/images/frog.png',
  '/images/basket.png',
  '/tune.mp3',
  '/win.mp3',
  // Add new icons to cache
  '/icons/AlphabetTraceIcon.svg',
  '/icons/ColorMatchIcon.svg',
  '/icons/ConnectDotsIcon.svg',
  '/icons/CountStarsIcon.svg',
  '/icons/FruitCatcherIcon.svg',
  '/icons/MathSafariIcon.svg',
  '/icons/MemoryMatchIcon.svg',
  '/icons/NumberMergeIcon.svg',
  '/icons/PatternPalsIcon.svg',
  '/icons/ShapeMatchIcon.svg',
  '/icons/SnakeIcon.svg',
  '/icons/SoundGuessIcon.svg',
  '/icons/TicTacToeIcon.svg',
  '/icons/SudokuKidsIcon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker.
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open pages.
  );
});