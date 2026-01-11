'use client'

/**
 * Hook pour le rapport temporel avancé
 * Analyse les patterns horaires, calendrier annuel, comparaisons mensuelles
 */

import { useMemo, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']

export type HourlyData = {
  hour: number // 0-23
  good: number
  bad: number
  total: number
}

export type DayData = {
  date: string // YYYY-MM-DD
  good: number
  bad: number
  total: number
  intensity: number // 0-4 pour la couleur
}

export type MonthSummary = {
  month: string // YYYY-MM
  monthName: string // "Janvier 2025"
  good: number
  bad: number
  total: number
  score: number // score de performance
  successRate: number // %
}

export type TimeMachineSnapshot = {
  daysAgo: number
  date: string
  label: string // "Il y a 30 jours"
  good: number
  bad: number
  bestHabit?: { name: string; icon: string | null }
  worstHabit?: { name: string; icon: string | null }
}

export type SeasonalData = {
  season: string // "Hiver", "Printemps", etc.
  months: string[] // ["Décembre", "Janvier", "Février"]
  good: number
  bad: number
  avgPerDay: number
}

export type TemporalReportData = {
  hourlyData: HourlyData[]
  yearlyCalendar: DayData[]
  monthlyComparison: {
    bestMonth: MonthSummary | null
    worstMonth: MonthSummary | null
    currentMonth: MonthSummary
    allMonths: MonthSummary[]
  }
  timeMachine: TimeMachineSnapshot[]
  seasonalPatterns: SeasonalData[]
  insights: {
    mostActiveHour: number | null
    mostRiskyHour: number | null
    bestDayOfWeek: string | null
    worstDayOfWeek: string | null
  }
  isLoading: boolean
}

export function useTemporalReport(): TemporalReportData {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      const [habitsRes, logsRes, eventsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false),
        supabase
          .from('logs')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('habit_events')
          .select('*')
          .eq('user_id', user.id),
      ])

      setHabits(habitsRes.data || [])
      setLogs(logsRes.data || [])
      setEvents(eventsRes.data || [])
    } catch (error) {
      console.error('Error fetching temporal data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 1. Analyse horaire
  const hourlyData = useMemo(() => {
    const hours: HourlyData[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      good: 0,
      bad: 0,
      total: 0,
    }))

    // Events ont occurred_at avec l'heure
    events.forEach(e => {
      if (e.occurred_at) {
        const hour = new Date(e.occurred_at).getHours()
        const habit = habits.find(h => h.id === e.habit_id)
        if (habit?.type === 'bad') {
          hours[hour].bad++
        } else {
          hours[hour].good++
        }
        hours[hour].total++
      }
    })

    return hours
  }, [events, habits])

  // 2. Calendrier annuel (365 derniers jours)
  const yearlyCalendar = useMemo(() => {
    const days: DayData[] = []
    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setDate(oneYearAgo.getDate() - 365)

    const dataByDate = new Map<string, { good: number; bad: number }>()

    // Agréger logs
    logs.forEach(l => {
      const date = l.completed_date
      if (date) {
        const existing = dataByDate.get(date) || { good: 0, bad: 0 }
        const habit = habits.find(h => h.id === l.habit_id)
        if (habit?.type === 'bad') {
          existing.bad++
        } else {
          existing.good++
        }
        dataByDate.set(date, existing)
      }
    })

    // Agréger events
    events.forEach(e => {
      const date = e.event_date
      if (date) {
        const existing = dataByDate.get(date) || { good: 0, bad: 0 }
        const habit = habits.find(h => h.id === e.habit_id)
        if (habit?.type === 'bad') {
          existing.bad++
        } else {
          existing.good++
        }
        dataByDate.set(date, existing)
      }
    })

    // Générer tous les jours
    let maxTotal = 0
    const tempDays: Array<{ date: string; good: number; bad: number; total: number }> = []

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const data = dataByDate.get(dateStr) || { good: 0, bad: 0 }
      const total = data.good + data.bad
      maxTotal = Math.max(maxTotal, total)
      tempDays.push({ date: dateStr, good: data.good, bad: data.bad, total })
    }

    // Calculer intensités
    return tempDays.map(day => ({
      ...day,
      intensity: maxTotal === 0 ? 0 : Math.min(4, Math.ceil((day.total / maxTotal) * 4)),
    }))
  }, [logs, events, habits])

  // 3. Comparaison mensuelle
  const monthlyComparison = useMemo(() => {
    const monthsMap = new Map<string, { good: number; bad: number }>()

    logs.forEach(l => {
      if (l.completed_date) {
        const month = l.completed_date.substring(0, 7) // YYYY-MM
        const existing = monthsMap.get(month) || { good: 0, bad: 0 }
        const habit = habits.find(h => h.id === l.habit_id)
        if (habit?.type === 'bad') {
          existing.bad++
        } else {
          existing.good++
        }
        monthsMap.set(month, existing)
      }
    })

    events.forEach(e => {
      if (e.event_date) {
        const month = e.event_date.substring(0, 7)
        const existing = monthsMap.get(month) || { good: 0, bad: 0 }
        const habit = habits.find(h => h.id === e.habit_id)
        if (habit?.type === 'bad') {
          existing.bad++
        } else {
          existing.good++
        }
        monthsMap.set(month, existing)
      }
    })

    const allMonths: MonthSummary[] = Array.from(monthsMap.entries())
      .map(([month, data]) => {
        const total = data.good + data.bad
        const successRate = total > 0 ? Math.round((data.good / total) * 100) : 0
        const score = data.good - data.bad

        const date = new Date(month + '-01')
        const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

        return {
          month,
          monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          good: data.good,
          bad: data.bad,
          total,
          score,
          successRate,
        }
      })
      .sort((a, b) => b.month.localeCompare(a.month))

    const bestMonth = allMonths.length > 0
      ? [...allMonths].sort((a, b) => b.score - a.score)[0]
      : null

    const worstMonth = allMonths.length > 0
      ? [...allMonths].sort((a, b) => a.score - b.score)[0]
      : null

    const currentMonthStr = new Date().toISOString().substring(0, 7)
    const currentMonth = allMonths.find(m => m.month === currentMonthStr) || {
      month: currentMonthStr,
      monthName: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      good: 0,
      bad: 0,
      total: 0,
      score: 0,
      successRate: 0,
    }

    return { bestMonth, worstMonth, currentMonth, allMonths }
  }, [logs, events, habits])

  // 4. Time Machine
  const timeMachine = useMemo(() => {
    const snapshots: TimeMachineSnapshot[] = []
    const intervals = [30, 60, 90, 180, 365]

    intervals.forEach(daysAgo => {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - daysAgo)
      const dateStr = targetDate.toISOString().split('T')[0]

      const dayLogs = logs.filter(l => l.completed_date === dateStr)
      const dayEvents = events.filter(e => e.event_date === dateStr)

      let good = 0
      let bad = 0

      dayLogs.forEach(l => {
        const habit = habits.find(h => h.id === l.habit_id)
        if (habit?.type === 'bad') bad++
        else good++
      })

      dayEvents.forEach(e => {
        const habit = habits.find(h => h.id === e.habit_id)
        if (habit?.type === 'bad') bad++
        else good++
      })

      snapshots.push({
        daysAgo,
        date: dateStr,
        label: `Il y a ${daysAgo} jours`,
        good,
        bad,
      })
    })

    return snapshots
  }, [logs, events, habits])

  // 5. Patterns saisonniers
  const seasonalPatterns = useMemo(() => {
    const seasons: SeasonalData[] = [
      { season: 'Hiver', months: ['Décembre', 'Janvier', 'Février'], good: 0, bad: 0, avgPerDay: 0 },
      { season: 'Printemps', months: ['Mars', 'Avril', 'Mai'], good: 0, bad: 0, avgPerDay: 0 },
      { season: 'Été', months: ['Juin', 'Juillet', 'Août'], good: 0, bad: 0, avgPerDay: 0 },
      { season: 'Automne', months: ['Septembre', 'Octobre', 'Novembre'], good: 0, bad: 0, avgPerDay: 0 },
    ]

    const seasonMonths = {
      'Hiver': [12, 1, 2],
      'Printemps': [3, 4, 5],
      'Été': [6, 7, 8],
      'Automne': [9, 10, 11],
    }

    logs.forEach(l => {
      if (l.completed_date) {
        const month = new Date(l.completed_date + 'T00:00:00').getMonth() + 1
        const habit = habits.find(h => h.id === l.habit_id)

        Object.entries(seasonMonths).forEach(([season, months]) => {
          if (months.includes(month)) {
            const s = seasons.find(s => s.season === season)!
            if (habit?.type === 'bad') s.bad++
            else s.good++
          }
        })
      }
    })

    events.forEach(e => {
      if (e.event_date) {
        const month = new Date(e.event_date + 'T00:00:00').getMonth() + 1
        const habit = habits.find(h => h.id === e.habit_id)

        Object.entries(seasonMonths).forEach(([season, months]) => {
          if (months.includes(month)) {
            const s = seasons.find(s => s.season === season)!
            if (habit?.type === 'bad') s.bad++
            else s.good++
          }
        })
      }
    })

    // Calculer moyenne par jour (approximatif: 90 jours par saison)
    seasons.forEach(s => {
      s.avgPerDay = (s.good + s.bad) / 90
    })

    return seasons
  }, [logs, events, habits])

  // 6. Insights
  const insights = useMemo(() => {
    const mostActiveHour = hourlyData.reduce((max, h) =>
      h.total > max.total ? h : max
    , hourlyData[0]).hour

    const mostRiskyHour = hourlyData.reduce((max, h) =>
      h.bad > max.bad ? h : max
    , hourlyData[0]).hour

    // Jour de la semaine
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const dayGood: number[] = [0, 0, 0, 0, 0, 0, 0]
    const dayBad: number[] = [0, 0, 0, 0, 0, 0, 0]

    logs.forEach(l => {
      if (l.completed_date) {
        const day = new Date(l.completed_date + 'T00:00:00').getDay()
        const habit = habits.find(h => h.id === l.habit_id)
        if (habit?.type === 'bad') dayBad[day]++
        else dayGood[day]++
      }
    })

    events.forEach(e => {
      if (e.event_date) {
        const day = new Date(e.event_date + 'T00:00:00').getDay()
        const habit = habits.find(h => h.id === e.habit_id)
        if (habit?.type === 'bad') dayBad[day]++
        else dayGood[day]++
      }
    })

    const bestDayIndex = dayGood.indexOf(Math.max(...dayGood))
    const worstDayIndex = dayBad.indexOf(Math.max(...dayBad))

    return {
      mostActiveHour: hourlyData.some(h => h.total > 0) ? mostActiveHour : null,
      mostRiskyHour: hourlyData.some(h => h.bad > 0) ? mostRiskyHour : null,
      bestDayOfWeek: dayGood[bestDayIndex] > 0 ? dayNames[bestDayIndex] : null,
      worstDayOfWeek: dayBad[worstDayIndex] > 0 ? dayNames[worstDayIndex] : null,
    }
  }, [hourlyData, logs, events, habits])

  return {
    hourlyData,
    yearlyCalendar,
    monthlyComparison,
    timeMachine,
    seasonalPatterns,
    insights,
    isLoading,
  }
}
