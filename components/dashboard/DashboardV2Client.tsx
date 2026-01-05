'use client'

/**
 * Dashboard V2 - Composant client qui orchestre l'affichage
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, List, Filter } from 'lucide-react'
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
type FilterType = 'all' | 'validated' | 'not_validated' | 'to_do'

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
  const [filter, setFilter] = useState<FilterType>('to_do')

  // Charger la préférence depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-advanced-view-mode')
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
    const savedFilter = localStorage.getItem('dashboard-advanced-filter')
    if (savedFilter === 'all' || savedFilter === 'validated' || savedFilter === 'not_validated' || savedFilter === 'to_do') {
      setFilter(savedFilter)
    }
  }, [])

  // Sauvegarder la préférence dans localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('dashboard-advanced-view-mode', mode)
  }

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
    localStorage.setItem('dashboard-advanced-filter', newFilter)
  }

  // Filtrer les habitudes selon le filtre sélectionné
  const allHabits = [...topRisks, ...remainingHabits]
  const filteredHabits = allHabits.filter(habit => {
    switch (filter) {
      case 'all':
        return true
      case 'validated':
        if (habit.type === 'good') {
          return habit.isDoneToday
        } else {
          return habit.todayCount === 0
        }
      case 'not_validated':
        if (habit.type === 'good') {
          return !habit.isDoneToday
        } else {
          return habit.todayCount > 0
        }
      case 'to_do':
        return habit.riskLevel === 'critical' || habit.riskLevel === 'warning'
      default:
        return true
    }
  })

  const displayedTopRisks = filteredHabits.slice(0, 3)
  const displayedRemainingHabits = filteredHabits.slice(3)

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

      {/* Filtres et habitudes */}
      <div className="space-y-4">
        {/* Header avec filtres et toggle vue */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Mes habitudes ({filteredHabits.length})
          </h2>
          <div className="flex items-center gap-2">
            {/* Filtres */}
            <div className="flex gap-1 overflow-x-auto">
              <button
                onClick={() => handleFilterChange('to_do')}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  filter === 'to_do'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Filter className="inline h-3 w-3 mr-1" />
                À faire
              </button>
              <button
                onClick={() => handleFilterChange('validated')}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  filter === 'validated'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                ✓ Validées
              </button>
              <button
                onClick={() => handleFilterChange('not_validated')}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  filter === 'not_validated'
                    ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                ✗ Non validées
              </button>
              <button
                onClick={() => handleFilterChange('all')}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  filter === 'all'
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                Toutes
              </button>
            </div>

            {/* Toggle vue */}
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
        </div>

        {/* Top 3 priorités */}
        {displayedTopRisks.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
            {displayedTopRisks.map(habit => (
              <RiskHabitCard
                key={habit.id}
                habit={habit}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        ) : filteredHabits.length === 0 && habits.length > 0 ? (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-8 text-center">
            <span className="text-3xl">🔍</span>
            <p className="mt-2 text-sm font-semibold text-blue-200">
              Aucune habitude dans ce filtre
            </p>
            <p className="mt-1 text-xs text-white/60">
              Essaie un autre filtre pour voir tes habitudes
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-white/60">
              Aucune habitude active. Commence par en ajouter une!
            </p>
          </div>
        )}
      </div>

      {/* Message du coach adaptatif */}
      <AdaptiveCoachMessage globalState={globalState} />

      {/* Autres habitudes */}
      {displayedRemainingHabits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Autres habitudes ({displayedRemainingHabits.length})
          </h2>
          <div className={viewMode === 'grid' ? 'grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}>
            {displayedRemainingHabits.map(habit => (
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
