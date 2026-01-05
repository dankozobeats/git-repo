/**
 * Dashboard Mobile - VERSION REFACTORISÉE
 *
 * Architecture serveur-first :
 * - Server Component léger qui vérifie l'auth
 * - Client Component qui fetch depuis /api/dashboard (avec SWR cache)
 * - Plus de passage de props massives (habits, logs, events)
 * - Plus de calculs côté client (useRiskAnalysis supprimé)
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardMobileClientNew from '@/components/dashboard/DashboardMobileClientNew'
import DashboardViewToggle from '@/components/dashboard/DashboardViewToggle'

export default async function DashboardMobilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#01030a] text-white">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),transparent_50%)]" />

      {/* Container responsive */}
      <div className="relative mx-auto max-w-2xl px-4 py-6 space-y-4 md:max-w-none md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold md:text-3xl">BadHabit Tracker</h1>
            <p className="mt-1 text-sm text-white/60">Dashboard Mobile</p>
          </div>
          <Link
            href="/habits/new"
            className="rounded-xl bg-[#FF4D4D] px-4 py-2 text-sm font-semibold transition active:scale-95"
          >
            + Ajouter
          </Link>
        </div>

        {/* Toggle Dashboard */}
        <div className="flex justify-center pt-2">
          <DashboardViewToggle />
        </div>

        {/* Client component - Fetch data from API */}
        <DashboardMobileClientNew userId={user.id} />

        {/* Actions secondaires */}
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
