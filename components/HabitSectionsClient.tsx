'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import CategoryAccordion from '@/components/CategoryAccordion'
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
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null)

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

  const searchActive = normalizedQuery.length > 0

  return (
    <section className="space-y-6">
      <SearchBar onSearch={setSearchQuery} />
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
            openCategoryId={openCategoryId}
            setOpenCategoryId={setOpenCategoryId}
          />
          <HabitSection
            title="✨ Bonnes habitudes"
            subtitle="Renforce les routines qui font réellement avancer."
            totalCount={goodHabits.reduce((acc, group) => acc + group.habits.length, 0)}
            accentColor="#4DA6FF"
            groupedHabits={searchActive ? filteredGoodHabits : goodHabits}
            type="good"
            todayCounts={todayCounts}
            openCategoryId={openCategoryId}
            setOpenCategoryId={setOpenCategoryId}
          />
          <CategoryAccordion
            id="organisation"
            openCategoryId={openCategoryId}
            setOpenCategoryId={setOpenCategoryId}
            title="Organisation des habitudes"
            count={categoryStats.length}
            color="#A855F7"
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
  openCategoryId: string | null
  setOpenCategoryId: (id: string | null) => void
}

function HabitSection({
  title,
  subtitle,
  totalCount,
  accentColor,
  groupedHabits,
  type,
  todayCounts,
  openCategoryId,
  setOpenCategoryId,
}: HabitSectionProps) {
  return (
    <section className="space-y-4 rounded-3xl border-0 bg-transparent p-2 sm:border sm:border-white/5 sm:bg-[#1E1E1E]/70 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
      </div>

      {groupedHabits.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center text-sm text-[#A0A0A0]">
          Aucune habitude {type === 'good' ? 'positive' : 'négative'} ne correspond à cette recherche.
        </div>
      ) : (
        <div className="mt-4 space-y-5 sm:space-y-4">
          {groupedHabits.map(group => {
            const accordionId = group.category?.id || `${type}-uncategorized`
            return (
              <CategoryAccordion
                key={accordionId}
                id={accordionId}
                openCategoryId={openCategoryId}
                setOpenCategoryId={setOpenCategoryId}
                title={group.category?.name ?? 'Sans catégorie'}
                count={group.habits.length}
                color={group.category?.color || accentColor}
                className="text-white"
                headerClassName="bg-transparent hover:bg-white/5"
                contentClassName="space-y-0 divide-y divide-white/10 sm:divide-y-0"
              >
                {group.habits.map(habit => (
                  <HabitListItem
                    key={habit.id}
                    habit={habit}
                    type={type}
                    accentColor={accentColor}
                    todayCount={todayCounts[habit.id] ?? 0}
                  />
                ))}
              </CategoryAccordion>
            )
          })}
        </div>
      )}
    </section>
  )
}

type HabitListItemProps = {
  habit: HabitRow
  type: 'good' | 'bad'
  accentColor: string
  todayCount: number
}

function HabitListItem({ habit, type, accentColor, todayCount }: HabitListItemProps) {
  const icon = habit.icon || (type === 'bad' ? '🔥' : '✨')
  const hasValue = todayCount > 0
  const isBad = type === 'bad'
  const statusLabel = isBad
    ? hasValue
      ? `${todayCount} craquage${todayCount > 1 ? 's' : ''}`
      : 'Aucun craquage'
    : hasValue
    ? 'Validée'
    : 'À faire'

  const badgeClasses = isBad
    ? hasValue
      ? 'border-red-500/70 bg-red-500/10 text-red-200'
      : 'border-green-500/60 bg-green-500/10 text-green-200'
    : hasValue
    ? 'border-green-500/70 bg-green-500/10 text-green-200'
    : 'border-red-400/60 bg-red-500/10 text-red-200'

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-4">
      <div className="grid grid-cols-1 gap-4 items-center w-full min-w-0 rounded-2xl bg-[#1a1b23]/40 px-3 py-3 transition sm:grid-cols-[1fr_auto_auto] sm:bg-[#1a1b23]/70 sm:border sm:border-white/10 sm:px-4 sm:py-4 sm:hover:scale-[1.01] sm:hover:bg-[#1f2232]">
        <Link href={`/habits/${habit.id}`} className="flex items-center gap-3 min-w-0 truncate">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-0 bg-neutral-900/50 text-xl shadow-inner sm:border sm:border-white/10">
            {icon}
          </div>
          <p className="truncate text-base font-semibold text-white">{habit.name}</p>
        </Link>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-nowrap justify-end">
          <HabitQuickActions
            habitId={habit.id}
            habitType={type}
            trackingMode={habit.tracking_mode}
            initialCount={todayCount}
            habitName={habit.name}
            streak={habit.current_streak ?? 0}
            totalLogs={habit.total_logs ?? (type === 'good' ? todayCount : 0)}
            totalCraquages={habit.total_craquages ?? (type === 'bad' ? todayCount : 0)}
          />
        </div>
      </div>
    </div>
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
