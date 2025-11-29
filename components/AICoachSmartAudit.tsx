'use client'

// Audit SMART client : fournit des scores en temps réel et des conseils IA locaux.
import React from 'react'
import { useMemo } from 'react'
import { Brain, CheckCircle2, Clock4, Gauge, ListChecks, Target } from 'lucide-react'

type TrackingMode = 'binary' | 'counter'

type AICoachSmartAuditProps = {
  name: string
  description: string
  trackingMode: TrackingMode
  dailyGoalValue: number
  onImprove?: (payload: { name: string; description: string }) => void
}

type Criterion = {
  key: 'S' | 'M' | 'A' | 'R' | 'T'
  label: string
  description: string
  score: number
  icon: React.ReactNode
  accent: string
}

// Analyse heuristique locale : simule une évaluation IA sans appel réseau.
function evaluateSmart(
  name: string,
  description: string,
  trackingMode: TrackingMode,
  dailyGoalValue: number
) {
  const trimmedName = name.trim()
  const trimmedDescription = description.trim()
  const vaguePatterns = /(habitude|truc|chose|améliorer|mieux|faire mieux)/i

  const specificScore = Math.max(
    4,
    Math.min(20, Math.round((trimmedName.length / 14) * 20) - (vaguePatterns.test(trimmedName) ? 6 : 0))
  )
  const measurableScore =
    trackingMode === 'counter'
      ? Math.max(6, Math.min(20, 12 + Math.min(8, dailyGoalValue)))
      : 16
  const attainableScore =
    trackingMode === 'counter'
      ? Math.max(4, 20 - Math.max(0, dailyGoalValue - 10))
      : 18
  const relevantScore = Math.max(
    6,
    Math.min(20, Math.round((trimmedDescription.length / 60) * 20))
  )
  const temporalScore = trackingMode ? 18 : 6

  const suggestions: string[] = []
  if (specificScore < 15) suggestions.push('Ajoute un verbe d’action et un contexte temporel au nom.')
  if (measurableScore < 15) suggestions.push('Définis un volume clair (verres, minutes, tentatives).')
  if (attainableScore < 15) suggestions.push('Réduis l’objectif quotidien pour rester réaliste.')
  if (relevantScore < 15) suggestions.push('Explique pourquoi cette habitude soutient ton objectif global.')
  if (temporalScore < 15) suggestions.push('Précise quand tu veux accomplir cette action (matin, soir).')
  if (suggestions.length === 0) {
    suggestions.push("Tout est prêt. Passe à l'action dès aujourd'hui.")
  }

  return {
    specificScore,
    measurableScore,
    attainableScore,
    relevantScore,
    temporalScore,
    total:
      specificScore + measurableScore + attainableScore + relevantScore + temporalScore,
    suggestions,
  }
}

export default function AICoachSmartAudit({
  name,
  description,
  trackingMode,
  dailyGoalValue,
  onImprove,
}: AICoachSmartAuditProps) {
  const evaluation = useMemo(
    () => evaluateSmart(name, description, trackingMode, dailyGoalValue),
    [name, description, trackingMode, dailyGoalValue]
  )

  const criteria: Criterion[] = [
    {
      key: 'S',
      label: 'Spécifique',
      description: 'Nom clair et contextualisé.',
      score: evaluation.specificScore,
      accent: 'text-[#C084FC]',
      icon: <Target className="h-4 w-4 text-[#C084FC]" />,
    },
    {
      key: 'M',
      label: 'Mesurable',
      description: 'Comprends la quantité à atteindre.',
      score: evaluation.measurableScore,
      accent: 'text-[#60A5FA]',
      icon: <Gauge className="h-4 w-4 text-[#60A5FA]" />,
    },
    {
      key: 'A',
      label: 'Atteignable',
      description: 'Réaliste dans ton quotidien.',
      score: evaluation.attainableScore,
      accent: 'text-[#34D399]',
      icon: <CheckCircle2 className="h-4 w-4 text-[#34D399]" />,
    },
    {
      key: 'R',
      label: 'Pertinent',
      description: 'Aligné avec tes objectifs.',
      score: evaluation.relevantScore,
      accent: 'text-[#FBBF24]',
      icon: <ListChecks className="h-4 w-4 text-[#FBBF24]" />,
    },
    {
      key: 'T',
      label: 'Temporel',
      description: 'Fenêtre temporelle définie.',
      score: evaluation.temporalScore,
      accent: 'text-[#F472B6]',
      icon: <Clock4 className="h-4 w-4 text-[#F472B6]" />,
    },
  ]

  const handleImprove = () => {
    if (!onImprove) return
    const trimmedName = name.trim() || 'Nouvelle habitude'
    const improvedName = trimmedName.length < 12 ? `${trimmedName} quotidien` : trimmedName
    const improvedDescription =
      description.trim().length < 30
        ? `Chaque jour, ${trackingMode === 'counter' ? `complète ${dailyGoalValue || 1} ${trimmedName.toLowerCase()}` : `valide ${trimmedName.toLowerCase()} une fois`}, mesure tes progrès et note ton ressenti.`
        : description
    onImprove({ name: improvedName, description: improvedDescription })
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#1B0F2F]/60 p-5 text-white shadow-lg shadow-black/40 space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#C084FC] via-[#A855F7] to-[#7C3AED] shadow-[0_15px_35px_rgba(124,58,237,0.4)]">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">IA Coach</p>
            <h3 className="text-lg font-semibold">Audit SMART</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60">Score global</p>
          <p className="text-3xl font-bold text-white">{evaluation.total}/100</p>
        </div>
      </header>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        {criteria.map(criterion => (
          <div key={criterion.key} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2">
              {criterion.icon}
              <div>
                <p className={`text-sm font-semibold ${criterion.accent}`}>{criterion.label}</p>
                <p className="text-xs text-white/60">{criterion.description}</p>
              </div>
            </div>
            <span className="text-lg font-semibold text-white">{criterion.score}/20</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white/80">Suggestions IA</p>
        <ul className="space-y-2 text-sm text-white/70">
          {evaluation.suggestions.map(suggestion => (
            <li key={suggestion} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={handleImprove}
        className="w-full rounded-2xl border border-white/20 bg-gradient-to-r from-[#C084FC] via-[#A855F7] to-[#7C3AED] px-4 py-3 text-center text-sm font-semibold text-white transition hover:shadow-[0_12px_35px_rgba(124,58,237,0.35)]"
      >
        Auto-améliorer avec l’IA
      </button>
    </section>
  )
}
