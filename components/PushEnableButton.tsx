'use client';

import { useState, useEffect } from 'react';
import { urlBase64ToUint8Array } from '@/utils/webpush';

interface PushEnableButtonProps {
    userId?: string;
}

export default function PushEnableButton({ userId }: PushEnableButtonProps) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'unsupported'>('idle');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        // Check if SW is supported and if already subscribed
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus('unsupported');
            return;
        }

        // Check existing subscription
        navigator.serviceWorker.ready.then((registration) => {
            registration.pushManager.getSubscription().then((subscription) => {
                if (subscription) {
                    setStatus('success');
                }
            });
        });
    }, []);

    const handleSubscribe = async () => {
        setStatus('loading');
        setMsg('');
        try {
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker non supporté par ce navigateur');
            }

            // 1. Register Service Worker (using relative path)
            console.log('Registering SW...');
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            console.log('SW Registered:', registration);

            // 2. Check permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Permission de notification refusée');
            }

            // 3. Subscribe to Push
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidKey) throw new Error('VAPID Public Key manquante dans la config');

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            // 4. Send to Backend
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...subscription.toJSON(), userId })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Erreur API subscribe');
            }

            setStatus('success');
            console.log('Push notification subscription successful');
        } catch (err: any) {
            console.error('Subscription error:', err);
            setStatus('error');
            setMsg(err.message || 'Une erreur inconnue est survenue');
        }
    };

    if (status === 'unsupported') {
        return <span className="text-gray-500 text-xs">Notifications non supportées</span>;
    }

    if (status === 'success') {
        return (
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                <span className="text-lg">✓</span>
                <span className="text-sm font-medium">Notifications activées</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-start gap-2">
            <button
                onClick={handleSubscribe}
                disabled={status === 'loading'}
                className={`
          relative overflow-hidden px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all
          ${status === 'loading' ? 'bg-indigo-600/50 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20'}
          active:scale-95
        `}
            >
                {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Activation...
                    </span>
                ) : (
                    '🔔 Activer les notifications'
                )}
            </button>
            {status === 'error' && (
                <p className="text-red-400 text-xs max-w-[200px] leading-tight">
                    {msg}
                </p>
            )}
        </div>
    );
}
