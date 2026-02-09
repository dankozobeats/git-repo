/**
 * GET /api/dashboard
 *
 * Retourne toutes les habitudes actives de l'utilisateur avec leurs statistiques.
 * Remplace la logique client qui fetche les habits puis calcule les stats.
 *
 * Architecture serveur-first : tous les calculs sont faits côté serveur.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getHabitStats } from '@/lib/habits/getHabitStats'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Récupérer toutes les habitudes actives
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, name, type, tracking_mode, icon, color, description, daily_goal_value, is_archived, missions')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (habitsError) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }

  const habitsArray = habits || []
  if (habitsArray.length === 0) {
    return NextResponse.json({
      habits: [],
      summary: { totalHabits: 0, goodHabitsCount: 0, badHabitsCount: 0, goodHabitsLoggedToday: 0, badHabitsLoggedToday: 0, totalGoodActions: 0 }
    })
  }

  // 2. Batch Fetch : Récupérer TOUS les événements et logs de l'utilisateur en 2 requêtes
  const [eventsResult, logsResult] = await Promise.all([
    supabase
      .from('habit_events')
      .select('habit_id, event_date, occurred_at, meta_json')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false }),
    supabase
      .from('logs')
      .select('habit_id, completed_date, value, meta_json')
      .eq('user_id', user.id)
      .order('completed_date', { ascending: false })
  ])

  const allEvents = eventsResult.data || []
  const allLogs = logsResult.data || []

  // 3. Calculer les stats pour chaque habitude en mémoire
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const habitsWithStats = habitsArray.map(habit => {
    const isBadHabit = habit.type === 'bad'
    const isCounter = habit.tracking_mode === 'counter'

    // Filtrer les data pour CETTE habitude
    const habitEvents = allEvents.filter(e => e.habit_id === habit.id)
    const habitLogs = allLogs.filter(l => l.habit_id === habit.id)

    const mergedDates = [
      ...habitEvents.map(e => e.event_date),
      ...habitLogs.map(l => l.completed_date)
    ]
    const sortedUniqueDates = [...new Set(mergedDates)].sort().reverse()

    // Aujourd'hui
    const todayEvents = habitEvents.filter(e => e.event_date === today)
    const todayLogs = habitLogs.filter(l => l.completed_date === today)

    let todayCount = 0
    if (isCounter) {
      todayCount = todayEvents.length + todayLogs.reduce((sum, l) => sum + (l.value || 1), 0)
    } else {
      todayCount = (todayEvents.length > 0 || todayLogs.length > 0) ? 1 : 0
    }

    // Missions Progress (Dernière entrée de meta_json d'aujourd'hui)
    const latestTodayEvent = [...todayEvents].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))[0]
    const latestTodayLog = todayLogs[0]
    const todayMissionsProgress = latestTodayEvent?.meta_json?.completed_mission_ids
      || latestTodayLog?.meta_json?.completed_mission_ids
      || []

    // Streak
    let currentStreak = 0
    let checkDate = new Date()
    for (let i = 0; i < 365; i++) {
      const dStr = checkDate.toISOString().split('T')[0]
      const hasAction = sortedUniqueDates.includes(dStr)

      if (isBadHabit) {
        if (hasAction) break // Craquage = stop streak
        currentStreak++
      } else {
        if (!hasAction) break // Pas d'action = stop streak
        currentStreak++
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Autres stats
    const last7DaysCount = mergedDates.filter(d => d >= sevenDaysAgo && d <= today).length
    const totalCount = mergedDates.length

    const daysWithActionsMonth = new Set(mergedDates.filter(d => d >= monthStart && d <= today)).size
    const daysElapsed = new Date().getDate()
    let monthCompletionRate = 0
    if (isBadHabit) {
      monthCompletionRate = daysElapsed > 0 ? ((daysElapsed - daysWithActionsMonth) / daysElapsed) * 100 : 100
    } else {
      monthCompletionRate = daysElapsed > 0 ? (daysWithActionsMonth / daysElapsed) * 100 : 0
    }

    // Risk Level
    let riskLevel: 'good' | 'warning' | 'danger' = 'good'
    const lastActionDate = sortedUniqueDates[0] || null

    if (isBadHabit) {
      if (todayCount > 0) riskLevel = 'danger'
      else if (currentStreak < 7 && totalCount > 0) riskLevel = 'warning'
    } else {
      if (todayCount === 0) {
        const daysSinceLast = lastActionDate
          ? Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (86400000))
          : 999
        if (daysSinceLast >= 3) riskLevel = 'danger'
        else if (daysSinceLast >= 1) riskLevel = 'warning'
      }
    }

    return {
      id: habit.id,
      name: habit.name,
      type: habit.type,
      tracking_mode: habit.tracking_mode,
      icon: habit.icon,
      color: habit.color,
      description: habit.description,
      daily_goal_value: habit.daily_goal_value,
      todayCount,
      currentStreak,
      last7DaysCount,
      monthCompletionRate: Math.round(monthCompletionRate),
      totalCount,
      lastActionDate,
      lastActionTimestamp: latestTodayEvent?.occurred_at || (lastActionDate ? `${lastActionDate}T12:00:00Z` : null),
      riskLevel,
      missions: habit.missions || [],
      todayMissionsProgress
    }
  })

  // 4. Statistiques globales
  const goodHabits = habitsWithStats.filter(h => h.type === 'good')
  const badHabits = habitsWithStats.filter(h => h.type === 'bad')
  const goodHabitsLoggedToday = goodHabits.filter(h => h.todayCount > 0).length
  const badHabitsLoggedToday = badHabits.reduce((sum, h) => sum + h.todayCount, 0)
  const totalGoodActions = goodHabits.reduce((sum, h) => sum + h.todayCount, 0)

  return NextResponse.json({
    habits: habitsWithStats,
    summary: {
      totalHabits: habitsWithStats.length,
      goodHabitsCount: goodHabits.length,
      badHabitsCount: badHabits.length,
      goodHabitsLoggedToday,
      badHabitsLoggedToday,
      totalGoodActions,
    },
  })
}
