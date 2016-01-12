var version = '5';

// Cache all required files before first load
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('bbgm-' + version).then(function (cache) {
            return cache.addAll([
                '/index.html',
                '/gen/app.js',
                '/gen/bbgm.css',
                '/fonts/glyphicons-halflings-regular.woff',
                '/ico/logo.png',
                '/ico/new_window.png',
                '/img/datatables/sort_asc.png',
                '/img/datatables/sort_both.png',
                '/img/datatables/sort_desc.png'
            ]);
        })
    );
});

// On new cache, delete all old versions of bbgm cache
self.addEventListener('activate', function (event) {
console.log('ACTIVATE')
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
console.log(cacheNames)
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.indexOf('bbgm-') === 0 && cacheName !== 'bbgm-' + version;
                }).map(function(cacheName) {
console.log('DELETE', cacheName)
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Load from cache first, only hit network on failure
self.addEventListener('fetch', function (event) {
    if (event.request.url.indexOf('/l/') >= 0) {
console.log('OVERWRITE', event.request.url);
        event.request.url = location.origin + '/';
    }
console.log(event.request.url)
    event.respondWith(
        caches.match(event.request).then(function(response) {
console.log(event.request.url, 'got from cache', response)
            return response || fetch(event.request);
        })
    );
});