/**
 * GET /api/dashboard
 *
 * Retourne toutes les habitudes actives de l'utilisateur avec leurs statistiques.
 * Remplace la logique client qui fetche les habits puis calcule les stats.
 *
 * Architecture serveur-first : tous les calculs sont faits côté serveur.
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getHabitStats } from '@/lib/habits/getHabitStats'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Récupérer toutes les habitudes actives
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, name, type, tracking_mode, icon, color, description, daily_goal_value, is_archived, missions')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (habitsError) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }

  const habitsArray = habits || []

  // 2. Calculer les stats pour chaque habitude en parallèle
  const habitsWithStats = await Promise.all(
    habitsArray.map(async (habit) => {
      const stats = await getHabitStats(supabase, habit.id, user.id)

      return {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        tracking_mode: habit.tracking_mode,
        icon: habit.icon,
        color: habit.color,
        description: habit.description,
        daily_goal_value: habit.daily_goal_value,
        // Stats calculées côté serveur
        todayCount: stats?.todayCount || 0,
        currentStreak: stats?.currentStreak || 0,
        last7DaysCount: stats?.last7DaysCount || 0,
        monthCompletionRate: stats?.monthCompletionRate || 0,
        totalCount: stats?.totalCount || 0,
        lastActionDate: stats?.lastActionDate || null,
        lastActionTimestamp: stats?.lastActionTimestamp || null,
        riskLevel: stats?.riskLevel || 'good',
        missions: habit.missions || [],
        todayMissionsProgress: await (async () => {
          const today = new Date().toISOString().split('T')[0]
          const isCounter = habit.tracking_mode === 'counter'
          const usesEvents = habit.type === 'bad' || isCounter

          if (usesEvents) {
            const { data } = await supabase
              .from('habit_events')
              .select('meta_json')
              .eq('habit_id', habit.id)
              .eq('event_date', today)
              .order('occurred_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            return data?.meta_json?.completed_mission_ids || []
          } else {
            const { data } = await supabase
              .from('logs')
              .select('meta_json')
              .eq('habit_id', habit.id)
              .eq('completed_date', today)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            return data?.meta_json?.completed_mission_ids || []
          }
        })()
      }
    })
  )

  // 3. Calculer les statistiques globales
  const goodHabits = habitsWithStats.filter(h => h.type === 'good')
  const badHabits = habitsWithStats.filter(h => h.type === 'bad')

  const goodHabitsLoggedToday = goodHabits.filter(h => h.todayCount > 0).length
  const badHabitsLoggedToday = badHabits.reduce((sum, h) => sum + h.todayCount, 0)

  const totalGoodActions = goodHabits.reduce((sum, h) => sum + h.todayCount, 0)

  return NextResponse.json({
    habits: habitsWithStats,
    summary: {
      totalHabits: habitsWithStats.length,
      goodHabitsCount: goodHabits.length,
      badHabitsCount: badHabits.length,
      goodHabitsLoggedToday,
      badHabitsLoggedToday,
      totalGoodActions,
    },
  })
}
