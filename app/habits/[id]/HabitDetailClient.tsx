'use client'

/**
 * Client component avec navigation par onglets pour la page détail habitude
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HabitDetailHeader from './HabitDetailHeader'
import OverviewTab from './tabs/OverviewTab'
import CalendarTab from './tabs/CalendarTab'
import CoachTab from './tabs/CoachTab'
import SettingsTab from './tabs/SettingsTab'
import HistoryTab from './tabs/HistoryTab'
import NotesTab from './tabs/NotesTab'
import TasksTab from './tabs/TasksTab'
import CheckHabitMissionsSheet from '@/components/trackables/CheckHabitMissionsSheet'
import type { HabitCalendarMap, HabitStats } from '@/lib/habits/computeHabitStats'

type TabType = 'overview' | 'calendar' | 'coach' | 'history' | 'notes' | 'tasks' | 'settings'

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
  missions?: any[] | null
}

type Props = {
  habit: Habit
  calendarData: HabitCalendarMap
  todayMissionsProgress: string[]
  stats: HabitStats
  reminders?: Reminder[]
}

export default function HabitDetailClient({
  habit,
  calendarData,
  todayMissionsProgress,
  stats,
  reminders = [],
}: Props) {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Charger le dernier onglet visité depuis localStorage après le premier rendu (Client Only)
  useEffect(() => {
    const saved = localStorage.getItem(`habit-detail-tab-${habit.id}`)
    if (saved && ['overview', 'calendar', 'coach', 'history', 'notes', 'tasks', 'settings'].includes(saved)) {
      setActiveTab(saved as TabType)
    }
  }, [habit.id])

  const [count, setCount] = useState(stats.todayCount)
  const [isValidating, setIsValidating] = useState(false)
  const [missionsSheetOpen, setMissionsSheetOpen] = useState(false)

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

      // En mode binaire, l'API retourne 200 même si déjà validé aujourd'hui
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Validation failed')
      }

      const data = await res.json()

      // Mettre à jour le count depuis la réponse
      const newCount = typeof data.count === 'number' ? data.count : count + 1
      setCount(newCount)

      // Rafraîchir pour mettre à jour l'UI (notamment pour retirer de "À faire" si binaire)
      router.refresh()
    } catch (error) {
      console.error('Erreur validation:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleOpenMissions = () => {
    setMissionsSheetOpen(true)
  }

  const handleSubmitMissions = async (completedMissionIds: string[]) => {
    setIsValidating(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta_json: {
            completed_mission_ids: completedMissionIds,
            total_missions: habit.missions?.length || 0,
            completion_rate: Math.round(
              (completedMissionIds.length / (habit.missions?.length || 1)) * 100
            ),
          }
        })
      })

      if (!res.ok) throw new Error('Missions submission failed')

      router.refresh()
    } catch (error) {
      console.error('Erreur missions:', error)
    } finally {
      setIsValidating(false)
      setMissionsSheetOpen(false)
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
          onOpenMissions={handleOpenMissions}
          todayMissionsProgress={todayMissionsProgress}
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

      {activeTab === 'notes' && (
        <NotesTab habit={{ id: habit.id, name: habit.name }} />
      )}

      {activeTab === 'tasks' && (
        <TasksTab habit={{ id: habit.id, name: habit.name }} />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          habit={habit}
          userId={habit.user_id}
          reminders={reminders}
        />
      )}

      {/* Missions Sheet */}
      {missionsSheetOpen && (
        <CheckHabitMissionsSheet
          habit={{
            ...habit,
            today_events: (todayMissionsProgress
              ? [{ kind: 'check', occurred_at: new Date().toISOString(), meta_json: { completed_mission_ids: todayMissionsProgress } }]
              : []) as any
          } as any}
          isOpen={missionsSheetOpen}
          onClose={() => setMissionsSheetOpen(false)}
          onSubmit={handleSubmitMissions}
        />
      )}
    </div>
  )
}
