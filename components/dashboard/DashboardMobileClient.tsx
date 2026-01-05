'use client'

/**
 * Dashboard Mobile - Version compacte et mobile-first
 * Combine priorités + patterns dans une interface légère
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, MoreVertical, LayoutGrid, List } from 'lucide-react'
import { formatTimeSince } from '@/lib/utils/date'
import Link from 'next/link'
import { useRiskAnalysis } from '@/lib/habits/useRiskAnalysis'
import { usePatternDetection } from '@/lib/habits/usePatternDetection'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Log = Database['public']['Tables']['logs']['Row']
type Event = Database['public']['Tables']['habit_events']['Row']

type DashboardMobileClientProps = {
  habits: Habit[]
  logs: Log[]
  events: Event[]
  userId: string
}

export default function DashboardMobileClient({
  habits,
  logs,
  events,
  userId,
}: DashboardMobileClientProps) {
  const router = useRouter()
  const { topRisks, remainingHabits, globalState } = useRiskAnalysis(habits, logs, events)
  const patternInsights = usePatternDetection(habits, logs, events)
  const [showPatterns, setShowPatterns] = useState(false)
  const [loadingHabit, setLoadingHabit] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Charger la préférence depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-view-mode')
    if (saved === 'grid' || saved === 'list') {
      setViewMode(saved)
    }
  }, [])

  // Sauvegarder la préférence dans localStorage
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('dashboard-view-mode', mode)
  }

  const handleQuickAction = async (
    habitId: string,
    action: 'validate' | 'relapse' | 'substitute'
  ) => {
    setLoadingHabit(habitId)
    try {
      let res: Response | null = null

      if (action === 'validate') {
        res = await fetch(`/api/habits/${habitId}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            value: 1,
          }),
        })
      } else if (action === 'relapse') {
        res = await fetch(`/api/habits/${habitId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString().split('T')[0],
          }),
        })
      } else if (action === 'substitute') {
        router.push(`/habits/${habitId}`)
        return
      }

      if (res && !res.ok) {
        const errorText = await res.text()
        throw new Error(`Erreur API: ${errorText}`)
      }

      router.refresh()
    } catch (error) {
      console.error('Erreur action rapide:', error)
      alert('Impossible d\'enregistrer l\'action. Vérifie ta connexion.')
    } finally {
      setLoadingHabit(null)
    }
  }

  const handleDelete = async (habitId: string, habitName: string) => {
    if (!confirm(`Supprimer "${habitName}" et tous ses logs ?`)) return

    setLoadingHabit(habitId)
    try {
      const res = await fetch(`/api/habits/${habitId}/delete`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (error) {
      console.error('Erreur suppression:', error)
    } finally {
      setLoadingHabit(null)
      setOpenMenuId(null)
    }
  }

  // Config couleurs selon niveau de risque
  const alertConfig = {
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-200',
      badge: '🔴',
    },
    warning: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-200',
      badge: '🟠',
    },
    good: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-200',
      badge: '🟢',
    },
  }

  const currentAlert = alertConfig[globalState.riskLevel]

  return (
    <div className="space-y-4">
      {/* Alerte principale compacte */}
      <div className={`rounded-2xl border ${currentAlert.border} ${currentAlert.bg} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-white/50">Focus</p>
            <p className={`mt-1 text-sm font-semibold ${currentAlert.text}`}>
              {globalState.message}
            </p>
          </div>
          <span className="text-2xl">{currentAlert.badge}</span>
        </div>
      </div>

      {/* Toggle Vue Carte/Liste */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Priorités du jour
        </h2>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewMode === 'grid'
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white'
            }`}
            title="Vue carte"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cartes</span>
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              viewMode === 'list'
                ? 'bg-white/15 text-white'
                : 'text-white/50 hover:text-white'
            }`}
            title="Vue liste"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Liste</span>
          </button>
        </div>
      </div>

      {/* Top 3 priorités - Version compacte */}
      {topRisks.length > 0 && (
        <div className="space-y-3">
          <div className={viewMode === 'grid' ? 'grid gap-3 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {topRisks.map((habit, index) => {
            const isLoading = loadingHabit === habit.id
            const riskConfig = {
              critical: { border: 'border-red-500/30', bg: 'bg-red-500/5' },
              warning: { border: 'border-orange-500/30', bg: 'bg-orange-500/5' },
              good: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
            }
            const config = riskConfig[habit.riskLevel]

            return (
              <div
                key={habit.id}
                className={`rounded-xl border ${config.border} ${config.bg} p-3 cursor-pointer transition hover:bg-white/5`}
                onClick={() => router.push(`/habits/${habit.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{index === 0 ? '🎯' : index === 1 ? '⚡' : '💪'}</span>
                      <h3 className="text-sm font-semibold text-white truncate">{habit.name}</h3>
                    </div>
                    <p className="mt-1 text-xs text-white/60">{habit.message}</p>
                    {habit.type === 'bad' && habit.todayCount > 0 && (
                      <p className="mt-0.5 text-xs font-semibold text-red-300">
                        {habit.todayCount} craquage{habit.todayCount > 1 ? 's' : ''} aujourd'hui
                      </p>
                    )}
                  </div>

                  {/* Menu contextuel */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === habit.id ? null : habit.id)
                      }}
                      className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === habit.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-white/10 bg-[#0d0f17] p-1 shadow-xl">
                          <Link
                            href={`/habits/${habit.id}`}
                            className="block rounded px-3 py-2 text-xs text-white/90 transition hover:bg-white/10"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Voir détails
                          </Link>
                          <Link
                            href={`/habits/${habit.id}/edit`}
                            className="block rounded px-3 py-2 text-xs text-white/90 transition hover:bg-white/10"
                            onClick={() => setOpenMenuId(null)}
                          >
                            Modifier
                          </Link>
                          <button
                            onClick={() => handleDelete(habit.id, habit.name)}
                            className="w-full rounded px-3 py-2 text-left text-xs text-red-400 transition hover:bg-white/10"
                          >
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {habit.type === 'good' && (
                    <button
                      onClick={() => handleQuickAction(habit.id, 'validate')}
                      disabled={isLoading}
                      className="flex-1 rounded-lg bg-emerald-500/20 py-2 text-xs font-medium text-emerald-200 transition active:scale-95 disabled:opacity-50"
                    >
                      ✓ Valider
                    </button>
                  )}

                  {habit.type === 'bad' && (
                    <button
                      onClick={() => handleQuickAction(habit.id, 'relapse')}
                      disabled={isLoading}
                      className="flex-1 rounded-lg bg-red-500/20 py-2 text-xs font-medium text-red-200 transition active:scale-95 disabled:opacity-50"
                    >
                      J'ai craqué
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      )}

      {/* Autres habitudes - Liste simple */}
      {remainingHabits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Autres habitudes ({remainingHabits.length})
          </h2>
          <div className={viewMode === 'grid' ? 'grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}>
            {remainingHabits.map(habit => {
              const isLoading = loadingHabit === habit.id
              return (
                <div
                  key={habit.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-3 cursor-pointer transition hover:bg-white/10"
                  onClick={() => router.push(`/habits/${habit.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{habit.name}</h3>
                      <p className="text-xs text-white/50">
                        {habit.type === 'bad'
                          ? habit.todayCount > 0
                            ? `${habit.todayCount} craquage${habit.todayCount > 1 ? 's' : ''} aujourd'hui`
                            : habit.lastActionTimestamp
                              ? habit.currentStreak === 0
                                ? 'Dernier craquage aujourd\'hui'
                                : formatTimeSince(habit.lastActionTimestamp, 'Sans craquage depuis')
                              : 'Aucun craquage'
                          : habit.isDoneToday
                            ? `Série: ${habit.currentStreak}j`
                            : habit.lastActionTimestamp
                              ? formatTimeSince(habit.lastActionTimestamp)
                              : 'Jamais fait'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {habit.type === 'good' && (
                        <button
                          onClick={() => handleQuickAction(habit.id, 'validate')}
                          disabled={isLoading}
                          className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200 transition active:scale-95 disabled:opacity-50"
                        >
                          ✓
                        </button>
                      )}

                      {habit.type === 'bad' && (
                        <button
                          onClick={() => handleQuickAction(habit.id, 'relapse')}
                          disabled={isLoading}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 transition active:scale-95 disabled:opacity-50"
                        >
                          ⚠️
                        </button>
                      )}

                      {/* Menu contextuel */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === habit.id ? null : habit.id)
                          }}
                          className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {openMenuId === habit.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-white/10 bg-[#0d0f17] p-1 shadow-xl">
                              <Link
                                href={`/habits/${habit.id}`}
                                className="block rounded px-3 py-2 text-xs text-white/90 transition hover:bg-white/10"
                                onClick={() => setOpenMenuId(null)}
                              >
                                Voir détails
                              </Link>
                              <Link
                                href={`/habits/${habit.id}/edit`}
                                className="block rounded px-3 py-2 text-xs text-white/90 transition hover:bg-white/10"
                                onClick={() => setOpenMenuId(null)}
                              >
                                Modifier
                              </Link>
                              <button
                                onClick={() => handleDelete(habit.id, habit.name)}
                                className="w-full rounded px-3 py-2 text-left text-xs text-red-400 transition hover:bg-white/10"
                              >
                                Supprimer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Patterns - Section repliable */}
      {patternInsights.patterns.length > 0 && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5">
          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <div>
                <h2 className="text-sm font-semibold text-white">Patterns détectés</h2>
                <p className="text-xs text-white/50">
                  {patternInsights.patterns.length} schéma{patternInsights.patterns.length > 1 ? 's' : ''} identifié{patternInsights.patterns.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {showPatterns ? (
              <ChevronUp className="h-5 w-5 text-white/50" />
            ) : (
              <ChevronDown className="h-5 w-5 text-white/50" />
            )}
          </button>

          {showPatterns && (
            <div className="space-y-2 border-t border-purple-500/20 p-4 pt-3">
              {patternInsights.patterns.map(pattern => {
                const severityColors = {
                  high: 'bg-red-500/10 border-red-500/30',
                  medium: 'bg-orange-500/10 border-orange-500/30',
                  low: 'bg-blue-500/10 border-blue-500/30',
                }

                return (
                  <div
                    key={pattern.id}
                    className={`rounded-lg border p-3 ${severityColors[pattern.severity]}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{pattern.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xs font-semibold text-white">
                            {pattern.title}
                          </h3>
                          <span className="text-xs text-white/50">{pattern.confidence}%</span>
                        </div>
                        <p className="mt-1 text-xs text-white/70">{pattern.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Message d'encouragement si tout va bien */}
      {topRisks.length === 0 && habits.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <span className="text-3xl">🎉</span>
          <p className="mt-2 text-sm font-semibold text-emerald-200">
            Tout est sous contrôle !
          </p>
          <p className="mt-1 text-xs text-white/60">
            Continue comme ça, tu gères bien.
          </p>
        </div>
      )}
    </div>
  )
}
