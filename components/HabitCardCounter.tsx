'use client'

import { useState } from 'react'
import { Plus, Minus, Clock } from 'lucide-react'
import Link from 'next/link'
import { useToast } from './Toast'

interface HabitCardCounterProps {
  habit: {
    id: string
    name: string
    type: 'good' | 'bad'
    icon: string
    color: string
    description?: string
    tracking_mode: string
    daily_goal_type: 'minimum' | 'maximum'
    daily_goal_value: number
  }
  todayCount: number
  todayEvents: any[]
}

export function HabitCardCounter({ habit, todayCount, todayEvents: initialEvents }: HabitCardCounterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [count, setCount] = useState(todayCount)
  const [events, setEvents] = useState(initialEvents)
  const { showToast, ToastComponent } = useToast()

  // Pour les bad habits, pas d'objectif
  const isBadHabit = habit.type === 'bad'
  const hasGoal = habit.type === 'good' && habit.daily_goal_value > 0
  
  const progress = hasGoal 
    ? calculateProgress(count, habit.daily_goal_type, habit.daily_goal_value)
    : { isGoalMet: false, percentage: 0, status: 'idle' }
  
  async function handleAddOccurrence() {
    // Optimistic update
    const optimisticCount = count + 1
    setCount(optimisticCount)
    setIsLoading(true)

    try {
      const res = await fetch(`/api/habits/${habit.id}/events`, {
        method: 'POST',
      })
      
      if (res.ok) {
        const data = await res.json()
        setEvents(prev => [...prev, data])
        
        // Toast selon le type d'habitude
        if (isBadHabit) {
          if (optimisticCount === 1) {
            showToast('Premier craquage... ça arrive 😏', 'info')
          } else if (optimisticCount >= 5) {
            showToast(`${optimisticCount} craquages ! Tu te lâches là 💀`, 'error')
          } else {
            showToast(`Craquage n°${optimisticCount}`, 'info')
          }
        } else {
          if (optimisticCount >= habit.daily_goal_value) {
            showToast('🎯 Objectif atteint ! Bien joué !', 'success')
          } else {
            showToast(`+1 ! Encore ${habit.daily_goal_value - optimisticCount} pour l'objectif`, 'success')
          }
        }
      } else {
        // Rollback en cas d'erreur
        setCount(count)
        showToast('Erreur lors de l\'enregistrement', 'error')
      }
    } catch (error) {
      setCount(count)
      showToast('Erreur réseau', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemoveOccurrence() {
    if (count === 0 || events.length === 0) return
    
    // Optimistic update
    const optimisticCount = count - 1
    setCount(optimisticCount)
    setIsLoading(true)

    try {
      const lastEvent = events[events.length - 1]
      const res = await fetch(`/api/habits/${habit.id}/events/${lastEvent.id}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setEvents(prev => prev.slice(0, -1))
        showToast('Annulé', 'info')
      } else {
        setCount(count)
        showToast('Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      setCount(count)
      showToast('Erreur réseau', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {ToastComponent}
      <div className={`
        relative overflow-hidden rounded-lg border-2 
        ${getBorderColor(habit.type)}
        bg-gray-900 hover:bg-gray-850 transition-all
        group
      `}>
        {hasGoal && (
          <div className="h-1 bg-gray-800">
            <div 
              className={`h-full transition-all duration-500 ${getBarColor(progress.status)}`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        )}

        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-1">
                <div 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl flex-shrink-0"
                  style={{ backgroundColor: habit.color + '20' }}
                >
                  {habit.icon || (isBadHabit ? '🔥' : '✨')}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white text-lg md:text-xl truncate">
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="text-gray-400 text-xs md:text-sm mt-1 line-clamp-1">{habit.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            {hasGoal && (
              <div className="text-xs text-gray-500 ml-2">
                {getGoalMessage(count, habit.daily_goal_value, habit.daily_goal_type)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 py-4 my-2 bg-gray-800/50 rounded-lg">
            <button
              onClick={handleRemoveOccurrence}
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
                ${hasGoal ? getCountColor(progress.status) : isBadHabit ? 'text-red-400' : 'text-green-400'}
              `}>
                {count}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                {isBadHabit ? 'craquages' : 'fois'}
              </div>
            </div>

            <button
              onClick={handleAddOccurrence}
              disabled={isLoading}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-200
                ${getButtonColor(habit.type, progress.status)}
                hover:scale-110 active:scale-95
                disabled:opacity-50
              `}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {hasGoal && habit.daily_goal_value <= 10 && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {Array.from({ length: habit.daily_goal_value }).map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${i < count 
                      ? getActiveDotColor(progress.status)
                      : 'bg-gray-700'
                    }
                  `}
                />
              ))}
            </div>
          )}

          {hasGoal && habit.daily_goal_value > 10 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getBarColor(progress.status)}`}
                  style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono tabular-nums min-w-[60px] text-right">
                {count}/{habit.daily_goal_value}
              </span>
            </div>
          )}

          {events.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Dernière
              </span>
              <span className="font-mono">
                {new Date(events[events.length - 1].occurred_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Fonctions helper (inchangées sauf getGoalMessage simplifiée)
function calculateProgress(count: number, goalType: 'minimum' | 'maximum', goalValue: number) {
  if (goalType === 'minimum') {
    const percentage = Math.min((count / goalValue) * 100, 100)
    const isGoalMet = count >= goalValue
    
    return {
      isGoalMet,
      percentage,
      status: isGoalMet ? 'success' : count > 0 ? 'progress' : 'idle'
    }
  } else {
    const percentage = goalValue > 0 ? (count / goalValue) * 100 : 0
    const isGoalMet = count <= goalValue
    
    return {
      isGoalMet,
      percentage: Math.min(percentage, 100),
      status: count === 0 ? 'success' : count <= goalValue ? 'warning' : 'danger'
    }
  }
}

function getBorderColor(habitType: 'good' | 'bad'): string {
  return habitType === 'bad' ? 'border-red-500/30' : 'border-green-500/30'
}

function getBarColor(status: string): string {
  switch (status) {
    case 'success': return 'bg-green-500'
    case 'progress': return 'bg-blue-500'
    case 'warning': return 'bg-yellow-500'
    case 'danger': return 'bg-red-500'
    default: return 'bg-gray-600'
  }
}

function getCountColor(status: string): string {
  switch (status) {
    case 'success': return 'text-green-400'
    case 'progress': return 'text-blue-400'
    case 'warning': return 'text-yellow-400'
    case 'danger': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

function getButtonColor(habitType: 'good' | 'bad', status: string): string {
  if (habitType === 'good') {
    return 'bg-emerald-500/80 text-white/90 shadow-inner shadow-emerald-500/30 hover:bg-emerald-500'
  } else {
    return 'bg-red-500/80 text-white/90 shadow-inner shadow-red-500/30 hover:bg-red-500'
  }
}

function getActiveDotColor(status: string): string {
  switch (status) {
    case 'success': return 'bg-green-500 shadow-lg shadow-green-500/50'
    case 'progress': return 'bg-blue-500 shadow-lg shadow-blue-500/50'
    case 'warning': return 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
    case 'danger': return 'bg-red-500 shadow-lg shadow-red-500/50'
    default: return 'bg-gray-500'
  }
}

function getGoalMessage(count: number, goalValue: number, goalType: 'minimum' | 'maximum'): string {
  if (goalType === 'minimum') {
    if (count >= goalValue) {
      return `🎯 ${count}/${goalValue}`
    } else if (count > 0) {
      return `${count}/${goalValue}`
    } else {
      return `Objectif: ${goalValue}`
    }
  } else {
    if (count === 0) {
      return `✅ 0/${goalValue}`
    } else if (count <= goalValue) {
      return `⚠️ ${count}/${goalValue}`
    } else {
      return `❌ ${count}/${goalValue}`
    }
  }
}
