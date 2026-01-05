/**
 * POST /api/habits/[id]/events/cleanup-duplicates
 * Nettoie les événements en double pour une habitude en mode binaire
 * Garde uniquement le premier événement de chaque jour
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: habitId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Vérifier que l'habitude existe et est en mode binaire
  const { data: habit } = await supabase
    .from('habits')
    .select('id, tracking_mode')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  if (habit.tracking_mode === 'counter') {
    return NextResponse.json({
      message: 'Habit is in counter mode, no duplicates to clean',
      deleted: 0
    })
  }

  try {
    // Récupérer tous les events de cette habitude
    const { data: events } = await supabase
      .from('habit_events')
      .select('id, event_date, occurred_at')
      .eq('habit_id', habitId)
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })
      .order('occurred_at', { ascending: true })

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'No events found', deleted: 0 })
    }

    // Grouper par date et garder uniquement le premier de chaque jour
    const eventsByDate = new Map<string, typeof events>()
    events.forEach(event => {
      const date = event.event_date
      if (!eventsByDate.has(date)) {
        eventsByDate.set(date, [])
      }
      eventsByDate.get(date)!.push(event)
    })

    // Collecter les IDs à supprimer (tous sauf le premier de chaque jour)
    const idsToDelete: string[] = []
    eventsByDate.forEach(dayEvents => {
      if (dayEvents.length > 1) {
        // Garder le premier, supprimer les autres
        idsToDelete.push(...dayEvents.slice(1).map(e => e.id))
      }
    })

    if (idsToDelete.length === 0) {
      return NextResponse.json({ message: 'No duplicates found', deleted: 0 })
    }

    // Supprimer les doublons
    const { error } = await supabase
      .from('habit_events')
      .delete()
      .in('id', idsToDelete)

    if (error) throw error

    return NextResponse.json({
      message: `Cleaned up ${idsToDelete.length} duplicate event(s)`,
      deleted: idsToDelete.length,
      daysAffected: Array.from(eventsByDate.entries())
        .filter(([_, events]) => events.length > 1)
        .map(([date]) => date)
    })
  } catch (error) {
    console.error('Error cleaning duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to clean duplicates' },
      { status: 500 }
    )
  }
}
