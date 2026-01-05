/**
 * API endpoint pour la vue rapide d'une habitude
 * Retourne : calendrier 28 jours, stats clés, message coach IA
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getHabitCalendar } from '@/lib/habits/getHabitCalendar'
import { computeHabitStats } from '@/lib/habits/computeHabitStats'
import { getTodayDateISO } from '@/lib/date-utils'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer l'habitude
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const todayISO = getTodayDateISO()

    // Récupérer calendrier et stats
    const { calendarData, todayCount } = await getHabitCalendar({
      client: supabase,
      habitId: id,
      trackingMode: habit.tracking_mode,
      todayISO,
      rangeInDays: 28,
    })

    const stats = computeHabitStats({
      calendarData,
      todayISO,
      todayCount,
      rangeInDays: 28,
    })

    // Calculer la meilleure série
    let bestStreak = 0
    let currentTempStreak = 0
    const sortedDates = Object.keys(calendarData).sort()

    for (let i = 0; i < sortedDates.length; i++) {
      if (calendarData[sortedDates[i]] > 0) {
        currentTempStreak++
        bestStreak = Math.max(bestStreak, currentTempStreak)
      } else {
        currentTempStreak = 0
      }
    }

    // Transformer le calendrier en format pour le modal
    const calendar = Object.entries(calendarData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value,
        isToday: date === todayISO,
      }))

    // Message du coach adaptatif
    const isBadHabit = habit.type === 'bad'
    let coachMessage = ''

    if (isBadHabit) {
      if (stats.currentStreak > 7) {
        coachMessage = `Excellente série de ${stats.currentStreak} jours sans craquage ! Continue à documenter tes déclencheurs pour maintenir cette dynamique.`
      } else if (stats.totalCount === 0) {
        coachMessage = 'Parfait début ! Reste concentré sur les signaux faibles et prépare tes stratégies de prévention.'
      } else if (todayCount === 0) {
        coachMessage = `Tu tiens bon aujourd'hui — verrouille cette énergie. ${stats.last7DaysCount} fois sur les 7 derniers jours, identifie le pattern.`
      } else {
        coachMessage = `${todayCount} craquage${todayCount > 1 ? 's' : ''} aujourd'hui. Identifie la prochaine tentation et prépare une parade concrète.`
      }
    } else {
      if (stats.currentStreak > 7) {
        coachMessage = `Série solide de ${stats.currentStreak} jours ! Tes routines sont bien ancrées, verrouille-les pour automatiser cette habitude.`
      } else if (stats.last7DaysCount >= 5) {
        coachMessage = `Très belle moyenne hebdo (${stats.last7DaysCount}/7). Continue à cette cadence pour que ça devienne naturel.`
      } else if (todayCount === 0) {
        coachMessage = 'Commence par une action minimale pour enclencher la journée. Le mouvement crée la motivation, pas l\'inverse.'
      } else {
        coachMessage = `Validation du jour faite ! Chaque action te rapproche de la version que tu veux devenir. ${stats.monthCompletionRate}% ce mois-ci.`
      }
    }

    return NextResponse.json({
      habit: {
        id: habit.id,
        name: habit.name,
        type: habit.type,
        icon: habit.icon,
        color: habit.color,
        tracking_mode: habit.tracking_mode,
      },
      calendar,
      stats: {
        currentStreak: stats.currentStreak,
        bestStreak,
        totalCount: stats.totalCount,
        last7DaysCount: stats.last7DaysCount,
        last30DaysCount: stats.totalCount, // Total sur la période (28 jours)
        todayCount,
        completionRate: stats.monthCompletionRate,
      },
      coachMessage,
    })
  } catch (error) {
    console.error('Error in quick-view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
