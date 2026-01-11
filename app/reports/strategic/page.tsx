import { Metadata } from 'next'
import { StrategicReport } from '@/components/reports/StrategicReport'

export const metadata: Metadata = {
  title: 'Rapport Stratégique | BadHabit Tracker',
  description: 'Vue d\'ensemble stratégique de toutes vos habitudes avec métriques détaillées',
}

export default function StrategicReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="mx-auto max-w-7xl">
        <StrategicReport />
      </div>
    </div>
  )
}
