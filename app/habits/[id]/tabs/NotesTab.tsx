'use client'

import HabitNotesPanelSimple from '@/components/notes/HabitNotesPanelSimple'

interface NotesTabProps {
  habit: {
    id: string
    name: string
  }
}

export default function NotesTab({ habit }: NotesTabProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <HabitNotesPanelSimple habitId={habit.id} habitName={habit.name} />
    </div>
  )
}
