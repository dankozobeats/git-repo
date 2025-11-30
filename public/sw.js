// public/sw.js
// Service Worker for Bad Habit Tracker
// Must be pure JavaScript (no TypeScript types)

self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
    console.log('[SW] Push event received', event);

    let data = { title: 'Rappel', body: 'Vous avez un nouveau rappel' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('[SW] Error parsing push data', e);
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icon.png', // Ensure this exists in public/
        badge: '/badge.png', // Ensure this exists in public/
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification click received.');
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
