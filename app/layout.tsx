// Layout racine App Router : gère l'auth Supabase et la navigation globale.
import type { Metadata } from 'next'
import './globals.css'
import DashboardSidebar, { type SidebarNavItem } from '@/components/DashboardSidebar'
import AuthSync from '@/components/AuthSync'
import PWARegister from '@/components/PWARegister'
import { createClient } from '@/lib/supabase/server'

// Métadonnées exposées à la plateforme Next (SEO/OpenGraph/Twitter).
export const metadata: Metadata = {
  // Base metadata
  title: 'BadHabit Tracker',
  description: 'Track tes mauvaises (et bonnes) habitudes avec un peu de sarcasme.',

  // Base URL pour les chemins relatifs
  metadataBase: new URL('https://my-badhabit-tracker.vercel.app'),

  // Favicons (déjà configurés dans <head>)
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔥</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },

  // OpenGraph - Partage sur réseaux sociaux
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://my-badhabit-tracker.vercel.app',
    siteName: 'BadHabit Tracker',
    title: 'BadHabit Tracker • Track, Improve, Evolve Your Habits',
    description: 'Suivez vos mauvaises habitudes, transformez-les en bonnes pratiques et évoluez grâce à un suivi intelligent et motivant. Commencez dès maintenant !',
    images: [
      {
        url: 'https://my-badhabit-tracker.vercel.app/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'BadHabit Tracker - Track • Improve • Evolve',
        type: 'image/jpeg',
      },
    ],
  },

  // Twitter Card - Aperçu sur Twitter/X
  twitter: {
    card: 'summary_large_image',
    site: '@badhabit',
    creator: '@badhabit',
    title: 'BadHabit Tracker • Track, Improve, Evolve Your Habits',
    description: 'Suivez vos mauvaises habitudes, transformez-les en bonnes pratiques et évoluez grâce à un suivi intelligent et motivant.',
    images: ['https://my-badhabit-tracker.vercel.app/og-default.jpg'],
  },

  // URL canonique
  alternates: {
    canonical: '/',
  },
}

// Liens principaux - Organisation logique: Consulter → Agir → Configurer
const mainNav: SidebarNavItem[] = [
  // Section Vision & Pilotage
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/trackables', label: 'Trackables (Nouveau)', icon: 'target' },
  { href: '/dashboard-advanced', label: 'Analyse comportementale', icon: 'stats' },
  { href: '/habits/stats', label: 'Stats détaillées', icon: 'stats' },
  { href: '/reports/strategic', label: 'Rapport stratégique', icon: 'stats' },
  { href: '/reports/temporal', label: 'Rapport temporel', icon: 'stats' },
  { href: '/reports/ai', label: 'Rapport IA', icon: 'stats' },
  { href: '/reports/history', label: 'Historique', icon: 'history' },
  { href: '/agenda', label: 'Agenda global', icon: 'agenda' },

  // Section Actions & Outils
  { href: '/habits/new', label: 'Nouvelle habitude', icon: 'target' },
  { href: '/reminders', label: 'Rappels', icon: 'reminders' },
  { href: '/report', label: 'Coach IA', icon: 'coach' },
]

// Liens utilitaires - Toujours accessibles en bas
const utilityNav: SidebarNavItem[] = [
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

        {/* Favicons */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#0c0f1a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BadHabit" />
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
              isAuthenticated={isAuthenticated}
            />
          )}
          {/* Décale le contenu lorsque la sidebar est rendue pour éviter un recouvrement. */}
          <div className={`${isAuthenticated ? 'md:ml-64 md:h-screen md:overflow-y-auto' : ''} pt-0`}>
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
