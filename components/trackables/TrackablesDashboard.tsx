'use client'

import { useState } from 'react'
import { useTrackables } from '@/lib/trackables/useTrackables'
import { useTrackableStats } from '@/lib/trackables/useTrackableStats'
import TrackablePriorityCard from './TrackablePriorityCard'
import ObserveStateSheet from './ObserveStateSheet'
import DecisionSheet from './DecisionSheet'
import CreateTrackableModal from './CreateTrackableModal'
import EditTrackableModal from './EditTrackableModal'
import InsightsPanel from './InsightsPanel'
import CheckHabitMissionsSheet from './CheckHabitMissionsSheet'
import { TrackableWithToday, StateEventMeta, TrackableEvent } from '@/types/trackables'
import { TrendingUp, TrendingDown, Target, Shield, AlertCircle, Plus } from 'lucide-react'

export default function TrackablesDashboard() {
  const { trackables, isLoading, logEvent, createDecision, createTrackable, updateTrackable, archiveTrackable, refresh } = useTrackables()
  const { stats } = useTrackableStats()

  const [observeSheetOpen, setObserveSheetOpen] = useState(false)
  const [decisionSheetOpen, setDecisionSheetOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTrackable, setSelectedTrackable] = useState<TrackableWithToday | null>(null)
  const [editingTrackable, setEditingTrackable] = useState<TrackableWithToday | null>(null)
  const [pendingStateEvent, setPendingStateEvent] = useState<TrackableEvent | null>(null)
  const [checkMissionsSheetOpen, setCheckMissionsSheetOpen] = useState(false)

  // Separate habits and states
  const habits = trackables.filter((t) => t.type === 'habit')
  const states = trackables.filter((t) => t.type === 'state')
  const priorityHabits = habits.filter((h) => h.is_priority)
  const priorityStates = states.filter((s) => s.is_priority)

  // Handle checking a habit
  const handleCheckHabit = async (trackable: TrackableWithToday) => {
    if (trackable.missions && trackable.missions.length > 0) {
      setSelectedTrackable(trackable)
      setCheckMissionsSheetOpen(true)
      return
    }

    try {
      await logEvent({
        trackable_id: trackable.id,
        kind: 'check',
        value_int: 1,
      })
      refresh()
    } catch (error) {
      console.error('Error checking habit:', error)
    }
  }

  // Handle observing a state
  const handleObserveState = (trackable: TrackableWithToday) => {
    if (trackable.missions && trackable.missions.length > 0) {
      setSelectedTrackable(trackable)
      setCheckMissionsSheetOpen(true)
      return
    }

    setSelectedTrackable(trackable)
    setObserveSheetOpen(true)
  }

  // Handle missions submission (Habit OR State)
  const handleSubmitMissions = async (completedMissionIds: string[]) => {
    if (!selectedTrackable) return

    try {
      const isHabit = selectedTrackable.type === 'habit'

      const meta = {
        completed_mission_ids: completedMissionIds,
        total_missions: selectedTrackable.missions?.length || 0,
        completion_rate: Math.round(
          (completedMissionIds.length / (selectedTrackable.missions?.length || 1)) * 100
        ),
      }

      if (isHabit) {
        await logEvent({
          trackable_id: selectedTrackable.id,
          kind: 'check',
          value_int: 1,
          meta_json: meta,
        })
        refresh()
      } else {
        const event = await logEvent({
          trackable_id: selectedTrackable.id,
          kind: 'observe',
          meta_json: meta,
        })
        setCheckMissionsSheetOpen(false)
        setPendingStateEvent(event)
        setObserveSheetOpen(true)
      }
    } catch (error) {
      console.error('Error submitting missions:', error)
    }
  }

  // Submit state observation
  const handleSubmitObservation = async (meta: StateEventMeta) => {
    if (!selectedTrackable) return

    try {
      const event = await logEvent({
        trackable_id: selectedTrackable.id,
        kind: 'observe',
        meta_json: meta,
      })

      setPendingStateEvent(event)
      setObserveSheetOpen(false)
      setDecisionSheetOpen(true)
    } catch (error) {
      console.error('Error observing state:', error)
    }
  }

  // Submit decision
  const handleSubmitDecision = async (decisionData: {
    decision: 'resist' | 'relapse' | 'delay' | 'replace' | 'other'
    amount?: number
    delay_minutes?: number
    replacement_action?: string
  }) => {
    if (!pendingStateEvent) return

    try {
      await createDecision({
        state_event_id: pendingStateEvent.id,
        ...decisionData,
      })
      setPendingStateEvent(null)
      refresh()
    } catch (error) {
      console.error('Error creating decision:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Trackables</h1>
          <p className="mt-2 text-gray-400">
            Nouveau système unifié pour habitudes et états
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105"
        >
          <Plus size={20} />
          Nouveau
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-5 ring-2 ring-blue-500/30">
            <div className="mb-2 flex items-center justify-between">
              <Target size={24} className="text-blue-400" />
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.today.habits_completed}
            </div>
            <div className="text-sm text-gray-400">Habitudes complétées</div>
            <div className="mt-2 text-xs text-gray-500">Objectif: {stats.today.habits_target}</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-5 ring-2 ring-green-500/30">
            <div className="mb-2 flex items-center justify-between">
              <Shield size={24} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.today.resistances}</div>
            <div className="text-sm text-gray-400">Résistances</div>
            <div className="mt-2 text-xs text-gray-500">Cette semaine: {stats.week.resistances}</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 p-5 ring-2 ring-red-500/30">
            <div className="mb-2 flex items-center justify-between">
              <AlertCircle size={24} className="text-red-400" />
              <TrendingDown size={16} className="text-red-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.today.relapses}</div>
            <div className="text-sm text-gray-400">Craquages</div>
            <div className="mt-2 text-xs text-gray-500">Cette semaine: {stats.week.relapses}</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-5 ring-2 ring-purple-500/30">
            <div className="mb-2 flex items-center justify-between">
              <Shield size={24} className="text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.week.avg_resistance_rate}%</div>
            <div className="text-sm text-gray-400">Taux de résistance</div>
            <div className="mt-2 text-xs text-gray-500">Cette semaine</div>
          </div>
        </div>
      )}

      {/* Insights Section */}
      <section>
        <InsightsPanel />
      </section>

      {/* Priority Habits */}
      {priorityHabits.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Habitudes Prioritaires</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {priorityHabits.map((habit) => (
              <TrackablePriorityCard
                key={habit.id}
                trackable={habit}
                onCheck={() => handleCheckHabit(habit)}
                onEdit={() => {
                  setEditingTrackable(habit)
                  setEditModalOpen(true)
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Priority States */}
      {priorityStates.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">États à Surveiller</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {priorityStates.map((state) => (
              <TrackablePriorityCard
                key={state.id}
                trackable={state}
                onObserve={() => handleObserveState(state)}
                onEdit={() => {
                  setEditingTrackable(state)
                  setEditModalOpen(true)
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Habits */}
      {habits.filter((h) => !h.is_priority).length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Autres Habitudes</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {habits
              .filter((h) => !h.is_priority)
              .map((habit) => (
                <TrackablePriorityCard
                  key={habit.id}
                  trackable={habit}
                  onCheck={() => handleCheckHabit(habit)}
                  onEdit={() => {
                    setEditingTrackable(habit)
                    setEditModalOpen(true)
                  }}
                />
              ))}
          </div>
        </section>
      )}

      {/* All States */}
      {states.filter((s) => !s.is_priority).length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold text-white">Autres États</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {states
              .filter((s) => !s.is_priority)
              .map((state) => (
                <TrackablePriorityCard
                  key={state.id}
                  trackable={state}
                  onObserve={() => handleObserveState(state)}
                  onEdit={() => {
                    setEditingTrackable(state)
                    setEditModalOpen(true)
                  }}
                />
              ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {selectedTrackable && (
        <ObserveStateSheet
          state={selectedTrackable}
          isOpen={observeSheetOpen}
          onClose={() => {
            setObserveSheetOpen(false)
            setSelectedTrackable(null)
          }}
          onSubmit={handleSubmitObservation}
        />
      )}

      {pendingStateEvent && (
        <DecisionSheet
          stateEvent={{
            ...pendingStateEvent,
            trackable: selectedTrackable
              ? { name: selectedTrackable.name, icon: selectedTrackable.icon || undefined }
              : undefined,
          }}
          isOpen={decisionSheetOpen}
          onClose={() => {
            setDecisionSheetOpen(false)
            setPendingStateEvent(null)
          }}
          onSubmit={handleSubmitDecision}
        />
      )}

      <CreateTrackableModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createTrackable}
      />

      <EditTrackableModal
        trackable={editingTrackable}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingTrackable(null)
        }}
        onSubmit={updateTrackable}
        onDelete={archiveTrackable}
      />

      {selectedTrackable && (
        <CheckHabitMissionsSheet
          habit={selectedTrackable}
          isOpen={checkMissionsSheetOpen}
          onClose={() => {
            setCheckMissionsSheetOpen(false)
            setSelectedTrackable(null)
          }}
          onSubmit={handleSubmitMissions}
        />
      )}
    </div>
  )
}
