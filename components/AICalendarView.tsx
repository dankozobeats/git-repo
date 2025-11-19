'use client'

import { useState, useMemo } from "react"

export default function AICalendarView({ reports }: { reports: any[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Regrouper les rapports par date
  const byDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    reports.forEach(r => {
      const key = r.created_at.split("T")[0]
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return map
  }, [reports])

  // Config du calendrier
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Nombre de jours du mois
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Premier jour du mois (pour le placement dans la grille)
  const firstDay = new Date(year, month, 1).getDay()
  const shift = firstDay === 0 ? 6 : firstDay - 1 // 0=Dimanche

  const calendarCells = []

  // Espaces vides avant le 1er
  for (let i = 0; i < shift; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="p-2" />)
  }

  // Jours du mois
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const key = date.toISOString().split("T")[0]
    const active = byDate[key]?.length > 0

    calendarCells.push(
      <div
        key={key}
        onClick={() => setSelectedDate(key)}
        className={`p-2 text-center text-sm rounded cursor-pointer border 
          ${active ? "bg-blue-700 border-blue-500" : "bg-gray-800 border-gray-700"}
        `}
      >
        {d}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Vue Calendrier</h2>

      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div
            key={d}
            className="text-center text-gray-400 text-xs font-medium"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grille du mois */}
      <div className="grid grid-cols-7 gap-2">
        {calendarCells}
      </div>

      {/* Résumé de la date sélectionnée */}
      {selectedDate && (
        <div className="mt-4 border-t border-gray-700 pt-4">
          <h3 className="font-bold mb-2">{selectedDate}</h3>

          {(byDate[selectedDate] ?? []).map((r) => (
            <pre
              key={r.id}
              className="whitespace-pre-wrap text-sm bg-gray-800 p-3 rounded mb-3"
            >
              {r.report}
            </pre>
          ))}

          {(byDate[selectedDate]?.length ?? 0) === 0 && (
            <p className="text-gray-500 text-sm">Aucun rapport ce jour.</p>
          )}
        </div>
      )}
    </div>
  )
}
