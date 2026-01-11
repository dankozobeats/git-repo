'use client'

/**
 * Rapport Temporel Avancé - Composant principal
 * Analyse horaire, calendrier annuel, comparaisons, time machine, saisons
 */

import { useTemporalReport } from '@/lib/habits/useTemporalReport'
import { HourlyHeatmap } from './HourlyHeatmap'
import { YearlyCalendarHeatmap } from './YearlyCalendarHeatmap'
import { MonthlyComparison } from './MonthlyComparison'
import { TimeMachineTimeline } from './TimeMachineTimeline'
import { SeasonalPatterns } from './SeasonalPatterns'

export function TemporalReport() {
  const report = useTemporalReport()

  if (report.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
          <p className="text-sm text-white/60">Analyse temporelle en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Rapport Temporel Avancé</h1>
        <p className="mt-1 text-sm text-white/60">
          Analyse approfondie de vos patterns temporels
        </p>
      </div>

      {/* Section 1: Calendrier Annuel (Hero) */}
      <YearlyCalendarHeatmap yearlyCalendar={report.yearlyCalendar} />

      {/* Section 2: Analyse Horaire */}
      <HourlyHeatmap
        hourlyData={report.hourlyData}
        mostActiveHour={report.insights.mostActiveHour}
        mostRiskyHour={report.insights.mostRiskyHour}
      />

      {/* Section 3: Comparaison Mensuelle */}
      <MonthlyComparison
        bestMonth={report.monthlyComparison.bestMonth}
        worstMonth={report.monthlyComparison.worstMonth}
        currentMonth={report.monthlyComparison.currentMonth}
        allMonths={report.monthlyComparison.allMonths}
      />

      {/* Section 4: Time Machine */}
      <TimeMachineTimeline timeMachine={report.timeMachine} />

      {/* Section 5: Patterns Saisonniers */}
      <SeasonalPatterns
        seasonalPatterns={report.seasonalPatterns}
        bestDayOfWeek={report.insights.bestDayOfWeek}
        worstDayOfWeek={report.insights.worstDayOfWeek}
      />
    </div>
  )
}
