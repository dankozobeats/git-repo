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
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white mb-4 inline-block text-sm md:text-base"
          >
            ← Retour
          </Link>
          <div className="flex items-start gap-3 md:gap-4 mt-4">
            <div 
              className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl flex-shrink-0"
              style={{ backgroundColor: habit.color + '20' }}
            >
              {habit.icon || (isBadHabit ? '🔥' : '✨')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold truncate">{habit.name}</h1>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                  isBadHabit 
                    ? 'bg-red-900/30 text-red-400 border border-red-800' 
                    : 'bg-green-900/30 text-green-400 border border-green-800'
                }`}>
                  {isBadHabit ? '🔥 Mauvaise' : '✨ Bonne'}
                </span>
                {habit.tracking_mode === 'counter' && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-900/30 text-blue-400 border border-blue-800">
                    🔢 Compteur ({habit.daily_goal_type === 'minimum' ? 'min' : 'max'}: {habit.daily_goal_value})
                  </span>
                )}
              </div>
              {habit.description && (
                <p className="text-gray-400 mt-1 text-sm md:text-base">{habit.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-4">
            <Link
              href={`/habits/${id}/edit`}
              className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition border border-gray-700 text-center text-sm md:text-base"
            >
              ✏️ Modifier
            </Link>
            <DeleteButton habitId={id} habitName={habit.name} />
          </div>
        </div>
      </div>

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
