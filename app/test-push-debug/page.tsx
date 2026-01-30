'use client'

import { useState, useEffect } from 'react'
import { urlBase64ToUint8Array } from '@/utils/webpush'

export default function PushDebugPage() {
    const [swStatus, setSwStatus] = useState<string>('Checking...')
    const [subData, setSubData] = useState<any>(null)
    const [vapidKey, setVapidKey] = useState<string>('')
    const [log, setLog] = useState<string[]>([])

    const addLog = (msg: string) => setLog(prev => [...prev.slice(-10), `> ${msg}`])

    useEffect(() => {
        setVapidKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'MISSING')

        if (!('serviceWorker' in navigator)) {
            setSwStatus('Not supported')
            return
        }

        navigator.serviceWorker.ready.then(reg => {
            setSwStatus('Ready')
            reg.pushManager.getSubscription().then(sub => {
                setSubData(sub ? sub.toJSON() : 'No subscription found')
            })
        })
    }, [])

    const sendTest = async () => {
        addLog('Sending test request...')
        try {
            const res = await fetch('/api/test-push', { method: 'POST' })
            const data = await res.json()
            addLog(`Server response: ${JSON.stringify(data)}`)
        } catch (err: any) {
            addLog(`Error: ${err.message}`)
        }
    }

    const resubscribe = async () => {
        addLog('Attempting Force Reset (Unsubscribe -> Subscribe)...')
        try {
            const reg = await navigator.serviceWorker.ready

            // 1. Unsubscribe existing
            const existingSub = await reg.pushManager.getSubscription()
            if (existingSub) {
                addLog('Existing sub found, unsubscribing...')
                await existingSub.unsubscribe()
            }

            // 2. Subscribe with new key
            addLog(`Subscribing with key: ${vapidKey.slice(0, 10)}...`)
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            })
            setSubData(sub.toJSON())

            // 3. Update DB
            addLog('Sending new subscription to server...')
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...sub.toJSON() })
            })

            if (!res.ok) throw new Error(`Server failed: ${res.status}`)
            addLog('SUCCESS: Subscribed & DB Updated')
        } catch (err: any) {
            addLog(`ERROR: ${err.message}`)
            console.error(err)
        }
    }

    return (
        <div className="p-8 space-y-6 bg-black min-h-screen text-white font-mono text-xs">
            <h1 className="text-xl font-bold text-sky-400">NOTIFICATIONS DEBUG CONSOLE</h1>

            <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/20 p-4 rounded-xl space-y-2">
                    <p className="font-bold">CLIENT STATE</p>
                    <p>SW Status: <span className="text-sky-400">{swStatus}</span></p>
                    <p className="truncate">VAPID Key: <span className="text-sky-400">{vapidKey}</span></p>
                </div>

                <div className="border border-white/20 p-4 rounded-xl space-y-2">
                    <p className="font-bold">ACTIONS</p>
                    <div className="flex gap-2">
                        <button onClick={resubscribe} className="bg-sky-500 px-3 py-1 rounded">Resubscribe</button>
                        <button onClick={sendTest} className="bg-white text-black px-3 py-1 rounded">Trigger API Test</button>
                    </div>
                </div>
            </div>

            <div className="border border-white/20 p-4 rounded-xl space-y-2">
                <p className="font-bold">CURRENT SUBSCRIPTION DATA</p>
                <pre className="bg-white/5 p-2 rounded overflow-x-auto max-h-40">
                    {JSON.stringify(subData, null, 2)}
                </pre>
            </div>

            <div className="border border-white/20 p-4 rounded-xl space-y-2 bg-zinc-900">
                <p className="font-bold">CONSOLE LOGS</p>
                <div className="space-y-1">
                    {log.map((l, i) => <p key={i}>{l}</p>)}
                </div>
            </div>
        </div>
    )
}
