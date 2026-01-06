'use client'

/**
 * Dashboard Advanced - Version Mobile First
 * Design moderne optimisé pour mobile avec cartes compactes
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, TrendingUp, Clock, Flame, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']
type FilterType = 'all' | 'critical' | 'warning' | 'good'

type DashboardAdvancedMobileProps = {
  habits: Habit[]
  logs: Log[]
  events: Event[]
  userId: string
}

type HabitWithStats = {
  id: string
  name: string
  icon: string | null
  color: string
  type: string
  tracking_mode: string | null
  daily_goal_value: number | null
  todayCount: number
  currentStreak: number
  last7DaysCount: number
  riskLevel: 'critical' | 'warning' | 'good'
  lastActionDate: string | null
}

export default function DashboardAdvancedMobile({
  habits,
  logs,
  events,
  userId,
}: DashboardAdvancedMobileProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null)

  // Calculer les stats pour chaque habitude
  const habitsWithStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return habits.map(habit => {
      const isBadHabit = habit.type === 'bad'
      const habitLogs = logs.filter(l => l.habit_id === habit.id)
      const habitEvents = events.filter(e => e.habit_id === habit.id)

      // Today count
      const todayCount = isBadHabit
        ? habitEvents.filter(e => e.event_date === today).length
        : habit.tracking_mode === 'counter'
          ? habitEvents.filter(e => e.event_date === today).length
          : habitLogs.filter(l => l.completed_date === today).length

      // Last 7 days
      const last7DaysCount = isBadHabit
        ? habitEvents.filter(e => e.event_date >= sevenDaysAgo && e.event_date <= today).length
        : habit.tracking_mode === 'counter'
          ? habitEvents.filter(e => e.event_date >= sevenDaysAgo && e.event_date <= today).length
          : habitLogs.filter(l => l.completed_date >= sevenDaysAgo && l.completed_date <= today).length

      // Current streak
      let currentStreak = 0
      if (isBadHabit) {
        const eventDates = habitEvents.map(e => e.event_date).sort().reverse()
        let checkDate = new Date()
        while (currentStreak < 365) {
          const dateStr = checkDate.toISOString().split('T')[0]
          if (eventDates.includes(dateStr)) break
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        }
      } else {
        const logDates = habitLogs.map(l => l.completed_date).sort().reverse()
        let checkDate = new Date()
        while (currentStreak < 365) {
          const dateStr = checkDate.toISOString().split('T')[0]
          if (!logDates.includes(dateStr)) break
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        }
      }

      // Dernière action
      const lastActionDate = isBadHabit
        ? (habitEvents.length > 0 ? habitEvents.sort((a, b) => b.event_date.localeCompare(a.event_date))[0].event_date : null)
        : (habitLogs.length > 0 ? habitLogs.sort((a, b) => b.completed_date.localeCompare(a.completed_date))[0].completed_date : null)

      // Niveau de risque
      let riskLevel: 'critical' | 'warning' | 'good' = 'good'
      if (isBadHabit) {
        if (todayCount > 0) riskLevel = 'critical'
        else if (currentStreak < 7 && habitEvents.length > 0) riskLevel = 'warning'
      } else {
        if (todayCount === 0) {
          const daysSinceLastAction = lastActionDate
            ? Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999
          if (daysSinceLastAction >= 3) riskLevel = 'critical'
          else if (daysSinceLastAction >= 1) riskLevel = 'warning'
        }
      }

      return {
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        type: habit.type,
        tracking_mode: habit.tracking_mode,
        daily_goal_value: habit.daily_goal_value,
        todayCount,
        currentStreak,
        last7DaysCount,
        riskLevel,
        lastActionDate,
      }
    })
  }, [habits, logs, events])

  // Filtrer les habitudes
  const filteredHabits = useMemo(() => {
    if (filter === 'all') return habitsWithStats
    return habitsWithStats.filter(h => h.riskLevel === filter)
  }, [habitsWithStats, filter])

  // Statistiques globales
  const stats = useMemo(() => {
    const critical = habitsWithStats.filter(h => h.riskLevel === 'critical').length
    const warning = habitsWithStats.filter(h => h.riskLevel === 'warning').length
    const good = habitsWithStats.filter(h => h.riskLevel === 'good').length
    const totalStreak = habitsWithStats.reduce((sum, h) => sum + h.currentStreak, 0)
    const avgStreak = habitsWithStats.length > 0 ? Math.round(totalStreak / habitsWithStats.length) : 0

    return { critical, warning, good, avgStreak }
  }, [habitsWithStats])

  const handleQuickAction = async (habitId: string, isBadHabit: boolean) => {
    try {
      if (isBadHabit) {
        await fetch(`/api/habits/${habitId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
        })
      } else {
        await fetch(`/api/habits/${habitId}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            value: 1,
          }),
        })
      }
      router.refresh()
    } catch (error) {
      console.error('Erreur action rapide:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-red-300">Critique</p>
          </div>
          <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-yellow-300">Attention</p>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{stats.warning}</p>
        </div>

        <div className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-green-300">Bien</p>
          </div>
          <p className="text-3xl font-bold text-green-400">{stats.good}</p>
        </div>

        <div className="rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-orange-300">Streak moy.</p>
          </div>
          <p className="text-3xl font-bold text-orange-400">{stats.avgStreak}j</p>
        </div>
      </div>

      {/* Filtres Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
              : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:scale-105'
          }`}
        >
          <span className="mr-1.5">📋</span>
          Tout <span className="ml-1 opacity-60">({habitsWithStats.length})</span>
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            filter === 'critical'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105'
              : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:scale-105'
          }`}
        >
          <span className="mr-1.5">🚨</span>
          Critique <span className="ml-1 opacity-60">({stats.critical})</span>
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            filter === 'warning'
              ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/30 scale-105'
              : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:scale-105'
          }`}
        >
          <span className="mr-1.5">⚠️</span>
          Attention <span className="ml-1 opacity-60">({stats.warning})</span>
        </button>
        <button
          onClick={() => setFilter('good')}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            filter === 'good'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/30 scale-105'
              : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:scale-105'
          }`}
        >
          <span className="mr-1.5">✅</span>
          Bien <span className="ml-1 opacity-60">({stats.good})</span>
        </button>
      </div>

      {/* Liste des habitudes */}
      <div className="space-y-3">
        {filteredHabits.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-white/60">Aucune habitude dans ce filtre</p>
          </div>
        ) : (
          filteredHabits.map(habit => (
            <HabitCardCompact
              key={habit.id}
              habit={habit}
              isExpanded={expandedHabit === habit.id}
              onToggle={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}
              onQuickAction={handleQuickAction}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Composant Carte Compacte
function HabitCardCompact({
  habit,
  isExpanded,
  onToggle,
  onQuickAction,
}: {
  habit: HabitWithStats
  isExpanded: boolean
  onToggle: () => void
  onQuickAction: (habitId: string, isBadHabit: boolean) => void
}) {
  const isBadHabit = habit.type === 'bad'
  const isDone = isBadHabit ? habit.todayCount === 0 : habit.todayCount > 0

  const borderColor = habit.riskLevel === 'critical'
    ? 'border-red-500/30'
    : habit.riskLevel === 'warning'
      ? 'border-yellow-500/30'
      : 'border-green-500/30'

  const bgGradient = habit.riskLevel === 'critical'
    ? 'bg-gradient-to-br from-red-500/10 to-red-500/5'
    : habit.riskLevel === 'warning'
      ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5'
      : 'bg-gradient-to-br from-green-500/10 to-green-500/5'

  const statusBar = habit.riskLevel === 'critical'
    ? 'bg-gradient-to-b from-red-500 to-red-600'
    : habit.riskLevel === 'warning'
      ? 'bg-gradient-to-b from-yellow-500 to-yellow-600'
      : 'bg-gradient-to-b from-green-500 to-green-600'

  return (
    <div className={`relative rounded-2xl border ${borderColor} ${bgGradient} overflow-hidden`}>
      {/* Barre de statut gauche */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusBar}`} />

      {/* Contenu principal */}
      <div className="p-4 pl-5">
        <div className="flex items-center gap-3">
          {/* Icône */}
          <Link href={`/habits/${habit.id}`} className="flex-shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md transition-transform hover:scale-110"
              style={{ backgroundColor: habit.color + '30' }}
            >
              <span className="text-xl">{habit.icon || '🎯'}</span>
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/habits/${habit.id}`} className="block">
              <h3 className="font-bold text-white truncate hover:text-blue-400 transition-colors">
                {habit.name}
              </h3>
            </Link>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
              {habit.currentStreak > 0 && (
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-400" />
                  {habit.currentStreak}j
                </span>
              )}
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {habit.last7DaysCount} / 7j
              </span>
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={onToggle}
            className="flex-shrink-0 rounded-lg p-2 text-white/50 hover:bg-white/10 transition"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Détails expandables */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/50">Aujourd'hui</p>
                <p className="font-semibold text-white">
                  {isBadHabit
                    ? `${habit.todayCount} craquage${habit.todayCount > 1 ? 's' : ''}`
                    : habit.tracking_mode === 'counter' && habit.daily_goal_value
                      ? `${habit.todayCount}/${habit.daily_goal_value}`
                      : isDone ? '✓ Fait' : '✗ Pas fait'
                  }
                </p>
              </div>
              <div>
                <p className="text-white/50">Dernière action</p>
                <p className="font-semibold text-white">
                  {habit.lastActionDate
                    ? new Date(habit.lastActionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : 'Jamais'
                  }
                </p>
              </div>
            </div>

            {/* Action rapide */}
            <button
              onClick={() => onQuickAction(habit.id, isBadHabit)}
              disabled={!isBadHabit && isDone}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isBadHabit
                  ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 active:scale-95'
                  : isDone
                    ? 'bg-green-500/20 text-green-200 cursor-not-allowed opacity-50'
                    : 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 active:scale-95'
              }`}
            >
              {isBadHabit
                ? 'Signaler un craquage'
                : isDone
                  ? '✓ Déjà validé'
                  : 'Valider aujourd\'hui'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
