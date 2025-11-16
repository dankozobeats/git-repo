'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeeklyCalendarProps {
  habitId: string
  habitType: 'good' | 'bad'
  calendarData: Record<string, number>
  trackingMode: 'binary' | 'counter'
  onDayClick: (date: string) => void
}

export function WeeklyCalendar({ 
  habitId, 
  habitType, 
  calendarData, 
  trackingMode,
  onDayClick 
}: WeeklyCalendarProps) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  // Générer les 4 dernières semaines
  const weeks = generateWeeks(4, currentWeekOffset)

  function generateWeeks(numWeeks: number, offset: number = 0) {
    const weeks = []
    const today = new Date()
    
    for (let w = numWeeks - 1; w >= 0; w--) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - ((w + offset) * 7) - today.getDay() + 1) // Lundi
      
      const days = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + d)
        const dateStr = date.toISOString().split('T')[0]
        
        days.push({
          date: dateStr,
          dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          dayNumber: date.getDate(),
          isToday: dateStr === today.toISOString().split('T')[0],
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

  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  function getCellStyle(count: number, isToday: boolean) {
    if (count === 0) {
      return `bg-gray-800 ${isToday ? 'ring-2 ring-blue-500' : ''}`
    }

    if (trackingMode === 'binary') {
      return habitType === 'good'
        ? `bg-green-600 ${isToday ? 'ring-2 ring-blue-500' : ''}`
        : `bg-red-600 ${isToday ? 'ring-2 ring-blue-500' : ''}`
    }

    // Mode counter - intensité
    const intensity = Math.min(count / 3, 1) // Ajustable selon l'objectif
    
    if (habitType === 'good') {
      if (intensity <= 0.33) return `bg-green-900/50 ${isToday ? 'ring-2 ring-blue-500' : ''}`
      if (intensity <= 0.66) return `bg-green-700 ${isToday ? 'ring-2 ring-blue-500' : ''}`
      return `bg-green-500 ${isToday ? 'ring-2 ring-blue-500' : ''}`
    } else {
      if (intensity <= 0.33) return `bg-yellow-900/50 ${isToday ? 'ring-2 ring-blue-500' : ''}`
      if (intensity <= 0.66) return `bg-orange-700 ${isToday ? 'ring-2 ring-blue-500' : ''}`
      return `bg-red-600 ${isToday ? 'ring-2 ring-blue-500' : ''}`
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 md:p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold">Calendrier</h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 4)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-400 min-w-[120px] text-center">
            {currentWeekOffset === 0 ? '4 dernières semaines' : `Semaines précédentes`}
          </span>
          <button
            onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 4))}
            disabled={currentWeekOffset === 0}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx}>
            <div className="text-xs text-gray-500 mb-2">Semaine {week.weekNumber}</div>
            <div className="grid grid-cols-7 gap-2">
              {week.days.map((day) => (
                <button
                  key={day.date}
                  onClick={() => onDayClick(day.date)}
                  className={`
                    aspect-square rounded-lg transition-all duration-200
                    hover:scale-105 active:scale-95
                    flex flex-col items-center justify-center
                    ${getCellStyle(day.count, day.isToday)}
                  `}
                >
                  <div className="text-xs font-medium opacity-70">{day.dayName}</div>
                  <div className="text-lg font-bold">{day.dayNumber}</div>
                  {day.count > 0 && trackingMode === 'counter' && (
                    <div className="text-xs opacity-80 mt-0.5">{day.count}×</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 mt-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800 rounded"></div>
          <span>Vide</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${habitType === 'good' ? 'bg-green-600' : 'bg-red-600'}`}></div>
          <span>{habitType === 'good' ? 'Fait' : 'Craqué'}</span>
        </div>
      </div>
    </div>
  )
}
