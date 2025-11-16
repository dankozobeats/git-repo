'use client'

import { useState } from 'react'
import HabitCounter from './HabitCounter'
import { WeeklyCalendar } from '@/components/WeeklyCalendar'
import { DayReportModal } from '@/components/DayReportModal'
import GoalSettingsModal from './GoalSettingsModal'
import GamificationPanel from './GamificationPanel'
import HabitCoach from './HabitCoach'

type Habit = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter'
  goal_value: number | null
  goal_type: 'daily' | 'weekly' | 'monthly' | null
  goal_description: string | null
  daily_goal_value: number | null
  daily_goal_type: 'minimum' | 'maximum' | null
}

type HabitEvent = {
  id?: string
  occurred_at?: string
  event_date?: string
}

type Props = {
  habit: Habit
  calendarData: Record<string, number>
  todayEvents: HabitEvent[]
  todayCount: number
  totalCount: number
  last7DaysCount: number
  currentStreak: number
}

export default function HabitDetailClient({
  habit,
  calendarData,
  todayEvents,
  todayCount,
  totalCount,
  last7DaysCount,
  currentStreak,
}: Props) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [count, setCount] = useState(todayCount)

  const isBadHabit = habit.type === 'bad'
  const statColor = isBadHabit ? 'text-red-500' : 'text-green-500'

  // Calculer le % du mois actuel
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const currentMonthData = Object.entries(calendarData)
    .filter(([date]) => new Date(date) >= firstDayOfMonth)
  const daysInMonth = today.getDate()
  const monthPercentage = daysInMonth > 0 ? Math.round((currentMonthData.length / daysInMonth) * 100) : 0

  const getContextualMessage = () => {
    if (isBadHabit) {
      if (currentStreak > 7) return "Wow, un vrai champion de la régularité... dans le mauvais sens. 🏆"
      if (currentStreak > 3) return "Tu commences à prendre un rythme là. Continue comme ça... ou pas. 😏"
      if (totalCount > 30) return "30+ craquages en 28 jours. Tu fais ça professionnellement ? 💀"
      if (totalCount > 10) return "Au moins tu es honnête avec toi-même. C'est déjà ça. 🤷"
      if (totalCount === 0) return "Parfait ! Continue comme ça. 👏"
      return "Bon... on fait ce qu'on peut. 😅"
    } else {
      if (currentStreak > 7) return "7 jours d'affilée ! Tu commences à devenir sérieux. 🔥"
      if (currentStreak > 3) return "Bien joué ! Continue sur cette lancée. 💪"
      if (totalCount > 30) return "30+ fois en 28 jours ! Respect. 🎯"
      if (totalCount > 10) return "C'est un bon début. Continue ! ✨"
      if (totalCount === 0) return "Allez, commence quelque part ! 🚀"
      return "Chaque petit pas compte. 🌱"
    }
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Counter Section */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Aujourd&apos;hui</h2>
          <HabitCounter
            habitId={habit.id}
            habitType={habit.type}
            trackingMode={habit.tracking_mode || 'binary'}
            goalValue={habit.goal_value}
            goalType={habit.goal_type}
            todayCount={count}
            todayEvents={todayEvents}
            onCountChange={setCount}
          />
        </section>

        {/* Stats Section */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Statistiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-gray-900 rounded-lg p-4 md:p-5 border border-gray-800 text-center hover:border-gray-700 transition">
              <div className={`text-3xl md:text-4xl font-bold ${statColor}`}>{totalCount}</div>
              <div className="text-xs md:text-sm text-gray-400 mt-2">Total (28j)</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 md:p-5 border border-gray-800 text-center hover:border-gray-700 transition">
              <div className={`text-3xl md:text-4xl font-bold ${isBadHabit ? 'text-orange-500' : 'text-green-400'}`}>{last7DaysCount}</div>
              <div className="text-xs md:text-sm text-gray-400 mt-2">Semaine</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 md:p-5 border border-gray-800 text-center hover:border-gray-700 transition">
              <div className={`text-3xl md:text-4xl font-bold ${isBadHabit ? 'text-yellow-500' : 'text-blue-400'}`}>{currentStreak}</div>
              <div className="text-xs md:text-sm text-gray-400 mt-2">Streak 🔥</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 md:p-5 border border-gray-800 text-center hover:border-gray-700 transition">
              <div className="text-3xl md:text-4xl font-bold text-purple-400">
                {monthPercentage}%
              </div>
              <div className="text-xs md:text-sm text-gray-400 mt-2">Ce mois</div>
            </div>
          </div>
        </section>

        {/* Gamification */}
        <GamificationPanel
          habit={habit}
          calendarData={calendarData}
          totalCount={totalCount}
          last7DaysCount={last7DaysCount}
          currentStreak={currentStreak}
        />

        <HabitCoach
          habitId={habit.id}
          stats={{
            totalCount,
            last7DaysCount,
            currentStreak,
            todayCount: count,
            monthPercentage,
          }}
        />

        {/* NOUVEAU Calendrier Section */}
        <section>
          <WeeklyCalendar
            habitId={habit.id}
            habitType={habit.type}
            calendarData={calendarData}
            trackingMode={habit.tracking_mode}
            onDayClick={(date) => setSelectedDate(date)}
          />
        </section>

        {/* Message Section */}
        <section className={`rounded-lg p-5 md:p-6 border text-center ${
          isBadHabit 
            ? 'bg-red-900/10 border-red-800/40' 
            : 'bg-green-900/10 border-green-800/40'
        }`}>
          <p className="text-base md:text-lg text-gray-200 italic">
            &ldquo;{getContextualMessage()}&rdquo;
          </p>
        </section>
      </div>

      {/* Modals */}
      <GoalSettingsModal
        habitId={habit.id}
        currentGoal={{
          goal_value: habit.goal_value,
          goal_type: habit.goal_type,
          goal_description: habit.goal_description,
        }}
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />

      <DayReportModal
        date={selectedDate || ''}
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </>
  )
}
