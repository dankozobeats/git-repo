/**
 * GET /api/decisions
 * Récupère les décisions avec filtres optionnels
 *
 * POST /api/decisions
 * Crée une nouvelle décision en réponse à un état observé
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CreateDecisionPayload } from '@/types/trackables'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const stateEventId = searchParams.get('state_event_id')
  const decision = searchParams.get('decision') // 'resist' | 'relapse' | etc.
  const from = searchParams.get('from') // ISO date
  const to = searchParams.get('to') // ISO date
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    let query = supabase
      .from('decisions')
      .select(`
        *,
        state_event:trackable_events(
          *,
          trackable:trackables(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (stateEventId) {
      query = query.eq('state_event_id', stateEventId)
    }

    if (decision) {
      query = query.eq('decision', decision)
    }

    if (from) {
      query = query.gte('created_at', from)
    }

    if (to) {
      query = query.lte('created_at', to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching decisions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching decisions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decisions' },
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
    const payload: CreateDecisionPayload = await request.json()

    // Vérifier que le state_event existe et appartient à l'utilisateur
    const { data: stateEvent, error: stateEventError } = await supabase
      .from('trackable_events')
      .select('*, trackable:trackables(*)')
      .eq('id', payload.state_event_id)
      .eq('user_id', user.id)
      .eq('kind', 'observe')
      .single()

    if (stateEventError || !stateEvent) {
      return NextResponse.json(
        { error: 'State event not found or invalid' },
        { status: 404 }
      )
    }

    // Créer la décision
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        user_id: user.id,
        state_event_id: payload.state_event_id,
        decision: payload.decision,
        amount: payload.amount || null,
        delay_minutes: payload.delay_minutes || null,
        replacement_action: payload.replacement_action || null,
        meta_json: payload.meta_json || {},
      })
      .select(`
        *,
        state_event:trackable_events(
          *,
          trackable:trackables(*)
        )
      `)
      .single()

    if (error) {
      console.error('Error creating decision:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating decision:', error)
    return NextResponse.json(
      { error: 'Failed to create decision' },
      { status: 500 }
    )
  }
}
