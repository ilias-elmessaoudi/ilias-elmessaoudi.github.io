// Aufraeumer: Hier lag frueher der Offline-Speicher von KXD Office (Bereich „/“).
// Geraete, die ihn noch haben, holen sich beim naechsten Update diese Fassung: sie loescht ihre
// Zwischenspeicher und meldet sich selbst ab. KXD Office liegt jetzt unter /office/.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('document-editor-') || name.startsWith('document-assistant-')) await caches.delete(name);
    await self.registration.unregister();
  })());
});
