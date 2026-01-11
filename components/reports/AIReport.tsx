'use client'

/**
 * Rapport IA Augmenté
 * Insights personnalisés générés par Claude
 */

import { useAIInsights } from '@/lib/habits/useAIInsights'
import { Sparkles, Brain, Target, TrendingUp, Lightbulb, Zap, AlertTriangle, Info } from 'lucide-react'
import { useEffect } from 'react'

export function AIReport() {
  const { data, isLoading, error, generateInsights } = useAIInsights()

  useEffect(() => {
    // Générer les insights au chargement
    generateInsights()
  }, [generateInsights])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-purple-500" />
          <Sparkles className="absolute inset-0 m-auto h-8 w-8 animate-pulse text-purple-400" />
        </div>
        <p className="text-lg font-semibold text-white">Analyse IA en cours...</p>
        <p className="mt-2 text-sm text-white/60">Claude analyse vos données</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <p className="text-lg font-semibold text-red-300">Erreur lors de la génération</p>
        <p className="mt-2 text-sm text-red-300/70">{error}</p>
        <button
          onClick={generateInsights}
          className="mt-4 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!data) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-300' }
      case 'medium':
        return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-300' }
      case 'low':
        return { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-300' }
      default:
        return { border: 'border-white/20', bg: 'bg-white/5', text: 'text-white' }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pattern':
        return Brain
      case 'trigger':
        return Zap
      case 'motivation':
        return Target
      case 'progress':
        return TrendingUp
      default:
        return Info
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Rapport IA Augmenté</h1>
          </div>
          <p className="mt-1 text-sm text-white/60">Insights personnalisés par Claude</p>
        </div>

        <button
          onClick={generateInsights}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          Régénérer
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-500/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Résumé de Situation</h2>
        </div>
        <p className="text-lg leading-relaxed text-white/90">{data.summary}</p>
      </div>

      {/* Deep Insights */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
        <div className="mb-6 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Insights Profonds</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {data.deepInsights.map((insight, idx) => {
            const colors = getSeverityColor(insight.severity)
            const Icon = getCategoryIcon(insight.category)

            return (
              <div
                key={idx}
                className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                    <h3 className="font-semibold text-white">{insight.title}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${colors.text}`}
                  >
                    {insight.severity}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/80">{insight.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
        <div className="mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Recommandations Actionnables</h2>
        </div>

        <div className="space-y-4">
          {data.recommendations.map((rec, idx) => {
            const priorityColors = {
              high: 'border-emerald-500/30 bg-emerald-500/10',
              medium: 'border-blue-500/30 bg-blue-500/10',
              low: 'border-gray-500/30 bg-gray-500/10',
            }

            return (
              <div
                key={idx}
                className={`rounded-2xl border ${priorityColors[rec.priority]} p-5`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase text-emerald-300">
                    {rec.priority}
                  </span>
                </div>

                <p className="mb-3 text-sm text-white/70">{rec.description}</p>

                <div className="mb-3 rounded-lg bg-white/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Action concrète
                  </p>
                  <p className="mt-1 font-semibold text-white">{rec.action}</p>
                </div>

                <p className="text-xs text-white/60">
                  <span className="font-semibold">Impact attendu:</span> {rec.estimatedImpact}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Predictions */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Prédictions</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-300/70">
              Dans 30 jours
            </p>
            <p className="text-sm leading-relaxed text-white">{data.predictions.in30Days}</p>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-300/70">
              Dans 60 jours
            </p>
            <p className="text-sm leading-relaxed text-white">{data.predictions.in60Days}</p>
          </div>

          <div className="rounded-2xl border border-pink-500/30 bg-pink-500/10 p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-pink-300/70">
              Dans 90 jours
            </p>
            <p className="text-sm leading-relaxed text-white">{data.predictions.in90Days}</p>
          </div>
        </div>
      </div>

      {/* What-If Scenarios */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
        <div className="mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Scénarios "What-If"</h2>
        </div>

        <div className="space-y-3">
          {data.whatIf.map((scenario, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <p className="font-semibold text-white">{scenario.scenario}</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 w-24 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${scenario.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white/60">{scenario.confidence}%</span>
                </div>
              </div>
              <p className="text-sm text-white/80">{scenario.outcome}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-8 text-center">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <p className="text-xl font-semibold leading-relaxed text-white">
          {data.motivationalMessage}
        </p>
      </div>
    </div>
  )
}
