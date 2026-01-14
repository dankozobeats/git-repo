import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type HabitRecord = {
  id: string
  name: string
  icon: string | null
  color: string
  type: string
}

type AgendaItemRecord = {
  id: string
  habit_id: string | null
  title: string
  description: string | null
  scheduled_date: string
  scheduled_time: string | null
  reminder_enabled: boolean
  reminder_offset_minutes: number | null
  is_completed: boolean
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start/end params' }, { status: 400 })
  }

  try {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, icon, color, type')
      .eq('user_id', user.id)
      .eq('is_archived', false)

    if (habitsError) throw habitsError

    const habitMap = new Map(
      (habits || []).map((habit: HabitRecord) => [habit.id, habit])
    )

    const { data: logs, error: logsError } = await supabase
      .from('logs')
      .select('id, habit_id, completed_date, created_at, value')
      .eq('user_id', user.id)
      .gte('completed_date', start)
      .lte('completed_date', end)

    if (logsError) throw logsError

    const { data: events, error: eventsError } = await supabase
      .from('habit_events')
      .select('id, habit_id, event_date, occurred_at')
      .eq('user_id', user.id)
      .gte('event_date', start)
      .lte('event_date', end)

    if (eventsError) throw eventsError

    const { data: agendaItems, error: agendaError } = await supabase
      .from('agenda_items')
      .select('id, habit_id, title, description, scheduled_date, scheduled_time, reminder_enabled, reminder_offset_minutes, is_completed')
      .eq('user_id', user.id)
      .gte('scheduled_date', start)
      .lte('scheduled_date', end)

    if (agendaError) throw agendaError

    const logItems = (logs || []).flatMap((log) => {
      const habit = habitMap.get(log.habit_id)
      if (!habit) return []
      return [
        {
          id: log.id,
          habit_id: log.habit_id,
          habit_name: habit.name,
          habit_icon: habit.icon,
          habit_color: habit.color,
          habit_type: habit.type,
          entry_type: 'log' as const,
          date: log.completed_date,
          occurred_at: log.created_at || `${log.completed_date}T00:00:00.000Z`,
          value: log.value ?? null,
        },
      ]
    })

    const eventItems = (events || []).flatMap((event) => {
      const habit = habitMap.get(event.habit_id)
      if (!habit) return []
      return [
        {
          id: event.id,
          habit_id: event.habit_id,
          habit_name: habit.name,
          habit_icon: habit.icon,
          habit_color: habit.color,
          habit_type: habit.type,
          entry_type: 'event' as const,
          date: event.event_date,
          occurred_at: event.occurred_at || `${event.event_date}T00:00:00.000Z`,
          value: null,
        },
      ]
    })

    const agendaMappedItems = (agendaItems || []).map((item: AgendaItemRecord) => {
      const habit = item.habit_id ? habitMap.get(item.habit_id) : null
      const timePart = item.scheduled_time ? `T${item.scheduled_time}` : 'T00:00:00'
      return {
        id: item.id,
        habit_id: item.habit_id,
        habit_name: habit?.name ?? null,
        habit_icon: habit?.icon ?? null,
        habit_color: habit?.color ?? null,
        habit_type: habit?.type ?? null,
        entry_type: 'agenda' as const,
        date: item.scheduled_date,
        occurred_at: `${item.scheduled_date}${timePart}`,
        value: null,
        title: item.title,
        description: item.description,
        scheduled_time: item.scheduled_time,
        reminder_enabled: item.reminder_enabled,
        reminder_offset_minutes: item.reminder_offset_minutes,
        is_completed: item.is_completed,
      }
    })

    const items = [...logItems, ...eventItems, ...agendaMappedItems].sort(
      (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
    )

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Agenda fetch error:', error)
    return NextResponse.json({ error: 'Failed to load agenda' }, { status: 500 })
  }
}
