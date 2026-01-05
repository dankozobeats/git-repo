'use client'

/**
 * Onglet Avancé - Configuration optionnelle (tracking mode, goals, catégorie)
 */

import FormMessage from '@/components/FormMessage'
import { PauseCircle, PlayCircle } from 'lucide-react'

type Category = {
  id: string
  name: string
  color: string | null
}

type AdvancedTabProps = {
  trackingMode: 'binary' | 'counter'
  onTrackingModeChange: (mode: 'binary' | 'counter') => void
  habitType: 'good' | 'bad'
  dailyGoalValue: number
  onDailyGoalValueChange: (value: number) => void
  categoryId: string
  onCategoryIdChange: (id: string) => void
  categories: Category[]
  mode?: 'create' | 'edit'
  isSuspended?: boolean
  onSuspendedChange?: (suspended: boolean) => void
  errors?: {
    trackingMode?: string
    dailyGoal?: string
    category?: string
  }
}

export default function AdvancedTab({
  trackingMode,
  onTrackingModeChange,
  habitType,
  dailyGoalValue,
  onDailyGoalValueChange,
  categoryId,
  onCategoryIdChange,
  categories,
  mode = 'create',
  isSuspended = false,
  onSuspendedChange,
  errors = {},
}: AdvancedTabProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Tracking Mode */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-[0.35em] text-white/60">
          Mode de suivi
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              key: 'binary' as const,
              label: '✓ Oui/Non',
              helper: 'Une validation par jour.',
            },
            {
              key: 'counter' as const,
              label: '🔢 Compteur',
              helper: 'Plusieurs occurrences à suivre.',
            },
          ].map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => onTrackingModeChange(option.key)}
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

      {/* Daily Goal (si counter) */}
      {trackingMode === 'counter' && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Objectif</p>
              <h3 className="text-base font-semibold text-white">
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
            onChange={e => onDailyGoalValueChange(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <p className="text-xs text-white/60">
            Maintiens un objectif atteignable entre 1 et 20 pour conserver la motivation.
          </p>
          <FormMessage type="error" message={errors.dailyGoal} />
        </div>
      )}

      {/* Category */}
      <div className="space-y-2">
        <label htmlFor="habit-category" className="text-xs uppercase tracking-[0.35em] text-white/60">
          Catégorie
        </label>
        <select
          id="habit-category"
          value={categoryId}
          onChange={e => onCategoryIdChange(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
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

      {/* Suspend toggle (edit only) */}
      {mode === 'edit' && onSuspendedChange && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Statut</p>
              <h3 className="text-base font-semibold text-white">
                {isSuspended ? 'Habitude suspendue' : 'Habitude active'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onSuspendedChange(!isSuspended)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                isSuspended
                  ? 'border-green-500/40 bg-green-500/10 text-green-200 hover:bg-green-500/20'
                  : 'border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20'
              }`}
            >
              {isSuspended ? (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Réactiver
                </>
              ) : (
                <>
                  <PauseCircle className="h-4 w-4" />
                  Suspendre
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-white/60">
            {isSuspended
              ? 'L\'habitude est suspendue et n\'apparaît plus dans le dashboard.'
              : 'Suspends temporairement cette habitude sans la supprimer.'}
          </p>
        </div>
      )}
    </div>
  )
}
