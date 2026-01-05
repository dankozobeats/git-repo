/**
 * GET /api/debug/check-events - Debug route to check events for a habit
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const habitId = searchParams.get('habitId') || '7b883981-1fbc-4ab8-a7c4-f8929f20c680'
  const today = new Date().toISOString().split('T')[0]

  const { data: habit } = await supabase
    .from('habits')
    .select('id, name, tracking_mode')
    .eq('id', habitId)
    .single()

  const { data: events, error } = await supabase
    .from('habit_events')
    .select('*')
    .eq('habit_id', habitId)
    .eq('event_date', today)
    .order('occurred_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    habit: {
      id: habit?.id,
      name: habit?.name,
      tracking_mode: habit?.tracking_mode,
    },
    today,
    totalEventsToday: events?.length || 0,
    events: events?.map(e => ({
      id: e.id,
      event_date: e.event_date,
      occurred_at: e.occurred_at,
    })),
  })
}
