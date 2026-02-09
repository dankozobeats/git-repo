'use client'

/**
 * Header de la page détail habitude avec navigation par onglets
 */

import Link from 'next/link'
import { ArrowLeft, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

type TabType = 'overview' | 'calendar' | 'coach' | 'history' | 'notes' | 'tasks' | 'settings'

type HabitDetailHeaderProps = {
  habit: {
    id: string
    name: string
    icon: string | null
    color: string
    type: 'good' | 'bad'
    tracking_mode: 'binary' | 'counter' | null
  }
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  prevHabitId?: string | null
  nextHabitId?: string | null
}

export default function HabitDetailHeader({
  habit,
  activeTab,
  onTabChange,
  prevHabitId,
  nextHabitId,
}: HabitDetailHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isBadHabit = habit.type === 'bad'
  const primaryColor = isBadHabit ? '#FF6B6B' : '#5EEAD4'

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'calendar', label: 'Calendrier', icon: '📅' },
    { id: 'coach', label: 'Coach', icon: '🧠' },
    { id: 'history', label: 'Historique', icon: '📚' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'tasks', label: 'Tâches', icon: '✅' },
    { id: 'settings', label: 'Config', icon: '⚙️' },
  ]

  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-[#01030a]/95 backdrop-blur">
      {/* Header avec back button, icon, name, menu */}
      <div className="flex items-center justify-between gap-4 p-4">
        {/* Left: Back button + Habit info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/"
            className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Icon + Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {habit.icon && (
              <div
                className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-2xl"
                style={{
                  backgroundColor: `${habit.color || primaryColor}15`,
                  boxShadow: `0 0 20px ${primaryColor}15`
                }}
              >
                {habit.icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{habit.name}</h1>
              <p className="text-xs text-white/50">
                {isBadHabit ? 'Mauvaise' : 'Bonne'} habitude
                {habit.tracking_mode === 'counter' && ' • Compteur'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Navigation + Menu actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Navigation Arrows */}
          <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <Link
              href={prevHabitId ? `/habits/${prevHabitId}` : '#'}
              className={`flex h-9 w-9 items-center justify-center transition ${prevHabitId
                  ? 'text-white/70 hover:bg-white/10 hover:text-white'
                  : 'text-white/10 cursor-not-allowed'
                }`}
              onClick={(e) => !prevHabitId && e.preventDefault()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <Link
              href={nextHabitId ? `/habits/${nextHabitId}` : '#'}
              className={`flex h-9 w-9 items-center justify-center transition ${nextHabitId
                  ? 'text-white/70 hover:bg-white/10 hover:text-white'
                  : 'text-white/10 cursor-not-allowed'
                }`}
              onClick={(e) => !nextHabitId && e.preventDefault()}
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-white/10 bg-[#0d0f17]/95 p-2 shadow-2xl backdrop-blur">
                  <Link
                    href={`/habits/${habit.id}/edit`}
                    className="block rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ✏️ Modifier
                  </Link>
                  <Link
                    href="/"
                    className="block rounded-lg px-3 py-2 text-sm text-white/90 transition hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ← Retour dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <nav className="flex gap-1 overflow-x-auto px-4 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition ${activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-white/50 hover:text-white/80'
              }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
