'use client'

import { useTrackableInsights, Pattern, Insight } from '@/lib/trackables/useTrackableInsights'
import { TrendingUp, AlertTriangle, Target, Zap, Clock, MapPin, Flame } from 'lucide-react'

const SEVERITY_COLORS = {
  high: 'from-red-500 to-rose-500',
  medium: 'from-orange-500 to-yellow-500',
  low: 'from-blue-500 to-cyan-500',
}

const SEVERITY_ICONS = {
  high: Flame,
  medium: AlertTriangle,
  low: Zap,
}

const CATEGORY_COLORS = {
  success: 'from-green-500 to-emerald-500',
  warning: 'from-orange-500 to-red-500',
  opportunity: 'from-blue-500 to-purple-500',
  risk: 'from-red-500 to-rose-500',
}

const CATEGORY_ICONS = {
  success: TrendingUp,
  warning: AlertTriangle,
  opportunity: Target,
  risk: Flame,
}

const PATTERN_TYPE_ICONS = {
  temporal: Clock,
  context: MapPin,
  trigger: Zap,
  correlation: Target,
}

export default function InsightsPanel() {
  const { patterns, insights, isLoading } = useTrackableInsights(30)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-400">Analyse en cours...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Key Insights */}
      {insights.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">
            📊 Insights clés
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight, index) => {
              const Icon = CATEGORY_ICONS[insight.category]
              const gradient = CATEGORY_COLORS[insight.category]

              return (
                <div
                  key={index}
                  className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10 transition-all hover:bg-white/10"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}
                    >
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{insight.title}</h3>
                      {insight.metric && (
                        <div className="text-sm text-gray-400">{insight.metric}</div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{insight.description}</p>
                  {insight.action && (
                    <div className="mt-3 rounded-lg bg-white/5 p-3">
                      <div className="text-xs font-medium text-blue-400">
                        💡 Action recommandée
                      </div>
                      <div className="mt-1 text-sm text-gray-300">
                        {insight.action}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Detected Patterns */}
      {patterns.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">
            🔍 Patterns détectés
          </h2>
          <div className="space-y-3">
            {patterns
              .sort((a, b) => b.confidence - a.confidence)
              .map((pattern, index) => {
                const Icon = PATTERN_TYPE_ICONS[pattern.type]
                const SeverityIcon = SEVERITY_ICONS[pattern.severity]
                const gradient = SEVERITY_COLORS[pattern.severity]

                return (
                  <div
                    key={index}
                    className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}
                      >
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-bold text-white">{pattern.title}</h3>
                          <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">
                            <SeverityIcon size={12} />
                            {pattern.confidence}% confiance
                          </div>
                        </div>
                        <p className="text-sm text-gray-400">{pattern.description}</p>

                        {/* Pattern details */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pattern.data.stateName && (
                            <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-300">
                              📌 {pattern.data.stateName}
                            </span>
                          )}
                          {pattern.data.timeOfDay && (
                            <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-300">
                              🕐 {pattern.data.timeOfDay}
                            </span>
                          )}
                          {pattern.data.context && (
                            <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-300">
                              📍 {pattern.data.context}
                            </span>
                          )}
                          {pattern.data.trigger && (
                            <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gray-300">
                              ⚡ {pattern.data.trigger}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {patterns.length === 0 && insights.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h3 className="mb-2 text-xl font-bold text-white">
            Pas assez de données
          </h3>
          <p className="text-gray-400">
            Continue à tracker pour que je puisse détecter des patterns !
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Minimum 3 observations par état nécessaires
          </p>
        </div>
      )}
    </div>
  )
}
