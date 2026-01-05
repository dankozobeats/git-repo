'use client'

/**
 * Client component avec navigation par onglets pour la page détail habitude
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import HabitDetailHeader from './HabitDetailHeader'
import OverviewTab from './tabs/OverviewTab'
import CalendarTab from './tabs/CalendarTab'
import CoachTab from './tabs/CoachTab'
import SettingsTab from './tabs/SettingsTab'
import HistoryTab from './tabs/HistoryTab'
import type { HabitCalendarMap, HabitStats } from '@/lib/habits/computeHabitStats'

type TabType = 'overview' | 'calendar' | 'coach' | 'history' | 'settings'

type Reminder = {
  id: string
  habit_id: string
  user_id: string
  time_local: string
  schedule: string
  timezone: string
  message: string | null
  active: boolean
  created_at: string
  habits: {
    name: string
    icon: string | null
    color: string
    description: string | null
  } | null
}

type Habit = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter' | null
  goal_value: number | null
  goal_type: 'daily' | 'weekly' | 'monthly' | null
  goal_description: string | null
  daily_goal_value: number | null
  daily_goal_type: 'minimum' | 'maximum' | null
  user_id: string
}

type Props = {
  habit: Habit
  calendarData: HabitCalendarMap
  stats: HabitStats
  reminders?: Reminder[]
}

export default function HabitDetailClient({
  habit,
  calendarData,
  stats,
  reminders = [],
}: Props) {
  const router = useRouter()

  // Charger le dernier onglet visité depuis localStorage, sinon 'overview'
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`habit-detail-tab-${habit.id}`)
      if (saved === 'overview' || saved === 'calendar' || saved === 'coach' || saved === 'history' || saved === 'settings') {
        return saved
      }
    }
    return 'overview'
  })

  const [count, setCount] = useState(stats.todayCount)
  const [isValidating, setIsValidating] = useState(false)

  const isBadHabit = habit.type === 'bad'

  // Sauvegarder le changement d'onglet dans localStorage
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`habit-detail-tab-${habit.id}`, tab)
    }
  }

  const handleQuickValidate = async () => {
    setIsValidating(true)
    try {
      // Pour les mauvaises habitudes, on utilise l'endpoint events
      const endpoint = isBadHabit
        ? `/api/habits/${habit.id}/events`
        : `/api/habits/${habit.id}/check-in`

      const res = await fetch(endpoint, { method: 'POST' })
      if (!res.ok) throw new Error('Validation failed')

      const data = await res.json()
      const newCount = typeof data.count === 'number' ? data.count : count + 1
      setCount(newCount)
      router.refresh()
    } catch (error) {
      console.error('Erreur validation:', error)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-0">
      {/* Header avec tabs */}
      <HabitDetailHeader
        habit={habit}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'overview' && (
        <OverviewTab
          habit={habit}
          stats={{
            currentStreak: stats.currentStreak,
            todayCount: count,
            last7DaysCount: stats.last7DaysCount,
            monthCompletionRate: stats.monthCompletionRate,
            totalCount: stats.totalCount,
            bestStreak: 0, // Calculé dans le composant
          }}
          calendarData={calendarData}
          onValidate={handleQuickValidate}
          isValidating={isValidating}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarTab
          habitType={habit.type}
          calendarData={calendarData}
          trackingMode={habit.tracking_mode ?? 'binary'}
        />
      )}

      {activeTab === 'coach' && (
        <CoachTab
          habit={habit}
          stats={{
            totalCount: stats.totalCount,
            last7DaysCount: stats.last7DaysCount,
            currentStreak: stats.currentStreak,
            todayCount: count,
            monthCompletionRate: stats.monthCompletionRate,
          }}
          calendarData={calendarData}
        />
      )}

      {activeTab === 'history' && (
        <HistoryTab
          habitId={habit.id}
          habitType={habit.type}
          trackingMode={habit.tracking_mode ?? 'binary'}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          habit={habit}
          userId={habit.user_id}
          reminders={reminders}
        />
      )}
    </div>
  )
}
