export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

const CRON_SECRET = process.env.CRON_SECRET
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY) } catch {}
}

// GET: route appelée par un cron (Vercel ou VPS) pour envoyer les rappels dus
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') || ''
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // 1) Récupérer tous les rappels actifs
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('id, user_id, habit_id, channel, schedule, time_local, weekday, active')
    .eq('active', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2) Filtrer par heure locale (approx: on envoie si time_local == heure actuelle en HH:MM)
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const currentHM = `${hh}:${mm}`
  const weekday = now.getDay() // 0-6

  const due = (reminders || []).filter(r => {
    if (r.time_local !== currentHM) return false
    if (r.schedule === 'weekly' && r.weekday !== weekday) return false
    return true
  })

  let sent = 0
  let errors: Array<{ id: string; error: string }> = []

  for (const r of due) {
    if (r.channel === 'push') {
      // 3) Récupérer les subscriptions de l'user
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', r.user_id)

      for (const sub of subs || []) {
        try {
          const payload = JSON.stringify({
            title: 'Rappel BadHabit',
            body: 'Il est temps de tenir ton habitude.',
            data: { url: `/habits/${r.habit_id}` },
          })
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any, payload)
          sent++
        } catch (e: any) {
          errors.push({ id: r.id, error: e?.message || 'push error' })
        }
      }
    }
    // TODO: email/in-app canaux (à implémenter ensuite)
  }

  return NextResponse.json({ success: true, checked: reminders?.length || 0, due: due.length, sent, errors })
}
