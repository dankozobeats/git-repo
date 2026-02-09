'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, Circle, Target } from 'lucide-react'
import { TrackableWithToday, Mission } from '@/types/trackables'

interface CheckHabitMissionsSheetProps {
    habit: TrackableWithToday // Can be a habit or a state
    isOpen: boolean
    onClose: () => void
    onSubmit: (completedMissionIds: string[]) => Promise<void>
}

export default function CheckHabitMissionsSheet({
    habit,
    isOpen,
    onClose,
    onSubmit,
}: CheckHabitMissionsSheetProps) {
    const [completedIds, setCompletedIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Initialize with currently completed missions from the last check-in/observation of the day
    useEffect(() => {
        if (isOpen && habit.today_events.length > 0) {
            const lastCheck = habit.today_events
                .filter(e => e.kind === 'check' || e.kind === 'observe')
                .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0]

            if (lastCheck?.meta_json?.completed_mission_ids) {
                setCompletedIds(lastCheck.meta_json.completed_mission_ids)
            } else {
                setCompletedIds([])
            }
        } else {
            setCompletedIds([])
        }
    }, [isOpen, habit])

    if (!isOpen) return null

    const toggleMission = (id: string) => {
        setCompletedIds(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        )
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await onSubmit(completedIds)
            onClose()
        } catch (error) {
            console.error('Error submitting missions:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const missions = habit.missions || []
    const isState = habit.type === 'state'

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center p-4">
            <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-slate-900 p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">
                            {habit.icon || (isState ? '⚠️' : '🎯')}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{habit.name}</h2>
                            <p className="text-sm text-gray-400">
                                {isState ? 'Actions de résistance' : 'Missions du jour'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Missions List */}
                <div className="mb-8 space-y-3">
                    {missions.map((mission) => {
                        const isCompleted = completedIds.includes(mission.id)
                        return (
                            <button
                                key={mission.id}
                                onClick={() => toggleMission(mission.id)}
                                className={`flex w-full items-center gap-4 rounded-xl p-4 transition-all ${isCompleted
                                    ? 'bg-blue-500/20 ring-2 ring-blue-500/50'
                                    : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 size={24} className="text-blue-400" />
                                ) : (
                                    <Circle size={24} className="text-gray-500" />
                                )}
                                <span className={`flex-1 text-left font-medium ${isCompleted ? 'text-white' : 'text-gray-300'}`}>
                                    {mission.title}
                                </span>
                            </button>
                        )
                    })}

                    {missions.length === 0 && (
                        <div className="py-8 text-center text-gray-500">
                            Aucune mission définie.
                        </div>
                    )}
                </div>

                {/* Action */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-4 font-bold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                    {isSubmitting ? 'Enregistrement...' : isState ? 'Continuer' : 'Valider mon avancée'}
                </button>
            </div>
        </div>
    )
}
