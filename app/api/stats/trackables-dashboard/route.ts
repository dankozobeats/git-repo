/**
 * GET /api/stats/trackables-dashboard
 * Retourne les statistiques agrégées pour le dashboard trackables
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DashboardStats } from '@/types/trackables'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // Récupérer tous les trackables actifs
    const { data: trackables } = await supabase
      .from('trackables')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null)

    // Événements du jour
    const { data: todayEvents } = await supabase
      .from('trackable_events')
      .select('*, trackable:trackables(*)')
      .eq('user_id', user.id)
      .gte('occurred_at', `${today}T00:00:00`)
      .lte('occurred_at', `${today}T23:59:59`)

    // Événements de la semaine
    const { data: weekEvents } = await supabase
      .from('trackable_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('occurred_at', `${weekAgo}T00:00:00`)

    // Décisions du jour
    const { data: todayDecisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    // Décisions de la semaine
    const { data: weekDecisions } = await supabase
      .from('decisions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${weekAgo}T00:00:00`)

    // Calculer les stats du jour
    const habitsCompleted =
      todayEvents?.filter((e) => e.kind === 'check').length || 0
    const habitsTarget =
      trackables
        ?.filter((t) => t.type === 'habit' && t.target_per_day)
        .reduce((sum, t) => sum + (t.target_per_day || 0), 0) || 0

    const resistances =
      todayDecisions?.filter((d) => d.decision === 'resist').length || 0
    const relapses =
      todayDecisions?.filter((d) => d.decision === 'relapse').length || 0
    const totalAmountSpent =
      todayDecisions
        ?.filter((d) => d.decision === 'relapse')
        .reduce((sum, d) => sum + (d.amount || 0), 0) || 0

    // Calculer les stats de la semaine
    const weekHabitsCompleted =
      weekEvents?.filter((e) => e.kind === 'check').length || 0
    const weekResistances =
      weekDecisions?.filter((d) => d.decision === 'resist').length || 0
    const weekRelapses =
      weekDecisions?.filter((d) => d.decision === 'relapse').length || 0

    const avgResistanceRate =
      weekResistances + weekRelapses > 0
        ? Math.round((weekResistances / (weekResistances + weekRelapses)) * 100)
        : 0

    const stats: DashboardStats = {
      today: {
        habits_completed: habitsCompleted,
        habits_target: habitsTarget,
        resistances,
        relapses,
        total_amount_spent: totalAmountSpent,
      },
      week: {
        habits_completed: weekHabitsCompleted,
        resistances: weekResistances,
        relapses: weekRelapses,
        avg_resistance_rate: avgResistanceRate,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
