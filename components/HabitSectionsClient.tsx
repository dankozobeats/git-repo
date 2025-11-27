'use client'

// Tableau de bord client qui gère recherche, filtres et affichage des habitudes.

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import HabitQuickActions from '@/components/HabitQuickActions'
import CategoryManager from '@/components/CategoryManager'
import CoachRoastBubble from '@/components/CoachRoastBubble'
import HabitToast from '@/components/HabitToast'
import { Search as SearchIcon, ChevronDown } from 'lucide-react'
import { HABIT_SEARCH_EVENT, scrollToSearchSection } from '@/lib/ui/scroll'
import type { Database } from '@/types/database'

type CategoryRow = Database['public']['Tables']['categories']['Row']

type HabitRow = Database['public']['Tables']['habits']['Row'] & {
  current_streak?: number | null
  total_logs?: number | null
  total_craquages?: number | null
}

type HabitSectionsClientProps = {
  goodHabits: HabitRow[]
  badHabits: HabitRow[]
  categories: CategoryRow[]
  todayCounts: Record<string, number>
  categoryStats: CategoryStat[]
  showBadHabits?: boolean
  showGoodHabits?: boolean
  coachMessage?: string
}

type CategoryStat = {
  id: string
  name: string
  color: string | null
  count: number
}

type CategoryFilterValue = 'all' | 'uncategorized' | string

