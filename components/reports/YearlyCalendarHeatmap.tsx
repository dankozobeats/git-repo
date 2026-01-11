'use client'

/**
 * Calendrier annuel type GitHub
 * Affiche une heatmap de 365 jours avec intensité
 */

import type { DayData } from '@/lib/habits/useTemporalReport'
import { Calendar } from 'lucide-react'
import { useState } from 'react'

type YearlyCalendarHeatmapProps = {
  yearlyCalendar: DayData[]
}

export function YearlyCalendarHeatmap({ yearlyCalendar }: YearlyCalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)

  // Organiser les jours par semaine (dim-sam)
  const weeks: DayData[][] = []
  let currentWeek: DayData[] = []

  // Trouver le premier jour et ajouter des vides au début si besoin
  const firstDay = yearlyCalendar[0]
  if (firstDay) {
    const firstDayOfWeek = new Date(firstDay.date + 'T00:00:00').getDay()
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', good: 0, bad: 0, total: 0, intensity: 0 })
    }
  }

  yearlyCalendar.forEach(day => {
    const dayOfWeek = new Date(day.date + 'T00:00:00').getDay()

    currentWeek.push(day)

    if (dayOfWeek === 6 || day === yearlyCalendar[yearlyCalendar.length - 1]) {
      // Compléter la semaine si nécessaire
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', good: 0, bad: 0, total: 0, intensity: 0 })
      }
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  const getColor = (day: DayData) => {
    if (day.total === 0 || !day.date) return 'bg-white/5'

    const goodRatio = day.good / day.total

    if (goodRatio >= 0.8) {
      // Très bon
      return day.intensity === 4
        ? 'bg-emerald-500'
        : day.intensity === 3
        ? 'bg-emerald-400'
        : day.intensity === 2
        ? 'bg-emerald-300'
        : 'bg-emerald-200'
    } else if (goodRatio >= 0.5) {
      // Neutre
      return day.intensity >= 3
        ? 'bg-blue-400'
        : day.intensity >= 2
        ? 'bg-blue-300'
        : 'bg-blue-200'
    } else {
      // Mauvais
      return day.intensity === 4
        ? 'bg-red-500'
        : day.intensity === 3
        ? 'bg-red-400'
        : day.intensity === 2
        ? 'bg-red-300'
        : 'bg-red-200'
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const totalGood = yearlyCalendar.reduce((sum, d) => sum + d.good, 0)
  const totalBad = yearlyCalendar.reduce((sum, d) => sum + d.bad, 0)
  const activeDays = yearlyCalendar.filter(d => d.total > 0).length

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Calendrier Annuel</h3>
          <p className="text-xs text-white/60">365 derniers jours d'activité</p>
        </div>
        <Calendar className="h-6 w-6 text-white/40" />
      </div>

      {/* Stats globales */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/60">Jours actifs</p>
          <p className="text-2xl font-bold text-white">{activeDays}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-300/70">Total bonnes</p>
          <p className="text-2xl font-bold text-emerald-300">{totalGood}</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-xs text-red-300/70">Total mauvaises</p>
          <p className="text-2xl font-bold text-red-300">{totalBad}</p>
        </div>
      </div>

      {/* Calendrier */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-max">
          {/* Labels des jours */}
          <div className="mb-2 flex gap-1">
            <div className="w-5" /> {/* Espace pour labels mois */}
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
              <div key={i} className="w-3 text-center text-[10px] text-white/40">
                {day}
              </div>
            ))}
          </div>

          {/* Grille des semaines */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`h-3 w-3 rounded-sm transition-all ${getColor(day)} ${
                      day.date ? 'cursor-pointer hover:scale-125 hover:ring-2 hover:ring-white/50' : ''
                    }`}
                    onMouseEnter={() => day.date && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    title={day.date ? formatDate(day.date) : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip hovered day */}
      {hoveredDay && hoveredDay.date && (
        <div className="mt-4 rounded-2xl border border-white/20 bg-white/[0.05] p-4">
          <p className="text-sm font-semibold text-white">{formatDate(hoveredDay.date)}</p>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-emerald-400">✓ {hoveredDay.good} bonnes</span>
            <span className="text-red-400">✗ {hoveredDay.bad} mauvaises</span>
            <span className="text-white/60">Total: {hoveredDay.total}</span>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="mt-6 flex items-center justify-between text-xs">
        <span className="text-white/60">Moins</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-white/5" />
          <div className="h-3 w-3 rounded-sm bg-emerald-200" />
          <div className="h-3 w-3 rounded-sm bg-emerald-300" />
          <div className="h-3 w-3 rounded-sm bg-emerald-400" />
          <div className="h-3 w-3 rounded-sm bg-emerald-500" />
        </div>
        <span className="text-white/60">Plus</span>
      </div>
    </div>
  )
}
