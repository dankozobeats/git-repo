'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import HabitQuickActions from '@/components/HabitQuickActions'
import SearchBar from '@/components/SearchBar'
import CategoryManager from '@/components/CategoryManager'
import CoachRoastBubble from '@/components/CoachRoastBubble'
import { ChevronDown, ListChecks } from 'lucide-react'
import type { Database } from '@/types/database'

type CategoryRow = Database['public']['Tables']['categories']['Row']

type HabitRow = Database['public']['Tables']['habits']['Row'] & {
  current_streak?: number | null
  total_logs?: number | null
  total_craquages?: number | null
}

type HabitGroup = {
  category: CategoryRow | null
  habits: HabitRow[]
}

type HabitSectionsClientProps = {
  badHabits: HabitGroup[]
  goodHabits: HabitGroup[]
  todayCounts: Record<string, number>
  categoryStats: CategoryStat[]
  displayOrder?: 'bad-first' | 'good-first'
  showBadHabits?: boolean
  showGoodHabits?: boolean
  coachMessage?: string
}

const HABIT_VARIANT_STYLES = {
  good: {
    headerAccent: 'text-emerald-300',
    iconBg: 'bg-emerald-500/15 text-emerald-300',
  },
  bad: {
    headerAccent: 'text-[#ff7a7a]',
    iconBg: 'bg-red-500/15 text-red-300',
  },
} as const

type CategoryStat = {
  id: string
  name: string
  color: string | null
  count: number
}

