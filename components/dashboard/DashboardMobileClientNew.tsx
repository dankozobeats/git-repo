/**
 * Dashboard Mobile Client - VERSION REFACTORISÉE
 *
 * Architecture serveur-first :
 * - Fetch data depuis /api/dashboard via useDashboard hook
 * - Pas de calculs côté client (stats déjà calculées par le serveur)
 * - Cache intelligent avec SWR
 * - Loading states et error handling
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, MoreVertical, LayoutGrid, List, Filter, Loader2 } from 'lucide-react'
import { formatTimeSince, formatDateTime } from '@/lib/utils/date'
import Link from 'next/link'
import { useDashboard } from '@/lib/habits/useDashboard'

type FilterType = 'all' | 'validated' | 'not_validated' | 'to_do'

type DashboardMobileClientNewProps = {
  userId: string
}

export default function DashboardMobileClientNew({ userId }: DashboardMobileClientNewProps) {
  const router = useRouter()
  const { habits, summary, isLoading, isError, mutate } = useDashboard()

  const [filter, setFilter] = useState<FilterType>('to_do')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [loadingHabit, setLoadingHabit] = useState<string | null>(null)

  // Charger les préférences depuis localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('dashboard-view-mode')
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode)
    }
    const savedFilter = localStorage.getItem('dashboard-filter')
    if (savedFilter === 'all' || savedFilter === 'validated' || savedFilter === 'not_validated' || savedFilter === 'to_do') {
      setFilter(savedFilter)
    }
  }, [])

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('dashboard-view-mode', mode)
  }

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
    localStorage.setItem('dashboard-filter', newFilter)
  }

  // Filtrer les habitudes
  const filteredHabits = habits.filter(habit => {
    switch (filter) {
      case 'all':
        return true
      case 'validated':
        return habit.type === 'good' ? habit.todayCount > 0 : habit.todayCount === 0
      case 'not_validated':
        return habit.type === 'good' ? habit.todayCount === 0 : habit.todayCount > 0
      case 'to_do':
        // Afficher les habitudes à risque
        return habit.riskLevel === 'danger' || habit.riskLevel === 'warning'
      default:
        return true
    }
  })

  // Séparer en prioritaire (top 3 danger/warning) et reste
  const criticalHabits = filteredHabits
    .filter(h => h.riskLevel === 'danger' || h.riskLevel === 'warning')
    .slice(0, 3)
  const remainingHabits = filteredHabits.filter(h => !criticalHabits.includes(h))

  // Handler pour valider une habitude
  const handleQuickValidate = async (habitId: string, habitType: 'good' | 'bad') => {
    setLoadingHabit(habitId)
    try {
      const endpoint = habitType === 'bad'
        ? `/api/habits/${habitId}/events`
        : `/api/habits/${habitId}/check-in`

      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error('Validation failed')

      // Revalider les données du dashboard
      await mutate()

      router.refresh()
    } catch (error) {
      console.error('Erreur validation:', error)
    } finally {
      setLoadingHabit(null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-6 text-center">
        <p className="font-semibold text-red-300">Erreur de chargement</p>
        <button
          onClick={() => mutate()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold transition hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    )
  }

  // Empty state
  if (habits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
        <p className="text-lg font-semibold">Commence par créer une habitude</p>
        <p className="mt-2 text-sm text-white/60">
          Choisis un objectif ou une mauvaise habitude à surveiller
        </p>
        <Link
          href="/habits/new"
          className="mt-4 inline-block rounded-xl bg-[#FF4D4D] px-6 py-3 text-sm font-semibold transition active:scale-95"
        >
          Créer ma première habitude
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-wide text-white/60">Total</p>
          <p className="mt-1 text-2xl font-bold">{summary.totalHabits}</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-green-300/80">Bonnes</p>
          <p className="mt-1 text-2xl font-bold text-green-300">{summary.goodHabitsLoggedToday}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-red-300/80">Craquages</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{summary.badHabitsLoggedToday}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-300/80">Actions</p>
          <p className="mt-1 text-2xl font-bold text-blue-300">{summary.totalGoodActions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 flex-shrink-0 text-white/40" />
        {[
          { value: 'to_do' as const, label: 'À faire', count: habits.filter(h => h.riskLevel === 'danger' || h.riskLevel === 'warning').length },
          { value: 'all' as const, label: 'Tout', count: habits.length },
          { value: 'validated' as const, label: 'Validées', count: habits.filter(h => h.type === 'good' ? h.todayCount > 0 : h.todayCount === 0).length },
          { value: 'not_validated' as const, label: 'Non validées', count: habits.filter(h => h.type === 'good' ? h.todayCount === 0 : h.todayCount > 0).length },
        ].map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === value
                ? 'bg-blue-600 text-white'
                : 'border border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Habits List */}
      {filteredHabits.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-white/60">Aucune habitude dans ce filtre</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Critical Habits (top 3) */}
          {criticalHabits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                🔥 Priorités ({criticalHabits.length})
              </h2>
              {criticalHabits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isLoading={loadingHabit === habit.id}
                  onValidate={() => handleQuickValidate(habit.id, habit.type)}
                />
              ))}
            </div>
          )}

          {/* Remaining Habits */}
          {remainingHabits.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Autres habitudes ({remainingHabits.length})
              </h2>
              {remainingHabits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isLoading={loadingHabit === habit.id}
                  onValidate={() => handleQuickValidate(habit.id, habit.type)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Debug info */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-xs font-mono text-white/50">
          ✅ Stats serveur - Source: /api/dashboard | Cache: SWR 30s
        </p>
      </div>
    </div>
  )
}

// Composant Habit Card
function HabitCard({
  habit,
  isLoading,
  onValidate,
}: {
  habit: any
  isLoading: boolean
  onValidate: () => void
}) {
  const isBadHabit = habit.type === 'bad'
  const isDone = isBadHabit ? habit.todayCount === 0 : habit.todayCount > 0

  // Générer le message de risque comme dans l'ancien dashboard
  const getRiskMessage = () => {
    if (isBadHabit) {
      if (habit.todayCount > 0) {
        return `${habit.todayCount} craquage${habit.todayCount > 1 ? 's' : ''} aujourd'hui`
      }
      if (habit.currentStreak > 0) {
        return `${habit.currentStreak} jour${habit.currentStreak > 1 ? 's' : ''} sans craquage`
      }
      if (habit.lastActionDate) {
        const daysAgo = Math.floor((new Date().getTime() - new Date(habit.lastActionDate).getTime()) / (1000 * 60 * 60 * 24))
        return daysAgo === 0 ? 'Dernier craquage aujourd\'hui' : `Pas de craquage depuis ${daysAgo}j`
      }
      return 'Aucun craquage enregistré'
    } else {
      // Bonne habitude
      if (habit.todayCount > 0) {
        return `Validée ${habit.todayCount} fois aujourd'hui`
      }
      if (habit.lastActionDate) {
        const daysAgo = Math.floor((new Date().getTime() - new Date(habit.lastActionDate).getTime()) / (1000 * 60 * 60 * 24))
        if (daysAgo === 0) {
          return 'Pas fait aujourd\'hui'
        } else if (daysAgo === 1) {
          return 'Pas fait depuis hier'
        } else {
          return `Pas fait depuis ${daysAgo} jours`
        }
      }
      return 'Pas encore fait'
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        habit.riskLevel === 'danger'
          ? 'border-red-500/50 bg-red-500/10'
          : habit.riskLevel === 'warning'
            ? 'border-yellow-500/50 bg-yellow-500/10'
            : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: habit.color + '20' }}
        >
          {habit.icon || '🎯'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href={`/habits/${habit.id}`} className="font-semibold hover:underline">
                {habit.name}
              </Link>

              {/* Message de risque */}
              <p className="mt-1 text-xs text-white/60">
                {getRiskMessage()}
              </p>

              {/* Dernière validation avec formatage détaillé */}
              {habit.lastActionTimestamp && (
                <p className="mt-1 text-xs text-white/40">
                  {formatDateTime(habit.lastActionTimestamp, isBadHabit ? 'Dernier craquage :' : 'Dernière validation :')}
                </p>
              )}
            </div>
            <button
              onClick={onValidate}
              disabled={isLoading || (isBadHabit ? false : isDone)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                isBadHabit
                  ? 'bg-red-600 hover:bg-red-700'
                  : isDone
                    ? 'bg-green-600'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? '...' : isBadHabit ? '+ Craquage' : isDone ? '✓' : 'Valider'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
