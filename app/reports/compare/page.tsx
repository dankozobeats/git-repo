'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, GitCompare } from "lucide-react"
import { fetchAI } from "@/lib/ai/fetchAI"
import { useSearchParams } from "next/navigation"

function diffText(a: string, b: string) {
  const aLines = a.split("\n")
  const bLines = b.split("\n")

  const diff: { text: string; type: "same" | "add" | "del" }[] = []

  const max = Math.max(aLines.length, bLines.length)

  for (let i = 0; i < max; i++) {
    const A = aLines[i] || ""
    const B = bLines[i] || ""

    if (A === B) diff.push({ text: A, type: "same" })
    else {
      if (A) diff.push({ text: "- " + A, type: "del" })
      if (B) diff.push({ text: "+ " + B, type: "add" })
    }
  }

  return diff
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const id1 = searchParams.get("id1")
  const id2 = searchParams.get("id2")
  const [report1, setReport1] = useState<any>(null)
  const [report2, setReport2] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!id1 || !id2) return

    const r1 = await fetch(`/api/ai-reports/${id1}`).then(res => res.json())
    const r2 = await fetch(`/api/ai-reports/${id2}`).then(res => res.json())

    setReport1(r1)
    setReport2(r2)

    const prompt = `
Compare ces deux rapports IA.

Rapport A:
${r1.report}

Rapport B:
${r2.report}

Analyse attendue :
- Résumé synthétique (4 lignes)
- Points communs
- Différences clés
- Score de similarité 0-100
- Conseils pour progresser

Réponds en JSON strict :
{
  "summary": "...",
  "common": "...",
  "differences": "...",
  "score": 80,
  "advice": "..."
}
`

    const aiText = await fetchAI(prompt)

    try {
      const parsed = JSON.parse(
        aiText.replace(/```json/gi, "").replace(/```/g, "")
      )
      setAnalysis(parsed)
    } catch {
      setAnalysis({ summary: aiText, error: true })
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id1, id2])

  if (!id1 || !id2) {
    return (
      <div className="text-white p-10">
        ID manquant.  
        <Link className="underline" href="/reports/history">Retour</Link>
      </div>
    )
  }

  if (loading) return <div className="text-gray-300 p-10">Analyse IA en cours...</div>

  const diff = diffText(report1.report, report2.report)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* HEADER */}
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

        {/* ANALYSE IA */}
        {analysis && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Résumé IA</h2>

            <div className="text-gray-300">{analysis.summary}</div>

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
              <p className="text-2xl font-bold">{analysis.score}/100</p>
            </div>

            <div>
              <h3 className="font-semibold text-yellow-400">Conseils</h3>
              <p className="text-gray-300">{analysis.advice}</p>
            </div>
          </div>
        )}

        {/* DIFF */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Diff (GitHub style)</h2>

          <pre className="whitespace-pre-wrap text-sm">
            {diff.map((line, i) => {
              if (line.type === "same") return (
                <div key={i} className="text-gray-300">{line.text}</div>
              )
              if (line.type === "add") return (
                <div key={i} className="text-green-400">+ {line.text}</div>
              )
              return (
                <div key={i} className="text-red-400">- {line.text}</div>
              )
            })}
          </pre>
        </div>

      </div>
    </main>
  )
}
