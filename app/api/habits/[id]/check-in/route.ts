import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getTodayDateISO } from '@/lib/date-utils'
import { checkRateLimit } from '@/lib/api/ratelimit'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

const getToday = () => getTodayDateISO()

const IdSchema = z.string().uuid()

// Normalise la cible quotidienne : 1 pour les habitudes binaires, goal explicite pour un compteur.
const resolveCounterRequirement = (trackingMode: 'binary' | 'counter' | null, dailyGoal: number | null) => {
  if (trackingMode === 'counter' && typeof dailyGoal === 'number' && dailyGoal > 0) {
    return dailyGoal
  }
  return 1
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  // 1. Rate Limiting (WRITE)
  const rateLimit = await checkRateLimit(request, 'WRITE')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.reset },
      { status: 429, headers: { 'Retry-After': rateLimit.reset.toString() } }
    )
  }

  const { id: habitId } = await params

  // 2. Validation ID
  const idValidation = IdSchema.safeParse(habitId)
  if (!idValidation.success) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

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
    .select('id, type, tracking_mode, goal_value, daily_goal_value')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (habitError || !habit) {
    console.error('[check-in error]', habitError ?? new Error('Habit missing'))
    return NextResponse.json({ error: 'Habitude non trouvée' }, { status: 404 })
  }

  const completedDate = getToday()
  const isCounter = habit.tracking_mode === 'counter'
  const counterRequired = resolveCounterRequirement(habit.tracking_mode, habit.daily_goal_value)

  if (isCounter) {
    const { error: insertError } = await supabase.from('habit_events').insert({
      habit_id: habitId,
      user_id: user.id,
      event_date: completedDate,
      occurred_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('[check-in error]', insertError)
      return NextResponse.json(
        { error: 'Impossible d’enregistrer le check-in' },
        { status: 500 }
      )
    }

    const {
      count: eventCount,
      error: countError,
    } = await supabase
      .from('habit_events')
      .select('id', { count: 'exact', head: true })
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .eq('event_date', completedDate)

    if (countError) {
      console.error('[check-in error]', countError)
      return NextResponse.json(
        { error: 'Impossible de récupérer le compteur' },
        { status: 500 }
      )
    }

    const currentCount = eventCount ?? 0
    const goalReached = currentCount >= counterRequired

    return NextResponse.json({
      success: true,
      count: currentCount,
      goalReached,
      counterRequired,
      remaining: Math.max(0, counterRequired - currentCount),
    })
  }

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

  const persistedCount = typeof todayCount === 'number' ? todayCount : 1
  const goalReached =
    habit.type === 'good' && typeof habit.goal_value === 'number'
      ? persistedCount >= habit.goal_value
      : persistedCount >= counterRequired

  return NextResponse.json({
    success: true,
    count: persistedCount,
    goalReached,
    counterRequired,
    remaining: Math.max(0, counterRequired - persistedCount),
  })
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  // 1. Rate Limiting (READ)
  const rateLimit = await checkRateLimit(request, 'READ')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.reset },
      { status: 429, headers: { 'Retry-After': rateLimit.reset.toString() } }
    )
  }

  const { id } = await params

  // 2. Validation ID
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

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
    data: habit,
    error: habitError,
  } = await supabase
    .from('habits')
    .select('tracking_mode')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (habitError || !habit) {
    return NextResponse.json({ error: 'Habitude non trouvée' }, { status: 404 })
  }

  const isCounter = habit.tracking_mode === 'counter'
  const table = isCounter ? 'habit_events' : 'logs'
  const dateColumn = isCounter ? 'event_date' : 'completed_date'

  // Correction typage strict: removed created_at from select
  const { data, error } = await supabase
    .from(table)
    .select(isCounter ? 'id, occurred_at' : 'id')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq(dateColumn, today)

  if (error) {
    console.error('[check-in error]', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer les données' },
      { status: 500 }
    )
  }

  if (isCounter) {
    return NextResponse.json({
      count: data?.length || 0,
      events: data || [],
    })
  }

  return NextResponse.json({
    count: data?.length || 0,
    logs: data || [],
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  // 1. Rate Limiting (WRITE)
  const rateLimit = await checkRateLimit(request, 'WRITE')
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: rateLimit.reset },
      { status: 429, headers: { 'Retry-After': rateLimit.reset.toString() } }
    )
  }

  const { id } = await params

  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

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
    data: habit,
    error: habitError,
  } = await supabase
    .from('habits')
    .select('tracking_mode')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (habitError || !habit) {
    return NextResponse.json({ error: 'Habitude non trouvée' }, { status: 404 })
  }

  const isCounter = habit.tracking_mode === 'counter'
  const table = isCounter ? 'habit_events' : 'logs'
  const dateColumn = isCounter ? 'event_date' : 'completed_date'
  const orderColumn = isCounter ? 'occurred_at' : 'completed_date'

  // Correction typage strict: created_at -> completed_date or generic order

  const {
    data: rows,
    error: fetchError,
  } = await supabase
    .from(table)
    .select('id')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq(dateColumn, today)
    .order(orderColumn, { ascending: false })
    .limit(1)

  if (fetchError) {
    console.error('[check-in error]', fetchError)
    return NextResponse.json(
      { error: 'Impossible de récupérer les données' },
      { status: 500 }
    )
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      success: true,
      count: 0,
    })
  }

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .eq('id', rows[0].id)

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
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq(dateColumn, today)

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
