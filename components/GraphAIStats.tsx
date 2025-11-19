'use client'

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
)

export default function GraphAIStats({ reports }: { reports: any[] }) {
  if (!reports || reports.length === 0) return null

  const labels = reports.map(r =>
    new Date(r.created_at).toLocaleDateString('fr-FR')
  )

  const goodLogs = reports.map(r => r.stats?.goodLogs ?? 0)
  const badLogs = reports.map(r => r.stats?.badLogs ?? 0)

  const data = {
    labels,
    datasets: [
      {
        label: 'Good habits validées',
        data: goodLogs,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74,222,128,0.3)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Craquages (bad habits)',
        data: badLogs,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.3)',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">
        Évolution de tes habitudes dans le temps
      </h2>
      <Line data={data} />
    </div>
  )
}


