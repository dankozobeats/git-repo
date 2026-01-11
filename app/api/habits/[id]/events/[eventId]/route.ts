/**
 * PATCH /api/habits/[id]/events/[eventId] - Modifier un event
 * DELETE /api/habits/[id]/events/[eventId] - Supprimer un event
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string; eventId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: habitId, eventId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { date, time } = body

    // Vérifier que l'event appartient à l'utilisateur
    const { data: existingEvent } = await supabase
      .from('habit_events')
      .select('id, occurred_at')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .single()

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Construire le timestamp occurred_at
    let occurredAt = existingEvent.occurred_at
    if (time) {
      occurredAt = new Date(`${date}T${time}:00`).toISOString()
    } else if (date) {
      // Si on change la date mais pas l'heure, garder l'heure existante
      const existingTime = new Date(existingEvent.occurred_at).toTimeString().slice(0, 8)
      occurredAt = new Date(`${date}T${existingTime}`).toISOString()
    }

    // Mettre à jour l'event
    const { data, error } = await supabase
      .from('habit_events')
      .update({
        event_date: date,
        occurred_at: occurredAt,
      })
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: habitId, eventId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Vérifier que l'event appartient à l'utilisateur
    const { data: existingEvent } = await supabase
      .from('habit_events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .single()

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Supprimer l'event
    const { error } = await supabase
      .from('habit_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
