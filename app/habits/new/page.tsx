'use client'

// Page client de création d'habitude : refonte premium avec validations SMART et audit IA local.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FormMessage from '@/components/FormMessage'
import AICoachSmartAudit from '@/components/AICoachSmartAudit'
import { ArrowLeft, Palette, Sparkles, Wand2 } from 'lucide-react'

// Suggestions rapides pour guider l'utilisateur selon la nature de l'habitude.
const BAD_PRESETS = [
  { name: 'Fast-food du soir', icon: '🍔', color: '#ef4444' },
  { name: 'Scroll réseaux', icon: '📱', color: '#f97316' },
  { name: 'Snooze interminable', icon: '⏰', color: '#eab308' },
  { name: 'Procrastination', icon: '🛋️', color: '#a855f7' },
  { name: 'Cigarette impulsive', icon: '🚬', color: '#6b7280' },
  { name: 'Apéro quotidien', icon: '🍺', color: '#f59e0b' },
]

const GOOD_PRESETS = [
  { name: 'Session sport', icon: '💪', color: '#10b981' },
  { name: 'Lecture focus', icon: '📚', color: '#3b82f6' },
  { name: 'Méditation 10 min', icon: '🧘', color: '#8b5cf6' },
  { name: 'Eau (8 verres)', icon: '💧', color: '#06b6d4' },
  { name: 'Sommeil 8h', icon: '😴', color: '#6366f1' },
  { name: 'Fruits & légumes', icon: '🥗', color: '#22c55e' },
]

type Category = {
  id: string
  name: string
  color: string | null
}

type SmartErrorField = 'name' | 'description' | 'dailyGoal' | 'category' | 'trackingMode'

