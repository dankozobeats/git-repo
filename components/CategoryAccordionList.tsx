'use client'

import HabitCard from '@/components/HabitCard'
import CategoryAccordion, { type CategoryGroup } from '@/components/CategoryAccordion'

type CategoryAccordionListProps = {
  groups: CategoryGroup[]
  emptyLabel: string
  showAllMobile?: boolean
}

export default function CategoryAccordionList({
  groups,
  emptyLabel,
  showAllMobile = false,
}: CategoryAccordionListProps) {
  if (!groups.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-gray-900/40 px-4 py-6 text-center text-sm text-gray-400">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map(group => (
        <CategoryAccordion
          key={String(group.id ?? 'none')}
          id={String(group.id ?? 'none')}
          title={group.name}
          count={group.habits.length}
          color={group.color ?? undefined}
          defaultOpen={showAllMobile}
        >
          <div className="space-y-2">
            {group.habits.map(habit => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        </CategoryAccordion>
      ))}
    </div>
  )
}

