import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getTodayDateISO } from '@/lib/date-utils'

type RouteContext = { params: Promise<{ id: string }> }

const getToday = () => getTodayDateISO()

export async function POST(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id: habitId } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  console.log('[check-in]', { habitId, userId: user.id })

  const {
    data: habit,
    error: habitError,
  } = await supabase
    .from('habits')
    .select('id, type, tracking_mode, goal_value')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (habitError || !habit) {
    console.error('[check-in error]', habitError ?? new Error('Habit missing'))
    return NextResponse.json({ error: 'Habitude non trouvée' }, { status: 404 })
  }

  if (habit.tracking_mode !== 'binary') {
    return NextResponse.json(
      { error: 'Habitude invalide pour ce type de suivi' },
      { status: 400 }
    )
  }

  const completedDate = getToday()

  const { error: upsertError } = await supabase
    .from('logs')
    .upsert(
      {
        habit_id: habitId,
        user_id: user.id,
        completed_date: completedDate,
        value: 1,
        notes: null,
      },
      {
        onConflict: 'habit_id,completed_date',
        ignoreDuplicates: true,
      }
    )

  if (upsertError) {
    console.error('[check-in error]', upsertError)
    return NextResponse.json(
      { error: 'Impossible d’enregistrer le check-in' },
      { status: 500 }
    )
  }

  const {
    count: todayCount,
    error: countError,
  } = await supabase
    .from('logs')
    .select('id', { count: 'exact', head: true })
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_date', completedDate)

  if (countError) {
    console.error('[check-in error]', countError)
    return NextResponse.json(
      { error: 'Impossible de récupérer le compteur' },
      { status: 500 }
    )
  }

  const goalReached =
    habit.type === 'good' && typeof habit.goal_value === 'number'
      ? (todayCount ?? 0) >= habit.goal_value
      : false

  return NextResponse.json({
    success: true,
    count: todayCount ?? 1,
    goalReached,
  })
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const today = getToday()

  const {
    data: todayLogs,
    error: todayLogsError,
  } = await supabase
    .from('logs')
    .select('id, created_at')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq('completed_date', today)

  if (todayLogsError) {
    console.error('[check-in error]', todayLogsError)
    return NextResponse.json(
      { error: 'Impossible de récupérer les logs' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    count: todayLogs?.length || 0,
    logs: todayLogs || [],
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const today = getToday()

  const {
    data: logs,
    error: logsError,
  } = await supabase
    .from('logs')
    .select('id, created_at')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq('completed_date', today)
    .order('created_at', { ascending: false })
    .limit(1)

  if (logsError) {
    console.error('[check-in error]', logsError)
    return NextResponse.json(
      { error: 'Impossible de récupérer le log à supprimer' },
      { status: 500 }
    )
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({
      success: true,
      count: 0,
      message: 'Aucun log à supprimer',
    })
  }

  const { error: deleteError } = await supabase
    .from('logs')
    .delete()
    .eq('id', logs[0].id)

  if (deleteError) {
    console.error('[check-in error]', deleteError)
    return NextResponse.json(
      { error: 'Impossible de supprimer le log' },
      { status: 500 }
    )
  }

  const {
    count,
    error: remainingError,
  } = await supabase
    .from('logs')
    .select('id', { count: 'exact', head: true })
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq('completed_date', today)

  if (remainingError) {
    console.error('[check-in error]', remainingError)
    return NextResponse.json(
      { error: 'Impossible de recalculer le compteur' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    count: count ?? 0,
  })
}
