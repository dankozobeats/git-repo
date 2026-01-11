'use client'

/**
 * Composant principal du rapport stratégique
 * Assemble tous les sous-composants avec le hook useStrategicReport
 */

import { useStrategicReport } from '@/lib/habits/useStrategicReport'
import { HeroScoreCard } from './HeroScoreCard'
import { VictoriesChallengesGrid } from './VictoriesChallengesGrid'
import { MonthlyEvolutionChart } from './MonthlyEvolutionChart'
import { GoalsProgressGrid } from './GoalsProgressGrid'
import { PredictiveTimeline } from './PredictiveTimeline'
import { useState } from 'react'
import { Calendar } from 'lucide-react'

type StrategicReportProps = {
  defaultPeriod?: number
}

export function StrategicReport({ defaultPeriod = 30 }: StrategicReportProps) {
  const [period, setPeriod] = useState(defaultPeriod)
  const report = useStrategicReport(period)

  if (report.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
          <p className="text-sm text-white/60">Calcul du rapport stratégique...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header avec sélecteur de période */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Rapport Stratégique</h1>
          <p className="mt-1 text-sm text-white/60">
            Vue d'ensemble détaillée de votre progression
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                period === days
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4" />
              {days}j
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: Hero Score */}
      <HeroScoreCard
        healthScore={report.healthScore}
        monthlyTrend={report.monthlyTrend}
      />

      {/* Section 2: Victoires & Défis */}
      <VictoriesChallengesGrid
        victories={report.victories}
        challenges={report.challenges}
      />

      {/* Section 3: Évolution Mensuelle */}
      <MonthlyEvolutionChart monthlyTrend={report.monthlyTrend} />

      {/* Section 4: Progression des Objectifs */}
      <GoalsProgressGrid period={period} />

      {/* Section 5: Timeline Prédictive */}
      <PredictiveTimeline predictions={report.predictions} />

      {/* Section 6: Patterns Critiques - Réutilisation du composant existant */}
      {report.patterns.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Patterns Détectés</h3>
            <p className="text-xs text-white/60">
              {report.patterns.length} pattern{report.patterns.length > 1 ? 's' : ''} identifié{report.patterns.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-3">
            {report.patterns.map((pattern, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-4 ${
                  pattern.severity === 'high'
                    ? 'border-red-500/30 bg-red-500/10'
                    : pattern.severity === 'medium'
                    ? 'border-amber-500/30 bg-amber-500/10'
                    : 'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white capitalize">
                      {pattern.type === 'temporal' && '⏰ Pattern Temporel'}
                      {pattern.type === 'cascade' && '🌊 Effet Cascade'}
                      {pattern.type === 'trigger' && '🎯 Déclencheur'}
                      {pattern.type === 'cycle' && '🔄 Cycle Répétitif'}
                    </h4>
                    <p className="mt-1 text-sm text-white/80">{pattern.description}</p>
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      pattern.severity === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : pattern.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {pattern.confidence}% confiance
                  </div>
                </div>

                {pattern.recommendation && (
                  <div className="mt-3 rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-xs text-white/80">
                      <span className="font-semibold">Action recommandée: </span>
                      {pattern.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
