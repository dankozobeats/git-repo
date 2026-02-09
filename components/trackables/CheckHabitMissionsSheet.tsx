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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
            {/* Background overlay to close on click */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-2xl bg-[#0f111a] shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden border-t border-white/10 sm:border">
                {/* Mobile Drag Handle */}
                <div className="flex justify-center py-2 sm:hidden">
                    <div className="h-1.5 w-12 rounded-full bg-white/20" />
                </div>

                {/* Header - Fixed */}
                <div className="px-6 pt-2 pb-4 sm:pt-6 sm:pb-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-2xl shadow-inner shadow-blue-500/20">
                            {habit.icon || (isState ? '⚠️' : '🎯')}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold text-white truncate">{habit.name}</h2>
                            <p className="text-xs font-medium uppercase tracking-wider text-blue-400/60">
                                {isState ? 'Actions de résistance' : 'Missions du jour'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Missions List - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 custom-scrollbar">
                    {missions.map((mission) => {
                        const isCompleted = completedIds.includes(mission.id)
                        return (
                            <button
                                key={mission.id}
                                onClick={() => toggleMission(mission.id)}
                                className={`group flex w-full items-start gap-4 rounded-2xl p-4 transition-all duration-200 ${isCompleted
                                    ? 'bg-blue-600/10 border border-blue-500/30'
                                    : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                                    }`}
                            >
                                <div className="mt-0.5">
                                    {isCompleted ? (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    ) : (
                                        <Circle size={24} className="text-white/20 group-hover:text-white/40 transition-colors" />
                                    )}
                                </div>
                                <span className={`flex-1 text-left text-sm leading-relaxed sm:text-base font-medium ${isCompleted ? 'text-white' : 'text-white/70'}`}>
                                    {mission.title}
                                </span>
                            </button>
                        )
                    })}

                    {missions.length === 0 && (
                        <div className="py-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-3xl opacity-20">
                                📭
                            </div>
                            <p className="text-sm text-white/40">Aucune mission définie pour cette habitude.</p>
                        </div>
                    )}
                </div>

                {/* Action - Fixed at bottom */}
                <div className="p-6 border-t border-white/5 bg-gradient-to-t from-black/20 to-transparent">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="relative w-full group overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-[1px] font-bold text-white shadow-lg transition-all hover:shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#0f111a]/10 px-8 py-4 backdrop-blur-3xl transition group-hover:bg-transparent">
                            <span className="relative z-10 flex items-center gap-2">
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                        Chargement...
                                    </>
                                ) : (
                                    <>
                                        {isState ? 'Valider les actions' : 'Enregistrer mon avancée'}
                                        <CheckCircle2 size={18} />
                                    </>
                                )}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
