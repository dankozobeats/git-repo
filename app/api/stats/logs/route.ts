import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, user_id, name, icon, type')
      .eq('user_id', user.id)
      .eq('is_archived', false)

    if (habitsError) {
      return NextResponse.json({ error: habitsError.message }, { status: 500 })
    }

    const { data: logs, error: logsError } = await supabase
      .from('logs')
      .select('id, user_id, habit_id, value, occurred_at, created_at')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 })
    }

    return NextResponse.json({ habits: habits ?? [], logs: logs ?? [] })
  } catch (error) {
    console.error('[stats-logs]', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
