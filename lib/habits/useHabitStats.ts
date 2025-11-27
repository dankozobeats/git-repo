'use client'

// Hook client qui agrège les données Supabase pour alimenter les vues statistiques globales.

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type HabitStatsPeriod = 7 | 30 | 90 | 'all'

type HabitRow = Pick<Database['public']['Tables']['habits']['Row'], 'id' | 'name' | 'type' | 'created_at'>
type LogRow = Pick<Database['public']['Tables']['logs']['Row'], 'habit_id' | 'completed_date' | 'value' | 'created_at'>
type EventRow = Pick<Database['public']['Tables']['habit_events']['Row'], 'habit_id' | 'event_date' | 'occurred_at' | 'created_at'>

export type DailyPoint = {
  date: string
  good: number
  bad: number
  total: number
}

export type CumulativePoint = {
  date: string
  goodCum: number
  badCum: number
}

export type TopHabitPoint = {
  id: string
  name: string
  type: 'good' | 'bad'
  total: number
  streak: number
  maxStreak: number
}

export type HeatmapPoint = {
  date: string
  good: number
  bad: number
  total: number
  intensityGood: number
  intensityBad: number
}

export type HabitStatsPayload = {
  daily: DailyPoint[]
  cumulative: CumulativePoint[]
  topHabits: TopHabitPoint[]
  heatmap: HeatmapPoint[]
}

type UseHabitStatsState = {
  data: HabitStatsPayload | null
  loading: boolean
  error: string | null
  refresh: () => void
}

// Utilitaire pour convertir une Date en chaîne AAAA-MM-JJ.
const formatDate = (date: Date) => date.toISOString().split('T')[0]

// S'assure qu'une entrée log/event possède bien une date exploitable.
const normalizeDate = (date?: string | null, fallback?: string | null) => {
  if (date) return date
  if (fallback) return fallback.split('T')[0]
  return null
}

const diffInDays = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86400000)

export function useHabitStats(period: HabitStatsPeriod): UseHabitStatsState {
  const [data, setData] = useState<HabitStatsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charge habits/logs/events depuis Supabase puis construit la structure Stats.
  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('AUTH')
      }

      const [habitsRes, logsRes, eventsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('id, name, type, created_at')
          .eq('user_id', user.id)
          .eq('is_archived', false),
        supabase
          .from('logs')
          .select('habit_id, completed_date, value, created_at')
          .eq('user_id', user.id)
          .order('completed_date', { ascending: true }),
        supabase
          .from('habit_events')
          .select('habit_id, event_date, occurred_at, created_at')
          .eq('user_id', user.id)
          .order('event_date', { ascending: true }),
      ])

      if (habitsRes.error) throw habitsRes.error
      if (logsRes.error) throw logsRes.error
      if (eventsRes.error) throw eventsRes.error

      const habits = (habitsRes.data ?? []) as HabitRow[]
      const logs = (logsRes.data ?? []) as LogRow[]
      const events = (eventsRes.data ?? []) as EventRow[]

      const stats = buildStats(habits, logs, events, period)
      setData(stats)
      setLoading(false)
    } catch (err: any) {
      const message = err?.message === 'AUTH' ? 'AUTH' : err?.message || 'UNKNOWN'
      setError(message)
      setLoading(false)
    }
  }, [period])

  // Relance le calcul chaque fois que la période change.
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    data,
    loading,
    error,
    refresh: fetchStats,
  }
}

