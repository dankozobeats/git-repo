// Layout racine App Router : gère l'auth Supabase et la navigation globale.
import type { Metadata } from 'next'
import './globals.css'
import DashboardSidebar, { type SidebarNavItem } from '@/components/DashboardSidebar'
import FloatingQuickActions from '@/components/FloatingQuickActions'
import AuthSync from '@/components/AuthSync'
import PWARegister from '@/components/PWARegister'
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
  { href: '/aide', label: 'Aide & support', icon: 'help' },
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
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#0c0f1a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BadHabit" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
      </head>
      <body className="antialiased bg-[#0c0f1a] text-[#E0E0E0] overflow-visible">
        {/* Composant AuthSync : gère la synchronisation auth serveur/client */}
        <AuthSync isAuthenticated={isAuthenticated} />

        {/* Composant PWARegister : enregistre le service worker */}
        <PWARegister />

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
