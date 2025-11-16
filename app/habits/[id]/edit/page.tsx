import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HabitCardCounter } from '@/components/HabitCardCounter'
import DeleteButton from '../DeleteButton'

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

  const today = new Date()
  const ninetyDaysAgo = new Date(today)
  ninetyDaysAgo.setDate(today.getDate() - 90)

  let totalCount = 0
  let last7DaysCount = 0
  let currentStreak = 0
  let calendarData: Record<string, number> = {}
  let todayEvents: any[] = []

  if (habit.tracking_mode === 'counter') {
    // Mode counter : récupérer les événements
    const { data: events } = await supabase
      .from('habit_events')
      .select('*')
      .eq('habit_id', id)
      .gte('event_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('event_date', { ascending: false })

    // Grouper par date
    const eventsByDate = (events || []).reduce((acc, event) => {
      const date = event.event_date
      if (!acc[date]) acc[date] = 0
      acc[date]++
      return acc
    }, {} as Record<string, number>)

    calendarData = eventsByDate
    totalCount = events?.length || 0

    // Événements du jour
    const todayStr = today.toISOString().split('T')[0]
    todayEvents = (events || []).filter(e => e.event_date === todayStr)

    // Compter les 7 derniers jours
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    last7DaysCount = events?.filter(e => 
      new Date(e.event_date) >= sevenDaysAgo
    ).length || 0

    // Calculer le streak
    let checkDate = new Date(today)
    for (let i = 0; i < 90; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (eventsByDate[dateStr] && eventsByDate[dateStr] > 0) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      } else {
        break
      }
    }

  } else {
    // Mode binary : récupérer les logs
    const { data: logs } = await supabase
      .from('logs')
      .select('*')
      .eq('habit_id', id)
      .gte('completed_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('completed_date', { ascending: false })

    calendarData = (logs || []).reduce((acc, log) => {
      acc[log.completed_date] = 1
      return acc
    }, {} as Record<string, number>)

    totalCount = logs?.length || 0

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    last7DaysCount = logs?.filter(l => 
      new Date(l.completed_date) >= sevenDaysAgo
    ).length || 0

    let checkDate = new Date(today)
    const logDates = new Set((logs || []).map(l => l.completed_date))
    
    for (let i = 0; i < 90; i++) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (logDates.has(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      } else {
        break
      }
    }
  }

  // Générer le calendrier des 90 derniers jours
  const calendar = []
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    calendar.push({
      date: dateStr,
      count: calendarData[dateStr] || 0,
    })
  }

  const isBadHabit = habit.type === 'bad'
  const statColor = isBadHabit ? 'text-red-500' : 'text-green-500'

  const getContextualMessage = () => {
    if (isBadHabit) {
      if (currentStreak > 7) return "Wow, un vrai champion de la régularité... dans le mauvais sens. 🏆"
      if (currentStreak > 3) return "Tu commences à prendre un rythme là. Continue comme ça... ou pas. 😏"
      if (totalCount > 30) return "30+ craquages en 90 jours. Tu fais ça professionnellement ? 💀"
      if (totalCount > 10) return "Au moins tu es honnête avec toi-même. C'est déjà ça. 🤷"
      if (totalCount === 0) return "Parfait ! Continue comme ça. 👏"
      return "Bon... on fait ce qu'on peut. 😅"
    } else {
      if (currentStreak > 7) return "7 jours d'affilée ! Tu commences à devenir sérieux. 🔥"
      if (currentStreak > 3) return "Bien joué ! Continue sur cette lancée. 💪"
      if (totalCount > 30) return "30+ fois en 90 jours ! Respect. 🎯"
      if (totalCount > 10) return "C'est un bon début. Continue ! ✨"
      if (totalCount === 0) return "Allez, commence quelque part ! 🚀"
      return "Chaque petit pas compte. 🌱"
    }
  }

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
            <DeleteButton habitId={id} habitName={habit.name} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        
        {/* Compteur interactif (mode counter uniquement) */}
        {habit.tracking_mode === 'counter' && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Aujourd'hui</h2>
            <HabitCardCounter
              habit={habit}
              todayCount={todayEvents.length}
              todayEvents={todayEvents}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
          <div className="bg-gray-900 rounded-lg p-3 md:p-4 border border-gray-800 text-center">
            <div className={`text-2xl md:text-3xl font-bold ${statColor}`}>
              {habit.tracking_mode === 'counter' ? totalCount : totalCount}
            </div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">
              {habit.tracking_mode === 'counter' ? 'Occurrences (90j)' : 'Total (90j)'}
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 md:p-4 border border-gray-800 text-center">
            <div className={`text-2xl md:text-3xl font-bold ${isBadHabit ? 'text-orange-500' : 'text-green-400'}`}>
              {last7DaysCount}
            </div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">Semaine</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 md:p-4 border border-gray-800 text-center">
            <div className={`text-2xl md:text-3xl font-bold ${isBadHabit ? 'text-yellow-500' : 'text-blue-400'}`}>
              {currentStreak}
            </div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">Streak</div>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-gray-900 rounded-lg p-4 md:p-6 border border-gray-800 mb-6">
          <h2 className="text-lg md:text-xl font-bold mb-4">Calendrier (90 derniers jours)</h2>
          
          <div className="grid grid-cols-10 md:grid-cols-15 gap-1">
            {calendar.map((day) => {
              const count = day.count
              const hasActivity = count > 0
              
              let bgColor = 'bg-gray-800'
              if (hasActivity) {
                if (habit.tracking_mode === 'counter') {
                  const goalValue = habit.daily_goal_value || 3
                  const intensity = Math.min(count / goalValue, 1)
                  
                  if (isBadHabit) {
                    if (intensity <= 0.33) bgColor = 'bg-yellow-900/50'
                    else if (intensity <= 0.66) bgColor = 'bg-orange-700/70'
                    else bgColor = 'bg-red-600'
                  } else {
                    if (intensity <= 0.33) bgColor = 'bg-blue-900/50'
                    else if (intensity <= 0.66) bgColor = 'bg-green-700/70'
                    else bgColor = 'bg-green-500'
                  }
                } else {
                  bgColor = isBadHabit ? 'bg-red-600' : 'bg-green-600'
                }
              }
              
              return (
                <div
                  key={day.date}
                  className={`aspect-square rounded ${bgColor} hover:ring-2 hover:ring-blue-400 cursor-pointer transition-all`}
                  title={`${day.date}${count > 0 ? ` - ${count} fois` : ''}`}
                />
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
            <span>Moins</span>
            <div className="w-3 h-3 rounded bg-gray-800"></div>
            <div className={`w-3 h-3 rounded ${isBadHabit ? 'bg-yellow-900/50' : 'bg-blue-900/50'}`}></div>
            <div className={`w-3 h-3 rounded ${isBadHabit ? 'bg-orange-700/70' : 'bg-green-700/70'}`}></div>
            <div className={`w-3 h-3 rounded ${isBadHabit ? 'bg-red-600' : 'bg-green-500'}`}></div>
            <span>Plus</span>
          </div>
        </div>

        {/* Message sarcastique */}
        <div className={`rounded-lg p-4 md:p-6 border text-center ${
          isBadHabit 
            ? 'bg-red-900/10 border-red-800' 
            : 'bg-green-900/10 border-green-800'
        }`}>
          <p className="text-base md:text-lg text-gray-300">
            {getContextualMessage()}
          </p>
        </div>
      </div>
    </main>
  )
}