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
            setTimeout(() => setStatus('idle'), 3000); // Reset after 3s
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    return (
        <button
            onClick={handleCreateReminder}
            disabled={status === 'loading' || status === 'success'}
            className={`
        px-4 py-2 rounded-lg text-sm font-medium transition
        ${status === 'success' ? 'bg-green-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}
        ${status === 'error' ? 'bg-red-600' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
        >
            {status === 'loading' && 'Création...'}
            {status === 'success' && 'Rappel créé !'}
            {status === 'error' && 'Erreur'}
            {status === 'idle' && '⏰ Créer un rappel (test 1min)'}
        </button>
    );
}
