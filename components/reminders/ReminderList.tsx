'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Reminder {
    id: string;
    time_local: string;
    schedule: string;
    active: boolean;
    timezone: string;
    habit_id: string;
    habits: {
        name: string;
        icon: string | null;
        color: string;
        description: string | null;
    } | null;
}

interface ReminderListProps {
    reminders: Reminder[];
    emptyLabel?: string;
    accent?: 'green' | 'neutral';
}

const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function ReminderList({ reminders, emptyLabel = 'Aucun rappel actif.', accent = 'green' }: ReminderListProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce rappel ?')) return;
        await supabase.from('reminders').delete().eq('id', id);
        router.refresh();
    };

    const toggleActive = async (id: string, current: boolean) => {
        await supabase.from('reminders').update({ active: !current }).eq('id', id);
        router.refresh();
    };

    if (reminders.length === 0) {
        return <div className="text-sm text-white/40 italic">{emptyLabel}</div>;
    }

    return (
        <div className="space-y-3">
            {reminders.map((reminder) => {
                const date = new Date(reminder.time_local);
                // Convert UTC stored time back to display time (approximate for UI list)
                const timeString = date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: reminder.timezone || 'Europe/Paris'
                });

                // Format date for display
                let dateString = '';
                if (reminder.schedule === 'once') {
                    dateString = date.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: reminder.timezone || 'Europe/Paris'
                    });
                } else if (reminder.schedule === 'weekly') {
                    const day = dayNames[date.getUTCDay()];
                    dateString = `Chaque ${day}`;
                } else {
                    dateString = 'Tous les jours';
                }

                const isPast = reminder.schedule === 'once' && date.getTime() < Date.now();

                const habit = reminder.habits;
                const habitColor = habit?.color || '#ffffff';
                const habitIcon = habit?.icon || '🔔';
                const pillColor =
                    accent === 'green'
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                        : 'bg-white/10 border-white/15 text-white/70';
                const statusLabel = reminder.active ? 'Actif' : 'En pause';
                const statusColor = reminder.active ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' : 'bg-white/10 text-white/60 border-white/15';

                return (
                    <div
                        key={reminder.id}
                        className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/30 hover:bg-white/[0.07] shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
                        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
                    >
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 text-lg shadow-inner"
                                    style={{ backgroundColor: `${habitColor}20`, color: habitColor }}
                                >
                                    {habitIcon}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xl font-bold text-white tracking-tight">{timeString}</span>
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${pillColor}`}>
                                            {reminder.schedule === 'once' ? 'Ponctuel' : reminder.schedule === 'daily' ? 'Quotidien' : 'Hebdo'}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                        {isPast && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">Passé</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                                        <span className="font-medium text-white/90 truncate max-w-[240px] sm:max-w-xs">{habit?.name || 'Habitude inconnue'}</span>
                                        <span className="text-white/30">•</span>
                                        <span className="capitalize text-xs text-[#4DD0FB]">{dateString}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs text-white/50">
                                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">{reminder.timezone || 'Europe/Paris'}</span>
                            </div>
                        </div>

                        {/* Description */}
                        {habit?.description && (
                            <p className="line-clamp-2 text-xs text-white/55">{habit.description}</p>
                        )}

                        {/* Footer actions */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            <Link
                                href={`/habits/${reminder.habit_id}`}
                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                                Voir
                            </Link>

                            <button
                                onClick={() => toggleActive(reminder.id, reminder.active)}
                                className={`rounded-lg border border-white/10 px-3 py-2 text-xs font-medium transition ${reminder.active
                                    ? 'bg-white/5 text-yellow-400 hover:bg-yellow-400/10'
                                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                    }`}
                            >
                                {reminder.active ? 'Pause' : 'Activer'}
                            </button>

                            <button
                                onClick={() => handleDelete(reminder.id)}
                                className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/40 transition hover:bg-red-500/20 hover:text-red-400"
                                title="Supprimer"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
