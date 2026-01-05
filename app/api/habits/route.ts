/**
 * GET /api/habits - Récupère toutes les habitudes de l'utilisateur
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: habits, error } = await supabase
      .from('habits')
      .select('id, name, type, tracking_mode, is_archived')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ habits: habits || [] })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    )
  }
}
