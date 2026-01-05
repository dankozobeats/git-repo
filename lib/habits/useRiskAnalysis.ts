'use client'

/**
 * Hook pour analyser les habitudes à risque et détecter les spirales
 * Retourne les 3 habitudes les plus critiques + un état global
 */

import { useMemo } from 'react'
import type { Database } from '@/types/database'
import { getLocalDate, getLocalDateDaysAgo } from '@/lib/utils/date'

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
  lastActionTimestamp: string | null // Timestamp complet pour affichage précis en heures
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
    const today = getLocalDate()
    const threeDaysAgo = getLocalDateDaysAgo(3)

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
  // Garder les timestamps complets pour calculs précis
  const eventsWithTimestamp = events
    .map(e => ({
      date: e.event_date || e.occurred_at?.split('T')[0],
      timestamp: e.occurred_at || (e.event_date ? e.event_date + 'T00:00:00' : null)
    }))
    .filter((e): e is { date: string; timestamp: string } => Boolean(e.date && e.timestamp))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  // Compter les craquages d'aujourd'hui pour CETTE habitude uniquement
  const todayEvents = events.filter(e => {
    const eventDate = e.event_date || e.occurred_at?.split('T')[0]
    return eventDate === today
  })

  // Pour le mode counter, sommer les valeurs count
  // Pour le mode binaire, compter juste les événements (0 ou 1+)
  const todayCount = habit.tracking_mode === 'counter'
    ? todayEvents.reduce((sum, e) => sum + (e.count || 1), 0)
    : Math.min(todayEvents.length, 1) // Mode binaire: max 1

  if (eventsWithTimestamp.length === 0) {
    return {
      id: habit.id,
      name: habit.name,
      type: 'bad',
      riskLevel: 'good',
      message: 'Aucun craquage enregistré',
      lastActionDate: null,
      lastActionTimestamp: null,
      currentStreak: 0,
      actionSuggestion: 'Maintiens ta vigilance',
      isDoneToday: false,
      todayCount: 0,
      trackingMode: habit.tracking_mode,
      dailyGoalValue: habit.daily_goal_value,
    }
  }

  const lastEvent = eventsWithTimestamp[eventsWithTimestamp.length - 1]
  const lastEventDate = lastEvent.date
  const hoursSinceLastEvent = getHoursDiff(lastEventDate, today)

  let riskLevel: RiskLevel = 'good'
  let message = `Dernier craquage: il y a ${Math.floor(hoursSinceLastEvent / 24)} jours`
  let actionSuggestion = 'Continue ta série'

  // Risque élevé si craquage dans les dernières 24h
  if (hoursSinceLastEvent < 24) {
    riskLevel = 'critical'
    message = todayCount > 1
      ? `${todayCount} craquages aujourd'hui`
      : `Craquage il y a ${Math.floor(hoursSinceLastEvent)}h`
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
    lastActionDate: lastEventDate,
    lastActionTimestamp: lastEvent.timestamp,
    currentStreak: daysSinceLastEvent,
    actionSuggestion,
    isDoneToday: todayCount > 0,
    todayCount,
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
  // Garder les timestamps complets
  const allActions = [
    ...logs.map(l => ({
      date: l.completed_date || l.created_at?.split('T')[0],
      timestamp: l.created_at || (l.completed_date ? l.completed_date + 'T00:00:00' : null)
    })),
    ...events.map(e => ({
      date: e.event_date || e.occurred_at?.split('T')[0],
      timestamp: e.occurred_at || (e.event_date ? e.event_date + 'T00:00:00' : null)
    })),
  ]
    .filter((a): a is { date: string; timestamp: string } => Boolean(a.date && a.timestamp))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  const allDates = allActions.map(a => a.date)

  // Calculer le compteur du jour (somme des values pour aujourd'hui)
  const todayCount = logs
    .filter(l => {
      const logDate = l.completed_date || l.created_at?.split('T')[0]
      return logDate === today
    })
    .reduce((sum, log) => sum + (log.value || 1), 0)

  if (allActions.length === 0) {
    return {
      id: habit.id,
      name: habit.name,
      type: 'good',
      riskLevel: 'warning',
      message: 'Jamais commencé',
      lastActionDate: null,
      lastActionTimestamp: null,
      currentStreak: 0,
      actionSuggestion: 'Commence aujourd\'hui',
      isDoneToday: false,
      todayCount: 0,
      trackingMode: habit.tracking_mode,
      dailyGoalValue: habit.daily_goal_value,
    }
  }

  const lastAction = allActions[allActions.length - 1]
  const lastDate = lastAction.date
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
    lastActionTimestamp: lastAction.timestamp,
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
  const date1 = new Date(dateStr + 'T00:00:00')
  const date2 = new Date(today + 'T00:00:00')
  return Math.floor((date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000))
}

function getHoursDiff(dateStr: string, today: string): number {
  const date1 = new Date(dateStr + 'T00:00:00')
  const date2 = new Date(today + 'T00:00:00')
  return (date2.getTime() - date1.getTime()) / (60 * 60 * 1000)
}
