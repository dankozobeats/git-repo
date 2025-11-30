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
}

export default function ReminderList({ reminders }: ReminderListProps) {
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
        return <div className="text-sm text-white/40 italic">Aucun rappel actif.</div>;
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
                    // Get day name from the date
                    dateString = date.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        timeZone: reminder.timezone || 'Europe/Paris'
                    });
                    dateString = `Chaque ${dateString}`;
                } else {
                    dateString = 'Tous les jours';
                }

                const habit = reminder.habits;
                const habitColor = habit?.color || '#ffffff';
                const habitIcon = habit?.icon || '🔔';

                return (
                    <div key={reminder.id} className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
                        {/* Info Habitude & Heure */}
                        <div className="flex items-center gap-4">
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-xl shadow-inner"
                                style={{ backgroundColor: `${habitColor}20`, color: habitColor }}
                            >
                                {habitIcon}
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xl font-bold text-white tracking-tight">
                                        {timeString}
                                    </span>
                                    <span className={`inline-flex h-2 w-2 rounded-full ${reminder.active ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-white/20'}`} />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/60">
                                    <span className="font-medium text-white/90">{habit?.name || 'Habitude inconnue'}</span>
                                    <span>•</span>
                                    <span className="capitalize text-xs opacity-70 text-[#4DD0FB]">
                                        {dateString}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0">
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
