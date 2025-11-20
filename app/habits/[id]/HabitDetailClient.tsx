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

type Props = {
  habit: Habit
  calendarData: Record<string, number>
  todayCount: number
  totalCount: number
  last7DaysCount: number
  currentStreak: number
}

export default function HabitDetailClient({
  habit,
  calendarData,
  todayCount,
  totalCount,
  last7DaysCount,
  currentStreak,
}: Props) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [count, setCount] = useState(todayCount)

  const isBadHabit = habit.type === 'bad'
  const statColor = isBadHabit ? 'text-[#FF4D4D]' : 'text-[#4DA6FF]'

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
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Counter Section */}
        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1b1b1f] to-[#121214] p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Aujourd&apos;hui</p>
              <h2 className="text-2xl font-bold text-white mt-1">Action immédiate</h2>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/60">
              {isBadHabit ? 'Statut du jour' : 'Progression du jour'}
            </span>
          </div>
          <div
            className={`rounded-2xl border px-4 py-4 md:px-6 md:py-6 ${
              isBadHabit
                ? 'border-[#FF4D4D]/40 bg-[#200f12]'
                : 'border-[#4DA6FF]/30 bg-[#0f1c2d]'
            }`}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3">Statut</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`text-2xl md:text-3xl font-bold ${isBadHabit ? 'text-[#FF4D4D]' : 'text-[#4DA6FF]'}`}>
                  {isBadHabit
                    ? count > 0
                      ? `${count} craquage${count > 1 ? 's' : ''}`
                      : 'Aucun craquage'
                    : count > 0
                    ? 'Habitude validée'
                    : 'Pas encore validée'}
                </p>
                <p className="text-sm text-white/70 mt-1">
                  {isBadHabit
                    ? count > 0
                      ? 'Tu as déclaré un craquage aujourd’hui. Note ce qui a déclenché pour reprendre le contrôle.'
                      : 'Toujours clean aujourd’hui. Tiens bon !'
                    : count > 0
                    ? 'Habitude cochée pour aujourd’hui, continue sur ta lancée.'
                    : 'Commence par une action simple pour lancer la journée.'}
                </p>
              </div>
              <span
                className={`rounded-full px-4 py-1 text-xs font-semibold border ${
                  count > 0
                    ? isBadHabit
                      ? 'border-[#FF4D4D] text-[#FF4D4D]'
                      : 'border-[#4DA6FF] text-[#4DA6FF]'
                    : 'border-white/30 text-white/70'
                }`}
              >
                {isBadHabit
                  ? count > 0
                    ? 'Craquage détecté'
                    : 'Aucun craquage'
                  : count > 0
                  ? 'Validée'
                  : 'À faire'}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <HabitCounter
              habitId={habit.id}
              habitType={habit.type}
              trackingMode={habit.tracking_mode || 'binary'}
              goalValue={habit.goal_value}
              goalType={habit.goal_type}
              todayCount={count}
              onCountChange={setCount}
              habitName={habit.name}
              streak={currentStreak}
              totalLogs={totalCount}
              totalCraquages={isBadHabit ? totalCount : 0}
            />
          </div>
        </section>

        {/* Stats Section */}
        <section className="rounded-3xl border border-white/5 bg-[#121420] p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">Statistiques</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Période glissante 28j
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total (28j)', value: totalCount, color: statColor },
              {
                label: 'Semaine',
                value: last7DaysCount,
                color: isBadHabit ? 'text-orange-400' : 'text-green-300',
              },
              {
                label: 'Streak 🔥',
                value: currentStreak,
                color: isBadHabit ? 'text-yellow-400' : 'text-blue-300',
              },
              { label: 'Ce mois', value: `${monthPercentage}%`, color: 'text-purple-300' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/5 bg-[#0c0d17] p-5 text-center shadow-inner shadow-black/40"
              >
                <div className={`text-3xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="mt-2 text-xs md:text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
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
        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0e121f] to-[#090b13] p-6 shadow-2xl shadow-black/30">
          <WeeklyCalendar
            habitId={habit.id}
            habitType={habit.type}
            calendarData={calendarData}
            trackingMode={habit.tracking_mode}
            onDayClick={(date) => setSelectedDate(date)}
          />
        </section>

        {/* Message Section */}
        <section
          className={`rounded-3xl border text-center p-6 shadow-lg shadow-black/30 ${
            isBadHabit ? 'border-[#FF4D4D]/40 bg-[#2A1010]' : 'border-[#4DA6FF]/30 bg-[#0F1F33]'
          }`}
        >
          <p className="text-base md:text-lg text-white/90 italic">
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
