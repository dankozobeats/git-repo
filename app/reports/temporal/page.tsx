import { Metadata } from 'next'
import { TemporalReport } from '@/components/reports/TemporalReport'

export const metadata: Metadata = {
  title: 'Rapport Temporel | BadHabit Tracker',
  description: 'Analyse approfondie des patterns temporels: horaires, calendrier annuel, comparaisons mensuelles',
}

export default function TemporalReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="mx-auto max-w-7xl">
        <TemporalReport />
      </div>
    </div>
  )
}
