'use client'

// Premium summary cards showing totals for positive actions, cravings and overall entries.

import { memo, useMemo } from 'react'
import { ArrowUpRight, Circle, Flame, ShieldCheck } from 'lucide-react'

interface SummaryCardsProps {
  data: {
    good: number
    bad: number
    total: number
  }
}

function SummaryCardsComponent({ data }: SummaryCardsProps) {
  const cards = useMemo(
    () => [
      {
        label: 'Actions positives',
        value: data.good,
        accent: 'from-emerald-500/40 via-emerald-400/20 to-transparent',
        Icon: ShieldCheck,
      },
      {
        label: 'Craquages',
        value: data.bad,
        accent: 'from-rose-500/40 via-rose-400/20 to-transparent',
        Icon: Flame,
      },
      {
        label: 'Total entrées',
        value: data.total,
        accent: 'from-sky-500/40 via-sky-400/20 to-transparent',
        Icon: ArrowUpRight,
      },
    ],
    [data.bad, data.good, data.total],
  )

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ label, value, accent, Icon }, index) => (
        <div
          key={label}
          className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_50px_rgba(2,6,23,0.55)] backdrop-blur-2xl transition hover:-translate-y-1 hover:border-white/30"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
            {label}
            <Circle className="h-1.5 w-1.5 fill-white/50 text-white/50" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-4xl font-semibold text-white">{value}</p>
            <span className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${accent} p-3 text-white`}>
              <Icon className="h-5 w-5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default memo(SummaryCardsComponent)
