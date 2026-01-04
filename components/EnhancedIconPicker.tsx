'use client'

/**
 * Enhanced Icon Picker with categorized emojis
 */

import { useState } from 'react'
import { Search, X } from 'lucide-react'

const EMOJI_CATEGORIES = {
  'Sport & Santé': ['💪', '🏃', '🧘', '🏋️', '🚴', '⚽', '🏊', '🤸', '🧗', '🥊', '🎾', '⛹️'],
  'Alimentation': ['🥗', '🍎', '🥑', '🥕', '🥦', '🍇', '🫐', '💧', '☕', '🍔', '🍕', '🍰'],
  'Productivité': ['📚', '✍️', '💼', '📝', '💻', '📊', '🎯', '⏰', '📱', '🧠', '💡', '🔔'],
  'Bien-être': ['😴', '🧘‍♀️', '🌸', '🕯️', '🎵', '🎨', '🌅', '🌙', '⭐', '🌈', '☀️', '🔥'],
  'Social': ['👥', '💬', '📞', '🤝', '👨‍👩‍👧', '❤️', '🎉', '🎁', '🌍', '✈️', '🏠', '🎭'],
  'Habitudes': ['🚬', '🍺', '🍷', '🎮', '📺', '🛋️', '😴', '🤳', '🛒', '💸', '🎰', '🔞'],
}

type EnhancedIconPickerProps = {
  value: string
  onChange: (icon: string) => void
  label?: string
  recentEmojis?: string[]
}

export default function EnhancedIconPicker({
  value,
  onChange,
  label = 'Icône',
  recentEmojis = [],
}: EnhancedIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const allEmojis = Object.values(EMOJI_CATEGORIES).flat()
  const filteredEmojis = searchQuery
    ? allEmojis.filter(() => true) // Simple fallback (a real implementation would search by description)
    : selectedCategory
    ? EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]
    : allEmojis

  const handleSelect = (emoji: string) => {
    onChange(emoji)
    setIsOpen(false)
    setSearchQuery('')
    setSelectedCategory(null)
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white/80">{label}</label>

      {/* Selected Icon Display */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative flex h-20 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-6 transition hover:border-white/20 hover:bg-white/10"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5 text-3xl ring-2 ring-white/10">
            {value || '🎯'}
          </div>
          <div className="text-left">
            <p className="text-xs text-white/50">Icône sélectionnée</p>
            <p className="text-sm text-white/80">{value ? 'Cliquez pour changer' : 'Choisir une icône'}</p>
          </div>
        </div>

        <div className="text-white/40 transition-transform group-hover:translate-x-1">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0f17] shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white">Choisir une icône</h3>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setSearchQuery('')
                  setSelectedCategory(null)
                }}
                className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="border-b border-white/10 p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Rechercher un emoji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Recent Emojis */}
            {recentEmojis.length > 0 && !searchQuery && (
              <div className="border-b border-white/10 p-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
                  Récemment utilisés
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentEmojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-2xl transition hover:scale-110 hover:border-white/30 hover:bg-white/10"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Tabs */}
            {!searchQuery && (
              <div className="border-b border-white/10 px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                      selectedCategory === null
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    Tous
                  </button>
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                        selectedCategory === category
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emoji Grid */}
            <div className="max-h-96 overflow-y-auto p-6">
              <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12">
                {filteredEmojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className={`flex h-14 w-14 items-center justify-center rounded-lg border text-3xl transition hover:scale-110 hover:border-white/30 hover:bg-white/10 ${
                      value === emoji
                        ? 'border-white/30 bg-white/15 ring-2 ring-white/20'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-6">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setSearchQuery('')
                  setSelectedCategory(null)
                }}
                className="w-full rounded-xl border border-white/20 bg-white/10 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
