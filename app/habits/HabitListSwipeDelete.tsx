'use client'

import { useMemo, useState } from 'react'
import HabitCardSwipeDelete, { type Habit } from '@/components/HabitCardSwipeDelete'
import { Zap, Droplets, BookOpen, Moon } from 'lucide-react'

export default function HabitListSwipeDeletePage() {
  const initialHabits: Habit[] = useMemo(
    () => [
      { id: '1', title: 'Éviter la junk food', type: 'bad', icon: <Zap className="h-5 w-5 text-amber-300" /> },
      { id: '2', title: 'Boire 2L d’eau', type: 'boolean', icon: <Droplets className="h-5 w-5 text-cyan-300" /> },
      { id: '3', title: 'Lire 20 pages', type: 'good', icon: <BookOpen className="h-5 w-5 text-emerald-300" /> },
      { id: '4', title: 'Dormir avant 23h', type: 'boolean', icon: <Moon className="h-5 w-5 text-indigo-300" /> },
      { id: '5', title: 'Eau (8 verres)', type: 'counter', current: 3, target: 8, icon: <Droplets className="h-5 w-5 text-sky-300" /> },
    ],
    []
  )

  const [habits, setHabits] = useState<Habit[]>(initialHabits)

  const handleToggle = (id: string) => {
    setHabits(prev =>
      prev.map(h =>
        h.id === id ? { ...h, completed: !h.completed, current: h.completed ? 0 : 1, target: 1 } : h
      )
    )
  }

  const handleDelete = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id))
  }

  const handleStep = (id: string, delta: number) => {
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== id) return h
        if (h.type !== 'counter') return h
        const current = Math.max(0, Math.min((h.target ?? 0), (h.current ?? 0) + delta))
        return { ...h, current }
      })
    )
  }

  return (
    <main className="min-h-screen bg-[#05060c] px-4 py-8 text-white">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Mobile Swipe</p>
          <h1 className="text-2xl font-semibold">Swipe pour valider / supprimer</h1>
          <p className="text-sm text-slate-400">
            Swipe droite pour valider (habitudes boolean), swipe gauche pour supprimer (bad habits).
          </p>
        </header>

        <div className="space-y-3">
          {habits.map(habit => (
            <HabitCardSwipeDelete
              key={habit.id}
              habit={habit}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onStepChange={handleStep}
            />
          ))}
          {habits.length === 0 && (
            <p className="text-center text-sm text-slate-500">Plus d’habitudes. Ajoute-en de nouvelles !</p>
          )}
        </div>
      </div>
    </main>
  )
}
