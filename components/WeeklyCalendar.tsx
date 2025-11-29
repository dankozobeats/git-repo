'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getTodayDateISO, isFutureDate } from '@/lib/date-utils'

interface WeeklyCalendarProps {
  habitType: 'good' | 'bad'
  calendarData: Record<string, number>
  trackingMode: 'binary' | 'counter'
  onDayClick: (date: string) => void
}

export default function WeeklyCalendar({
  habitType,
  calendarData,
  trackingMode,
  onDayClick,
}: WeeklyCalendarProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const todayIso = getTodayDateISO()

  const weeks = generateWeeks(4, currentWeekOffset)

  function generateWeeks(numWeeks: number, offset = 0) {
    const weeksList = []
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

      weeksList.push({
        weekNumber: getWeekNumber(weekStart),
        days,
      })
    }

    return weeksList
  }

  function getWeekNumber(date: Date) {
    const firstDay = new Date(date.getFullYear(), 0, 1)
    const daysPassed = (date.getTime() - firstDay.getTime()) / 86400000
    return Math.ceil((daysPassed + firstDay.getDay() + 1) / 7)
  }

  function getCellStyle(dateStr: string, count: number, isToday: boolean) {
    const highlight = isToday ? 'border-2 border-[#4DA6FF]' : 'border border-white/5'

    if (isFutureDate(dateStr)) {
      return `bg-[#161822] text-white/30 cursor-not-allowed ${highlight}`
    }

    if (trackingMode === 'binary') {
      if (count > 0) {
        return `${habitType === 'good' ? 'bg-[#1d4d2c]' : 'bg-[#3b1212]'} text-white ${highlight}`
      }
      return `${habitType === 'good' ? 'bg-[#2a2323]' : 'bg-[#102417]'} text-white/60 ${highlight}`
    }

    if (count === 0) {
      return `bg-[#181b29] text-white/50 ${highlight}`
    }

    return `text-white ${highlight}`
  }

  return (
    <section className="rounded-3xl border border-white/5 bg-[#0B0D19] p-6 shadow-2xl">
      <div className="flex justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Calendrier</p>
          <h2 className="text-2xl font-bold text-white">Historique visuel</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 4)}
            className="rounded-full border border-white/10 p-2 text-white/70 hover:border-white/40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="min-w-[140px] text-center text-sm text-white/60">
            {currentWeekOffset === 0 ? '4 dernières semaines' : 'Semaines précédentes'}
          </span>

          <button
            onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 4))}
            disabled={currentWeekOffset === 0}
            className="rounded-full border border-white/10 p-2 text-white/70 hover:border-white/40 disabled:opacity-30"
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
                    if (!isFutureDate(day.date)) onDayClick(day.date)
                  }}
                  className={`flex flex-col items-center justify-center rounded-lg p-2 transition ${getCellStyle(
                    day.date,
                    day.count,
                    day.isToday
                  )}`}
                >
                  <span className="text-[0.65rem] uppercase text-white/60">{day.dayName}</span>
                  <span className="text-xl font-bold">{day.dayNumber}</span>
                  {trackingMode === 'counter' && day.count > 0 && (
                    <span className="text-xs text-white/70">{day.count}×</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
