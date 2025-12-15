'use client'

import { useState, useEffect } from 'react'

type DailyMantraProps = {
  habitName: string
  userId: string
}

export function DailyMantra({ habitName, userId }: DailyMantraProps) {
  const [mantra, setMantra] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!habitName || !userId) {
      setMantra('Tu es plus fort que tu ne le crois.')
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchMantra() {
      try {
        const response = await fetch('/api/ai/mantra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitName, userId }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Erreur serveur')
        }

        const data = await response.json()
        setMantra(data.mantra || 'Je choisis ma santé, pas mes habitudes.')
      } catch (error) {
        const isAbort =
          error instanceof DOMException && error.name === 'AbortError'

        if (!isAbort) {
          console.error('DailyMantra error', error)
          setMantra('Tu es plus fort que tu ne le crois.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMantra()

    return () => controller.abort()
  }, [habitName, userId])

  if (loading) {
    return <div className="animate-pulse rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center text-sm font-medium text-white">Génération du mantra...</div>
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/90 to-pink-500/90 p-6 text-center text-white shadow-lg">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/80">✨ Ton mantra du jour</p>
      <p className="mt-3 text-2xl font-bold leading-tight">{mantra}</p>
    </div>
  )
}
