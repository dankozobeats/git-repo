/**
 * Dashboard principal - Avec toggle entre version mobile et classique
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardWrapper from '@/components/dashboard/DashboardWrapper'
import DashboardViewToggle from '@/components/dashboard/DashboardViewToggle'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Charger toutes les données en parallèle
  const [habitsRes, logsRes, eventsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('completed_date', getDateDaysAgo(30))
      .order('completed_date', { ascending: false }),
    supabase
      .from('habit_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', getDateDaysAgo(30))
      .order('event_date', { ascending: false }),
  ])

  const habits = habitsRes.data || []
  const logs = logsRes.data || []
  const events = eventsRes.data || []

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#01030a] text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),transparent_50%)]" />

      {/* Container responsive: mobile max-w-2xl, desktop pleine largeur avec padding */}
      <div className="relative mx-auto max-w-2xl px-4 py-6 space-y-4 md:max-w-none md:px-8 lg:px-12">
        {/* Toggle Dashboard - À la même hauteur que dashboard-old */}
        <div className="flex justify-center px-4 pt-12">
          <DashboardViewToggle />
        </div>

        {/* Dashboard avec switch Classic/Mobile */}
        {habits.length > 0 ? (
          <DashboardWrapper
            userId={user.id}
            habits={habits}
            logs={logs}
            events={events}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <p className="text-lg font-semibold">Commence par créer une habitude</p>
            <p className="mt-2 text-sm text-white/60">
              Choisis un objectif ou une mauvaise habitude à surveiller
            </p>
            <Link
              href="/habits/new"
              className="mt-4 inline-block rounded-xl bg-[#FF4D4D] px-6 py-3 text-sm font-semibold transition active:scale-95"
            >
              Créer ma première habitude
            </Link>
          </div>
        )}

        {/* Actions secondaires - Grid responsive */}
        <div className="grid gap-3 pt-4 sm:grid-cols-2 md:grid-cols-2">
          <Link
            href="/habits/stats"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
          >
            <p className="text-sm font-semibold">📈 Stats détaillées</p>
            <p className="mt-1 text-xs text-white/50">Analyse approfondie</p>
          </Link>

          <Link
            href="/dashboard-advanced"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
          >
            <p className="text-sm font-semibold">🧠 Patterns</p>
            <p className="mt-1 text-xs text-white/50">Détection IA</p>
          </Link>
        </div>
      </div>
    </main>
  )
}

function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}
