'use client'

// Premium Linear-style selector for choosing the analysis period.

import { memo } from 'react'

export type ReportPeriod = '7j' | '30j' | '90j'

interface ReportPeriodSelectorProps {
  period: ReportPeriod
  onChange: (next: ReportPeriod) => void
  loading?: boolean
}

const PERIODS: Array<{ value: ReportPeriod; label: string; hint: string }> = [
  { value: '7j', label: '7 jours', hint: 'Focus serré (7 derniers jours)' },
  { value: '30j', label: '30 jours', hint: 'Vue consolidée (30 jours)' },
  { value: '90j', label: '90 jours', hint: 'Perspective trimestrielle' },
]

function ReportPeriodSelectorComponent({ period, onChange, loading }: ReportPeriodSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {PERIODS.map(({ value, label, hint }) => {
        const isActive = period === value

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            disabled={loading}
            onClick={() => onChange(value)}
            className={`group relative overflow-hidden rounded-[28px] border px-5 py-4 text-left transition-all backdrop-blur-xl ${
              isActive
                ? 'border-white/80 bg-white/10 shadow-[0_10px_40px_rgba(15,23,42,0.35)]'
                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/[0.08]'
            } disabled:opacity-60`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-60 ${
                isActive ? 'opacity-80' : ''
              }`}
            />
            <div className="relative space-y-1">
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-white/60">{hint}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default memo(ReportPeriodSelectorComponent)
