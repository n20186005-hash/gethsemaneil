/* Retire the legacy cache, including old HTML and weather responses. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('gethsemane-')).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
/* No request interception: unavailable pages and weather stay unavailable. */
