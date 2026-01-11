'use client'

/**
 * Patterns saisonniers
 * Analyse par saison: Hiver, Printemps, Été, Automne
 */

import type { SeasonalData } from '@/lib/habits/useTemporalReport'
import { CloudSnow, Flower2, Sun, Leaf } from 'lucide-react'

type SeasonalPatternsProps = {
  seasonalPatterns: SeasonalData[]
  bestDayOfWeek: string | null
  worstDayOfWeek: string | null
}

export function SeasonalPatterns({ seasonalPatterns, bestDayOfWeek, worstDayOfWeek }: SeasonalPatternsProps) {
  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'Hiver':
        return CloudSnow
      case 'Printemps':
        return Flower2
      case 'Été':
        return Sun
      case 'Automne':
        return Leaf
      default:
        return Sun
    }
  }

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'Hiver':
        return {
          border: 'border-blue-300/30',
          bg: 'bg-blue-300/10',
          text: 'text-blue-300',
          icon: 'text-blue-400',
        }
      case 'Printemps':
        return {
          border: 'border-pink-400/30',
          bg: 'bg-pink-400/10',
          text: 'text-pink-300',
          icon: 'text-pink-400',
        }
      case 'Été':
        return {
          border: 'border-yellow-400/30',
          bg: 'bg-yellow-400/10',
          text: 'text-yellow-300',
          icon: 'text-yellow-400',
        }
      case 'Automne':
        return {
          border: 'border-orange-400/30',
          bg: 'bg-orange-400/10',
          text: 'text-orange-300',
          icon: 'text-orange-400',
        }
      default:
        return {
          border: 'border-white/20',
          bg: 'bg-white/5',
          text: 'text-white',
          icon: 'text-white/60',
        }
    }
  }

  const maxTotal = Math.max(...seasonalPatterns.map(s => s.good + s.bad), 1)
  const bestSeason = [...seasonalPatterns].sort((a, b) => (b.good - b.bad) - (a.good - a.bad))[0]

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Patterns Saisonniers</h3>
        <p className="text-xs text-white/60">Analyse par saison de l'année</p>
      </div>

      {/* Grille des saisons */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {seasonalPatterns.map(season => {
          const Icon = getSeasonIcon(season.season)
          const colors = getSeasonColor(season.season)
          const total = season.good + season.bad
          const successRate = total > 0 ? Math.round((season.good / total) * 100) : 0
          const isBest = season.season === bestSeason.season

          return (
            <div
              key={season.season}
              className={`relative rounded-2xl border ${colors.border} ${colors.bg} p-5 transition ${
                isBest ? 'ring-2 ring-yellow-500/50' : ''
              }`}
            >
              {isBest && (
                <div className="absolute -top-2 -right-2 rounded-full bg-yellow-500 px-2 py-1 text-[10px] font-bold uppercase text-gray-950">
                  Top
                </div>
              )}

              <div className="mb-3 flex items-center gap-2">
                <Icon className={`h-6 w-6 ${colors.icon}`} />
                <p className={`font-bold ${colors.text}`}>{season.season}</p>
              </div>

              <div className="mb-3 text-xs text-white/60">
                {season.months.join(' • ')}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400">Bonnes</span>
                  <span className="font-bold text-emerald-400">{season.good}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-400">Mauvaises</span>
                  <span className="font-bold text-red-400">{season.bad}</span>
                </div>
              </div>

              {total > 0 && (
                <div className="mt-3 rounded-lg bg-white/5 px-3 py-2">
                  <p className="text-xs text-white/80">
                    Taux de réussite: <span className="font-bold">{successRate}%</span>
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Graphique comparatif */}
      <div className="mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Volume d'activité par saison
        </p>

        {seasonalPatterns.map(season => {
          const total = season.good + season.bad
          const barWidth = (total / maxTotal) * 100
          const colors = getSeasonColor(season.season)

          return (
            <div key={season.season} className="flex items-center gap-3">
              <div className="w-24 text-right text-xs text-white/70">{season.season}</div>

              <div className="relative flex-1">
                <div className="h-8 overflow-hidden rounded-lg bg-white/5">
                  <div
                    className={`h-full rounded-lg transition-all duration-300 ${colors.bg}`}
                    style={{
                      width: `${barWidth}%`,
                      borderLeft: `3px solid currentColor`,
                    }}
                  />
                </div>
              </div>

              <div className="w-16 text-right text-sm font-bold text-white">{total}</div>
            </div>
          )
        })}
      </div>

      {/* Insights jours de la semaine */}
      {(bestDayOfWeek || worstDayOfWeek) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Insights hebdomadaires
          </p>
          <div className="mt-2 space-y-1 text-sm text-white/80">
            {bestDayOfWeek && (
              <p>
                • Meilleur jour: <span className="font-bold text-emerald-400">{bestDayOfWeek}</span>
              </p>
            )}
            {worstDayOfWeek && (
              <p>
                • Jour à risque: <span className="font-bold text-red-400">{worstDayOfWeek}</span>
              </p>
            )}
            {bestSeason && (
              <p className="mt-2 pt-2 border-t border-white/10">
                • Meilleure saison: <span className="font-bold">{bestSeason.season}</span> 🏆
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
