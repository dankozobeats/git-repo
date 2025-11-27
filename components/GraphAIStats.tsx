'use client'

// Graphique Chart.js montrant les rapports générés et leur score moyen par jour.

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)

type GraphAIStatsProps = {
  reports: any[]
}

export default function GraphAIStats({ reports }: GraphAIStatsProps) {
  if (!reports || reports.length === 0) return null

  // Regroupe les rapports par jour pour calculer le volume et la moyenne des scores.
  const grouped = new Map<
    string,
    {
      count: number
      disciplineSum: number
      disciplineCount: number
    }
  >()

  reports.forEach(report => {
    const key = new Date(report.created_at).toISOString().split('T')[0]
    const entry = grouped.get(key) || { count: 0, disciplineSum: 0, disciplineCount: 0 }
    entry.count += 1
    const disciplineScore =
      typeof report.stats?.discipline_score === 'number' ? report.stats.discipline_score : null
    if (disciplineScore !== null) {
      entry.disciplineSum += disciplineScore
      entry.disciplineCount += 1
    }
    grouped.set(key, entry)
  })

  const sortedEntries = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  const labels = sortedEntries.map(([date]) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  )
  const generatedCounts = sortedEntries.map(entry => entry[1].count)
  const averageDiscipline = sortedEntries.map(entry => {
    const { disciplineSum, disciplineCount } = entry[1]
    if (disciplineCount === 0) return 0
    return Math.round(disciplineSum / disciplineCount)
  })

  // Jeu de données Chart.js avec deux axes Y (nombre vs score).
  const data = {
    labels,
    datasets: [
      {
        label: 'Rapports générés',
        data: generatedCounts,
        borderColor: '#4DA6FF',
        backgroundColor: 'rgba(77,166,255,0.25)',
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 3,
        yAxisID: 'y',
      },
      {
        label: 'Score discipline IA (moyenne)',
        data: averageDiscipline,
        borderColor: '#FF4D6D',
        backgroundColor: 'rgba(255,77,109,0.2)',
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 3,
        yAxisID: 'y1',
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#E5E7EB' } },
      tooltip: {
        backgroundColor: 'rgba(11,11,17,0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#1f1f2b' },
        ticks: { color: '#C5C8D0' },
        title: { display: true, text: 'Nombre de rapports', color: '#C5C8D0' },
      },
      y1: {
        position: 'right' as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: '#C5C8D0' },
        max: 100,
        title: { display: true, text: 'Score IA', color: '#C5C8D0' },
      },
      x: {
        ticks: { color: '#C5C8D0' },
        grid: { color: '#1f1f2b' },
      },
    },
  }

  // Carte stylisée contenant le graphique responsive.
  return (
    <div className="rounded-3xl border border-white/5 bg-[#0F0F13] p-6 shadow-xl shadow-black/30">
      <h2 className="text-xl font-bold mb-4 text-white">Activité IA glissante</h2>
      <div className="h-72">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
