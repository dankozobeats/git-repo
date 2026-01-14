import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from('agenda_items')
      .update({
        title: body.title,
        description: body.description ?? null,
        habit_id: body.habit_id || null,
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time || null,
        reminder_enabled: Boolean(body.reminder_enabled),
        reminder_offset_minutes: body.reminder_offset_minutes ?? null,
        is_completed: Boolean(body.is_completed),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Error updating agenda item:', error)
    return NextResponse.json({ error: 'Failed to update agenda item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { error } = await supabase
      .from('agenda_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting agenda item:', error)
    return NextResponse.json({ error: 'Failed to delete agenda item' }, { status: 500 })
  }
}
