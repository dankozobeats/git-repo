/**
 * PATCH /api/habits/[id]/logs/[logId] - Modifier un log
 * DELETE /api/habits/[id]/logs/[logId] - Supprimer un log
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string; logId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: habitId, logId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { date, value } = body
    // Note: time parameter is ignored for logs table (no timestamp column)

    // Vérifier que le log appartient à l'utilisateur
    const { data: existingLog } = await supabase
      .from('logs')
      .select('id')
      .eq('id', logId)
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .single()

    if (!existingLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    // Mettre à jour le log
    const { data, error } = await supabase
      .from('logs')
      .update({
        completed_date: date,
        value: value || 1,
      })
      .eq('id', logId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating log:', error)
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: habitId, logId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Vérifier que le log appartient à l'utilisateur
    const { data: existingLog } = await supabase
      .from('logs')
      .select('id')
      .eq('id', logId)
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .single()

    if (!existingLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    // Supprimer le log
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting log:', error)
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
  }
}
