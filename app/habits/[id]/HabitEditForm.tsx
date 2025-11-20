'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Habit = Database['public']['Tables']['habits']['Row']

type Category = Database['public']['Tables']['categories']['Row']

type HabitEditFormProps = {
  habit: Habit
  categories: Category[]
}

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

export default function HabitEditForm({ habit, categories }: HabitEditFormProps) {
  const router = useRouter()
  const [habitType, setHabitType] = useState<'good' | 'bad'>(
    (habit.type as 'good' | 'bad') || 'bad'
  )
  const [trackingMode, setTrackingMode] = useState<'binary' | 'counter'>(
    (habit.tracking_mode as 'binary' | 'counter') || 'binary'
  )
  const [dailyGoalValue, setDailyGoalValue] = useState(habit.daily_goal_value ?? 3)
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
      setErrorMessage('Aucune mise à jour appliquée.')
      setIsLoading(false)
      return
    }

    router.push(`/habits/${habit.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="rounded-2xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/80 p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-2">Catégorie personnalisée</p>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
          >
            <option value="">Sans catégorie</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-3">Type d&apos;habitude</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setHabitType('bad')
                if (!habit.icon) {
                  setColor('#ef4444')
                }
              }}
              className={`flex-1 rounded-2xl border px-4 py-4 text-left font-semibold transition ${
                habitType === 'bad'
                  ? 'border-[#FF4D4D] bg-[#FF4D4D]/10 text-white shadow-lg shadow-[#FF4D4D]/30'
                  : 'border-white/10 bg-black/20 text-white/60 hover:border-white/30'
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
              className={`flex-1 rounded-2xl border px-4 py-4 text-left font-semibold transition ${
                habitType === 'good'
                  ? 'border-[#4DA6FF] bg-[#4DA6FF]/10 text-white shadow-lg shadow-[#4DA6FF]/30'
                  : 'border-white/10 bg-black/20 text-white/60 hover:border-white/30'
              }`}
            >
              ✨ Bonne habitude
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-[#1A1D2B] p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-3">Mode de suivi</p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setTrackingMode('binary')}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                trackingMode === 'binary'
                  ? 'border-[#4DA6FF] bg-[#4DA6FF]/10 text-white'
                  : 'border-white/10 bg-black/20 text-white/60 hover:border-white/30'
              }`}
            >
              <div className="font-semibold mb-1">✓ Oui/Non</div>
              <p className="text-xs text-white/60">Une fois par jour maximum</p>
            </button>
            <button
              type="button"
              onClick={() => setTrackingMode('counter')}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                trackingMode === 'counter'
                  ? 'border-[#4DA6FF] bg-[#4DA6FF]/10 text-white'
                  : 'border-white/10 bg-black/20 text-white/60 hover:border-white/30'
              }`}
            >
              <div className="font-semibold mb-1">🔢 Compteur</div>
              <p className="text-xs text-white/60">Plusieurs fois par jour</p>
            </button>
          </div>
        </div>

        {trackingMode === 'counter' && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">
              {habitType === 'good' ? '🎯 Objectif minimum' : '⚠️ Limite maximum'}
            </p>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <input
                type="range"
                min="1"
                max="20"
                value={dailyGoalValue}
                onChange={(e) => setDailyGoalValue(parseInt(e.target.value))}
                className="accent-[#FF4D4D] md:flex-1"
              />
              <div
                className={`text-4xl font-bold tabular-nums text-center md:w-24 ${
                  habitType === 'good' ? 'text-[#4DA6FF]' : 'text-[#FF4D4D]'
                }`}
              >
                {dailyGoalValue}
              </div>
            </div>
            <p className="text-xs text-white/60">
              {habitType === 'good'
                ? `Atteindre au moins ${dailyGoalValue} validations.`
                : `Ne pas dépasser ${dailyGoalValue} occurrences.`}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-3">
            Suggestions ({habitType === 'bad' ? 'mauvaises' : 'bonnes'})
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => selectPreset(preset)}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-white/40"
              >
                <div className="text-2xl mb-2">{preset.icon}</div>
                <p className="text-sm font-semibold text-white truncate">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/80 p-6 space-y-5">
        <div>
          <label htmlFor="name" className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">
            Nom de l&apos;habitude *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="icon" className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">
              Icône (emoji)
            </label>
            <input
              id="icon"
              type="text"
              value={icon}
              maxLength={2}
              onChange={(e) => setIcon(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
            />
          </div>
          <div>
            <label htmlFor="color" className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">
              Couleur
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-12 w-16 rounded-lg border border-white/10 bg-black/20"
              />
              <span className="text-sm font-mono text-white/70">{color}</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">
            Description (optionnel)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/80 p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={() => router.push(`/habits/${habit.id}`)}
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-6 py-3 text-center text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className={`flex-1 rounded-2xl px-6 py-3 text-center text-sm font-semibold transition ${
              habitType === 'bad'
                ? 'bg-[#FF4D4D] text-white hover:bg-[#e04343]'
                : 'bg-[#4DA6FF] text-white hover:bg-[#3b82ff]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </section>
    </form>
  )
}
