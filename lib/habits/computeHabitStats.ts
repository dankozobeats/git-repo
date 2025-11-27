// Utility that transforms calendar aggregates into digestible KPIs for the client UI.
import { toUtcDate } from '@/lib/date-utils'

export type HabitCalendarMap = Record<string, number>

export type HabitStats = {
  todayCount: number
  totalCount: number
  last7DaysCount: number
  currentStreak: number
  monthCompletionRate: number
  rangeInDays: number
}

type ComputeHabitStatsParams = {
  calendarData: HabitCalendarMap
  todayISO: string
  todayCount?: number
  rangeInDays?: number
}

export function computeHabitStats({
  calendarData,
  todayISO,
  todayCount = calendarData[todayISO] ?? 0,
  rangeInDays = 28,
}: ComputeHabitStatsParams): HabitStats {
  const today = toUtcDate(todayISO)
  const totalCount = Object.values(calendarData).reduce((sum, count) => sum + count, 0)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setUTCDate(today.getUTCDate() - 7)
  const last7DaysCount = Object.entries(calendarData).reduce((sum, [date, count]) => {
    return toUtcDate(date) >= sevenDaysAgo ? sum + count : sum
  }, 0)

  let currentStreak = 0
  const cursor = new Date(today)
  for (let dayOffset = 0; dayOffset < rangeInDays; dayOffset++) {
    const isoDate = cursor.toISOString().split('T')[0]
    if (calendarData[isoDate] && calendarData[isoDate] > 0) {
      currentStreak += 1
    } else if (dayOffset === 0) {
      cursor.setUTCDate(cursor.getUTCDate() - 1)
      continue
    } else {
      break
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const daysElapsedThisMonth = today.getUTCDate()
  const filledDaysThisMonth = Object.entries(calendarData).reduce((count, [date, value]) => {
    return toUtcDate(date) >= monthStart ? count + Math.min(1, value) : count
  }, 0)
  const monthCompletionRate =
    daysElapsedThisMonth > 0
      ? Math.min(100, Math.round((filledDaysThisMonth / daysElapsedThisMonth) * 100))
      : 0

  return {
    todayCount,
    totalCount,
    last7DaysCount,
    currentStreak,
    monthCompletionRate,
    rangeInDays,
  }
}
