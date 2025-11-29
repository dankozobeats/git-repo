'use client';

import { useState } from 'react';
import { urlBase64ToUint8Array } from '@/utils/webpush';

interface PushEnableButtonProps {
    userId?: string; // Optional for now, to match requested signature
}

export default function PushEnableButton({ userId }: PushEnableButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleSubscribe = async () => {
        setStatus('loading');
        try {
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker non supporté');
            }

            // 1. Register SW
            const register = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // 2. Subscribe
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
            if (!vapidKey) throw new Error('VAPID Public Key manquante');

            const subscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            // 3. Send to API
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...subscription, userId }) // Pass userId if needed by API (though API gets it from session)
            });

            if (!res.ok) throw new Error('Erreur API subscribe');

            setStatus('success');
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMsg(err.message);
        }
    };

    if (status === 'success') {
        return <span className="text-green-600 font-bold">✓ Notifications activées</span>;
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleSubscribe}
                disabled={status === 'loading'}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
                {status === 'loading' ? 'Activation...' : '🔔 Activer les notifications'}
            </button>
            {status === 'error' && <span className="text-red-500 text-sm">{msg}</span>}
        </div>
    );
}
