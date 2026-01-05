'use client'

/**
 * Carte pour chaque habitude à risque avec actions rapides
 */

import { useState } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { formatTimeSince, formatDateTime } from '@/lib/utils/date'
import type { RiskHabit } from '@/lib/habits/useRiskAnalysis'

type RiskHabitCardProps = {
  habit: RiskHabit
  onQuickAction: (habitId: string, action: 'validate' | 'relapse' | 'substitute') => void
}

export default function RiskHabitCard({ habit, onQuickAction }: RiskHabitCardProps) {
  const [loading, setLoading] = useState(false)

  const config = {
    critical: {
      border: 'border-red-500/40',
      bg: 'bg-red-500/5',
      icon: AlertTriangle,
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      badge: 'bg-red-500/20 text-red-200',
    },
    warning: {
      border: 'border-orange-500/40',
      bg: 'bg-orange-500/5',
      icon: AlertCircle,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-200',
    },
    good: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/5',
      icon: CheckCircle,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-200',
    },
  }

  const current = config[habit.riskLevel]
  const Icon = current.icon

  const handleAction = async (action: 'validate' | 'relapse' | 'substitute') => {
    setLoading(true)
    await onQuickAction(habit.id, action)
    setLoading(false)
  }

  return (
    <div
      className={`rounded-2xl border ${current.border} ${current.bg} p-5 transition-all hover:border-opacity-60`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 rounded-xl p-2.5 ${current.iconBg}`}>
          <Icon className={`h-5 w-5 ${current.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{habit.name}</h3>
              <p className="mt-1 text-sm text-white/60">{habit.message}</p>
            </div>
            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${current.badge}`}>
              {habit.type === 'bad' ? 'Mauvaise' : 'Bonne'}
            </span>
          </div>

          {/* Streak info */}
          {habit.currentStreak > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-white/50">
              <Clock className="h-4 w-4" />
              <span>
                {habit.type === 'bad'
                  ? `${habit.currentStreak} jour${habit.currentStreak > 1 ? 's' : ''} sans craquage`
                  : `Série de ${habit.currentStreak} jour${habit.currentStreak > 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Date/heure de dernière validation */}
          {habit.lastActionTimestamp && (
            <p className="mt-2 text-xs text-white/40">
              {formatDateTime(habit.lastActionTimestamp, 'Dernière validation :')}
            </p>
          )}

          {/* Action suggestion */}
          <p className="mt-3 text-sm font-medium text-white/80">
            💡 {habit.actionSuggestion}
          </p>

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {habit.type === 'good' && (
              <button
                onClick={() => handleAction('validate')}
                disabled={loading || habit.isDoneToday}
                className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {habit.isDoneToday ? '✓ Fait aujourd\'hui' : '✓ Valider aujourd\'hui'}
              </button>
            )}

            {habit.type === 'bad' && habit.riskLevel === 'critical' && (
              <>
                <button
                  onClick={() => handleAction('substitute')}
                  disabled={loading}
                  className="rounded-xl bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/30 disabled:opacity-50"
                >
                  Action de substitution
                </button>
                <button
                  onClick={() => handleAction('relapse')}
                  disabled={loading}
                  className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/30 disabled:opacity-50"
                >
                  J'ai craqué
                </button>
              </>
            )}

            {habit.type === 'bad' && habit.riskLevel !== 'critical' && (
              <button
                onClick={() => handleAction('relapse')}
                disabled={loading}
                className="rounded-xl bg-orange-500/20 px-4 py-2 text-sm font-medium text-orange-200 transition hover:bg-orange-500/30 disabled:opacity-50"
              >
                Signaler un craquage
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
