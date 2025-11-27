'use client'

// Heatmap façon GitHub basée sur les validations cumulées par rapport IA.

import { useMemo } from "react"

export default function AIHeatmap({ reports }: { reports: any[] }) {
  // Transforme les rapports en map date -> volume de bonnes actions pour un rendu rapide.
  const activity = useMemo(() => {
    const map: Record<string, number> = {}
    reports.forEach(r => {
      const date = r.created_at.split("T")[0]
      const value = r.stats?.goodLogs ?? 0
      map[date] = (map[date] ?? 0) + value
    })
    return map
  }, [reports])

  const today = new Date()
  // Génère 180 jours glissants pour que la grille soit toujours remplie.
  const days = [...Array(180)].map((_, i) => {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const key = d.toISOString().split("T")[0]
    return {
      date: key,
      value: activity[key] ?? 0
    }
  }).reverse()

  function getColor(v: number) {
    if (v === 0) return "bg-gray-800"
    if (v < 2) return "bg-green-900"
    if (v < 5) return "bg-green-700"
    if (v < 10) return "bg-green-500"
    return "bg-green-300"
  }

  // Carte simple contenant le titre et la grille.
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Heatmap (type GitHub)</h2>

      <div className="grid grid-cols-30 gap-1">
        {days.map(d => (
          <div
            key={d.date}
            className={`w-3 h-3 rounded ${getColor(d.value)}`}
            title={`${d.date} : ${d.value} validations`}
          />
        ))}
      </div>
    </div>
  )
}
