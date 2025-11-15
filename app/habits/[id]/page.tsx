import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MonthAccordion from './MonthAccordion'

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
    redirect('/')
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('habit_id', id)
    .eq('user_id', user.id)
    .gte('completed_date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('completed_date', { ascending: false })

  const loggedDates = new Set(logs?.map(log => log.completed_date) || [])

  // Grouper les jours par mois
  const monthsMap = new Map<string, any[]>()
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, [])
    }
    
    monthsMap.get(monthKey)!.push({
      date: dateStr,
      hasLog: loggedDates.has(dateStr),
      dayNumber: date.getDate(),
      monthName: monthName,
      monthKey: monthKey,
    })
  }

  // Convertir en array et trier du plus récent au plus ancien
  const months = Array.from(monthsMap.entries()).map(([key, days]) => {
    const loggedCount = days.filter(d => d.hasLog).length
    return {
      key,
      name: days[0].monthName,
      days,
      loggedCount,
      totalDays: days.length,
      percentage: Math.round((loggedCount / days.length) * 100),
    }
  }).reverse()

  // Stats globales
  const totalLogs = logs?.length || 0
  const last7Days = logs?.filter(log => {
    const logDate = new Date(log.completed_date)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return logDate >= sevenDaysAgo
  }).length || 0

  let currentStreak = 0
  let checkDate = new Date()
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (loggedDates.has(dateStr)) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  // Déterminer les couleurs et textes selon le type
  const isBadHabit = habit.type === 'bad'
  const statColor = isBadHabit ? 'text-red-500' : 'text-green-500'
  const actionText = isBadHabit ? 'Craquage' : 'Fait'
  const noActionText = isBadHabit ? 'Pas de craquage' : 'Pas fait'

  // Messages selon type et stats
  const getContextualMessage = () => {
    if (isBadHabit) {
      if (currentStreak > 7) return "Wow, un vrai champion de la régularité... dans le mauvais sens. 🏆"
      if (currentStreak > 3) return "Tu commences à prendre un rythme là. Continue comme ça... ou pas. 😏"
      if (totalLogs > 30) return "30+ craquages en 90 jours. Tu fais ça professionnellement ? 💀"
      if (totalLogs > 10) return "Au moins tu es honnête avec toi-même. C'est déjà ça. 🤷"
      return "Débutant ? Ou tu te retiens de logger ? 🤔"
    } else {
      if (currentStreak > 7) return "7 jours de suite ! Bon, faut pas s'emballer mais c'est bien. 💪"
      if (currentStreak > 3) return "Ça commence à devenir une vraie habitude. Continue ! 🔥"
      if (totalLogs > 30) return "30+ actions en 90 jours. Regarde-toi tout motivé ! ✨"
      if (totalLogs > 10) return "Tu prends ça au sérieux. Respect. 👏"
      return "On commence doucement. C'est déjà bien ! 🎯"
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white mb-4 inline-block"
          >
            ← Retour
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: habit.color + '20' }}
            >
              {habit.icon || (isBadHabit ? '🔥' : '✨')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{habit.name}</h1>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isBadHabit 
                    ? 'bg-red-900/30 text-red-400 border border-red-800' 
                    : 'bg-green-900/30 text-green-400 border border-green-800'
                }`}>
                  {isBadHabit ? '🔥 Mauvaise' : '✨ Bonne'}
                </span>
              </div>
              {habit.description && (
                <p className="text-gray-400 mt-1">{habit.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className={`text-3xl font-bold ${statColor}`}>{totalLogs}</div>
            <div className="text-sm text-gray-400 mt-1">Total (90j)</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className={`text-3xl font-bold ${isBadHabit ? 'text-orange-500' : 'text-green-400'}`}>{last7Days}</div>
            <div className="text-sm text-gray-400 mt-1">Cette semaine</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
            <div className={`text-3xl font-bold ${isBadHabit ? 'text-yellow-500' : 'text-blue-400'}`}>{currentStreak}</div>
            <div className="text-sm text-gray-400 mt-1">Streak actuel</div>
          </div>
        </div>

        {/* Accordéon des mois */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
          <h2 className="text-xl font-bold mb-4">Historique (90 derniers jours)</h2>
          
          <MonthAccordion 
            months={months}
            isBadHabit={isBadHabit}
            actionText={actionText}
          />

          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-400 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-800 rounded"></div>
              <span>{noActionText}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${isBadHabit ? 'bg-red-600' : 'bg-green-600'}`}></div>
              <span>{actionText}</span>
            </div>
          </div>
        </div>

        {/* Message contextuel */}
        <div className={`rounded-lg p-6 border text-center ${
          isBadHabit 
            ? 'bg-red-900/10 border-red-800' 
            : 'bg-green-900/10 border-green-800'
        }`}>
          <p className="text-lg text-gray-300">
            {getContextualMessage()}
          </p>
        </div>
      </div>
    </main>
  )
}