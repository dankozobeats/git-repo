import Link from 'next/link'
import type { Database } from '@/types/database'

type HabitRow = Database['public']['Tables']['habits']['Row']

type HabitDetailHeaderProps = {
  habit: HabitRow
  allHabits: HabitRow[]
}

export default function HabitDetailHeader({ habit, allHabits }: HabitDetailHeaderProps) {
  const categoryKey = habit.category_id ?? 'uncategorized'
  const habitsInCategory = allHabits.filter(h => (h.category_id ?? 'uncategorized') === categoryKey)
  const currentIndex = habitsInCategory.findIndex(h => h.id === habit.id)

  const prevHabit = currentIndex > 0 ? habitsInCategory[currentIndex - 1] : null
  const nextHabit =
    currentIndex !== -1 && currentIndex < habitsInCategory.length - 1
      ? habitsInCategory[currentIndex + 1]
      : null

  const navigateButton = (targetHabit: HabitRow | null, direction: 'prev' | 'next') => {
    if (!targetHabit) {
      return <div className="w-11 h-11" aria-hidden />
    }

    const label = direction === 'prev' ? 'Habitude précédente' : 'Habitude suivante'

    return (
      <Link
        href={`/habits/${targetHabit.id}`}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-neutral-900/40 border border-neutral-800 text-neutral-300 shadow-sm hover:bg-neutral-800/50 transition"
        aria-label={`${label} : ${targetHabit.name}`}
      >
        {direction === 'prev' ? '←' : '→'}
      </Link>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      {navigateButton(prevHabit, 'prev')}
      <div className="flex flex-col items-center text-center px-4">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Navigation</p>
        <p className="mt-1 text-base font-semibold text-white truncate max-w-[220px]">{habit.name}</p>
      </div>
      {navigateButton(nextHabit, 'next')}
    </div>
  )
}
