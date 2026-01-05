'use client'

/**
 * Toggle switch animé pour basculer entre dashboard Mobile et Classique
 * Design premium avec animation fluide et transition en fondu
 */

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Smartphone, LayoutGrid } from 'lucide-react'

type DashboardVersion = 'mobile' | 'classic'

export default function DashboardViewToggle() {
  const pathname = usePathname()
  const router = useRouter()
  const [version, setVersion] = useState<DashboardVersion>('classic')
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)

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

    // Afficher le loader
    setIsTransitioning(true)

    // Créer overlay de chargement
    const loader = document.createElement('div')
    loader.id = 'page-transition-loader'
    loader.className = 'fixed inset-0 z-50 flex items-center justify-center bg-[#01030a]/95 backdrop-blur-sm'
    loader.innerHTML = `
      <div class="flex flex-col items-center gap-4">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-blue-500"></div>
        <p class="text-sm text-white/60">Chargement...</p>
      </div>
    `
    document.body.appendChild(loader)

    // Petite pause pour animation puis navigation
    setTimeout(() => {
      if (newVersion === 'mobile') {
        router.push('/dashboard-mobile')
      } else {
        router.push('/dashboard-old')
      }
    }, 100)
  }

  // Nettoyer le loader et réinitialiser l'état au chargement
  useEffect(() => {
    // Supprimer le loader s'il existe
    const loader = document.getElementById('page-transition-loader')
    if (loader) {
      loader.style.opacity = '0'
      loader.style.transition = 'opacity 150ms ease-out'
      setTimeout(() => loader.remove(), 150)
    }

    // Réinitialiser l'état de transition
    setIsTransitioning(false)

    // Reset body opacity
    document.body.style.opacity = '1'
  }, [pathname])

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
            onClick={() => version !== 'classic' && !isTransitioning && handleToggle()}
            disabled={isTransitioning}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
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
            onClick={() => version !== 'mobile' && !isTransitioning && handleToggle()}
            disabled={isTransitioning}
            className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
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
          ? 'Vue complète avec toutes les habitudes'
          : 'Analyse intelligente et priorisation automatique'}
      </p>
    </div>
  )
}
