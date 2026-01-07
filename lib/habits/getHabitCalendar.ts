// Utility that fetches the last N days of activity for a habit in a tracking-mode aware way.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { toUtcDate } from '@/lib/date-utils'
import type { HabitCalendarMap } from './computeHabitStats'

type SupabaseServerClient = SupabaseClient<Database>

type GetHabitCalendarParams = {
  client: SupabaseServerClient
  habitId: string
  habitType: Database['public']['Tables']['habits']['Row']['type'] | null
  trackingMode: Database['public']['Tables']['habits']['Row']['tracking_mode'] | null
  todayISO: string
  rangeInDays?: number
}

export async function getHabitCalendar({
  client,
  habitId,
  habitType,
  trackingMode,
  todayISO,
  rangeInDays = 28,
}: GetHabitCalendarParams): Promise<{ calendarData: HabitCalendarMap; todayCount: number }> {
  const today = toUtcDate(todayISO)
  const windowStart = new Date(today)
  windowStart.setUTCDate(today.getUTCDate() - rangeInDays)
  const windowStartISO = windowStart.toISOString().split('T')[0]

  const isBadHabit = habitType === 'bad'
  const isCounter = trackingMode === 'counter'
  const calendarData: HabitCalendarMap = {}

  if (isBadHabit || isCounter) {
    const { data } = await client
      .from('habit_events')
      .select('event_date')
      .eq('habit_id', habitId)
      .gte('event_date', windowStartISO)
      .order('event_date', { ascending: true })

    ;((data as unknown as { event_date: string }[] | null) || []).forEach(event => {
      const date = event.event_date
      calendarData[date] = (calendarData[date] ?? 0) + 1
    })
  }

  if (isBadHabit || !isCounter) {
    const { data } = await client
      .from('logs')
      .select('completed_date')
      .eq('habit_id', habitId)
      .gte('completed_date', windowStartISO)
      .order('completed_date', { ascending: false })

    ;((data as unknown as { completed_date: string }[] | null) || []).forEach(log => {
      const date = log.completed_date
      calendarData[date] = (calendarData[date] ?? 0) + 1
    })
  }

  return {
    calendarData,
    todayCount: calendarData[todayISO] ?? 0,
  }
}
