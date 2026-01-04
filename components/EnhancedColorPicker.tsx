'use client'

/**
 * Enhanced Color Picker with preset palette and custom option
 */

import { useState } from 'react'
import { Check, Palette } from 'lucide-react'

const PRESET_COLORS = {
  bad: [
    { name: 'Rouge', value: '#ef4444', description: 'Danger, urgent' },
    { name: 'Orange', value: '#f97316', description: 'Attention' },
    { name: 'Jaune', value: '#eab308', description: 'Vigilance' },
    { name: 'Rose', value: '#ec4899', description: 'Impulsif' },
    { name: 'Violet', value: '#a855f7', description: 'Habitude mentale' },
    { name: 'Gris', value: '#6b7280', description: 'Neutre' },
  ],
  good: [
    { name: 'Vert', value: '#10b981', description: 'Croissance' },
    { name: 'Bleu', value: '#3b82f6', description: 'Calme, focus' },
    { name: 'Indigo', value: '#6366f1', description: 'Spirituel' },
    { name: 'Cyan', value: '#06b6d4', description: 'Fraîcheur' },
    { name: 'Émeraude', value: '#10b981', description: 'Santé' },
    { name: 'Sarcelle', value: '#14b8a6', description: 'Équilibre' },
  ],
}

type EnhancedColorPickerProps = {
  value: string
  onChange: (color: string) => void
  type?: 'good' | 'bad'
  label?: string
}

export default function EnhancedColorPicker({
  value,
  onChange,
  type = 'bad',
  label = 'Couleur',
}: EnhancedColorPickerProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customColor, setCustomColor] = useState(value)

  const colors = PRESET_COLORS[type]

  const handleCustomColorApply = () => {
    onChange(customColor)
    setShowCustomPicker(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/80">{label}</label>
        <button
          type="button"
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
        >
          <Palette className="h-3.5 w-3.5" />
          Personnalisé
        </button>
      </div>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-2">
        {colors.map((color) => {
          const isSelected = value === color.value
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className="group relative aspect-square rounded-xl border-2 transition-all hover:scale-110 focus:scale-110 focus:outline-none"
              style={{
                backgroundColor: color.value,
                borderColor: isSelected ? 'white' : 'transparent',
                boxShadow: isSelected ? `0 0 20px ${color.value}60` : `0 0 0 ${color.value}00`,
              }}
              title={`${color.name} - ${color.description}`}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={3} />
                </div>
              )}

              {/* Tooltip on hover */}
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded-lg bg-black/90 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur">
                {color.name}
                <span className="absolute bottom-0 left-1/2 h-0 w-0 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-black/90"></span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Custom Color Picker */}
      {showCustomPicker && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 animate-fadeIn">
          <p className="text-xs text-white/60">Choisissez une couleur personnalisée</p>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-12 w-full cursor-pointer rounded-lg border border-white/10"
                style={{ backgroundColor: customColor }}
              />
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="#000000"
                maxLength={7}
                className="h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCustomColorApply}
              className="flex-1 rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Selected Color Preview */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <div
          className="h-5 w-5 rounded-md border border-white/20 shadow-inner"
          style={{ backgroundColor: value }}
        />
        <span>Sélectionné: {value}</span>
      </div>
    </div>
  )
}
