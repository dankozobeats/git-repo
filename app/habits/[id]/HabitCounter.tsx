'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

type HabitCounterProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter'
  goalValue?: number | null
  goalType?: string | null
  todayCount: number
  todayEvents?: any[]
  onCountChange?: (newCount: number) => void
}

export default function HabitCounter({
  habitId,
  habitType,
  trackingMode,
  goalValue,
  goalType,
  todayCount: initialCount,
  todayEvents = [],
  onCountChange,
}: HabitCounterProps) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [events, setEvents] = useState(todayEvents)
  const [isLoading, setIsLoading] = useState(false)
  const { showToast, ToastComponent } = useToast()

  const isBadHabit = habitType === 'bad'
  const goalReached = goalValue ? count >= goalValue : false
  const remainingReps = goalValue ? Math.max(0, goalValue - count) : null

  const handleAddRepetition = async () => {
    // Optimistic update
    const optimisticCount = count + 1
    setCount(optimisticCount)
    setIsLoading(true)

    try {
      let res
      
      if (trackingMode === 'counter') {
        res = await fetch(`/api/habits/${habitId}/events`, {
          method: 'POST',
        })
      } else {
        res = await fetch(`/api/habits/${habitId}/check-in`, {
          method: 'POST',
        })
      }

      if (res.ok) {
        const data = await res.json()
        
        if (trackingMode === 'counter') {
          setEvents(prev => [...prev, data])
        }
        
        // Messages sarcastiques pour bad habits
        if (isBadHabit) {
          if (optimisticCount === 1) {
            showToast('Premier craquage... ça arrive 😏', 'info')
          } else if (optimisticCount === 2) {
            showToast('Deuxième craquage. Tu commences bien la journée ! 🤷', 'info')
          } else if (optimisticCount === 3) {
            showToast('3 craquages ! Tu prends goût là ? 😅', 'info')
          } else if (optimisticCount === 5) {
            showToast('5 craquages ! Champion de la médiocrité ! 💀', 'error')
          } else if (optimisticCount >= 10) {
            showToast(`${optimisticCount} craquages ! Tu fais ça professionnellement ? 🏆`, 'error')
          } else if (optimisticCount >= 7) {
            showToast(`${optimisticCount} craquages ! Tu te lâches vraiment... 🔥`, 'error')
          } else {
            showToast(`Craquage n°${optimisticCount}`, 'info')
          }
        } else {
          // Messages motivants pour good habits
          if (goalValue && optimisticCount >= goalValue) {
            showToast('🎯 Objectif atteint ! Bien joué champion ! 💪', 'success')
          } else if (goalValue) {
            const remaining = goalValue - optimisticCount
            showToast(`+1 ! Encore ${remaining} pour l'objectif 🚀`, 'success')
          } else {
            showToast(`+1 ! Continue comme ça ! ✨`, 'success')
          }
        }
        
        onCountChange?.(optimisticCount)
        router.refresh()
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
    if (count === 0) return

    const optimisticCount = count - 1
    setCount(optimisticCount)
    setIsLoading(true)

    try {
      let res

      if (trackingMode === 'counter') {
        const lastEvent = events[events.length - 1]
        if (lastEvent) {
          res = await fetch(`/api/habits/${habitId}/events/${lastEvent.id}`, {
            method: 'DELETE',
          })
        }
      } else {
        res = await fetch(`/api/habits/${habitId}/check-in`, {
          method: 'DELETE',
        })
      }

      if (res && res.ok) {
        if (trackingMode === 'counter') {
          setEvents(prev => prev.slice(0, -1))
        }
        
        showToast('Annulé 👍', 'info')
        onCountChange?.(optimisticCount)
        router.refresh()
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

  return (
    <>
      {ToastComponent}
      <div className="w-full">
        {/* Good Habit Counter */}
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
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRemoveRepetition}
                disabled={isLoading || count === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  count === 0
                    ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/40'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                <Minus size={20} />
                Retirer
              </button>

              <button
                onClick={handleAddRepetition}
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 transition-all shadow-lg hover:shadow-green-900/50 disabled:opacity-50"
              >
                <Plus size={20} />
                +1 Fait
              </button>
            </div>
          </div>
        )}

        {/* Bad Habit Counter */}
        {isBadHabit && (
          <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/40 rounded-xl p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="text-sm font-semibold text-red-400/70 uppercase tracking-wide mb-2">
                Craquages
              </div>

              <div className="text-6xl md:text-7xl font-bold text-white mb-4">
                {count}
              </div>

              {count > 0 && (
                <div className="text-sm text-red-300/70">
                  {count === 1
                    ? '1 craquage enregistré'
                    : `${count} craquages enregistrés`}
                </div>
              )}

              {count === 0 && (
                <div className="text-sm text-green-400 font-semibold">
                  🎉 Aucun craquage jusqu'à présent!
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRemoveRepetition}
                disabled={isLoading || count === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  count === 0
                    ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/40'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                <Minus size={20} />
                Annuler
              </button>

              <button
                onClick={handleAddRepetition}
                disabled={isLoading}
                className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 transition-all shadow-lg hover:shadow-red-900/50 disabled:opacity-50"
              >
                <Plus size={20} />
                J'ai craqué
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
