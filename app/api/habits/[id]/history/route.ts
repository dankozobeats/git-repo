/**
 * GET /api/habits/[id]/history
 * Retourne l'historique complet des logs et events pour une habitude
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: habitId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Vérifier que l'habitude appartient à l'utilisateur
  const { data: habit } = await supabase
    .from('habits')
    .select('id, type, tracking_mode')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  try {
    // Récupérer les logs ou events selon tracking_mode
    const isCounter = habit.tracking_mode === 'counter'

    if (isCounter) {
      // Habitudes en mode compteur utilisent habit_events
      const { data: events, error } = await supabase
        .from('habit_events')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching events:', error)
        throw error
      }

      const history = events?.map(event => ({
        id: event.id,
        date: event.event_date,
        time: event.occurred_at,
        value: 1, // habit_events doesn't have a count column - each event = 1 occurrence
        type: 'event' as const,
      })) || []

      return NextResponse.json(history)
    } else {
      // Pour les bonnes habitudes, récupérer les logs
      const { data: logs, error } = await supabase
        .from('logs')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .order('completed_date', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching logs:', error)
        throw error
      }

      const history = logs?.map(log => ({
        id: log.id,
        date: log.completed_date,
        time: log.created_at,
        value: log.value || 1,
        type: 'log' as const,
      })) || []

      return NextResponse.json(history)
    }
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
