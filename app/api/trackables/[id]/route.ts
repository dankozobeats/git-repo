/**
 * GET /api/trackables/[id]
 * Récupère un trackable spécifique
 *
 * PATCH /api/trackables/[id]
 * Met à jour un trackable
 *
 * DELETE /api/trackables/[id]
 * Archive un trackable (soft delete)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('trackables')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching trackable:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching trackable:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trackable' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const updates = await request.json()

    const { data, error } = await supabase
      .from('trackables')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating trackable:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating trackable:', error)
    return NextResponse.json(
      { error: 'Failed to update trackable' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const supabase = await createClient()
  const { id } = await context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Soft delete - set archived_at
    const { data, error } = await supabase
      .from('trackables')
      .update({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error archiving trackable:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error archiving trackable:', error)
    return NextResponse.json(
      { error: 'Failed to archive trackable' },
      { status: 500 }
    )
  }
}
