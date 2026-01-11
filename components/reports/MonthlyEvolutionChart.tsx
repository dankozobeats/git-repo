'use client'

/**
 * Graphique d'évolution mensuelle
 * Compare la période actuelle vs précédente
 */

import type { MonthlyTrend } from '@/lib/habits/strategicMetrics'
import { TrendingUp, TrendingDown } from 'lucide-react'

type MonthlyEvolutionChartProps = {
  monthlyTrend: MonthlyTrend
}

export function MonthlyEvolutionChart({ monthlyTrend }: MonthlyEvolutionChartProps) {
  const { currentPeriod, previousPeriod, goodActionsChange, badActionsChange } = monthlyTrend

  // Calculer le max pour l'échelle
  const maxValue = Math.max(
    currentPeriod.good,
    currentPeriod.bad,
    previousPeriod.good,
    previousPeriod.bad,
    10
  )

  // Calculer les hauteurs en %
  const currentGoodHeight = (currentPeriod.good / maxValue) * 100
  const currentBadHeight = (currentPeriod.bad / maxValue) * 100
  const previousGoodHeight = (previousPeriod.good / maxValue) * 100
  const previousBadHeight = (previousPeriod.bad / maxValue) * 100

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Évolution Mensuelle</h3>
        <p className="text-xs text-white/60">Comparaison période actuelle vs précédente</p>
      </div>

      {/* Graphique en barres */}
      <div className="mb-8 flex items-end justify-around gap-8" style={{ height: '280px' }}>
        {/* Période précédente */}
        <div className="flex flex-1 flex-col items-center">
          <div className="mb-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Période précédente
            </p>
          </div>

          <div className="relative flex w-full items-end justify-center gap-4" style={{ height: '220px' }}>
            {/* Barre bonnes actions */}
            <div className="flex flex-1 flex-col items-center justify-end">
              <div className="mb-2 text-center">
                <p className="text-2xl font-bold text-emerald-400">{previousPeriod.good}</p>
                <p className="text-xs text-white/60">Bonnes</p>
              </div>
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{
                  height: `${previousGoodHeight}%`,
                  opacity: 0.6,
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                }}
              />
            </div>

            {/* Barre mauvaises actions */}
            <div className="flex flex-1 flex-col items-center justify-end">
              <div className="mb-2 text-center">
                <p className="text-2xl font-bold text-red-400">{previousPeriod.bad}</p>
                <p className="text-xs text-white/60">Mauvaises</p>
              </div>
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-red-500 to-red-400 transition-all duration-500"
                style={{
                  height: `${previousBadHeight}%`,
                  opacity: 0.6,
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Période actuelle */}
        <div className="flex flex-1 flex-col items-center">
          <div className="mb-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Période actuelle
            </p>
          </div>

          <div className="relative flex w-full items-end justify-center gap-4" style={{ height: '220px' }}>
            {/* Barre bonnes actions */}
            <div className="flex flex-1 flex-col items-center justify-end">
              <div className="mb-2 text-center">
                <p className="text-2xl font-bold text-emerald-400">{currentPeriod.good}</p>
                <p className="text-xs text-white/60">Bonnes</p>
              </div>
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{
                  height: `${currentGoodHeight}%`,
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                }}
              />
            </div>

            {/* Barre mauvaises actions */}
            <div className="flex flex-1 flex-col items-center justify-end">
              <div className="mb-2 text-center">
                <p className="text-2xl font-bold text-red-400">{currentPeriod.bad}</p>
                <p className="text-xs text-white/60">Mauvaises</p>
              </div>
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-red-500 to-red-400 transition-all duration-500"
                style={{
                  height: `${currentBadHeight}%`,
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques de changement */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Bonnes actions</p>
              <p className={`text-2xl font-bold ${goodActionsChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {goodActionsChange > 0 ? '+' : ''}{goodActionsChange}%
              </p>
            </div>
            {goodActionsChange >= 0 ? (
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-400" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">Mauvaises actions</p>
              <p className={`text-2xl font-bold ${badActionsChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {badActionsChange > 0 ? '+' : ''}{badActionsChange}%
              </p>
            </div>
            {badActionsChange <= 0 ? (
              <TrendingDown className="h-8 w-8 text-emerald-400" />
            ) : (
              <TrendingUp className="h-8 w-8 text-red-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
