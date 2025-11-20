'use client'

import { useEffect, useState } from 'react'
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

type Category = {
  id: string
  name: string
  color: string | null
}

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
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')

  const dailyGoalType = habitType === 'good' ? 'minimum' : 'maximum'
  const presets = habitType === 'bad' ? BAD_PRESETS : GOOD_PRESETS

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.categories || [])
    }
    fetchCategories()
  }, [])

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

    habitData.category_id = categoryId || null

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
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0] font-['Inter']">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
          >
            ← Retour au dashboard
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">
            Création d'une nouvelle habitude
          </p>
        </header>

        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#151515] p-6 md:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex-1 space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Studio</p>
              <h1 className="text-3xl font-bold text-white">Nouvelle habitude</h1>
              <p className="text-sm text-[#A0A0A0]">
                Sélectionne le type, la catégorie et les paramètres. L'aperçu à droite reflète
                instantanément le style général de ton dashboard.
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-[#A0A0A0]">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  Dark UI
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  Données Supabase
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  Accordéons intelligents
                </span>
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/40">
                <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-3">
                  Aperçu visuel
                </p>
                <div className="rounded-2xl border border-white/10 bg-[#1E1E1E] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">BadHabit Tracker 🔥</span>
                    <span className="text-xs text-[#A0A0A0]">+ Nouvelle</span>
                  </div>
                  <div className="rounded-xl bg-[#181818] p-3">
                    <p className="text-sm font-semibold">Aujourd'hui, c'est le moment de tracker !</p>
                    <p className="text-xs text-[#A0A0A0] mt-1">
                      Exemple visuel inspiré du dashboard principal.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#A0A0A0] uppercase tracking-[0.3em]">
                          Mauvaises habitudes
                        </p>
                        <p className="text-sm font-semibold">Finance (2)</p>
                      </div>
                      <button className="rounded-full bg-[#FF4D4D] px-3 py-1 text-xs font-semibold">
                        + Craquage
                      </button>
                    </div>
                    <p className="text-xs text-[#A0A0A0] mt-2">
                      L'UI finale s'aligne avec les sections accordéon de l'accueil.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/80 p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-3">
                Type d'habitude
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setHabitType('bad')
                    setColor('#ef4444')
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    habitType === 'bad'
                      ? 'border-[#FF4D4D] bg-[#FF4D4D] text-white shadow-lg shadow-[#FF4D4D]/30'
                      : 'border-[#333333] bg-[#1E1E1E] text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">🔥 Mauvaise habitude</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Pour traquer les craquages (système Bad Habit).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHabitType('good')
                    setColor('#10b981')
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    habitType === 'good'
                      ? 'border-[#2ECC71] bg-[#2ECC71] text-white shadow-lg shadow-[#2ECC71]/40'
                      : 'border-[#333333] bg-[#1E1E1E] text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">✨ Bonne habitude</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Pour valider une routine positive quotidienne.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-3">
                Mode de suivi
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTrackingMode('binary')}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    trackingMode === 'binary'
                      ? 'border-[#4DA6FF] bg-[#4DA6FF] text-white'
                      : 'border-[#333333] bg-[#1E1E1E] text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">✓ Oui/Non</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Une validation ou un craquage maximum par jour.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackingMode('counter')}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    trackingMode === 'counter'
                      ? 'border-[#4DA6FF] bg-[#4DA6FF] text-white'
                      : 'border-[#333333] bg-[#1E1E1E] text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">🔢 Compteur</p>
                  <p className="text-xs text-[#A0A0A0] mt-1">
                    Permet plusieurs occurrences (ex: verres d'eau).
                  </p>
                </button>
              </div>
            </div>

            {trackingMode === 'counter' && (
              <div className="rounded-2xl border border-[#333333] bg-[#1E1E1E] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-3">
                  {habitType === 'good'
                    ? 'Objectif minimum par jour'
                    : 'Limite maximum par jour'}
                </p>
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={dailyGoalValue}
                    onChange={(e) => setDailyGoalValue(parseInt(e.target.value))}
                    className="accent-[#4DA6FF] md:flex-1"
                  />
                  <div
                    className={`text-4xl font-bold tabular-nums text-center md:w-24 ${
                      habitType === 'good' ? 'text-[#4DA6FF]' : 'text-[#FF4D4D]'
                    }`}
                  >
                    {dailyGoalValue}
                  </div>
                </div>
                <p className="text-xs text-[#A0A0A0] mt-3">
                  {habitType === 'good'
                    ? `Objectif à atteindre chaque jour (min ${dailyGoalValue}).`
                    : `À ne surtout pas dépasser (max ${dailyGoalValue}).`}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/80 p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0] mb-2">
                Catégorie personnalisée
              </p>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full rounded-2xl border border-[#333333] bg-[#1E1E1E] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4DA6FF]"
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
                    <p className="text-sm font-semibold text-white">{preset.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/80 p-6 space-y-5">
            <div>
              <label htmlFor="name" className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">
                Nom de l'habitude *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Manger des fast-foods"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4DA6FF]"
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
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🔥"
                  maxLength={2}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[#4DA6FF]"
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
                  <span className="text-sm font-mono text-[#A0A0A0]">{color}</span>
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
                placeholder="Pourquoi veux-tu changer cette habitude ?"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4DA6FF]"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/80 p-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <Link
                href="/"
                className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-6 py-3 text-center text-sm font-semibold text-[#A0A0A0] transition hover:border-white/30 hover:text-white"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isLoading || !name}
                className={`flex-1 rounded-2xl px-6 py-3 text-center text-sm font-semibold transition ${
                  habitType === 'bad'
                    ? 'bg-[#FF4D4D] text-white hover:bg-[#e04343]'
                    : 'bg-[#4DA6FF] text-white hover:bg-[#3b82ff]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Création...' : "Créer l'habitude"}
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}
