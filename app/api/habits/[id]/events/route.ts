import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getLocalDate } from '@/lib/utils/date'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: habit } = await supabase
    .from('habits')
    .select('id, type, tracking_mode')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  const now = new Date()
  const today = getLocalDate()

  // Pour le mode binaire, vérifier s'il existe déjà un event aujourd'hui
  if (habit.tracking_mode !== 'counter') {
    const { data: existingEvent } = await supabase
      .from('habit_events')
      .select('id')
      .eq('habit_id', id)
      .eq('user_id', user.id)
      .eq('event_date', today)
      .maybeSingle()

    if (existingEvent) {
      // Retourner l'event existant sans en créer un nouveau
      return NextResponse.json({
        ...existingEvent,
        count: 1,
        message: 'Craquage déjà enregistré pour aujourd\'hui'
      })
    }
  }

  const { data, error } = await supabase
    .from('habit_events')
    .insert({
      habit_id: id,
      user_id: user.id,
      event_date: today,
      occurred_at: now.toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting event:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Compter le nombre total de craquages aujourd'hui
  const { count } = await supabase
    .from('habit_events')
    .select('*', { count: 'exact', head: true })
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .eq('event_date', today)

  revalidatePath('/')
  revalidatePath(`/habits/${id}`)

  return NextResponse.json({ ...data, count: count || 1 })
}
