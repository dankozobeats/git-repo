'use client'

import HabitTasksPanel from '@/components/notes/HabitTasksPanel'

interface TasksTabProps {
  habit: {
    id: string
    name: string
  }
}

export default function TasksTab({ habit }: TasksTabProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <HabitTasksPanel habitId={habit.id} habitName={habit.name} />
    </div>
  )
}
