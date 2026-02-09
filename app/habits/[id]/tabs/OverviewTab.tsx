'use client'

/**
 * Onglet Vue d'ensemble - Validation + Stats principales + Message du jour
 */

import HeroCard from '../HeroCard'
import type { HabitCalendarMap } from '@/lib/habits/computeHabitStats'

type Habit = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter' | null
  daily_goal_value: number | null
  daily_goal_type: 'minimum' | 'maximum' | null
  missions?: any[] | null
}

type OverviewTabProps = {
  habit: Habit
  stats: {
    currentStreak: number
    todayCount: number
    last7DaysCount: number
    monthCompletionRate: number
    totalCount: number
    bestStreak: number
  }
  calendarData: HabitCalendarMap
  onValidate: () => void
  onOpenMissions: () => void
  todayMissionsProgress: string[]
  isValidating: boolean
}

export default function OverviewTab({
  habit,
  stats,
  calendarData,
  onValidate,
  onOpenMissions,
  todayMissionsProgress,
  isValidating,
}: OverviewTabProps) {
  const isBadHabit = habit.type === 'bad'

  // Calculer la meilleure série
  let bestStreak = 0
  let currentTempStreak = 0
  const sortedDates = Object.keys(calendarData).sort()

  for (let i = 0; i < sortedDates.length; i++) {
    if (calendarData[sortedDates[i]] > 0) {
      currentTempStreak++
      bestStreak = Math.max(bestStreak, currentTempStreak)
    } else {
      currentTempStreak = 0
    }
  }

  // Message contextuel
  const getContextualMessage = () => {
    if (isBadHabit) {
      if (stats.currentStreak > 7) return 'Forte occurrence cette semaine, documente les déclencheurs.'
      if (stats.totalCount === 0) return 'Parfait, reste concentré sur les signaux faibles.'
      if (stats.todayCount === 0) return "Tu tiens bon aujourd'hui — verrouille cette énergie."
      return 'Identifie la prochaine tentation et prépare une parade.'
    }
    if (stats.currentStreak > 7) return 'Série solide, verrouille tes routines clés.'
    if (stats.last7DaysCount >= 5) return 'Très belle moyenne hebdo, conserve ta mécanique.'
    if (stats.todayCount === 0) return 'Commence par une action minimale pour enclencher la journée.'
    return 'Chaque validation te rapproche de la version attendue de toi-même.'
  }

  const statColor = isBadHabit ? 'text-[#FF6B6B]' : 'text-[#5EEAD4]'
  const labelColor = isBadHabit ? 'text-[#FFB4A2]' : 'text-[#BAE6FD]'

  return (
    <div className="space-y-6 p-4">
      <HeroCard
        habit={habit as any}
        stats={{
          currentStreak: stats.currentStreak,
          todayCount: stats.todayCount,
          last7DaysCount: stats.last7DaysCount,
          monthCompletionRate: stats.monthCompletionRate,
        }}
        onValidate={onValidate}
        isValidating={isValidating}
      />

      {/* Section Missions */}
      {habit.missions && (habit.missions as any[]).length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              Missions du jour
            </h2>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-400">
              {todayMissionsProgress.length}/{(habit.missions as any[]).length}
            </span>
          </div>

          <div className="space-y-3">
            {(habit.missions as any[]).map((mission) => {
              const info = typeof mission === 'string' ? { id: mission, text: mission } : mission
              const isCompleted = todayMissionsProgress.includes(info.id)

              return (
                <button
                  key={info.id}
                  onClick={onOpenMissions}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${isCompleted
                    ? 'border-blue-500/30 bg-blue-500/10'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                    }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${isCompleted
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-white/20'
                      }`}
                  >
                    {isCompleted && (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${isCompleted ? 'text-white' : 'text-white/70'
                      }`}
                  >
                    {info.text}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={onOpenMissions}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-xs font-semibold text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            Gérer les missions
          </button>
        </div>
      )}

      {/* Stats Étendues */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          Statistiques détaillées
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Meilleure série"
            value={`${bestStreak}j`}
            accent="text-[#FDE68A]"
          />
          <StatCard
            label="Total période"
            value={stats.totalCount}
            accent={statColor}
          />
          <StatCard
            label="Moyenne 7j"
            value={stats.last7DaysCount}
            accent={labelColor}
          />
          <StatCard
            label="Ce mois"
            value={`${stats.monthCompletionRate}%`}
            accent="text-[#C4B5FD]"
          />
        </div>
      </div>

      {/* Message du jour */}
      <div
        className={`rounded-3xl border p-6 text-center shadow-lg ${isBadHabit
          ? 'border-[#FF6B6B]/40 bg-[#1A0E11]'
          : 'border-[#5EEAD4]/30 bg-[#0D1B1E]'
          }`}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-3">
          💬 Message du jour
        </p>
        <p className="text-base text-white/90 leading-relaxed">
          &ldquo;{getContextualMessage()}&rdquo;
        </p>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-center shadow-inner shadow-black/40">
      <p className={`text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-2 text-xs tracking-wide text-white/60">{label}</p>
    </div>
  )
}
