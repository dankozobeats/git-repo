'use client'

/**
 * Hero Card - Vue synthèse toujours visible
 * Donne un aperçu instantané de l'habitude
 */

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreVertical } from 'lucide-react'
import { useState } from 'react'

type HeroCardProps = {
  habit: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string
    type: 'good' | 'bad'
    tracking_mode: 'binary' | 'counter' | null
    daily_goal_value: number | null
    daily_goal_type: 'minimum' | 'maximum' | null
  }
  stats: {
    currentStreak: number
    todayCount: number
    last7DaysCount: number
    monthCompletionRate: number
  }
  onValidate?: () => void
  isValidating?: boolean
}

export default function HeroCard({ habit, stats, onValidate, isValidating }: HeroCardProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isBadHabit = habit.type === 'bad'
  const isCounterMode = habit.tracking_mode === 'counter'
  const hasGoal = habit.daily_goal_value && habit.daily_goal_value > 0

  const primaryColor = isBadHabit ? '#FF6B6B' : '#5EEAD4'
  const bgGradient = isBadHabit
    ? 'from-red-500/10 to-red-600/5'
    : 'from-emerald-500/10 to-teal-600/5'

  const getStatusText = () => {
    if (isBadHabit) {
      return stats.todayCount > 0
        ? `${stats.todayCount} craquage${stats.todayCount > 1 ? 's' : ''} aujourd'hui`
        : 'Aucun craquage aujourd\'hui'
    }

    if (isCounterMode && hasGoal) {
      return `${stats.todayCount}/${habit.daily_goal_value} aujourd\'hui`
    }

    return stats.todayCount > 0 ? '✓ Fait aujourd\'hui' : 'En attente'
  }

  const getProgressPercentage = () => {
    if (!hasGoal || !isCounterMode) return 0
    return Math.min((stats.todayCount / (habit.daily_goal_value || 1)) * 100, 100)
  }

  const isDone = isCounterMode && hasGoal
    ? stats.todayCount >= (habit.daily_goal_value || 0)
    : stats.todayCount > 0

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
      {/* Background gradient accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50`} />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-3xl shadow-lg backdrop-blur"
              style={{
                backgroundColor: `${habit.color || primaryColor}15`,
                boxShadow: `0 0 30px ${primaryColor}20`
              }}
            >
              {habit.icon || (isBadHabit ? '🔥' : '✨')}
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full border border-white/10 px-3 py-0.5 text-xs uppercase tracking-wide text-white/60">
                  {isBadHabit ? 'Mauvaise' : 'Bonne'} habitude
                </span>
                {isCounterMode && (
                  <span className="rounded-full border border-white/10 px-3 py-0.5 text-xs text-white/70">
                    Compteur
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{habit.name}</h1>
              {habit.description && (
                <p className="mt-2 text-sm text-white/60 line-clamp-2">{habit.description}</p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-white/10 bg-[#0d0f17]/95 p-2 shadow-2xl backdrop-blur">
                  <Link
                    href={`/habits/${habit.id}/edit`}
                    className="block rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ✏️ Modifier
                  </Link>
                  <Link
                    href="/"
                    className="block rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ← Retour dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Streak"
            value={`${stats.currentStreak}j`}
            icon="🔥"
            color={primaryColor}
          />
          <StatCard
            label="Aujourd'hui"
            value={getStatusText()}
            icon={isDone ? '✓' : '○'}
            color={isDone ? '#10b981' : '#6b7280'}
            compact
          />
          <StatCard
            label="7 jours"
            value={stats.last7DaysCount.toString()}
            icon="📊"
            color="#818cf8"
          />
          <StatCard
            label="Ce mois"
            value={`${stats.monthCompletionRate}%`}
            icon="📅"
            color="#f59e0b"
          />
        </div>

        {/* Progress Bar (si mode counter avec objectif) */}
        {isCounterMode && hasGoal && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Progression du jour</span>
              <span className="font-semibold text-white">
                {stats.todayCount}/{habit.daily_goal_value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: primaryColor,
                  boxShadow: `0 0 10px ${primaryColor}60`
                }}
              />
            </div>
          </div>
        )}

        {/* CTA Button */}
        {onValidate && (
          <button
            onClick={onValidate}
            disabled={isValidating || (isDone && !isCounterMode && !isBadHabit)}
            className="w-full rounded-2xl py-4 text-base font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isDone && !isCounterMode && !isBadHabit ? '#1f2937' : `${primaryColor}20`,
              color: isDone && !isCounterMode && !isBadHabit ? '#6b7280' : primaryColor,
              border: `1px solid ${primaryColor}40`,
            }}
          >
            {isValidating ? (
              'Enregistrement...'
            ) : isBadHabit ? (
              stats.todayCount > 0 ? `+ Signaler craquage (${stats.todayCount})` : '+ Signaler craquage'
            ) : isDone && !isCounterMode ? (
              '✓ Validé aujourd\'hui'
            ) : (
              isCounterMode ? '+ Ajouter répétition' : '✓ Valider aujourd\'hui'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  compact = false,
}: {
  label: string
  value: string
  icon: string
  color: string
  compact?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      </div>
      <p
        className={`font-bold ${compact ? 'text-xs' : 'text-xl'} truncate`}
        style={{ color }}
      >
        {value}
      </p>
    </div>
  )
}
