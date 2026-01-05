/**
 * Dashboard Advanced - Analyse approfondie avec détection de patterns
 * Pour desktop : analyse comportementale + insights psychologiques
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardV2Client from '@/components/dashboard/DashboardV2Client'
import { getLocalDateDaysAgo } from '@/lib/utils/date'

export default async function DashboardAdvanced() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Charger TOUTES les données nécessaires côté serveur
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
      .gte('completed_date', getLocalDateDaysAgo(30)) // Derniers 30 jours
      .order('completed_date', { ascending: false }),
    supabase
      .from('habit_events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', getLocalDateDaysAgo(30))
      .order('event_date', { ascending: false }),
  ])

  const habits = habitsRes.data || []
  const logs = logsRes.data || []
  const events = eventsRes.data || []

  return (
    <main className="relative min-h-screen bg-[#01030a] text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_50%)]" />

      <div className="relative mx-auto max-w-2xl px-4 py-6 space-y-4 md:max-w-none md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Dashboard Advanced
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Analyse comportementale approfondie
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
          >
            ← Dashboard quotidien
          </Link>
        </div>

        {/* Client component with all the logic */}
        <DashboardV2Client
          habits={habits}
          logs={logs}
          events={events}
          userId={user.id}
        />

        {/* Secondary actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/habits/stats"
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
          >
            <p className="text-sm font-semibold text-white">
              📊 Analyser mes patterns
            </p>
            <p className="mt-1 text-xs text-white/60">
              Vue détaillée de tes habitudes
            </p>
          </Link>

          <Link
            href="/habits/new"
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
          >
            <p className="text-sm font-semibold text-white">
              ➕ Ajouter une habitude
            </p>
            <p className="mt-1 text-xs text-white/60">
              Tracker un nouveau comportement
            </p>
          </Link>
        </div>

        {/* Link to see all habits */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-sm text-white/50 transition hover:text-white/80"
          >
            Voir toutes les habitudes ({habits.length}) →
          </Link>
        </div>
      </div>
    </main>
  )
}