export default function HabitSectionsClient({
  badHabits,
  goodHabits,
  todayCounts,
  categoryStats,
  displayOrder = 'bad-first',
  showBadHabits = true,
  showGoodHabits = true,
  coachMessage,
}: HabitSectionsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const [openCategoryKey, setOpenCategoryKey] = useState<string | null>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const todayCountsMap = useMemo(
    () => new Map<string, number>(Object.entries(todayCounts).map(([id, value]) => [id, value])),
    [todayCounts]
  )

  const filterGroups = (groups: HabitGroup[]) =>
    groups
      .map(group => {
        if (!normalizedQuery) return group
        const filteredHabits = group.habits.filter(habit => habit.name.toLowerCase().includes(normalizedQuery))
        return { ...group, habits: filteredHabits }
      })
      .filter(group => group.habits.length > 0)

  const filteredBadHabits = useMemo(() => filterGroups(badHabits), [badHabits, normalizedQuery])
  const filteredGoodHabits = useMemo(() => filterGroups(goodHabits), [goodHabits, normalizedQuery])
  const allHabitsList = useMemo(
    () => [...badHabits.flatMap(group => group.habits), ...goodHabits.flatMap(group => group.habits)],
    [badHabits, goodHabits]
  )
  const filteredResults = useMemo(
    () => (normalizedQuery ? allHabitsList.filter(habit => habit.name.toLowerCase().includes(normalizedQuery)) : []),
    [allHabitsList, normalizedQuery]
  )
  const searchTerm = normalizedQuery

  const searchActive = normalizedQuery.length > 0

  return (
    <section className="space-y-6">
      <SearchBar onSearch={setSearchQuery} />
      {coachMessage && <CoachRoastBubble message={coachMessage} variant="inline" />}
      {searchTerm && filteredResults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm text-gray-400 mb-3">Résultats ({filteredResults.length})</h3>

          <div className="space-y-4">
            {filteredResults.map(habit => {
              const todayCount = todayCountsMap.get(habit.id) ?? 0

              return (
                <div
                  key={habit.id}
                  className="relative z-0 rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/habits/${habit.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl"
                        style={{ backgroundColor: `${habit.color || '#6b7280'}20` }}
                      >
                        {habit.icon || (habit.type === 'bad' ? '🔥' : '✨')}
                      </div>
                      <p className="truncate text-base font-semibold text-white">{habit.name}</p>
                    </Link>

                    <div className="w-full sm:w-auto">
                      <HabitQuickActions
                        habitId={habit.id}
                        habitType={habit.type as 'good' | 'bad'}
                        trackingMode={habit.tracking_mode as 'binary' | 'counter'}
                        initialCount={todayCount}
                        habitName={habit.name}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {searchActive && filteredBadHabits.length === 0 && filteredGoodHabits.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/30 p-6 text-center text-sm text-white/70">
          Aucun résultat pour « {searchQuery} ». Essaie un autre terme ou crée une nouvelle habitude.
        </div>
      ) : (
        <>
          {(
            displayOrder === 'good-first'
              ? (['good', 'bad'] as const)
              : (['bad', 'good'] as const)
          )
            .filter(section => (section === 'bad' ? showBadHabits : showGoodHabits))
            .map(section => {
            const config =
              section === 'bad'
                ? {
                    title: '🔥 Mauvaises habitudes',
                    totalCount: badHabits.reduce((acc, group) => acc + group.habits.length, 0),
                    accentColor: '#FF4D4D',
                    groupedHabits: searchActive ? filteredBadHabits : badHabits,
                    type: 'bad' as const,
                  }
                : {
                    title: '✨ Bonnes habitudes',
                    totalCount: goodHabits.reduce((acc, group) => acc + group.habits.length, 0),
                    accentColor: '#4DA6FF',
                    groupedHabits: searchActive ? filteredGoodHabits : goodHabits,
                    type: 'good' as const,
                  }

            return (
              <HabitSection
                key={config.type}
                title={config.title}
                totalCount={config.totalCount}
                accentColor={config.accentColor}
                groupedHabits={config.groupedHabits}
                type={config.type}
                todayCountsMap={todayCountsMap}
                openCategoryKey={openCategoryKey}
                setOpenCategoryKey={setOpenCategoryKey}
              />
            )
          })}
          <section className="space-y-4 rounded-3xl p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Pilotage</p>
                <h2 className="text-2xl font-semibold text-white">Gestion des catégories personnalisées</h2>
                <p className="text-sm text-white/60">
                  Crée, renomme ou supprime des regroupements pour organiser tes habitudes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategoriesOpen(prev => !prev)}
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
              >
                {categoriesOpen ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            {categoriesOpen && (
              <div className="space-y-4">
                <CategoryOverview stats={categoryStats} />
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <CategoryManager />
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}

type HabitSectionProps = {
  title: string
  totalCount: number
  accentColor: string
  groupedHabits: HabitGroup[]
  type: 'good' | 'bad'
  todayCountsMap: Map<string, number>
  openCategoryKey: string | null
  setOpenCategoryKey: (id: string | null) => void
}

function HabitSection({
  title,
  totalCount,
  accentColor,
  groupedHabits,
  type,
  todayCountsMap,
  openCategoryKey,
  setOpenCategoryKey,
}: HabitSectionProps) {
  const variant = HABIT_VARIANT_STYLES[type]

  return (
    <section id={`${type}-habits-section`} className="space-y-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Tableau de bord</p>
        <h2 className={`text-2xl font-semibold md:text-3xl ${variant.headerAccent}`}>
          {title} <span className="text-white/60">({totalCount})</span>
        </h2>
      </div>

      {groupedHabits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-center text-sm text-white/60">
          Aucune habitude {type === 'good' ? 'positive' : 'négative'} ne correspond à cette recherche.
        </div>
      ) : (
        <div className="space-y-5">
          {groupedHabits.map((group, index) => {
            const baseId = group.category?.id || 'uncategorized'
            const categoryKey = `${type}-${baseId}`
            const isOpen = openCategoryKey ? openCategoryKey === categoryKey : false

            const toggleCategory = () => {
              setOpenCategoryKey(isOpen ? null : categoryKey)
            }

            return (
              <div key={categoryKey} className="rounded-3xl bg-gradient-to-b from-white/5 to-transparent p-1">
                <button
                  type="button"
                  onClick={toggleCategory}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left sm:px-5"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full p-2 ${variant.iconBg}`}>
                      <ListChecks className="h-5 w-5" />
                    </span>
                    <div className="text-left">
                      <p className="text-base font-semibold text-white">
                        {group.category?.name ?? 'Sans catégorie'}
                      </p>
                      <p className="text-xs text-white/50">
                        {group.habits.length} routine{group.habits.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-white/60 transition duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="space-y-4 px-1 py-4 sm:px-2">
                    {group.habits.map(habit => (
                      <HabitRowCard
                        key={habit.id}
                        habit={habit}
                        type={type}
                        todayCount={todayCountsMap.get(habit.id) ?? 0}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

type HabitRowCardProps = {
  habit: HabitRow
  type: 'good' | 'bad'
  todayCount: number
}

function HabitRowCard({ habit, type, todayCount }: HabitRowCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-black/20 px-4 py-4 shadow-lg shadow-black/20 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <Link href={`/habits/${habit.id}`} className="flex flex-1 items-start gap-4 min-w-0">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner shadow-black/40"
          style={{ backgroundColor: `${habit.color || '#6b7280'}33` }}
        >
          {habit.icon || (type === 'bad' ? '🔥' : '✨')}
        </div>
        <div className="min-w-0">
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
        />
      </div>
    </div>
  )
}

function CategoryOverview({ stats }: { stats: CategoryStat[] }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121428]/80">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/5"
      >
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50 block">Vue d'ensemble</span>
          <span className="text-sm text-white/70">
            {stats.length} catégorie{stats.length > 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`space-y-3 px-4 pb-4 text-sm text-white/70 transition-[max-height,opacity] duration-300 ${open ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {stats.length === 0 ? (
          <p className="text-white/60">Aucune catégorie personnalisée. Utilise le module ci-dessous pour en créer.</p>
        ) : (
          <div className="space-y-2">
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
        )}
      </div>
    </div>
  )
}

function withAlpha(color: string | null | undefined, alpha: string) {
  if (!color || !color.startsWith('#')) return color ?? '#FFFFFF'
  return `${color}${alpha}`
}
