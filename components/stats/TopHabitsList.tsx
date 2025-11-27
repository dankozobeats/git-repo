'use client'

// List of best performing habits with quick selection to drill deeper.

import { memo, useCallback } from 'react'
import type { TopHabitPoint } from '@/lib/habits/useHabitStats'

interface TopHabitsListProps {
  habits: TopHabitPoint[]
  onSelect?: (habit: TopHabitPoint) => void
  onRefresh?: () => void
}

function TopHabitsListComponent({ habits, onSelect, onRefresh }: TopHabitsListProps) {
  const handleSelect = useCallback(
    (habit: TopHabitPoint) => () => {
      onSelect?.(habit)
    },
    [onSelect],
  )

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Top habitudes</p>
          <p className="text-sm text-white/60">Classement par volume d&apos;actions sur la période</p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/40"
          >
            Rafraîchir
          </button>
        )}
      </div>
      <div className="mt-6 space-y-3">
        {habits.length === 0 && <p className="text-sm text-white/60">Aucune donnée pour cette période.</p>}
        {habits.map(habit => (
          <button
            key={habit.id}
            type="button"
            onClick={handleSelect(habit)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/30"
          >
            <div>
              <p className="font-semibold text-white">{habit.name}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                {habit.type === 'bad' ? 'Habitude négative' : 'Habitude positive'} • streak {habit.streak}/{habit.maxStreak}
              </p>
            </div>
            <span className="text-lg font-semibold text-white">{habit.total}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(TopHabitsListComponent)
