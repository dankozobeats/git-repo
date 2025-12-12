'use client'

import { useState } from 'react'

type PatternAnalysisProps = {
  userId: string
}

export function PatternAnalysis({ userId }: PatternAnalysisProps) {
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  const analyzePatterns = async () => {
    setLoading(true)
    setAnalysis('')

    try {
      const response = await fetch('/api/ai/analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Erreur serveur')
      }

      const data = await response.json()
      setAnalysis(data.analysis || "Impossible d\'extraire l'analyse pour le moment.")
    } catch (error) {
      console.error('PatternAnalysis error', error)
      setAnalysis("Impossible d'analyser pour le moment. Réessaie dans quelques instants.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0b12] via-[#101124] to-[#0b0d16] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.65)]">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Analyse comportementale</p>
        <h2 className="text-2xl font-semibold text-white">🧠 Analyse de tes patterns</h2>
        <p className="text-sm text-white/70">
          Détecte les moments où tu craques le plus et reçois des conseils personnalisés.
        </p>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={analyzePatterns}
        className="inline-flex items-center justify-center rounded-3xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
      >
        {loading ? '🤔 Analyse en cours...' : '🧠 Analyser mes patterns'}
      </button>

      {analysis && (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/80">
          <div className="whitespace-pre-line text-sm leading-relaxed text-white/80">{analysis}</div>
        </div>
      )}
    </div>
  )
}
