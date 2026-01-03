'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, GitCompare } from 'lucide-react'

type ReportPayload = {
  id: string
  report: string
  created_at?: string
  [key: string]: any
}

type AnalysisPayload = {
  summary?: string
  common?: string
  differences?: string
  score?: number
  advice?: string
  error?: boolean
}

type DiffLine = { text: string; type: 'same' | 'add' | 'del' }

function diffText(a?: string, b?: string): DiffLine[] {
  if (!a || !b) return []
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const diff: DiffLine[] = []
  const max = Math.max(aLines.length, bLines.length)

  for (let i = 0; i < max; i++) {
    const A = aLines[i] || ''
    const B = bLines[i] || ''

    if (A === B) diff.push({ text: A, type: 'same' })
    else {
      if (A) diff.push({ text: A, type: 'del' })
      if (B) diff.push({ text: B, type: 'add' })
    }
  }

  return diff
}

export default function CompareContent() {
  const searchParams = useSearchParams()
  const id1 = searchParams.get('id1')
  const id2 = searchParams.get('id2')
  const [report1, setReport1] = useState<ReportPayload | null>(null)
  const [report2, setReport2] = useState<ReportPayload | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null)
  const [reportsLoading, setReportsLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [reportsError, setReportsError] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    if (!id1 || !id2) return

    let active = true
    async function loadReports() {
      setReportsLoading(true)
      setReportsError(null)
      try {
        const [r1Res, r2Res] = await Promise.all([
          fetch(`/api/ai-reports/${id1}`),
          fetch(`/api/ai-reports/${id2}`),
        ])

        if (!r1Res.ok || !r2Res.ok) {
          throw new Error('Impossible de charger les rapports sélectionnés.')
        }

        const [r1, r2] = await Promise.all([r1Res.json(), r2Res.json()])
        if (!active) return
        setReport1(r1)
        setReport2(r2)
      } catch (err: any) {
        if (!active) return
        setReportsError(err?.message || 'Erreur inconnue.')
        setReport1(null)
        setReport2(null)
      } finally {
        if (active) setReportsLoading(false)
      }
    }

    loadReports()
    return () => {
      active = false
    }
  }, [id1, id2])

  useEffect(() => {
    if (!id1 || !id2 || !report1 || !report2) return

    let active = true
    async function loadAnalysis() {
      setAnalysisLoading(true)
      setAnalysis(null)
      setAnalysisError(null)
      try {
        const params: Record<string, string> = {};
        if (id1) params.id1 = id1;
        if (id2) params.id2 = id2;
        const query = new URLSearchParams(params)
        const response = await fetch(`/api/ai-reports/compare?${query.toString()}`)
        if (!response.ok) {
          throw new Error("Impossible d'analyser la comparaison via l'IA.")
        }
        const payload = await response.json()
        if (!active) return
        setAnalysis(payload)
      } catch (err: any) {
        if (!active) return
        setAnalysisError(err?.message || 'Erreur inconnue.')
        setAnalysis(null)
      } finally {
        if (active) setAnalysisLoading(false)
      }
    }

    loadAnalysis()
    return () => {
      active = false
    }
  }, [id1, id2, report1, report2])

  const diff = useMemo(() => diffText(report1?.report, report2?.report), [report1?.report, report2?.report])

  if (!id1 || !id2) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <p className="text-xl font-semibold mb-3">ID manquant</p>
          <p className="text-gray-400 mb-4">Merci de sélectionner deux rapports depuis l&apos;historique.</p>
          <Link href="/reports/history" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-200 hover:border-white/30">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;historique
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/reports/history" className="flex items-center gap-2 text-gray-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>

          <h1 className="text-xl font-bold flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-purple-400" />
            Comparateur IA
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="rounded-lg border border-gray-800 bg-gray-900/70 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-2">Chargement des rapports</h2>
          {reportsLoading && <p className="text-sm text-gray-400">Récupération des rapports sélectionnés...</p>}
          {reportsError && <p className="text-sm text-red-400">{reportsError}</p>}
          {!reportsLoading && !reportsError && (
            <p className="text-sm text-gray-400">
              Comparaison des rapports #{id1} et #{id2}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-gray-800 bg-gray-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Analyse IA</h2>
            {analysisLoading && <span className="text-xs uppercase tracking-wide text-gray-400">Analyse en cours...</span>}
          </div>
          {analysisError && (
            <p className="text-sm text-red-400">
              {analysisError}
            </p>
          )}
          {analysis && (
            <div className="space-y-4">
              <div className="text-gray-300 whitespace-pre-wrap">{analysis.summary}</div>

              <div>
                <h3 className="font-semibold text-green-400">Points communs</h3>
                <p className="text-gray-300">{analysis.common}</p>
              </div>

              <div>
                <h3 className="font-semibold text-red-400">Différences</h3>
                <p className="text-gray-300">{analysis.differences}</p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-400">Score de similarité</h3>
                <p className="text-2xl font-bold">{analysis.score ?? '—'}/100</p>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-400">Conseils</h3>
                <p className="text-gray-300">{analysis.advice}</p>
              </div>
            </div>
          )}
          {!analysisLoading && !analysis && !analysisError && (
            <p className="text-sm text-gray-400">Analyse indisponible pour le moment.</p>
          )}
        </section>

        <section className="rounded-lg border border-gray-800 bg-gray-900/70 p-6">
          <h2 className="text-xl font-semibold mb-4">Diff (GitHub style)</h2>
          {!diff.length && (
            <p className="text-sm text-gray-400">Chargement des rapports pour afficher les différences...</p>
          )}
          {diff.length > 0 && (
            <pre className="whitespace-pre-wrap text-sm space-y-1">
              {diff.map((line, idx) => {
                if (line.type === 'same') {
                  return (
                    <div key={idx} className="text-gray-300">
                      {line.text}
                    </div>
                  )
                }
                if (line.type === 'add') {
                  return (
                    <div key={idx} className="text-green-400">
                      + {line.text}
                    </div>
                  )
                }
                return (
                  <div key={idx} className="text-red-400">
                    - {line.text}
                  </div>
                )
              })}
            </pre>
          )}
        </section>
      </div>
    </main>
  )
}
