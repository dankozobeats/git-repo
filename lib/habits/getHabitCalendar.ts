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
}: GetHabitCalendarParams): Promise<{ calendarData: HabitCalendarMap; todayCount: number; todayMissionsProgress: string[] }> {
  const today = toUtcDate(todayISO)
  const windowStart = new Date(today)
  windowStart.setUTCDate(today.getUTCDate() - rangeInDays)
  const windowStartISO = windowStart.toISOString().split('T')[0]

  const isBadHabit = habitType === 'bad'
  const isCounter = trackingMode === 'counter'
  const calendarData: HabitCalendarMap = {}
  let todayMissionsProgress: string[] = []

  if (isBadHabit || isCounter) {
    const { data } = await client
      .from('habit_events')
      .select('event_date, meta_json')
      .eq('habit_id', habitId)
      .gte('event_date', windowStartISO)
      .order('event_date', { ascending: true })

      ; ((data as unknown as { event_date: string }[] | null) || []).forEach(event => {
        const date = event.event_date
        calendarData[date] = (calendarData[date] ?? 0) + 1
        if (date === todayISO && (event as any).meta_json?.completed_mission_ids) {
          todayMissionsProgress = (event as any).meta_json.completed_mission_ids
        }
      })
  }

  if (isBadHabit || !isCounter) {
    const { data } = await client
      .from('logs')
      .select('completed_date, meta_json')
      .eq('habit_id', habitId)
      .gte('completed_date', windowStartISO)
      .order('completed_date', { ascending: false })

      ; ((data as unknown as { completed_date: string }[] | null) || []).forEach(log => {
        const date = log.completed_date
        calendarData[date] = (calendarData[date] ?? 0) + 1
        if (date === todayISO && (log as any).meta_json?.completed_mission_ids) {
          todayMissionsProgress = (log as any).meta_json.completed_mission_ids
        }
      })
  }

  return {
    calendarData,
    todayCount: calendarData[todayISO] ?? 0,
    todayMissionsProgress
  }
}
