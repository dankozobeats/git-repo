'use client'

'use client'

import { useState } from 'react'
import HabitCounter from './HabitCounter'
import ReminderSettingsModal from './ReminderSettingsModal'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import { DayReportModal } from '@/components/DayReportModal'
import GoalSettingsModal from './GoalSettingsModal'
import GamificationPanel from './GamificationPanel'
import HabitCoach from './HabitCoach'
import type { HabitCalendarMap, HabitStats } from '@/lib/habits/computeHabitStats'


type Habit = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter' | null
  goal_value: number | null
  goal_type: 'daily' | 'weekly' | 'monthly' | null
  goal_description: string | null
  daily_goal_value: number | null
  daily_goal_type: 'minimum' | 'maximum' | null
}

type Props = {
  habit: Habit
  calendarData: HabitCalendarMap
  stats: HabitStats
}

export default function HabitDetailClient({ habit, calendarData, stats }: Props) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [count, setCount] = useState(stats.todayCount)
  const [showReminder, setShowReminder] = useState(false)

  // ✔ Correction : fallback propre
  const trackingMode: 'binary' | 'counter' = habit.tracking_mode ?? 'binary'

  const isBadHabit = habit.type === 'bad'
  const statColor = isBadHabit ? 'text-[#FF6B6B]' : 'text-[#5EEAD4]'
  const labelColor = isBadHabit ? 'text-[#FFB4A2]' : 'text-[#BAE6FD]'

  const dynamicCoachStats = {
    totalCount: stats.totalCount,
    last7DaysCount: stats.last7DaysCount,
    currentStreak: stats.currentStreak,
    todayCount: count,
    monthPercentage: stats.monthCompletionRate,
  }

  const getContextualMessage = () => {
    if (isBadHabit) {
      if (stats.currentStreak > 7) return 'Forte occurrence cette semaine, documente les déclencheurs.'
      if (stats.totalCount === 0) return 'Parfait, reste concentré sur les signaux faibles.'
      if (count === 0) return "Tu tiens bon aujourd'hui — verrouille cette énergie."
      return 'Identifie la prochaine tentation et prépare une parade.'
    }
    if (stats.currentStreak > 7) return 'Série solide, verrouille tes routines clés.'
    if (stats.last7DaysCount >= 5) return 'Très belle moyenne hebdo, conserve ta mécanique.'
    if (count === 0) return 'Commence par une action minimale pour enclencher la journée.'
    return 'Chaque validation te rapproche de la version attendue de toi-même.'
  }

  const sectionCard =
    'rounded-[28px] border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur'

  return (
    <>
      <div className="space-y-6">
        <section className={`${sectionCard} space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Focus du jour</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Action immédiate</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1 text-xs font-semibold text-white/70">
                {trackingMode === 'counter' ? 'Mode compteur' : 'Mode simple'}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold text-white/80 transition hover:border-white/60"
                onClick={() => setIsGoalModalOpen(true)}
              >
                🎯 Ajuster l&apos;objectif
              </button>
            </div>
          </div>

          <div
            className={`flex flex-col gap-4 rounded-3xl border px-5 py-4 sm:px-7 sm:py-6 ${isBadHabit
              ? 'border-[#FF6B6B]/40 bg-[#1A0E11]'
              : 'border-[#5EEAD4]/30 bg-[#0D1B1E]'
              }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Statut</p>
                <p className={`mt-2 text-3xl font-semibold ${isBadHabit ? 'text-[#FF6B6B]' : 'text-[#5EEAD4]'}`}>
                  {isBadHabit
                    ? count > 0
                      ? `${count} craquage${count > 1 ? 's' : ''}`
                      : 'Aucun craquage'
                    : count > 0
                      ? 'Habitude validée'
                      : 'En attente'}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {isBadHabit
                    ? count > 0
                      ? 'Note rapidement le contexte pour identifier tes leviers de contrôle.'
                      : 'Status clean pour le moment, garde cette vigilance.'
                    : count > 0
                      ? 'Momentum enclenché, verrouille ta progression par une répétition bonus.'
                      : 'Une micro-action suffit pour basculer dans le camp des disciplinés.'}
                </p>
              </div>
              <span
                className={`inline-flex items-center justify-center rounded-full border px-4 py-1 text-xs font-semibold ${count > 0
                  ? isBadHabit
                    ? 'border-[#FF6B6B] text-[#FF6B6B]'
                    : 'border-[#5EEAD4] text-[#5EEAD4]'
                  : 'border-white/20 text-white/60'
                  }`}
              >
                {count > 0 ? (isBadHabit ? 'Craquage détecté' : 'Validée') : 'À lancer'}
              </span>
            </div>

            <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Streak</p>
                <p className={`mt-1 text-2xl font-semibold ${statColor}`}>{stats.currentStreak} j</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Moy. 7j</p>
                <p className={`mt-1 text-2xl font-semibold ${labelColor}`}>{stats.last7DaysCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Ce mois</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.monthCompletionRate}%</p>
              </div>
            </div>
          </div>

          <HabitCounter
            habitId={habit.id}
            habitType={habit.type}
            trackingMode={trackingMode}
            goalValue={habit.goal_value}
            goalType={habit.goal_type}
            todayCount={count}
            onCountChange={setCount}
            habitName={habit.name}
            streak={stats.currentStreak}
            totalLogs={stats.totalCount}
            totalCraquages={isBadHabit ? stats.totalCount : 0}
          />
        </section>

        <div className="flex justify-end">
          <button
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2"
            onClick={() => setShowReminder(true)}
          >
            Configurer un rappel
          </button>
        </div>
        {showReminder && (
          <ReminderSettingsModal habitId={habit.id} onClose={() => setShowReminder(false)} />
        )}

        <section className={sectionCard}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Performance</p>
              <h2 className="text-2xl font-semibold text-white">Statistiques clés</h2>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Fenêtre {stats.rangeInDays}j
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Total période', value: stats.totalCount, accent: statColor },
              { label: '7 derniers jours', value: stats.last7DaysCount, accent: labelColor },
              { label: 'Streak actif', value: stats.currentStreak, accent: 'text-[#FDE68A]' },
              { label: 'Focus jour', value: count, accent: 'text-[#C4B5FD]' },
            ].map(stat => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-center shadow-inner shadow-black/40"
              >
                <p className={`text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
                <p className="mt-2 text-xs tracking-wide text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <GamificationPanel
          habit={habit}
          calendarData={calendarData}
          totalCount={stats.totalCount}
          last7DaysCount={stats.last7DaysCount}
          currentStreak={stats.currentStreak}
        />

        <HabitCoach habitId={habit.id} stats={dynamicCoachStats} />

        <section className={sectionCard}>
          <WeeklyCalendar
            habitType={habit.type}
            calendarData={calendarData}
            trackingMode={trackingMode}
            onDayClick={date => setSelectedDate(date)}
          />
        </section>

        <section
          className={`rounded-[28px] border p-6 text-center shadow-lg ${isBadHabit ? 'border-[#FF6B6B]/40 bg-[#1A0E11]' : 'border-[#5EEAD4]/30 bg-[#0D1B1E]'
            }`}
        >
          <p className="text-base text-white/90">&ldquo;{getContextualMessage()}&rdquo;</p>
        </section>
      </div>

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
