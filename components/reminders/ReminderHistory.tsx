'use client';

import { useEffect, useState } from 'react';

interface HistoryItem {
    id: string;
    sent_at: string;
    status: string;
}

export default function ReminderHistory({ habitId }: { habitId: string }) {
    // Placeholder: In a real app, we would fetch from a 'notifications_log' table
    // Since we don't have that yet, we'll show a static or empty state
    // Or we could fetch "past due" reminders from the API if we kept them

    return (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/60">Historique récent</h3>
            <div className="text-xs text-white/30 italic">
                L'historique des notifications apparaîtra ici.
            </div>
        </div>
    );
}
