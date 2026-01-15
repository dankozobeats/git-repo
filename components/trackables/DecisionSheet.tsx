'use client'

import { useState } from 'react'
import { TrackableEvent, DecisionType } from '@/types/trackables'
import { X, CheckCircle2, XCircle, Clock, Repeat } from 'lucide-react'

interface DecisionSheetProps {
  stateEvent: TrackableEvent & { trackable?: { name: string; icon?: string } }
  isOpen: boolean
  onClose: () => void
  onSubmit: (decision: {
    decision: DecisionType
    amount?: number
    delay_minutes?: number
    replacement_action?: string
  }) => Promise<void>
}

const DECISION_OPTIONS = [
  {
    type: 'resist' as DecisionType,
    label: 'Résisté',
    description: 'Je résiste à la pulsion',
    icon: CheckCircle2,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/20',
  },
  {
    type: 'relapse' as DecisionType,
    label: 'Craqué',
    description: 'Je cède à la pulsion',
    icon: XCircle,
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-500/20',
  },
  {
    type: 'delay' as DecisionType,
    label: 'Reporté',
    description: 'Je reporte la décision',
    icon: Clock,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/20',
  },
  {
    type: 'replace' as DecisionType,
    label: 'Remplacé',
    description: 'Je remplace par une bonne action',
    icon: Repeat,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/20',
  },
]

export default function DecisionSheet({
  stateEvent,
  isOpen,
  onClose,
  onSubmit,
}: DecisionSheetProps) {
  const [selectedDecision, setSelectedDecision] = useState<DecisionType | null>(
    null
  )
  const [amount, setAmount] = useState<string>('')
  const [delayMinutes, setDelayMinutes] = useState<string>('15')
  const [replacementAction, setReplacementAction] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!selectedDecision) return

    setIsSubmitting(true)
    try {
      const payload: {
        decision: DecisionType
        amount?: number
        delay_minutes?: number
        replacement_action?: string
      } = {
        decision: selectedDecision,
      }

      if (selectedDecision === 'relapse' && amount) {
        payload.amount = parseFloat(amount)
      }

      if (selectedDecision === 'delay' && delayMinutes) {
        payload.delay_minutes = parseInt(delayMinutes)
      }

      if (selectedDecision === 'replace' && replacementAction) {
        payload.replacement_action = replacementAction
      }

      await onSubmit(payload)
      // Reset form
      setSelectedDecision(null)
      setAmount('')
      setDelayMinutes('15')
      setReplacementAction('')
      onClose()
    } catch (error) {
      console.error('Error submitting decision:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedOption = DECISION_OPTIONS.find(
    (opt) => opt.type === selectedDecision
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-t-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-2xl">
              {stateEvent.trackable?.icon || '⚠️'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {stateEvent.trackable?.name || 'État observé'}
              </h2>
              <p className="text-sm text-gray-400">Quelle décision prends-tu ?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        {/* Decision Options */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {DECISION_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = selectedDecision === option.type
            return (
              <button
                key={option.type}
                onClick={() => setSelectedDecision(option.type)}
                className={`flex flex-col items-start gap-2 rounded-xl p-4 transition-all ${
                  isSelected
                    ? `bg-gradient-to-br ${option.color} scale-105 shadow-lg`
                    : `${option.bgColor} hover:scale-105`
                }`}
              >
                <Icon
                  size={32}
                  className={isSelected ? 'text-white' : 'text-white/60'}
                />
                <div className="text-left">
                  <div
                    className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}
                  >
                    {option.label}
                  </div>
                  <div
                    className={`text-sm ${isSelected ? 'text-white/90' : 'text-white/50'}`}
                  >
                    {option.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Conditional Inputs */}
        {selectedDecision === 'relapse' && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Montant dépensé (€)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-red-500"
            />
          </div>
        )}

        {selectedDecision === 'delay' && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Durée du report (minutes)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDelayMinutes(mins.toString())}
                  className={`rounded-lg p-3 font-medium transition-all ${
                    delayMinutes === mins.toString()
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
            <input
              type="number"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(e.target.value)}
              placeholder="Minutes"
              min="1"
              className="mt-2 w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
            />
          </div>
        )}

        {selectedDecision === 'replace' && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Action de remplacement
            </label>
            <input
              type="text"
              value={replacementAction}
              onChange={(e) => setReplacementAction(e.target.value)}
              placeholder="Ex: Faire une promenade, boire de l'eau..."
              className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-purple-500"
            />
          </div>
        )}

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
            disabled={!selectedDecision || isSubmitting}
            className={`flex-1 rounded-lg px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
              selectedOption
                ? `bg-gradient-to-r ${selectedOption.color}`
                : 'bg-gray-600'
            }`}
          >
            {isSubmitting ? 'Enregistrement...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  )
}
