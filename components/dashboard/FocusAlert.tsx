'use client'

/**
 * Alerte principale du dashboard indiquant l'état global
 */

import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import type { GlobalState } from '@/lib/habits/useRiskAnalysis'

type FocusAlertProps = {
  globalState: GlobalState
}

export default function FocusAlert({ globalState }: FocusAlertProps) {
  const { riskLevel, message, spiralDetected, recentRelapses } = globalState

  const config = {
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-200',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
    },
    warning: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-200',
      icon: AlertCircle,
      iconColor: 'text-orange-400',
    },
    good: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-200',
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
    },
  }

  const current = config[riskLevel]
  const Icon = current.icon

  return (
    <div
      className={`rounded-3xl border ${current.border} ${current.bg} p-6 shadow-lg backdrop-blur-sm`}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 rounded-2xl p-3 ${current.bg}`}>
          <Icon className={`h-6 w-6 ${current.iconColor}`} />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Focus du jour
          </p>
          <h2 className={`mt-2 text-xl font-bold ${current.text}`}>
            {message}
          </h2>
          {spiralDetected && (
            <p className="mt-2 text-sm text-white/70">
              {recentRelapses} rechute{recentRelapses > 1 ? 's' : ''} en 3 jours - attention spirale
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
