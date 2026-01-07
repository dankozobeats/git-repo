import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const weeks = parseInt(searchParams.get('weeks') || '4')
  
  // Calculer la plage de dates
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - (weeks * 7))

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  // Récupérer les données selon le mode/type
  const calendarData: Record<string, number> = {}
  const isBadHabit = habit.type === 'bad'
  const isCounter = habit.tracking_mode === 'counter'
  const startDateISO = startDate.toISOString().split('T')[0]

  if (isBadHabit || isCounter) {
    const { data: events } = await supabase
      .from('habit_events')
      .select('event_date')
      .eq('habit_id', id)
      .gte('event_date', startDateISO)
      .order('event_date', { ascending: true })

    ;(events || []).forEach(event => {
      const date = event.event_date
      calendarData[date] = (calendarData[date] ?? 0) + 1
    })
  }

  if (isBadHabit || !isCounter) {
    const { data: logs } = await supabase
      .from('logs')
      .select('completed_date')
      .eq('habit_id', id)
      .gte('completed_date', startDateISO)
      .order('completed_date', { ascending: true })

    ;(logs || []).forEach(log => {
      const date = log.completed_date
      calendarData[date] = (calendarData[date] ?? 0) + 1
    })
  }

  return NextResponse.json({
    habit,
    calendarData,
    weeks
  })
}