export default function HabitSectionsClient({
  goodHabits,
  badHabits,
  categories,
  todayCounts,
  categoryStats,
  showBadHabits = true,
  showGoodHabits = true,
  coachMessage,
}: HabitSectionsClientProps) {
  // États locaux pour piloter recherche, filtres et UI responsive.
  const [searchQuery, setSearchQuery] = useState('')
  const [goodCategoryFilter, setGoodCategoryFilter] = useState<CategoryFilterValue>('all')
  const [badCategoryFilter, setBadCategoryFilter] = useState<CategoryFilterValue>('all')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Stocke le message du toast premium pour le diffuser dans la zone feedback.
  const [toastMessage, setToastMessage] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const categoriesList = categories ?? []
  const todayCountsMap = useMemo(
    // Convertit l'objet provenant du serveur en Map pour des lookups rapides.
    () => new Map<string, number>(Object.entries(todayCounts).map(([id, value]) => [id, value])),
    [todayCounts]
  )
  // Filtre insensible à la casse basé sur le champ name.
  const filterByQuery = useCallback(
    (habitList: HabitRow[]) => {
      const normalized = searchQuery.trim().toLowerCase()
      if (!normalized) return habitList
      return habitList.filter(habit => habit.name.toLowerCase().includes(normalized))
    },
    [searchQuery]
  )

  const filterByCategory = useCallback((habitList: HabitRow[], filterValue: CategoryFilterValue) => {
    if (filterValue === 'all') return habitList
    if (filterValue === 'uncategorized') {
      return habitList.filter(habit => !habit.category_id)
    }
    return habitList.filter(habit => habit.category_id === filterValue)
  }, [])

  // Liste filtrée affichée dans la section "bonnes habitudes".
  const filteredGoodHabits = useMemo(
    () => filterByCategory(filterByQuery(goodHabits), goodCategoryFilter),
    [filterByCategory, filterByQuery, goodHabits, goodCategoryFilter]
  )

  // Liste filtrée affichée dans la section "mauvaises habitudes".
  const filteredBadHabits = useMemo(
    () => filterByCategory(filterByQuery(badHabits), badCategoryFilter),
    [badHabits, badCategoryFilter, filterByCategory, filterByQuery]
  )

  // Résultats surlignés lorsque l'utilisateur tape dans la barre de recherche.
  const searchResults = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase()
    if (!normalized) return []
    return [...goodHabits, ...badHabits].filter(habit => habit.name.toLowerCase().includes(normalized))
  }, [goodHabits, badHabits, searchQuery])

  // Callback partagée entre input et bouton, simplifie les tests.
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  // Active la recherche depuis FloatingQuickActions en scrollant/focus l'input.
  useEffect(() => {
    const handleSearchOpen = () => {
      scrollToSearchSection()
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    }

    window.addEventListener(HABIT_SEARCH_EVENT, handleSearchOpen)
    return () => {
      window.removeEventListener(HABIT_SEARCH_EVENT, handleSearchOpen)
    }
  }, [])

  // Détecte les breakpoints pour ajuster l'affichage des bulles coach.
  useEffect(() => {
    const update = () => {
      setIsMobile(window.innerWidth < 768)
    }
    update()
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
    }
  }, [])

  // Handler centralisé pour afficher le toast lorsqu'une habitude est validée (succès ou erreur).
  const handleHabitValidated = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setToastMessage({ message, variant })
  }, [])

  const hasSearch = Boolean(searchQuery.trim())

  // Rend la zone principale: recherche sticky, sections filtrées et gestion des catégories.
  return (
    <section className="relative z-0 space-y-6">
      {/* Regroupe la zone de feedback (toast premium + coach) pour garantir la bonne position dans le flux. */}
      <div id="habit-feedback-area" className="space-y-3">
        {toastMessage && (
          <HabitToast
            message={toastMessage.message}
            variant={toastMessage.variant}
            onComplete={() => setToastMessage(null)}
          />
        )}
        {coachMessage &&
          (isMobile ? (
            <CoachRoastBubble message={coachMessage} variant="toast" />
          ) : (
            <CoachRoastBubble message={coachMessage} variant="inline" />
          ))}
      </div>

      <div id="searchBar" data-mobile-search className="sticky top-0 z-[200] bg-[#0c0f1a] px-2 py-3 sm:px-4 sm:py-4">
        <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-3 py-4 sm:px-4 shadow-inner shadow-black/30">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Recherche</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={event => handleSearchChange(event.target.value)}
                placeholder="Rechercher une habitude…"
                className="w-full rounded-2xl border border-white/10 bg-[#12121A]/80 px-12 py-4 text-base text-white placeholder:text-white/50 shadow-inner shadow-black/40 focus:border-[#FF4D4D]/60 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/20"
                aria-label="Rechercher une habitude"
              />
            </div>
            <button
              type="button"
              onClick={() => searchInputRef.current?.focus()}
              className="rounded-2xl border border-white/15 bg-[#0d1326]/80 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {hasSearch && (
        <div id="searchResults" className="space-y-3 rounded-3xl border border-white/10 bg-black/30 px-3 py-4 sm:px-4">
          {searchResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center text-sm text-white/70">
              Aucun résultat pour « {searchQuery} »
            </div>
          ) : (
            searchResults.map(habit => (
              <HabitRowCard
                key={habit.id}
                habit={habit}
                type={habit.type as 'good' | 'bad'}
                todayCount={todayCountsMap.get(habit.id) ?? 0}
              />
            ))
          )}
        </div>
      )}

      <div
        id="mainScrollArea"
        className={`snap-y snap-mandatory px-2 ${hasSearch ? 'hidden' : ''} md:h-screen md:overflow-y-auto sm:px-4`}
      >
        {showGoodHabits && (
          <section id="goodHabitsSection" className="scroll-section snap-start space-y-4">
            <HabitSectionHeader
              title="✨ Bonnes habitudes"
              count={filteredGoodHabits.length}
              filterId="goodHabitsFilter"
              filterValue={goodCategoryFilter}
              onFilterChange={setGoodCategoryFilter}
              categories={categoriesList}
            />
            <HabitList
              habits={filteredGoodHabits}
              type="good"
              todayCountsMap={todayCountsMap}
              containerId="goodHabitsList"
              onHabitValidated={handleHabitValidated}
            />
          </section>
        )}

        {showBadHabits && (
          <section id="badHabitsSection" className="scroll-section snap-start space-y-4">
            <HabitSectionHeader
              title="⚡ Mauvaises habitudes"
              count={filteredBadHabits.length}
              filterId="badHabitsFilter"
              filterValue={badCategoryFilter}
              onFilterChange={setBadCategoryFilter}
              categories={categoriesList}
            />
            <HabitList
              habits={filteredBadHabits}
              type="bad"
              todayCountsMap={todayCountsMap}
              containerId="badHabitsList"
              onHabitValidated={handleHabitValidated}
            />
          </section>
        )}
      </div>

      <div className="relative z-0 space-y-4 rounded-3xl border border-white/10 bg-black/20 px-3 py-4 sm:px-4">
        <button
          type="button"
          onClick={() => setCategoriesOpen(prev => !prev)}
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/5"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-white/60">Catégories personnalisées</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
        </button>
        {categoriesOpen && (
          <div className="space-y-4">
            <CategoryOverview stats={categoryStats} />
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-4 sm:px-4">
              <CategoryManager />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

type HabitSectionHeaderProps = {
  title: string
  count: number
  filterId: string
  filterValue: CategoryFilterValue
  onFilterChange: (value: CategoryFilterValue) => void
  categories: CategoryRow[]
}

// Entête de section qui expose le sélecteur de catégorie et le nombre d'éléments.
function HabitSectionHeader({ title, count, filterId, filterValue, onFilterChange, categories }: HabitSectionHeaderProps) {
  return (
    <>
      <h3 className="text-2xl font-semibold text-white">
        {title} <span className="text-white/50">({count})</span>
      </h3>
      <div className="w-full sm:w-64">
        <label htmlFor={filterId} className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          Filtre par catégorie
        </label>
        <select
          id={filterId}
          value={filterValue}
          onChange={event => onFilterChange(event.target.value as CategoryFilterValue)}
          className="mobile-ios-filter w-full rounded-2xl border border-white/15 bg-[#0d1326]/80 px-4 py-3 text-sm font-medium text-white shadow-inner shadow-black/30 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {`${category.icon || '📂'} ${category.name}`}
            </option>
          ))}
          <option value="uncategorized">Sans catégorie</option>
        </select>
      </div>
    </>
  )
}

