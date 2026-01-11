import { Metadata } from 'next'
import { AIReport } from '@/components/reports/AIReport'

export const metadata: Metadata = {
  title: 'Rapport IA | BadHabit Tracker',
  description: 'Insights personnalisés générés par l\'intelligence artificielle',
}

export default function AIReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="mx-auto max-w-7xl">
        <AIReport />
      </div>
    </div>
  )
}
