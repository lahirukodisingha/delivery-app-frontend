const CACHE_NAME = 'delivery-app-v3'; // Cache නම වෙනස් කළා අලුත් එක යාවත්කාලීන වෙන්න

// 1. Install Event: ප්‍රධාන ෆයිල් ටික සේව් කරගැනීම
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: පරණ Cache මකා දමා අලුත් එක යෙදීම
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: ඉන්ටර්නෙට් නැති වෙලාවට Cache එකෙන් දත්ත ලබාදීම
self.addEventListener('fetch', (event) => {
  // සර්වර් එකට යවන API Request (උදා: /api/sync) Cache කරන්නේ නෑ
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // --- අලුත් කොටස: React SPA පිටු (HTML Pages) සඳහා ---
  // යූසර් මොන පේජ් එකට යන්න හැදුවත් (Navigate), ඉන්ටර්නෙට් නැත්නම් index.html පෙන්වීම
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // අනිත් දේවල් (JS, CSS, Images) සඳහා: Network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // වැරදි Response එකක් නම් ඒකම යවනවා
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // සාර්ථක නම් අලුත් දත්ත Cache එකට යාවත්කාලීන කරනවා
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // ඉන්ටර්නෙට් නැතිනම් Cache කර ඇති දත්ත ලබා දෙයි
        return caches.match(event.request);
      })
  );
});