// Transforme les lignes Supabase en séries temporelles utilisables par les composants UI.
function buildStats(habits: HabitRow[], logs: LogRow[], events: EventRow[], period: HabitStatsPeriod): HabitStatsPayload {
  const today = new Date()
  const habitMap = new Map(habits.map(habit => [habit.id, habit]))
  const logsByDay = new Map<string, number>()
  const eventsByDay = new Map<string, number>()
  const allDates = new Set<string>()
  const habitTotals = new Map<
    string,
    {
      id: string
      name: string
      type: 'good' | 'bad'
      total: number
      createdAt: string | null
    }
  >()
  const logDatesByHabit = new Map<string, Set<string>>()
  const eventDatesByHabit = new Map<string, Set<string>>()

  // Agrège les logs "good" par date et par habitude.
  logs.forEach(log => {
    const habit = habitMap.get(log.habit_id)
    if (!habit) return
    const date = normalizeDate(log.completed_date, log.created_at)
    if (!date) return

    const amount = typeof log.value === 'number' ? Math.max(1, log.value) : 1
    logsByDay.set(date, (logsByDay.get(date) ?? 0) + amount)
    allDates.add(date)

    if (!logDatesByHabit.has(log.habit_id)) {
      logDatesByHabit.set(log.habit_id, new Set())
    }
    logDatesByHabit.get(log.habit_id)!.add(date)

    const entry =
      habitTotals.get(log.habit_id) ??
      {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        total: 0,
        createdAt: habit.created_at ?? null,
      }
    entry.total += amount
    habitTotals.set(log.habit_id, entry)
  })

  // Agrège les events "bad" de la même manière.
  events.forEach(event => {
    const habit = habitMap.get(event.habit_id)
    if (!habit) return
    const date = normalizeDate(event.event_date, event.occurred_at)
    if (!date) return

    eventsByDay.set(date, (eventsByDay.get(date) ?? 0) + 1)
    allDates.add(date)

    if (!eventDatesByHabit.has(event.habit_id)) {
      eventDatesByHabit.set(event.habit_id, new Set())
    }
    eventDatesByHabit.get(event.habit_id)!.add(date)

    const entry =
      habitTotals.get(event.habit_id) ??
      {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        total: 0,
        createdAt: habit.created_at ?? null,
      }
    entry.total += 1
    habitTotals.set(event.habit_id, entry)
  })

  const startDate = determineStartDate(period, allDates, today)
  const daily: DailyPoint[] = []
  const cumulative: CumulativePoint[] = []

  let cursor = new Date(startDate)
  const end = new Date(today)
  let runningGood = 0
  let runningBad = 0
  let maxGood = 0
  let maxBad = 0

  // Construit les séries journalières et cumulatives entre startDate et aujourd'hui.
  while (cursor <= end) {
    const key = formatDate(cursor)
    const good = logsByDay.get(key) ?? 0
    const bad = eventsByDay.get(key) ?? 0
    const total = good + bad
    daily.push({ date: key, good, bad, total })
    runningGood += good
    runningBad += bad
    cumulative.push({ date: key, goodCum: runningGood, badCum: runningBad })
    maxGood = Math.max(maxGood, good)
    maxBad = Math.max(maxBad, bad)
    cursor.setDate(cursor.getDate() + 1)
  }

  // Calcule les intensités (0-4) nécessaires au rendu heatmap.
  const heatmap: HeatmapPoint[] = daily.map(point => ({
    ...point,
    intensityGood: maxGood ? Math.min(4, Math.ceil((point.good / maxGood) * 4)) : 0,
    intensityBad: maxBad ? Math.min(4, Math.ceil((point.bad / maxBad) * 4)) : 0,
  }))

  const topHabits: TopHabitPoint[] = Array.from(habitTotals.values())
    .map(habit => {
      if (habit.type === 'bad') {
        const eventsSet = eventDatesByHabit.get(habit.id) ?? new Set<string>()
        const { current, max } = computeBadHabitStreak(eventsSet, habit.createdAt, today)
        return { id: habit.id, name: habit.name, type: 'bad' as const, total: habit.total, streak: current, maxStreak: max }
      }
      const logSet = logDatesByHabit.get(habit.id) ?? new Set<string>()
      const { current, max } = computeGoodHabitStreak(logSet, today)
      return { id: habit.id, name: habit.name, type: 'good' as const, total: habit.total, streak: current, maxStreak: max }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  return { daily, cumulative, topHabits, heatmap }
}

// Détermine la date de début selon la période demandée ou la première activité connue.
function determineStartDate(period: HabitStatsPeriod, dates: Set<string>, today: Date) {
  if (period !== 'all') {
    const start = new Date(today)
    start.setDate(start.getDate() - (period - 1))
    return start
  }

  if (dates.size === 0) {
    const fallback = new Date(today)
    fallback.setDate(fallback.getDate() - 29)
    return fallback
  }

  const earliest = Array.from(dates).sort()[0]
  return new Date(`${earliest}T00:00:00`)
}

// Calcule la série de jours consécutifs pour les habitudes positives.
function computeGoodHabitStreak(dateSet: Set<string>, today: Date) {
  if (dateSet.size === 0) return { current: 0, max: 0 }
  const sortedDates = Array.from(dateSet).sort()
  let longest = 0
  let streak = 0
  let prevDate: Date | null = null

  sortedDates.forEach(dateStr => {
    const date = new Date(`${dateStr}T00:00:00`)
    if (prevDate && diffInDays(prevDate, date) === 1) {
      streak += 1
    } else {
      streak = 1
    }
    longest = Math.max(longest, streak)
    prevDate = date
  })

  let current = 0
  const cursor = new Date(today)
  while (true) {
    const key = formatDate(cursor)
    if (dateSet.has(key)) {
      current += 1
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  return { current, max: longest }
}

// Calcule les jours sans craquage depuis la création pour une habitude négative.
function computeBadHabitStreak(dateSet: Set<string>, createdAt: string | null, today: Date) {
  const sortedDates = Array.from(dateSet).sort()
  const creationDate = createdAt ? new Date(createdAt) : null

  let current = 0
  const cursor = new Date(today)
  let safety = 0
  while (safety < 400) {
    const key = formatDate(cursor)
    if (dateSet.has(key)) break
    current += 1
    cursor.setDate(cursor.getDate() - 1)
    safety += 1
    if (creationDate && cursor < creationDate) break
  }

  let max = current
  let prevDate: Date | null = creationDate ? new Date(creationDate) : null

  sortedDates.forEach(dateStr => {
    const eventDate = new Date(`${dateStr}T00:00:00`)
    if (prevDate) {
      const start = new Date(prevDate)
      start.setDate(start.getDate() + 1)
      const gap = Math.max(0, diffInDays(start, eventDate))
      max = Math.max(max, gap)
    }
    prevDate = eventDate
  })

  if (sortedDates.length) {
    const lastEvent = new Date(`${sortedDates[sortedDates.length - 1]}T00:00:00`)
    max = Math.max(max, diffInDays(lastEvent, today))
  } else if (creationDate) {
    max = Math.max(max, diffInDays(creationDate, today))
  } else {
    max = Math.max(max, current)
  }

  return { current, max }
}
