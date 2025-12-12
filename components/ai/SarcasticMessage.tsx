'use client'

import { useEffect, useState } from 'react'

type SarcasticMessageProps = {
  habitName: string
  count: number
  userId: string
}

const DEFAULT_MESSAGE = "Oups, le coach est en pause. Mais tu sais à quoi t'en tenir..."

export function SarcasticMessage({ habitName, count, userId }: SarcasticMessageProps) {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!habitName || !userId) {
      setMessage(DEFAULT_MESSAGE)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    async function fetchMessage() {
      try {
        const res = await fetch('/api/ai/sarcastic-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habitName, count, userId }),
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error('Erreur serveur')
        }

        const data = await res.json()
        setMessage(data.message || DEFAULT_MESSAGE)
      } catch (error) {
        console.error('SarcasticMessage fetch error', error)
        setMessage(DEFAULT_MESSAGE)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()

    return () => controller.abort()
  }, [habitName, count, userId])

  if (loading) {
    return <div className="animate-pulse rounded-2xl border border-white/10 bg-orange-50/80 p-4 text-sm text-gray-800">Le coach prépare son sarcasme... 🤔</div>
  }

  return (
    <div className="rounded-2xl border-l-4 border-orange-400 bg-orange-50/80 p-4 text-sm text-orange-900 shadow-lg">
      <p className="italic">{message}</p>
    </div>
  )
}
