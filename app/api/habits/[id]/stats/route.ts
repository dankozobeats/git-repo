/**
 * GET /api/habits/[id]/stats
 *
 * Retourne les statistiques complètes d'une habitude calculées côté serveur.
 * Remplace les calculs clients (useRiskAnalysis, useHabitStats).
 *
 * Source unique de vérité : la base de données.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getHabitStats } from '@/lib/habits/getHabitStats'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: habitId } = await context.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Récupérer les infos de l'habitude
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id, name, type, tracking_mode, icon, color, description, daily_goal_value')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (habitError || !habit) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  // 2. Calculer les stats
  const stats = await getHabitStats(supabase, habitId, user.id)

  if (!stats) {
    return NextResponse.json({ error: 'Failed to calculate stats' }, { status: 500 })
  }

  return NextResponse.json({
    habit: {
      id: habit.id,
      name: habit.name,
      type: habit.type,
      tracking_mode: habit.tracking_mode,
      icon: habit.icon,
      color: habit.color,
      description: habit.description,
    },
    stats,
  })
}
