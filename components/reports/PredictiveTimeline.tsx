'use client'

/**
 * Timeline prédictive des 7 prochains jours
 * Affiche les jours à risque basés sur les patterns détectés
 */

import type { Prediction } from '@/lib/habits/strategicMetrics'
import { Shield, AlertTriangle, AlertCircle, Calendar } from 'lucide-react'
import { useState } from 'react'

type PredictiveTimelineProps = {
  predictions: Prediction[]
}

export function PredictiveTimeline({ predictions }: PredictiveTimelineProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  if (predictions.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white">Timeline Prédictive</h3>
          <p className="text-xs text-white/60">7 prochains jours</p>
        </div>
        <div className="py-8 text-center">
          <div className="mb-4 text-4xl opacity-40">🔮</div>
          <p className="text-sm text-white/60">Pas assez de données pour générer des prédictions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Timeline Prédictive</h3>
        <p className="text-xs text-white/60">Anticipez les jours à risque</p>
      </div>

      {/* Timeline horizontale */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-2 pb-2">
          {predictions.map((prediction, idx) => {
            const date = new Date(prediction.date)
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
            const dayNum = date.getDate()
            const isSelected = selectedDay === idx
            const isToday = idx === 0

            const config = getRiskConfig(prediction.riskLevel)

            return (
              <button
                key={prediction.date}
                onClick={() => setSelectedDay(idx)}
                className={`relative flex min-w-[100px] flex-col items-center gap-2 rounded-2xl border p-4 transition ${
                  isSelected
                    ? `${config.borderColor} ${config.bgColor}`
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                {isToday && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Aujourd'hui
                  </div>
                )}

                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}>
                  <config.icon className={`h-6 w-6 ${config.color}`} />
                </div>

                <div className="text-center">
                  <p className="text-xs font-semibold uppercase text-white/80">{dayName}</p>
                  <p className="text-2xl font-bold text-white">{dayNum}</p>
                </div>

                <div className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${config.badgeColor}`}>
                  {config.label}
                </div>

                <div className="text-[10px] text-white/50">{prediction.confidence}%</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Détails du jour sélectionné */}
      {selectedDay !== null && predictions[selectedDay] && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-white/60" />
            <h4 className="font-semibold text-white">
              {new Date(predictions[selectedDay].date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h4>
          </div>

          <div className="space-y-4">
            {/* Raisons */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                Analyse
              </p>
              <ul className="space-y-1">
                {predictions[selectedDay].reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="mt-1 text-xs text-white/40">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                Suggestions
              </p>
              <ul className="space-y-1">
                {predictions[selectedDay].suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="mt-1 text-emerald-400">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Niveau de confiance */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                Niveau de confiance
              </p>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${predictions[selectedDay].confidence}%`,
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-white">
                  {predictions[selectedDay].confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getRiskConfig(riskLevel: 'safe' | 'caution' | 'danger') {
  switch (riskLevel) {
    case 'danger':
      return {
        icon: AlertTriangle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        badgeColor: 'bg-red-500/20 text-red-300',
        label: 'Danger',
      }
    case 'caution':
      return {
        icon: AlertCircle,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        badgeColor: 'bg-amber-500/20 text-amber-300',
        label: 'Vigilance',
      }
    case 'safe':
    default:
      return {
        icon: Shield,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        badgeColor: 'bg-emerald-500/20 text-emerald-300',
        label: 'Sûr',
      }
  }
}
