'use client'

/**
 * Live Preview Card for Habit Forms
 * Shows real-time preview of how the habit will appear in the dashboard
 */

import { useMemo } from 'react'

type HabitFormPreviewProps = {
  name: string
  icon: string
  color: string
  type: 'good' | 'bad'
  trackingMode: 'binary' | 'counter'
  dailyGoalValue?: number
  categoryName?: string
}

export default function HabitFormPreview({
  name,
  icon,
  color,
  type,
  trackingMode,
  dailyGoalValue,
  categoryName,
}: HabitFormPreviewProps) {
  const isBadHabit = type === 'bad'
  const isCounterMode = trackingMode === 'counter'

  const primaryColor = isBadHabit ? '#FF6B6B' : '#5EEAD4'
  const bgGradient = isBadHabit
    ? 'from-red-500/10 to-red-600/5'
    : 'from-emerald-500/10 to-teal-600/5'

  const isEmpty = !name && !icon
  const displayName = name || 'Nom de votre habitude'
  const displayIcon = icon || (isBadHabit ? '🔥' : '✨')
  const displayColor = color || primaryColor

  // Simulated stats for preview
  const previewStats = useMemo(() => ({
    streak: 5,
    todayCount: isCounterMode ? 2 : 1,
    last7Days: 6,
    monthRate: 85,
  }), [isCounterMode])

  return (
    <div className="sticky top-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">Aperçu</h3>
        <span className="text-xs text-white/50">
          {isEmpty ? 'En attente' : 'Prévisualisation'}
        </span>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
          isEmpty
            ? 'border-white/5 bg-white/[0.01] opacity-50'
            : 'border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] shadow-[0_20px_60px_rgba(0,0,0,0.4)]'
        }`}
        style={{
          transform: isEmpty ? 'scale(0.98)' : 'scale(1)',
        }}
      >
        {/* Background gradient accent */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${bgGradient} transition-opacity duration-500`}
          style={{ opacity: isEmpty ? 0 : 0.5 }}
        />

        <div className="relative p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 text-2xl transition-all duration-300"
              style={{
                backgroundColor: `${displayColor}15`,
                boxShadow: isEmpty ? 'none' : `0 0 30px ${displayColor}20`,
              }}
            >
              {displayIcon}
            </div>

            {/* Title & Category */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide transition-colors ${
                  isEmpty ? 'border-white/5 text-white/30' : 'border-white/10 text-white/60'
                }`}>
                  {isBadHabit ? 'Mauvaise' : 'Bonne'}
                </span>
                {isCounterMode && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] transition-colors ${
                    isEmpty ? 'border-white/5 text-white/30' : 'border-white/10 text-white/70'
                  }`}>
                    Compteur
                  </span>
                )}
                {categoryName && (
                  <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] text-purple-300">
                    {categoryName}
                  </span>
                )}
              </div>
              <h2 className={`text-lg font-bold transition-colors ${
                isEmpty ? 'text-white/30' : 'text-white'
              }`}>
                {displayName}
              </h2>
            </div>
          </div>

          {/* Stats Preview */}
          {!isEmpty && (
            <div className="grid grid-cols-2 gap-2 animate-fadeIn">
              <StatPreview
                label="Streak"
                value={`${previewStats.streak}j`}
                icon="🔥"
                color={primaryColor}
              />
              <StatPreview
                label="7 jours"
                value={previewStats.last7Days.toString()}
                icon="📊"
                color="#818cf8"
              />
            </div>
          )}

          {/* Progress Bar for Counter Mode */}
          {!isEmpty && isCounterMode && dailyGoalValue && (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Objectif du jour</span>
                <span className="font-semibold text-white">
                  {previewStats.todayCount}/{dailyGoalValue}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((previewStats.todayCount / dailyGoalValue) * 100, 100)}%`,
                    backgroundColor: primaryColor,
                    boxShadow: `0 0 10px ${primaryColor}60`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Button Preview */}
          {!isEmpty && (
            <button
              disabled
              className="w-full rounded-xl py-3 text-sm font-semibold transition-all opacity-60 cursor-not-allowed"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
                border: `1px solid ${primaryColor}40`,
              }}
            >
              {isBadHabit ? '+ Signaler craquage' : '✓ Valider aujourd\'hui'}
            </button>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-center text-white/40">
        {isEmpty
          ? 'Remplissez le formulaire pour voir un aperçu'
          : 'Aperçu de votre habitude dans le dashboard'
        }
      </p>
    </div>
  )
}

function StatPreview({
  label,
  value,
  icon,
  color
}: {
  label: string
  value: string
  icon: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <p className="text-[10px] uppercase tracking-wide text-white/50">{label}</p>
      </div>
      <p
        className="text-sm font-bold"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  )
}
