'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayDateISO } from '@/lib/date-utils'
import type { Database } from '@/types/database'

type HabitRow = Database['public']['Tables']['habits']['Row']

export type FocusedHabitData = HabitRow & {
  todayCount: number
  currentStreak: number
  totalLogs: number
  totalEvents: number
  dailyGoal: number
  progress: number
  isComplete: boolean
}

export function useFocusedHabit() {
  const [focusedHabit, setFocusedHabit] = useState<FocusedHabitData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFocusedHabit = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const today = getTodayDateISO()

      // Get the focused habit
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('is_focused', true)
        .eq('is_archived', false)
        .single()

      if (habitError) {
        if (habitError.code === 'PGRST116') {
          // No focused habit found
          setFocusedHabit(null)
          setIsLoading(false)
          return
        }
        throw habitError
      }

      if (!habit) {
        setFocusedHabit(null)
        setIsLoading(false)
        return
      }

      // Get today's count
      let todayCount = 0

      if (habit.type === 'good' && habit.tracking_mode === 'binary') {
        // Good binary habit - check logs table
        const { count, error: logsError } = await supabase
          .from('logs')
          .select('*', { count: 'exact', head: true })
          .eq('habit_id', habit.id)
          .eq('completed_date', today)

        if (logsError) throw logsError
        todayCount = count ?? 0
      } else {
        // Bad or counter habit - check habit_events table
        const { count, error: eventsError } = await supabase
          .from('habit_events')
          .select('*', { count: 'exact', head: true })
          .eq('habit_id', habit.id)
          .eq('event_date', today)

        if (eventsError) throw eventsError
        todayCount = count ?? 0
      }

      // Get current streak
      const { data: streakData } = await supabase.rpc('get_habit_stats', {
        p_habit_id: habit.id,
      })

      const currentStreak = streakData?.[0]?.current_streak ?? 0

      // Get total logs/events
      let totalLogs = 0
      let totalEvents = 0

      if (habit.type === 'good' && habit.tracking_mode === 'binary') {
        const { count } = await supabase
          .from('logs')
          .select('*', { count: 'exact', head: true })
          .eq('habit_id', habit.id)
        totalLogs = count ?? 0
      } else {
        const { count } = await supabase
          .from('habit_events')
          .select('*', { count: 'exact', head: true })
          .eq('habit_id', habit.id)
        totalEvents = count ?? 0
      }

      // Calculate daily goal and progress
      const dailyGoal =
        habit.tracking_mode === 'counter' && typeof habit.daily_goal_value === 'number'
          ? habit.daily_goal_value
          : 1

      const progress = Math.min(1, todayCount / dailyGoal)
      const isComplete = todayCount >= dailyGoal

      setFocusedHabit({
        ...habit,
        todayCount,
        currentStreak,
        totalLogs,
        totalEvents,
        dailyGoal,
        progress,
        isComplete,
      })
    } catch (err) {
      console.error('Error fetching focused habit:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch focused habit')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFocusedHabit()

    // Listen for focus mode changes
    const handleFocusChange = () => {
      fetchFocusedHabit()
    }

    window.addEventListener('focusModeChanged', handleFocusChange)
    window.addEventListener('dayReportRefresh', handleFocusChange)

    return () => {
      window.removeEventListener('focusModeChanged', handleFocusChange)
      window.removeEventListener('dayReportRefresh', handleFocusChange)
    }
  }, [fetchFocusedHabit])

  return {
    focusedHabit,
    isLoading,
    error,
    refetch: fetchFocusedHabit,
  }
}
