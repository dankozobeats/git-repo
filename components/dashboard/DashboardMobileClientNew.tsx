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
import { ChevronDown, ChevronUp, MoreVertical, Loader2, Info, Check, Plus, TrendingUp, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useDashboard } from '@/lib/habits/useDashboard'
import HabitQuickViewModal from './HabitQuickViewModal'

type FilterType = 'all' | 'validated' | 'not_validated' | 'to_do'

type DashboardMobileClientNewProps = {
  userId: string
  initialData?: {
    habits: any[]
    summary: any
  }
}

export default function DashboardMobileClientNew({ userId, initialData }: DashboardMobileClientNewProps) {
  const router = useRouter()
  const { habits, summary, isLoading, isError, mutate } = useDashboard(initialData)

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
          confidence: 90,
        })
      }
    })

    // Pattern: Récurrence temporelle
    const dayOfWeekCounts = badHabits.reduce((acc, h) => {
      if (h.lastActionDate) {
        const day = new Date(h.lastActionDate).getDay()
        acc[day] = (acc[day] || 0) + 1
      }
      return acc
    }, {} as Record<number, number>)

    const entries = Object.entries(dayOfWeekCounts)
    if (entries.length > 0) {
      const maxDay = entries.reduce((a, b) => (b[1] > a[1] ? b : a))
      if (maxDay[1] >= 3) {
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
        const dayIndex = parseInt(maxDay[0])
        detectedPatterns.push({
          type: 'temporal',
          title: 'Jour critique identifié',
          description: `Les craquages se concentrent le ${dayNames[dayIndex]}`,
          confidence: 85,
        })
      }
    }

    return detectedPatterns
  }, [habits])

  // Filtrer les habitudes selon le filtre actif
  const filteredHabits = useMemo(() => {
    if (filter === 'all') return habits

    if (filter === 'to_do') {
      return habits.filter(h => h.riskLevel === 'danger' || h.riskLevel === 'warning')
    }

    if (filter === 'validated') {
      return habits.filter(h => {
        const isBadHabit = h.type === 'bad'
        return isBadHabit ? h.todayCount === 0 : h.todayCount > 0
      })
    }

    if (filter === 'not_validated') {
      return habits.filter(h => {
        const isBadHabit = h.type === 'bad'
        return isBadHabit ? h.todayCount > 0 : h.todayCount === 0
      })
    }

    return habits
  }, [habits, filter])

  // Séparer les habitudes critiques des autres
  const criticalHabits = filteredHabits.filter(h => h.riskLevel === 'danger')
  const remainingHabits = filteredHabits.filter(h => h.riskLevel !== 'danger')

  // Handler de validation rapide
  const handleQuickValidate = async (habitId: string, habitType: string) => {
    setLoadingHabit(habitId)

    try {
      const res = await fetch(`/api/habits/${habitId}/check-in`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        // Gérer le cas où le goal est atteint (erreur 400)
        if (res.status === 400 && data.goalReached) {
          alert(`✅ Goal quotidien déjà atteint! (${data.count}/${data.counterRequired})`)
        } else {
          throw new Error(data.error || 'Validation failed')
        }
        return
      }

      await mutate()
      router.refresh()
    } catch (error) {
      console.error('Erreur validation:', error)
      alert('Impossible de valider l\'habitude')
    } finally {
      setLoadingHabit(null)
    }
  }

  if (isLoading && !initialData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-6 text-center">
        <p className="text-sm text-red-300">Erreur lors du chargement du dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary - Design moderne avec cartes compactes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">Bonnes</p>
          <p className="mt-1.5 text-3xl font-bold text-green-400">{summary.goodHabitsLoggedToday}</p>
          <p className="mt-0.5 text-xs text-white/40">sur {summary.goodHabitsCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">Craquages</p>
          <p className="mt-1.5 text-3xl font-bold text-red-400">{summary.badHabitsLoggedToday}</p>
          <p className="mt-0.5 text-xs text-white/40">aujourd'hui</p>
        </div>
      </div>

      {/* Filters - Pills style moderne */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { value: 'to_do' as const, label: 'À faire', emoji: '🎯', count: habits.filter(h => h.riskLevel === 'danger' || h.riskLevel === 'warning').length },
          { value: 'all' as const, label: 'Tout', emoji: '📋', count: habits.length },
          { value: 'validated' as const, label: 'Validées', emoji: '✅', count: habits.filter(h => h.type === 'good' ? h.todayCount > 0 : h.todayCount === 0).length },
          { value: 'not_validated' as const, label: 'Non faites', emoji: '⏳', count: habits.filter(h => h.type === 'good' ? h.todayCount === 0 : h.todayCount > 0).length },
        ].map(({ value, label, emoji, count }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              filter === value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:scale-105'
            }`}
          >
            <span className="mr-1.5">{emoji}</span>
            {label} <span className="ml-1 opacity-60">({count})</span>
          </button>
        ))}
      </div>

      {/* Habits List */}
      {filteredHabits.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-white/60">Aucune habitude dans ce filtre</p>
        </div>
      ) : (
        <div className="space-y-8">
          {criticalHabits.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <h2 className="text-base font-bold uppercase tracking-wide text-red-400">
                  Priorités ({criticalHabits.length})
                </h2>
              </div>
              <div className="space-y-3">
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
            </div>
          )}

          {remainingHabits.length > 0 && (
            <div className="space-y-3">
              {criticalHabits.length > 0 && (
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white/50">
                  Autres habitudes ({remainingHabits.length})
                </h2>
              )}
              <div className="space-y-3">
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
            </div>
          )}
        </div>
      )}

      {/* Patterns Section */}
      {patterns.length > 0 && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 backdrop-blur-sm">
          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <div>
                <h2 className="text-base font-bold text-white">Patterns détectés</h2>
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
            <div className="space-y-3 px-5 pb-5">
              {patterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-400" />
                        <h3 className="text-sm font-semibold text-white">{pattern.title}</h3>
                      </div>
                      <p className="mt-1.5 text-sm text-white/70">{pattern.description}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-300">
                      {pattern.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewHabit && (
        <HabitQuickViewModal
          isOpen={true}
          habitId={quickViewHabit.id}
          habitName={quickViewHabit.name}
          onClose={() => setQuickViewHabit(null)}
        />
      )}
    </div>
  )
}

// Composant Habit Card - Design moderne avec meilleure hiérarchie
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
  const router = useRouter()
  const isBadHabit = habit.type === 'bad'
  const isDone = isBadHabit ? habit.todayCount === 0 : habit.todayCount > 0

  const getRiskMessage = () => {
    if (isBadHabit) {
      if (habit.todayCount > 0) {
        return `${habit.todayCount} craquage${habit.todayCount > 1 ? 's' : ''} aujourd'hui`
      }
      if (habit.currentStreak > 0) {
        return `${habit.currentStreak}j sans craquage`
      }
      return 'Aucun craquage'
    } else {
      if (habit.todayCount > 0) {
        const isCounter = habit.tracking_mode === 'counter'
        if (isCounter && habit.daily_goal_value) {
          return `${habit.todayCount}/${habit.daily_goal_value} aujourd'hui`
        }
        return `✓ Fait aujourd'hui`
      }
      if (habit.lastActionDate) {
        const daysAgo = Math.floor((new Date().getTime() - new Date(habit.lastActionDate).getTime()) / (1000 * 60 * 60 * 24))
        if (daysAgo === 0) return 'Pas fait aujourd\'hui'
        if (daysAgo === 1) return 'Pas fait depuis hier'
        return `Pas fait depuis ${daysAgo}j`
      }
      return 'Jamais fait'
    }
  }

  return (
    <div
      onClick={() => router.push(`/habits/${habit.id}`)}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer ${
        habit.riskLevel === 'danger'
          ? 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 shadow-lg shadow-red-500/10'
          : habit.riskLevel === 'warning'
            ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5'
            : 'border-white/10 bg-gradient-to-br from-white/10 to-white/5 hover:border-white/20'
      }`}
    >
      {/* Barre de statut gauche */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        habit.riskLevel === 'danger' ? 'bg-gradient-to-b from-red-500 to-red-600' :
        habit.riskLevel === 'warning' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600' :
        isDone ? 'bg-gradient-to-b from-green-500 to-green-600' : 'bg-gradient-to-b from-blue-500/50 to-blue-600/50'
      }`} />

      {/* Contenu principal */}
      <div className="p-4 pl-5">
        {/* Header: Icône + Titre + Badge */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-md transition-all duration-200"
            style={{ backgroundColor: habit.color + '30' }}
          >
            <span className="text-2xl">{habit.icon || '🎯'}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="block text-base font-bold text-white leading-tight">
                  {habit.name}
                </h3>

                {/* Progress bar pour counter habits */}
                {habit.tracking_mode === 'counter' && habit.daily_goal_value && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isDone ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-blue-500 to-blue-400'
                        }`}
                        style={{
                          width: `${Math.min((habit.todayCount / habit.daily_goal_value) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white/70 whitespace-nowrap">
                      {habit.todayCount}/{habit.daily_goal_value}
                    </span>
                  </div>
                )}

                {/* Message de statut */}
                <p className={`mt-1.5 text-sm font-medium ${
                  habit.riskLevel === 'danger' ? 'text-red-300' :
                  habit.riskLevel === 'warning' ? 'text-yellow-300' :
                  isDone ? 'text-green-300' : 'text-white/50'
                }`}>
                  {getRiskMessage()}
                </p>
              </div>

              {/* Badge de validation */}
              {isDone && !isBadHabit && (
                <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Streak + Actions */}
        <div className="flex items-center justify-between">
          {/* Streak badge */}
          {habit.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <span className="text-base">🔥</span>
              <span className="text-xs font-bold text-orange-300">{habit.currentStreak}j</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onValidate()
              }}
              disabled={isLoading || (isBadHabit ? false : isDone)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-semibold shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isBadHabit
                  ? 'bg-gradient-to-br from-red-600 to-red-700 hover:shadow-red-500/30 text-white'
                  : isDone
                    ? 'bg-gradient-to-br from-green-600 to-green-700 shadow-green-500/30 text-white'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:shadow-blue-500/30 text-white'
              }`}
              title={isBadHabit ? 'Signaler un craquage' : isDone ? 'Validé' : 'Valider'}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isBadHabit ? (
                <Plus className="h-5 w-5" />
              ) : isDone ? (
                <Check className="h-5 w-5" />
              ) : (
                <Check className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenQuickView()
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
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
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95"
                title="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={onCloseMenu}
                  />
                  <div className="absolute right-0 top-12 z-[101] w-44 rounded-xl border border-white/10 bg-[#0d0f17] backdrop-blur-xl p-1.5 shadow-2xl">
                    <Link
                      href={`/habits/${habit.id}`}
                      className="block rounded-lg px-3 py-2.5 text-sm text-white/90 transition hover:bg-white/10"
                      onClick={onCloseMenu}
                    >
                      Voir détails
                    </Link>
                    <Link
                      href={`/habits/${habit.id}/edit`}
                      className="block rounded-lg px-3 py-2.5 text-sm text-white/90 transition hover:bg-white/10"
                      onClick={onCloseMenu}
                    >
                      Modifier
                    </Link>
                    <div className="my-1 h-px bg-white/10" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCloseMenu()
                        onDelete()
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        <span>Supprimer</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
