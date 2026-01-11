'use client'

/**
 * Carte Hero affichant le score de santé global
 * Gauge circulaire + tendance + breakdown
 */

import type { HealthScore, MonthlyTrend } from '@/lib/habits/strategicMetrics'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type HeroScoreCardProps = {
  healthScore: HealthScore
  monthlyTrend: MonthlyTrend
}

export function HeroScoreCard({ healthScore, monthlyTrend }: HeroScoreCardProps) {
  const { score, grade, color, breakdown } = healthScore
  const { goodActionsChange, badActionsChange, overallTrend } = monthlyTrend

  // Calculer l'angle pour la gauge circulaire (0-100 → 0-360°)
  const angle = (score / 100) * 360

  // SVG pour gauge circulaire
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  // Déterminer l'icône de tendance
  const TrendIcon = overallTrend === 'improving'
    ? TrendingUp
    : overallTrend === 'declining'
    ? TrendingDown
    : Minus

  const trendColor = overallTrend === 'improving'
    ? 'text-emerald-400'
    : overallTrend === 'declining'
    ? 'text-red-400'
    : 'text-gray-400'

  const gradeLabels = {
    excellent: 'Excellence',
    good: 'Bon',
    average: 'Moyen',
    poor: 'À améliorer',
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          Score de santé global
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gauge circulaire */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative h-52 w-52">
            {/* Background circle */}
            <svg className="h-full w-full -rotate-90 transform">
              <circle
                cx="104"
                cy="104"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-white/10"
              />
              {/* Progress circle */}
              <circle
                cx="104"
                cy="104"
                r={radius}
                stroke={color}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: 'drop-shadow(0 0 8px currentColor)',
                }}
              />
            </svg>

            {/* Score au centre */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold text-white">{score}</div>
              <div className="text-sm text-white/60">/ 100</div>
              <div
                className="mt-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {gradeLabels[grade]}
              </div>
            </div>
          </div>
        </div>

        {/* Détails et tendance */}
        <div className="flex flex-col justify-center space-y-6">
          {/* Tendance mensuelle */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              Tendance mensuelle
            </p>
            <div className="flex items-center gap-3">
              <TrendIcon className={`h-8 w-8 ${trendColor}`} />
              <div>
                <p className={`text-2xl font-bold ${trendColor}`}>
                  {overallTrend === 'improving' && 'En progression'}
                  {overallTrend === 'declining' && 'En baisse'}
                  {overallTrend === 'stable' && 'Stable'}
                </p>
                <div className="mt-1 flex gap-4 text-xs text-white/60">
                  <span className="text-emerald-400">
                    Bonnes: {goodActionsChange > 0 ? '+' : ''}{goodActionsChange}%
                  </span>
                  <span className="text-red-400">
                    Mauvaises: {badActionsChange > 0 ? '+' : ''}{badActionsChange}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown du score */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Détail du score
            </p>

            <div className="space-y-2">
              <ScoreBreakdownItem
                label="Bonnes vs Mauvaises"
                value={breakdown.goodVsBad}
                max={40}
                color={color}
              />
              <ScoreBreakdownItem
                label="Qualité des streaks"
                value={breakdown.streakQuality}
                max={30}
                color={color}
              />
              <ScoreBreakdownItem
                label="Santé des patterns"
                value={breakdown.patternsHealth}
                max={20}
                color={color}
              />
              <ScoreBreakdownItem
                label="Progression"
                value={breakdown.progression}
                max={10}
                color={color}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type ScoreBreakdownItemProps = {
  label: string
  value: number
  max: number
  color: string
}

function ScoreBreakdownItem({ label, value, max, color }: ScoreBreakdownItemProps) {
  const percentage = (value / max) * 100

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-white">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  )
}