type HabitListProps = {
  habits: HabitRow[]
  type: 'good' | 'bad'
  todayCountsMap: Map<string, number>
  containerId: string
  onHabitValidated: (message: string, variant?: 'success' | 'error') => void
}

// Affiche toutes les cartes d'une section, ou un message vide si aucune correspondance.
function HabitList({ habits, type, todayCountsMap, containerId, onHabitValidated }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-white/60">
        Aucune habitude {type === 'good' ? 'positive' : 'négative'} ne correspond à ce filtre.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4" id={containerId}>
      {habits.map(habit => (
        <HabitRowCard
          key={habit.id}
          habit={habit}
          type={type}
          todayCount={todayCountsMap.get(habit.id) ?? 0}
          onHabitValidated={onHabitValidated}
        />
      ))}
    </div>
  )
}

type HabitRowCardProps = {
  habit: HabitRow
  type: 'good' | 'bad'
  todayCount: number
  onHabitValidated: (message: string, variant?: 'success' | 'error') => void
}

// Carte principale d'une habitude avec un lien vers le détail et les actions rapides.
function HabitRowCard({ habit, type, todayCount, onHabitValidated }: HabitRowCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/5 bg-black/20 px-3 py-4 shadow-lg shadow-black/20 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <Link href={`/habits/${habit.id}`} className="flex flex-1 items-start gap-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner shadow-black/40"
          style={{ backgroundColor: `${habit.color || '#6b7280'}33` }}
        >
          {habit.icon || (type === 'bad' ? '🔥' : '✨')}
        </div>
        <div>
          <p className="text-base font-semibold text-white sm:text-lg">{habit.name}</p>
        </div>
      </Link>
      <div className="w-full sm:w-auto">
        <HabitQuickActions
          habitId={habit.id}
          habitType={type}
          trackingMode={habit.tracking_mode as 'binary' | 'counter'}
          initialCount={todayCount}
          habitName={habit.name}
          streak={habit.current_streak ?? 0}
          totalLogs={habit.total_logs ?? undefined}
          totalCraquages={habit.total_craquages ?? undefined}
          onHabitValidated={onHabitValidated}
        />
      </div>
    </div>
  )
}

function CategoryOverview({ stats }: { stats: CategoryStat[] }) {
  if (stats.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
        Aucune catégorie personnalisée.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {stats.map(stat => (
        <div key={stat.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-white shadow-inner shadow-black/30">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stat.color || '#6b7280' }} />
            <span className="text-sm font-medium">{stat.name}</span>
          </div>
          <span className="text-xs text-white/60">
            {stat.count} habitude{stat.count > 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
