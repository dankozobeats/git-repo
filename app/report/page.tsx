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
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6">
  <div className="border-b border-gray-800 bg-gray-900">
  <div className="max-w-5xl mx-auto px-4 py-4 md:py-6">

    <div className="flex items-center justify-between">
      
      {/* ----- GAUCHE : Retour + Titre ----- */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            Rapport IA
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Analyse de tes habitudes par Gemini
          </p>
        </div>
      </div>

      {/* ----- DROITE : Bouton Historique IA ----- */}
      <Link
        href="/reports/history"
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
      >
        {/* Icon custom de ton choix, ici BarChart3 */}
        <BarChart3 className="w-4 h-4" />
        Historique IA
      </Link>

    </div>

  </div>
</div>

        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Période d'analyse</h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-3 gap-3">
              {(['7j', '30j', '90j'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  disabled={isLoading}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Générer le rapport
                </>
              )}
            </button>
          </div>

          {stats && (
            <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Good Habits</div>
                <div className="text-xl font-bold text-green-400">{stats.goodHabits}</div>
              </div>
              <div>
                <div className="text-gray-400">Bad Habits</div>
                <div className="text-xl font-bold text-red-400">{stats.badHabits}</div>
              </div>
              <div>
                <div className="text-gray-400">Validations</div>
                <div className="text-xl font-bold text-blue-400">{stats.goodLogs}</div>
              </div>
              <div>
                <div className="text-gray-400">Craquages</div>
                <div className="text-xl font-bold text-orange-400">{stats.badLogs}</div>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-400">Gemini analyse tes données...</p>
          </div>
        )}

        {report && !isLoading && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 md:p-8">
            <div className="prose prose-invert max-w-none whitespace-pre-wrap">
              {report}
            </div>
          </div>
        )}

        {!report && !isLoading && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-2">Aucun rapport généré</p>
            <p className="text-sm text-gray-500">Sélectionne une période et clique sur "Générer le rapport"</p>
          </div>
        )}
      </div>
    </main>
  )
}
