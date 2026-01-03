'use client'

/**
 * Synchronise la préférence dashboard entre localStorage et cookies
 * Pour que le serveur puisse lire la préférence
 */

import { useEffect } from 'react'

export default function DashboardPreferenceSync() {
  useEffect(() => {
    const syncPreference = () => {
      const version = localStorage.getItem('dashboard_version') || 'mobile'

      // Synchroniser avec un cookie
      document.cookie = `dashboard_version=${version}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 an
    }

    // Sync au montage
    syncPreference()

    // Sync quand localStorage change (autre onglet)
    window.addEventListener('storage', syncPreference)

    return () => window.removeEventListener('storage', syncPreference)
  }, [])

  return null
}
