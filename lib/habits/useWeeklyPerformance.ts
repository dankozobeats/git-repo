'use client'

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

type LogRow = Pick<Database['public']['Tables']['logs']['Row'], 'completed_date' | 'value' | 'created_at' | 'habit_id'>
type EventRow = Pick<Database['public']['Tables']['habit_events']['Row'], 'event_date' | 'occurred_at' | 'habit_id'>

type HookState = {
  data: WeeklyPerformancePoint[] | null
  loading: boolean
  error: string | null
  refresh: () => void
}

const WEEKDAYS: Array<{ label: string; full: string; index: number }> = [
  { label: 'Lun', full: 'Lundi', index: 1 },
  { label: 'Mar', full: 'Mardi', index: 2 },
  { label: 'Mer', full: 'Mercredi', index: 3 },
  { label: 'Jeu', full: 'Jeudi', index: 4 },
  { label: 'Ven', full: 'Vendredi', index: 5 },
  { label: 'Sam', full: 'Samedi', index: 6 },
  { label: 'Dim', full: 'Dimanche', index: 0 },
]

const formatDateKey = (date: Date) => date.toISOString().split('T')[0]

export function useWeeklyPerformance(period: HabitStatsPeriod): HookState {
  const [data, setData] = useState<WeeklyPerformancePoint[] | null>(null)
  const [loading, setLoading] = useState(true)
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

      const [logsRes, eventsRes] = await Promise.all([
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

      const weeklyAccumulator = new Map<number, { good: number; bad: number }>()
      WEEKDAYS.forEach(({ index }) => {
        weeklyAccumulator.set(index, { good: 0, bad: 0 })
      })

      logs.forEach((log) => {
        const key = log.completed_date || log.created_at?.split('T')[0]
        if (!key) return
        const date = new Date(`${key}T00:00:00`)
        const weekday = date.getDay()
        const amount = typeof log.value === 'number' ? log.value : 1
        const bucket = weeklyAccumulator.get(weekday)
        if (!bucket) return
        bucket.good += amount
      })

      events.forEach((event) => {
        const key = event.event_date || event.occurred_at?.split('T')[0]
        if (!key) return
        const date = new Date(`${key}T00:00:00`)
        const weekday = date.getDay()
        const bucket = weeklyAccumulator.get(weekday)
        if (!bucket) return
        bucket.bad += 1
      })

      const ordered = WEEKDAYS.map(({ label, full, index }) => {
        const bucket = weeklyAccumulator.get(index) ?? { good: 0, bad: 0 }
        return {
          day: label,
          fullDay: full,
          good: bucket.good,
          bad: bucket.bad,
        }
      })

      setData(ordered)
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
