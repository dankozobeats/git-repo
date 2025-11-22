'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import CategoryAccordion from '@/components/CategoryAccordion'
import HabitAccordionItem from '@/components/HabitAccordionItem'
import HabitQuickActions from '@/components/HabitQuickActions'
import SearchBar from '@/components/SearchBar'
import CategoryManager from '@/components/CategoryManager'
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
}

type CategoryStat = {
  id: string
  name: string
  color: string | null
  count: number
}

export default function HabitSectionsClient({ badHabits, goodHabits, todayCounts, categoryStats }: HabitSectionsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const [openCategoryKey, setOpenCategoryKey] = useState<string | null>(null)
  const [openHabitId, setOpenHabitId] = useState<string | null>(null)
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
          <HabitSection
            title="🔥 Mauvaises habitudes"
            subtitle="Repère et neutralise tes déclencheurs récurrents."
            totalCount={badHabits.reduce((acc, group) => acc + group.habits.length, 0)}
            accentColor="#FF4D4D"
            groupedHabits={searchActive ? filteredBadHabits : badHabits}
            type="bad"
            todayCounts={todayCounts}
            todayCountsMap={todayCountsMap}
            openCategoryKey={openCategoryKey}
            setOpenCategoryKey={setOpenCategoryKey}
            openHabitId={openHabitId}
            setOpenHabitId={setOpenHabitId}
          />
          <HabitSection
            title="✨ Bonnes habitudes"
            subtitle="Renforce les routines qui font réellement avancer."
            totalCount={goodHabits.reduce((acc, group) => acc + group.habits.length, 0)}
            accentColor="#4DA6FF"
            groupedHabits={searchActive ? filteredGoodHabits : goodHabits}
            type="good"
            todayCounts={todayCounts}
            todayCountsMap={todayCountsMap}
            openCategoryKey={openCategoryKey}
            setOpenCategoryKey={setOpenCategoryKey}
            openHabitId={openHabitId}
            setOpenHabitId={setOpenHabitId}
          />
          <CategoryAccordion
            id="system-organisation"
            openCategoryKey={openCategoryKey}
            setOpenCategoryKey={setOpenCategoryKey}
            title="Organisation des habitudes"
            count={categoryStats.length}
            color="#A855F7"
            defaultOpen={false}
          >
            <CategoryOverview stats={categoryStats} />
            <div className="mt-4 rounded-3xl border border-white/10 bg-[#121420]/60 p-4">
              <CategoryManager />
            </div>
          </CategoryAccordion>
        </>
      )}
    </section>
  )
}

type HabitSectionProps = {
  title: string
  subtitle: string
  totalCount: number
  accentColor: string
  groupedHabits: HabitGroup[]
  type: 'good' | 'bad'
  todayCounts: Record<string, number>
  todayCountsMap: Map<string, number>
  openCategoryKey: string | null
  setOpenCategoryKey: (id: string | null) => void
  openHabitId: string | null
  setOpenHabitId: (id: string | null) => void
}

function HabitSection({
  title,
  subtitle,
  totalCount,
  accentColor,
  groupedHabits,
  type,
  todayCounts,
  todayCountsMap,
  openCategoryKey,
  setOpenCategoryKey,
  openHabitId,
  setOpenHabitId,
}: HabitSectionProps) {
  return (
    <details
      id={`${type}-habits-section`}
      open={false}
      className="rounded-3xl border-0 bg-transparent p-2 sm:border sm:border-white/5 sm:bg-[#1E1E1E]/70 sm:p-6"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">{subtitle}</p>
          <h2 className="text-0.5xl font-bold text-white mt-1">{title}</h2>
        </div>
        <span
          className="rounded-full px-4 py-1 text-xs font-semibold"
          style={{
            borderColor: withAlpha(accentColor, '40'),
            color: accentColor,
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          {totalCount} active{totalCount > 1 ? 's' : ''}
        </span>
      </summary>

      {groupedHabits.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-[#A0A0A0]">
          Aucune habitude {type === 'good' ? 'positive' : 'négative'} ne correspond à cette recherche.
        </div>
      ) : (
        <div className="mt-4 space-y-5 sm:space-y-4">
          {groupedHabits.map(group => {
            const baseId = group.category?.id || 'uncategorized'
            const categoryKey = `${type}-${baseId}`
            return (
              <CategoryAccordion
                key={categoryKey}
                id={categoryKey}
                openCategoryKey={openCategoryKey}
                setOpenCategoryKey={setOpenCategoryKey}
                title={group.category?.name ?? 'Sans catégorie'}
                count={group.habits.length}
                color={group.category?.color || accentColor}
                className="text-white"
                headerClassName="bg-transparent hover:bg-white/5"
                contentClassName="space-y-4"
                defaultOpen={false}
              >
                <div className="space-y-3">
                  {group.habits.map(habit => (
                    <HabitAccordionItem
                      key={habit.id}
                      habit={habit}
                      type={type}
                      todayCount={todayCountsMap.get(habit.id) ?? 0}
                      openHabitId={openHabitId}
                      setOpenHabitId={setOpenHabitId}
                    />
                  ))}
                </div>
              </CategoryAccordion>
            )
          })}
        </div>
      )}
    </details>
  )
}

function CategoryOverview({ stats }: { stats: CategoryStat[] }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
        <span>Organisation des habitudes</span>
        <span>{stats.length} catégorie{stats.length > 1 ? 's' : ''}</span>
      </div>
      {stats.length === 0 ? (
        <p className="text-white/60">Aucune catégorie personnalisée. Utilise le module ci-dessous pour en créer.</p>
      ) : (
        <div className="space-y-2">
          {stats.map(stat => (
            <div key={stat.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-white">
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
  )
}

function withAlpha(color: string | null | undefined, alpha: string) {
  if (!color || !color.startsWith('#')) return color ?? '#FFFFFF'
  return `${color}${alpha}`
}
