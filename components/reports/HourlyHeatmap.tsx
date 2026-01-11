'use client'

/**
 * Heatmap des heures de la journée (0h-23h)
 * Affiche l'activité par heure avec bonnes/mauvaises actions
 */

import type { HourlyData } from '@/lib/habits/useTemporalReport'
import { Clock } from 'lucide-react'

type HourlyHeatmapProps = {
  hourlyData: HourlyData[]
  mostActiveHour: number | null
  mostRiskyHour: number | null
}

export function HourlyHeatmap({ hourlyData, mostActiveHour, mostRiskyHour }: HourlyHeatmapProps) {
  const maxTotal = Math.max(...hourlyData.map(h => h.total), 1)

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Analyse Horaire</h3>
          <p className="text-xs text-white/60">Activité par heure de la journée</p>
        </div>
        <Clock className="h-6 w-6 text-white/40" />
      </div>

      {/* Insights */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {mostActiveHour !== null && (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-xs text-blue-300/70">Heure la plus active</p>
            <p className="text-2xl font-bold text-blue-300">{mostActiveHour}h - {(mostActiveHour + 1) % 24}h</p>
          </div>
        )}
        {mostRiskyHour !== null && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-xs text-red-300/70">Heure la plus à risque</p>
            <p className="text-2xl font-bold text-red-300">{mostRiskyHour}h - {(mostRiskyHour + 1) % 24}h</p>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="space-y-2">
        {hourlyData.map(hour => {
          const intensity = hour.total / maxTotal
          const goodRatio = hour.total > 0 ? hour.good / hour.total : 0

          return (
            <div key={hour.hour} className="flex items-center gap-3">
              {/* Label heure */}
              <div className="w-16 text-right text-xs font-semibold text-white/70">
                {String(hour.hour).padStart(2, '0')}h
              </div>

              {/* Barre */}
              <div className="relative flex-1">
                <div className="h-8 overflow-hidden rounded-lg bg-white/5">
                  {/* Partie bonne (verte) */}
                  <div
                    className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${goodRatio * intensity * 100}%`,
                      opacity: 0.3 + intensity * 0.7,
                      boxShadow: intensity > 0.5 ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                    }}
                  />
                  {/* Partie mauvaise (rouge) */}
                  <div
                    className="absolute h-full bg-red-500 transition-all duration-300"
                    style={{
                      left: `${goodRatio * intensity * 100}%`,
                      width: `${(1 - goodRatio) * intensity * 100}%`,
                      opacity: 0.3 + intensity * 0.7,
                      boxShadow: intensity > 0.5 ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none',
                    }}
                  />
                </div>

                {/* Hover overlay avec détails */}
                {hour.total > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition hover:opacity-100">
                    <div className="rounded-lg bg-gray-950/95 px-3 py-2 text-xs text-white shadow-xl">
                      <div className="flex gap-3">
                        <span className="text-emerald-400">✓ {hour.good}</span>
                        <span className="text-red-400">✗ {hour.bad}</span>
                        <span className="text-white/60">Total: {hour.total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Compteur */}
              <div className="w-12 text-right text-xs font-semibold text-white/80">
                {hour.total > 0 ? hour.total : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
          <span className="text-white/60">Bonnes actions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span className="text-white/60">Mauvaises actions</span>
        </div>
      </div>
    </div>
  )
}
