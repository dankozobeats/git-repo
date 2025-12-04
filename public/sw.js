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
    console.log('[SW] Push notification reçue')

    // Données par défaut si le payload est vide
    let notificationData = {
        title: 'BadHabit Tracker',
        body: 'Nouvelle notification',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        habitId: null,
        url: '/',
    }

    // Parse les données du push si disponibles
    if (event.data) {
        try {
            const data = event.data.json()
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || data.message || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                habitId: data.habitId || data.habit_id || null,
                url: data.url || (data.habitId ? `/habits/${data.habitId}` : notificationData.url),
                tag: data.tag || 'badhabit-notification',
                requireInteraction: data.requireInteraction || false,
                data: {
                    ...data,
                    habitId: data.habitId || data.habit_id || null,
                    url: data.url || (data.habitId ? `/habits/${data.habitId}` : notificationData.url),
                }, // Conserve toutes les données pour notificationclick
            }
        } catch (error) {
            console.error('[SW] Erreur lors du parsing des données push:', error)
        }
    }

    // Affiche la notification
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction,
            vibrate: [200, 100, 200], // Pattern de vibration
            data: notificationData.data, // Données accessibles au click
            actions: [
                {
                    action: 'open',
                    title: 'Ouvrir',
                },
                {
                    action: 'close',
                    title: 'Fermer',
                },
            ],
        })
    )
})

// ==========================================
// 👆 CLICK SUR UNE NOTIFICATION
// ==========================================
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification cliquée')

    // Ferme la notification
    event.notification.close()

    // Gère les actions (boutons)
    if (event.action === 'close') {
        return // Ne fait rien, juste fermer
    }

    // Récupère l'habitId depuis les données de la notification
    const habitId = event.notification.data?.habitId || event.notification.data?.habit_id
    const targetUrl = event.notification.data?.url || (habitId ? `/habits/${habitId}` : '/')

    // Détermine l'URL de destination
    const urlToOpen = targetUrl

    // Ouvre ou focus une fenêtre existante
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Cherche une fenêtre déjà ouverte avec l'URL cible
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i]
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus()
                }
            }

            // Si aucune fenêtre trouvée, ouvre une nouvelle fenêtre
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen)
            }
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
