'use client'

// Hook client qui calcule la performance par jour de semaine selon les logs Supabase.

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { HabitStatsPeriod } from './useHabitStats'
import type { Database } from '@/types/database'

export type WeeklyPerformancePoint = {
  day: string
  fullDay: string
  good: number
  bad: number
}

type LogRow = Pick<Database['public']['Tables']['logs']['Row'], 'completed_date' | 'value' | 'created_at'>
type EventRow = Pick<Database['public']['Tables']['habit_events']['Row'], 'event_date' | 'occurred_at'>

type HookState = {
  data: WeeklyPerformancePoint[] | null
  loading: boolean
  error: string | null
  refresh: () => void
}

// Référence locale pour associer index JS et libellés français.
const WEEKDAYS = [
  { label: 'Lun', full: 'Lundi', index: 1 },
  { label: 'Mar', full: 'Mardi', index: 2 },
  { label: 'Mer', full: 'Mercredi', index: 3 },
  { label: 'Jeu', full: 'Jeudi', index: 4 },
  { label: 'Ven', full: 'Vendredi', index: 5 },
  { label: 'Sam', full: 'Samedi', index: 6 },
  { label: 'Dim', full: 'Dimanche', index: 0 },
] as const

const formatDate = (date: Date) => date.toISOString().split('T')[0]

const normalizeDate = (date?: string | null, fallback?: string | null) => {
  if (date) return date
  if (fallback) return fallback.split('T')[0]
  return null
}

export function useWeeklyPerformance(period: HabitStatsPeriod): HookState {
  const [data, setData] = useState<WeeklyPerformancePoint[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charge tous les logs/events puis calcule le total par jour de semaine.
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

      const [logsRes, eventsRes] = await Promise.all([
        supabase
          .from('logs')
          .select('completed_date, value, created_at')
          .eq('user_id', user.id),
        supabase
          .from('habit_events')
          .select('event_date, occurred_at')
          .eq('user_id', user.id),
      ])

      if (logsRes.error) throw logsRes.error
      if (eventsRes.error) throw eventsRes.error

      const logs = (logsRes.data ?? []) as LogRow[]
      const events = (eventsRes.data ?? []) as EventRow[]

      const weeklyData = buildWeeklyPerformance(logs, events, period)
      setData(weeklyData)
      setLoading(false)
    } catch (err: any) {
      const message = err?.message === 'AUTH' ? 'AUTH' : err?.message || 'UNKNOWN'
      setError(message)
      setLoading(false)
    }
  }, [period])

  // Recalcule systématiquement lorsque la période change.
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

// Transforme les logs/events en totaux par jour de la semaine.
function buildWeeklyPerformance(logs: LogRow[], events: EventRow[], period: HabitStatsPeriod): WeeklyPerformancePoint[] {
  const today = new Date()
  const startDate =
    period === 'all'
      ? determineEarliestDate(logs, events, today)
      : new Date(today.getFullYear(), today.getMonth(), today.getDate() - (period - 1))

  const totals = new Map<number, { good: number; bad: number }>()
  WEEKDAYS.forEach(day => totals.set(day.index, { good: 0, bad: 0 }))

  logs.forEach(log => {
    const date = normalizeDate(log.completed_date, log.created_at)
    if (!date) return
    const when = new Date(`${date}T00:00:00`)
    if (when < startDate) return
    const weekday = when.getDay()
    const bucket = totals.get(weekday)
    if (!bucket) return
    const amount = typeof log.value === 'number' ? Math.max(1, log.value) : 1
    bucket.good += amount
  })

  events.forEach(event => {
    const date = normalizeDate(event.event_date, event.occurred_at)
    if (!date) return
    const when = new Date(`${date}T00:00:00`)
    if (when < startDate) return
    const weekday = when.getDay()
    const bucket = totals.get(weekday)
    if (!bucket) return
    bucket.bad += 1
  })

  return WEEKDAYS.map(({ label, full, index }) => {
    const bucket = totals.get(index) ?? { good: 0, bad: 0 }
    return {
      day: label,
      fullDay: full,
      good: bucket.good,
      bad: bucket.bad,
    }
  })
}

// Trouve la première date disponible lorsque l'utilisateur demande la période "all".
function determineEarliestDate(logs: LogRow[], events: EventRow[], today: Date) {
  const dates: string[] = []
  logs.forEach(log => {
    const date = normalizeDate(log.completed_date, log.created_at)
    if (date) dates.push(date)
  })
  events.forEach(event => {
    const date = normalizeDate(event.event_date, event.occurred_at)
    if (date) dates.push(date)
  })

  if (!dates.length) {
    const fallback = new Date(today)
    fallback.setDate(fallback.getDate() - 29)
    return fallback
  }

  return new Date(`${dates.sort()[0]}T00:00:00`)
}
