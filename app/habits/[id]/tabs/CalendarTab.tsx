'use client'

/**
 * Onglet Calendrier - Vue mensuelle + hebdomadaire
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { WeeklyCalendar } from '@/components/WeeklyCalendar'
import { DayReportModal } from '@/components/DayReportModal'
import type { HabitCalendarMap } from '@/lib/habits/computeHabitStats'

type CalendarTabProps = {
  habitType: 'good' | 'bad'
  calendarData: HabitCalendarMap
  trackingMode: 'binary' | 'counter'
}

type CalendarDay = {
  date: string
  value: number
  isToday: boolean
}

export default function CalendarTab({
  habitType,
  calendarData,
  trackingMode,
}: CalendarTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const isBadHabit = habitType === 'bad'
  const today = new Date()

  // Obtenir le premier et dernier jour du mois
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  // Convertir le jour de la semaine (lundi = 0)
  let firstDayWeekday = firstDayOfMonth.getDay()
  firstDayWeekday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1

  // Créer le tableau des jours
  const daysInMonth = lastDayOfMonth.getDate()
  const calendarDays: (CalendarDay | null)[] = []

  // Jours vides avant le 1er
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }

  // Tous les jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    calendarDays.push({
      date: dateStr,
      value: calendarData[dateStr] || 0,
      isToday,
    })
  }

  // Créer les semaines
  const weeks: (CalendarDay | null)[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 p-4">
      {/* Vue mensuelle */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
            📅 Calendrier mensuel
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(currentMonth)
                prev.setMonth(prev.getMonth() - 1)
                setCurrentMonth(prev)
              }}
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[160px] text-center text-sm font-medium text-white capitalize">
              {monthName}
            </span>
            <button
              onClick={() => {
                const next = new Date(currentMonth)
                next.setMonth(next.getMonth() + 1)
                setCurrentMonth(next)
              }}
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendrier */}
        <div className="space-y-2">
          {/* En-têtes jours */}
          <div className="grid grid-cols-7 gap-2">
            {['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'].map((day, idx) => (
              <div key={idx} className="text-center text-[10px] font-semibold text-white/40">
                {day}
              </div>
            ))}
          </div>

          {/* Semaines */}
          <div className="space-y-2">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIdx) => {
                  if (!day) {
                    return <div key={dayIdx} className="h-12" />
                  }

                  const date = new Date(day.date)
                  const dayNum = date.getDate()
                  const hasValue = day.value > 0

                  let bgColor = '#1a1a1a'
                  let textColor = '#666666'

                  if (hasValue) {
                    if (isBadHabit) {
                      bgColor = '#dc2626'
                      textColor = '#ffffff'
                    } else {
                      bgColor = '#16a34a'
                      textColor = '#ffffff'
                    }
                  }

                  return (
                    <button
                      key={dayIdx}
                      onClick={() => setSelectedDate(day.date)}
                      className={`relative flex h-12 items-center justify-center rounded-lg text-sm font-semibold transition hover:scale-105 ${
                        day.isToday ? 'ring-2 ring-white' : ''
                      }`}
                      style={{
                        backgroundColor: bgColor,
                        color: textColor,
                      }}
                      title={`${day.date}: ${hasValue ? (isBadHabit ? 'Craqué' : 'Fait') : 'Manqué'}`}
                    >
                      {dayNum}
                      {day.value > 1 && (
                        <span className="absolute bottom-1 right-1 text-[10px] opacity-80">
                          {day.value}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-4 pt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded bg-[#16a34a]" />
              <span className="text-white/60">
                {isBadHabit ? 'Pas craqué' : 'Fait'}
              </span>
            </div>
            {isBadHabit && (
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded bg-[#dc2626]" />
                <span className="text-white/60">Craqué</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded bg-[#1a1a1a]" />
              <span className="text-white/60">Manqué</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vue hebdomadaire */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
          📆 Semaine en cours
        </h2>
        <WeeklyCalendar
          habitType={habitType}
          calendarData={calendarData}
          trackingMode={trackingMode}
          onDayClick={date => setSelectedDate(date)}
        />
      </div>

      {/* Modal détail jour */}
      <DayReportModal
        date={selectedDate || ''}
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  )
}
