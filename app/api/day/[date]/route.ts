import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Récupérer toutes les habitudes de l'utilisateur
  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)

  // Logs binary du jour
  const { data: logs } = await supabase
    .from('logs')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('completed_date', date)

  // Events counter du jour
  const { data: events } = await supabase
    .from('habit_events')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('event_date', date)

  const loggedHabitIds = new Set(logs?.map(l => l.habit_id) || [])
  const eventsByHabit = (events || []).reduce((acc, e) => {
    if (!acc[e.habit_id]) acc[e.habit_id] = 0
    acc[e.habit_id]++
    return acc
  }, {} as Record<string, number>)

  const goodHabits = habits?.filter(h => h.type === 'good') || []
  const badHabits = habits?.filter(h => h.type === 'bad') || []

  const goodHabitsCompleted = goodHabits.filter(h => 
    h.tracking_mode === 'counter' 
      ? (eventsByHabit[h.id] || 0) >= (h.daily_goal_value || 1)
      : loggedHabitIds.has(h.id)
  )

  const badHabitsCracked = badHabits.filter(h =>
    h.tracking_mode === 'counter'
      ? (eventsByHabit[h.id] || 0) > 0
      : loggedHabitIds.has(h.id)
  )

  const totalBadCracks = badHabits.reduce((sum, h) => {
    if (h.tracking_mode === 'counter') {
      return sum + (eventsByHabit[h.id] || 0)
    }
    return sum + (loggedHabitIds.has(h.id) ? 1 : 0)
  }, 0)

  const successRate = goodHabits.length > 0 
    ? Math.round((goodHabitsCompleted.length / goodHabits.length) * 100)
    : 0

  return NextResponse.json({
    date,
    goodHabits: {
      total: goodHabits.length,
      completed: goodHabitsCompleted.length,
      details: goodHabitsCompleted.map(h => ({
        name: h.name,
        icon: h.icon,
        count: eventsByHabit[h.id] || 1
      }))
    },
    badHabits: {
      total: badHabits.length,
      cracked: badHabitsCracked.length,
      totalCracks: totalBadCracks,
      details: badHabitsCracked.map(h => ({
        name: h.name,
        icon: h.icon,
        count: eventsByHabit[h.id] || 1
      }))
    },
    successRate
  })
}
