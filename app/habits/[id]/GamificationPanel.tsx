'use client'

import { Trophy, Sparkles, Shield, Flame, Target } from 'lucide-react'
import { useMemo } from 'react'

type Habit = {
  id: string
  name: string
  type: 'good' | 'bad'
  goal_value: number | null
  goal_type: 'daily' | 'weekly' | 'monthly' | null
  goal_description: string | null
}

type GamificationPanelProps = {
  habit: Habit
  calendarData: Record<string, number>
  totalCount: number
  last7DaysCount: number
  currentStreak: number
}

type BadgeDefinition = {
  id: string
  label: string
  description: string
  icon: string
  check: (context: GamificationContext) => boolean
}

type GamificationContext = {
  totalCount: number
  last7DaysCount: number
  currentStreak: number
  calmDays: number
  calmStreak: number
  habitType: 'good' | 'bad'
}

const LEVELS = [
  { max: 250, name: 'Novice' },
  { max: 500, name: 'Apprenti' },
  { max: 1000, name: 'Performer' },
  { max: 2000, name: 'Maître' },
  { max: Number.POSITIVE_INFINITY, name: 'Légende' },
]

const GOOD_BADGES: BadgeDefinition[] = [
  {
    id: 'first-step',
    label: 'Premier pas',
    description: 'Tu as enregistré 1 progression',
    icon: '🟢',
    check: ({ totalCount }) => totalCount >= 1,
  },
  {
    id: 'streak-3',
    label: 'Routine lancée',
    description: 'Streak de 3 jours',
    icon: '🔥',
    check: ({ currentStreak }) => currentStreak >= 3,
  },
  {
    id: 'weekly-focus',
    label: 'Focus Weekly',
    description: '5 actions sur la semaine',
    icon: '📅',
    check: ({ last7DaysCount }) => last7DaysCount >= 5,
  },
  {
    id: 'consistency',
    label: 'Machine',
    description: '30 actions en 28 jours',
    icon: '⚡️',
    check: ({ totalCount }) => totalCount >= 30,
  },
]

const BAD_BADGES: BadgeDefinition[] = [
  {
    id: 'day-one',
    label: 'Prise de conscience',
    description: 'Tu suis ton habitude',
    icon: '👀',
    check: ({ totalCount }) => totalCount >= 1,
  },
  {
    id: 'calm-3',
    label: '3 jours clean',
    description: '3 jours sans craquage',
    icon: '🧊',
    check: ({ calmStreak }) => calmStreak >= 3,
  },
  {
    id: 'control-week',
    label: 'Contrôle',
    description: '12 jours propres sur 28',
    icon: '🛡️',
    check: ({ calmDays }) => calmDays >= 12,
  },
  {
    id: 'phoenix',
    label: 'Résilience',
    description: '6 jours clean d’affilée',
    icon: '🚫',
    check: ({ calmStreak }) => calmStreak >= 6,
  },
]

const DAYS_WINDOW = 28

function getCalmMetrics(calendarData: Record<string, number>) {
  const today = new Date()
  let calmStreak = 0

  for (let i = 0; i < DAYS_WINDOW; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const key = date.toISOString().split('T')[0]
    const hasActivity = (calendarData[key] ?? 0) > 0

    if (hasActivity) {
      break
    }
    calmStreak += 1
  }

  const activityInWindow = Object.keys(calendarData).filter((dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    const diffMs = today.getTime() - date.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays < DAYS_WINDOW
  })

  const calmDays = Math.max(
    0,
    DAYS_WINDOW - Math.min(activityInWindow.length, DAYS_WINDOW)
  )

  return { calmStreak, calmDays }
}

function computePoints(
  habitType: 'good' | 'bad',
  totalCount: number,
  last7DaysCount: number,
  currentStreak: number,
  calmMetrics: { calmStreak: number; calmDays: number }
) {
  if (habitType === 'bad') {
    const controlBonus = calmMetrics.calmDays * 8 + calmMetrics.calmStreak * 18
    const prevention = Math.max(0, 150 - totalCount * 5)
    return Math.max(0, Math.round(controlBonus + prevention))
  }

  const production = totalCount * 10
  const streakBonus = currentStreak * 20
  const weeklyMomentum = Math.min(last7DaysCount, 7) * 15
  return Math.round(production + streakBonus + weeklyMomentum)
}

