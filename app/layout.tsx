// Layout racine App Router : gère l'auth Supabase, les scripts de garde et la navigation globale.
import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import DashboardSidebar, { type SidebarNavItem } from '@/components/DashboardSidebar'
import FloatingQuickActions from '@/components/FloatingQuickActions'
import { createClient } from '@/lib/supabase/server'

// Métadonnées exposées à la plateforme Next (SEO/icônes).
export const metadata: Metadata = {
  title: 'BadHabit Tracker 🔥',
  description: 'Track tes mauvaises (et bonnes) habitudes avec un peu de sarcasme.',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔥</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
}

// Liens principaux affichés dans le DashboardSidebar.
const mainNav: SidebarNavItem[] = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/reminders', label: 'Rappels', icon: 'reminders' },
  { href: '/reports/history', label: 'Historique', icon: 'history' },
  { href: '/report', label: 'Coach IA', icon: 'coach' },
  { href: '/habits/stats', label: 'Stats détaillées', icon: 'stats' },
]

// Liens utilitaires/secondaires accessibles depuis la colonne.
const utilityNav: SidebarNavItem[] = [
  { href: '/habits/new', label: 'Nouvelle habitude', icon: 'target' },
  { href: '/settings', label: 'Paramètres', icon: 'settings' },
  { href: '/reports/history#faq', label: 'Aide & support', icon: 'help' },
]

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Initialise le client Supabase serveur pour connaître l'état de session côté RSC.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userEmail = user?.email ?? 'invité@badhabit.app'
  const avatarInitial = (userEmail.charAt(0) || 'U').toUpperCase()
  const isAuthenticated = Boolean(user)

  // Rend le squelette HTML global en activant/désactivant les zones protégées selon la session.
  return (
    <html lang="fr">
      <body className="antialiased bg-[#0c0f1a] text-[#E0E0E0] overflow-visible">
        {/* Script inline qui synchronise localStorage/token avant hydratation. */}
        <Script id="auth-guard" strategy="beforeInteractive">
          {`// ==========================================
// 🔐 AUTH GUARD — Blocage si non connecté
// ==========================================
(function authGuard() {
  const hasServerSession = ${isAuthenticated ? 'true' : 'false'}
  const PUBLIC_ROUTES = ['/login', '/auth/sign-in', '/auth/callback', '/auth/reset', '/auth/update-password']
  const isPublicRoute = PUBLIC_ROUTES.some(route => window.location.pathname.startsWith(route))
  const hideProtectedUi = () => {
    document.getElementById('sidebar')?.classList.add('hidden')
    document.getElementById('floatingMenu')?.classList.add('hidden')
  }

  const showProtectedUi = () => {
    document.getElementById('sidebar')?.classList.remove('hidden')
    document.getElementById('floatingMenu')?.classList.remove('hidden')
  }

  let token = null
  try {
    token = window.localStorage.getItem('auth_token')
  } catch (_) {}

  if (isPublicRoute) {
    hideProtectedUi()
    try {
      window.localStorage.removeItem('auth_token')
    } catch (_) {}
    return
  }

  if (hasServerSession && !token) {
    try {
      window.localStorage.setItem('auth_token', 'active')
      token = window.localStorage.getItem('auth_token')
    } catch (_) {}
  }

  if (!hasServerSession || !token) {
    console.warn('⛔ Accès interdit — utilisateur non connecté')
    hideProtectedUi()
    try {
      window.localStorage.removeItem('auth_token')
    } catch (_) {}
    if (!isPublicRoute) {
      window.location.href = '/login'
    }
    return
  }

  showProtectedUi()

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      const newToken = window.localStorage.getItem('auth_token')
      if (!newToken) {
        hideProtectedUi()
        try {
          window.localStorage.removeItem('auth_token')
        } catch (_) {}
        if (!isPublicRoute) {
          window.location.href = '/login'
        }
      } else {
        showProtectedUi()
      }
    }
  })

  history.pushState(null, '', location.href)
  window.onpopstate = function () {
    history.pushState(null, '', location.href)
  }
})()`}
        </Script>
        {/* Synchronise le token local en fonction de l'état serveur détecté. */}
        {isAuthenticated ? (
          <Script id="auth-token-sync" strategy="afterInteractive">
            {`try {
  window.localStorage.setItem('auth_token', 'active')
  document.getElementById('sidebar')?.classList.remove('hidden')
  document.getElementById('floatingMenu')?.classList.remove('hidden')
} catch (_) {}`}
          </Script>
        ) : (
          <Script id="auth-token-clear" strategy="afterInteractive">
            {`try {
  window.localStorage.removeItem('auth_token')
  document.getElementById('sidebar')?.classList.add('hidden')
  document.getElementById('floatingMenu')?.classList.add('hidden')
} catch (_) {}`}
          </Script>
        )}
        <div className="min-h-screen overflow-visible">
          {isAuthenticated && (
            // Barre latérale uniquement visible lorsque l'utilisateur dispose d'une session active.
            <DashboardSidebar
              mainNav={mainNav}
              utilityNav={utilityNav}
              userEmail={userEmail}
              avatarInitial={avatarInitial}
            />
          )}
          {/* Décale le contenu lorsque la sidebar est rendue pour éviter un recouvrement. */}
          <div className={`${isAuthenticated ? 'md:ml-64 md:h-screen md:overflow-y-auto' : ''} pt-0`}>
            {children}
          </div>
          {isAuthenticated && <FloatingQuickActions />}
        </div>
      </body>
    </html>
  )
}
