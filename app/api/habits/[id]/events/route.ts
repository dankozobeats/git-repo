import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

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
    .select('id, type')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  // Les events sont pour les mauvaises habitudes (craquages)
  // Pas de restriction sur tracking_mode

  const now = new Date()
  const { data, error } = await supabase
    .from('habit_events')
    .insert({
      habit_id: id,
      user_id: user.id,
      event_date: now.toISOString().split('T')[0],
      occurred_at: now.toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting event:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/')
  revalidatePath(`/habits/${id}`)

  return NextResponse.json(data)
}
