'use client'

/**
 * Hook pour analyser les habitudes à risque et détecter les spirales
 * Retourne les 3 habitudes les plus critiques + un état global
 */

import { useMemo } from 'react'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']

export type RiskLevel = 'critical' | 'warning' | 'good'

export type RiskHabit = {
  id: string
  name: string
  type: 'good' | 'bad'
  riskLevel: RiskLevel
  message: string
  lastActionDate: string | null
  currentStreak: number
  actionSuggestion: string
  isDoneToday: boolean // Nouvelle propriété pour tracker si fait aujourd'hui
  todayCount: number // Compteur du jour pour les habitudes en mode counter
  trackingMode: 'binary' | 'counter' | null
  dailyGoalValue: number | null
}

export type GlobalState = {
  riskLevel: RiskLevel
  spiralDetected: boolean
  message: string
  recentRelapses: number
}

type UseRiskAnalysisResult = {
  topRisks: RiskHabit[]
  remainingHabits: RiskHabit[]
  globalState: GlobalState
}

export function useRiskAnalysis(
  habits: Habit[],
  logs: Log[],
  events: Event[]
): UseRiskAnalysisResult {
  return useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Analyser chaque habitude
    const analyzed = habits
      .filter(h => !h.is_archived)
      .map(habit => analyzeHabit(habit, logs, events, today))
      .sort((a, b) => getRiskScore(a.riskLevel) - getRiskScore(b.riskLevel))

    // Détecter les rechutes récentes (mauvaises habitudes)
    const recentRelapses = events.filter(e => {
      const eventDate = e.event_date || e.occurred_at?.split('T')[0]
      return eventDate && eventDate >= threeDaysAgo && eventDate <= today
    }).length

    // État global
    const spiralDetected = recentRelapses >= 2
    const criticalCount = analyzed.filter(h => h.riskLevel === 'critical').length

    let globalRiskLevel: RiskLevel = 'good'
    let globalMessage = 'Tout va bien, continue comme ça'

    if (spiralDetected || criticalCount >= 2) {
      globalRiskLevel = 'critical'
      globalMessage = `Spirale détectée: ${recentRelapses} rechute${recentRelapses > 1 ? 's' : ''} en 3 jours`
    } else if (criticalCount === 1 || recentRelapses === 1) {
      globalRiskLevel = 'warning'
      globalMessage = 'Vigilance nécessaire aujourd\'hui'
    }

    return {
      topRisks: analyzed.slice(0, 3),
      remainingHabits: analyzed.slice(3), // Toutes les habitudes après le Top 3
      globalState: {
        riskLevel: globalRiskLevel,
        spiralDetected,
        message: globalMessage,
        recentRelapses,
      },
    }
  }, [habits, logs, events])
}

function analyzeHabit(
  habit: Habit,
  logs: Log[],
  events: Event[],
  today: string
): RiskHabit {
  const habitLogs = logs.filter(l => l.habit_id === habit.id)
  const habitEvents = events.filter(e => e.habit_id === habit.id)

  if (habit.type === 'bad') {
    return analyzeBadHabit(habit, habitEvents, today)
  } else {
    return analyzeGoodHabit(habit, habitLogs, habitEvents, today)
  }
}

function analyzeBadHabit(habit: Habit, events: Event[], today: string): RiskHabit {
  const sortedEvents = events
    .map(e => e.event_date || e.occurred_at?.split('T')[0])
    .filter((d): d is string => Boolean(d))
    .sort()

  if (sortedEvents.length === 0) {
    return {
      id: habit.id,
      name: habit.name,
      type: 'bad',
      riskLevel: 'good',
      message: 'Aucun craquage enregistré',
      lastActionDate: null,
      currentStreak: 0,
      actionSuggestion: 'Maintiens ta vigilance',
      isDoneToday: false,
      todayCount: 0,
      trackingMode: habit.tracking_mode,
      dailyGoalValue: habit.daily_goal_value,
    }
  }

  const lastEvent = sortedEvents[sortedEvents.length - 1]
  const hoursSinceLastEvent = getHoursDiff(lastEvent, today)

  let riskLevel: RiskLevel = 'good'
  let message = `Dernier craquage: il y a ${Math.floor(hoursSinceLastEvent / 24)} jours`
  let actionSuggestion = 'Continue ta série'

  // Risque élevé si craquage dans les dernières 24h
  if (hoursSinceLastEvent < 24) {
    riskLevel = 'critical'
    message = `Craquage il y a ${Math.floor(hoursSinceLastEvent)}h`
    actionSuggestion = 'Action de substitution immédiate'
  } else if (hoursSinceLastEvent < 48) {
    riskLevel = 'warning'
    message = 'Craquage récent - vigilance'
    actionSuggestion = 'Identifie ton déclencheur'
  }

  // Calculer la série sans craquage
  const daysSinceLastEvent = Math.floor(hoursSinceLastEvent / 24)

  return {
    id: habit.id,
    name: habit.name,
    type: 'bad',
    riskLevel,
    message,
    lastActionDate: lastEvent,
    currentStreak: daysSinceLastEvent,
    actionSuggestion,
    isDoneToday: false, // Les mauvaises habitudes n'ont pas de concept de "fait aujourd'hui"
    todayCount: 0,
    trackingMode: habit.tracking_mode,
    dailyGoalValue: habit.daily_goal_value,
  }
}

