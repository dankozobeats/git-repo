'use client'

import { useState } from 'react'

type Month = {
  key: string
  name: string
  days: Array<{
    date: string
    hasLog: boolean
    dayNumber: number
  }>
  loggedCount: number
  totalDays: number
  percentage: number
}

type Props = {
  months: Month[]
  isBadHabit: boolean
  actionText: string
}

export default function MonthAccordion({ months, isBadHabit, actionText }: Props) {
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    new Set([months[0]?.key])
  )

  const toggleMonth = (key: string) => {
    const newOpenMonths = new Set(openMonths)
    if (newOpenMonths.has(key)) {
      newOpenMonths.delete(key)
    } else {
      newOpenMonths.add(key)
    }
    setOpenMonths(newOpenMonths)
  }

  const activeColor = isBadHabit ? 'bg-red-600' : 'bg-green-600'
  const textColor = isBadHabit ? 'text-red-400' : 'text-green-400'

  return (
    <div className="space-y-3">
      {months.map((month) => {
        const isOpen = openMonths.has(month.key)
        
        return (
          <div key={month.key} className="border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleMonth(month.key)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
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
                <span className="font-medium text-lg">📅 {month.name}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-sm ${textColor} font-medium`}>
                  {month.loggedCount}/{month.totalDays} jours ({month.percentage}%)
                </span>
                <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${activeColor} transition-all`}
                    style={{ width: `${month.percentage}%` }}
                  />
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="p-4 border-t border-gray-800 bg-gray-800/30">
                <div className="grid grid-cols-7 gap-2">
                  {month.days.map((day) => (
                    <div
                      key={day.date}
                      className={`aspect-square rounded flex items-center justify-center text-sm font-medium ${
                        day.hasLog
                          ? `${activeColor} text-white`
                          : 'bg-gray-800 text-gray-600'
                      } hover:scale-110 transition cursor-pointer relative group`}
                      title={`${day.dayNumber} ${month.name.split(' ')[0]}${day.hasLog ? ` - ${actionText}` : ''}`}
                    >
                      {day.dayNumber}
                      
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-950 text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10 border border-gray-700">
                        {day.dayNumber} {month.name.split(' ')[0]}
                        {day.hasLog && ` - ${actionText}`}
                      </div>
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
