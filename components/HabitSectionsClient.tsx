'use client'

// Tableau de bord client qui gère recherche, filtres et affichage des habitudes.

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import HabitQuickActions from '@/components/HabitQuickActions'
import CategoryManager from '@/components/CategoryManager'
import HabitToast from '@/components/HabitToast'
import AICoachMessage from '@/components/AICoachMessage' // Design unifié pour bulles IA tempo et toasts premium.
import { Search as SearchIcon, ChevronDown, LayoutGrid, List } from 'lucide-react'
import { HABIT_SEARCH_EVENT, scrollToSearchSection } from '@/lib/ui/scroll'
import SearchOverlay from '@/components/SearchOverlay'
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
  showHabitDescriptions?: boolean
  highlightHabitId?: string | null
}

type CategoryStat = {
  id: string
  name: string
  color: string | null
  count: number
}

type CategoryFilterValue = 'all' | 'uncategorized' | 'pending' | 'completed' | string

// Calcule la cible quotidienne d'un compteur (1 pour les binaires).
const resolveCounterRequirement = (habit: HabitRow) => {
  if (habit.tracking_mode === 'counter' && typeof habit.daily_goal_value === 'number' && habit.daily_goal_value > 0) {
    return habit.daily_goal_value
  }
  return 1
}

// Retourne l'état actuel d'un compteur pour faciliter les filtres/badges.
const buildCounterState = (habit: HabitRow, todayCount: number) => {
  const required = resolveCounterRequirement(habit)
  const current = Math.max(0, todayCount)
  const remaining = Math.max(0, required - current)
  const isCompleted = current >= required
  return { required, current, remaining, isCompleted }
}

