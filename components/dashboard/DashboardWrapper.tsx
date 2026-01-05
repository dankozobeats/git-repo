'use client'

/**
 * Wrapper simplifié pour le nouveau dashboard mobile
 * - Redirige vers /dashboard-old par défaut (classique)
 * - Affiche DashboardMobileClientNew seulement si préférence = "mobile"
 * - Pas de toggle ici, il est dans chaque page (dashboard-old et dashboard-mobile)
 */

import { useEffect, useMemo } from 'react'
import DashboardMobileClientNew from './DashboardMobileClientNew'
import { computeDashboardStats } from '@/lib/habits/computeDashboardStats'

type DashboardWrapperProps = {
  userId: string
  habits: any[]
  logs: any[]
  events: any[]
}

export default function DashboardWrapper({ userId, habits, logs, events }: DashboardWrapperProps) {
  // Pré-calculer les stats côté client pour éviter le fetch initial
  const initialDashboardData = useMemo(() => {
    return computeDashboardStats(habits, logs, events)
  }, [habits, logs, events])

  // Vérifier la préférence et rediriger si nécessaire
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-version')

    // Si pas de préférence ou préférence = "classic", rediriger vers dashboard-old
    if (!saved || saved === 'classic') {
      window.location.href = '/dashboard-old'
      return
    }
  }, [])

  // Afficher le nouveau dashboard (on arrive ici seulement si préférence = "mobile")
  return <DashboardMobileClientNew userId={userId} initialData={initialDashboardData} />
}
