'use client'

/**
 * Modal Coach IA - Wrapper pour AICoachSmartAudit
 * Overlay z-50 avec backdrop blur + bouton fermeture
 */

import { X } from 'lucide-react'
import AICoachSmartAudit from '@/components/AICoachSmartAudit'

type CoachModalProps = {
  isOpen: boolean
  onClose: () => void
  name: string
  description: string
  trackingMode: 'binary' | 'counter'
  dailyGoalValue: number
  onImprove: (data: { name: string; description: string }) => void
}

export default function CoachModal({
  isOpen,
  onClose,
  name,
  description,
  trackingMode,
  dailyGoalValue,
  onImprove,
}: CoachModalProps) {
  if (!isOpen) return null

  const handleImprove = (data: { name: string; description: string }) => {
    onImprove(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur p-6">
          <div>
            <h2 className="text-xl font-bold text-white">🤖 Coach IA</h2>
            <p className="text-sm text-white/60 mt-1">
              Améliore ton habitude avec l'intelligence artificielle
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Coach Content */}
        <div className="p-6">
          <AICoachSmartAudit
            name={name}
            description={description}
            trackingMode={trackingMode}
            dailyGoalValue={dailyGoalValue}
            onImprove={handleImprove}
          />
        </div>
      </div>
    </div>
  )
}
