'use client'

import { useMemo, useState } from 'react'
import HabitCard, { type HabitWithMeta } from '@/components/HabitCard'
import CategoryAccordion, { type CategoryGroup } from '@/components/CategoryAccordion'

type HomeHabitsPanelProps = {
  badGroups: CategoryGroup[]
  goodGroups: CategoryGroup[]
  allHabits: HabitWithMeta[]
}

export default function HomeHabitsPanel({ badGroups, goodGroups, allHabits }: HomeHabitsPanelProps) {
  const [query, setQuery] = useState('')
  const [showAllMobile, setShowAllMobile] = useState(false)

  const normalizedQuery = query.trim().toLowerCase()
  const hasSearch = normalizedQuery.length > 0

  const rememberCategory = (categoryId: string | null) => {
    if (!categoryId || typeof window === 'undefined') return
    window.localStorage.setItem('lastOpenCategory', categoryId)
  }

  const filteredHabits = useMemo(() => {
    if (!hasSearch) return []
    return allHabits.filter(habit => {
      const haystack = `${habit.name} ${habit.description ?? ''} ${habit.categoryName ?? ''}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [allHabits, hasSearch, normalizedQuery])

  return (
    <section className="space-y-3 md:space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Rechercher une habitude…"
          className="w-full rounded-2xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
        />
        {!hasSearch && (
          <button
            type="button"
            onClick={() => setShowAllMobile(prev => !prev)}
            className="md:hidden rounded-2xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm font-medium text-white/90"
            aria-pressed={showAllMobile}
          >
            {showAllMobile ? '↩️ Mode intelligent' : '👁️ Voir toutes les habitudes'}
          </button>
        )}
      </div>

      {hasSearch ? (
        <div className="space-y-2">
          {filteredHabits.length > 0 ? (
            filteredHabits.map(habit => (
              <HabitCard key={habit.id} habit={habit} onActionComplete={() => rememberCategory(habit.category_id)} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-gray-900/40 px-4 py-6 text-center text-sm text-gray-400">
              Aucun résultat. Essaie un autre terme.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          <CategoryAccordion
            groups={badGroups}
            emptyLabel="Aucune mauvaise habitude active."
            showAllMobile={showAllMobile}
          />
          <CategoryAccordion
            groups={goodGroups}
            emptyLabel="Aucune bonne habitude active."
            showAllMobile={showAllMobile}
          />
        </div>
      )}
    </section>
  )
}
