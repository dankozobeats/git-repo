/**
 * Page détail habitude - VERSION REFACTORISÉE
 *
 * Architecture:
 * - Tous les calculs sont faits côté serveur via /api/habits/[id]/stats
 * - Le composant est un simple Server Component qui fetch et affiche
 * - Plus de calculs côté client (useRiskAnalysis, useHabitStats supprimés)
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export default async function HabitDetailPageNew({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 2. Récupérer les stats depuis l'API (Server-Side)
  // En production, on utiliserait directement les queries Supabase ici
  // Pour l'instant, on simule un fetch vers notre API
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const response = await fetch(`${baseUrl}/api/habits/${id}/stats`, {
    headers: {
      'Cookie': '', // En SSR, il faudrait passer les cookies
    },
    cache: 'no-store', // Désactiver le cache pour toujours avoir les dernières données
  })

  if (!response.ok) {
    notFound()
  }

  const { habit, stats } = await response.json()

  return (
    <div className="min-h-screen bg-[#01030a] p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: habit.color + '20' }}
            >
              {habit.icon || '🎯'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{habit.name}</h1>
              <p className="text-sm text-white/60">
                {habit.type === 'bad' ? 'Mauvaise habitude' : 'Bonne habitude'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Aujourd'hui */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-wide text-white/60">Aujourd'hui</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {stats.todayCount}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {habit.type === 'bad'
                ? stats.todayCount > 0
                  ? `${stats.todayCount} craquage${stats.todayCount > 1 ? 's' : ''}`
                  : 'Aucun craquage'
                : `${stats.todayCount} validation${stats.todayCount > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Streak */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-wide text-white/60">Streak</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {stats.currentStreak}j
            </p>
            <p className="mt-1 text-xs text-white/50">
              {habit.type === 'bad'
                ? `Jours sans craquage`
                : `Jours consécutifs`}
            </p>
          </div>

          {/* 7 jours */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-wide text-white/60">7 jours</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {stats.last7DaysCount}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {habit.type === 'bad' ? 'Craquages' : 'Validations'}
            </p>
          </div>

          {/* Ce mois */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-wide text-white/60">Ce mois</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {stats.monthCompletionRate}%
            </p>
            <p className="mt-1 text-xs text-white/50">Taux de succès</p>
          </div>
        </div>

        {/* Niveau de risque (bad habits only) */}
        {habit.type === 'bad' && (
          <div className="mt-8">
            <div
              className={`rounded-2xl border p-6 ${
                stats.riskLevel === 'danger'
                  ? 'border-red-500/50 bg-red-500/10'
                  : stats.riskLevel === 'warning'
                    ? 'border-yellow-500/50 bg-yellow-500/10'
                    : 'border-green-500/50 bg-green-500/10'
              }`}
            >
              <p className="font-semibold text-white">
                {stats.riskLevel === 'danger' && '⚠️ Attention : Craquage aujourd\'hui'}
                {stats.riskLevel === 'warning' && '⚡ Vigilance : Risque de rechute'}
                {stats.riskLevel === 'good' && '✅ Bien joué : Aucun craquage récent'}
              </p>
              {stats.lastActionDate && (
                <p className="mt-2 text-sm text-white/80">
                  Dernier craquage : {new Date(stats.lastActionDate).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Debug info */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-mono text-white/50">
            ✅ Stats calculées côté serveur - Source: API /habits/{id}/stats
          </p>
          <p className="text-xs font-mono text-white/30 mt-2">
            Total: {stats.totalCount} | Last action: {stats.lastActionDate || 'Jamais'}
          </p>
        </div>
      </div>
    </div>
  )
}
