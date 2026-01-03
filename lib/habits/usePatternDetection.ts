'use client'

/**
 * Hook pour détecter les patterns inconscients dans les mauvaises habitudes
 * Analyse les corrélations, cycles, déclencheurs et tendances temporelles
 */

import { useMemo } from 'react'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']

export type PatternType = 'temporal' | 'cascade' | 'trigger' | 'cycle'

export type Pattern = {
  id: string
  type: PatternType
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  confidence: number // 0-100
  icon: string
  relatedHabits: string[] // IDs des habitudes concernées
}

export type PatternInsights = {
  patterns: Pattern[]
  hasSignificantPatterns: boolean
  mostDangerousDay?: string
  averageRelapseCycle?: number
}

export function usePatternDetection(
  habits: Habit[],
  logs: Log[],
  events: Event[]
): PatternInsights {
  return useMemo(() => {
    const patterns: Pattern[] = []
    const badHabits = habits.filter(h => h.type === 'bad')
    const goodHabits = habits.filter(h => h.type === 'good')

    // 1. PATTERNS TEMPORELS - Jours de la semaine à risque
    const dayPattern = detectDayOfWeekPattern(events, badHabits)
    if (dayPattern) patterns.push(dayPattern)

    // 2. PATTERNS DE CASCADE - Effet domino entre habitudes
    const cascadePatterns = detectCascadePatterns(events, badHabits)
    patterns.push(...cascadePatterns)

    // 3. PATTERNS DE DÉCLENCHEURS - Bonnes habitudes manquées → rechutes
    const triggerPatterns = detectTriggerPatterns(logs, events, goodHabits, badHabits)
    patterns.push(...triggerPatterns)

    // 4. PATTERNS CYCLIQUES - Fréquence régulière de rechute
    const cyclePattern = detectCyclicPattern(events, badHabits)
    if (cyclePattern) patterns.push(cyclePattern)

    // Trier par sévérité et confiance
    const sortedPatterns = patterns.sort((a, b) => {
      const severityScore = { high: 3, medium: 2, low: 1 }
      const scoreA = severityScore[a.severity] * a.confidence
      const scoreB = severityScore[b.severity] * b.confidence
      return scoreB - scoreA
    })

    // Statistiques globales
    const mostDangerousDay = getMostDangerousDay(events)
    const averageRelapseCycle = getAverageRelapseCycle(events)

    return {
      patterns: sortedPatterns.slice(0, 4), // Top 4 patterns
      hasSignificantPatterns: sortedPatterns.some(p => p.severity === 'high' && p.confidence >= 70),
      mostDangerousDay,
      averageRelapseCycle,
    }
  }, [habits, logs, events])
}

// 1. Détecter les jours de la semaine à risque
function detectDayOfWeekPattern(events: Event[], badHabits: Habit[]): Pattern | null {
  if (events.length < 5) return null

  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const dayCounts: Record<number, number> = {}

  events.forEach(e => {
    const date = e.event_date || e.occurred_at?.split('T')[0]
    if (date) {
      const dayOfWeek = new Date(date).getDay()
      dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1
    }
  })

  const total = events.length
  const maxDay = Object.entries(dayCounts).reduce((max, [day, count]) =>
    count > (dayCounts[parseInt(max[0])] || 0) ? [day, count] : max
  , ['0', 0])

  const dayIndex = parseInt(maxDay[0])
  const percentage = Math.round((maxDay[1] / total) * 100)

  if (percentage >= 30) {
    return {
      id: 'day-pattern',
      type: 'temporal',
      severity: percentage >= 50 ? 'high' : 'medium',
      title: 'Jour à risque élevé',
      description: `Tu craques ${percentage}% du temps le ${dayNames[dayIndex]}`,
      confidence: Math.min(95, percentage + (events.length > 10 ? 20 : 0)),
      icon: '📅',
      relatedHabits: badHabits.map(h => h.id),
    }
  }

  return null
}

// 2. Détecter les effets domino (cascade)
function detectCascadePatterns(events: Event[], badHabits: Habit[]): Pattern[] {
  if (badHabits.length < 2 || events.length < 8) return []

  const patterns: Pattern[] = []
  const CASCADE_WINDOW_HOURS = 24

  // Grouper les événements par date
  const eventsByDate: Record<string, Event[]> = {}
  events.forEach(e => {
    const date = e.event_date || e.occurred_at?.split('T')[0]
    if (date) {
      if (!eventsByDate[date]) eventsByDate[date] = []
      eventsByDate[date].push(e)
    }
  })

  // Analyser les corrélations entre habitudes
  for (let i = 0; i < badHabits.length; i++) {
    for (let j = i + 1; j < badHabits.length; j++) {
      const habit1 = badHabits[i]
      const habit2 = badHabits[j]

      let cascadeCount = 0
      let totalHabit1Events = 0

      Object.values(eventsByDate).forEach(dayEvents => {
        const hasHabit1 = dayEvents.some(e => e.habit_id === habit1.id)
        const hasHabit2 = dayEvents.some(e => e.habit_id === habit2.id)

        if (hasHabit1) {
          totalHabit1Events++
          if (hasHabit2) cascadeCount++
        }
      })

      if (totalHabit1Events >= 3) {
        const cascadeRate = (cascadeCount / totalHabit1Events) * 100

        if (cascadeRate >= 50) {
          patterns.push({
            id: `cascade-${habit1.id}-${habit2.id}`,
            type: 'cascade',
            severity: cascadeRate >= 75 ? 'high' : 'medium',
            title: 'Effet domino identifié',
            description: `${habit1.name} → ${habit2.name} (${cascadeCount} fois détecté)`,
            confidence: Math.min(90, Math.round(cascadeRate + (cascadeCount > 5 ? 15 : 0))),
            icon: '🔗',
            relatedHabits: [habit1.id, habit2.id],
          })
        }
      }
    }
  }

  return patterns
}

