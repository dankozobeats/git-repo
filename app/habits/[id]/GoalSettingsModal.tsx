'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

type GoalSettingsModalProps = {
  habitId: string
  currentGoal?: {
    goal_value: number | null
    goal_type: 'daily' | 'weekly' | 'monthly' | null
    goal_description: string | null
  }
  isOpen: boolean
  onClose: () => void
}

const goalTypeLabels = {
  daily: 'Par jour',
  weekly: 'Par semaine',
  monthly: 'Par mois',
}

export default function GoalSettingsModal({
  habitId,
  currentGoal,
  isOpen,
  onClose,
}: GoalSettingsModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [goalValue, setGoalValue] = useState(currentGoal?.goal_value || 1)
  const [goalType, setGoalType] = useState<'daily' | 'weekly' | 'monthly'>(
    currentGoal?.goal_type || 'daily'
  )
  const [goalDescription, setGoalDescription] = useState(currentGoal?.goal_description || '')
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (goalValue < 1) {
      setError('L\'objectif doit être au moins 1')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/habits/${habitId}/goal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_value: goalValue,
          goal_type: goalType,
          goal_description: goalDescription || null,
        }),
      })

      if (res.ok) {
        router.refresh()
        onClose()
      } else {
        setError('Erreur lors de la sauvegarde')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveGoal = async () => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/habits/${habitId}/goal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_value: null,
          goal_type: null,
          goal_description: null,
        }),
      })

      if (res.ok) {
        router.refresh()
        onClose()
      } else {
        setError('Erreur lors de la suppression')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Paramétrer l'objectif</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Goal Value */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Nombre de répétitions
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGoalValue(Math.max(1, goalValue - 1))}
                disabled={goalValue <= 1 || isLoading}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                −
              </button>
              <input
                type="number"
                value={goalValue}
                onChange={(e) => setGoalValue(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center font-semibold focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
                min="1"
              />
              <button
                onClick={() => setGoalValue(goalValue + 1)}
                disabled={isLoading}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Périodicité
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setGoalType(type)}
                  disabled={isLoading}
                  className={`py-2 px-3 rounded-lg font-medium transition-all ${
                    goalType === type
                      ? 'bg-green-600 text-white border border-green-500'
                      : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {goalTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Ex: Faire 3 séances de sport pour rester en forme"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none disabled:opacity-50"
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">{goalValue}</span> action
              {goalValue > 1 ? 's' : ''}{' '}
              <span className="text-gray-400">
                {goalTypeLabels[goalType].toLowerCase()}
              </span>
            </p>
            {goalDescription && (
              <p className="text-sm text-gray-400 mt-2 italic">"{goalDescription}"</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-6 py-4 flex gap-3">
          <button
            onClick={handleRemoveGoal}
            disabled={isLoading || !currentGoal?.goal_value}
            className="flex-1 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Supprimer
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            <Check size={20} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
