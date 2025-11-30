'use client'

/**
 * PWARegister Component
 * 
 * Enregistre automatiquement le Service Worker pour activer les fonctionnalités PWA :
 * - Installation de l'app sur l'écran d'accueil
 * - Notifications push en arrière-plan
 * - Cache offline (si implémenté dans le SW)
 * 
 * Ce composant ne rend rien visuellement, il s'exécute uniquement côté client.
 */

import { useEffect } from 'react'

export default function PWARegister() {
    useEffect(() => {
        // Vérifie si le navigateur supporte les Service Workers
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Enregistre le Service Worker après le chargement de la page
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope)

                        // Vérifie les mises à jour du SW toutes les heures
                        setInterval(() => {
                            registration.update()
                        }, 60 * 60 * 1000) // 1 heure
                    })
                    .catch((error) => {
                        console.error('[PWA] Échec de l\'enregistrement du Service Worker:', error)
                    })
            })

            // Écoute les mises à jour du Service Worker
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[PWA] Nouveau Service Worker activé - rechargement recommandé')
                // Optionnel : afficher un toast pour inviter l'utilisateur à recharger
            })
        } else {
            console.warn('[PWA] Service Workers non supportés par ce navigateur')
        }
    }, [])

    // Ce composant ne rend rien
    return null
}
