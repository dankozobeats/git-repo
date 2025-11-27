'use client'

// Linear-inspired selector for switching analytics periods.

import { memo, useCallback } from 'react'
import type { HabitStatsPeriod } from '@/lib/habits/useHabitStats'

interface PeriodSelectorProps {
  value: HabitStatsPeriod
  onChange: (next: HabitStatsPeriod) => void
  options?: HabitStatsPeriod[]
  disabled?: boolean
}

const DEFAULT_PERIODS: HabitStatsPeriod[] = [7, 30, 90, 'all']

function PeriodSelectorComponent({
  value,
  onChange,
  options = DEFAULT_PERIODS,
  disabled = false,
}: PeriodSelectorProps) {
  const handleClick = useCallback(
    (next: HabitStatsPeriod) => () => {
      if (disabled || next === value) return
      onChange(next)
    },
    [disabled, onChange, value],
  )

  return (
    <div className="flex flex-wrap gap-3">
      {options.map(option => {
        const isActive = option === value
        const label = option === 'all' ? 'Tout' : `${option} jours`

        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={handleClick(option)}
            className={`group relative overflow-hidden rounded-[30px] border px-4 py-2 text-sm font-semibold transition-all backdrop-blur-xl ${
              isActive ? 'border-white/70 bg-white/10 text-white shadow-[0_10px_40px_rgba(2,6,23,0.45)]' : 'border-white/10 text-white/70 hover:border-white/40 hover:text-white'
            } disabled:opacity-50`}
          >
            <span className="relative z-10">{label}</span>
            <span
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 transition ${
                isActive ? 'opacity-80' : 'group-hover:opacity-50'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

export default memo(PeriodSelectorComponent)
