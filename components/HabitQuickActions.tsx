'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type HabitQuickActionsProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter' | null
  initialCount: number
}

export default function HabitQuickActions({
  habitId,
  habitType,
  trackingMode,
  initialCount,
}: HabitQuickActionsProps) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isCounterMode = trackingMode === 'counter'
  const hasValue = count > 0
  const isMutating = isSubmitting || isPending

  const statusLabel =
    habitType === 'good'
      ? hasValue
        ? 'Validée'
        : 'À faire'
      : hasValue
      ? `Craquage${isCounterMode && count > 1 ? ` (${count})` : ''}`
      : 'Aucun craquage'

  const statusClasses =
    habitType === 'good'
      ? hasValue
        ? 'bg-green-900/40 text-green-200 border border-green-800'
        : 'bg-red-900/30 text-red-200 border border-red-800'
      : hasValue
      ? 'bg-red-900/40 text-red-200 border border-red-800'
      : 'bg-green-900/30 text-green-200 border border-green-800'

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
    } catch (error) {
      console.error('[habit-action]', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const disablePrimary = isMutating || (!isCounterMode && hasValue)
  const disableSecondary = isMutating || !hasValue
  const primaryLabel = habitType === 'bad' ? '+ Craquage' : 'Valider'

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <span className={`text-xs md:text-sm px-3 py-2 rounded-lg text-center ${statusClasses}`}>
        {statusLabel}
      </span>
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          type="button"
          disabled={disableSecondary}
          onClick={() => handleAction('DELETE')}
          className={`w-full px-4 md:px-5 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base border ${
            disableSecondary
              ? 'border-gray-800 text-gray-500 cursor-not-allowed bg-gray-900'
              : 'border-gray-700 bg-gray-800 hover:bg-gray-700 hover:scale-105 active:scale-95'
          }`}
        >
          Corriger
        </button>
        <button
          type="button"
          disabled={disablePrimary}
          onClick={() => handleAction('POST')}
          className={`w-full px-4 md:px-5 py-2 rounded-lg font-medium transition-all duration-200 text-sm md:text-base ${
            disablePrimary
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-800'
              : habitType === 'bad'
              ? 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/50'
              : 'bg-green-600 hover:bg-green-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/50'
          }`}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  )
}
