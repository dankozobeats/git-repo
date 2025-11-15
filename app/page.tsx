import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function checkInHabit(habitId: string) {
  'use server'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  const today = new Date().toISOString().split('T')[0]

  await supabase
    .from('logs')
    .insert({
      habit_id: habitId,
      user_id: user.id,
      completed_date: today,
    })

  revalidatePath('/')
}

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: badHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'bad')
    .order('created_at', { ascending: false })

  const { data: goodHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'good')
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const { data: todayLogs } = await supabase
    .from('logs')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('completed_date', today)

  const loggedHabitIds = new Set(todayLogs?.map(log => log.habit_id) || [])

  const badHabitsLoggedToday = todayLogs?.filter(log => 
    badHabits?.some(h => h.id === log.habit_id)
  ).length || 0

  const goodHabitsLoggedToday = todayLogs?.filter(log => 
    goodHabits?.some(h => h.id === log.habit_id)
  ).length || 0

  const getSmartMessage = () => {
    const totalToday = badHabitsLoggedToday + goodHabitsLoggedToday

    if (totalToday === 0) {
      return {
        message: "Journée tranquille... ou tu oublies de logger ? 🤔",
        type: 'neutral'
      }
    }

    if (badHabitsLoggedToday > 0 && goodHabitsLoggedToday === 0) {
      if (badHabitsLoggedToday === 1) {
        return {
          message: "Un petit craquage. Ça arrive, champion. 😏",
          type: 'bad'
        }
      } else if (badHabitsLoggedToday === 2) {
        return {
          message: "2 craquages... Tu commences à prendre un rythme là. 🔥",
          type: 'bad'
        }
      } else if (badHabitsLoggedToday >= 3 && badHabitsLoggedToday < 5) {
        return {
          message: `${badHabitsLoggedToday} craquages ! La constance dans la médiocrité, respect. 💀`,
          type: 'bad'
        }
      } else {
        return {
          message: `${badHabitsLoggedToday} craquages ! Tu bats des records là. Impressionnant. 🏆`,
          type: 'bad'
        }
      }
    }

    if (goodHabitsLoggedToday > 0 && badHabitsLoggedToday === 0) {
      if (goodHabitsLoggedToday === 1) {
        return {
          message: "Une bonne action ! C'est déjà ça. Continue. 💪",
          type: 'good'
        }
      } else if (goodHabitsLoggedToday === 2) {
        return {
          message: "2 bonnes actions ! Tu prends ça au sérieux aujourd'hui. ✨",
          type: 'good'
        }
      } else if (goodHabitsLoggedToday >= 3 && goodHabitsLoggedToday < 5) {
        return {
          message: `${goodHabitsLoggedToday} bonnes actions ! Regarde-toi tout motivé ! 🔥`,
          type: 'good'
        }
      } else {
        return {
          message: `${goodHabitsLoggedToday} bonnes actions ! Tu es en feu aujourd'hui ! 🎯`,
          type: 'good'
        }
      }
    }

    const ratio = goodHabitsLoggedToday / (badHabitsLoggedToday + goodHabitsLoggedToday)
    
    if (ratio > 0.7) {
      return {
        message: `Plus de bonnes que de mauvaises ! C'est l'idée. Continue. ⚖️`,
        type: 'mixed'
      }
    } else if (ratio >= 0.4 && ratio <= 0.7) {
      return {
        message: `Bon... du bon ET du mauvais. Tu es humain finalement. 🤷`,
        type: 'mixed'
      }
    } else {
      return {
        message: `Plus de craquages que de bonnes actions... Intéressant. 😅`,
        type: 'mixed'
      }
    }
  }

  const smartMessage = getSmartMessage()
  const displayMessage = smartMessage.message
  const messageType = smartMessage.type

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">BadHabit Tracker 🔥</h1>
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <Link 
                href="/habits/new"
                className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base text-center hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/50"
              >
                + Nouvelle
              </Link>
              <form action="/auth/signout" method="post" className="flex-1 md:flex-none">
                <button className="w-full bg-gray-800 hover:bg-gray-700 px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-gray-700 text-sm md:text-base hover:scale-105 active:scale-95">
                  Déco
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {todayLogs && todayLogs.length > 0 ? (
          <div className={`border rounded-lg p-4 mb-6 text-center transition-all duration-300 ${
            messageType === 'bad'
              ? 'bg-red-900/20 border-red-800'
              : messageType === 'good'
              ? 'bg-green-900/20 border-green-800'
              : 'bg-gray-900 border-gray-800'
          }`}>
            <p className="text-gray-300 text-base md:text-lg">{displayMessage}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-2 text-sm text-gray-500">
              {badHabitsLoggedToday > 0 && (
                <span className="text-red-400">
                  🔥 {badHabitsLoggedToday} craquage{badHabitsLoggedToday > 1 ? 's' : ''}
                </span>
              )}
              {goodHabitsLoggedToday > 0 && (
                <span className="text-green-400">
                  ✨ {goodHabitsLoggedToday} bonne{goodHabitsLoggedToday > 1 ? 's' : ''} action{goodHabitsLoggedToday > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-gray-800 bg-gray-900 rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-400 text-base md:text-lg">
              Encore rien aujourd'hui. Commence la journée ! 🎯
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Clique sur un bouton ci-dessous pour tracker une habitude
            </p>
          </div>
        )}

        {badHabits && badHabits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
              🔥 Mauvaises habitudes
              <span className="text-xs md:text-sm font-normal text-gray-500">à réduire</span>
            </h2>
            <div className="space-y-3 md:space-y-4">
              {badHabits.map((habit) => {
                const hasLoggedToday = loggedHabitIds.has(habit.id)
                
                return (
                  <div
                    key={habit.id}
                    className={`bg-gray-900 rounded-lg p-4 md:p-6 border transition-all duration-300 ${
                      hasLoggedToday 
                        ? 'border-red-700 shadow-lg shadow-red-900/20' 
                        : 'border-gray-800 hover:border-red-900/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                      <Link 
                        href={`/habits/${habit.id}`}
                        className="flex items-center gap-3 md:gap-4 flex-1 cursor-pointer min-w-0"
                      >
                        <div 
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl flex-shrink-0"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          {habit.icon || '🔥'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg md:text-xl font-semibold truncate">{habit.name}</h3>
                          {habit.description && (
                            <p className="text-gray-400 text-xs md:text-sm mt-1 line-clamp-1">{habit.description}</p>
                          )}
                        </div>
                      </Link>
                      
                      <form action={checkInHabit.bind(null, habit.id)} className="w-full sm:w-auto">
                        <button
                          type="submit"
                          disabled={hasLoggedToday}
                          className={`w-full sm:w-auto px-4 md:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
                            hasLoggedToday
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed scale-95'
                              : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/50'
                          }`}
                        >
                          {hasLoggedToday ? '✓ Fait' : 'J\'ai craqué'}
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {goodHabits && goodHabits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
              ✨ Bonnes habitudes
              <span className="text-xs md:text-sm font-normal text-gray-500">à maintenir</span>
            </h2>
            <div className="space-y-3 md:space-y-4">
              {goodHabits.map((habit) => {
                const hasLoggedToday = loggedHabitIds.has(habit.id)
                
                return (
                  <div
                    key={habit.id}
                    className={`bg-gray-900 rounded-lg p-4 md:p-6 border transition-all duration-300 ${
                      hasLoggedToday 
                        ? 'border-green-700 shadow-lg shadow-green-900/20' 
                        : 'border-gray-800 hover:border-green-900/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                      <Link 
                        href={`/habits/${habit.id}`}
                        className="flex items-center gap-3 md:gap-4 flex-1 cursor-pointer min-w-0"
                      >
                        <div 
                          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl flex-shrink-0"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          {habit.icon || '✨'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg md:text-xl font-semibold truncate">{habit.name}</h3>
                          {habit.description && (
                            <p className="text-gray-400 text-xs md:text-sm mt-1 line-clamp-1">{habit.description}</p>
                          )}
                        </div>
                      </Link>
                      
                      <form action={checkInHabit.bind(null, habit.id)} className="w-full sm:w-auto">
                        <button
                          type="submit"
                          disabled={hasLoggedToday}
                          className={`w-full sm:w-auto px-4 md:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
                            hasLoggedToday
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed scale-95'
                              : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/50'
                          }`}
                        >
                          {hasLoggedToday ? '✓ Fait' : 'C\'est fait !'}
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(!badHabits || badHabits.length === 0) && (!goodHabits || goodHabits.length === 0) && (
          <div className="text-center py-12">
            <div className="text-5xl md:text-6xl mb-4">🎯</div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Aucune habitude pour l'instant</h2>
            <p className="text-gray-400 mb-6 text-sm md:text-base">
              Commence par tracker tes mauvaises habitudes... ou tes bonnes ! 😏
            </p>
            <Link
              href="/habits/new"
              className="inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 text-sm md:text-base hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/50"
            >
              Créer ma première habitude
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}