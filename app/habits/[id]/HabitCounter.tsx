'use client'

import { useState, useTransition } from 'react'
import { Plus, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { getBinaryStatusLabel, isSuccess } from '@/lib/habits/status'

type HabitCounterProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter'
  goalValue?: number | null
  goalType?: string | null
  todayCount: number
  todayEvents?: { id: string }[]
  onCountChange?: (newCount: number) => void
}

export default function HabitCounter({
  habitId,
  habitType,
  trackingMode,
  goalValue,
  goalType,
  todayCount: initialCount,
  todayEvents = [] as { id: string }[],
  onCountChange,
}: HabitCounterProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [count, setCount] = useState(initialCount)
  const [events, setEvents] = useState<{ id: string }[]>(todayEvents ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const isBadHabit = habitType === 'bad'
  const isCounterMode = trackingMode === 'counter'
  const isMutating = isLoading || isPending
  const goalReached = goalValue ? count >= goalValue : false
  const remainingReps = goalValue ? Math.max(0, goalValue - count) : null

  const isBinarySuccess = isSuccess(habitType, count)
  const binaryStatusLabel = getBinaryStatusLabel(habitType, count)

  const binaryStatusClasses = isBinarySuccess
    ? 'bg-green-900/30 text-green-200 border border-green-800'
    : 'bg-red-900/30 text-red-200 border border-red-800'

  const binaryStatusDescription = (() => {
    if (habitType === 'good') {
      return count > 0
        ? 'Tu as validé cette habitude aujourd’hui. Continue sur ta lancée !'
        : 'Pas encore validée. Appuie sur “Valider” quand tu as terminé.'
    }
    return count > 0
      ? 'Craquage enregistré. Pas grave, tu peux corriger si besoin.'
      : 'Toujours clean aujourd’hui. Tiens bon !'
  })()

  const handleValidateBinary = async () => {
    if (isCounterMode || count > 0 || isMutating) return
    setIsLoading(true)
    setCount(1)

    try {
      const res = await fetch(`/api/habits/${habitId}/check-in`, { method: 'POST' })
      if (!res.ok) {
        throw new Error('check-in failed')
      }

      showToast(
        habitType === 'good'
          ? 'Habitude validée pour aujourd’hui ✅'
          : 'Craquage enregistré 😬',
        habitType === 'good' ? 'success' : 'info'
      )
      onCountChange?.(1)
      startTransition(() => router.refresh())
    } catch (error) {
      console.error('Erreur:', error)
      setCount(0)
      showToast('Impossible de mettre à jour le statut', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetBinary = async () => {
    if (isCounterMode || count === 0 || isMutating) return
    setIsLoading(true)
    setCount(0)

    try {
      const res = await fetch(`/api/habits/${habitId}/check-in`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('reset failed')
      }

      showToast('Statut corrigé', 'info')
      onCountChange?.(0)
      startTransition(() => router.refresh())
    } catch (error) {
      console.error('Erreur:', error)
      setCount(1)
      showToast('Impossible de corriger le statut', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRepetition = async () => {
    if (!isCounterMode || isMutating) return
    const optimisticCount = count + 1
    setCount(optimisticCount)
    setIsLoading(true)

    try {
      const res = await fetch(`/api/habits/${habitId}/events`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setEvents(prev => [...prev, data])

        if (isBadHabit) {
          if (optimisticCount === 1) {
            showToast('Premier craquage... ça arrive 😏', 'info')
          } else if (optimisticCount >= 5) {
            showToast(`${optimisticCount} craquages ! Tu te lâches là 💀`, 'error')
          } else {
            showToast(`Craquage n°${optimisticCount}`, 'info')
          }
        } else {
          if (goalValue && optimisticCount >= goalValue) {
            showToast('🎯 Objectif atteint ! Bien joué !', 'success')
          } else if (goalValue) {
            const remaining = goalValue - optimisticCount
            showToast(`+1 ! Encore ${remaining} pour l'objectif`, 'success')
          } else {
            showToast(`+1 ! Continue comme ça ! ✨`, 'success')
          }
        }

        onCountChange?.(optimisticCount)
        startTransition(() => router.refresh())
      } else {
        setCount(count)
        showToast('Erreur lors de l\'enregistrement', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setCount(count)
      showToast('Erreur réseau', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveRepetition = async () => {
    if (!isCounterMode || count === 0 || isMutating) return

    const optimisticCount = count - 1
    setCount(optimisticCount)
    setIsLoading(true)

    try {
      const lastEvent = events[events.length - 1]
      if (!lastEvent) {
        setCount(count)
        setIsLoading(false)
        return
      }

      const res = await fetch(`/api/habits/${habitId}/events/${lastEvent.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setEvents(prev => prev.slice(0, -1))
        showToast('Annulé 👍', 'info')
        onCountChange?.(optimisticCount)
        startTransition(() => router.refresh())
      } else {
        setCount(count)
        showToast('Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setCount(count)
      showToast('Erreur réseau', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isCounterMode) {
    return (
      <>
        {ToastComponent}
        <div
          className={`rounded-2xl border p-6 md:p-8 bg-gray-900/80 ${
            isBadHabit ? 'border-red-800/70' : 'border-green-800/70'
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Statut du jour</p>
                <p
                  className={`text-2xl md:text-3xl font-bold ${
                    count > 0
                      ? isBadHabit
                        ? 'text-red-300'
                        : 'text-green-300'
                      : isBadHabit
                        ? 'text-green-300'
                        : 'text-red-300'
                  }`}
                >
                  {binaryStatusLabel}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${binaryStatusClasses}`}>
                {binaryStatusLabel}
              </span>
            </div>

            <p className="text-gray-400 text-sm md:text-base">{binaryStatusDescription}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleResetBinary}
                disabled={count === 0 || isMutating}
                className={`w-full px-4 py-3 rounded-lg font-medium border transition-all ${
                  count === 0 || isLoading
                    ? 'border-gray-800 text-gray-500 cursor-not-allowed bg-gray-900'
                    : 'border-gray-700 bg-gray-800 hover:bg-gray-700 hover:scale-[1.01]'
                }`}
              >
                Corriger
              </button>
              <button
                onClick={handleValidateBinary}
                disabled={count > 0 || isLoading}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all ${
                  count > 0 || isLoading
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-800'
                    : isBadHabit
                      ? 'bg-red-600 hover:bg-red-700 hover:scale-[1.01] active:scale-95 shadow-lg shadow-red-900/40'
                      : 'bg-green-600 hover:bg-green-700 hover:scale-[1.01] active:scale-95 shadow-lg shadow-green-900/40'
                }`}
              >
                {isBadHabit ? '+ Craquage' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {ToastComponent}
      <div className="w-full">
        {!isBadHabit && (
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/40 rounded-xl p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="text-sm font-semibold text-green-400/70 uppercase tracking-wide mb-2">
                {goalType ? `Objectif ${goalType === 'daily' ? 'quotidien' : goalType === 'weekly' ? 'hebdomadaire' : 'mensuel'}` : 'Suivi'}
              </div>

              <div className="flex items-baseline justify-center gap-1 mb-4">
                <div className="text-6xl md:text-7xl font-bold text-white">
                  {count}
                </div>
                {goalValue && (
                  <>
                    <div className="text-3xl md:text-4xl text-gray-400">/</div>
                    <div className="text-5xl md:text-6xl font-bold text-gray-500">
                      {goalValue}
                    </div>
                  </>
                )}
              </div>

              {goalValue && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex-1 h-3 bg-gray-700/50 rounded-full overflow-hidden max-w-xs">
                    <div
                      className={`h-full transition-all duration-300 ${
                        goalReached ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((count / goalValue) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {goalValue && (
                <div className="text-lg font-semibold mb-2">
                  {goalReached ? (
                    <span className="text-green-400">✓ Objectif atteint!</span>
                  ) : (
                    <span className="text-yellow-400">
                      {remainingReps} {remainingReps === 1 ? 'action restante' : 'actions restantes'}
                    </span>
                  )}
                </div>
              )}

              {goalValue && (
                <div className="text-sm text-gray-400">
                  Objectif {goalType === 'weekly' ? 'hebdo' : goalType === 'monthly' ? 'mensuel' : 'quotidien'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 py-4 my-2 bg-gray-800/50 rounded-lg">
              <button
                onClick={handleRemoveRepetition}
                disabled={count === 0 || isLoading}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${count === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-900/50 text-red-400 hover:bg-red-900 hover:scale-110 active:scale-95'
                  }
                `}
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center min-w-[80px]">
                <div className={`
                  text-4xl md:text-5xl font-bold tabular-nums transition-all duration-300
                  ${goalReached ? 'text-green-400' : 'text-yellow-400'}
                `}>
                  {count}
                </div>
                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                  {goalValue ? 'Sur objectif' : 'fois'}
                </div>
              </div>

              <button
                onClick={handleAddRepetition}
                disabled={isMutating}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  bg-green-600 hover:bg-green-500 hover:scale-110 active:scale-95
                  disabled:opacity-50
                `}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {typeof goalValue === 'number' && goalValue > 0 && goalValue <= 10 && (
              <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {Array.from({ length: goalValue }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 ${
                      i < count ? 'bg-green-500 border-green-300' : 'border-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isBadHabit && (
          <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/40 rounded-xl p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="text-sm font-semibold text-red-400/70 uppercase tracking-wide mb-2">
                Contrôle des craquages
              </div>

              <div className="text-6xl md:text-7xl font-bold text-white mb-2">
                {count}
              </div>
              <div className="text-xs md:text-sm text-red-300 uppercase tracking-[0.2em]">
                craquage{count > 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 py-4 my-2 bg-gray-800/50 rounded-lg">
              <button
                onClick={handleRemoveRepetition}
                disabled={count === 0 || isMutating}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${count === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-900/50 text-red-400 hover:bg-red-900 hover:scale-110 active:scale-95'
                  }
                `}
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center min-w-[80px]">
                <div className="text-4xl md:text-5xl font-bold tabular-nums text-red-400 transition-all duration-300">
                  {count}
                </div>
                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                  craquages
                </div>
              </div>

              <button
                onClick={handleAddRepetition}
                disabled={isMutating}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  bg-red-600 hover:bg-red-500 hover:scale-110 active:scale-95
                  disabled:opacity-50
                `}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-red-300 mt-4">
              {count === 0 ? (
                <p>Pas de craquage aujourd'hui. Tiens bon !</p>
              ) : (
                <p>{count} craquage{count > 1 ? 's' : ''}. Tu peux toujours corriger et repartir à zéro.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
