'use client'

import { useFocusedHabit } from '@/lib/habits/useFocusedHabit'
import { Target, TrendingUp, Flame, CheckCircle2, Circle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FocusedHabitWidget() {
  const { focusedHabit, isLoading } = useFocusedHabit()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="rounded-[22px] border border-white/20 bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Target className="h-6 w-6 text-white/50" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (!focusedHabit) {
    return (
      <div className="rounded-[22px] border border-white/20 bg-gradient-to-br from-gray-900/30 to-gray-800/30 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Target className="h-6 w-6 text-white/50" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white/70">Mode Focus</p>
            <p className="mt-1 text-xs text-white/50">
              Aucune habitude en focus. Sélectionnez-en une pour un suivi renforcé.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const progressPercentage = Math.round(focusedHabit.progress * 100)

  return (
    <div
      onClick={() => router.push(`/habits/${focusedHabit.id}`)}
      className="group cursor-pointer rounded-[22px] border border-purple-500/40 bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-6 backdrop-blur-sm transition-all hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/20"
    >
      {/* Header with icon and title */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-semibold text-white shadow-lg"
            style={{ backgroundColor: `${focusedHabit.color || '#8b5cf6'}40` }}
          >
            {focusedHabit.icon || '🎯'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                Mode Focus
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-white">{focusedHabit.name}</h3>
          </div>
        </div>

        {/* Completion badge */}
        {focusedHabit.isComplete ? (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Validé</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
            <Circle className="h-4 w-4 text-white/50" />
            <span className="text-xs font-semibold text-white/50">En cours</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-white/70">Progression du jour</span>
          <span className="font-bold text-white">
            {focusedHabit.todayCount} / {focusedHabit.dailyGoal}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              focusedHabit.isComplete
                ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                : 'bg-gradient-to-r from-purple-400 to-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-1.5 text-right text-xs font-medium text-white/50">
          {progressPercentage}%
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-xs font-medium text-white/60">Série</span>
          </div>
          <p className="mt-1 text-xl font-bold text-white">{focusedHabit.currentStreak}</p>
          <p className="text-xs text-white/50">jours</p>
        </div>

        {/* Total activity */}
        <div className="rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-white/60">Total</span>
          </div>
          <p className="mt-1 text-xl font-bold text-white">
            {focusedHabit.type === 'good' ? focusedHabit.totalLogs : focusedHabit.totalEvents}
          </p>
          <p className="text-xs text-white/50">
            {focusedHabit.type === 'good' ? 'réussites' : 'actions'}
          </p>
        </div>
      </div>

      {/* Motivational message */}
      <div className="mt-4 rounded-lg bg-white/5 p-3 text-center">
        <p className="text-sm font-medium text-white/80">
          {focusedHabit.isComplete
            ? focusedHabit.type === 'good'
              ? '🎉 Objectif atteint ! Continue comme ça !'
              : '✅ Limite respectée pour aujourd\'hui'
            : focusedHabit.type === 'good'
              ? `💪 Plus que ${focusedHabit.dailyGoal - focusedHabit.todayCount} à faire !`
              : `⚠️ ${focusedHabit.dailyGoal - focusedHabit.todayCount} restant(s) avant la limite`}
        </p>
      </div>
    </div>
  )
}
