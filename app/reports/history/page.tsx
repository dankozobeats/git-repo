'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Trash2,
  Archive,
  ArrowLeft,
  LibraryBig,
  ArrowUpDown,
  GitCompare,
  BarChart3
} from "lucide-react"

import GraphAIStats from "@/components/GraphAIStats"
import AIDisciplineScore from "@/components/AIScoreCard"
import AIHeatmap from "@/components/AIHeatmap"
import AICalendarView from "@/components/AICalendarView"

export default function HistoryPage() {
  const [reports, setReports] = useState<any[]>([])
  const [filter, setFilter] = useState("all")
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  async function loadReports() {
    const res = await fetch("/api/ai-reports")
    const data = await res.json()

    let items = data.reports || []

    if (filter !== "all") {
      const days = Number(filter)
      const minDate = new Date()
      minDate.setDate(minDate.getDate() - days)
      items = items.filter((r: any) => new Date(r.created_at) >= minDate)
    }

    items.sort((a: any, b: any) =>
      sortAsc
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    setReports(items)
  }

  useEffect(() => {
    loadReports()
  }, [filter, sortAsc])

  async function deleteReport(id: string) {
    if (!confirm("Supprimer ce rapport ?")) return
    await fetch(`/api/ai-reports/${id}`, { method: "DELETE" })
    loadReports()
  }

  async function archiveReport(id: string) {
    await fetch(`/api/ai-reports/${id}/archive`, { method: "PATCH" })
    loadReports()
  }

  function compareSelected() {
    if (selected.length !== 2)
      return alert("Sélectionne exactement 2 rapports.")
    const [id1, id2] = selected
    window.location.href = `/reports/compare?id1=${id1}&id2=${id2}`
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* HEADER */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/report" className="flex items-center gap-2 text-gray-300 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Retour
          </Link>

          <h1 className="text-xl font-bold flex items-center gap-2">
            <LibraryBig className="w-6 h-6 text-blue-500" />
            Historique des rapports IA
          </h1>

          <Link
            href="/reports/dashboard"
            className="px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded text-sm flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard IA
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">

        {/* Scores & Graphiques */}
        <AIDisciplineScore reports={reports} />
        <AIHeatmap reports={reports} />
        <AICalendarView reports={reports} />

        {/* FILTRES */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Tous", value: "all" },
            { label: "7 jours", value: "7" },
            { label: "30 jours", value: "30" },
            { label: "90 jours", value: "90" },
          ].map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === btn.value ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {btn.label}
            </button>
          ))}

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-4 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 flex items-center gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortAsc ? "Plus anciens" : "Plus récents"}
          </button>
        </div>

        <GraphAIStats reports={reports} />

        {selected.length >= 2 && (
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg flex items-center gap-4">
            <GitCompare className="w-5 h-5 text-purple-400" />
            <div className="text-sm">
              <strong>{selected.length}</strong> rapports sélectionnés
            </div>
            <button
              onClick={compareSelected}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
            >
              Comparer
            </button>
          </div>
        )}

        <div className="space-y-4">
          {reports.map(r => (
            <div
              key={r.id}
              id={`report-${r.id}`}
              className="border border-gray-800 bg-gray-900 rounded-lg p-4 relative"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString("fr-FR")}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => archiveReport(r.id)} className="text-gray-400 hover:text-white">
                    <Archive className="w-4 h-4" />
                  </button>

                  <button onClick={() => deleteReport(r.id)} className="text-red-500 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <pre className="whitespace-pre-wrap text-sm">
                {r.report}
              </pre>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() =>
                    setSelected(sel =>
                      sel.includes(r.id)
                        ? sel.filter(x => x !== r.id)
                        : [...sel, r.id]
                    )
                  }
                />
                <span className="text-xs text-gray-400">Sélectionner pour comparaison</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
