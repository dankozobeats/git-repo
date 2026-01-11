'use client'

/**
 * Comparaison Meilleur vs Pire mois
 * Affiche les performances mensuelles avec graphique
 */

import type { MonthSummary } from '@/lib/habits/useTemporalReport'
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react'

type MonthlyComparisonProps = {
  bestMonth: MonthSummary | null
  worstMonth: MonthSummary | null
  currentMonth: MonthSummary
  allMonths: MonthSummary[]
}

export function MonthlyComparison({ bestMonth, worstMonth, currentMonth, allMonths }: MonthlyComparisonProps) {
  const maxScore = Math.max(...allMonths.map(m => Math.abs(m.score)), 1)

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Comparaison Mensuelle</h3>
        <p className="text-xs text-white/60">Performance par mois</p>
      </div>

      {/* Comparaison Best vs Worst */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Meilleur mois */}
        {bestMonth && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/70">
                Meilleur mois
              </p>
            </div>
            <p className="mb-2 text-xl font-bold text-emerald-300">{bestMonth.monthName}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-400">+{bestMonth.good}</span>
              <span className="text-red-400">-{bestMonth.bad}</span>
            </div>
            <div className="mt-3 rounded-lg bg-emerald-500/20 px-3 py-2">
              <p className="text-xs text-emerald-300">
                Score: <span className="font-bold">{bestMonth.score}</span> • Taux: {bestMonth.successRate}%
              </p>
            </div>
          </div>
        )}

        {/* Mois actuel */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300/70">
              Mois actuel
            </p>
          </div>
          <p className="mb-2 text-xl font-bold text-blue-300">{currentMonth.monthName}</p>
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">+{currentMonth.good}</span>
            <span className="text-red-400">-{currentMonth.bad}</span>
          </div>
          <div className="mt-3 rounded-lg bg-blue-500/20 px-3 py-2">
            <p className="text-xs text-blue-300">
              Score: <span className="font-bold">{currentMonth.score}</span> • Taux: {currentMonth.successRate}%
            </p>
          </div>
        </div>

        {/* Pire mois */}
        {worstMonth && (
          <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/20 to-red-500/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-red-300/70">
                Pire mois
              </p>
            </div>
            <p className="mb-2 text-xl font-bold text-red-300">{worstMonth.monthName}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-emerald-400">+{worstMonth.good}</span>
              <span className="text-red-400">-{worstMonth.bad}</span>
            </div>
            <div className="mt-3 rounded-lg bg-red-500/20 px-3 py-2">
              <p className="text-xs text-red-300">
                Score: <span className="font-bold">{worstMonth.score}</span> • Taux: {worstMonth.successRate}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Graphique évolution mensuelle */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Évolution sur {allMonths.length} mois
        </p>

        {allMonths.slice(0, 12).map(month => {
          const isPositive = month.score >= 0
          const barWidth = (Math.abs(month.score) / maxScore) * 100

          return (
            <div key={month.month} className="flex items-center gap-3">
              {/* Label mois */}
              <div className="w-32 text-right text-xs text-white/70">
                {month.monthName}
              </div>

              {/* Barre */}
              <div className="relative flex flex-1 items-center">
                <div className="h-8 w-full rounded-lg bg-white/5">
                  <div
                    className={`h-full rounded-lg transition-all duration-300 ${
                      isPositive
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{
                      width: `${barWidth}%`,
                      boxShadow: `0 0 12px ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  />
                </div>

                {/* Hover info */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:opacity-100">
                  <div className="rounded-lg bg-gray-950/95 px-3 py-2 text-xs text-white shadow-xl">
                    <div className="flex gap-3">
                      <span className="text-emerald-400">✓ {month.good}</span>
                      <span className="text-red-400">✗ {month.bad}</span>
                      <span className="text-white/60">Score: {month.score}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className={`w-16 text-right text-sm font-bold ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {isPositive ? '+' : ''}{month.score}
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights */}
      {bestMonth && worstMonth && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Analyse</p>
          <div className="mt-2 space-y-1 text-sm text-white/80">
            <p>
              • Différence entre meilleur et pire mois:{' '}
              <span className="font-bold text-white">{bestMonth.score - worstMonth.score} points</span>
            </p>
            {currentMonth.score > 0 && (
              <p>
                • Tu es sur une bonne lancée ce mois-ci! Continue comme ça 💪
              </p>
            )}
            {currentMonth.score < 0 && worstMonth.month !== currentMonth.month && (
              <p>
                • Ce mois peut être difficile, mais tu peux inverser la tendance
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
