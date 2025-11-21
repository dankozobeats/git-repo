'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './Toast'
import { toastRoastCraquage, toastRoastCorrection, toastRoastSuccess } from '@/lib/coach/coach'

type HabitQuickActionsProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter' | null
  initialCount: number
  habitName: string
  streak?: number
  totalLogs?: number
  totalCraquages?: number
}

export default function HabitQuickActions({
  habitId,
  habitType,
  trackingMode,
  initialCount,
  habitName,
  streak = 0,
  totalLogs = 0,
  totalCraquages = 0,
}: HabitQuickActionsProps) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { showToast, ToastComponent } = useToast()

  const isCounterMode = trackingMode === 'counter'
  const hasValue = count > 0
  const isMutating = isSubmitting || isPending

  const buttonBaseClasses =
    'flex-1 h-11 rounded-lg px-4 font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4DA6FF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f]'

  const handleAction = async (method: 'POST' | 'DELETE') => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/habits/${habitId}/check-in`, { method })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'request_failed')
      }
      const data = await res.json()
      const newCount =
        typeof data.count === 'number'
          ? data.count
          : method === 'POST'
          ? count + 1
          : Math.max(0, count - 1)
      setCount(newCount)
      startTransition(() => router.refresh())
      const payloadStreak = habitType === 'good' && method === 'POST' ? safeStreak + 1 : safeStreak
      if (method === 'POST') {
        if (habitType === 'bad') {
          showToast(toastRoastCraquage(habitName, payloadStreak, safeCraquages + newCount), 'error')
        } else {
          showToast(toastRoastSuccess(habitName, payloadStreak, safeLogs + newCount), 'success')
        }
      } else {
        showToast(toastRoastCorrection(habitName, safeStreak, Math.max(0, safeCraquages - 1)), 'info')
      }
    } catch (error) {
      console.error('[habit-action]', error)
      showToast('Impossible de mettre à jour', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const disablePrimary = isMutating || (!isCounterMode && hasValue)
  const primaryLabel = habitType === 'bad' ? '+ Craquage' : 'Valider'

  const safeStreak = Math.max(0, streak)
  const safeLogs = Math.max(0, totalLogs)
  const safeCraquages = Math.max(0, totalCraquages)

  return (
    <>
      {ToastComponent}
      <div className="hidden w-full min-w-0 max-w-full flex-wrap gap-2 justify-between sm:flex sm:w-auto sm:flex-nowrap sm:justify-start">
        <div className="flex flex-wrap gap-2 w-full min-w-0 max-w-full justify-end sm:w-auto sm:flex-nowrap sm:justify-start">
          <button
            type="button"
            disabled={disablePrimary}
            onClick={() => handleAction('POST')}
            className={`${buttonBaseClasses} flex-shrink-0 ${
              disablePrimary
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-800 opacity-70'
                : habitType === 'bad'
                ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95 border border-red-500/70'
                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-[1.02] active:scale-95 border border-green-500/70'
            }`}
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:hidden">
        {habitType === 'bad' ? (
          <button
            type="button"
            disabled={disablePrimary}
            onClick={() => handleAction('POST')}
            className="flex-shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-900/40 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Craquage
          </button>
        ) : hasValue ? (
          <span className="flex-shrink-0 rounded-xl border border-green-500/60 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200">
            Validée
          </span>
        ) : (
          <button
            type="button"
            disabled={disablePrimary}
            onClick={() => handleAction('POST')}
            className="flex-shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/40 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Valider
          </button>
        )}
      </div>
    </>
  )
}
