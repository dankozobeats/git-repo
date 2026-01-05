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

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, MoreVertical, LayoutGrid, List, Filter, Loader2, Info, Check, Plus, TrendingUp, Trash2 } from 'lucide-react'
import { formatTimeSince, formatDateTime } from '@/lib/utils/date'
import Link from 'next/link'
import { useDashboard } from '@/lib/habits/useDashboard'
import HabitQuickViewModal from './HabitQuickViewModal'

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
  const [quickViewHabit, setQuickViewHabit] = useState<{ id: string; name: string } | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showPatterns, setShowPatterns] = useState(false)

  // Handler pour supprimer une habitude
  const handleDelete = async (habitId: string, habitName: string) => {
    if (!confirm(`Supprimer "${habitName}" ?`)) return

    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')

      await mutate()
      router.refresh()
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Impossible de supprimer l\'habitude')
    }
  }

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

  // Détecter les patterns (calcul simple côté client pour démo)
  const patterns = useMemo(() => {
    const badHabits = habits.filter(h => h.type === 'bad')
    const detectedPatterns: any[] = []

    // Pattern: Effet domino
    const habitsByDay = badHabits.reduce((acc, h) => {
      if (h.lastActionDate) {
        if (!acc[h.lastActionDate]) acc[h.lastActionDate] = []
        acc[h.lastActionDate].push(h.name)
      }
      return acc
    }, {} as Record<string, string[]>)

    Object.entries(habitsByDay).forEach(([date, habitNames]) => {
      if (habitNames.length >= 2) {
        detectedPatterns.push({
          type: 'domino',
          title: 'Effet domino identifié',
          description: `${habitNames[0]} → ${habitNames[1]} (${habitNames.length} fois détecté)`,
          confidence: 90
        })
      }
    })

    // Pattern: Déclencheur potentiel
    badHabits.forEach(habit => {
      const relapseRate = habit.totalCount > 0 ? (habit.last7DaysCount / 7) * 100 : 0
      if (relapseRate > 80) {
        detectedPatterns.push({
          type: 'trigger',
          title: 'Déclencheur potentiel',
          description: `Quand tu sautes "${habit.name}", tu craques ${Math.round(relapseRate)}% du temps`,
          confidence: 85
        })
      }
    })

    return detectedPatterns
  }, [habits])

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
        return habit.riskLevel === 'danger' || habit.riskLevel === 'warning'
      default:
        return true
    }
  })

  const criticalHabits = filteredHabits
    .filter(h => h.riskLevel === 'danger' || h.riskLevel === 'warning')
    .slice(0, 3)
  const remainingHabits = filteredHabits.filter(h => !criticalHabits.includes(h))

  const handleQuickValidate = async (habitId: string, habitType: 'good' | 'bad') => {
    setLoadingHabit(habitId)
    try {
      const endpoint = habitType === 'bad'
        ? `/api/habits/${habitId}/events`
        : `/api/habits/${habitId}/check-in`

      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error('Validation failed')

      await mutate()
      router.refresh()
    } catch (error) {
      console.error('Erreur validation:', error)
    } finally {
      setLoadingHabit(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    )
  }

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
                  onOpenQuickView={() => setQuickViewHabit({ id: habit.id, name: habit.name })}
                  onOpenMenu={() => setOpenMenuId(openMenuId === habit.id ? null : habit.id)}
                  isMenuOpen={openMenuId === habit.id}
                  onCloseMenu={() => setOpenMenuId(null)}
                  onDelete={() => handleDelete(habit.id, habit.name)}
                />
              ))}
            </div>
          )}

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
                  onOpenQuickView={() => setQuickViewHabit({ id: habit.id, name: habit.name })}
                  onOpenMenu={() => setOpenMenuId(openMenuId === habit.id ? null : habit.id)}
                  isMenuOpen={openMenuId === habit.id}
                  onCloseMenu={() => setOpenMenuId(null)}
                  onDelete={() => handleDelete(habit.id, habit.name)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Patterns Section */}
      {patterns.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5">
          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <div>
                <h2 className="text-sm font-semibold text-white">Patterns détectés</h2>
                <p className="text-xs text-white/50">
                  {patterns.length} schéma{patterns.length > 1 ? 's' : ''} identifié{patterns.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {showPatterns ? (
              <ChevronUp className="h-5 w-5 text-white/50" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white/50" />
            )}
          </button>

          {showPatterns && (
            <div className="space-y-2 px-4 pb-4">
              {patterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-400" />
                        <h3 className="text-sm font-semibold text-white">{pattern.title}</h3>
                      </div>
                      <p className="mt-1 text-xs text-white/70">{pattern.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-purple-400">
                      {pattern.confidence}%
                    </span>
                  </div>
                </div>
              ))}

              {/* Boutons */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/habits/stats"
                  className="rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs font-semibold transition hover:bg-white/10"
                >
                  📈 Stats détaillées
                </Link>
                <Link
                  href="/dashboard-advanced"
                  className="rounded-lg border border-purple-500/20 bg-purple-500/10 py-2 text-center text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20"
                >
                  🧠 Patterns
                </Link>
              </div>
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

      {/* Quick View Modal */}
      {quickViewHabit && (
        <HabitQuickViewModal
          habitId={quickViewHabit.id}
          habitName={quickViewHabit.name}
          isOpen={true}
          onClose={() => setQuickViewHabit(null)}
        />
      )}
    </div>
  )
}

// Composant Habit Card
function HabitCard({
  habit,
  isLoading,
  onValidate,
  onOpenQuickView,
  onOpenMenu,
  isMenuOpen,
  onCloseMenu,
  onDelete,
}: {
  habit: any
  isLoading: boolean
  onValidate: () => void
  onOpenQuickView: () => void
  onOpenMenu: () => void
  isMenuOpen: boolean
  onCloseMenu: () => void
  onDelete: () => void
}) {
  const isBadHabit = habit.type === 'bad'
  const isDone = isBadHabit ? habit.todayCount === 0 : habit.todayCount > 0

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
              <p className="mt-1 text-xs text-white/60">
                {getRiskMessage()}
              </p>
              {habit.lastActionTimestamp && (
                <p className="mt-1 text-xs text-white/40">
                  {formatDateTime(habit.lastActionTimestamp, isBadHabit ? 'Dernier craquage :' : 'Dernière validation :')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onValidate}
                disabled={isLoading || (isBadHabit ? false : isDone)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition disabled:opacity-50 ${
                  isBadHabit
                    ? 'bg-red-600 hover:bg-red-700'
                    : isDone
                      ? 'bg-green-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={isBadHabit ? 'Signaler un craquage' : isDone ? 'Validé' : 'Valider'}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isBadHabit ? (
                  <Plus className="h-4 w-4" />
                ) : isDone ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={onOpenQuickView}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20"
                title="Vue rapide"
              >
                <Info className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenMenu()
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20"
                  title="Options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={onCloseMenu}
                    />
                    <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-white/10 bg-[#0d0f17] p-1 shadow-xl">
                      <Link
                        href={`/habits/${habit.id}`}
                        className="block rounded px-3 py-2 text-xs text-white/90 transition hover:bg-white/10"
                        onClick={onCloseMenu}
                      >
                        Voir détails
                      </Link>
                      <Link
                        href={`/habits/${habit.id}/edit`}
                        className="block rounded px-3 py-2 text-xs text-white/90 transition hover:bg-white/10"
                        onClick={onCloseMenu}
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onCloseMenu()
                          onDelete()
                        }}
                        className="w-full rounded px-3 py-2 text-left text-xs text-red-400 transition hover:bg-white/10"
                      >
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
