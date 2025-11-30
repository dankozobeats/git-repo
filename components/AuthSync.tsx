'use client'

/**
 * AuthSync Component
 * 
 * Gère la synchronisation de l'état d'authentification entre le serveur et le client.
 * Remplace les scripts inline auth-guard et auth-token-sync pour éviter les race conditions.
 * 
 * Responsabilités :
 * 1. Synchroniser le token localStorage avec l'état serveur
 * 2. Afficher/masquer le sidebar et le menu flottant selon l'authentification
 * 3. Rediriger vers /login si non authentifié sur une route protégée
 * 4. Gérer le back-button (empêcher le retour arrière après logout)
 * 
 * @param isAuthenticated - État d'authentification côté serveur (SSR)
 */

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type AuthSyncProps = {
    isAuthenticated: boolean
}

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = ['/login', '/auth/sign-in', '/auth/callback', '/auth/reset', '/auth/update-password']

export default function AuthSync({ isAuthenticated }: AuthSyncProps) {
    const pathname = usePathname()
    const router = useRouter()
    const hasInitialized = useRef(false)

    useEffect(() => {
        // Évite les exécutions multiples en mode strict
        if (hasInitialized.current) return
        hasInitialized.current = true

        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

        /**
         * Fonction utilitaire pour afficher les éléments protégés
         */
        const showProtectedUI = () => {
            const sidebar = document.getElementById('sidebar')
            const floatingMenu = document.getElementById('floatingMenu')

            if (sidebar) sidebar.classList.remove('hidden')
            if (floatingMenu) floatingMenu.classList.remove('hidden')
        }

        /**
         * Fonction utilitaire pour masquer les éléments protégés
         */
        const hideProtectedUI = () => {
            const sidebar = document.getElementById('sidebar')
            const floatingMenu = document.getElementById('floatingMenu')

            if (sidebar) sidebar.classList.add('hidden')
            if (floatingMenu) floatingMenu.classList.add('hidden')
        }

        /**
         * LOGIQUE PRINCIPALE DE SYNCHRONISATION
         */

        // CAS 1 : Route publique (login, reset password, etc.)
        if (isPublicRoute) {
            hideProtectedUI()
            try {
                localStorage.removeItem('auth_token')
            } catch (error) {
                console.warn('[AuthSync] localStorage non disponible:', error)
            }
            return
        }

        // CAS 2 : Utilisateur authentifié côté serveur
        if (isAuthenticated) {
            // Synchroniser le token dans localStorage
            try {
                localStorage.setItem('auth_token', 'active')
            } catch (error) {
                console.warn('[AuthSync] Impossible d\'écrire dans localStorage:', error)
            }

            // Afficher immédiatement le sidebar et le menu flottant
            showProtectedUI()
            return
        }

        // CAS 3 : Utilisateur NON authentifié sur route protégée
        // Vérifier si un token existe quand même (edge case)
        let hasToken = false
        try {
            hasToken = Boolean(localStorage.getItem('auth_token'))
        } catch (error) {
            console.warn('[AuthSync] localStorage non disponible:', error)
        }

        if (!hasToken) {
            // Pas de session serveur ET pas de token → redirection
            console.warn('[AuthSync] Accès non autorisé - redirection vers /login')
            hideProtectedUI()
            try {
                localStorage.removeItem('auth_token')
            } catch (error) {
                // Ignore
            }
            router.push('/login')
            return
        }

        // Si on arrive ici, il y a un token mais pas de session serveur
        // C'est un état incohérent → on fait confiance au serveur
        hideProtectedUI()
        try {
            localStorage.removeItem('auth_token')
        } catch (error) {
            // Ignore
        }
        router.push('/login')
    }, [isAuthenticated, pathname, router])

    /**
     * Gestion du bouton "Retour" du navigateur
     * Empêche l'utilisateur de revenir en arrière après déconnexion
     */
    useEffect(() => {
        if (!isAuthenticated) return

        // Ajoute une entrée dans l'historique pour bloquer le retour
        window.history.pushState(null, '', window.location.href)

        const handlePopState = () => {
            // Re-push l'état actuel pour empêcher le retour
            window.history.pushState(null, '', window.location.href)
        }

        window.addEventListener('popstate', handlePopState)

        return () => {
            window.removeEventListener('popstate', handlePopState)
        }
    }, [isAuthenticated])

    /**
     * Gestion du cache bfcache (back-forward cache)
     * Vérifie le token quand la page est restaurée depuis le cache
     */
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                // La page a été restaurée depuis le bfcache
                let hasToken = false
                try {
                    hasToken = Boolean(localStorage.getItem('auth_token'))
                } catch (error) {
                    // Ignore
                }

                if (!hasToken && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
                    // Token disparu → redirection
                    router.push('/login')
                }
            }
        }

        window.addEventListener('pageshow', handlePageShow)

        return () => {
            window.removeEventListener('pageshow', handlePageShow)
        }
    }, [pathname, router])

    // Ce composant ne rend rien visuellement
    return null
}
