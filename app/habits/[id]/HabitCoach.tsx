'use client'

import { useEffect, useState } from 'react'
import { Brain, MessageSquare, Loader2, RotateCcw, Wand2 } from 'lucide-react'

type HabitCoachProps = {
  habitId: string
  stats: {
    totalCount: number
    last7DaysCount: number
    currentStreak: number
    todayCount: number
    monthPercentage: number
  }
}

type Tone = 'gentle' | 'balanced' | 'direct'
type Focus = 'mindset' | 'strategy' | 'celebration'

const toneOptions = [
  { id: 'gentle' as const, label: 'Bienveillant', description: 'Coach empathique' },
  { id: 'balanced' as const, label: 'Motivant', description: 'Equilibre' },
  { id: 'direct' as const, label: 'Cash', description: 'Direct' },
]

const focusOptions = [
  { id: 'mindset' as const, label: 'Mindset', description: 'Motivation' },
  { id: 'strategy' as const, label: 'Plan', description: 'Actions' },
  { id: 'celebration' as const, label: 'Celebration', description: 'Wins' },
]

export default function HabitCoach({ habitId, stats }: HabitCoachProps) {
  const [tone, setTone] = useState<Tone>('balanced')
  const [focus, setFocus] = useState<Focus>('mindset')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  async function fetchCoachMessage() {
    setIsLoading(true)
    setError(null)

    try {
      const url = '/api/habits/' + habitId + '/coach'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, focus, stats }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      setMessage(data.message)
      setIsFallback(Boolean(data.fallback))
      setLastUpdated(data.timestamp || new Date().toISOString())
    } catch (err) {
      console.error('coach:error', err)
      setError('Erreur API')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoachMessage()
  }, [habitId])

  return (
    <section className="bg-gray-900 rounded-lg border border-gray-800 p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-400" /> Coach IA
          </p>
          <h3 className="text-2xl font-bold text-white mt-1">Besoin d un coup de boost ?</h3>
          <p className="text-gray-400 text-sm">Brief ton coach virtuel.</p>
        </div>
        <button onClick={fetchCoachMessage} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-gray-500">Ton</p>
          <div className="grid grid-cols-3 gap-2">
            {toneOptions.map((option) => (
              <button key={option.id} onClick={() => setTone(option.id)} className={'p-3 rounded-lg border text-left transition text-sm ' + (tone === option.id ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-300')}>
                <div className="font-semibold">{option.label}</div>
                <p className="text-xs text-gray-400 mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-gray-500">Focus</p>
          <div className="grid grid-cols-3 gap-2">
            {focusOptions.map((option) => (
              <button key={option.id} onClick={() => setFocus(option.id)} className={'p-3 rounded-lg border text-left transition text-sm ' + (focus === option.id ? 'border-green-500 bg-green-500/10 text-white' : 'border-gray-700 bg-gray-800 text-gray-300')}>
                <div className="font-semibold">{option.label}</div>
                <p className="text-xs text-gray-400 mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-800/60 rounded-2xl border border-gray-700 p-5 min-h-[160px] relative">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          Message du coach
          {isFallback && <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">Fallback</span>}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 text-blue-300"><Loader2 className="w-5 h-5 animate-spin" />Generation...</div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <p className="text-base text-gray-100 leading-relaxed whitespace-pre-line">{message || 'Clique sur Refresh.'}</p>
        )}

        {lastUpdated && <p className="text-xs text-gray-500 mt-4">MAJ : {new Date(lastUpdated).toLocaleTimeString('fr-FR')}</p>}

        <button onClick={fetchCoachMessage} disabled={isLoading} className="absolute -bottom-3 right-4 bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-lg disabled:opacity-50">
          <Wand2 className="w-4 h-4" />
          Nouvelle punchline
        </button>
      </div>
    </section>
  )
}
