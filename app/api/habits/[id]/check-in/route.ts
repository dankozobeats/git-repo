import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Get the habit to check its type
  const { data: habit } = await supabase
    .from('habits')
    .select('type, goal_value, goal_type')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habitude non trouvée' }, { status: 404 })
  }

  const habitId = id
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  // For bad habits, allow multiple entries per day
  // For good habits, allow multiple but track them separately
  const { error } = await supabase
    .from('logs')
    .insert({
      habit_id: habitId,
      user_id: user.id,
      completed_date: today,
      created_at: now,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get updated count for today
  const { data: todayLogs } = await supabase
    .from('logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_date', today)

  const goalReached = habit.goal_value ? (todayLogs?.length || 0) >= habit.goal_value : false

  return NextResponse.json({ 
    success: true,
    count: todayLogs?.length || 1,
    goalReached
  })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Get today's logs count
  const { data: todayLogs } = await supabase
    .from('logs')
    .select('id, created_at')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq('completed_date', today)

  return NextResponse.json({
    count: todayLogs?.length || 0,
    logs: todayLogs || []
  })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Get the most recent log for today
  const { data: logs } = await supabase
    .from('logs')
    .select('id')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq('completed_date', today)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!logs || logs.length === 0) {
    return NextResponse.json({ error: 'Aucun log à supprimer' }, { status: 404 })
  }

  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', logs[0].id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get updated count
  const { data: remainingLogs } = await supabase
    .from('logs')
    .select('id')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq('completed_date', today)

  return NextResponse.json({
    success: true,
    count: remainingLogs?.length || 0,
  })
}
