/**
 * Calcule les stats du dashboard côté serveur à partir des données brutes
 * Utilisé pour optimiser le chargement initial (évite le fetch client)
 */

type Habit = {
  id: string
  name: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter' | null
  icon: string | null
  color: string
  description: string | null
  daily_goal_value: number | null
  created_at: string
  user_id: string
  is_archived: boolean
}

type Log = {
  id: string
  habit_id: string
  user_id: string
  completed_date: string
  value: number | null
  created_at: string
}

type Event = {
  id: string
  habit_id: string
  user_id: string
  event_date: string
  occurred_at: string
  notes: string | null
  created_at: string
}

export function computeDashboardStats(habits: Habit[], logs: Log[], events: Event[]) {
  const today = new Date().toISOString().split('T')[0]

  const habitsWithStats = habits.map(habit => {
    const isBadHabit = habit.type === 'bad'
    const usesEvents = habit.tracking_mode === 'counter'

    // Logs et events pour cette habitude
    const habitLogs = logs.filter(l => l.habit_id === habit.id)
    const habitEvents = events.filter(e => e.habit_id === habit.id)

    // Today count
    const todayCount = usesEvents
      ? habitEvents.filter(e => e.event_date === today).length
      : habitLogs.filter(l => l.completed_date === today).length

    // Last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })

    const last7DaysCount = usesEvents
      ? habitEvents.filter(e => last7Days.includes(e.event_date)).length
      : habitLogs.filter(l => last7Days.includes(l.completed_date)).length

    // Last 30 days for completion rate
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })

    const last30DaysCount = usesEvents
      ? habitEvents.filter(e => last30Days.includes(e.event_date)).length
      : habitLogs.filter(l => last30Days.includes(l.completed_date)).length

    const monthCompletionRate = Math.round((last30DaysCount / 30) * 100)

    // Total count
    const totalCount = usesEvents ? habitEvents.length : habitLogs.length

    // Current streak
    let currentStreak = 0
    if (isBadHabit) {
      // Pour bad habit: jours consécutifs SANS craquage
      const eventDates = (usesEvents ? habitEvents.map(e => e.event_date) : habitLogs.map(l => l.completed_date))
        .sort()
        .reverse()
      let checkDate = new Date()

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (eventDates.includes(dateStr)) break
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
        if (currentStreak > 365) break // Limite de sécurité
      }
    } else {
      // Pour good habit: jours consécutifs avec validation
      const logDates = (usesEvents ? habitEvents.map(e => e.event_date) : habitLogs.map(l => l.completed_date))
        .sort()
        .reverse()
      let checkDate = new Date()

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0]
        if (!logDates.includes(dateStr)) break
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
        if (currentStreak > 365) break
      }
    }

    // Last action
    const lastActionDate = usesEvents
      ? (habitEvents[0]?.event_date || null)
      : (habitLogs[0]?.completed_date || null)

    const lastActionTimestamp = usesEvents
      ? (habitEvents[0]?.occurred_at || null)
      : (habitLogs[0]?.created_at || null)

    // Risk level
    let riskLevel: 'good' | 'warning' | 'danger' = 'good'
    if (isBadHabit) {
      if (todayCount > 0) riskLevel = 'danger'
      else if (last7DaysCount > 3) riskLevel = 'warning'
    } else {
      if (todayCount === 0) {
        const daysSinceLastAction = lastActionDate
          ? Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999

        if (daysSinceLastAction >= 3) riskLevel = 'danger'
        else if (daysSinceLastAction >= 1) riskLevel = 'warning'
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
      monthCompletionRate,
      totalCount,
      lastActionDate,
      lastActionTimestamp,
      riskLevel,
    }
  })

  // Summary
  const summary = {
    totalHabits: habits.length,
    goodHabitsCount: habits.filter(h => h.type === 'good').length,
    badHabitsCount: habits.filter(h => h.type === 'bad').length,
    goodHabitsLoggedToday: habitsWithStats.filter(h => h.type === 'good' && h.todayCount > 0).length,
    badHabitsLoggedToday: habitsWithStats.filter(h => h.type === 'bad' && h.todayCount > 0).length,
    totalGoodActions: habitsWithStats
      .filter(h => h.type === 'good')
      .reduce((sum, h) => sum + h.totalCount, 0),
  }

  return {
    habits: habitsWithStats,
    summary,
  }
}
