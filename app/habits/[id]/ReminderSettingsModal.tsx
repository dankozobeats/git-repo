"use client"
import { useEffect, useState } from "react"

type Props = {
  habitId: string
  onClose?: () => void
}

export default function ReminderSettingsModal({ habitId, onClose }: Props) {
  const [channel, setChannel] = useState<'push'|'email'|'inapp'>('push')
  const [schedule, setSchedule] = useState<'daily'|'weekly'>('daily')
  const [timeLocal, setTimeLocal] = useState('08:00')
  const [weekday, setWeekday] = useState<number>(1) // Lundi
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    setError(null); setOk(null)
  }, [channel, schedule, timeLocal, weekday])

  async function enablePush() {
    try {
      if (!('Notification' in window)) throw new Error('API Notification indisponible')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') throw new Error('Permission refusée')

      const reg = await navigator.serviceWorker.register('/sw.js')
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublic) throw new Error('Clé VAPID publique manquante')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      })

      const res = await fetch(`/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk('Notifications push activées ✅')
    } catch (e: any) {
      setError(e?.message || 'Erreur activation push')
    }
  }

  async function saveReminder() {
    setSaving(true); setError(null); setOk(null)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, channel, schedule, timeLocal, weekday, active: true }),
      })
      if (!res.ok) throw new Error(await res.text())
      setOk('Rappel enregistré ✅')
    } catch (e: any) {
      setError(e?.message || 'Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-xl p-6 w-[520px] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Rappels & Notifications</h2>
          <button className="text-sm text-zinc-400 hover:text-zinc-200" onClick={onClose}>Fermer</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Canal</label>
            <select className="w-full bg-zinc-800 rounded p-2" value={channel} onChange={e=>setChannel(e.target.value as any)}>
              <option value="push">Push Web</option>
              <option value="email">Email</option>
              <option value="inapp">In-app</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Fréquence</label>
              <select className="w-full bg-zinc-800 rounded p-2" value={schedule} onChange={e=>setSchedule(e.target.value as any)}>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Heure locale</label>
              <input type="time" className="w-full bg-zinc-800 rounded p-2" value={timeLocal} onChange={e=>setTimeLocal(e.target.value)} />
            </div>
          </div>

          {schedule === 'weekly' && (
            <div>
              <label className="block text-sm mb-1">Jour de la semaine</label>
              <select className="w-full bg-zinc-800 rounded p-2" value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>
                <option value={0}>Dimanche</option>
                <option value={1}>Lundi</option>
                <option value={2}>Mardi</option>
                <option value={3}>Mercredi</option>
                <option value={4}>Jeudi</option>
                <option value={5}>Vendredi</option>
                <option value={6}>Samedi</option>
              </select>
            </div>
          )}

          {channel === 'push' && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2" onClick={enablePush}>
              Activer notifications push
            </button>
          )}

          <div className="flex items-center gap-3">
            <button className="bg-green-600 hover:bg-green-700 text-white rounded px-3 py-2" onClick={saveReminder} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer le rappel'}
            </button>
            {ok && <span className="text-green-400 text-sm">{ok}</span>}
            {error && <span className="text-red-400 text-sm">{error}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}
