'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface ReminderSettingsProps {
    habitId: string;
    userId: string;
    onSuccess?: () => void;
}

export default function ReminderSettings({ habitId, userId, onSuccess }: ReminderSettingsProps) {
    const [time, setTime] = useState('09:00');
    const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly'>('daily');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const router = useRouter();

    const daysOfWeek = [
        { id: 1, label: 'L' },
        { id: 2, label: 'M' },
        { id: 3, label: 'M' },
        { id: 4, label: 'J' },
        { id: 5, label: 'V' },
        { id: 6, label: 'S' },
        { id: 0, label: 'D' },
    ];

    const toggleDay = (dayId: number) => {
        if (selectedDays.includes(dayId)) {
            setSelectedDays(selectedDays.filter(d => d !== dayId));
        } else {
            setSelectedDays([...selectedDays, dayId]);
        }
    };

    const handleSubmit = async () => {
        setStatus('loading');
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Construct local time string for today to send to API
            // The API will handle the recurrence logic based on this base time
            const now = new Date();
            const [hours, minutes] = time.split(':');
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');

            const timeLocal = `${year}-${month}-${day} ${hours}:${minutes}`;

            const res = await fetch('/api/reminders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    habit_id: habitId,
                    time_local: timeLocal,
                    timezone,
                    schedule: recurrence,
                    days: recurrence === 'weekly' ? selectedDays : null
                }),
            });

            if (!res.ok) throw new Error('Erreur création rappel');

            setStatus('success');
            setTimeout(() => {
                setStatus('idle');
                if (onSuccess) onSuccess();
                router.refresh();
            }, 2000);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white/80">Nouveau rappel</h3>

            {/* Time Picker */}
            <div className="flex items-center gap-4">
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xl font-bold text-white focus:border-white/30 focus:outline-none"
                />
            </div>

            {/* Recurrence Selector */}
            <div className="flex gap-2">
                {(['once', 'daily', 'weekly'] as const).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRecurrence(r)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${recurrence === r
                                ? 'bg-white text-black'
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        {r === 'once' && 'Une fois'}
                        {r === 'daily' && 'Tous les jours'}
                        {r === 'weekly' && 'Hebdo'}
                    </button>
                ))}
            </div>

            {/* Days Selector (Weekly) */}
            {recurrence === 'weekly' && (
                <div className="flex justify-between gap-1">
                    {daysOfWeek.map((day) => (
                        <button
                            key={day.id}
                            onClick={() => toggleDay(day.id)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${selectedDays.includes(day.id)
                                    ? 'bg-[#4DD0FB] text-black'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                                }`}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={status === 'loading' || status === 'success'}
                className={`mt-2 flex items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition ${status === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white text-black hover:bg-white/90'
                    } disabled:opacity-50`}
            >
                {status === 'loading' ? 'Création...' : status === 'success' ? 'Rappel créé !' : 'Enregistrer le rappel'}
            </button>
        </div>
    );
}
