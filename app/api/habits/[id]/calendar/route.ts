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

  // Récupérer les données selon le mode
  let calendarData: Record<string, number> = {}

  if (habit.tracking_mode === 'counter') {
    const { data: events } = await supabase
      .from('habit_events')
      .select('event_date')
      .eq('habit_id', id)
      .gte('event_date', startDate.toISOString().split('T')[0])
      .order('event_date', { ascending: true })

    calendarData = (events || []).reduce((acc, event) => {
      const date = event.event_date
      if (!acc[date]) acc[date] = 0
      acc[date]++
      return acc
    }, {} as Record<string, number>)

  } else {
    const { data: logs } = await supabase
      .from('logs')
      .select('completed_date')
      .eq('habit_id', id)
      .gte('completed_date', startDate.toISOString().split('T')[0])
      .order('completed_date', { ascending: true })

    calendarData = (logs || []).reduce((acc, log) => {
      acc[log.completed_date] = 1
      return acc
    }, {} as Record<string, number>)
  }

  return NextResponse.json({
    habit,
    calendarData,
    weeks
  })
}
