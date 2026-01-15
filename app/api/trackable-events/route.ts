/**
 * GET /api/trackable-events
 * Récupère les événements avec filtres optionnels
 *
 * POST /api/trackable-events
 * Crée un nouvel événement (check pour habitude, observe pour état)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CreateEventPayload } from '@/types/trackables'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const trackableId = searchParams.get('trackable_id')
  const kind = searchParams.get('kind') // 'check' | 'observe'
  const from = searchParams.get('from') // ISO date
  const to = searchParams.get('to') // ISO date
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    let query = supabase
      .from('trackable_events')
      .select('*, trackable:trackables(*)')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(limit)

    if (trackableId) {
      query = query.eq('trackable_id', trackableId)
    }

    if (kind && (kind === 'check' || kind === 'observe')) {
      query = query.eq('kind', kind)
    }

    if (from) {
      query = query.gte('occurred_at', from)
    }

    if (to) {
      query = query.lte('occurred_at', to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload: CreateEventPayload = await request.json()

    // Vérifier que le trackable existe et appartient à l'utilisateur
    const { data: trackable, error: trackableError } = await supabase
      .from('trackables')
      .select('*')
      .eq('id', payload.trackable_id)
      .eq('user_id', user.id)
      .single()

    if (trackableError || !trackable) {
      return NextResponse.json(
        { error: 'Trackable not found' },
        { status: 404 }
      )
    }

    // Créer l'événement
    const { data, error } = await supabase
      .from('trackable_events')
      .insert({
        user_id: user.id,
        trackable_id: payload.trackable_id,
        kind: payload.kind,
        occurred_at: payload.occurred_at || new Date().toISOString(),
        value_int: payload.value_int || null,
        value_float: payload.value_float || null,
        meta_json: payload.meta_json || {},
      })
      .select('*, trackable:trackables(*)')
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
