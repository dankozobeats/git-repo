/**
 * Calcule les statistiques d'une habitude côté serveur
 *
 * Source unique de vérité : la base de données
 * Remplace useRiskAnalysis et useHabitStats
 *
 * Usage:
 *   const stats = await getHabitStats(supabase, habitId, userId)
 */

import { SupabaseClient } from '@supabase/supabase-js'

export type HabitStats = {
  todayCount: number
  currentStreak: number
  last7DaysCount: number
  monthCompletionRate: number
  totalCount: number
  lastActionDate: string | null
  lastActionTimestamp: string | null
  riskLevel: 'good' | 'warning' | 'danger'
}

export async function getHabitStats(
  supabase: SupabaseClient,
  habitId: string,
  userId: string
): Promise<HabitStats | null> {
  // 1. Récupérer les infos de l'habitude
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id, type, tracking_mode')
    .eq('id', habitId)
    .eq('user_id', userId)
    .single()

  if (habitError || !habit) {
    return null
  }

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const isBadHabit = habit.type === 'bad'
  const isCounter = habit.tracking_mode === 'counter'

  // Pour les habitudes counter (bonnes ou mauvaises) : utiliser habit_events
  // Pour les habitudes binaires (bonnes uniquement) : utiliser logs
  if (isCounter || isBadHabit) {
    // Récupérer les events
    const { data: events } = await supabase
      .from('habit_events')
      .select('id, event_date, occurred_at')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('event_date', { ascending: false })

    const eventsArray = events || []
    const logActions: Array<{ date: string; timestamp: string }> = []

    if (isBadHabit) {
      const { data: logs } = await supabase
        .from('logs')
        .select('completed_date, created_at, value')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .order('completed_date', { ascending: false })

      ;(logs || []).forEach(log => {
        logActions.push({
          date: log.completed_date,
          timestamp: log.created_at || `${log.completed_date}T00:00:00`,
        })
      })
    }

    const mergedDates = [...eventsArray.map(e => e.event_date), ...logActions.map(l => l.date)]

    // Compteur aujourd'hui
    const todayEvents = mergedDates.filter(date => date === today)
    const todayCount = habit.tracking_mode === 'counter'
      ? todayEvents.length
      : Math.min(todayEvents.length, 1) // Binary: max 1

    // Compteur 7 derniers jours
    const last7DaysCount = mergedDates.filter(
      date => date >= sevenDaysAgo && date <= today
    ).length

    // Total
    const totalCount = mergedDates.length

    // Streak : jours consécutifs SANS craquage (pour bad habits)
    let currentStreak = 0
    const sortedDates = [...new Set(mergedDates)].sort().reverse()

    let checkDate = new Date()
    while (currentStreak < 365) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sortedDates.includes(dateStr)) {
        // Craquage ce jour-là, streak cassé
        break
      }
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Taux de complétion du mois : % de jours sans craquage
    const daysWithEvents = new Set(
      mergedDates.filter(date => date >= monthStart && date <= today)
    ).size
    const daysElapsed = new Date().getDate()
    const monthCompletionRate = daysElapsed > 0 ? ((daysElapsed - daysWithEvents) / daysElapsed) * 100 : 100

    // Dernier craquage
    const lastActionDate = sortedDates.length > 0 ? sortedDates[0] : null
    const lastActionTimestamp = [
      ...eventsArray.map(e => e.occurred_at),
      ...logActions.map(l => l.timestamp),
    ]
      .filter(Boolean)
      .sort()
      .reverse()[0] || null

    // Niveau de risque
    let riskLevel: 'good' | 'warning' | 'danger' = 'good'

    if (isBadHabit) {
      // Pour les mauvaises habitudes: craquage = danger
      if (todayCount > 0) {
        riskLevel = 'danger'
      } else if (currentStreak < 7 && totalCount > 0) {
        riskLevel = 'warning'
      }
    } else {
      // Pour les bonnes habitudes counter: pas fait aujourd'hui = warning/danger
      if (todayCount === 0) {
        const daysSinceLastAction = lastActionDate
          ? Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999

        if (daysSinceLastAction >= 3) {
          riskLevel = 'danger'
        } else if (daysSinceLastAction >= 1) {
          riskLevel = 'warning'
        }
      }
    }

    return {
      todayCount,
      currentStreak,
      last7DaysCount,
      monthCompletionRate: Math.round(monthCompletionRate),
      totalCount,
      lastActionDate,
      lastActionTimestamp,
      riskLevel,
    }
  } else {
    // Pour les bonnes habitudes : récupérer les logs
    const { data: logs } = await supabase
      .from('logs')
      .select('id, completed_date, value')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .order('completed_date', { ascending: false })

    const logsArray = logs || []

    // Compteur aujourd'hui
    const todayLogs = logsArray.filter(l => l.completed_date === today)
    const todayCount = todayLogs.reduce((sum, l) => sum + (l.value || 1), 0)

    // Compteur 7 derniers jours
    const last7DaysCount = logsArray
      .filter(l => l.completed_date >= sevenDaysAgo && l.completed_date <= today)
      .reduce((sum, l) => sum + (l.value || 1), 0)

    // Total
    const totalCount = logsArray.reduce((sum, l) => sum + (l.value || 1), 0)

    // Streak : jours consécutifs avec validation
    let currentStreak = 0
    const uniqueDates = [...new Set(logsArray.map(l => l.completed_date))].sort().reverse()

    let checkDate = new Date()
    while (currentStreak < 365) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (!uniqueDates.includes(dateStr)) {
        // Pas de validation ce jour-là, streak cassé
        break
      }
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Taux de complétion du mois
    const daysWithLogs = new Set(
      logsArray.filter(l => l.completed_date >= monthStart && l.completed_date <= today).map(l => l.completed_date)
    ).size
    const daysElapsed = new Date().getDate()
    const monthCompletionRate = daysElapsed > 0 ? (daysWithLogs / daysElapsed) * 100 : 0

    // Dernière validation
    const lastActionDate = uniqueDates.length > 0 ? uniqueDates[0] : null

    return {
      todayCount,
      currentStreak,
      last7DaysCount,
      monthCompletionRate: Math.round(monthCompletionRate),
      totalCount,
      lastActionDate,
      lastActionTimestamp: lastActionDate ? `${lastActionDate}T12:00:00Z` : null,
      riskLevel: 'good',
    }
  }
}
