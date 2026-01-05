'use client'

/**
 * Page admin pour nettoyer les doublons d'événements
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CleanupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  async function cleanupAllHabits() {
    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      // Récupérer toutes les habitudes
      const habitsRes = await fetch('/api/habits')
      if (!habitsRes.ok) throw new Error('Failed to fetch habits')

      const { habits } = await habitsRes.json()

      // Nettoyer chaque habitude en mode binaire
      const cleanupPromises = habits
        .filter((h: any) => h.tracking_mode !== 'counter')
        .map(async (habit: any) => {
          const res = await fetch(`/api/habits/${habit.id}/events/cleanup-duplicates`, {
            method: 'POST'
          })
          const data = await res.json()
          return {
            habitId: habit.id,
            habitName: habit.name,
            ...data
          }
        })

      const results = await Promise.all(cleanupPromises)
      setResults(results)

      // Rafraîchir la page après nettoyage
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0)

  return (
    <div className="min-h-screen bg-[#01030a] p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Nettoyage des doublons</h1>
          <p className="mt-2 text-sm text-white/60">
            Supprime les événements en double pour les habitudes en mode binaire
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="mb-4 text-white/80">
            Cette opération va parcourir toutes vos habitudes en mode binaire et supprimer
            les événements en double pour chaque jour (garde uniquement le premier).
          </p>

          <button
            onClick={cleanupAllHabits}
            disabled={isLoading}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Nettoyage en cours...' : 'Nettoyer toutes les habitudes'}
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 text-red-300">
            <p className="font-semibold">Erreur:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-green-500/50 bg-green-500/10 p-4">
              <p className="text-lg font-semibold text-green-300">
                ✅ Nettoyage terminé !
              </p>
              <p className="text-sm text-green-200">
                {totalDeleted} doublon(s) supprimé(s) au total
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Détails par habitude:</h2>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{result.habitName}</p>
                      <p className="text-sm text-white/60">
                        {result.deleted || 0} doublon(s) supprimé(s)
                      </p>
                    </div>
                    {result.deleted > 0 && (
                      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
                        {result.deleted}
                      </span>
                    )}
                  </div>
                  {result.daysAffected && result.daysAffected.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-white/50">
                        Jours affectés: {result.daysAffected.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold transition hover:bg-white/10"
            >
              Retour au dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
