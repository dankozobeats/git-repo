'use client'

/**
 * Timeline "Time Machine"
 * Retour dans le passé: 30, 60, 90, 180, 365 jours
 */

import type { TimeMachineSnapshot } from '@/lib/habits/useTemporalReport'
import { Clock, ArrowLeft } from 'lucide-react'

type TimeMachineTimelineProps = {
  timeMachine: TimeMachineSnapshot[]
}

export function TimeMachineTimeline({ timeMachine }: TimeMachineTimelineProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Time Machine</h3>
          <p className="text-xs text-white/60">Retour dans le passé</p>
        </div>
        <Clock className="h-6 w-6 text-white/40" />
      </div>

      {/* Timeline */}
      <div className="relative space-y-6">
        {/* Ligne verticale */}
        <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50" />

        {timeMachine.map((snapshot, index) => {
          const totalActions = snapshot.good + snapshot.bad
          const successRate = totalActions > 0 ? Math.round((snapshot.good / totalActions) * 100) : 0
          const isGoodDay = successRate >= 50

          const formattedDate = new Date(snapshot.date + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })

          // Couleur basée sur la période
          const colorClass =
            snapshot.daysAgo <= 60
              ? 'border-blue-500/30 bg-blue-500/10'
              : snapshot.daysAgo <= 180
              ? 'border-purple-500/30 bg-purple-500/10'
              : 'border-pink-500/30 bg-pink-500/10'

          const dotColor =
            snapshot.daysAgo <= 60
              ? 'bg-blue-500'
              : snapshot.daysAgo <= 180
              ? 'bg-purple-500'
              : 'bg-pink-500'

          return (
            <div key={snapshot.daysAgo} className="relative flex items-start gap-6">
              {/* Dot sur la ligne */}
              <div className={`relative z-10 h-4 w-4 rounded-full ${dotColor} ring-4 ring-gray-950`} />

              {/* Carte snapshot */}
              <div className={`flex-1 rounded-2xl border ${colorClass} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4 text-white/60" />
                      <p className="text-sm font-bold text-white">{snapshot.label}</p>
                    </div>
                    <p className="mt-1 text-xs capitalize text-white/60">{formattedDate}</p>
                  </div>
                  {totalActions > 0 && (
                    <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isGoodDay
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {successRate}%
                    </div>
                  )}
                </div>

                {totalActions > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-emerald-500/10 px-3 py-2">
                      <p className="text-xs text-emerald-300/70">Bonnes actions</p>
                      <p className="text-2xl font-bold text-emerald-300">{snapshot.good}</p>
                    </div>
                    <div className="rounded-lg bg-red-500/10 px-3 py-2">
                      <p className="text-xs text-red-300/70">Mauvaises actions</p>
                      <p className="text-2xl font-bold text-red-300">{snapshot.bad}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white/5 px-4 py-3 text-center">
                    <p className="text-sm text-white/60">Aucune activité ce jour-là</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Analyse temporelle</p>
        <div className="mt-2 space-y-1 text-sm text-white/80">
          {timeMachine.length > 0 && (
            <>
              <p>
                • Il y a un an (365j): {timeMachine[timeMachine.length - 1]?.good || 0} bonnes actions,{' '}
                {timeMachine[timeMachine.length - 1]?.bad || 0} mauvaises
              </p>
              <p>
                • Il y a 30 jours: {timeMachine[0]?.good || 0} bonnes actions,{' '}
                {timeMachine[0]?.bad || 0} mauvaises
              </p>
              {timeMachine[0] && timeMachine[timeMachine.length - 1] && (
                <p className="mt-2 pt-2 border-t border-white/10">
                  {timeMachine[0].good > timeMachine[timeMachine.length - 1].good
                    ? '📈 Progression positive sur l\'année!'
                    : '💪 Continue tes efforts, la progression prend du temps'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
