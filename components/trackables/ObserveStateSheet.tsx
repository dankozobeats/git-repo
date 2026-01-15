'use client'

import { useState } from 'react'
import { Trackable, StateEventMeta } from '@/types/trackables'
import { X, AlertCircle } from 'lucide-react'

interface ObserveStateSheetProps {
  state: Trackable
  isOpen: boolean
  onClose: () => void
  onSubmit: (meta: StateEventMeta) => Promise<void>
}

const INTENSITY_LEVELS = [
  { value: 1, label: 'Très faible', color: 'bg-green-500' },
  { value: 2, label: 'Faible', color: 'bg-yellow-500' },
  { value: 3, label: 'Modéré', color: 'bg-orange-500' },
  { value: 4, label: 'Fort', color: 'bg-red-500' },
  { value: 5, label: 'Très fort', color: 'bg-red-700' },
]

const CONTEXTS = [
  { value: 'stress', label: 'Stress', emoji: '😰' },
  { value: 'ennui', label: 'Ennui', emoji: '😑' },
  { value: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { value: 'promo', label: 'Promo', emoji: '🏷️' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'autre', label: 'Autre', emoji: '❓' },
]

export default function ObserveStateSheet({
  state,
  isOpen,
  onClose,
  onSubmit,
}: ObserveStateSheetProps) {
  const [intensity, setIntensity] = useState<number>(3)
  const [context, setContext] = useState<string>('')
  const [trigger, setTrigger] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const meta: StateEventMeta = {
        intensity,
        context: context || undefined,
        trigger: trigger || undefined,
        notes: notes || undefined,
      }
      await onSubmit(meta)
      // Reset form
      setIntensity(3)
      setContext('')
      setTrigger('')
      setNotes('')
      onClose()
    } catch (error) {
      console.error('Error submitting state observation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-t-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-2xl">
              {state.icon || '⚠️'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{state.name}</h2>
              <p className="text-sm text-gray-400">Observer l'état</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Intensity Selector */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-gray-300">
            Intensité
          </label>
          <div className="grid grid-cols-5 gap-2">
            {INTENSITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setIntensity(level.value)}
                className={`flex flex-col items-center gap-1 rounded-lg p-3 transition-all ${
                  intensity === level.value
                    ? `${level.color} scale-105 shadow-lg`
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl font-bold text-white">
                  {level.value}
                </span>
                <span className="text-xs text-white/80">{level.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Context Selector */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-gray-300">
            Contexte (optionnel)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CONTEXTS.map((ctx) => (
              <button
                key={ctx.value}
                onClick={() =>
                  setContext(context === ctx.value ? '' : ctx.value)
                }
                className={`flex items-center gap-2 rounded-lg p-3 transition-all ${
                  context === ctx.value
                    ? 'bg-blue-500 shadow-lg'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-xl">{ctx.emoji}</span>
                <span className="text-sm font-medium text-white">
                  {ctx.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Déclencheur (optionnel)
          </label>
          <input
            type="text"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Ex: Pub sur Instagram, magasin..."
            className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
          />
        </div>

        {/* Notes Input */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Détails additionnels..."
            rows={3}
            className="w-full resize-none rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? 'Enregistrement...' : 'Observer'}
          </button>
        </div>
      </div>
    </div>
  )
}
