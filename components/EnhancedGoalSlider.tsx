'use client'

/**
 * Enhanced Goal Slider with visual zones and quick presets
 */

import { useState } from 'react'

type EnhancedGoalSliderProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  type?: 'minimum' | 'maximum'
}

const QUICK_PRESETS = [1, 3, 5, 10]

const ZONES = [
  { min: 1, max: 3, label: 'Réaliste', color: '#10b981', bgColor: 'bg-emerald-500/10' },
  { min: 4, max: 7, label: 'Challengeant', color: '#f59e0b', bgColor: 'bg-amber-500/10' },
  { min: 8, max: 20, label: 'Ambitieux', color: '#ef4444', bgColor: 'bg-red-500/10' },
]

export default function EnhancedGoalSlider({
  value,
  onChange,
  min = 1,
  max = 20,
  label = 'Objectif quotidien',
  type = 'minimum',
}: EnhancedGoalSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const currentZone = ZONES.find((zone) => value >= zone.min && value <= zone.max)
  const percentage = ((value - min) / (max - min)) * 100

  const getZoneLabel = () => {
    if (!currentZone) return ''
    return currentZone.label
  }

  const getValueDescription = () => {
    if (value === 1) {
      return type === 'minimum' ? '1 fois par jour' : 'Maximum 1 fois'
    }
    return type === 'minimum'
      ? `${value} fois par jour`
      : `Maximum ${value} fois`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <label className="text-sm font-medium text-white/80">{label}</label>
          <p className="text-xs text-white/50">{getValueDescription()}</p>
        </div>

        {/* Current Value Badge */}
        <div
          className="flex items-center gap-2 rounded-full border px-4 py-2 transition-all"
          style={{
            backgroundColor: `${currentZone?.color}15`,
            borderColor: `${currentZone?.color}40`,
          }}
        >
          <span className="text-2xl font-bold" style={{ color: currentZone?.color }}>
            {value}
          </span>
          <span className="text-xs text-white/60">{getZoneLabel()}</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex gap-2">
        {QUICK_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              value === preset
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Slider Container */}
      <div className="relative pt-2">
        {/* Zone Background */}
        <div className="absolute top-8 left-0 right-0 flex h-2 overflow-hidden rounded-full">
          {ZONES.map((zone, idx) => {
            const zoneWidth = ((zone.max - zone.min + 1) / (max - min + 1)) * 100
            return (
              <div
                key={idx}
                className={`${zone.bgColor} transition-opacity`}
                style={{
                  width: `${zoneWidth}%`,
                  opacity: isDragging ? 0.8 : 0.5,
                }}
              />
            )
          })}
        </div>

        {/* Slider Track */}
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="slider-enhanced w-full"
            style={{
              background: `linear-gradient(to right, ${currentZone?.color}60 0%, ${currentZone?.color}60 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />

          {/* Value Indicator */}
          <div
            className="pointer-events-none absolute -top-10 flex items-center justify-center transition-all duration-150"
            style={{
              left: `calc(${percentage}% - 20px)`,
            }}
          >
            <div
              className="rounded-full border-2 px-3 py-1 text-xs font-bold shadow-lg"
              style={{
                backgroundColor: currentZone?.color,
                borderColor: 'white',
                transform: isDragging ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              {value}
            </div>
          </div>
        </div>

        {/* Scale Markers */}
        <div className="mt-2 flex justify-between text-[10px] text-white/40">
          <span>1</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
        </div>
      </div>

      {/* Zone Description */}
      {currentZone && (
        <div
          className="rounded-lg border p-3 transition-all animate-fadeIn"
          style={{
            backgroundColor: `${currentZone.color}08`,
            borderColor: `${currentZone.color}30`,
          }}
        >
          <p className="text-xs text-white/70">
            <span className="font-semibold" style={{ color: currentZone.color }}>
              {currentZone.label}
            </span>
            {' — '}
            {currentZone.min === 1 && currentZone.max === 3 && (
              'Objectif accessible pour commencer une nouvelle habitude'
            )}
            {currentZone.min === 4 && currentZone.max === 7 && (
              'Bon équilibre entre ambition et faisabilité'
            )}
            {currentZone.min === 8 && currentZone.max === 20 && (
              'Objectif ambitieux, assure-toi d\'avoir le temps nécessaire'
            )}
          </p>
        </div>
      )}
    </div>
  )
}
