'use client'

// Affiche un score synthétique calculé à partir des rapports IA enregistrés.

export default function AIScoreCard({ reports }: { reports: any[] }) {
  if (!reports || reports.length === 0) return null

  // Sommes cumulées de validations/craquages renvoyées par les rapports.
  const allGood = reports.reduce((acc, r) => acc + (r.stats?.goodLogs ?? 0), 0)
  const allBad = reports.reduce((acc, r) => acc + (r.stats?.badLogs ?? 0), 0)

  const streakBonus = reports.reduce(
    (acc, r) => acc + (r.stats?.currentStreak ?? 0),
    0
  )

  const total = allGood + allBad

  const ratio = total === 0 ? 0.5 : allGood / total

  // Pondération simple pour donner un score sur 100.
  let score =
    allGood * 1 +
    allBad * -2 +
    streakBonus * 3 +
    ratio * 50

  score = Math.max(0, Math.min(100, Math.round(score)))

  // Rend une carte compacte avec le score calculé et une description courte.
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-2">Score de Discipline IA</h2>

      <p className="text-5xl font-black text-blue-400 mb-3">{score}</p>

      <p className="text-gray-400 text-sm">
        Basé sur l’activité cumulée, les streaks et les craquages.
      </p>
    </div>
  )
}
