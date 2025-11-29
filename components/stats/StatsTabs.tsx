'use client'

import { useEffect, useState } from 'react'
import DailyProgressChart, { DailyProgressPoint } from './DailyProgressChart'
import WeekdayChart, { WeekdayPoint } from './WeekdayChart'
import WeeklyTrendChart, { WeeklyPoint } from './WeeklyTrendChart'
import TopHabitsChart, { TopHabitPoint } from './TopHabitsChart'
import CalendarHeatmap, { CalendarPoint } from './CalendarHeatmap'

export type StatsTabsProps = {
  daily: DailyProgressPoint[]
  weekday: WeekdayPoint[]
  weekly: WeeklyPoint[]
  topHabits: TopHabitPoint[]
  calendar: CalendarPoint[]
}

const tabs = [
  { id: 'daily', label: 'Progression quotidienne' },
  { id: 'weekday', label: 'Performance hebdomadaire' },
  { id: 'weekly', label: 'Tendance (semaines)' },
  { id: 'top', label: 'Top habitudes' },
  { id: 'calendar', label: 'Calendrier' },
] as const

type TabId = (typeof tabs)[number]['id']

export default function StatsTabs({ daily, weekday, weekly, topHabits, calendar }: StatsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('daily')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Utilise un micro-task pour éviter l'appel synchrone de setState
    queueMicrotask(() => setMounted(true))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'border border-[#FF4D4D] bg-[#FF4D4D]/10 text-white shadow-[0_0_20px_rgba(255,77,77,0.2)]'
                : 'border border-transparent bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#0F0F13]/80 p-4 sm:p-6 shadow-2xl shadow-black/40 min-h-[360px] w-full min-w-0">
        {!mounted ? (
          <div className="flex h-64 w-full items-center justify-center text-sm text-white/50 sm:h-80">Chargement…</div>
        ) : (
          <>
            {activeTab === 'daily' && <DailyProgressChart data={daily} />}
            {activeTab === 'weekday' && <WeekdayChart data={weekday} />}
            {activeTab === 'weekly' && <WeeklyTrendChart data={weekly} />}
            {activeTab === 'top' && <TopHabitsChart data={topHabits} />}
            {activeTab === 'calendar' && <CalendarHeatmap data={calendar} />}
          </>
        )}
      </div>
    </div>
  )
}
