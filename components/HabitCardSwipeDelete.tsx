'use client'

import { useState, useRef, useEffect, type TouchEvent } from 'react'
import { MoreVertical, Trash, Check } from 'lucide-react'

export type Habit = {
  id: string
  title: string
  type: 'good' | 'bad' | 'boolean' | 'counter'
  completed?: boolean
  current?: number
  target?: number
  icon: React.ReactNode
}

type HabitCardSwipeDeleteProps = {
  habit: Habit
  onToggle?: (id: string) => void
  onDelete?: (id: string) => void
  onStepChange?: (id: string, delta: number) => void
}

// Thresholds (in px) for triggering actions
const DELETE_THRESHOLD = -120
const VALIDATE_THRESHOLD = 120

export default function HabitCardSwipeDelete({ habit, onToggle, onDelete, onStepChange }: HabitCardSwipeDeleteProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const startXRef = useRef(0)

  const isBad = habit.type === 'bad'
  const canValidate = habit.type === 'boolean' && habit.type !== 'bad'

  // Reset position when needed
  useEffect(() => {
    if (!dragging) {
      const timer = window.setTimeout(() => setOffsetX(0), 120)
      return () => window.clearTimeout(timer)
    }
  }, [dragging])

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startXRef.current = e.touches[0].clientX
    setDragging(true)
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!dragging) return
    const delta = e.touches[0].clientX - startXRef.current
    // Restrict movement for bad habits to left only, for boolean good allow both sides
    if (isBad && delta > 0) {
      setOffsetX(delta * 0.25) // minor resistance to the right
    } else {
      setOffsetX(delta)
    }
  }

  const handleTouchEnd = () => {
    const shouldDelete = isBad && offsetX <= DELETE_THRESHOLD
    const shouldValidate = canValidate && offsetX >= VALIDATE_THRESHOLD

    if (shouldDelete) {
      setDeleted(true)
      onDelete?.(habit.id)
    } else if (shouldValidate) {
      onToggle?.(habit.id)
      setOffsetX(0)
    } else {
      setOffsetX(0)
    }
    setDragging(false)
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {/* Left (validate) */}
        <div
          className={`flex h-full flex-1 items-center gap-2 transition-opacity duration-150 ${canValidate ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div className="flex items-center gap-2 rounded-full bg-green-600/20 px-3 py-2 text-green-200">
            <Check className="h-4 w-4" />
            <span className="text-xs font-semibold">Valider</span>
          </div>
        </div>
        {/* Right (delete) */}
        <div className={`flex h-full flex-1 justify-end ${isBad ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 rounded-full bg-red-600/80 px-3 py-2 text-white shadow-lg">
            <span className="text-xs font-semibold">Supprimer</span>
            <Trash className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Foreground card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          relative z-10 flex items-center justify-between rounded-2xl border border-slate-700/60 bg-slate-900/80 px-4 py-3
          shadow-[0_12px_30px_rgba(0,0,0,0.4)]
          transition-transform duration-150 ease-out
          ${deleted ? 'opacity-0 -translate-y-3 pointer-events-none' : ''}
        `}
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800 text-lg
            ${habit.completed ? 'opacity-50' : ''}`}
          >
            {habit.icon}
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-semibold text-white ${habit.completed ? 'line-through text-slate-500' : ''}`}>
              {habit.title}
            </span>
            {habit.type === 'counter' && typeof habit.current === 'number' && typeof habit.target === 'number' && (
              <span className="text-xs text-slate-400">
                {habit.current}/{habit.target}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Action zone: validate or stepper */}
          {habit.type === 'counter' ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-xs text-slate-200">
              <button
                type="button"
                className="h-7 w-7 rounded-lg bg-slate-700/60 text-white transition active:scale-95"
                onClick={() => onStepChange?.(habit.id, -1)}
              >
                −
              </button>
              <span className="min-w-[40px] text-center text-sm font-semibold">
                {habit.current ?? 0}/{habit.target ?? 0}
              </span>
              <button
                type="button"
                className="h-7 w-7 rounded-lg bg-slate-700/60 text-white transition active:scale-95"
                onClick={() => onStepChange?.(habit.id, 1)}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onToggle?.(habit.id)}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-200 backdrop-blur ${
                habit.completed
                  ? 'bg-green-600/20 border border-green-500/30 text-green-300 scale-95 shadow-[0_0_12px_rgba(74,222,128,0.25)]'
                  : 'bg-blue-600/20 border border-blue-500/30 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
              } active:scale-95`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border border-current ${
                  habit.completed ? 'bg-green-500/20 text-green-200' : 'bg-blue-500/20 text-blue-200'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
              {!habit.completed && <span>Valider</span>}
            </button>
          )}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800 text-slate-300"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
