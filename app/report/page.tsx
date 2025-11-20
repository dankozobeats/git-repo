'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, Loader2, ArrowLeft } from 'lucide-react'

export default function ReportPage() {
  const [period, setPeriod] = useState<'7j' | '30j' | '90j'>('30j')
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  async function generateReport() {
    setIsLoading(true)
    setReport(null)
    
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })

      if (!res.ok) throw new Error('Erreur')

      const data = await res.json()
      setReport(data.report)
      setStats(data.stats)
    } catch (error) {
      alert('Erreur lors de la génération du rapport')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0]">
      <header className="border-b border-white/5 bg-gradient-to-r from-[#1E1E1E] via-[#0F0F0F] to-[#1A1A1A]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/40">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Rapport IA</p>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
                <BarChart3 className="h-7 w-7 text-[#FF4D4D]" /> BadHabit Intelligence
              </h1>
              <p className="text-sm text-white/60">Analyse générée par Gemini (IA) sur la période sélectionnée</p>
            </div>
          </div>
          <Link
            href="/reports/history"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
          >
            <BarChart3 className="h-4 w-4" /> Historique IA
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <section className="rounded-3xl border border-white/5 bg-[#1B1B24] p-6 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Période d'analyse</p>
              <h2 className="text-2xl font-bold text-white">Sélectionne ton intervalle</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
              {period === '7j' && 'Semaine'}
              {period === '30j' && '30 jours'}
              {period === '90j' && '90 jours'}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1 grid grid-cols-3 gap-3">
              {(['7j', '30j', '90j'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  disabled={isLoading}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    period === p
                      ? 'border-[#FF4D4D] bg-[#FF4D4D]/10 text-white shadow-[0_0_20px_rgba(255,77,77,0.2)]'
                      : 'border-white/10 bg-black/20 text-white/60 hover:border-white/30'
                  } disabled:opacity-50`}
                >
                  {p === '7j' && '7 jours'}
                  {p === '30j' && '30 jours'}
                  {p === '90j' && '90 jours'}
                </button>
              ))}
            </div>

            <button
              onClick={generateReport}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF4D4D] px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-[#FF4D4D]/30 transition hover:bg-[#e04343] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5" />
                  Générer le rapport
                </>
              )}
            </button>
          </div>

          {stats && (
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-sm md:grid-cols-4">
              {[
                { label: 'Good habits', value: stats.goodHabits, color: 'text-[#4DA6FF]' },
                { label: 'Bad habits', value: stats.badHabits, color: 'text-[#FF4D4D]' },
                { label: 'Validations', value: stats.goodLogs, color: 'text-[#4DA6FF]' },
                { label: 'Craquages', value: stats.badLogs, color: 'text-[#FFB347]' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">{stat.label}</p>
                  <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {isLoading && (
          <section className="rounded-3xl border border-white/5 bg-[#0F0F13] p-12 text-center shadow-xl shadow-black/30">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#4DA6FF]" />
            <p className="text-white/70">Gemini analyse tes données...</p>
          </section>
        )}

        {report && !isLoading && (
          <section className="rounded-3xl border border-white/5 bg-[#0F0F13] p-6 md:p-8 shadow-xl shadow-black/30">
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {report}
            </div>
          </section>
        )}

        {!report && !isLoading && (
          <section className="rounded-3xl border border-white/5 bg-[#0F0F13] p-12 text-center text-white/70 shadow-xl shadow-black/30">
            <BarChart3 className="mx-auto mb-4 h-16 w-16 text-white/20" />
            <p className="mb-2 text-lg font-semibold">Aucun rapport généré</p>
            <p className="text-sm text-white/50">Sélectionne une période et clique sur « Générer le rapport »</p>
          </section>
        )}
      </div>
    </main>
  )
}
