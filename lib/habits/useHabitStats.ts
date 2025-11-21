'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type HabitRow = Pick<Database['public']['Tables']['habits']['Row'], 'id' | 'name' | 'type'>
type LogRow = Pick<Database['public']['Tables']['logs']['Row'], 'habit_id' | 'completed_date' | 'value' | 'created_at'>
type EventRow = Pick<Database['public']['Tables']['habit_events']['Row'], 'habit_id' | 'event_date' | 'occurred_at'>

export type HabitStatsPeriod = 7 | 30 | 90 | 'all'

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
  name: string
  total: number
  type?: string | null
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

const formatDateKey = (date: Date) => date.toISOString().split('T')[0]

const parseDateKey = (value?: string | null) => {
  if (!value) return null
  return new Date(`${value}T00:00:00`)
}

export function useHabitStats(period: HabitStatsPeriod): UseHabitStatsState {
  const [data, setData] = useState<HabitStatsPayload | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

      const today = new Date()
      let startDateFilter: string | null = null

      if (period !== 'all') {
        const start = new Date(today)
        start.setDate(start.getDate() - (period - 1))
        startDateFilter = formatDateKey(start)
      }

      const [habitsRes, logsRes, eventsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('id, name, type')
          .eq('user_id', user.id)
          .eq('is_archived', false),
        supabase
          .from('logs')
          .select('habit_id, completed_date, value, created_at')
          .eq('user_id', user.id)
          .order('completed_date', { ascending: true }),
        supabase
          .from('habit_events')
          .select('habit_id, event_date, occurred_at')
          .eq('user_id', user.id)
          .order('event_date', { ascending: true }),
      ])

      if (habitsRes.error) throw habitsRes.error
      if (logsRes.error) throw logsRes.error
      if (eventsRes.error) throw eventsRes.error

      let logs = (logsRes.data ?? []) as LogRow[]
      let events = (eventsRes.data ?? []) as EventRow[]

      if (startDateFilter) {
        logs = logs.filter((log) => {
          const key = log.completed_date || log.created_at?.split('T')[0]
          return key ? key >= startDateFilter : false
        })
        events = events.filter((event) => {
          const key = event.event_date || event.occurred_at?.split('T')[0]
          return key ? key >= startDateFilter : false
        })
      }

      const habits = (habitsRes.data ?? []) as HabitRow[]

      const stats = buildStats({
        habits,
        logs,
        events,
        today,
        period,
        startDateFilter,
      })

      setData(stats)
      setLoading(false)
    } catch (err: any) {
      const message = err?.message === 'AUTH' ? 'AUTH' : err?.message || 'UNKNOWN'
      setError(message)
      setLoading(false)
    }
  }, [period])

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

type BuildStatsArgs = {
  habits: HabitRow[]
  logs: LogRow[]
  events: EventRow[]
  today: Date
  period: HabitStatsPeriod
  startDateFilter: string | null
}

function buildStats({ habits, logs, events, today, period, startDateFilter }: BuildStatsArgs): HabitStatsPayload {
  const habitMap = new Map<string, HabitRow>(habits.map((habit) => [habit.id, habit]))

  const logsByDay = new Map<string, number>()
  logs.forEach((log) => {
    const key = log.completed_date || log.created_at?.split('T')[0]
    if (!key) return
    const amount = typeof log.value === 'number' ? log.value : 1
    logsByDay.set(key, (logsByDay.get(key) ?? 0) + amount)
  })

  const eventsByDay = new Map<string, number>()
  events.forEach((event) => {
    const key = event.event_date || event.occurred_at?.split('T')[0]
    if (!key) return
    eventsByDay.set(key, (eventsByDay.get(key) ?? 0) + 1)
  })

  const combinedDates = [
    ...logs.map((log) => log.completed_date),
    ...events.map((event) => event.event_date ?? event.occurred_at?.split('T')[0]),
  ].filter(Boolean) as string[]

  let timelineStart: Date
  if (period === 'all') {
    if (combinedDates.length) {
      const earliest = combinedDates.reduce((acc, curr) => (curr < acc ? curr : acc))
      timelineStart = parseDateKey(earliest) ?? new Date(today)
    } else {
      timelineStart = new Date(today)
      timelineStart.setDate(timelineStart.getDate() - 29)
    }
  } else {
    timelineStart = parseDateKey(startDateFilter) ?? new Date(today)
  }

  const start = new Date(timelineStart)
  const end = new Date(today)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const days: DailyPoint[] = []
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = formatDateKey(cursor)
    const good = logsByDay.get(key) ?? 0
    const bad = eventsByDay.get(key) ?? 0
    days.push({
      date: key,
      good,
      bad,
      total: good + bad,
    })
  }

  let runningGood = 0
  let runningBad = 0
  const cumulative: CumulativePoint[] = days.map((day) => {
    runningGood += day.good
    runningBad += day.bad
    return {
      date: day.date,
      goodCum: runningGood,
      badCum: runningBad,
    }
  })

  const maxGood = days.reduce((acc, point) => Math.max(acc, point.good), 0)
  const maxBad = days.reduce((acc, point) => Math.max(acc, point.bad), 0)

  const heatmap: HeatmapPoint[] = days.map((day) => ({
    date: day.date,
    good: day.good,
    bad: day.bad,
    total: day.total,
    intensityGood: maxGood ? Math.min(4, Math.ceil((day.good / maxGood) * 4)) : 0,
    intensityBad: maxBad ? Math.min(4, Math.ceil((day.bad / maxBad) * 4)) : 0,
  }))

  const totalsByHabit = new Map<string, number>()
  logs.forEach((log) => {
    const amount = typeof log.value === 'number' ? log.value : 1
    totalsByHabit.set(log.habit_id, (totalsByHabit.get(log.habit_id) ?? 0) + amount)
  })
  events.forEach((event) => {
    totalsByHabit.set(event.habit_id, (totalsByHabit.get(event.habit_id) ?? 0) + 1)
  })

  const topHabits: TopHabitPoint[] = Array.from(totalsByHabit.entries())
    .map(([habitId, total]) => {
      const habit = habitMap.get(habitId)
      return {
        name: habit?.name ?? 'Habitude',
        total,
        type: habit?.type ?? null,
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  return {
    daily: days,
    cumulative,
    topHabits,
    heatmap,
  }
}
