'use client'

// Displays the aggregated stats returned by the report API with a premium Linear-inspired look.

import { memo, useMemo } from 'react'
import { Flame, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'

export type ReportStats = {
  goodHabits: number
  badHabits: number
  goodLogs: number
  badLogs: number
}

interface ReportStatsSummaryProps {
  stats: ReportStats | null
}

function ReportStatsSummaryComponent({ stats }: ReportStatsSummaryProps) {
  const cards = useMemo(() => {
    if (!stats) return []

    return [
      {
        label: 'Habitudes positives',
        value: stats.goodHabits,
        accent: 'from-emerald-400/30 to-emerald-500/10',
        Icon: ShieldCheck,
        trend: '+',
      },
      {
        label: 'Habitudes négatives',
        value: stats.badHabits,
        accent: 'from-rose-400/30 to-rose-500/10',
        Icon: Flame,
        trend: '-',
      },
      {
        label: 'Validations',
        value: stats.goodLogs,
        accent: 'from-sky-400/40 to-sky-500/10',
        Icon: TrendingUp,
        trend: '+',
      },
      {
        label: 'Craquages',
        value: stats.badLogs,
        accent: 'from-amber-400/30 to-amber-500/10',
        Icon: TrendingDown,
        trend: '-',
      },
    ]
  }, [stats])

  if (!stats) return null

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, accent, Icon, trend }) => (
        <div
          key={label}
          className="rounded-[30px] border border-white/5 bg-white/[0.04] p-4 backdrop-blur-xl transition hover:border-white/20"
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
            {label}
            <span className="text-white/40">{trend}</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-semibold text-white">{value}</p>
            <span
              className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-r ${accent} p-2 text-white`}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default memo(ReportStatsSummaryComponent)
