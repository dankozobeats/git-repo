'use client'

/**
 * Redirige vers le dashboard approprié selon la préférence utilisateur
 * Par défaut: dashboard classique (/dashboard-old)
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_version')

    // Par défaut ou si préférence = 'classic', rediriger vers dashboard-old
    if (!saved || saved === 'classic') {
      router.replace('/dashboard-old')
    } else if (saved === 'mobile') {
      // Si préférence = 'mobile', rediriger vers dashboard-mobile
      router.replace('/dashboard-mobile')
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#01030a]">
      <div className="animate-pulse text-white/50">Chargement...</div>
    </div>
  )
}
