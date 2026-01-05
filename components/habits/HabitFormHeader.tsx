'use client'

/**
 * Header pour formulaires création/édition habitude
 * Inclut navigation tabs + bouton modal Coach IA
 */

import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

type TabType = 'essential' | 'advanced' | 'summary'

type HabitFormHeaderProps = {
  mode: 'create' | 'edit'
  habitName?: string
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onOpenCoach: () => void
}

export default function HabitFormHeader({
  mode,
  habitName,
  activeTab,
  onTabChange,
  onOpenCoach,
}: HabitFormHeaderProps) {
  const title = mode === 'create' ? 'Créer une habitude SMART' : `Modifier ${habitName || 'l\'habitude'}`
  const subtitle = mode === 'create'
    ? 'Optimise tes routines avec des objectifs mesurables'
    : 'Ajuste les paramètres de ton habitude'

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'essential', label: 'Essentiel', icon: '✨' },
    { id: 'advanced', label: 'Avancé', icon: '⚙️' },
    { id: 'summary', label: 'Récap', icon: '✓' },
  ]

  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-[#05070f]/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Link
            href={mode === 'create' ? '/' : `/habits/${habitName}`}
            className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              {mode === 'create' ? 'Studio Habitudes' : 'Édition'}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{title}</h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Bouton Coach IA */}
        <button
          type="button"
          onClick={onOpenCoach}
          className="flex-shrink-0 flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 sm:px-4 py-2 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20 hover:border-purple-500/60"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Coach IA</span>
        </button>
      </div>

      {/* Tabs */}
      <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
