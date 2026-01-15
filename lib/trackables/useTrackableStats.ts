'use client'

import { useState, useEffect, useCallback } from 'react'
import { DashboardStats } from '@/types/trackables'

export function useTrackableStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch('/api/stats/trackables-dashboard')
      if (!res.ok) throw new Error('Failed to fetch stats')

      const data: DashboardStats = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  }
}
