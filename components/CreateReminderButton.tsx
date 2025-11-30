'use client';

import { useState } from 'react';

interface CreateReminderButtonProps {
    habitId: string;
    userId: string;
}

export default function CreateReminderButton({ habitId, userId }: CreateReminderButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleCreateReminder = async () => {
        setStatus('loading');
        try {
            // Calculate time for "in 1 minute" for testing
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const timeLocal = `${hours}:${minutes}`;
            const weekday = now.getDay();

            const res = await fetch('/api/reminders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    habit_id: habitId,
                    weekday,
                    time_local: timeLocal,
                }),
            });

            if (!res.ok) throw new Error('Erreur création rappel');

            setStatus('success');

            // Reset status after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <button
            onClick={handleCreateReminder}
            disabled={status === 'loading' || status === 'success'}
            className={`
        px-4 py-2 rounded-xl text-sm font-semibold transition-all border
        ${status === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}
        ${status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            {status === 'loading' && 'Création...'}
            {status === 'success' && '✓ Rappel créé (test 1min)'}
            {status === 'error' && 'Erreur !'}
            {status === 'idle' && '⏰ Créer un rappel test'}
        </button>
    );
}
