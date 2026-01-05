'use client'

/**
 * Onglet Essentiel - Champs obligatoires pour créer/éditer une habitude
 */

import FormMessage from '@/components/FormMessage'
import { Palette, Wand2 } from 'lucide-react'

type EssentialTabProps = {
  habitType: 'good' | 'bad'
  onHabitTypeChange: (type: 'good' | 'bad') => void
  name: string
  onNameChange: (name: string) => void
  icon: string
  onIconChange: (icon: string) => void
  color: string
  onColorChange: (color: string) => void
  description: string
  onDescriptionChange: (description: string) => void
  presets: Array<{ name: string; icon: string; color: string }>
  onPresetSelect: (preset: { name: string; icon: string; color: string }) => void
  errors?: {
    name?: string
    description?: string
  }
}

export default function EssentialTab({
  habitType,
  onHabitTypeChange,
  name,
  onNameChange,
  icon,
  onIconChange,
  color,
  onColorChange,
  description,
  onDescriptionChange,
  presets,
  onPresetSelect,
  errors = {},
}: EssentialTabProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Type selection */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-[0.35em] text-white/60">
          Type d'habitude *
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              key: 'bad' as const,
              label: '🔥 Mauvaise habitude',
              helper: 'Idéal pour limiter les craquages.',
            },
            {
              key: 'good' as const,
              label: '✨ Bonne habitude',
              helper: 'Pour valider une action positive.',
            },
          ].map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => onHabitTypeChange(option.key)}
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
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="habit-name" className="text-xs uppercase tracking-[0.35em] text-white/60">
          Nom précis *
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Ex: Limiter le fast-food à 1 fois"
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
        <FormMessage type="error" message={errors.name} />
      </div>

      {/* Icon + Color */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="habit-icon" className="text-xs uppercase tracking-[0.35em] text-white/60 flex items-center gap-2">
            Icône <Wand2 className="h-3.5 w-3.5 text-white/60" />
          </label>
          <input
            id="habit-icon"
            type="text"
            value={icon}
            onChange={e => onIconChange(e.target.value)}
            placeholder="🔥"
            maxLength={2}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-2xl text-white placeholder:text-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="habit-color" className="text-xs uppercase tracking-[0.35em] text-white/60 flex items-center gap-2">
            Couleur <Palette className="h-3.5 w-3.5 text-white/60" />
          </label>
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
            <input
              id="habit-color"
              type="color"
              value={color}
              onChange={e => onColorChange(e.target.value)}
              className="h-12 w-16 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="font-mono text-sm text-white/70">{color}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="habit-description" className="text-xs uppercase tracking-[0.35em] text-white/60">
          Description
        </label>
        <textarea
          id="habit-description"
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Décris pourquoi et quand tu veux réaliser cette habitude."
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
        />
        <FormMessage type="error" message={errors.description} />
      </div>

      {/* Presets */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-[0.35em] text-white/60">
          Suggestions rapides
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          {presets.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onPresetSelect(preset)}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-white/30 hover:bg-black/50 hover:scale-[1.02]"
            >
              <div className="text-2xl mb-2">{preset.icon}</div>
              <p className="text-sm font-semibold text-white">{preset.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
