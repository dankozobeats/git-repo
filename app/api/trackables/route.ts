/**
 * GET /api/trackables
 * Récupère tous les trackables (habits + states) de l'utilisateur
 *
 * POST /api/trackables
 * Crée un nouveau trackable
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { CreateTrackablePayload } from '@/types/trackables'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'habit' | 'state' | null (all)
  const includeArchived = searchParams.get('includeArchived') === 'true'

  try {
    let query = supabase
      .from('trackables')
      .select('*')
      .eq('user_id', user.id)
      .order('is_priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (type && (type === 'habit' || type === 'state')) {
      query = query.eq('type', type)
    }

    if (!includeArchived) {
      query = query.is('archived_at', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching trackables:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching trackables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trackables' },
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
    const payload: CreateTrackablePayload = await request.json()

    const { data, error } = await supabase
      .from('trackables')
      .insert({
        user_id: user.id,
        type: payload.type,
        name: payload.name,
        description: payload.description || null,
        icon: payload.icon || null,
        color: payload.color || null,
        is_priority: payload.is_priority ?? false,
        target_per_day: payload.target_per_day || null,
        unit: payload.unit || null,
        tags: payload.tags || null,
        missions: payload.missions || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trackable:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating trackable:', error)
    return NextResponse.json(
      { error: 'Failed to create trackable' },
      { status: 500 }
    )
  }
}
