// ==========================================
// 🔥 BADHABIT TRACKER - SERVICE WORKER
// ==========================================
// Gère les notifications push, le cache offline et l'installation PWA

const CACHE_NAME = 'badhabit-v1'
const STATIC_CACHE = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
]

// ==========================================
// 📦 INSTALLATION DU SERVICE WORKER
// ==========================================
self.addEventListener('install', (event) => {
    console.log('[SW] Installation en cours...')

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cache statique créé')
            return cache.addAll(STATIC_CACHE)
        }).catch((error) => {
            console.error('[SW] Erreur lors de la mise en cache:', error)
        })
    )

    // Force l'activation immédiate du nouveau SW
    self.skipWaiting()
})

// ==========================================
// ⚡ ACTIVATION DU SERVICE WORKER
// ==========================================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activation en cours...')

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Supprime les anciens caches
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Suppression de l\'ancien cache:', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )

    // Prend le contrôle immédiatement de toutes les pages
    return self.clients.claim()
})

// ==========================================
// 🌐 STRATÉGIE DE CACHE (Network First)
// ==========================================
self.addEventListener('fetch', (event) => {
    // Ignore les requêtes non-GET et les requêtes vers des domaines externes
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone la réponse car elle ne peut être consommée qu'une fois
                const responseToCache = response.clone()

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache)
                })

                return response
            })
            .catch(() => {
                // Si le réseau échoue, essaie de récupérer depuis le cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('[SW] Récupération depuis le cache:', event.request.url)
                        return cachedResponse
                    }

                    // Si pas de cache, retourne une page offline basique
                    return new Response('Offline - Pas de connexion internet', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain',
                        }),
                    })
                })
            })
    )
})

// ==========================================
// 🔔 RÉCEPTION DES NOTIFICATIONS PUSH
// ==========================================
self.addEventListener('push', (event) => {
    console.log('[SW] Événement PUSH reçu !', event)

    // Données par défaut
    let notificationData = {
        title: 'BadHabit Tracker',
        body: 'Nouvelle notification (fallback)',
        icon: '/web-app-manifest-192x192.png',
        badge: '/web-app-manifest-192x192.png',
        habitId: null,
        url: '/',
    }

    if (event.data) {
        try {
            const data = event.data.json()
            console.log('[SW] Payload JSON décodé:', data)
            notificationData.title = data.title || notificationData.title
            notificationData.body = data.body || data.message || notificationData.body
            notificationData.habitId = data.habitId || data.habit_id || null
            notificationData.url = data.url || (notificationData.habitId ? `/habits/${notificationData.habitId}` : '/')
        } catch (error) {
            console.warn('[SW] Échec du parsing JSON, tentative en texte...', error)
            notificationData.body = event.data.text() || notificationData.body
        }
    } else {
        console.warn('[SW] Aucun data dans l\'événement push')
    }

    console.log('[SW] Affichage de la notification:', notificationData.title)

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.habitId ? `habit-${notificationData.habitId}` : `push-${Date.now()}`,
            renotify: true,
            requireInteraction: true,
            data: notificationData,
            vibrate: [200, 100, 200, 100, 200], // WhatsApp-style
            actions: [
                { action: 'done', title: '✅ Fait' },
                { action: 'open', title: '🔗 Ouvrir' }
            ]
        }).then(() => {
            console.log('[SW] Notification affichée avec succès')
        }).catch(err => {
            console.error('[SW] Erreur lors de showNotification:', err)
        })
    )
})

// ==========================================
// 👆 CLICK SUR UNE NOTIFICATION
// ==========================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification cliquée, action:', event.action)

    event.notification.close()

    const notificationData = event.notification.data
    const habitId = notificationData?.habitId || notificationData?.habit_id
    const targetUrl = notificationData?.url || (habitId ? `/habits/${habitId}` : '/')

    if (event.action === 'done' && habitId) {
        // Optionnel : Appel API pour marquer comme fait en arrière-plan
        event.waitUntil(
            fetch('/api/habits/log-fast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitId })
            }).then(r => console.log('[SW] Log rapide effectué'))
                .catch(e => console.error('[SW] Erreur log rapide:', e))
        )
        return
    }

    // Par défaut (ou action 'open') : Focus/Ouvrir la fenêtre
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i]
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus()
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl)
        })
    )
})

// ==========================================
// 🔄 SYNCHRONISATION EN ARRIÈRE-PLAN (optionnel)
// ==========================================
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag)

    if (event.tag === 'sync-habits') {
        event.waitUntil(
            // Ici, tu peux synchroniser les données en arrière-plan
            // Par exemple, envoyer les logs en attente au serveur
            fetch('/api/sync')
                .then((response) => response.json())
                .then((data) => {
                    console.log('[SW] Sync réussie:', data)
                })
                .catch((error) => {
                    console.error('[SW] Erreur de sync:', error)
                })
        )
    }
})

console.log('[SW] Service Worker chargé et prêt')
