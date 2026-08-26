// sw.js - Service Worker Interbank (Optimizado)
const CACHE_NAME = 'ibk-v3'; 

// Lista de archivos para carga instantánea y funcionamiento Offline
const urlsToCache = [
  './',
  './index.html',
  './inicio.html',
  './infoc.html',
  './config.html',
  './sobre.html',
  './styles.css',
  './manifest.json',
  // --- IMÁGENES EXTRAÍDAS DE TU CAPTURA ---
  './img/favicon.png',
  './img/beneficios.webp',
  './img/box-movements.webp',
  './img/cambios.jpg',
  './img/cards.png',
  './img/close-eye.svg',
  './img/condiciones.webp',
  './img/datos.webp',
  './img/finanzas.png',
  './img/flecha-icon.png',
  './img/for_you.jpg',
  './img/google.webp',
  './img/icon.webp',
  './img/interbank_wrdgas.webp',
  './img/inversiones.png',
  './img/logo.png',
  './img/noti.mp3',
  './img/open-eye.svg',
  './img/other.jpg',
  './img/para_ti.webp',
  './img/pencil-simple.svg',
  './img/pig.png',
  './img/pig-bg.png',
  './img/plane.png',
  './img/plin.jpg',
  './img/plin.png',
  './img/plin-voucher.webp',
  './img/qr.png',
  './img/recargas.svg',
  './img/retiros.jpg',
  './img/servicios.jpg',
  './img/symbol-money.svg',
  './img/target.jpg',
  './img/tarjeta.jpg',
  './img/transferencias.jpg'
];

// 1. INSTALACIÓN: Descarga todo a la memoria del celular
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Fallo en caché inicial:', err))
  );
});

// 2. ACTIVACIÓN: Limpia versiones antiguas de la app
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. INTERCEPTOR: Carga desde el caché (0 segundos)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});