'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCcw } from 'lucide-react'
import { useHabitStats, type HabitStatsPeriod } from '@/lib/habits/useHabitStats'
import { useWeeklyPerformance } from '@/lib/habits/useWeeklyPerformance'
import { CumulativeChart } from '@/components/stats/CumulativeChart'
import { DailyBars } from '@/components/stats/DailyBars'
import { GoodBadCompare } from '@/components/stats/GoodBadCompare'
import { HabitHeatmap } from '@/components/stats/HabitHeatmap'
import { WeekdayPerformanceChart } from '@/components/stats/WeekdayPerformanceChart'

const PERIOD_OPTIONS: HabitStatsPeriod[] = [7, 30, 90, 'all']

export default function HabitStatsPage() {
  const [period, setPeriod] = useState<HabitStatsPeriod>(30)
  const { data, loading, error, refresh } = useHabitStats(period)
  const {
    data: weeklyData,
    loading: weeklyLoading,
    error: weeklyError,
    refresh: refreshWeekly,
  } = useWeeklyPerformance(period)

  const summary = useMemo(() => {
    if (!data) {
      return {
        good: 0,
        bad: 0,
        total: 0,
      }
    }

    const good = data.daily.reduce((sum, day) => sum + day.good, 0)
    const bad = data.daily.reduce((sum, day) => sum + day.bad, 0)

    return {
      good,
      bad,
      total: good + bad,
    }
  }, [data])

  const topHabits = data?.topHabits ?? []
  const weekdaySummary = useMemo(() => {
    if (!weeklyData?.length) {
      return {
        productive: '—',
        cravings: '—',
      }
    }
    const best = weeklyData.reduce((acc, entry) => (entry.good > acc.good ? entry : acc))
    const worst = weeklyData.reduce((acc, entry) => (entry.bad > acc.bad ? entry : acc))
    return {
      productive: best.fullDay,
      cravings: worst.fullDay,
    }
  }, [weeklyData])

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <header className="rounded-2xl border border-white/10 bg-gray-900/40 p-6 shadow-lg shadow-black/30 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-gray-950/40 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-white/30 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour dashboard
              </Link>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-white">Analytique</p>
              <h1 className="text-3xl font-bold text-white">Statistiques d&apos;habitudes</h1>
              <p className="text-sm text-gray-400">
                Explore tes tendances sur plusieurs périodes et identifie rapidement les zones à améliorer.
              </p>
            </div>
            <div className="flex gap-3">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setPeriod(option)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    period === option
                      ? 'border-red-500/70 bg-red-500/20 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  {option === 'all' ? 'Tout' : `${option} j`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Actions positives', value: summary.good, color: 'text-emerald-400' },
              { label: 'Craquages', value: summary.bad, color: 'text-red-400' },
              { label: 'Total entrées', value: summary.total, color: 'text-white' },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-gray-950/50 p-4 shadow-inner shadow-black/40">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{card.label}</p>
                <p className={`mt-3 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        </header>

        {error === 'AUTH' && (
          <section className="rounded-2xl border border-white/10 bg-gray-900/40 p-8 text-center shadow-lg shadow-black/30">
            <p className="text-lg font-semibold text-white">Tu dois être connecté</p>
            <p className="mt-2 text-sm text-gray-400">Connecte-toi pour consulter tes statistiques personnalisées.</p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Aller à la connexion
            </Link>
          </section>
        )}

        {error && error !== 'AUTH' && (
          <section className="rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-center shadow-lg shadow-black/30">
            <p className="text-lg font-semibold text-white">Impossible de charger les statistiques</p>
            <p className="mt-2 text-sm text-gray-300">{error}</p>
            <button
              onClick={refresh}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/40"
            >
              <RefreshCcw className="h-4 w-4" /> Réessayer
            </button>
          </section>
        )}

        {!data && loading && (
          <section className="rounded-2xl border border-white/10 bg-gray-900/40 p-10 text-center shadow-lg shadow-black/30">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-red-500" />
            <p className="text-sm text-gray-400">Analyse des données en cours...</p>
          </section>
        )}

        {data && (
          <section className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <StatsCard title="Progression cumulative" subtitle="Total good vs bad cumulés">
                <CumulativeChart data={data.cumulative} />
              </StatsCard>

              <StatsCard title="Progression journalière" subtitle="Sommes quotidiennes">
                <DailyBars data={data.daily} />
              </StatsCard>

              <StatsCard
                title="Comparatif good / bad"
                subtitle="Visualise le poids relatif des actions"
              >
                <GoodBadCompare data={data.daily} />
              </StatsCard>

              <StatsCard title="Heatmap quotidienne" subtitle="Vue style GitHub">
                <HabitHeatmap data={data.heatmap} />
              </StatsCard>
            </div>

            <StatsCard title="Performance par jour" subtitle="Compare les actions selon les jours de la semaine">
              {weeklyError && weeklyError !== 'AUTH' ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-gray-950/50 p-4 text-center text-sm text-gray-400">
                  <p>Impossible de charger les performances hebdo.</p>
                  <button
                    onClick={refreshWeekly}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs uppercase tracking-wide text-white transition hover:border-white/30"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Recharger
                  </button>
                </div>
              ) : (
                <>
                  {weeklyLoading && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  )}
                  {weeklyData && <WeekdayPerformanceChart data={weeklyData} />}
                  <div className="mt-4 grid gap-4 text-sm text-gray-300 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-gray-950/50 p-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Jour le plus productif</p>
                      <p className="mt-2 text-lg font-semibold text-white">{weekdaySummary.productive}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-gray-950/50 p-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Jour avec le plus de craquages</p>
                      <p className="mt-2 text-lg font-semibold text-white">{weekdaySummary.cravings}</p>
                    </div>
                  </div>
                </>
              )}
            </StatsCard>

            <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-6 shadow-lg shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Classement</p>
                  <h3 className="text-xl font-semibold text-white">Top habitudes</h3>
                  <p className="text-sm text-gray-400">
                    Basé sur le nombre total d&apos;actions enregistrées pendant la période.
                  </p>
                </div>
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-white/30 hover:text-white"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Rafraîchir
                </button>
              </div>
              <div className="mt-6 space-y-3">
                {topHabits.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune donnée disponible pour cette période.</p>
                )}
                {topHabits.map((habit, index) => (
                  <div
                    key={`${habit.name}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-gray-950/50 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-white">{habit.name}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {habit.type === 'bad' ? 'Habitude négative' : 'Habitude positive'}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-white">{habit.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

type StatsCardProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

function StatsCard({ title, subtitle, children }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-6 shadow-lg shadow-black/30">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
