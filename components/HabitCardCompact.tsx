'use client'

import { useState, type MouseEvent } from 'react'
import Link from 'next/link'
import HabitQuickActions from '@/components/HabitQuickActions'
import type { HabitWithMeta } from '@/components/HabitCard'

type HabitCardCompactProps = {
  habit: HabitWithMeta
  onActionComplete?: () => void
  hideWhenCompleted?: boolean
  showDescriptions?: boolean
}

const resolveCounterRequirement = (habit: HabitWithMeta) => {
  if (habit.tracking_mode === 'counter' && typeof habit.daily_goal_value === 'number' && habit.daily_goal_value > 0) {
    return habit.daily_goal_value
  }
  return 1
}

export default function HabitCardCompact({
  habit,
  onActionComplete,
  hideWhenCompleted = false,
  showDescriptions = false,
}: HabitCardCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const icon = habit.icon || (habit.type === 'bad' ? '🔥' : '✨')
  const hasLoggedToday = habit.todayCount > 0
  const badgeLabel = habit.type === 'bad' ? 'craquage' : 'action'
  const counterRequired = resolveCounterRequirement(habit)
  const counterCurrent = Math.max(0, habit.todayCount)
  const remaining = Math.max(0, counterRequired - counterCurrent)
  const isCounterHabit = counterRequired > 1
  const isCompleted = counterCurrent >= counterRequired

  if (hideWhenCompleted && isCompleted) {
    return null
  }

  const handleToggle = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!showDescriptions) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    setIsExpanded(prev => !prev)
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border bg-slate-900/80 px-4 py-3 text-white shadow-inner shadow-black/20 transition ${
        hasLoggedToday
          ? habit.type === 'bad'
            ? 'border-red-700/60'
            : 'border-emerald-700/60'
          : 'border-slate-800'
      }`}
    >
      <Link
        href={`/habits/${habit.id}`}
        onClick={handleToggle}
        className="flex flex-1 flex-col gap-1 overflow-hidden"
      >
        <div className="flex items-start gap-3 overflow-hidden">
          <span
            className="shrink-0 rounded-xl bg-slate-800/80 p-2 text-lg md:p-3 md:text-2xl"
            style={{ backgroundColor: `${habit.color || '#1f2937'}20` }}
          >
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-medium leading-tight truncate max-w-full tracking-tight md:text-base ${
                isCompleted ? 'text-slate-500 line-through' : 'text-slate-50'
              }`}
              title={habit.name}
            >
              {habit.name}
            </h3>
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full border border-slate-800/70 bg-slate-800/40 px-2 py-0.5">
                {habit.todayCount} {badgeLabel}
                {habit.todayCount > 1 ? 's' : ''}
              </span>
              {isCounterHabit && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-semibold text-white/70">
                  {isCompleted ? 'Validée' : `${remaining} restant${remaining > 1 ? 's' : ''}`} · {counterCurrent}/{counterRequired}
                </span>
              )}
              {habit.categoryName && (
                <span className="truncate text-ellipsis text-slate-400">{habit.categoryName}</span>
              )}
              {habit.categoryColor && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: habit.categoryColor }}
                />
              )}
            </div>
          </div>
        </div>

        {showDescriptions && habit.description && (
          <div
            className={`overflow-hidden text-xs leading-relaxed text-slate-400 transition-[max-height,margin-top] duration-200 ${
              isExpanded ? 'max-h-24 mt-1' : 'max-h-0'
            }`}
          >
            <p className="line-clamp-3">{habit.description}</p>
          </div>
        )}
      </Link>

      <div className="shrink-0" data-prevent-toggle="true">
        <HabitQuickActions
          habitId={habit.id}
          habitType={habit.type as 'good' | 'bad'}
          trackingMode={habit.tracking_mode}
          initialCount={habit.todayCount}
          counterRequired={counterRequired}
          habitName={habit.name}
          habitDescription={habit.description}
          streak={habit.current_streak ?? undefined}
          totalLogs={habit.total_logs ?? undefined}
          totalCraquages={habit.total_craquages ?? undefined}
          onActionComplete={onActionComplete}
          size="compact"
        />
      </div>
    </div>
  )
}
