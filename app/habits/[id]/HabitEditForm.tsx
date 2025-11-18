'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']

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

type Category = Database['public']['Tables']['categories']['Row']

type HabitEditFormProps = {
  habit: Habit
  categories: Category[]
}

export default function HabitEditForm({ habit, categories }: HabitEditFormProps) {
  const router = useRouter()
  const [habitType, setHabitType] = useState<'good' | 'bad'>(
    (habit.type as 'good' | 'bad') || 'bad'
  )
  const [trackingMode, setTrackingMode] = useState<'binary' | 'counter'>(
    (habit.tracking_mode as 'binary' | 'counter') || 'binary'
  )
  const [dailyGoalValue, setDailyGoalValue] = useState(
    habit.daily_goal_value ?? 3
  )
  const [name, setName] = useState(habit.name)
  const [icon, setIcon] = useState(habit.icon || '')
  const [color, setColor] = useState(habit.color || '#ef4444')
  const [description, setDescription] = useState(habit.description || '')
  const [categoryId, setCategoryId] = useState(habit.category_id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dailyGoalType = habitType === 'good' ? 'minimum' : 'maximum'
  const presets = habitType === 'bad' ? BAD_PRESETS : GOOD_PRESETS

  function selectPreset(preset: typeof BAD_PRESETS[number]) {
    setName(preset.name)
    setIcon(preset.icon)
    setColor(preset.color)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setErrorMessage('Session expirée. Merci de vous reconnecter.')
      setIsLoading(false)
      return
    }

    const updates: Partial<Habit> = {
      name: name.trim(),
      icon: icon.trim(),
      color,
      description: description.trim(),
      type: habitType,
      tracking_mode: trackingMode,
      category_id: categoryId || null,
      updated_at: new Date().toISOString(),
    }

    if (trackingMode === 'counter') {
      updates.daily_goal_value = dailyGoalValue
      updates.daily_goal_type = dailyGoalType
    } else {
      updates.daily_goal_value = null
      updates.daily_goal_type = null
    }

    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habit.id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Supabase update error:', error)
      setErrorMessage('Impossible de mettre à jour cette habitude.')
      setIsLoading(false)
      return
    }

    if (!data || data.length === 0) {
      console.error('No habit updated')
      setErrorMessage('Aucune mise à jour appliquée.')
      setIsLoading(false)
      return
    }

    router.push(`/habits/${habit.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {errorMessage && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <section>
        <label className="block text-sm font-medium mb-2">Catégorie</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Sans catégorie</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </section>

      <section>
        <label className="block text-sm font-medium mb-3">
          Type d&apos;habitude
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setHabitType('bad')
              if (!habit.icon) {
                setColor('#ef4444')
              }
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
              if (!habit.icon) {
                setColor('#10b981')
              }
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
      </section>

      <section>
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
      </section>

      {trackingMode === 'counter' && (
        <section className="bg-gray-800/50 p-5 rounded-lg border border-gray-700">
          <label className="block text-sm font-medium mb-4">
            {habitType === 'good'
              ? '🎯 Objectif minimum par jour'
              : '⚠️ Limite maximum par jour'}
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
            <div
              className={`text-4xl font-bold tabular-nums min-w-[70px] text-center ${
                habitType === 'good' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {dailyGoalValue}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            {habitType === 'good'
              ? `Tu devras atteindre au moins ${dailyGoalValue} fois par jour`
              : `Tu ne devras pas dépasser ${dailyGoalValue} fois par jour`}
          </p>
        </section>
      )}

      <section>
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
      </section>

      <section>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Nom de l&apos;habitude *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      <section>
        <label htmlFor="icon" className="block text-sm font-medium mb-2">
          Icône (emoji)
        </label>
        <input
          id="icon"
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={2}
        />
      </section>

      <section>
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
      </section>

      <section>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Description (optionnel)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </section>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push(`/habits/${habit.id}`)}
          className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-all border border-gray-700 text-center"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            habitType === 'bad'
              ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
              : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
