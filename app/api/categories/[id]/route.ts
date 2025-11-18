import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let payload: { name?: string; color?: string | null }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const name = payload.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ name, color: payload.color || null })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, category: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Remove category reference from habits
  const { error: clearError } = await supabase
    .from('habits')
    .update({ category_id: null })
    .eq('category_id', id)
    .eq('user_id', user.id)

  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 })
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
