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

  const riskPercent = Math.round((coachData?.risk_score ?? 0) * 100)
  const { riskTextClass, riskBarClass } = getRiskClasses(riskPercent)

  return (
    <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0F111D] to-[#07080D] p-6 space-y-5 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#FFB347]" /> Coach IA local
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">Besoin d&apos;un coup de boost ?</h3>
          <p className="text-white/60 text-sm">Analyse personnalisée basée sur tes logs.</p>
        </div>
        <button
          onClick={fetchCoachMessage}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      <div className="bg-black/30 rounded-2xl border border-white/10 p-5 min-h-[220px] relative">
        <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
          <MessageSquare className="w-4 h-4 text-[#4DA6FF]" />
          Debrief du coach
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#4DA6FF]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Génération en cours...</span>
            </div>
            <p className="text-xs text-white/50">
              Le premier appel peut prendre jusqu&apos;à 90 secondes si le modèle n&apos;est pas en mémoire.
            </p>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : coachData ? (
          <CoachOutput coachData={coachData} riskPercent={riskPercent} />
        ) : (
          <p className="text-white/60 text-sm">
            Clique sur Refresh pour générer un conseil personnalisé.
          </p>
        )}

        {lastUpdated && (
          <p className="text-xs text-white/40 mt-4">
            MAJ : {new Date(lastUpdated).toLocaleTimeString('fr-FR')}
          </p>
        )}

        <button
          onClick={fetchCoachMessage}
          disabled={isLoading}
          className="absolute -bottom-3 right-4 bg-[#FF4D4D] hover:bg-[#e04343] text-white px-4 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-xl shadow-[#FF4D4D]/30 disabled:opacity-50"
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
        <CoachCard title="Résumé">{coachData.summary}</CoachCard>
        <CoachCard title="Analyse">{coachData.analysis}</CoachCard>
      </div>

      <CoachCard title="Patterns">{coachData.patterns}</CoachCard>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-black/30 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>Indice de risque</span>
            <span className={`font-semibold ${riskTextClass}`}>
              {riskPercent}%
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${riskBarClass}`}
              style={{ width: `${riskPercent}%` }}
            />
          </div>
          <p className="text-xs text-white/50 mt-2">
            0% = serein, 100% = risque élevé de rechute.
          </p>
        </div>
        <CoachCard title="Conseil actionnable">{coachData.advice}</CoachCard>
      </div>
    </div>
  )
}

function CoachCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white/80">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-2">{title}</p>
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
  return { riskTextClass: 'text-emerald-400', riskBarClass: 'bg-emerald-500' }
}
