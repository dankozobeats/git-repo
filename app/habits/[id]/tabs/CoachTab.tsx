'use client'

/**
 * Onglet Coach & Insights - IA + Gamification
 */

import HabitCoach from '../HabitCoach'
import GamificationPanel from '../GamificationPanel'
import type { HabitCalendarMap } from '@/lib/habits/computeHabitStats'

type Habit = {
  id: string
  name: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter' | null
  goal_value: number | null
  goal_type: 'daily' | 'weekly' | 'monthly' | null
  goal_description: string | null
}

type CoachTabProps = {
  habit: Habit
  stats: {
    totalCount: number
    last7DaysCount: number
    currentStreak: number
    todayCount: number
    monthCompletionRate: number
  }
  calendarData: HabitCalendarMap
}

export default function CoachTab({ habit, stats, calendarData }: CoachTabProps) {
  const dynamicCoachStats = {
    totalCount: stats.totalCount,
    last7DaysCount: stats.last7DaysCount,
    currentStreak: stats.currentStreak,
    todayCount: stats.todayCount,
    monthPercentage: stats.monthCompletionRate,
  }

  return (
    <div className="space-y-6 p-4">
      {/* Coach IA */}
      <HabitCoach habitId={habit.id} stats={dynamicCoachStats} />

      {/* Gamification */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          🏆 Progression & Badges
        </h2>
        <GamificationPanel
          habit={habit}
          calendarData={calendarData}
          totalCount={stats.totalCount}
          last7DaysCount={stats.last7DaysCount}
          currentStreak={stats.currentStreak}
        />
      </div>
    </div>
  )
}
