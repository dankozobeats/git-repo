'use client'

import { useEffect, useRef, useState } from 'react'
import type { Database } from '@/types/database'
import HabitQuickActions from '@/components/HabitQuickActions'

type HabitRow = Database['public']['Tables']['habits']['Row'] & {
  current_streak?: number | null
  total_logs?: number | null
  total_craquages?: number | null
}

type HabitAccordionItemProps = {
  habit: HabitRow
  type: 'good' | 'bad'
  todayCount: number
  openHabitId?: string | null
  setOpenHabitId?: (id: string | null) => void
}

export default function HabitAccordionItem({
  habit,
  type,
  todayCount,
  openHabitId,
  setOpenHabitId,
}: HabitAccordionItemProps) {
  const isControlled = typeof openHabitId !== 'undefined' && typeof setOpenHabitId === 'function'
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = isControlled ? openHabitId === habit.id : internalOpen
  const contentRef = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState('0px')
  const icon = habit.icon || (type === 'bad' ? '🔥' : '✨')
  const isBad = type === 'bad'
  const hasValue = todayCount > 0
  const counterRequired =
    habit.tracking_mode === 'counter' && typeof habit.daily_goal_value === 'number' && habit.daily_goal_value > 0
      ? habit.daily_goal_value
      : 1

  const statusLabel = isBad
    ? hasValue
      ? `${todayCount} craquage${todayCount > 1 ? 's' : ''}`
      : 'Aucun craquage'
    : hasValue
    ? 'Validée'
    : 'À faire'

  const badgeClasses = isBad
    ? hasValue
      ? 'border-red-500/70 bg-red-500/10 text-red-200'
      : 'border-green-500/60 bg-green-500/10 text-green-200'
    : hasValue
    ? 'border-green-500/70 bg-green-500/10 text-green-200'
    : 'border-red-400/60 bg-red-500/10 text-red-200'

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const updateHeight = () => {
      if (isOpen) {
        setMaxHeight(`${el.scrollHeight}px`)
      } else {
        setMaxHeight('0px')
      }
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)

    return () => observer.disconnect()
  }, [isOpen, todayCount, habit.description])

  const toggle = () => {
    if (isControlled && setOpenHabitId) {
      setOpenHabitId(isOpen ? null : habit.id)
    } else {
      setInternalOpen(prev => !prev)
    }
  }

  return (
    <div className="relative z-0 rounded-2xl border border-white/10 bg-[#11131c]/70 text-white shadow-inner shadow-black/40">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:px-4 sm:py-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-xl shadow-inner">{icon}</span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{habit.name}</p>
            <span className="text-xs text-white/60">{habit.tracking_mode === 'counter' ? 'Mode compteur' : 'Mode standard'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}>{statusLabel}</span>
          <span className={`text-sm font-semibold text-white/60 transition ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      <div
        ref={contentRef}
        style={{ maxHeight }}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
      >
        <div className="space-y-4 border-t border-white/5 px-4 py-4 sm:px-5 sm:py-5">
          <div className="text-sm text-white/70">
            {habit.description ? (
              <p>{habit.description}</p>
            ) : (
              <p className="italic text-white/40">Aucune description pour cette habitude.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">
                {isBad ? 'Habitude négative' : 'Habitude positive'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">
                Streak : {habit.current_streak ?? 0} jour{(habit.current_streak ?? 0) > 1 ? 's' : ''}
              </span>
            </div>
            <HabitQuickActions
              habitId={habit.id}
              habitType={type}
              trackingMode={habit.tracking_mode}
              initialCount={todayCount}
              counterRequired={counterRequired}
              habitName={habit.name}
              habitDescription={habit.description}
              streak={habit.current_streak ?? 0}
              totalLogs={habit.total_logs ?? undefined}
              totalCraquages={habit.total_craquages ?? undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
