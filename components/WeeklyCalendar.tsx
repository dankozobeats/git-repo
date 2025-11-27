'use client'

// Vue calendrier hebdomadaire interactive pour naviguer dans les logs d'une habitude.

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getTodayDateISO, isFutureDate } from '@/lib/date-utils'

interface WeeklyCalendarProps {
  habitType: 'good' | 'bad'
  calendarData: Record<string, number>
  trackingMode: 'binary' | 'counter'
  onDayClick: (date: string) => void
}

export function WeeklyCalendar({
  habitType,
  calendarData,
  trackingMode,
  onDayClick,
}: WeeklyCalendarProps) {
  // Décale les lots de 4 semaines affichés dans la vue.
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const todayIso = getTodayDateISO()

  const weeks = generateWeeks(4, currentWeekOffset)

  // Construit un tableau de semaines (chaque semaine contient 7 jours formattés).
  function generateWeeks(numWeeks: number, offset: number = 0) {
    const weeks = []
    const today = new Date()

    for (let w = numWeeks - 1; w >= 0; w--) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (w + offset) * 7 - today.getDay() + 1)

      const days = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + d)
        const dateStr = date.toISOString().split('T')[0]

        days.push({
          date: dateStr,
          dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          dayNumber: date.getDate(),
          isToday: dateStr === todayIso,
          count: calendarData[dateStr] || 0,
        })
      }

      weeks.push({
        weekNumber: getWeekNumber(weekStart),
        days,
      })
    }

    return weeks
  }

  // Approximation du numéro de semaine utilisé uniquement pour l'UI.
  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Retourne les classes/couleurs d'une case selon le mode de suivi.
  function getCellStyle(dateStr: string, count: number, isToday: boolean) {
    const selectedClasses = isToday ? 'border-2 border-[#4DA6FF]' : 'border border-white/5'

    if (isFutureDate(dateStr)) {
      return `bg-[#161822] text-white/30 cursor-not-allowed ${selectedClasses}`
    }

    if (trackingMode === 'binary') {
      if (count > 0) {
        return `${habitType === 'good' ? 'bg-[#1d4d2c]' : 'bg-[#3b1212]'} text-white ${selectedClasses}`
      }
      return `${habitType === 'good' ? 'bg-[#2a2323]' : 'bg-[#102417]'} text-white/60 ${selectedClasses}`
    }

    if (count === 0) {
      return `bg-[#181b29] text-white/50 ${selectedClasses}`
    }

    const intensity = Math.min(count / 3, 1)
    const palette = habitType === 'good' ? ['#133022', '#1c5b32', '#25a249'] : ['#33210b', '#6e3412', '#bf1b1b']
    const color = intensity <= 0.33 ? palette[0] : intensity <= 0.66 ? palette[1] : palette[2]

    return `text-white ${selectedClasses}`
  }

  // Section principale : contrôles de navigation + grille hebdomadaire + légende.
  return (
    <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0B0D19] via-[#090911] to-[#050609] p-6 shadow-2xl shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Calendrier</p>
          <h2 className="text-2xl font-bold text-white">Historique visuel</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 4)}
            className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[140px] text-center text-sm text-white/60">
            {currentWeekOffset === 0 ? '4 dernières semaines' : 'Semaines précédentes'}
          </span>
          <button
            onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 4))}
            disabled={currentWeekOffset === 0}
            className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/40 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="rounded-2xl border border-white/5 bg-black/20 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/40">
              Semaine {week.weekNumber}
            </p>
            <div className="grid grid-cols-7 gap-3">
              {week.days.map((day) => (
                <button
                  key={day.date}
                  onClick={() => {
                    if (isFutureDate(day.date)) return
                    onDayClick(day.date)
                  }}
                  className={`day-box flex flex-col items-center justify-center rounded-lg p-2 text-center text-white transition hover:-translate-y-1 ${getCellStyle(day.date, day.count, day.isToday)}`}
                >
                  <span className="text-[0.65rem] uppercase tracking-wide text-white/60">
                    {day.dayName}
                  </span>
                  <span className="text-xl font-bold">{day.dayNumber}</span>
                  {day.count > 0 && trackingMode === 'counter' && (
                    <span className="text-xs text-white/70">{day.count}×</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="calendar-footer text-xs text-white/60">
        {trackingMode === 'binary' ? (
          <div className="flex flex-wrap items-center gap-4">
            <Legend color={habitType === 'good' ? '#2a2323' : '#102417'} label={habitType === 'good' ? 'À faire' : 'OK'} />
            <Legend color={habitType === 'good' ? '#1d4d2c' : '#3b1212'} label={habitType === 'good' ? 'Validée' : 'Craquage'} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <Legend color="#181b29" label="Vide" />
            <Legend color={habitType === 'good' ? '#25a249' : '#bf1b1b'} label={habitType === 'good' ? 'Fait' : 'Craqué'} />
          </div>
        )}
      </div>
    </section>
  )
}

// Indicateur de couleur utilisé dans le footer du calendrier.
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-4 w-4 rounded" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}