function analyzeGoodHabit(
  habit: Habit,
  logs: Log[],
  events: Event[],
  today: string
): RiskHabit {
  const allDates = [
    ...logs.map(l => l.completed_date || l.created_at?.split('T')[0]),
    ...events.map(e => e.event_date || e.occurred_at?.split('T')[0]),
  ]
    .filter((d): d is string => Boolean(d))
    .sort()

  // Calculer le compteur du jour (somme des values pour aujourd'hui)
  const todayCount = logs
    .filter(l => {
      const logDate = l.completed_date || l.created_at?.split('T')[0]
      return logDate === today
    })
    .reduce((sum, log) => sum + (log.value || 1), 0)

  if (allDates.length === 0) {
    return {
      id: habit.id,
      name: habit.name,
      type: 'good',
      riskLevel: 'warning',
      message: 'Jamais commencé',
      lastActionDate: null,
      currentStreak: 0,
      actionSuggestion: 'Commence aujourd\'hui',
      isDoneToday: false,
      todayCount: 0,
      trackingMode: habit.tracking_mode,
      dailyGoalValue: habit.daily_goal_value,
    }
  }

  const lastDate = allDates[allDates.length - 1]
  const daysSinceLastAction = getDaysDiff(lastDate, today)
  const isDoneToday = daysSinceLastAction === 0

  // Calculer la série actuelle
  let currentStreak = 0
  const cursor = new Date(today)
  for (let i = 0; i < 365; i++) {
    const dateKey = cursor.toISOString().split('T')[0]
    if (allDates.includes(dateKey)) {
      currentStreak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  let riskLevel: RiskLevel = 'good'
  let message = `Série de ${currentStreak} jour${currentStreak > 1 ? 's' : ''}`
  let actionSuggestion = 'Continue ta série'

  // Pour les habitudes en mode compteur
  if (habit.tracking_mode === 'counter') {
    const goal = habit.daily_goal_value || 1
    if (todayCount === 0) {
      riskLevel = 'critical'
      message = `0/${goal} aujourd'hui`
      actionSuggestion = 'Commence maintenant'
    } else if (todayCount < goal) {
      riskLevel = 'warning'
      message = `${todayCount}/${goal} aujourd'hui`
      actionSuggestion = 'Continue, presque là'
    } else {
      riskLevel = 'warning'
      message = `✓ ${todayCount}/${goal} aujourd'hui!`
      actionSuggestion = 'Objectif atteint'
    }
  } else {
    // Pour les habitudes binaires (mode classique)
    if (daysSinceLastAction > 0) {
      riskLevel = 'critical'
      message = `Pas fait depuis ${daysSinceLastAction} jour${daysSinceLastAction > 1 ? 's' : ''}`
      actionSuggestion = 'Fais-le maintenant'
    } else if (currentStreak >= 5) {
      riskLevel = 'warning'
      message = `✓ Fait aujourd'hui! ${currentStreak} jours d'affilée`
      actionSuggestion = 'Continue ta série'
    } else if (isDoneToday) {
      riskLevel = 'warning'
      message = `✓ Fait aujourd'hui! Série: ${currentStreak}j`
      actionSuggestion = 'Continue ta série'
    }
  }

  return {
    id: habit.id,
    name: habit.name,
    type: 'good',
    riskLevel,
    message,
    lastActionDate: lastDate,
    currentStreak,
    actionSuggestion,
    isDoneToday,
    todayCount,
    trackingMode: habit.tracking_mode,
    dailyGoalValue: habit.daily_goal_value,
  }
}

function getRiskScore(level: RiskLevel): number {
  switch (level) {
    case 'critical':
      return 0
    case 'warning':
      return 1
    case 'good':
      return 2
  }
}

function getDaysDiff(dateStr: string, today: string): number {
  const date1 = new Date(dateStr)
  const date2 = new Date(today)
  return Math.floor((date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000))
}

function getHoursDiff(dateStr: string, today: string): number {
  const date1 = new Date(dateStr)
  const date2 = new Date(today)
  return (date2.getTime() - date1.getTime()) / (60 * 60 * 1000)
}
