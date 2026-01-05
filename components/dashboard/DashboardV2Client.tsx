'use client'

/**
 * Dashboard V2 - Composant client qui orchestre l'affichage
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { useRiskAnalysis } from '@/lib/habits/useRiskAnalysis'
import { usePatternDetection } from '@/lib/habits/usePatternDetection'
import FocusAlert from './FocusAlert'
import RiskHabitCard from './RiskHabitCard'
import AdaptiveCoachMessage from './AdaptiveCoachMessage'
import PatternInsights from './PatternInsights'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']

type DashboardV2ClientProps = {
  habits: Habit[]
  logs: Log[]
  events: Event[]
  userId: string
}

export default function DashboardV2Client({
  habits,
  logs,
  events,
  userId,
}: DashboardV2ClientProps) {
  const router = useRouter()
  const { topRisks, remainingHabits, globalState } = useRiskAnalysis(habits, logs, events)
  const patternInsights = usePatternDetection(habits, logs, events)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Charger la préférence depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-advanced-view-mode')
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  // Sauvegarder la préférence dans localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('dashboard-advanced-view-mode', mode)
  }

  const handleQuickAction = async (
    habitId: string,
    action: 'validate' | 'relapse' | 'substitute'
  ) => {
    try {
      if (action === 'validate') {
        // Valider une bonne habitude pour aujourd'hui
        await fetch(`/api/habits/${habitId}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            value: 1,
          }),
        })
      } else if (action === 'relapse') {
        // Signaler un craquage
        await fetch(`/api/habits/${habitId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
          }),
        })
      } else if (action === 'substitute') {
        // Action de substitution - rediriger vers la page de l'habitude
        router.push(`/habits/${habitId}`)
        return
      }

      // Rafraîchir la page après l'action
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de l\'action rapide:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerte principale */}
      <FocusAlert globalState={globalState} />

      {/* Top 3 habitudes à risque */}
      {topRisks.length > 0 ? (
        <div className="space-y-4">
          {/* Header avec toggle */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Top 3 priorités aujourd'hui
            </h2>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cartes</span>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Liste</span>
              </button>
            </div>
          </div>
          <div className={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
            {topRisks.map(habit => (
              <RiskHabitCard
                key={habit.id}
                habit={habit}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-white/60">
            Aucune habitude active. Commence par en ajouter une!
          </p>
        </div>
      )}

      {/* Message du coach adaptatif */}
      <AdaptiveCoachMessage globalState={globalState} />

      {/* Autres habitudes à faire aujourd'hui */}
      {remainingHabits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Autres habitudes ({remainingHabits.length})
          </h2>
          <div className={viewMode === 'grid' ? 'grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}>
            {remainingHabits.map(habit => (
              <RiskHabitCard
                key={habit.id}
                habit={habit}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Patterns inconscients détectés */}
      <PatternInsights insights={patternInsights} />
    </div>
  )
}
