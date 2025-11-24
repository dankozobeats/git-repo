import type { Metadata } from 'next'
import './globals.css'
import DashboardSidebar, { type SidebarNavItem } from '@/components/DashboardSidebar'
import FloatingQuickActions from '@/components/FloatingQuickActions'
import { createClient } from '@/lib/supabase/server'

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

const mainNav: SidebarNavItem[] = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/reports/history', label: 'Historique', icon: 'history' },
  { href: '/report', label: 'Coach IA', icon: 'coach' },
  { href: '/habits/stats', label: 'Stats détaillées', icon: 'stats' },
]

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
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userEmail = user?.email ?? 'invité@badhabit.app'
  const avatarInitial = (userEmail.charAt(0) || 'U').toUpperCase()
  const isAuthenticated = Boolean(user)

  return (
    <html lang="fr">
      <body className="antialiased bg-[#0c0f1a] text-[#E0E0E0]">
        <div className="min-h-screen md:overflow-hidden">
          {isAuthenticated && (
            <DashboardSidebar
              mainNav={mainNav}
              utilityNav={utilityNav}
              userEmail={userEmail}
              avatarInitial={avatarInitial}
            />
          )}
          <div className={`${isAuthenticated ? 'md:ml-64 md:h-screen md:overflow-y-auto' : ''} pt-0`}>
            {children}
          </div>
          {isAuthenticated && <FloatingQuickActions />}
        </div>
      </body>
    </html>
  )
}
