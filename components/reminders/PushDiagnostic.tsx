'use client'

import { useState, useEffect } from 'react'
import { urlBase64ToUint8Array } from '@/utils/webpush'

export default function PushDiagnostic() {
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [sub, setSub] = useState<any>(null)
    const [logs, setLogs] = useState<string[]>([])

    const addLog = (m: string) => setLogs(p => [...p.slice(-5), `> ${m}`])

    const [subCount, setSubCount] = useState<number>(0)
    const [isStandalone, setIsStandalone] = useState<boolean>(false)
    const [isIOS, setIsIOS] = useState<boolean>(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone)
            setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
        }
    }, [])

    useEffect(() => {
        if (isOpen && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(setSub)
            })
            // Fetch total subs count for user
            fetch('/api/test-push').then(r => r.json()).then(data => {
                if (data.ok && data.reports) setSubCount(data.reports.length)
            }).catch(() => { })
        }
    }, [isOpen])

    const handleTest = async () => {
        setStatus('loading')
        addLog('Envoi du test...')
        try {
            const res = await fetch('/api/test-push', { method: 'POST' })
            const data = await res.json()
            if (data.ok) {
                setStatus('success')
                addLog('Test envoyé avec succès')
            } else {
                setStatus('error')
                addLog(`Erreur: ${data.error}`)
            }
        } catch (err) {
            setStatus('error')
            addLog('Erreur réseau')
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-[10px] uppercase tracking-widest text-white/20 hover:text-sky-400 transition-colors"
            >
                Afficher les outils de diagnostic
            </button>
        )
    }

    return (
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400">Centre de Diagnostic Push</h3>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white text-xs">Fermer</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2">
                    <p className="text-[10px] text-white/40 uppercase">Abonnement Actuel</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${sub ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {sub ? 'Locally Active' : 'No Local Subscription'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[9px] font-bold">
                            {subCount} device(s) in DB
                        </span>
                    </div>
                    {isIOS && !isStandalone && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-500 leading-tight">
                            ⚠️ iOS détecté : Vous devez "Ajouter à l'écran d'accueil" pour recevoir des notifications.
                        </div>
                    )}
                    <div className="text-[10px] font-mono break-all text-white/60 bg-black/20 p-2 rounded-lg max-h-32 overflow-y-auto">
                        {sub ? JSON.stringify(sub, null, 2) : 'Détails indisponibles'}
                    </div>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-3">
                    <p className="text-[10px] text-white/40 uppercase">Actions de Test</p>
                    <button
                        onClick={handleTest}
                        disabled={status === 'loading'}
                        className="w-full py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-sky-400 transition-colors disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Envoi...' : '⚡ Envoyer une notification de test'}
                    </button>

                    <button
                        onClick={async () => {
                            setStatus('loading')
                            addLog('Triggering Cron...')
                            try {
                                const res = await fetch('/api/process-reminders', {
                                    method: 'POST',
                                    headers: { 'Authorization': 'Bearer b61230a43fb5b3dfdf8cdcf6c94c22b06228a717395b256e51f371cc643fae4f' }
                                })
                                const data = await res.json()
                                addLog(`Cron result: ${data.processed} dus, ${data.sent} sents`)
                                setStatus('success')
                            } catch (e) {
                                addLog('Error triggering cron')
                                setStatus('error')
                            }
                        }}
                        className="w-full py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-[10px] font-bold hover:bg-indigo-500/30 transition-colors"
                    >
                        🔄 Simuler le passage du temps (Process Reminders)
                    </button>
                    <div className="space-y-1 font-mono text-[9px] text-white/40">
                        {logs.map((l, i) => <p key={i}>{l}</p>)}
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-white/30 italic">
                Note : Si le test échoue, essayez de cliquer sur le bouton "Activer les notifications" en haut pour réinitialiser la connexion.
            </p>
        </div>
    )
}
