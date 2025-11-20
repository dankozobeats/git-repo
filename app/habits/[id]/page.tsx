import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HabitDetailClient from './HabitDetailClient'
import DeleteButton from './DeleteButton'
import { getTodayDateISO, toUtcDate } from '@/lib/date-utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HabitDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">❌ Habitude non trouvée</h1>
          <p className="text-gray-400 mb-6">Cette habitude n'existe pas ou a été supprimée.</p>
          <Link 
            href="/" 
            className="inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  const todayStr = getTodayDateISO()
  const todayDate = toUtcDate(todayStr)
  const fourWeeksAgo = new Date(todayDate)
  fourWeeksAgo.setUTCDate(todayDate.getUTCDate() - 28)

  // Récupérer les données pour le calendrier
  let calendarData: Record<string, number> = {}
  let todayCount = 0

  if (habit.tracking_mode === 'counter') {
    const { data: events } = await supabase
      .from('habit_events')
      .select('*')
      .eq('habit_id', id)
      .gte('event_date', fourWeeksAgo.toISOString().split('T')[0])
      .order('occurred_at', { ascending: true })

    calendarData = (events || []).reduce((acc, event) => {
      const date = event.event_date
      if (!acc[date]) acc[date] = 0
      acc[date]++
      return acc
    }, {} as Record<string, number>)

    todayCount = (events || []).filter(e => e.event_date === todayStr).length

  } else {
    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('habit_id', id)
      .gte('completed_date', fourWeeksAgo.toISOString().split('T')[0])
      .order('completed_date', { ascending: false })

    calendarData = (logs || []).reduce((acc, log) => {
      acc[log.completed_date] = 1
      return acc
    }, {} as Record<string, number>)

    const hasLogToday = (logs || []).some(log => log.completed_date === todayStr)
    todayCount = hasLogToday ? 1 : 0
  }

  // Calculer les stats
  const totalCount = Object.values(calendarData).reduce((sum, count) => sum + count, 0)
  
  const sevenDaysAgo = new Date(todayDate)
  sevenDaysAgo.setUTCDate(todayDate.getUTCDate() - 7)
  const last7DaysCount = Object.entries(calendarData)
    .filter(([date]) => toUtcDate(date) >= sevenDaysAgo)
    .reduce((sum, [_, count]) => sum + count, 0)

  // Calculer le streak
  let currentStreak = 0
  let checkDate = new Date(todayDate)
  for (let i = 0; i < 90; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (calendarData[dateStr] && calendarData[dateStr] > 0) {
      currentStreak++
      checkDate.setUTCDate(checkDate.getUTCDate() - 1)
    } else if (i === 0) {
      checkDate.setUTCDate(checkDate.getUTCDate() - 1)
      continue
    } else {
      break
    }
  }

  const isBadHabit = habit.type === 'bad'

  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0]">
      <section className="bg-gradient-to-br from-[#1E1E1E] via-[#151515] to-[#0f0f0f] border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
          >
            ← Retour au dashboard
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-inner"
                style={{ backgroundColor: `${habit.color}33` }}
              >
                {habit.icon || (isBadHabit ? '🔥' : '✨')}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-white truncate">{habit.name}</h1>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                      isBadHabit
                        ? 'border-[#FF4D4D] text-[#FF4D4D]'
                        : 'border-[#4DA6FF] text-[#4DA6FF]'
                    }`}
                  >
                    {isBadHabit ? '🔥 Mauvaise habitude' : '✨ Bonne habitude'}
                  </span>
                  {habit.tracking_mode === 'counter' && (
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                      🔢 Compteur ({habit.daily_goal_type === 'minimum' ? 'min' : 'max'}:{' '}
                      {habit.daily_goal_value})
                    </span>
                  )}
                </div>
                {habit.description && (
                  <p className="text-sm text-[#A0A0A0] max-w-2xl">{habit.description}</p>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
              <Link
                href={`/habits/${id}/edit`}
                className="flex-1 h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-center text-sm font-semibold text-white transition-all duration-200 hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA6FF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f] inline-flex items-center justify-center gap-2"
              >
                <span aria-hidden>✏️</span> Modifier
              </Link>
              <DeleteButton habitId={id} habitName={habit.name} />
            </div>
          </div>
        </div>
      </section>

      <HabitDetailClient
        habit={habit}
        calendarData={calendarData}
        todayCount={todayCount}
        totalCount={totalCount}
        last7DaysCount={last7DaysCount}
        currentStreak={currentStreak}
      />
    </main>
  )
}
