// Minimal service worker — exists only so the browser will treat this as an
// installable PWA (Add to Home Screen). It does not cache API responses,
// so the briefing is always fetched fresh.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
self.addEventListener("fetch", () => {});
