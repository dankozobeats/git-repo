'use client'

// Composant client qui rend une vue calendrier mensuelle basée sur les rapports IA fournis.

import { useState, useMemo } from "react"

interface AIReport {
  created_at: string
  [key: string]: unknown
}

type AICalendarViewProps = {
  reports: AIReport[]
  onDayClick?: (date: string) => void
}

export default function AICalendarView({ reports, onDayClick }: AICalendarViewProps) {
  // Mémorise le jour sélectionné pour afficher un récapitulatif en bas du widget.
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Regroupe les rapports par date ISO (AAAA-MM-JJ) pour compter rapidement les entrées quotidiennes.
  const byDate = useMemo(() => {
    const map: Record<string, AIReport[]> = {}
    reports.forEach(r => {
      const key = r.created_at.split("T")[0]
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return map
  }, [reports])

  // Utilise la date actuelle comme base pour déterminer le mois affiché.
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // Calcule le nombre de jours de ce mois afin d'itérer sur chaque case.
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Récupère le premier jour de la semaine pour aligner les cases dans la grille.
  const firstDay = new Date(year, month, 1).getDay()
  const shift = firstDay === 0 ? 6 : firstDay - 1 // 0=Dimanche

  const calendarCells = []

  // Ajoute des cases vides pour compléter la semaine avant le 1er du mois.
  for (let i = 0; i < shift; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="p-2" />)
  }

  // Génère les boutons représentant chaque jour du mois et marque ceux avec des rapports actifs.
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const key = date.toISOString().split("T")[0]
    const active = byDate[key]?.length > 0

    // Sélectionne un jour et propage l'information au parent via onDayClick si défini.
    const handleSelect = () => {
      setSelectedDate(key)
      onDayClick?.(key)
    }

    calendarCells.push(
      <button
        key={key}
        onClick={handleSelect}
        className={`p-2 text-center text-sm rounded cursor-pointer border transition hover:scale-[1.02]
          ${active ? "bg-blue-700 border-blue-500" : "bg-gray-800 border-gray-700"}
        `}
      >
        {d}
      </button>
    )
  }

  // Affiche l'en-tête, les noms des jours, la grille mensuelle et un résumé du jour sélectionné.
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
        <div className="mt-4 border-t border-gray-700 pt-4 text-sm text-gray-400">
          {byDate[selectedDate]?.length ?? 0} rapport(s) le {selectedDate}. Cliquez sur la date pour ouvrir le détail.
        </div>
      )}
    </div>
  )
}
