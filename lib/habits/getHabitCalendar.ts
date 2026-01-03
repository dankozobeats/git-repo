// Utility that fetches the last N days of activity for a habit in a tracking-mode aware way.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { toUtcDate } from '@/lib/date-utils'
import type { HabitCalendarMap } from './computeHabitStats'

type SupabaseServerClient = SupabaseClient<Database>

type GetHabitCalendarParams = {
  client: SupabaseServerClient
  habitId: string
  trackingMode: Database['public']['Tables']['habits']['Row']['tracking_mode'] | null
  todayISO: string
  rangeInDays?: number
}

export async function getHabitCalendar({
  client,
  habitId,
  trackingMode,
  todayISO,
  rangeInDays = 28,
}: GetHabitCalendarParams): Promise<{ calendarData: HabitCalendarMap; todayCount: number }> {
  const today = toUtcDate(todayISO)
  const windowStart = new Date(today)
  windowStart.setUTCDate(today.getUTCDate() - rangeInDays)
  const windowStartISO = windowStart.toISOString().split('T')[0]

  if (trackingMode === 'counter') {
    const { data } = await client
      .from('habit_events')
      .select('event_date')
      .eq('habit_id', habitId)
      .gte('event_date', windowStartISO)
      .order('event_date', { ascending: true })

    const calendarData = ((data as unknown as { event_date: string }[] | null) || []).reduce((acc, event) => {
      const date = event.event_date
      acc[date] = (acc[date] ?? 0) + 1
      return acc
    }, {} as HabitCalendarMap)

    return {
      calendarData,
      todayCount: calendarData[todayISO] ?? 0,
    }
  }

  const { data } = await client
    .from('logs')
    .select('completed_date')
    .eq('habit_id', habitId)
    .gte('completed_date', windowStartISO)
    .order('completed_date', { ascending: false })

  const calendarData = ((data as unknown as { completed_date: string }[] | null) || []).reduce((acc, log) => {
    acc[log.completed_date] = 1
    return acc
  }, {} as HabitCalendarMap)

  return {
    calendarData,
    todayCount: calendarData[todayISO] ?? 0,
  }
}
