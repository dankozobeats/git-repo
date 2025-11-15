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

  // Récupérer les mauvaises habitudes
  const { data: badHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'bad')
    .order('created_at', { ascending: false })

  // Récupérer les bonnes habitudes
  const { data: goodHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'good')
    .order('created_at', { ascending: false })

  // Récupérer les logs d'aujourd'hui
  const today = new Date().toISOString().split('T')[0]
  const { data: todayLogs } = await supabase
    .from('logs')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('completed_date', today)

  const loggedHabitIds = new Set(todayLogs?.map(log => log.habit_id) || [])

  // Phrases sarcastiques aléatoires
  const sarcasticMessages = [
    "Encore raté champion... 😏",
    "La constance dans la médiocrité, respect. 🔥",
    "Tu te surpasses vraiment là. 💀",
    "Bravo, tu es régulier dans tes conneries. 👏",
    "On dirait que tu aimes ça finalement. 😂",
  ]
  
  const randomMessage = sarcasticMessages[Math.floor(Math.random() * sarcasticMessages.length)]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">BadHabit Tracker 🔥</h1>
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/habits/new"
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition"
              >
                + Nouvelle habitude
              </Link>
              <form action="/auth/signout" method="post">
                <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition border border-gray-700">
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Message sarcastique global */}
        {todayLogs && todayLogs.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-300 text-lg">{randomMessage}</p>
            <p className="text-sm text-gray-500 mt-1">
              {todayLogs.length} action{todayLogs.length > 1 ? 's' : ''} aujourd'hui
            </p>
          </div>
        )}

        {/* Mauvaises habitudes */}
        {badHabits && badHabits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🔥 Mauvaises habitudes
              <span className="text-sm font-normal text-gray-500">à réduire</span>
            </h2>
            <div className="space-y-4">
              {badHabits.map((habit) => {
                const hasLoggedToday = loggedHabitIds.has(habit.id)
                
                return (
                  <div
                    key={habit.id}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-red-900/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/habits/${habit.id}`}
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          {habit.icon || '🔥'}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{habit.name}</h3>
                          {habit.description && (
                            <p className="text-gray-400 text-sm mt-1">{habit.description}</p>
                          )}
                        </div>
                      </Link>
                      
                      <form action={checkInHabit.bind(null, habit.id)}>
                        <button
                          type="submit"
                          disabled={hasLoggedToday}
                          className={`px-6 py-2 rounded-lg font-medium transition ${
                            hasLoggedToday
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
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

        {/* Bonnes habitudes */}
        {goodHabits && goodHabits.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              ✨ Bonnes habitudes
              <span className="text-sm font-normal text-gray-500">à maintenir</span>
            </h2>
            <div className="space-y-4">
              {goodHabits.map((habit) => {
                const hasLoggedToday = loggedHabitIds.has(habit.id)
                
                return (
                  <div
                    key={habit.id}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-green-900/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/habits/${habit.id}`}
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: habit.color + '20' }}
                        >
                          {habit.icon || '✨'}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{habit.name}</h3>
                          {habit.description && (
                            <p className="text-gray-400 text-sm mt-1">{habit.description}</p>
                          )}
                        </div>
                      </Link>
                      
                      <form action={checkInHabit.bind(null, habit.id)}>
                        <button
                          type="submit"
                          disabled={hasLoggedToday}
                          className={`px-6 py-2 rounded-lg font-medium transition ${
                            hasLoggedToday
                              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
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

        {/* Empty state */}
        {(!badHabits || badHabits.length === 0) && (!goodHabits || goodHabits.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2">Aucune habitude pour l'instant</h2>
            <p className="text-gray-400 mb-6">
              Commence par tracker tes mauvaises habitudes... ou tes bonnes ! 😏
            </p>
            <Link
              href="/habits/new"
              className="inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition"
            >
              Créer ma première habitude
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}