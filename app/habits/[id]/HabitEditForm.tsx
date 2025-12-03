'use client'

// Formulaire d'édition premium : reprend la refonte SMART avec possibilité de suspendre l'habitude.

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import FormMessage from '@/components/FormMessage'
import AICoachSmartAudit from '@/components/AICoachSmartAudit'
import { Palette, PauseCircle, PlayCircle, Sparkles, Wand2 } from 'lucide-react'

type Habit = Database['public']['Tables']['habits']['Row']
type Category = Database['public']['Tables']['categories']['Row']

type HabitEditFormProps = {
  habit: Habit
  categories: Category[]
}

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

type SmartErrorField = 'name' | 'description' | 'dailyGoal' | 'category' | 'trackingMode'

export default function HabitEditForm({ habit, categories }: HabitEditFormProps) {
  const router = useRouter()
  const [habitType, setHabitType] = useState<'good' | 'bad'>((habit.type as 'good' | 'bad') || 'bad')
  const [trackingMode, setTrackingMode] = useState<'binary' | 'counter'>(
    (habit.tracking_mode as 'binary' | 'counter') || 'binary'
  )
  const [dailyGoalValue, setDailyGoalValue] = useState(habit.daily_goal_value ?? 3)
  const [name, setName] = useState(habit.name)
  const [icon, setIcon] = useState(habit.icon || '')
  const [color, setColor] = useState(habit.color || '#ef4444')
  const [description, setDescription] = useState(habit.description || '')
  const [categoryId, setCategoryId] = useState(habit.category_id || '')
  const [isSuspended, setIsSuspended] = useState<boolean>(habit.is_archived)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<SmartErrorField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    status: false,
    typeMode: false,
    category: false,
    identity: false,
    coach: false,
    tips: false,
  })
  const errorScrollMap: Record<SmartErrorField, string> = {
    name: 'edit-habit-name',
    description: 'edit-habit-description',
    dailyGoal: 'edit-habit-daily-goal',
    category: 'edit-habit-category',
    trackingMode: 'edit-habit-tracking-mode',
  }
  const errorSectionMap: Record<SmartErrorField, keyof typeof openSections> = {
    name: 'identity',
    description: 'identity',
    dailyGoal: 'typeMode',
    category: 'category',
    trackingMode: 'typeMode',
  }

  const dailyGoalType = habitType === 'good' ? 'minimum' : 'maximum'
  const presets = habitType === 'bad' ? BAD_PRESETS : GOOD_PRESETS
  const vagueKeywords = useMemo(() => ['habitude', 'truc', 'chose', 'améliorer', 'meilleur', 'projet'], [])

  const clearError = useCallback((field: SmartErrorField) => {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const selectPreset = useCallback(
    (preset: (typeof BAD_PRESETS)[number]) => {
      setName(preset.name)
      setIcon(preset.icon)
      setColor(preset.color)
      clearError('name')
    },
    [clearError]
  )

  const scrollToErrorField = (field: SmartErrorField) => {
    const targetId = errorScrollMap[field]
    if (!targetId) return
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }
  }

  const validateSmart = () => {
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const newErrors: Partial<Record<SmartErrorField, string>> = {}

    if (trimmedName.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères.'
    } else if (vagueKeywords.some(keyword => trimmedName.toLowerCase().includes(keyword))) {
      newErrors.name = 'Ajoute un verbe ou un contexte pour clarifier le nom.'
    }

    if (trackingMode !== 'binary' && trackingMode !== 'counter') {
      newErrors.trackingMode = 'Choisis un mode de suivi pour cette habitude.'
    }

    // Description devient facultative pour éviter de bloquer la mise à jour d’habitudes existantes.
    if (trackingMode === 'binary' && trimmedDescription && trimmedDescription.length < 5) {
      newErrors.description = 'Décris rapidement la routine (≥ 5 caractères) ou laisse vide.'
    }

    if (trackingMode === 'counter') {
      if (!dailyGoalValue || dailyGoalValue < 1) {
        newErrors.dailyGoal = 'Objectif minimum: 1 pour rester mesurable.'
      } else if (dailyGoalValue > 20) {
        newErrors.dailyGoal = 'Fixe une limite réaliste (≤ 20).'
      }
    }

    setErrors(newErrors)
    const firstError = Object.keys(newErrors)[0] as SmartErrorField | undefined
    if (firstError) {
      const section = errorSectionMap[firstError]
      if (section) {
        setOpenSections(prev => ({ ...prev, [section]: true }))
      }
      window.setTimeout(() => scrollToErrorField(firstError), 80)
    }
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setFormError(null)

    const isValid = validateSmart()
    if (!isValid) {
      setFormError('Corrige les champs signalés pour enregistrer les modifications.')
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setFormError('Session expirée. Merci de vous reconnecter.')
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
      is_archived: isSuspended,
      updated_at: new Date().toISOString(),
    }

    if (trackingMode === 'counter') {
      updates.daily_goal_value = dailyGoalValue
      updates.daily_goal_type = dailyGoalType
    } else {
      updates.daily_goal_value = null
      updates.daily_goal_type = null
    }

    const { error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habit.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Supabase update error:', error)
      setFormError('Impossible de mettre à jour cette habitude pour le moment.')
      setIsLoading(false)
      return
    }

    router.push(`/?highlight=${habit.id}#habit-card-${habit.id}`)
    router.refresh()
  }

  const statusLabel = isSuspended ? 'Habitude suspendue' : 'Habitude active'
  const statusDescription = isSuspended
    ? 'Cette habitude ne sera plus proposée dans le dashboard tant que tu ne la réactives pas.'
    : 'Habitude suivie normalement dans toutes les vues.'

  const toggleSection = (id: string) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {formError && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {formError}
        </div>
      )}

      {/* Statut & suspension */}
      <CollapsibleCard
        title="Statut"
        subtitle={statusLabel}
        open={openSections.status}
        onToggle={() => toggleSection('status')}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Statut</p>
            <h2 className="text-xl font-semibold text-white">{statusLabel}</h2>
            <p className="text-sm text-white/60">{statusDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSuspended(prev => !prev)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
              isSuspended
                ? 'border-[#4ade80]/40 bg-[#4ade80]/10 text-[#4ade80]'
                : 'border-[#fb7185]/40 bg-[#fb7185]/10 text-[#fb7185]'
            }`}
          >
            {isSuspended ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
            {isSuspended ? 'Réactiver' : 'Suspendre'}
          </button>
        </div>
      </CollapsibleCard>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          {/* Type & mode */}
          <CollapsibleCard
            title="Paramètres principaux"
            subtitle="Type et mode"
            open={openSections.typeMode}
            onToggle={() => toggleSection('typeMode')}
          >
            <div className="space-y-2" id="edit-habit-tracking-mode">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Type et mode</p>
              <h2 className="text-xl font-semibold text-white">Paramètres principaux</h2>
              <p className="text-sm text-white/60">Ajuste la polarité et le mode de suivi pour recalibrer la stratégie.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ key: 'bad', label: '🔥 Mauvaise habitude', helper: 'Réduis l’impact de cette routine.' }, { key: 'good', label: '✨ Bonne habitude', helper: 'Renforce ton comportement positif.' }].map(option => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setHabitType(option.key as 'bad' | 'good')
                    clearError('name')
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
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
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Mode de suivi</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[{ key: 'binary', label: '✓ Oui/Non', helper: 'Pour une validation unique.' }, { key: 'counter', label: '🔢 Compteur', helper: 'Plusieurs occurrences quotidiennes.' }].map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setTrackingMode(option.key as 'binary' | 'counter')
                      clearError('trackingMode')
                    }}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
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
              <FormMessage message={errors.trackingMode} />
            </div>

            {trackingMode === 'counter' && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5" id="edit-habit-daily-goal">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/60">Objectif quotidien</p>
                    <p className="text-sm text-white/70">
                      {habitType === 'good' ? 'Minimum à atteindre' : 'Maximum à ne pas dépasser'}
                    </p>
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
                <FormMessage message={errors.dailyGoal} />
              </div>
            )}
          </CollapsibleCard>

          {/* Catégories + presets */}
          <CollapsibleCard
            title="Repositionne l’habitude"
            subtitle="Catégorie & inspiration"
            open={openSections.category}
            onToggle={() => toggleSection('category')}
          >
            <div id="edit-habit-category">
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Catégorie</label>
              <select
                value={categoryId}
                onChange={event => {
                  setCategoryId(event.target.value)
                  clearError('category')
                }}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/50"
              >
                <option value="">Sans catégorie</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FormMessage message={errors.category} />
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
          </CollapsibleCard>

          {/* Identité */}
          <CollapsibleCard
            title="Nom, icône et contexte"
            subtitle="Identité"
            open={openSections.identity}
            onToggle={() => toggleSection('identity')}
          >
            <div id="edit-habit-name">
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Nom précis *</label>
              <input
                type="text"
                value={name}
                onChange={event => {
                  setName(event.target.value)
                  clearError('name')
                }}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/40"
                placeholder="Ex: Limiter le fast-food à 1 fois"
              />
              <FormMessage message={errors.name} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-white/60 flex items-center gap-2">
                  Icône <Wand2 className="h-3.5 w-3.5 text-white/60" />
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={event => setIcon(event.target.value)}
                  maxLength={2}
                  placeholder="🔥"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-2xl text-white placeholder:text-white/40 focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/40"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.35em] text-white/60 flex items-center gap-2">
                  Couleur <Palette className="h-3.5 w-3.5 text-white/60" />
                </label>
                <div className="mt-2 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <input
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
              <label className="text-xs uppercase tracking-[0.35em] text-white/60">Description</label>
              <textarea
                value={description}
                onChange={event => {
                  setDescription(event.target.value)
                  clearError('description')
                }}
                rows={4}
                placeholder="Précise ton intention, ton contexte ou ton déclencheur."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#C084FC] focus:outline-none focus:ring-2 focus:ring-[#C084FC]/40"
              />
              <FormMessage message={errors.description} />
            </div>
          </CollapsibleCard>

          {/* CTA */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-6 py-3 text-center text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#FF4D4D] via-[#FB7185] to-[#F97316] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_20px_60px_rgba(249,115,22,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? 'Enregistrement...' : 'Mettre à jour'}
              </button>
            </div>
          </section>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <CollapsibleCard
            title="Audit intelligent"
            subtitle="Coaching IA"
            open={openSections.coach}
            onToggle={() => toggleSection('coach')}
          >
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
          </CollapsibleCard>

          <CollapsibleCard
            title="Checklist d’édition"
            subtitle="Astuces"
            open={openSections.tips}
            onToggle={() => toggleSection('tips')}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#C084FC]" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Astuces</p>
                <h3 className="text-base font-semibold text-white">Checklist d’édition</h3>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• Ajuste le statut pour suspendre ou relancer une habitude en douceur.</li>
              <li>• Utilise les presets pour réécrire rapidement un nom ou une couleur.</li>
              <li>• Rappelle-toi que les objectifs counters restent entre 1 et 20.</li>
            </ul>
          </CollapsibleCard>
        </div>
      </div>
    </form>
  )
}

function CollapsibleCard({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/30 backdrop-blur">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-white/30"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">{subtitle}</p>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xl font-bold text-white/80">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </section>
  )
}
