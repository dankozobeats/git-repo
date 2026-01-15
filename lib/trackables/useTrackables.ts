'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Trackable,
  TrackableWithToday,
  CreateTrackablePayload,
  CreateEventPayload,
  CreateDecisionPayload,
  TrackableEvent,
  Decision,
} from '@/types/trackables'

export function useTrackables() {
  const [trackables, setTrackables] = useState<TrackableWithToday[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch trackables with today's events and decisions
  const fetchTrackables = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all trackables
      const trackablesRes = await fetch('/api/trackables')
      if (!trackablesRes.ok) throw new Error('Failed to fetch trackables')
      const trackablesData: Trackable[] = await trackablesRes.json()

      // Get today's date range
      const today = new Date().toISOString().split('T')[0]
      const todayStart = `${today}T00:00:00`
      const todayEnd = `${today}T23:59:59`

      // Fetch today's events
      const eventsRes = await fetch(
        `/api/trackable-events?from=${todayStart}&to=${todayEnd}&limit=1000`
      )
      if (!eventsRes.ok) throw new Error('Failed to fetch events')
      const eventsData: TrackableEvent[] = await eventsRes.json()

      // Fetch today's decisions
      const decisionsRes = await fetch(
        `/api/decisions?from=${todayStart}&to=${todayEnd}&limit=1000`
      )
      if (!decisionsRes.ok) throw new Error('Failed to fetch decisions')
      const decisionsData: Decision[] = await decisionsRes.json()

      // Combine data
      const trackablesWithToday: TrackableWithToday[] = trackablesData.map(
        (trackable) => {
          const today_events = eventsData.filter(
            (e) => e.trackable_id === trackable.id
          )

          // Get state event IDs for this trackable
          const stateEventIds = today_events
            .filter((e) => e.kind === 'observe')
            .map((e) => e.id)

          const today_decisions = decisionsData.filter((d) =>
            stateEventIds.includes(d.state_event_id)
          )

          const today_count = today_events.length

          // Calculate progress for habits
          const today_progress =
            trackable.type === 'habit' && trackable.target_per_day
              ? Math.min(
                  (today_count / trackable.target_per_day) * 100,
                  100
                )
              : 0

          return {
            ...trackable,
            today_events,
            today_decisions,
            today_count,
            today_progress,
          }
        }
      )

      setTrackables(trackablesWithToday)
    } catch (err) {
      console.error('Error fetching trackables:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a new trackable
  const createTrackable = useCallback(
    async (payload: CreateTrackablePayload) => {
      try {
        const res = await fetch('/api/trackables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Failed to create trackable')

        await fetchTrackables()
      } catch (err) {
        console.error('Error creating trackable:', err)
        throw err
      }
    },
    [fetchTrackables]
  )

  // Update a trackable
  const updateTrackable = useCallback(
    async (id: string, updates: Partial<Trackable>) => {
      try {
        const res = await fetch(`/api/trackables/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!res.ok) throw new Error('Failed to update trackable')

        await fetchTrackables()
      } catch (err) {
        console.error('Error updating trackable:', err)
        throw err
      }
    },
    [fetchTrackables]
  )

  // Archive a trackable
  const archiveTrackable = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/trackables/${id}`, {
          method: 'DELETE',
        })

        if (!res.ok) throw new Error('Failed to archive trackable')

        await fetchTrackables()
      } catch (err) {
        console.error('Error archiving trackable:', err)
        throw err
      }
    },
    [fetchTrackables]
  )

  // Log an event (check for habit, observe for state)
  const logEvent = useCallback(
    async (payload: CreateEventPayload) => {
      try {
        const res = await fetch('/api/trackable-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Failed to log event')

        const event: TrackableEvent = await res.json()
        await fetchTrackables()
        return event
      } catch (err) {
        console.error('Error logging event:', err)
        throw err
      }
    },
    [fetchTrackables]
  )

  // Create a decision
  const createDecision = useCallback(
    async (payload: CreateDecisionPayload) => {
      try {
        const res = await fetch('/api/decisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error('Failed to create decision')

        await fetchTrackables()
      } catch (err) {
        console.error('Error creating decision:', err)
        throw err
      }
    },
    [fetchTrackables]
  )

  useEffect(() => {
    fetchTrackables()
  }, [fetchTrackables])

  return {
    trackables,
    isLoading,
    error,
    refresh: fetchTrackables,
    createTrackable,
    updateTrackable,
    archiveTrackable,
    logEvent,
    createDecision,
  }
}
