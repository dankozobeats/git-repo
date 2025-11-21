'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import CategoryAccordion from '@/components/CategoryAccordion'
import CategoryAccordionGroup from '@/components/CategoryAccordionGroup'
import HabitQuickActions from '@/components/HabitQuickActions'
import SearchBar from '@/components/SearchBar'
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
}

export default function HabitSectionsClient({ badHabits, goodHabits, todayCounts }: HabitSectionsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const normalizedQuery = searchQuery.trim().toLowerCase()

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
          />
          <HabitSection
            title="✨ Bonnes habitudes"
            subtitle="Renforce les routines qui font réellement avancer."
            totalCount={goodHabits.reduce((acc, group) => acc + group.habits.length, 0)}
            accentColor="#4DA6FF"
            groupedHabits={searchActive ? filteredGoodHabits : goodHabits}
            type="good"
            todayCounts={todayCounts}
          />
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
}

function HabitSection({ title, subtitle, totalCount, accentColor, groupedHabits, type, todayCounts }: HabitSectionProps) {
  return (
    <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/70 p-6">
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
        <CategoryAccordionGroup>
          {({ openId, handleToggle }) => (
            <div className="mt-6 space-y-4">
              {groupedHabits.map(group => {
                const accordionId = group.category?.id || `${type}-uncategorized`
                return (
                  <CategoryAccordion
                    key={accordionId}
                    id={accordionId}
                    openId={openId}
                    onToggle={handleToggle}
                    title={group.category?.name ?? 'Sans catégorie'}
                    count={group.habits.length}
                    color={group.category?.color || accentColor}
                    className="rounded-2xl border border-white/5 bg-black/25 text-white"
                    headerClassName="bg-transparent hover:bg-white/5 px-4 py-3"
                    contentClassName="space-y-0 p-0 divide-y divide-white/5"
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
        </CategoryAccordionGroup>
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
  const statusLabel =
    todayCount > 0
      ? type === 'bad'
        ? `${todayCount} craquage${todayCount > 1 ? 's' : ''}`
        : todayCount === 1
        ? "Validée aujourd'hui"
        : `${todayCount} validations`
      : type === 'bad'
      ? 'Aucun craquage'
      : 'Pas encore validée'

  const statusStyle = todayCount > 0
    ? {
        borderColor: withAlpha(accentColor, '66'),
        backgroundColor: withAlpha(accentColor, '1a'),
        color: accentColor,
      }
    : {
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#A0A0A0',
      }

  return (
    <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center">
      <Link
        href={`/habits/${habit.id}`}
        className="flex flex-1 items-center gap-4 rounded-2xl bg-transparent px-4 py-3 transition hover:bg-neutral-800/40"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800/80 text-xl shadow-sm">
          {icon}
        </div>
        <p className="truncate text-base font-semibold text-white">{habit.name}</p>
      </Link>
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={statusStyle}>
          {statusLabel}
        </span>
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
  )
}

function withAlpha(color: string | null | undefined, alpha: string) {
  if (!color || !color.startsWith('#')) return color ?? '#FFFFFF'
  return `${color}${alpha}`
}
