'use client'

import { useState } from 'react'

type CalendarDay = {
  date: string
  dayNumber: number
  monthName: string
  monthKey: string
  count: number
  details?: string
  isCompleted: boolean
  isToday: boolean
}

type Month = {
  key: string
  name: string
  days: CalendarDay[]
  loggedCount: number
  totalDays: number
  percentage: number
}

type HabitCalendarProps = {
  months: Month[]
  isBadHabit: boolean
  actionText: string
  goalValue?: number | null
}

export default function HabitCalendar({ 
  months, 
  isBadHabit, 
  actionText,
  goalValue 
}: HabitCalendarProps) {
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    new Set([months[0]?.key])
  )
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const toggleMonth = (key: string) => {
    const newOpenMonths = new Set(openMonths)
    if (newOpenMonths.has(key)) {
      newOpenMonths.delete(key)
    } else {
      newOpenMonths.add(key)
    }
    setOpenMonths(newOpenMonths)
  }

  const getColorClasses = (day: CalendarDay) => {
    if (!day.isCompleted) {
      return 'bg-gray-800/40 text-gray-500 border border-gray-700/50 hover:bg-gray-700/50'
    }

    if (isBadHabit) {
      // Bad habits: red intensity increases with count
      if (day.count >= 3) return 'bg-red-700 text-white border border-red-600 shadow-lg shadow-red-900/50'
      if (day.count >= 2) return 'bg-red-600 text-white border border-red-500 shadow-lg shadow-red-900/30'
      return 'bg-red-500 text-white border border-red-400'
    } else {
      // Good habits: green if goal reached, yellow if partial
      if (goalValue && day.count >= goalValue) {
        return 'bg-green-600 text-white border border-green-500 shadow-lg shadow-green-900/50'
      }
      if (day.count > 0) {
        return 'bg-yellow-500 text-white border border-yellow-400'
      }
      return 'bg-gray-800/40 text-gray-500 border border-gray-700/50'
    }
  }

  const getTooltip = (day: CalendarDay) => {
    const dateObj = new Date(day.date + 'T00:00:00')
    const formatted = dateObj.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })

    if (!day.isCompleted) {
      return formatted
    }

    if (isBadHabit) {
      return `${formatted}\n${day.count} ${day.count > 1 ? 'craquages' : 'craquage'}`
    } else {
      const status = goalValue && day.count >= goalValue ? '✓ Objectif atteint' : 'Partiel'
      return `${formatted}\n${day.count}/${goalValue || '∞'} ${status}`
    }
  }

  return (
    <div className="space-y-4">
      {months.map((month) => {
        const isOpen = openMonths.has(month.key)
        const activeColor = isBadHabit ? 'bg-red-600' : 'bg-green-600'
        const textColor = isBadHabit ? 'text-red-400' : 'text-green-400'

        return (
          <div 
            key={month.key} 
            className="border border-gray-700/60 rounded-lg overflow-hidden bg-gray-900/40 backdrop-blur-sm"
          >
            <button
              onClick={() => toggleMonth(month.key)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="font-semibold text-base text-white">📅 {month.name}</span>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-semibold ${textColor}`}>
                    {month.loggedCount}/{month.totalDays}
                  </span>
                  <span className="text-xs text-gray-400">
                    {month.percentage}%
                  </span>
                </div>
                <div className="w-24 h-2.5 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30">
                  <div
                    className={`h-full ${activeColor} transition-all duration-300`}
                    style={{ width: `${month.percentage}%` }}
                  />
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="p-4 border-t border-gray-700/60 bg-gray-800/20">
                <div className="grid grid-cols-7 gap-2">
                  {/* Jours de la semaine */}
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Jours du mois */}
                  {month.days.map((day) => (
                    <div
                      key={day.date}
                      className="relative group"
                      onMouseEnter={() => setHoveredDate(day.date)}
                      onMouseLeave={() => setHoveredDate(null)}
                    >
                      <div
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center
                          font-semibold text-sm md:text-base
                          transition-all duration-200 cursor-default
                          ${getColorClasses(day)}
                          ${hoveredDate === day.date ? 'scale-105 shadow-lg' : ''}
                        `}
                        title={getTooltip(day)}
                      >
                        <span className="text-xs opacity-75">{day.dayNumber}</span>
                        {day.isCompleted && (
                          <span className="text-xs font-bold">{day.count}</span>
                        )}
                      </div>

                      {/* Tooltip */}
                      {hoveredDate === day.date && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 
                                      bg-gray-950 border border-gray-600 rounded px-3 py-2 text-xs text-white
                                      whitespace-nowrap shadow-lg pointer-events-none">
                          {isBadHabit && day.isCompleted && (
                            <div className="font-semibold">{day.count} craquage{day.count > 1 ? 's' : ''}</div>
                          )}
                          {!isBadHabit && day.isCompleted && (
                            <div className="font-semibold">
                              {day.count}/{goalValue || '∞'} 
                              {goalValue && day.count >= goalValue && ' ✓'}
                            </div>
                          )}
                          {!day.isCompleted && (
                            <div className="text-gray-400">Aucune action</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
