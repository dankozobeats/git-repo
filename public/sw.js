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
        icon: '/icon.png',
        badge: '/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
            habitId: data.habitId // Pass the habitId from payload to notification
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification click received.');
    event.notification.close();

    const habitId = event.notification.data?.habitId;
    const urlToOpen = habitId ? `/habits/${habitId}` : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
