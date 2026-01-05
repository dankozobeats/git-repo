/**
 * Dashboard principal - Avec toggle entre version mobile et classique
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardMobileClient from '@/components/dashboard/DashboardMobileClient'

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
    <main className="min-h-screen bg-[#01030a] text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),transparent_50%)]" />

      {/* Container responsive: mobile max-w-2xl, desktop pleine largeur avec padding */}
      <div className="relative mx-auto max-w-2xl px-4 py-6 space-y-4 md:max-w-none md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold md:text-3xl">BadHabit Tracker</h1>
            <p className="mt-1 text-sm text-white/60">
              {habits.length} habitude{habits.length > 1 ? 's' : ''} active{habits.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard-old"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition hover:bg-white/10 active:scale-95"
              title="Dashboard Classique"
            >
              <span className="hidden sm:inline">📊 Classique</span>
              <span className="sm:hidden">📊</span>
            </Link>
            <Link
              href="/habits/new"
              className="rounded-xl bg-[#FF4D4D] px-4 py-2 text-sm font-semibold transition active:scale-95"
            >
              + Ajouter
            </Link>
          </div>
        </div>

        {/* Client component avec priorités + patterns */}
        {habits.length > 0 ? (
          <DashboardMobileClient
            habits={habits}
            logs={logs}
            events={events}
            userId={user.id}
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
        <div className="grid gap-3 pt-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/dashboard-old"
            className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-4 text-center transition hover:bg-purple-500/20 lg:col-span-2"
          >
            <p className="text-sm font-semibold">📊 Dashboard Classique</p>
            <p className="mt-1 text-xs text-purple-200/70">Version complète</p>
          </Link>

          <Link
            href="/habits/stats"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10 lg:col-span-2"
          >
            <p className="text-sm font-semibold">📈 Stats détaillées</p>
            <p className="mt-1 text-xs text-white/50">Analyse approfondie</p>
          </Link>

          <Link
            href="/dashboard-advanced"
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10 lg:col-span-2"
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
