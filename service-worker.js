// Basic Service Worker for Crumble PWA

// Install event: activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate event: claim clients immediately
self.addEventListener('activate', event => {
  self.clients.claim();
});

// Fetch event: simple passthrough for now, no caching
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});

// You can add caching or offline logic here if desired.
// See https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
