/**
 * Hook client pour récupérer les données du dashboard
 *
 * Architecture serveur-first :
 * - Fetch depuis /api/dashboard qui calcule tout côté serveur
 * - Cache avec SWR pour éviter les requêtes inutiles
 * - Revalidation automatique
 *
 * Remplace l'ancienne logique qui fetchait les habits puis calculait côté client
 */

'use client'

import useSWR from 'swr'

type HabitWithStats = {
  id: string
  name: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter' | null
  icon: string | null
  color: string
  description: string | null
  daily_goal_value: number | null
  // Stats calculées côté serveur
  todayCount: number
  currentStreak: number
  last7DaysCount: number
  monthCompletionRate: number
  totalCount: number
  lastActionDate: string | null
  lastActionTimestamp: string | null
  riskLevel: 'good' | 'warning' | 'danger'
}

type DashboardSummary = {
  totalHabits: number
  goodHabitsCount: number
  badHabitsCount: number
  goodHabitsLoggedToday: number
  badHabitsLoggedToday: number
  totalGoodActions: number
}

type DashboardData = {
  habits: HabitWithStats[]
  summary: DashboardSummary
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useDashboard(initialData?: DashboardData) {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    '/api/dashboard',
    fetcher,
    {
      fallbackData: initialData, // Utiliser les données initiales pour un rendu instantané
      revalidateOnMount: !initialData, // Ne pas revalider au mount si on a des données initiales
      // Revalidation settings
      revalidateOnFocus: true, // Revalider quand on revient sur l'onglet
      revalidateOnReconnect: true, // Revalider quand la connexion revient
      refreshInterval: 30000, // Refresh toutes les 30 secondes
    }
  )

  return {
    habits: data?.habits || [],
    summary: data?.summary || {
      totalHabits: 0,
      goodHabitsCount: 0,
      badHabitsCount: 0,
      goodHabitsLoggedToday: 0,
      badHabitsLoggedToday: 0,
      totalGoodActions: 0,
    },
    isLoading,
    isError: error,
    mutate, // Permet de forcer un refresh manuel
  }
}
