import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      habit_id,
      scheduled_date,
      scheduled_time,
      reminder_enabled,
      reminder_offset_minutes,
      is_completed,
    } = body

    if (!title || !scheduled_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('agenda_items')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        habit_id: habit_id || null,
        scheduled_date,
        scheduled_time: scheduled_time || null,
        reminder_enabled: Boolean(reminder_enabled),
        reminder_offset_minutes: reminder_offset_minutes ?? null,
        is_completed: Boolean(is_completed),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Error creating agenda item:', error)
    return NextResponse.json({ error: 'Failed to create agenda item' }, { status: 500 })
  }
}