// 3. Détecter les déclencheurs (bonnes habitudes manquées)
function detectTriggerPatterns(
  logs: Log[],
  events: Event[],
  goodHabits: Habit[],
  badHabits: Habit[]
): Pattern[] {
  if (goodHabits.length === 0 || events.length < 5) return []

  const patterns: Pattern[] = []

  goodHabits.forEach(goodHabit => {
    // Obtenir toutes les dates des 30 derniers jours
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const goodHabitLogs = logs.filter(l => l.habit_id === goodHabit.id)
    const loggedDates = new Set(
      goodHabitLogs.map(l => l.completed_date || l.created_at?.split('T')[0]).filter(Boolean)
    )

    // Jours où la bonne habitude a été manquée
    const missedDays: string[] = []
    const today = new Date()
    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (!loggedDates.has(dateStr)) {
        missedDays.push(dateStr)
      }
    }

    // Compter les rechutes dans les 24h après avoir manqué la bonne habitude
    let relapseAfterMiss = 0
    let totalMissedDays = missedDays.length

    missedDays.forEach(missedDay => {
      const nextDay = new Date(missedDay)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = nextDay.toISOString().split('T')[0]

      const hadRelapseNextDay = events.some(e => {
        const eventDate = e.event_date || e.occurred_at?.split('T')[0]
        return eventDate === missedDay || eventDate === nextDayStr
      })

      if (hadRelapseNextDay) relapseAfterMiss++
    })

    if (totalMissedDays >= 5 && relapseAfterMiss >= 3) {
      const triggerRate = Math.round((relapseAfterMiss / totalMissedDays) * 100)

      if (triggerRate >= 40) {
        patterns.push({
          id: `trigger-${goodHabit.id}`,
          type: 'trigger',
          severity: triggerRate >= 60 ? 'high' : 'medium',
          title: 'Déclencheur potentiel',
          description: `Quand tu sautes "${goodHabit.name}", tu craques ${triggerRate}% du temps`,
          confidence: Math.min(85, triggerRate + (relapseAfterMiss > 5 ? 10 : 0)),
          icon: '💡',
          relatedHabits: [goodHabit.id, ...badHabits.map(h => h.id)],
        })
      }
    }
  })

  return patterns
}

// 4. Détecter les cycles réguliers
function detectCyclicPattern(events: Event[], badHabits: Habit[]): Pattern | null {
  if (events.length < 6) return null

  const sortedDates = events
    .map(e => e.event_date || e.occurred_at?.split('T')[0])
    .filter((d): d is string => Boolean(d))
    .sort()

  if (sortedDates.length < 4) return null

  // Calculer les intervalles entre rechutes
  const intervals: number[] = []
  for (let i = 1; i < sortedDates.length; i++) {
    const days = getDaysDiff(sortedDates[i - 1], sortedDates[i])
    intervals.push(days)
  }

  const avgInterval = intervals.reduce((sum, d) => sum + d, 0) / intervals.length
  const variance = intervals.reduce((sum, d) => sum + Math.pow(d - avgInterval, 2), 0) / intervals.length
  const stdDev = Math.sqrt(variance)

  // Si la variance est faible, c'est un cycle régulier
  const isRegular = stdDev < avgInterval * 0.3

  if (isRegular && avgInterval >= 3 && avgInterval <= 14) {
    return {
      id: 'cycle-pattern',
      type: 'cycle',
      severity: avgInterval <= 7 ? 'high' : 'medium',
      title: `Cycle de ${Math.round(avgInterval)} jours`,
      description: `Tu rechutes environ tous les ${Math.round(avgInterval)} jours depuis ${Math.round(intervals.length * avgInterval / 7)} semaines`,
      confidence: Math.min(90, Math.round(100 - (stdDev / avgInterval) * 100)),
      icon: '📊',
      relatedHabits: badHabits.map(h => h.id),
    }
  }

  return null
}

// HELPERS

function getMostDangerousDay(events: Event[]): string | undefined {
  if (events.length < 5) return undefined

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const dayCounts: Record<number, number> = {}

  events.forEach(e => {
    const date = e.event_date || e.occurred_at?.split('T')[0]
    if (date) {
      const dayOfWeek = new Date(date).getDay()
      dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1
    }
  })

  const maxDay = Object.entries(dayCounts).reduce((max, [day, count]) =>
    count > (dayCounts[parseInt(max[0])] || 0) ? [day, count] : max
  , ['0', 0])

  return dayNames[parseInt(maxDay[0])]
}

function getAverageRelapseCycle(events: Event[]): number | undefined {
  if (events.length < 4) return undefined

  const sortedDates = events
    .map(e => e.event_date || e.occurred_at?.split('T')[0])
    .filter((d): d is string => Boolean(d))
    .sort()

  if (sortedDates.length < 3) return undefined

  const intervals: number[] = []
  for (let i = 1; i < sortedDates.length; i++) {
    const days = getDaysDiff(sortedDates[i - 1], sortedDates[i])
    intervals.push(days)
  }

  return Math.round(intervals.reduce((sum, d) => sum + d, 0) / intervals.length)
}

function getDaysDiff(dateStr1: string, dateStr2: string): number {
  const date1 = new Date(dateStr1)
  const date2 = new Date(dateStr2)
  return Math.abs(Math.floor((date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000)))
}
