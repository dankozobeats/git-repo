'use client'

/**
 * Toggle pour basculer entre dashboard mobile-first et classique
 * Stocke la préférence en localStorage
 */

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutGrid, Smartphone } from 'lucide-react'

type DashboardVersion = 'mobile' | 'classic'

export default function DashboardToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const [version, setVersion] = useState<DashboardVersion>('mobile')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Détecter la version depuis l'URL ou localStorage
    const isOnOldDashboard = pathname === '/dashboard-old'
    const saved = localStorage.getItem('dashboard_version') as DashboardVersion | null

    // Prioriser l'URL actuelle
    const detectedVersion = isOnOldDashboard ? 'classic' : (saved || 'mobile')
    setVersion(detectedVersion)
    setIsLoading(false)
  }, [pathname])

  const handleToggle = () => {
    const newVersion: DashboardVersion = version === 'mobile' ? 'classic' : 'mobile'
    setVersion(newVersion)
    localStorage.setItem('dashboard_version', newVersion)

    // Synchroniser avec les cookies
    document.cookie = `dashboard_version=${newVersion}; path=/; max-age=${60 * 60 * 24 * 365}`

    // Rediriger vers la bonne page
    if (newVersion === 'mobile') {
      window.location.href = '/'
    } else {
      window.location.href = '/dashboard-old'
    }
  }

  if (isLoading) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-white/5" />
    )
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10 active:scale-95"
      title={version === 'mobile' ? 'Passer à la version classique' : 'Passer à la version mobile'}
    >
      {version === 'mobile' ? (
        <>
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline">Mobile</span>
        </>
      ) : (
        <>
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Classique</span>
        </>
      )}
    </button>
  )
}
