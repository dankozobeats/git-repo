'use client'

// Premium client page to trigger and display the Gemini-powered report with a Linear-inspired experience.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Bot } from 'lucide-react'

import AIReportContent from '@/components/AIReportContent'
import InlineError from '@/components/InlineError'
import ReportEmptyState from '@/components/ReportEmptyState'
import ReportLoadingSkeleton from '@/components/ReportLoadingSkeleton'
import ReportPeriodSelector, { ReportPeriod } from '@/components/ReportPeriodSelector'
import ReportStatsSummary, { ReportStats } from '@/components/ReportStatsSummary'

const buildFallbackReport = (reason: string) =>
  `Voici une capsule perso pendant que l'IA se repose :\n- Rappelle-toi de célébrer les petites victoires.\n- Revois ton plan de récupération et identifie 2 actions immédiates.\n- Note ce qui a déclenché tes craquages pour t'en protéger.\n\n(${reason})`

export default function ReportPage() {
  const [period, setPeriod] = useState<ReportPeriod>('30j')
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const [fallbackReport, setFallbackReport] = useState<string | null>(null)
  const [autoRetryMessage, setAutoRetryMessage] = useState<string | null>(null)
  const retryTimerRef = useRef<number | null>(null)
  const autoRetryAttemptsRef = useRef(0)

  const selectedLabel = useMemo(() => {
    if (period === '7j') return 'Analyse hebdo'
    if (period === '90j') return 'Analyse trimestrielle'
    return 'Analyse mensuelle'
  }, [period])

  const handlePeriodChange = useCallback((next: ReportPeriod) => {
    setPeriod(next)
  }, [])

  const generateReport = useCallback(async () => {
    setIsLoading(true)
    setReport(null)
    setStats(null)
    setError(null)
    setErrorHint(null)
    setFallbackReport(null)
    setAutoRetryMessage(null)

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })

      const payload = (await response.json().catch(() => null)) as
        | ({ report?: string; stats?: ReportStats; error?: string; details?: string })
        | null

      const scheduleAutoRetry = () => {
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current)
          retryTimerRef.current = null
        }

        if (autoRetryAttemptsRef.current >= 1) {
          return
        }

        autoRetryAttemptsRef.current += 1
        setAutoRetryMessage('Nouvelle tentative automatique dans 4 secondes...')
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null
          generateReport()
        }, 4000)
      }

      const handleFailure = (reason: string, detail?: string) => {
        setIsLoading(false)
        setError(`Impossible de générer le rapport (${reason}).`)
        setErrorHint(detail ?? null)
        setFallbackReport(buildFallbackReport(reason))
        setStats(null)
        setReport(null)
        scheduleAutoRetry()
      }

      if (!response.ok) {
        handleFailure(payload?.error ?? 'Erreur serveur', payload?.details)
        return
      }

      setReport(payload?.report ?? null)
      setStats(payload?.stats ?? null)
      setFallbackReport(null)
      setAutoRetryMessage(null)
      autoRetryAttemptsRef.current = 0
    } catch (err) {
      console.error(err)
      const reason = err instanceof Error ? err.message : 'Erreur inattendue'
      setError(`Impossible de générer le rapport (${reason}).`)
      setErrorHint('Vérifie ta connexion ou la disponibilité du coach IA.')
      setFallbackReport(buildFallbackReport(reason))
      if (autoRetryAttemptsRef.current < 1) {
        autoRetryAttemptsRef.current += 1
        setAutoRetryMessage('Nouvelle tentative automatique dans 4 secondes...')
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null
          generateReport()
        }, 4000)
      }
      setStats(null)
      setReport(null)
    } finally {
      setIsLoading(false)
    }
  }, [period])

  const triggerGeneration = useCallback(() => {
    autoRetryAttemptsRef.current = 0
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    setAutoRetryMessage(null)
    setFallbackReport(null)
    generateReport()
  }, [generateReport])

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current)
      }
    }
  }, [])

  const showReport = Boolean(report && !isLoading)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020712] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),transparent_45%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_40%)]" />

      <header className="relative border-b border-white/5 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-2xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white/80 transition hover:border-white/40"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour dashboard
            </Link>
            <span className="text-white/40">/</span>
            <span>{selectedLabel}</span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Gemini Insight Suite</p>
              <h1 className="mt-3 flex items-center gap-3 text-4xl font-semibold">
                <span className="inline-flex items-center justify-center rounded-3xl bg-white/10 p-3">
                  <Bot className="h-6 w-6 text-white" />
                </span>
                Rapport IA
              </h1>
              <p className="mt-3 text-base text-white/70">
                Génère une synthèse stratégique sur tes habitudes, inspirée du style Linear/Superhuman.
              </p>
            </div>

            <Link
              href="/reports/history"
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/20"
            >
              <BarChart3 className="h-4 w-4" />
              Historique IA
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-4 py-10 space-y-8">
        <section className="rounded-[40px] border border-white/5 bg-white/[0.04] p-6 md:p-10 shadow-[0_30px_90px_rgba(2,7,18,0.7)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Période d'analyse</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{selectedLabel}</h2>
              <p className="mt-2 text-sm text-white/60">Choisis l'horizon qui fait sens puis lance l'IA.</p>
            </div>
            <button
              type="button"
              onClick={triggerGeneration}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-[32px] bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-[0_15px_40px_rgba(14,165,233,0.35)] transition hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Génération en cours...' : 'Générer le rapport'}
            </button>
          </div>

          <div className="mt-8 space-y-6">
            <ReportPeriodSelector period={period} onChange={handlePeriodChange} loading={isLoading} />
            {error && (
              <div className="space-y-2">
                <InlineError message={error} onRetry={triggerGeneration} />
                {errorHint && <p className="text-xs text-white/50">Détail : {errorHint}</p>}
              </div>
            )}
            {fallbackReport && (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/80">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Fallback IA</p>
                <pre className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{fallbackReport}</pre>
                {autoRetryMessage && <p className="mt-2 text-xs text-white/60">{autoRetryMessage}</p>}
              </div>
            )}
            <ReportStatsSummary stats={stats} />
          </div>
        </section>

        {isLoading && <ReportLoadingSkeleton />}
        {!isLoading && showReport && report && <AIReportContent report={report} />}
        {!isLoading && !report && <ReportEmptyState cta="Sélectionne une période puis lance le rapport" />}
      </div>
    </main>
  )
}
