'use client'

import { useState } from 'react'
import { TrackableWithToday } from '@/types/trackables'
import { CheckCircle2, AlertCircle, MoreVertical, Edit2 } from 'lucide-react'

interface TrackablePriorityCardProps {
  trackable: TrackableWithToday
  onCheck?: () => void
  onObserve?: () => void
  onEdit?: () => void
}

export default function TrackablePriorityCard({
  trackable,
  onCheck,
  onObserve,
  onEdit,
}: TrackablePriorityCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const isHabit = trackable.type === 'habit'
  const isState = trackable.type === 'state'

  // Calculer le progrès pour les habitudes
  const progressPercentage = isHabit && trackable.target_per_day
    ? Math.min((trackable.today_count / trackable.target_per_day) * 100, 100)
    : 0

  const isCompleted = isHabit && trackable.target_per_day
    ? trackable.today_count >= trackable.target_per_day
    : false

  // Compter les décisions du jour pour les états
  const resistances = trackable.today_decisions.filter(
    (d) => d.decision === 'resist'
  ).length
  const relapses = trackable.today_decisions.filter(
    (d) => d.decision === 'relapse'
  ).length
  const totalDecisions = resistances + relapses
  const resistanceRate = totalDecisions > 0
    ? Math.round((resistances / totalDecisions) * 100)
    : 0

  // Missions logic
  const hasMissions = trackable.missions && trackable.missions.length > 0
  const totalMissions = hasMissions ? trackable.missions!.length : 0

  // Get currently completed missions from newest event (check or observe)
  const lastMissionEvent = [...trackable.today_events]
    .filter(e => isHabit ? e.kind === 'check' : e.kind === 'observe')
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0]

  const completedMissionsCount = lastMissionEvent?.meta_json?.completed_mission_ids?.length || 0
  const missionsPercentage = totalMissions > 0
    ? Math.round((completedMissionsCount / totalMissions) * 100)
    : 0

  const handleClick = () => {
    if (isHabit && onCheck) {
      onCheck()
    } else if (isState && onObserve) {
      onObserve()
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit()
    }
  }

  return (
    <div
      className={`group relative w-full overflow-hidden rounded-2xl p-5 transition-all hover:scale-105 ${isHabit
        ? isCompleted
          ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-2 ring-green-500/50'
          : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 ring-2 ring-blue-500/30'
        : 'bg-gradient-to-br from-orange-500/10 to-red-500/10 ring-2 ring-orange-500/30'
        }`}
      style={{
        backgroundColor: trackable.color
          ? `${trackable.color}15`
          : undefined,
      }}
    >
      {/* Icon & Title */}
      <div className="mb-4 flex items-start justify-between">
        <button
          onClick={handleClick}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
            {trackable.icon || (isHabit ? '✅' : '⚠️')}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{trackable.name}</h3>
            <p className="text-xs text-gray-400">
              {isHabit ? 'Habitude' : 'État'}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {hasMissions && (
            <div className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 text-[10px] font-bold text-blue-400">
              {completedMissionsCount}/{totalMissions}
            </div>
          )}
          {isCompleted && (
            <CheckCircle2 size={24} className="text-green-400" />
          )}
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white opacity-0 transition-all hover:bg-white/20 group-hover:opacity-100"
            >
              <Edit2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Progress for Habits */}
      {isHabit && trackable.target_per_day && (
        <div className="mb-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-300">
              {trackable.today_count} / {trackable.target_per_day}{' '}
              {trackable.unit || 'fois'}
            </span>
            <span className="font-bold text-white">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats for States */}
      {isState && trackable.today_count > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Observations aujourd'hui</span>
            <span className="font-bold text-white">
              {trackable.today_count}
            </span>
          </div>
          {totalDecisions > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Résistances</span>
                <span className="font-bold text-green-400">{resistances}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Craquages</span>
                <span className="font-bold text-red-400">{relapses}</span>
              </div>
              <div className="mt-3 rounded-lg bg-white/5 p-2 text-center">
                <div className="text-xs text-gray-400">Taux de résistance</div>
                <div className="text-lg font-bold text-white">
                  {resistanceRate}%
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {trackable.today_count === 0 && (
        <div className="text-center text-sm text-gray-400">
          {isHabit ? 'Aucune complétion aujourd\'hui' : 'Aucune observation aujourd\'hui'}
        </div>
      )}

      {/* Action hint */}
      <div className="mt-4 text-center text-xs text-gray-500 opacity-0 transition-opacity group-hover:opacity-100">
        {hasMissions
          ? 'Cliquer pour voir les missions'
          : isHabit
            ? 'Cliquer pour marquer comme fait'
            : 'Cliquer pour observer cet état'}
      </div>
    </div>
  )
}
