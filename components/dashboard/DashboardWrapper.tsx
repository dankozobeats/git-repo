'use client'

/**
 * Wrapper qui gère le switch entre Dashboard Classique et Mobile (nouveau)
 * - Sauvegarde la préférence dans localStorage
 * - Par défaut: version classique (old)
 * - Toggle animé pour switcher
 * - Optimisation: calcule les stats côté serveur pour éviter le fetch initial
 */

import { useState, useEffect, useMemo } from 'react'
import DashboardMobileClient from './DashboardMobileClient'
import DashboardMobileClientNew from './DashboardMobileClientNew'
import { Smartphone, LayoutGrid } from 'lucide-react'
import { computeDashboardStats } from '@/lib/habits/computeDashboardStats'

type DashboardVersion = 'classic' | 'new'

type DashboardWrapperProps = {
  userId: string
  habits: any[]
  logs: any[]
  events: any[]
}

export default function DashboardWrapper({ userId, habits, logs, events }: DashboardWrapperProps) {
  const [version, setVersion] = useState<DashboardVersion>('classic')
  const [isLoading, setIsLoading] = useState(true)

  // Pré-calculer les stats côté client pour éviter le fetch initial
  const initialDashboardData = useMemo(() => {
    return computeDashboardStats(habits, logs, events)
  }, [habits, logs, events])

  // Charger la préférence au montage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-version') as DashboardVersion | null
    setVersion(saved || 'classic') // Par défaut = classic
    setIsLoading(false)
  }, [])

  // Sauvegarder la préférence quand elle change
  const handleToggle = (newVersion: DashboardVersion) => {
    setVersion(newVersion)
    localStorage.setItem('dashboard-version', newVersion)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toggle Switch */}
      <div className="flex justify-center">
        <div className="w-full max-w-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur">
            <div className="relative flex items-center gap-1">
              {/* Background slider */}
              <div
                className={`absolute inset-y-1 w-[calc(50%-2px)] rounded-lg bg-gradient-to-r transition-all duration-300 ${
                  version === 'new'
                    ? 'left-1 from-blue-500 to-purple-500'
                    : 'left-[calc(50%+1px)] from-purple-500 to-pink-500'
                }`}
              />

              {/* New button (Mobile) */}
              <button
                onClick={() => handleToggle('new')}
                className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  version === 'new'
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Mobile</span>
              </button>

              {/* Classic button */}
              <button
                onClick={() => handleToggle('classic')}
                className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  version === 'classic'
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Classique</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="mt-2 text-center text-xs text-white/50">
            {version === 'new'
              ? 'Vue optimisée avec priorités intelligentes'
              : 'Vue complète avec toutes les habitudes'}
          </p>
        </div>
      </div>

      {/* Dashboard content */}
      {version === 'new' ? (
        <DashboardMobileClientNew userId={userId} initialData={initialDashboardData} />
      ) : (
        <DashboardMobileClient
          habits={habits}
          logs={logs}
          events={events}
          userId={userId}
        />
      )}
    </div>
  )
}
