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
    // Récupérer les logs et/ou events selon type/mode pour éviter les trous
    const isBadHabit = habit.type === 'bad'
    const isCounter = habit.tracking_mode === 'counter'
    const history: Array<{ id: string; date: string; time?: string | null; value: number; type: 'log' | 'event' }> = []

    if (isBadHabit || isCounter) {
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

      ;(events || []).forEach(event => {
        history.push({
          id: event.id,
          date: event.event_date,
          time: event.occurred_at,
          value: 1,
          type: 'event',
        })
      })
    }

    if (isBadHabit || !isCounter) {
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

      ;(logs || []).forEach(log => {
        history.push({
          id: log.id,
          date: log.completed_date,
          time: log.created_at,
          value: log.value || 1,
          type: 'log',
        })
      })
    }

    const sorted = history
      .sort((a, b) => {
        const timeA = a.time ? new Date(a.time).getTime() : new Date(a.date + 'T00:00:00').getTime()
        const timeB = b.time ? new Date(b.time).getTime() : new Date(b.date + 'T00:00:00').getTime()
        return timeB - timeA
      })
      .slice(0, 100)

    return NextResponse.json(sorted)
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
