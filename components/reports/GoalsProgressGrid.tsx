'use client'

/**
 * Grille de progression des objectifs
 * Affiche les habitudes counter avec leur progression vers l'objectif
 */

import { Target, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CounterHabit = {
  id: string
  name: string
  icon: string | null
  counter_required: number
  totalEvents: number
  averagePerDay: number
}

type GoalsProgressGridProps = {
  period: number
}

export function GoalsProgressGrid({ period }: GoalsProgressGridProps) {
  const [counterHabits, setCounterHabits] = useState<CounterHabit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCounterHabits()
  }, [period])

  async function fetchCounterHabits() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer les habitudes counter
      const { data: habits } = await supabase
        .from('habits')
        .select('id, name, icon, counter_required')
        .eq('user_id', user.id)
        .eq('tracking_mode', 'counter')
        .eq('is_archived', false)

      if (!habits) {
        setCounterHabits([])
        setIsLoading(false)
        return
      }

      // Calculer les stats pour chaque habitude
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - period)
      const startDateStr = startDate.toISOString().split('T')[0]

      const habitsWithStats: CounterHabit[] = []

      for (const habit of habits) {
        // Compter les events dans la période
        const { data: events } = await supabase
          .from('habit_events')
          .select('id')
          .eq('habit_id', habit.id)
          .gte('event_date', startDateStr)

        const totalEvents = events?.length ?? 0
        const averagePerDay = totalEvents / period

        habitsWithStats.push({
          id: habit.id,
          name: habit.name,
          icon: habit.icon,
          counter_required: habit.counter_required ?? 1,
          totalEvents,
          averagePerDay,
        })
      }

      setCounterHabits(habitsWithStats.sort((a, b) => b.totalEvents - a.totalEvents))
    } catch (error) {
      console.error('Error fetching counter habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
        </div>
      </div>
    )
  }

  if (counterHabits.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white">Progression des Objectifs</h3>
          <p className="text-xs text-white/60">Habitudes avec compteur</p>
        </div>
        <div className="py-8 text-center">
          <div className="mb-4 text-4xl opacity-40">🎯</div>
          <p className="text-sm text-white/60">Aucune habitude avec compteur</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Progression des Objectifs</h3>
        <p className="text-xs text-white/60">Moyenne quotidienne sur {period} jours</p>
      </div>

      <div className="space-y-4">
        {counterHabits.map((habit) => {
          const achievementRate = (habit.averagePerDay / habit.counter_required) * 100
          const isExceeding = achievementRate >= 100
          const color = isExceeding
            ? '#10b981' // emerald
            : achievementRate >= 75
            ? '#3b82f6' // blue
            : achievementRate >= 50
            ? '#f59e0b' // orange
            : '#ef4444' // red

          return (
            <div
              key={habit.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl">
                    {habit.icon || '🎯'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{habit.name}</h4>
                    <p className="text-xs text-white/60">
                      Objectif: {habit.counter_required}x/jour
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {habit.averagePerDay.toFixed(1)}
                  </p>
                  <p className="text-xs text-white/60">moy/jour</p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="mb-2">
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, achievementRate)}%`,
                      backgroundColor: color,
                      boxShadow: `0 0 12px ${color}40`,
                    }}
                  />
                </div>
              </div>

              {/* Statistiques */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-white/60">
                    Total: <span className="font-semibold text-white">{habit.totalEvents}</span>
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color }}
                  >
                    {achievementRate.toFixed(0)}%
                  </span>
                </div>

                {isExceeding && (
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-300">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-semibold">Objectif dépassé!</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
