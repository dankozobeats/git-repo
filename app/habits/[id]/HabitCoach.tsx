'use client'

import { useState, type ReactNode } from 'react'
import { Brain, MessageSquare, Loader2, RotateCcw, Wand2 } from 'lucide-react'
import type {
  CoachFocus,
  CoachResult,
  CoachStatsPayload,
  CoachTone,
} from '@/types/coach'

type HabitCoachProps = {
  habitId: string
  stats: CoachStatsPayload
}

const toneOptions: Array<{
  id: CoachTone
  label: string
  description: string
}> = [
  { id: 'gentle', label: 'Bienveillant', description: 'Coach empathique' },
  { id: 'balanced', label: 'Motivant', description: 'Equilibre' },
  { id: 'direct', label: 'Cash', description: 'Direct' },
]

const focusOptions: Array<{
  id: CoachFocus
  label: string
  description: string
}> = [
  { id: 'mindset', label: 'Mindset', description: 'Motivation' },
  { id: 'strategy', label: 'Plan', description: 'Actions' },
  { id: 'celebration', label: 'Celebration', description: 'Wins' },
]

type CoachApiResponse = {
  result?: CoachResult
  timestamp?: string
  error?: string
}

export default function HabitCoach({ habitId, stats }: HabitCoachProps) {
  const [tone, setTone] = useState<CoachTone>('balanced')
  const [focus, setFocus] = useState<CoachFocus>('mindset')
  const [coachData, setCoachData] = useState<CoachResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // -------------------------------------------------------
  // FIX PRINCIPAL : Protection contre habitId null/undefined
  // -------------------------------------------------------
  async function fetchCoachMessage() {
    if (!habitId || habitId.trim().length === 0) {
      setError("ID d'habitude invalide")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, tone, focus, stats }),
      })

      const payload: CoachApiResponse | null = await res.json().catch(() => null)

      if (!res.ok || !payload) {
        const errorMsg = payload?.error || `Erreur API (${res.status})`
        const details = (payload as any)?.details
        throw new Error(details ? `${errorMsg}: ${details}` : errorMsg)
      }

      if (!payload.result) {
        throw new Error('Reponse IA incomplete')
      }

      setCoachData(payload.result)
      setLastUpdated(payload.timestamp || new Date().toISOString())
    } catch (err) {
      console.error('coach:error', err)
      setCoachData(null)
      setError(err instanceof Error ? err.message : 'Erreur API')
    } finally {
      setIsLoading(false)
    }
  }

  // ----------------------------------------------------------------------
  // Pas d'appel automatique - l'utilisateur doit cliquer sur un bouton
  // ----------------------------------------------------------------------
  // L'appel API se fait uniquement quand l'utilisateur clique sur "Refresh" ou "Nouvelle punchline"

  const riskPercent = Math.round((coachData?.risk_score ?? 0) * 100)
  const { riskTextClass, riskBarClass } = getRiskClasses(riskPercent)

  return (
    <section className="bg-gray-900 rounded-lg border border-gray-800 p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" /> Coach IA local
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">
            Besoin d un coup de boost ?
          </h3>
          <p className="text-gray-400 text-sm">
            Analyse personnalisee basee sur tes logs.
          </p>
        </div>
        <button
          onClick={fetchCoachMessage}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      <div className="bg-gray-800/60 rounded-2xl border border-gray-700 p-5 min-h-[220px] relative">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          Debrief du coach
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-blue-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Génération en cours...</span>
            </div>
            <p className="text-xs text-gray-500">
              Le premier appel peut prendre jusqu'à 90 secondes si le modèle n'est pas en mémoire.
            </p>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : coachData ? (
          <CoachOutput coachData={coachData} riskPercent={riskPercent} />
        ) : (
          <p className="text-gray-400 text-sm">
            Clique sur Refresh pour generer un conseil personnalise.
          </p>
        )}

        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-4">
            MAJ : {new Date(lastUpdated).toLocaleTimeString('fr-FR')}
          </p>
        )}

        <button
          onClick={fetchCoachMessage}
          disabled={isLoading}
          className="absolute -bottom-3 right-4 bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
          <Wand2 className="w-4 h-4" />
          Nouvelle punchline
        </button>
      </div>
    </section>
  )
}

function CoachOutput({
  coachData,
  riskPercent,
}: {
  coachData: CoachResult
  riskPercent: number
}) {
  const { riskTextClass, riskBarClass } = getRiskClasses(riskPercent)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CoachCard title="Resume">{coachData.summary}</CoachCard>
        <CoachCard title="Analyse">{coachData.analysis}</CoachCard>
      </div>

      <CoachCard title="Patterns">{coachData.patterns}</CoachCard>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Indice de risque</span>
            <span className={`font-semibold ${riskTextClass}`}>
              {riskPercent}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${riskBarClass}`}
              style={{ width: `${riskPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            0% = serein, 100% = risque eleve de rechute.
          </p>
        </div>
        <CoachCard title="Conseil actionnable">{coachData.advice}</CoachCard>
      </div>
    </div>
  )
}

function CoachCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-gray-900/40 border border-gray-700 rounded-xl p-4 text-sm text-gray-200">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
        {title}
      </p>
      <p className="whitespace-pre-line leading-relaxed">{children}</p>
    </div>
  )
}

function getRiskClasses(value: number) {
  if (value >= 66) {
    return { riskTextClass: 'text-red-400', riskBarClass: 'bg-red-500' }
  }
  if (value >= 33) {
    return { riskTextClass: 'text-yellow-400', riskBarClass: 'bg-yellow-500' }
  }
  return { riskTextClass: 'text-green-400', riskBarClass: 'bg-green-500' }
}
