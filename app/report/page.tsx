'use client'

// Premium client page to trigger and display the Gemini-powered report with a Linear-inspired experience.

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Bot } from 'lucide-react'

import AIReportContent from '@/components/AIReportContent'
import InlineError from '@/components/InlineError'
import ReportEmptyState from '@/components/ReportEmptyState'
import ReportLoadingSkeleton from '@/components/ReportLoadingSkeleton'
import ReportPeriodSelector, { ReportPeriod } from '@/components/ReportPeriodSelector'
import ReportStatsSummary, { ReportStats } from '@/components/ReportStatsSummary'

export default function ReportPage() {
  const [period, setPeriod] = useState<ReportPeriod>('30j')
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })

      if (!response.ok) {
        throw new Error('Erreur serveur')
      }

      const data = await response.json()
      setReport(data.report ?? null)
      setStats(data.stats ?? null)
    } catch (err) {
      console.error(err)
      setError('Impossible de générer le rapport pour le moment. Réessaie dans quelques secondes.')
      setStats(null)
    } finally {
      setIsLoading(false)
    }
  }, [period])

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
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Période d&apos;analyse</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{selectedLabel}</h2>
              <p className="mt-2 text-sm text-white/60">Choisis l&apos;horizon qui fait sens puis lance Gemini.</p>
            </div>
            <button
              type="button"
              onClick={generateReport}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-[32px] bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-[0_15px_40px_rgba(14,165,233,0.35)] transition hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Génération en cours...' : 'Générer le rapport'}
            </button>
          </div>

          <div className="mt-8 space-y-6">
            <ReportPeriodSelector period={period} onChange={handlePeriodChange} loading={isLoading} />
            {error && <InlineError message={error} onRetry={generateReport} />}
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
