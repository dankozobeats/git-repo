'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const BAD_PRESETS = [
  { name: 'Fast-food', icon: '🍔', color: '#ef4444' },
  { name: 'Scroll social media', icon: '📱', color: '#f97316' },
  { name: 'Snooze alarm', icon: '⏰', color: '#eab308' },
  { name: 'Procrastination', icon: '🛋️', color: '#a855f7' },
  { name: 'Cigarettes', icon: '🚬', color: '#6b7280' },
  { name: 'Alcool', icon: '🍺', color: '#f59e0b' },
]

const GOOD_PRESETS = [
  { name: 'Sport', icon: '💪', color: '#10b981' },
  { name: 'Lecture', icon: '📚', color: '#3b82f6' },
  { name: 'Méditation', icon: '🧘', color: '#8b5cf6' },
  { name: 'Eau (8 verres)', icon: '💧', color: '#06b6d4' },
  { name: 'Sommeil 8h', icon: '😴', color: '#6366f1' },
  { name: 'Fruits & légumes', icon: '🥗', color: '#22c55e' },
]

export default function NewHabitPage() {
  const router = useRouter()
  const [habitType, setHabitType] = useState<'bad' | 'good'>('bad')
  const [trackingMode, setTrackingMode] = useState<'binary' | 'counter'>('binary')
  const [dailyGoalValue, setDailyGoalValue] = useState(3)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#ef4444')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const dailyGoalType = habitType === 'good' ? 'minimum' : 'maximum'
  const presets = habitType === 'bad' ? BAD_PRESETS : GOOD_PRESETS

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const habitData: any = {
      user_id: user.id,
      name,
      icon,
      color,
      description,
      type: habitType,
      tracking_mode: trackingMode,
    }

    if (trackingMode === 'counter') {
      habitData.daily_goal_type = dailyGoalType
      habitData.daily_goal_value = dailyGoalValue
    }

    const { error } = await supabase
      .from('habits')
      .insert(habitData)

    if (!error) {
      router.push('/')
      router.refresh()
    } else {
      console.error('Error creating habit:', error)
      setIsLoading(false)
    }
  }

  function selectPreset(preset: typeof BAD_PRESETS[0]) {
    setName(preset.name)
    setIcon(preset.icon)
    setColor(preset.color)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Retour au dashboard
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-8">Nouvelle habitude</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Toggle Bad/Good */}
          <div>
            <label className="block text-sm font-medium mb-3">Type d'habitude</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setHabitType('bad')
                  setColor('#ef4444')
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  habitType === 'bad'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                🔥 Mauvaise habitude
              </button>
              <button
                type="button"
                onClick={() => {
                  setHabitType('good')
                  setColor('#10b981')
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  habitType === 'good'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ✨ Bonne habitude
              </button>
            </div>
          </div>

          {/* Mode de suivi */}
          <div>
            <label className="block text-sm font-medium mb-3">Mode de suivi</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTrackingMode('binary')}
                className={`py-4 px-4 rounded-lg border-2 transition-all text-left ${
                  trackingMode === 'binary'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-medium mb-1">✓ Oui/Non</div>
                <div className="text-xs opacity-75">Une fois par jour maximum</div>
              </button>
              
              <button
                type="button"
                onClick={() => setTrackingMode('counter')}
                className={`py-4 px-4 rounded-lg border-2 transition-all text-left ${
                  trackingMode === 'counter'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-medium mb-1">🔢 Compteur</div>
                <div className="text-xs opacity-75">Plusieurs fois par jour</div>
              </button>
            </div>
          </div>

          {/* Objectif journalier (seulement en mode counter) */}
          {trackingMode === 'counter' && (
            <div className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
              <label className="block text-sm font-medium mb-4">
                {habitType === 'good' 
                  ? '🎯 Objectif minimum par jour'
                  : '⚠️ Limite maximum par jour'
                }
              </label>
              
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={dailyGoalValue}
                  onChange={(e) => setDailyGoalValue(parseInt(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <div className={`
                  text-4xl font-bold tabular-nums min-w-[70px] text-center
                  ${habitType === 'good' ? 'text-green-400' : 'text-red-400'}
                `}>
                  {dailyGoalValue}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                {habitType === 'good' 
                  ? `Tu devras atteindre au moins ${dailyGoalValue} fois par jour`
                  : `Tu ne devras pas dépasser ${dailyGoalValue} fois par jour`
                }
              </p>
            </div>
          )}

          {/* Presets */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Suggestions ({habitType === 'bad' ? 'mauvaises' : 'bonnes'} habitudes)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-all text-left border border-gray-700 hover:border-gray-600"
                >
                  <div className="text-2xl mb-1">{preset.icon}</div>
                  <div className="text-sm font-medium truncate">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nom de l'habitude *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Manger des fast-foods"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Icône */}
          <div>
            <label htmlFor="icon" className="block text-sm font-medium mb-2">
              Icône (emoji)
            </label>
            <input
              id="icon"
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🔥"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={2}
            />
          </div>

          {/* Couleur */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium mb-2">
              Couleur
            </label>
            <div className="flex gap-3 items-center">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-12 rounded-lg cursor-pointer bg-gray-800 border border-gray-700"
              />
              <span className="text-gray-400 text-sm font-mono">{color}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description (optionnel)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pourquoi veux-tu changer cette habitude ?"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/"
              className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-all border border-gray-700 text-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isLoading || !name}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                habitType === 'bad'
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
                  : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Création...' : 'Créer l\'habitude'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
