'use client'

/**
 * Affiche les patterns inconscients détectés dans les comportements
 */

import { Brain, TrendingUp } from 'lucide-react'
import type { PatternInsights as PatternInsightsType } from '@/lib/habits/usePatternDetection'

type PatternInsightsProps = {
  insights: PatternInsightsType
}

export default function PatternInsights({ insights }: PatternInsightsProps) {
  const { patterns, hasSignificantPatterns, mostDangerousDay, averageRelapseCycle } = insights

  if (patterns.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <Brain className="mx-auto h-8 w-8 text-white/30" />
        <p className="mt-3 text-sm text-white/50">
          Pas assez de données pour détecter des patterns.
        </p>
        <p className="mt-1 text-xs text-white/40">
          Continue à tracker pour révéler tes schémas inconscients.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-500/20 p-2">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
              Patterns inconscients
            </h2>
            {hasSignificantPatterns && (
              <p className="mt-0.5 text-xs text-purple-300">
                ⚠️ Schémas significatifs détectés
              </p>
            )}
          </div>
        </div>
        {(mostDangerousDay || averageRelapseCycle) && (
          <div className="text-right text-xs text-white/40">
            {mostDangerousDay && <div>Jour critique: {mostDangerousDay}</div>}
            {averageRelapseCycle && <div>Cycle moyen: {averageRelapseCycle}j</div>}
          </div>
        )}
      </div>

      {/* Patterns list */}
      <div className="space-y-3">
        {patterns.map(pattern => {
          const severityConfig = {
            high: {
              border: 'border-red-500/40',
              bg: 'bg-red-500/10',
              badge: 'bg-red-500/20 text-red-200',
              iconBg: 'bg-red-500/20',
            },
            medium: {
              border: 'border-orange-500/40',
              bg: 'bg-orange-500/10',
              badge: 'bg-orange-500/20 text-orange-200',
              iconBg: 'bg-orange-500/20',
            },
            low: {
              border: 'border-blue-500/40',
              bg: 'bg-blue-500/10',
              badge: 'bg-blue-500/20 text-blue-200',
              iconBg: 'bg-blue-500/20',
            },
          }

          const config = severityConfig[pattern.severity]

          return (
            <div
              key={pattern.id}
              className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:border-opacity-60`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 rounded-lg p-2 text-xl ${config.iconBg}`}>
                  {pattern.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {pattern.title}
                    </h3>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
                      {pattern.confidence}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">
                    {pattern.description}
                  </p>

                  {/* Pattern type badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-white/40">
                      {getPatternTypeLabel(pattern.type)}
                    </span>
                    {pattern.severity === 'high' && (
                      <span className="text-xs text-red-300">
                        • Priorité haute
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights summary */}
      {hasSignificantPatterns && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 flex-shrink-0 text-purple-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-200">
                Prends conscience de ces patterns
              </p>
              <p className="mt-1 text-xs text-white/60">
                Ces schémas se répètent inconsciemment. Les identifier est la première étape pour les briser.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getPatternTypeLabel(type: string): string {
  const labels = {
    temporal: 'Pattern temporel',
    cascade: 'Effet domino',
    trigger: 'Déclencheur',
    cycle: 'Pattern cyclique',
  }
  return labels[type as keyof typeof labels] || type
}
