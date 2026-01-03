'use client'

/**
 * Dashboard V2 - Composant client qui orchestre l'affichage
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRiskAnalysis } from '@/lib/habits/useRiskAnalysis'
import { usePatternDetection } from '@/lib/habits/usePatternDetection'
import FocusAlert from './FocusAlert'
import RiskHabitCard from './RiskHabitCard'
import AdaptiveCoachMessage from './AdaptiveCoachMessage'
import PatternInsights from './PatternInsights'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']

type DashboardV2ClientProps = {
  habits: Habit[]
  logs: Log[]
  events: Event[]
  userId: string
}

export default function DashboardV2Client({
  habits,
  logs,
  events,
  userId,
}: DashboardV2ClientProps) {
  const router = useRouter()
  const { topRisks, remainingHabits, globalState } = useRiskAnalysis(habits, logs, events)
  const patternInsights = usePatternDetection(habits, logs, events)

  const handleQuickAction = async (
    habitId: string,
    action: 'validate' | 'relapse' | 'substitute'
  ) => {
    try {
      if (action === 'validate') {
        // Valider une bonne habitude pour aujourd'hui
        await fetch(`/api/habits/${habitId}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            value: 1,
          }),
        })
      } else if (action === 'relapse') {
        // Signaler un craquage
        await fetch(`/api/habits/${habitId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
          }),
        })
      } else if (action === 'substitute') {
        // Action de substitution - rediriger vers la page de l'habitude
        router.push(`/habits/${habitId}`)
        return
      }

      // Rafraîchir la page après l'action
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de l\'action rapide:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerte principale */}
      <FocusAlert globalState={globalState} />

      {/* Top 3 habitudes à risque */}
      {topRisks.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            Top 3 priorités aujourd'hui
          </h2>
          <div className="space-y-3">
            {topRisks.map(habit => (
              <RiskHabitCard
                key={habit.id}
                habit={habit}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm text-white/60">
            Aucune habitude active. Commence par en ajouter une!
          </p>
        </div>
      )}

      {/* Message du coach adaptatif */}
      <AdaptiveCoachMessage globalState={globalState} />

      {/* Autres habitudes à faire aujourd'hui */}
      {remainingHabits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
            Autres habitudes à faire
          </h2>
          <div className="space-y-3">
            {remainingHabits.map(habit => (
              <RiskHabitCard
                key={habit.id}
                habit={habit}
                onQuickAction={handleQuickAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Patterns inconscients détectés */}
      <PatternInsights insights={patternInsights} />
    </div>
  )
}
