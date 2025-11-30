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
            // 🕒 Rappel dans 1 minute
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1);

            // Extraction manuelle des composants locaux
            // On veut "YYYY-MM-DD HH:mm"
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            const timeLocal = `${year}-${month}-${day} ${hours}:${minutes}`;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const res = await fetch('/api/reminders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    habit_id: habitId,
                    time_local: timeLocal,   // → ex "2025-11-30 04:12"
                    timezone,                // → ex "Europe/Paris"
                }),
            });

            if (!res.ok) throw new Error('Erreur création rappel');

            setStatus('success');
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
            {status === 'success' && '✓ Rappel créé (test 1 min)'}
            {status === 'error' && 'Erreur !'}
            {status === 'idle' && '⏰ Créer un rappel test'}
        </button>
    );
}
