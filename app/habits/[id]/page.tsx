/**
 * Page serveur de détail d'une habitude - Version avec onglets
 */
import { notFound, redirect } from 'next/navigation'
import HabitDetailClient from './HabitDetailClient'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateISO } from '@/lib/date-utils'
import { getHabitById } from '@/lib/habits/getHabitById'
import { getHabitCalendar } from '@/lib/habits/getHabitCalendar'
import { computeHabitStats } from '@/lib/habits/computeHabitStats'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HabitDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const habit = await getHabitById({
    client: supabase,
    habitId: id,
    userId: user.id,
  })

  if (!habit) {
    notFound()
  }

  const todayISO = getTodayDateISO()
  const { calendarData, todayCount } = await getHabitCalendar({
    client: supabase,
    habitId: id,
    habitType: habit.type,
    trackingMode: habit.tracking_mode,
    todayISO,
    rangeInDays: 365, // Plus de données pour le calendrier mensuel
  })

  const stats = computeHabitStats({
    calendarData,
    todayISO,
    todayCount,
    rangeInDays: 28,
  })

  // Récupérer les rappels pour l'onglet Settings
  const { data: reminders } = await supabase
    .from('reminders')
    .select(`
      *,
      habits (
        name,
        icon,
        color,
        description
      )
    `)
    .eq('habit_id', id)
    .eq('active', true)
    .order('time_local', { ascending: true })

  return (
    <main className="min-h-screen bg-[#01030a] text-white">
      <HabitDetailClient
        habit={{
          ...habit,
          type: habit.type as 'good' | 'bad',
          user_id: user.id,
        }}
        calendarData={calendarData}
        stats={stats}
        reminders={reminders || []}
      />
    </main>
  )
}
