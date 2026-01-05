'use client'

/**
 * Onglet Configuration - Rappels + Goals + Actions
 */

import { useState } from 'react'
import Link from 'next/link'
import ReminderSettings from '@/components/reminders/ReminderSettings'
import ReminderList from '@/components/reminders/ReminderList'
import ReminderHistory from '@/components/reminders/ReminderHistory'
import PushEnableButton from '@/components/PushEnableButton'
import DeleteButton from '../DeleteButton'
import GoalSettingsModal from '../GoalSettingsModal'

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
  goal_value: number | null
  goal_type: 'daily' | 'weekly' | 'monthly' | null
  goal_description: string | null
}

type SettingsTabProps = {
  habit: Habit
  userId: string
  reminders: Reminder[]
}

export default function SettingsTab({ habit, userId, reminders }: SettingsTabProps) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  return (
    <div className="space-y-6 p-4">
      {/* Actions de l'habitude */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          ⚙️ Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/habits/${habit.id}/edit`}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
          >
            ✏️ Modifier l'habitude
          </Link>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
          >
            🎯 Ajuster l'objectif
          </button>
        </div>
        <div className="mt-3">
          <DeleteButton habitId={habit.id} habitName={habit.name} />
        </div>
      </div>

      {/* Objectif actuel */}
      {(habit.goal_value || habit.goal_description) && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
            🎯 Objectif configuré
          </h2>
          <div className="space-y-2 text-sm text-white/80">
            {habit.goal_value && habit.goal_type && (
              <p>
                <span className="text-white/50">Type:</span> {habit.goal_type === 'daily' ? 'Quotidien' : habit.goal_type === 'weekly' ? 'Hebdomadaire' : 'Mensuel'} — {habit.goal_value} fois
              </p>
            )}
            {habit.goal_description && (
              <p>
                <span className="text-white/50">Description:</span> {habit.goal_description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rappels */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            🔔 Rappels
          </h2>
          <PushEnableButton userId={userId} />
        </div>
        <ReminderSettings habitId={habit.id} userId={userId} />
      </div>

      {/* Liste des rappels actifs */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          Rappels actifs
        </h3>
        <ReminderList reminders={reminders} />
      </div>

      {/* Historique */}
      <ReminderHistory habitId={habit.id} />

      {/* Goal Settings Modal */}
      <GoalSettingsModal
        habitId={habit.id}
        currentGoal={{
          goal_value: habit.goal_value,
          goal_type: habit.goal_type,
          goal_description: habit.goal_description,
        }}
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
    </div>
  )
}