function resolveLevel(points: number) {
  let levelIndex = 0
  let previousMax = 0

  for (let i = 0; i < LEVELS.length; i++) {
    if (points <= LEVELS[i].max) {
      levelIndex = i
      break
    }
    previousMax = LEVELS[i].max
  }

  const level = LEVELS[levelIndex]
  const range = level.max === Number.POSITIVE_INFINITY ? 500 : level.max - previousMax
  const progress = Math.min(
    100,
    Math.round(((points - previousMax) / (range || 1)) * 100)
  )

  return {
    name: level.name,
    progress,
    nextThreshold:
      level.max === Number.POSITIVE_INFINITY
        ? null
        : Math.max(0, level.max - points),
  }
}

export default function GamificationPanel({
  habit,
  calendarData,
  totalCount,
  last7DaysCount,
  currentStreak,
}: GamificationPanelProps) {
  const { points, badges, level, calmMetrics } = useMemo(() => {
    const calm = getCalmMetrics(calendarData)
    const computedPoints = computePoints(
      habit.type,
      totalCount,
      last7DaysCount,
      currentStreak,
      calm
    )

    const badgeDefinitions = habit.type === 'bad' ? BAD_BADGES : GOOD_BADGES
    const context: GamificationContext = {
      totalCount,
      last7DaysCount,
      currentStreak,
      calmDays: calm.calmDays,
      calmStreak: calm.calmStreak,
      habitType: habit.type,
    }

    return {
      points: computedPoints,
      calmMetrics: calm,
      level: resolveLevel(computedPoints),
      badges: badgeDefinitions.map((badge) => ({
        ...badge,
        unlocked: badge.check(context),
      })),
    }
  }, [calendarData, currentStreak, habit.type, last7DaysCount, totalCount])

  const isBadHabit = habit.type === 'bad'

  return (
    <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0D111D] to-[#07090F] p-6 space-y-6 shadow-2xl shadow-black/40">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FFB347]" /> Gamification
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">
            {isBadHabit ? 'Score de contrôle' : 'Score de progression'}
          </h3>
          <p className="text-white/60 text-sm">Basé sur tes 4 dernières semaines.</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 flex-shrink-0">
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wider">Points</div>
            <div className="text-4xl font-bold text-white tabular-nums">{points}</div>
          </div>
          <div className="h-12 w-px bg-white/10 hidden sm:block" />
          <div>
            <div className="text-xs text-white/50 uppercase tracking-wider">Niveau</div>
            <div className="text-2xl font-semibold text-[#FFB347]">{level.name}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Sparkles className="w-4 h-4 text-[#4DA6FF]" />
            Progression niveau
          </div>
          <div className="h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${isBadHabit ? 'bg-[#FF4D4D]' : 'bg-[#4DA6FF]'}`}
              style={{ width: `${level.progress}%` }}
            />
          </div>
          <p className="text-xs text-white/50 mt-2">
            {level.nextThreshold
              ? `${level.nextThreshold} pts pour le niveau suivant`
              : 'Niveau max atteint !'}
          </p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/60">
            {isBadHabit ? (
              <Shield className="w-4 h-4 text-emerald-400" />
            ) : (
              <Target className="w-4 h-4 text-emerald-400" />
            )}
            {isBadHabit ? 'Jours sous contrôle' : 'Semaine active'}
          </div>
          <div className="text-3xl font-bold mt-2 text-white">
            {isBadHabit ? calmMetrics.calmDays : last7DaysCount}
          </div>
          <p className="text-xs text-white/50 mt-1">
            {isBadHabit
              ? 'Sans craquage sur les 28 derniers jours'
              : 'Actions réalisées sur 7 jours'}
          </p>
        </div>

        <div className="bg-black/30 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Flame className="w-4 h-4 text-orange-400" />
            Streak actuel
          </div>
          <div className="text-3xl font-bold mt-2 text-white">{currentStreak}j</div>
          <p className="text-xs text-white/50 mt-1">
            {isBadHabit
              ? calmMetrics.calmStreak > 0
                ? `${calmMetrics.calmStreak} jours clean`
                : 'Reprends le contrôle 👊'
              : 'Plus la série est longue, plus le bonus est fort'}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm text-white/60 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFB347]" />
          Badges
        </p>
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`px-4 py-2 rounded-xl border text-sm transition ${
                badge.unlocked
                  ? 'bg-[#102315] border-emerald-600/60 text-white'
                  : 'bg-black/20 border-white/10 text-white/40'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <span>{badge.icon}</span>
                {badge.label}
              </div>
              <p className="text-xs mt-1 opacity-80">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
