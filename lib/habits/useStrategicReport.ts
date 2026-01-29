'use client'

/**
 * Hook principal pour le rapport stratégique
 * Agrège les données de plusieurs hooks et calcule les métriques avancées
 */

import { useMemo, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePatternDetection } from './usePatternDetection'
import { useRiskAnalysis } from './useRiskAnalysis'
import type { Database } from '@/types/database'
import {
  calculateHealthScore,
  calculateMonthlyTrend,
  identifyVictories,
  identifyChallenges,
  generatePredictions,
  type HealthScore,
  type MonthlyTrend,
  type Victory,
  type Challenge,
  type Prediction,
} from './strategicMetrics'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']

type HabitStatsData = {
  totalGood: number
  totalBad: number
  topHabits: Array<{
    id: string
    name: string
    type: 'good' | 'bad'
    total: number
    streak: number
    icon: string | null
  }>
}

export type StrategicReportData = {
  healthScore: HealthScore
  monthlyTrend: MonthlyTrend
  victories: Victory[]
  challenges: Challenge[]
  patterns: ReturnType<typeof usePatternDetection>['patterns']
  predictions: Prediction[]
  strategyBriefing: string | null
  isLoading: boolean
}

export function useStrategicReport(period: number = 30): StrategicReportData {
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [trackables, setTrackables] = useState<any[]>([])
  const [trackableEvents, setTrackableEvents] = useState<any[]>([])
  const [strategyBriefing, setStrategyBriefing] = useState<string | null>(null)
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

      const [habitsRes, logsRes, eventsRes, trackablesRes, trackableEventsRes] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false),
        supabase
          .from('logs')
          .select('*')
          .eq('user_id', user.id)
          .order('completed_date', { ascending: false }),
        supabase
          .from('habit_events')
          .select('*')
          .eq('user_id', user.id)
          .order('event_date', { ascending: false }),
        supabase
          .from('trackables')
          .select('*')
          .eq('user_id', user.id)
          .is('archived_at', null),
        supabase
          .from('trackable_events')
          .select('*, trackable:trackables(*)')
          .eq('user_id', user.id)
          .order('occurred_at', { ascending: false }),
      ])

      setHabits(habitsRes.data || [])
      setLogs(logsRes.data || [])
      setEvents(eventsRes.data || [])
      setTrackables(trackablesRes.data || [])
      setTrackableEvents(trackableEventsRes.data || [])

      // Fetch AI Strategy Briefing
      try {
        const aiRes = await fetch('/api/reports/ai-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personality: 'scientist', type: 'strategic', period: `${period}j` })
        })
        if (aiRes.ok) {
          const aiData = await aiRes.json()
          setStrategyBriefing(aiData.summary || null)
        }
      } catch (e) {
        console.error('Failed to fetch AI strategy briefing', e)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const patterns = usePatternDetection(habits, logs, events)
  const risks = useRiskAnalysis(habits, logs, events)

  // Calculer les stats simplifiées
  const stats: HabitStatsData = useMemo(() => {
    const goodLogs = logs.filter(l => {
      const habit = habits.find(h => h.id === l.habit_id)
      return habit?.type === 'good'
    })
    const badLogs = logs.filter(l => {
      const habit = habits.find(h => h.id === l.habit_id)
      return habit?.type === 'bad'
    })

    const totalGood = goodLogs.reduce((sum, l) => sum + (l.value || 1), 0) +
      events.filter(e => {
        const habit = habits.find(h => h.id === e.habit_id)
        return habit?.type === 'good'
      }).length

    const totalBad = badLogs.length +
      events.filter(e => {
        const habit = habits.find(h => h.id === e.habit_id)
        return habit?.type === 'bad'
      }).length

    const topHabits = habits.slice(0, 8).map(h => ({
      id: h.id,
      name: h.name,
      type: h.type as 'good' | 'bad',
      total: logs.filter(l => l.habit_id === h.id).length +
        events.filter(e => e.habit_id === h.id).length,
      streak: 0,
      icon: h.icon,
    }))

    return { totalGood, totalBad, topHabits }
  }, [habits, logs, events])

  const healthScore = useMemo(
    () => calculateHealthScore(stats, patterns, risks),
    [stats.totalGood, stats.totalBad, patterns.patterns.length, risks.topRisks.length]
  )

  const monthlyTrend = useMemo(
    () => calculateMonthlyTrend(stats),
    [stats.totalGood, stats.totalBad]
  )

  const victories = useMemo(
    () => identifyVictories(stats, risks),
    [stats.topHabits, risks.topRisks]
  )

  const challenges = useMemo(
    () => identifyChallenges(patterns, risks),
    [patterns.patterns, risks.topRisks, risks.globalState]
  )

  const predictions = useMemo(
    () => generatePredictions(patterns),
    [patterns.patterns, patterns.mostDangerousDay, patterns.averageRelapseCycle]
  )

  return {
    healthScore,
    monthlyTrend,
    victories,
    challenges,
    patterns: patterns.patterns,
    predictions,
    strategyBriefing,
    isLoading,
  }
}
