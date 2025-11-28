'use client'

// Premium analytics dashboard for habits, orchestrating data hooks and premium UI components.

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import HabitStatsModal from '@/components/HabitStatsModal'
import StatsHeader from '@/components/stats/StatsHeader'
import PeriodSelector from '@/components/stats/PeriodSelector'
import SummaryCards from '@/components/stats/SummaryCards'
import StatsCard from '@/components/stats/StatsCard'
import StatsLoadingSkeleton from '@/components/stats/StatsLoadingSkeleton'
import StatsErrorState from '@/components/stats/StatsErrorState'
import TopHabitsList from '@/components/stats/TopHabitsList'
import { CumulativeChart } from '@/components/stats/CumulativeChart'
import { DailyBars } from '@/components/stats/DailyBars'
import { GoodBadCompare } from '@/components/stats/GoodBadCompare'
import { HabitHeatmap } from '@/components/stats/HabitHeatmap'
import { WeekdayPerformanceChart } from '@/components/stats/WeekdayPerformanceChart'
import { useHabitStats, type HabitStatsPeriod, type TopHabitPoint } from '@/lib/habits/useHabitStats'
import { useWeeklyPerformance } from '@/lib/habits/useWeeklyPerformance'

type SelectedHabit = Pick<TopHabitPoint, 'id' | 'name' | 'type'>

const PERIOD_LABELS: Record<HabitStatsPeriod, string> = {
  7: '7 derniers jours',
  30: '30 derniers jours',
  90: '90 derniers jours',
  all: 'Depuis le début',
}

export default function HabitStatsPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<HabitStatsPeriod>(30)

  const { data, loading, error, refresh } = useHabitStats(period)
  const {
    data: weeklyData,
    loading: weeklyLoading,
    error: weeklyError,
    refresh: refreshWeekly,
  } = useWeeklyPerformance(period)

  const summary = useMemo(() => {
    if (!data) return { good: 0, bad: 0, total: 0 }
    const good = data.daily.reduce((sum, day) => sum + day.good, 0)
    const bad = data.daily.reduce((sum, day) => sum + day.bad, 0)
    return { good, bad, total: good + bad }
  }, [data])

  const weekdaySummary = useMemo(() => {
    if (!weeklyData?.length) return { productive: '—', cravings: '—' }
    const best = weeklyData.reduce((acc, entry) => (entry.good > acc.good ? entry : acc))
    const worst = weeklyData.reduce((acc, entry) => (entry.bad > acc.bad ? entry : acc))
    return {
      productive: best.fullDay,
      cravings: worst.fullDay,
    }
  }, [weeklyData])

  const periodLabel = PERIOD_LABELS[period]
  const topHabits = data?.topHabits ?? []

  const [selectedHabit, setSelectedHabit] = useState<SelectedHabit | null>(null)

  const handlePeriodChange = useCallback((next: HabitStatsPeriod) => {
    setPeriod(next)
  }, [])

  const handleSelectHabit = useCallback((habit: TopHabitPoint) => {
    setSelectedHabit({
      id: habit.id,
      name: habit.name,
      type: habit.type,
    })
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedHabit(null)
  }, [])

  const handleLoginRedirect = useCallback(() => {
    router.push('/login')
  }, [router])

  const showAuthError = error === 'AUTH'
  const genericError = error && error !== 'AUTH' ? error : null

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#01030a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_50%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.18),transparent_45%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-10 space-y-8">
        <StatsHeader
          periodLabel={periodLabel}
          description="Observe tes signaux forts et faibles, synthétisés via notre pipeline IA premium."
        />

        <section className="rounded-[36px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.65)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Fenêtre d&apos;analyse</p>
              <h2 className="mt-2 text-2xl font-semibold">Sélectionne la période à analyser</h2>
              <p className="mt-2 text-sm text-white/60">
                Ajuste l&apos;horizon pour recalculer toutes les métriques à la volée.
              </p>
            </div>
            <PeriodSelector value={period} onChange={handlePeriodChange} disabled={loading} />
          </div>
        </section>

        {showAuthError ? (
          <StatsErrorState
            title="Tu dois être connecté"
            description="Connecte-toi pour déverrouiller tes analytics personnalisées."
            actionLabel="Aller à la connexion"
            onAction={handleLoginRedirect}
            variant="warning"
          />
        ) : (
          <>
            {genericError && (
              <StatsErrorState
                title="Impossible de charger toutes les données"
                description={genericError}
                actionLabel="Réessayer"
                onAction={refresh}
              />
            )}

            {!data && loading && <StatsLoadingSkeleton />}

            {data && (
              <>
                <SummaryCards data={summary} />

                <div className="grid gap-6 lg:grid-cols-2">
                  <StatsCard title="Progression cumulative" subtitle="Total bonnes vs mauvaises actions cumulées">
                    <CumulativeChart data={data.cumulative} />
                  </StatsCard>
                  <StatsCard title="Progression journalière" subtitle="Sommes quotidiennes sur la période">
                    <DailyBars data={data.daily} />
                  </StatsCard>
                  <StatsCard title="Comparatif good / bad" subtitle="Poids relatif des actions quotidiennes">
                    <GoodBadCompare data={data.daily} />
                  </StatsCard>
                  <StatsCard title="Heatmap quotidienne" subtitle="Vue calendaire façon GitHub">
                    <HabitHeatmap data={data.heatmap} />
                  </StatsCard>
                </div>

                <StatsCard title="Performance par jour" subtitle="Compare les tendances selon les jours de la semaine">
                  {weeklyError && weeklyError !== 'AUTH' && (
                    <StatsErrorState
                      title="Données hebdo indisponibles"
                      description="Réessaie pour recharger les performances par jour."
                      actionLabel="Recharger"
                      onAction={refreshWeekly}
                      variant="warning"
                    />
                  )}
                  {weeklyLoading && <StatsLoadingSkeleton rows={1} height="md" />}
                  {!weeklyError && weeklyData && (
                    <>
                      <WeekdayPerformanceChart data={weeklyData} />
                      <div className="mt-4 grid gap-4 text-sm text-white/70 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Jour le plus productif</p>
                          <p className="mt-2 text-lg font-semibold text-white">{weekdaySummary.productive}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                          <p className="text-xs uppercase tracking-[0.4em] text-white/60">Jour avec plus de craquages</p>
                          <p className="mt-2 text-lg font-semibold text-white">{weekdaySummary.cravings}</p>
                        </div>
                      </div>
                    </>
                  )}
                </StatsCard>

                <TopHabitsList
                  habits={topHabits}
                  onSelect={handleSelectHabit}
                  onRefresh={refresh}
                />
              </>
            )}
          </>
        )}
      </div>

      {selectedHabit && <HabitStatsModal habit={selectedHabit} onClose={handleCloseModal} />}
    </main>
  )
}
