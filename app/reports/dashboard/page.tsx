'use client'

// Dashboard IA regroupant plusieurs widgets analytiques basés sur les rapports archivés.

import Link from "next/link"
import { ArrowLeft, BarChart3, LibraryBig } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

import AIDisciplineScore from "@/components/AIScoreCard"
import AIHeatmap from "@/components/AIHeatmap"
import AICalendarView from "@/components/AICalendarView"
import GraphAIStats from "@/components/GraphAIStats"

interface AIReport {
  created_at: string
  stats?: {
    goodLogs?: number
    badLogs?: number
    currentStreak?: number
    discipline_score?: number
  }
  [key: string]: unknown
}

export default function DashboardPage() {
  const [reports, setReports] = useState<AIReport[]>([])

  // Charge tous les rapports pour alimenter chaque widget.
  const loadReports = useCallback(async () => {
    const res = await fetch("/api/ai-reports")
    const data = await res.json()
    // setState inside timeout to avoid synchronous setState in effect
    setTimeout(() => setReports(data.reports || []), 0)
  }, [])

  // Récupère la liste dès que la page se monte.
  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Mise en page : entête minimal et empilement des composants analytiques.
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* HEADER */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">

          <Link href="/report" className="flex items-center gap-2 text-gray-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>

          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-500" />
            Dashboard IA
          </h1>

          <Link
            href="/reports/history"
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm flex items-center gap-2"
          >
            <LibraryBig className="w-4 h-4" />
            Historique
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">

        {/* SCORE */}
        <AIDisciplineScore reports={reports} />

        {/* HEATMAP */}
        <AIHeatmap reports={reports} />

        {/* CALENDRIER */}
        <AICalendarView reports={reports} />

        {/* GRAPHIQUES */}
        <GraphAIStats reports={reports} />

      </div>
    </main>
  )
}
