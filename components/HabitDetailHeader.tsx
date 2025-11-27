// Header component handling cross-habit navigation with premium styling cues.
import Link from 'next/link'
import type { Database } from '@/types/database'

type HabitRow = Database['public']['Tables']['habits']['Row']

type HabitDetailHeaderProps = {
  habit: HabitRow
  allHabits: HabitRow[]
}

export default function HabitDetailHeader({ habit, allHabits }: HabitDetailHeaderProps) {
  const categoryKey = habit.category_id ?? 'uncategorized'
  const habitsInCategory = allHabits.filter(candidate => (candidate.category_id ?? 'uncategorized') === categoryKey)
  const currentIndex = habitsInCategory.findIndex(candidate => candidate.id === habit.id)

  const prevHabit = currentIndex > 0 ? habitsInCategory[currentIndex - 1] : null
  const nextHabit =
    currentIndex !== -1 && currentIndex < habitsInCategory.length - 1
      ? habitsInCategory[currentIndex + 1]
      : null

  const navigateButton = (targetHabit: HabitRow | null, direction: 'prev' | 'next') => {
    if (!targetHabit) {
      return <div className="h-12 w-12" aria-hidden />
    }

    const label = direction === 'prev' ? 'Habitude précédente' : 'Habitude suivante'

    return (
      <Link
        href={`/habits/${targetHabit.id}`}
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-white/40 hover:text-white"
        aria-label={`${label} : ${targetHabit.name}`}
      >
        {direction === 'prev' ? '←' : '→'}
      </Link>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-[32px] border border-white/10 bg-white/[0.02] px-5 py-4 shadow-[0_15px_45px_rgba(0,0,0,0.35)] backdrop-blur">
      {navigateButton(prevHabit, 'prev')}
      <div className="flex flex-col items-center text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/40">Navigation</p>
        <p className="mt-2 max-w-[250px] truncate text-base font-semibold text-white">{habit.name}</p>
        <p className="text-xs text-white/50">
          {habitsInCategory.length} habitude{habitsInCategory.length > 1 ? 's' : ''} dans cette catégorie
        </p>
      </div>
      {navigateButton(nextHabit, 'next')}
    </div>
  )
}
