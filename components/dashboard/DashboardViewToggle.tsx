'use client'

/**
 * Toggle switch animé pour basculer entre dashboard Mobile et Classique
 * Design premium avec animation fluide
 */

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Smartphone, LayoutGrid } from 'lucide-react'

type DashboardVersion = 'mobile' | 'classic'

export default function DashboardViewToggle() {
  const pathname = usePathname()
  const [version, setVersion] = useState<DashboardVersion>('classic')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Détecter la version depuis l'URL ou localStorage
    const isOnOldDashboard = pathname === '/dashboard-old'
    const isOnMobileDashboard = pathname === '/dashboard-mobile'
    const saved = localStorage.getItem('dashboard-version') as DashboardVersion | null

    let detectedVersion: DashboardVersion
    if (isOnOldDashboard) {
      detectedVersion = 'classic'
    } else if (isOnMobileDashboard) {
      detectedVersion = 'mobile'
    } else {
      detectedVersion = saved || 'classic'
    }

    setVersion(detectedVersion)
    setIsLoading(false)
  }, [pathname])

  const handleToggle = () => {
    const newVersion: DashboardVersion = version === 'mobile' ? 'classic' : 'mobile'
    setVersion(newVersion)
    localStorage.setItem('dashboard-version', newVersion)

    // Rediriger avec transition fluide
    if (newVersion === 'mobile') {
      window.location.href = '/dashboard-mobile'
    } else {
      window.location.href = '/dashboard-old'
    }
  }

  if (isLoading) {
    return (
      <div className="h-11 w-full max-w-xs animate-pulse rounded-xl bg-white/5" />
    )
  }

  return (
    <div className="w-full max-w-xs">
      <div className="rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur">
        <div className="relative flex items-center gap-1">
          {/* Background slider */}
          <div
            className={`absolute inset-y-1 w-[calc(50%-2px)] rounded-lg bg-gradient-to-r transition-all duration-300 ${
              version === 'classic'
                ? 'left-1 from-purple-500 to-pink-500'
                : 'left-[calc(50%+1px)] from-blue-500 to-purple-500'
            }`}
          />

          {/* Vue simple button */}
          <button
            onClick={() => version !== 'classic' && handleToggle()}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              version === 'classic'
                ? 'text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Vue simple</span>
          </button>

          {/* Vue détaillée button */}
          <button
            onClick={() => version !== 'mobile' && handleToggle()}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              version === 'mobile'
                ? 'text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Vue détaillée</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="mt-2 text-center text-xs text-white/50">
        {version === 'classic'
          ? 'Toutes les habitudes avec statistiques complètes'
          : 'Priorités intelligentes et focus sur l\'essentiel'}
      </p>
    </div>
  )
}
