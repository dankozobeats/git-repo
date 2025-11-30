'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Reminder {
    id: string;
    time_local: string;
    schedule: string;
    active: boolean;
    timezone: string;
}

interface ReminderListProps {
    reminders: Reminder[];
}

export default function ReminderList({ reminders }: ReminderListProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleDelete = async (id: string) => {
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
                // Ideally we use the stored timezone to format
                const timeString = date.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: reminder.timezone || 'Europe/Paris'
                });

                return (
                    <div key={reminder.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${reminder.active ? 'bg-green-400' : 'bg-white/20'}`} />
                            <div>
                                <div className="font-mono text-lg font-medium text-white">
                                    {timeString}
                                </div>
                                <div className="text-xs text-white/50 capitalize">
                                    {reminder.schedule === 'once' ? 'Une fois' :
                                        reminder.schedule === 'daily' ? 'Tous les jours' : 'Hebdomadaire'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleActive(reminder.id, reminder.active)}
                                className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
                                title={reminder.active ? "Désactiver" : "Activer"}
                            >
                                {reminder.active ? '⏸️' : '▶️'}
                            </button>
                            <button
                                onClick={() => handleDelete(reminder.id)}
                                className="rounded-lg p-2 text-white/40 hover:bg-red-500/20 hover:text-red-400"
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
