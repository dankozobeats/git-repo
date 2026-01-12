'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Sparkles, Target } from 'lucide-react'
import type { Database } from '@/types/database'

export type HabitWithMeta = Database['public']['Tables']['habits']['Row'] & {
  todayCount: number
  tracking_mode: 'binary' | 'counter' | null
  icon?: string | null
  color?: string | null
  current_streak?: number | null
  total_logs?: number | null
  total_craquages?: number | null
  categoryName?: string | null
  categoryColor?: string | null
}

type HabitCardProps = {
  habit: HabitWithMeta
  onActionComplete?: () => void
  hideWhenCompleted?: boolean
}

const resolveTarget = (habit: HabitWithMeta) => {
  if (habit.tracking_mode === 'counter' && typeof habit.daily_goal_value === 'number' && habit.daily_goal_value > 0) {
    return habit.daily_goal_value
  }
  return 1
}

export default function HabitCard({ habit, onActionComplete, hideWhenCompleted = false }: HabitCardProps) {
  const router = useRouter()
  const [count, setCount] = useState(Math.max(0, habit.todayCount))
  const [, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFocusToggling, setIsFocusToggling] = useState(false)
  const target = resolveTarget(habit)
  const progressRatio = Math.min(1, count / target)
  const isComplete = count >= target
  const statusLabel = isComplete ? 'Validée' : 'Active'

  if (hideWhenCompleted && isComplete) {
    return null
  }

  const handleCheckIn = async () => {
    if (isSubmitting || isComplete) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/check-in`, { method: 'POST' })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const data = await res.json()
      const newCount = typeof data.count === 'number' ? data.count : count + 1
      setCount(newCount)
      startTransition(() => router.refresh())
      onActionComplete?.()
    } catch (error) {
      console.error('HabitCard action failed', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleFocus = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFocusToggling) return
    setIsFocusToggling(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/focus`, { method: 'POST' })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const data = await res.json()

      // Dispatch custom event to refresh focus widget
      window.dispatchEvent(new CustomEvent('focusModeChanged'))

      // Refresh the page to update the habit card
      startTransition(() => router.refresh())

      // Show success message
      if (data.message) {
        console.log(data.message)
      }
    } catch (error) {
      console.error('Failed to toggle focus:', error)
    } finally {
      setIsFocusToggling(false)
    }
  }

  return (
    // Premium row with balanced left/right zones for content vs. actions.
    <div
      className={`flex items-center justify-between gap-4 rounded-[22px] border px-4 py-4 ${habit.type === 'bad' ? 'border-red-700/40 bg-red-950/20' : 'border-white/20 bg-white/10'}`}
      style={{ minHeight: '80px', maxHeight: '95px' }}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ backgroundColor: `${habit.color || '#111827'}20` }}
        >
          {habit.icon || (habit.type === 'bad' ? '🔥' : '✨')}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p
            className="text-lg font-semibold leading-tight text-white"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {habit.name}
          </p>
          <div className="flex items-center gap-3 text-[11px] font-medium text-white/50">
            <span>{count} / {target}</span>
            <div className="flex flex-1 items-center gap-2">
              <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <span
                  className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#34d399] to-[#22d3ee]'}`}
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.4em] text-white/60">{statusLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex min-w-[64px] items-center justify-end gap-2">
        {/* Focus button */}
        <button
          type="button"
          onClick={handleToggleFocus}
          disabled={isFocusToggling}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
            habit.is_focused
              ? 'border-purple-500/60 bg-purple-500/30 text-purple-200 hover:bg-purple-500/40'
              : 'border-white/20 bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
          } focus-visible:ring-2 focus-visible:ring-purple-400/40`}
          title={habit.is_focused ? 'Retirer du mode Focus' : 'Activer le mode Focus'}
        >
          <Target className="h-4 w-4" />
        </button>

        {/* Check-in button */}
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={isSubmitting || isComplete}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white transition ${isComplete ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/40'}`}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