export default function HabitSectionsClient({
  goodHabits,
  badHabits,
  categories,
  todayCounts,
  categoryStats,
  showBadHabits = true,
  showGoodHabits = true,
  coachMessage,
  showHabitDescriptions = true,
  highlightHabitId,
}: HabitSectionsClientProps) {
  // États locaux pour piloter recherche, filtres et UI responsive.
  const [searchQuery, setSearchQuery] = useState('')
  // Filtres statuts par défaut : on ne montre que les habitudes à valider au premier rendu.
  const [goodCategoryFilter, setGoodCategoryFilter] = useState<CategoryFilterValue>('pending')
  const [badCategoryFilter, setBadCategoryFilter] = useState<CategoryFilterValue>('pending')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Mode d'affichage : 'card' (par défaut) ou 'list' (compact)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  // Stocke le message du toast premium pour le diffuser dans la zone feedback.
  const [toastMessage, setToastMessage] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  // Contrôle la bulle coach roast locale pour répliquer la disparition progressive.
  const [coachBanner, setCoachBanner] = useState<string | null>(null)
  const [coachVisible, setCoachVisible] = useState(false)
  const coachHideTimerRef = useRef<number | null>(null)
  const coachCleanupTimerRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const feedbackRef = useRef<HTMLDivElement | null>(null)
  const coachContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightHabitId ?? null)
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

  const filterByMenuSelection = useCallback(
    (habitList: HabitRow[], filterValue: CategoryFilterValue) => {
      return habitList.filter(habit => {
        const todayCount = todayCountsMap.get(habit.id) ?? 0
        const counterState = buildCounterState(habit, todayCount)

        if (filterValue === 'pending') {
          return !counterState.isCompleted
        }
        if (filterValue === 'completed') {
          return counterState.isCompleted
        }
        if (filterValue === 'uncategorized') {
          return !habit.category_id
        }
        if (filterValue === 'all') {
          return true
        }
        return habit.category_id === filterValue
      })
    },
    [todayCountsMap]
  )

  // Liste filtrée affichée dans la section "bonnes habitudes".
  const filteredGoodHabits = useMemo(
    () => filterByMenuSelection(filterByQuery(goodHabits), goodCategoryFilter),
    [filterByMenuSelection, filterByQuery, goodHabits, goodCategoryFilter]
  )

  // Liste filtrée affichée dans la section "mauvaises habitudes".
  const filteredBadHabits = useMemo(
    () => filterByMenuSelection(filterByQuery(badHabits), badCategoryFilter),
    [badHabits, badCategoryFilter, filterByMenuSelection, filterByQuery]
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

  // État pour l'overlay de recherche
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Active la recherche depuis FloatingQuickActions
  useEffect(() => {
    const handleSearchOpen = () => {
      setIsSearchOpen(true)
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

  // Persiste la préférence d'affichage (carte/liste) pour conserver le choix utilisateur.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('bh-view-mode')
    if (stored === 'card' || stored === 'list') {
      setViewMode(stored)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('bh-view-mode', viewMode)
  }, [viewMode])

  // Met en avant une habitude fraîchement créée ou ciblée via la query ?highlight=
  useEffect(() => {
    const targetId = highlightHabitId || (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '')
    if (!targetId) return
    setActiveHighlightId(targetId.replace('habit-card-', ''))

    const scrollToTarget = () => {
      const el = document.getElementById(targetId.startsWith('habit-card-') ? targetId : `habit-card-${targetId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
        return true
      }
      return false
    }

    // Essaie immédiatement, puis retente si l'élément n'est pas encore monté.
    let attempts = 0
    const tryScroll = () => {
      attempts += 1
      if (scrollToTarget() || attempts > 5) {
        window.clearInterval(intervalId)
      }
    }
    const intervalId = window.setInterval(tryScroll, 200)
    tryScroll()

    const timer = window.setTimeout(() => setActiveHighlightId(null), 4500)
    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timer)
    }
  }, [highlightHabitId])

  // Handler centralisé pour afficher le toast lorsqu'une habitude est validée (succès ou erreur).
  const handleHabitValidated = useCallback((message: string, variant: 'success' | 'error' = 'success') => {
    setToastMessage({ message, variant })
  }, [])

  const clearCoachTimers = useCallback(() => {
    if (coachHideTimerRef.current) {
      window.clearTimeout(coachHideTimerRef.current)
      coachHideTimerRef.current = null
    }
    if (coachCleanupTimerRef.current) {
      window.clearTimeout(coachCleanupTimerRef.current)
      coachCleanupTimerRef.current = null
    }
  }, [])

  const hideCoachBanner = useCallback(() => {
    clearCoachTimers()
    setCoachVisible(false)
    coachCleanupTimerRef.current = window.setTimeout(() => setCoachBanner(null), 200)
  }, [clearCoachTimers])

  // Synchronise la bannière coach côté client uniquement pour éviter les soucis SSR (window inexistant serveur).
  useEffect(() => {
    if (!coachMessage) {
      hideCoachBanner()
      return
    }

    setCoachBanner(coachMessage)
    setCoachVisible(true)
    clearCoachTimers()
    coachHideTimerRef.current = window.setTimeout(() => {
      hideCoachBanner()
    }, 6500)

    return () => {
      clearCoachTimers()
    }
  }, [coachMessage, clearCoachTimers, hideCoachBanner])

  // Ferme la bulle lorsqu'un clic/pointeur se produit ailleurs dans la page.
  useEffect(() => {
    if (!coachBanner) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!coachContainerRef.current) return
      if (!coachContainerRef.current.contains(event.target as Node)) {
        hideCoachBanner()
      }
    }
    window.addEventListener('pointerdown', handlePointerDown, true)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true)
    }
  }, [coachBanner, hideCoachBanner])

  const hasSearch = Boolean(searchQuery.trim())

  // Prépare la zone de feedback : accompagne la bulle coach (auto-hide) et le toast premium.
  const feedbackSection = toastMessage || coachBanner ? (
    <div
      id="habit-feedback-area"
      ref={feedbackRef}
      className="mx-auto w-full max-w-full space-y-3 px-0 sm:px-0 md:max-w-5xl"
    >
      {coachBanner && (
        <div
          ref={coachContainerRef}
          className={`transition-all duration-300 ease-out ${coachVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
            }`}
        >
          <AICoachMessage
            // Variante roast pour conserver le ton sarcastique tout en gardant le design premium partagé.
            message={coachBanner}
            variant="roast"
          />
        </div>
      )}
      {toastMessage && (
        <HabitToast
          message={toastMessage.message}
          variant={toastMessage.variant}
          onComplete={() => setToastMessage(null)}
        />
      )}
    </div>
  ) : null

  // Défile automatiquement uniquement quand un toast apparaît (ex: erreur), pas pour la bulle coach afin d'éviter
  // de déplacer le focus loin de la carte validée.
  useEffect(() => {
    if (!feedbackRef.current || !toastMessage) return
    feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }, [toastMessage])

  // Résultats dynamiques centrés pour conserver la même largeur que les sections principales.
  const searchResultsSection = hasSearch ? (
    <div id="searchResults" className="mx-auto w-full max-w-full space-y-2 rounded-none border-x-0 border-white/10 bg-black/30 px-4 py-4 shadow-inner shadow-black/40 sm:space-y-3 sm:rounded-3xl sm:border-x md:max-w-5xl md:px-4">
      <div className="flex items-center justify-between px-2 pb-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">Résultats de recherche</h3>
        <button
          onClick={() => {
            setSearchQuery('')
            setIsSearchOpen(false)
          }}
          className="text-xs text-[#FF4D4D] hover:underline"
        >
          Effacer la recherche
        </button>
      </div>
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
            onHabitValidated={handleHabitValidated}
            showDescriptions={showHabitDescriptions}
            viewMode={viewMode}
            habitColor={habit.color}
            habitIcon={habit.icon}
          />
        ))
      )}
    </div>
  ) : null

  // Rend la zone principale: recherche sticky, sections filtrées et gestion des catégories.
  return (
    <section className="relative z-0 space-y-6 pt-16 md:pt-0">
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {feedbackSection}
      {searchResultsSection}

      <div
        id="mainScrollArea"
        className={`snap-y snap-mandatory px-0 ${hasSearch ? 'hidden' : ''} md:h-screen md:overflow-y-auto sm:px-4`}
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
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <HabitList
              habits={filteredGoodHabits}
              type="good"
              todayCountsMap={todayCountsMap}
              containerId="goodHabitsList"
              onHabitValidated={handleHabitValidated}
              showDescriptions={showHabitDescriptions}
              viewMode={viewMode}
              highlightHabitId={activeHighlightId}
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
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <HabitList
              habits={filteredBadHabits}
              type="bad"
              todayCountsMap={todayCountsMap}
              containerId="badHabitsList"
              onHabitValidated={handleHabitValidated}
              showDescriptions={showHabitDescriptions}
              viewMode={viewMode}
              highlightHabitId={activeHighlightId}
            />
          </section>
        )}
      </div>

      <div className="relative z-0 space-y-4 rounded-none border-x-0 border-white/10 bg-black/20 px-3 py-4 sm:rounded-3xl sm:border-x sm:px-4">
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
  viewMode: 'card' | 'list'
  onViewModeChange: (mode: 'card' | 'list') => void
}

// Entête de section qui expose le sélecteur de catégorie et le nombre d'éléments.
function HabitSectionHeader({
  title,
  count,
  filterId,
  filterValue,
  onFilterChange,
  categories,
  viewMode,
  onViewModeChange,
}: HabitSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">

      {/* Ligne haute : label + compteur + view switch */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
            {title}
          </span>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">
            {count}
          </span>
        </div>

        {/* Actions header */}
        <div className="flex items-center gap-2">
          {/* Switch vue */}
          <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => onViewModeChange('card')}
              className={`rounded-md px-2 py-1 text-xs transition ${viewMode === 'card'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/70'
                }`}
            >
              🗂
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`rounded-md px-2 py-1 text-xs transition ${viewMode === 'list'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/70'
                }`}
            >
              ☰
            </button>
          </div>

          {/* Hamburger */}
        </div>
      </div>


      {/* Filtre principal */}
      <select
        id={filterId}
        value={filterValue}
        onChange={e => onFilterChange(e.target.value as CategoryFilterValue)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/90 shadow-inner backdrop-blur focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
      >
        <option value="pending">À valider</option>
        <option value="completed">Complétées</option>
        <option value="all">Toutes</option>
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {`📂 ${category.name}`}
          </option>
        ))}
        <option value="uncategorized">Sans catégorie</option>
      </select>
    </div>
  )
}


type HabitListProps = {
  habits: HabitRow[]
  type: 'good' | 'bad'
  todayCountsMap: Map<string, number>
  containerId: string
  onHabitValidated: (message: string, variant?: 'success' | 'error') => void
  showDescriptions: boolean
  viewMode: 'card' | 'list'
  highlightHabitId?: string | null
}

// Affiche toutes les cartes d'une section en conservant une grille full-width, ou un message vide si aucune correspondance.
function HabitList({ habits, type, todayCountsMap, containerId, onHabitValidated, showDescriptions, viewMode, highlightHabitId }: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-white/60">
        Aucune habitude {type === 'good' ? 'positive' : 'négative'} ne correspond à ce filtre.
      </div>
    )
  }

  return (
    <div className="w-full" id={containerId}>
      <div className={`mx-auto w-full max-w-full ${viewMode === 'list' ? 'space-y-2' : 'flex flex-col gap-2 sm:gap-4'} md:max-w-5xl`}>
        {habits.map(habit => (
          <HabitRowCard
            key={habit.id}
            habit={habit}
            type={type}
            todayCount={todayCountsMap.get(habit.id) ?? 0}
            onHabitValidated={onHabitValidated}
            showDescriptions={showDescriptions}
            viewMode={viewMode}
            highlightHabitId={highlightHabitId}
            habitColor={habit.color}
            habitIcon={habit.icon}
          />
        ))}
      </div>
    </div>
  )
}

type HabitRowCardProps = {
  habit: HabitRow
  type: 'good' | 'bad'
  todayCount: number
  onHabitValidated: (message: string, variant?: 'success' | 'error') => void
  showDescriptions: boolean
  viewMode: 'card' | 'list'
  highlightHabitId?: string | null
  habitColor?: string | null
  habitIcon?: string | null
}

// Carte principale d'une habitude avec un lien vers le détail et les actions rapides en style glassmorphism premium.
function HabitRowCard({ habit, type, todayCount, onHabitValidated, showDescriptions, viewMode, highlightHabitId, habitColor, habitIcon }: HabitRowCardProps) {
  // Calcule l'état courant pour afficher le badge restant sans attendre un refresh serveur.
  const counterState = buildCounterState(habit, todayCount)
  const showCounterBadge = counterState.required > 1
  const isHighlighted = highlightHabitId === habit.id

  // Vue liste compacte
  if (viewMode === 'list') {
    return (
      <div
        id={`habit-card-${habit.id}`}
        className={`group flex items-center justify-between rounded-none border-x-0 border-white/5 bg-white/[0.02] px-4 py-2.5 text-white transition hover:bg-white/[0.04] sm:rounded-xl sm:border-x sm:px-4 ${isHighlighted ? 'ring-2 ring-[#C084FC] shadow-[0_0_0_4px_rgba(192,132,252,0.25)]' : ''
          }`}
      >
        <Link href={`/habits/${habit.id}`} className="flex flex-1 items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ backgroundColor: `${habit.color || '#6b7280'}33` }}
          >
            {habit.icon || (type === 'bad' ? '🔥' : '✨')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">{habit.name}</p>
          </div>
          {showCounterBadge && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${counterState.isCompleted ? 'border-emerald-400/50 text-emerald-300' : 'border-sky-400/40 text-sky-200'
              }`}>
              {counterState.current}/{counterState.required}
            </span>
          )}
        </Link>
        <div className="ml-3 flex-shrink-0">
          <HabitQuickActions
            habitId={habit.id}
            habitType={type}
            trackingMode={habit.tracking_mode as 'binary' | 'counter'}
            initialCount={todayCount}
            counterRequired={counterState.required}
            habitName={habit.name}
            habitDescription={habit.description}
            habitColor={habit.color}
            habitIcon={habit.icon}
            streak={habit.current_streak ?? 0}
            totalLogs={habit.total_logs ?? undefined}
            totalCraquages={habit.total_craquages ?? undefined}
            isFocused={habit.is_focused ?? false}
            onHabitValidated={onHabitValidated}
          />
        </div>
      </div>
    )
  }

  // Vue carte (par défaut)
  return (
    <div
      id={`habit-card-${habit.id}`}
      className={`group flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] pl-3 pr-2 py-3 text-white shadow-xl shadow-black/40 backdrop-blur-3xl transition duration-300 hover:bg-white/[0.07]
      ${isHighlighted ? 'ring-2 ring-[#C084FC] bg-white/[0.08]' : ''}`}
    >
      {/* Icône */}
      <div className="shrink-0">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg shadow-inner shadow-black/40 border border-white/5 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${habit.color || '#6b7280'}20` }}
        >
          {habit.icon || (type === 'bad' ? '🔥' : '✨')}
        </div>
      </div>

      {/* Texte */}
      <Link
        href={`/habits/${habit.id}`}
        className="flex-1 min-w-0 ml-1"
      >
        <p
          className="text-sm font-semibold leading-tight line-clamp-2 sm:text-base"
          title={habit.name}
        >
          {habit.name}
        </p>
        {showCounterBadge && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-sky-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (counterState.current / counterState.required) * 100
                  )}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-white/50">
              {counterState.current} / {counterState.required}
              {counterState.isCompleted && ' · Validée ✓'}
            </p>
          </div>
        )}


        {showDescriptions && habit.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-white/60">
            {habit.description}
          </p>
        )}
      </Link>

      {/* Actions */}
      <div className="shrink-0">
        <HabitQuickActions
          habitId={habit.id}
          habitType={type}
          trackingMode={habit.tracking_mode as 'binary' | 'counter'}
          initialCount={todayCount}
          counterRequired={counterState.required}
          habitName={habit.name}
          habitDescription={habit.description}
          habitColor={habit.color}
          habitIcon={habit.icon}
          streak={habit.current_streak ?? 0}
          totalLogs={habit.total_logs ?? undefined}
          totalCraquages={habit.total_craquages ?? undefined}
          isFocused={habit.is_focused ?? false}
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