export default function NewHabitPage() {
  const router = useRouter()
  // États contrôlant la configuration de la nouvelle habitude.
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
  const [errors, setErrors] = useState<Partial<Record<SmartErrorField, string>>>({})

  const dailyGoalType = habitType === 'good' ? 'minimum' : 'maximum'
  const presets = habitType === 'bad' ? BAD_PRESETS : GOOD_PRESETS
  const vagueKeywords = useMemo(() => ['habitude', 'truc', 'chose', 'améliorer', 'meilleur', 'projet'], [])

  // Charge les catégories disponibles via l'API interne.
  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.categories || [])
    }
    fetchCategories()
  }, [])

  const clearError = useCallback((field: SmartErrorField) => {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  // Sélection rapide d'un preset : applique nom, couleur et emoji cohérents.
  const selectPreset = useCallback(
    (preset: typeof BAD_PRESETS[number]) => {
      setName(preset.name)
      setIcon(preset.icon)
      setColor(preset.color)
      clearError('name')
    },
    [clearError]
  )

  // Valide les critères SMART et accumule les messages UX.
  const validateSmart = () => {
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const newErrors: Partial<Record<SmartErrorField, string>> = {}

    if (trimmedName.length < 4) {
      newErrors.name = 'Le nom doit contenir au moins 4 caractères précis.'
    } else if (vagueKeywords.some(keyword => trimmedName.toLowerCase().includes(keyword))) {
      newErrors.name = 'Précise le nom avec un verbe concret (ex: "Limiter le fast-food").'
    }

    if (trackingMode !== 'binary' && trackingMode !== 'counter') {
      newErrors.trackingMode = 'Choisis un mode de suivi pour planifier ton rythme.'
    }

    if (trackingMode === 'binary' && trimmedDescription.length < 10) {
      newErrors.description = 'Ajoute une description (10 caractères minimum) pour clarifier la routine.'
    }

    if (trackingMode === 'counter') {
      if (!dailyGoalValue || dailyGoalValue < 1) {
        newErrors.dailyGoal = 'Définis un volume mesurable (minimum 1).'
      } else if (dailyGoalValue > 20) {
        newErrors.dailyGoal = 'Reste dans une zone atteignable (maximum 20 unités).'
      }
    }

    if (!categoryId && categories.length > 0) {
      newErrors.category = 'Sélectionne une catégorie pertinente pour cette habitude.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Insère la nouvelle habitude dans Supabase après une validation SMART complète.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const isValid = validateSmart()
    if (!isValid) {
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const habitData: Record<string, unknown> = {
      user_id: user.id,
      name,
      icon,
      color,
      description,
      type: habitType,
      tracking_mode: trackingMode,
      category_id: categoryId,
    }

    if (trackingMode === 'counter') {
      habitData.daily_goal_type = dailyGoalType
      habitData.daily_goal_value = dailyGoalValue
    }

    const { error } = await supabase.from('habits').insert(habitData)
    if (error) {
      console.error('Error creating habit:', error)
      setIsLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  const heroTitle =
    habitType === 'bad' ? 'Optimise tes routines pour éviter les craquages.' : 'Consolide les habitudes positives.'

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05070f] via-[#080b16] to-[#0f172a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <header className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Studio Habitudes</p>
              <h1 className="text-4xl font-semibold text-white">Créer une habitude SMART</h1>
              <p className="text-base text-white/70">{heroTitle} Chaque paramètre se met à jour en temps réel.</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au dashboard
            </Link>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-8">
              {/* Section type & mode */}
              <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Type</p>
                  <h2 className="text-xl font-semibold">Nature de l’habitude</h2>
                  <p className="text-sm text-white/60">
                    Sélectionne la polarité principale et le mode de suivi. Ces paramètres pilotent les règles SMART.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[{ key: 'bad', label: '🔥 Mauvaise habitude', helper: 'Idéal pour limiter les craquages.' }, { key: 'good', label: '✨ Bonne habitude', helper: 'Pour valider une action positive.' }].map(option => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setHabitType(option.key as 'bad' | 'good')
                        setColor(option.key === 'bad' ? '#ef4444' : '#10b981')
                      }}
                      className={`rounded-2xl border px-4 py-4 text-left transition hover:scale-[1.02] ${
                        habitType === option.key
                          ? 'border-white/30 bg-gradient-to-br from-white/15 to-transparent text-white'
                          : 'border-white/10 bg-black/30 text-white/70 hover:border-white/20'
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-white/60 mt-1">{option.helper}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Mode</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[{ key: 'binary', label: '✓ Oui/Non', helper: 'Une validation par jour.' }, { key: 'counter', label: '🔢 Compteur', helper: 'Plusieurs occurrences à suivre.' }].map(option => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setTrackingMode(option.key as 'binary' | 'counter')
                          clearError('trackingMode')
                        }}
                        className={`rounded-2xl border px-4 py-4 text-left transition hover:scale-[1.02] ${
                          trackingMode === option.key
                            ? 'border-sky-500/40 bg-gradient-to-br from-sky-500/30 to-transparent text-white'
                            : 'border-white/10 bg-black/30 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-xs text-white/60 mt-1">{option.helper}</p>
                      </button>
                    ))}
                  </div>
                  <FormMessage type="error" message={errors.trackingMode} />
                </div>

                {trackingMode === 'counter' && (
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-white/60">Objectif</p>
                        <h3 className="text-base font-semibold">
                          {habitType === 'good' ? 'Objectif minimum quotidien' : 'Limite maximum quotidienne'}
                        </h3>
                      </div>
                      <div className="text-4xl font-bold text-white">{dailyGoalValue}</div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={dailyGoalValue}
                      onChange={event => {
                        setDailyGoalValue(Number(event.target.value))
                        clearError('dailyGoal')
                      }}
                      className="w-full accent-[#C084FC]"
                    />
                    <p className="text-xs text-white/60">
                      Maintiens un objectif atteignable entre 1 et 20 pour conserver la motivation.
                    </p>
                    <FormMessage type="error" message={errors.dailyGoal} />
                  </div>
                )}
              </section>

              {/* Section catégorie + suggestions */}
              <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Catégorie & presets</p>
                  <h2 className="text-xl font-semibold">Contexte et inspirations</h2>
                  <p className="text-sm text-white/60">Associe cette habitude à une catégorie claire puis choisis un preset pour gagner du temps.</p>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.35em] text-white/60">Catégorie</label>
                  <select
                    value={categoryId}
                    onChange={event => {
                      setCategoryId(event.target.value)
                      clearError('category')
                    }}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/50"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <FormMessage type="error" message={errors.category} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">Suggestions</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {presets.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-white/30 hover:bg-black/50"
                      >
                        <div className="text-2xl">{preset.icon}</div>
                        <p className="mt-2 text-sm font-semibold text-white">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section identité */}
              <section className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">Identité</p>
                  <h2 className="text-xl font-semibold">Nom, icône et description</h2>
                  <p className="text-sm text-white/60">Décris précisément l’habitude pour qu’elle soit compréhensible dans le dashboard.</p>
                </div>
                <div>
                  <label htmlFor="name" className="text-xs uppercase tracking-[0.35em] text-white/60">
                    Nom précis *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={event => {
                      setName(event.target.value)
                      clearError('name')
                    }}
                    placeholder="Ex: Limiter le fast-food à 1 fois"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/40"
                  />
                  <FormMessage type="error" message={errors.name} />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="icon" className="text-xs uppercase tracking-[0.35em] text-white/60 flex items-center gap-2">
                      Icône <Wand2 className="h-3.5 w-3.5 text-white/60" />
                    </label>
                    <input
                      id="icon"
                      type="text"
                      value={icon}
                      onChange={event => setIcon(event.target.value)}
                      placeholder="🔥"
                      maxLength={2}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-2xl text-white placeholder:text-white/40 focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/40"
                    />
                  </div>
                  <div>
                    <label htmlFor="color" className="text-xs uppercase tracking-[0.35em] text-white/60 flex items-center gap-2">
                      Couleur <Palette className="h-3.5 w-3.5 text-white/60" />
                    </label>
                    <div className="mt-2 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                      <input
                        id="color"
                        type="color"
                        value={color}
                        onChange={event => setColor(event.target.value)}
                        className="h-12 w-16 rounded-xl border border-white/10 bg-transparent"
                      />
                      <span className="font-mono text-sm text-white/70">{color}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="text-xs uppercase tracking-[0.35em] text-white/60">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={event => {
                      setDescription(event.target.value)
                      clearError('description')
                    }}
                    rows={4}
                    placeholder="Décris pourquoi et quand tu veux réaliser cette habitude."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/40"
                  />
                  <FormMessage type="error" message={errors.description} />
                </div>
              </section>

              {/* CTA final */}
              <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/"
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-6 py-3 text-center text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-[#FF4D4D] via-[#FB7185] to-[#F97316] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_20px_60px_rgba(249,115,22,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isLoading ? 'Création...' : 'Créer cette habitude'}
                  </button>
                </div>
              </section>
            </div>

            {/* Colonne latérale avec l'audit IA SMART */}
            <div className="space-y-6">
              <AICoachSmartAudit
                name={name}
                description={description}
                trackingMode={trackingMode}
                dailyGoalValue={dailyGoalValue}
                onImprove={({ name: improvedName, description: improvedDescription }) => {
                  setName(improvedName)
                  setDescription(improvedDescription)
                  clearError('name')
                  clearError('description')
                }}
              />

              <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#C084FC]" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">Rappels SMART</p>
                    <h3 className="text-base font-semibold text-white">Checklist express</h3>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Spécifique : verbe + contexte.</li>
                  <li>• Mesurable : nombre clair ou validation unique.</li>
                  <li>• Atteignable : objectif ≤ 20 unités.</li>
                  <li>• Pertinent : lie-la à une catégorie.</li>
                  <li>• Temporel : planifie un moment précis.</li>
                </ul>
              </section>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
