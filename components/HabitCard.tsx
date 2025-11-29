'use client'

import Link from 'next/link'
import HabitQuickActions from '@/components/HabitQuickActions'
import type { Database } from '@/types/database'

export type HabitWithMeta = Database['public']['Tables']['habits']['Row'] & {
  current_streak?: number | null
  total_logs?: number | null
  total_craquages?: number | null
  todayCount: number
  categoryName?: string | null
  categoryColor?: string | null
}

type HabitCardProps = {
  habit: HabitWithMeta
  onActionComplete?: () => void
  hideWhenCompleted?: boolean
}

const resolveCounterRequirement = (habit: HabitWithMeta) => {
  if (habit.tracking_mode === 'counter' && typeof habit.daily_goal_value === 'number' && habit.daily_goal_value > 0) {
    return habit.daily_goal_value
  }
  return 1
}

export default function HabitCard({ habit, onActionComplete, hideWhenCompleted = false }: HabitCardProps) {
  const icon = habit.icon || (habit.type === 'bad' ? '🔥' : '✨')
  const hasLoggedToday = habit.todayCount > 0
  const badgeLabel = habit.type === 'bad' ? 'craquage' : 'action'
  const counterRequired = resolveCounterRequirement(habit)
  const counterCurrent = Math.max(0, habit.todayCount)
  const remaining = Math.max(0, counterRequired - counterCurrent)
  const isCounterHabit = counterRequired > 1
  const isCompleted = counterCurrent >= counterRequired

  // Optionnel : permet de masquer entièrement la carte quand on n'affiche que les habitudes à valider.
  if (hideWhenCompleted && isCompleted) {
    return null
  }

  return (
    <div
      className={`rounded-2xl border bg-gray-900/80 text-white shadow-inner shadow-black/20 transition ${
        hasLoggedToday
          ? habit.type === 'bad'
            ? 'border-red-700/60'
            : 'border-green-700/60'
          : 'border-gray-800'
      }`}
    >
      <div className="flex flex-col gap-3 p-3 md:flex-row md:items-center md:gap-4 md:p-4">
        <Link
          href={`/habits/${habit.id}`}
          className="flex flex-1 items-center gap-3 md:gap-4"
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg md:h-12 md:w-12 md:text-2xl"
            style={{ backgroundColor: `${habit.color || '#1f2937'}20` }}
          >
            {icon}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="max-w-[150px] truncate text-sm font-semibold md:max-w-none md:text-lg md:leading-tight">
              {habit.name}
            </span>
            {habit.categoryName && (
              <span className="text-xs text-gray-400 md:text-sm">
                {habit.categoryName}
              </span>
            )}
            {habit.description && (
              <span className="hidden text-sm text-gray-400 md:block">{habit.description}</span>
            )}
            {isCounterHabit && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isCompleted ? 'border-emerald-400/40 text-emerald-200' : 'border-sky-400/40 text-sky-200'
                  }`}
                >
                  {isCompleted ? 'Validée ✓' : `${remaining} restant${remaining > 1 ? 's' : ''}`}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70">
                  {counterCurrent}/{counterRequired}
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="flex items-center justify-between gap-2 text-xs text-gray-400 md:hidden">
          <span className="rounded-full border border-gray-800 px-2 py-0.5">
            {habit.todayCount} {badgeLabel}
            {habit.todayCount > 1 ? 's' : ''}
          </span>
          {habit.categoryColor && (
            <span
              className="flex h-2 w-2 rounded-full"
              style={{ backgroundColor: habit.categoryColor }}
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 md:hidden">
          <HabitQuickActions
            habitId={habit.id}
            habitType={habit.type as 'good' | 'bad'}
            trackingMode={habit.tracking_mode}
            initialCount={habit.todayCount}
            counterRequired={counterRequired}
            variant="compact"
            onActionComplete={onActionComplete}
          />
        </div>

        <div className="hidden flex-1 md:block">
          <HabitQuickActions
            habitId={habit.id}
            habitType={habit.type as 'good' | 'bad'}
            trackingMode={habit.tracking_mode}
            initialCount={habit.todayCount}
            counterRequired={counterRequired}
            streak={habit.current_streak ?? undefined}
            totalLogs={habit.total_logs ?? undefined}
            totalCraquages={habit.total_craquages ?? undefined}
            onActionComplete={onActionComplete}
          />
        </div>
      </div>
    </div>
  )
}
