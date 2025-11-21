'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { HeatmapPoint } from '@/lib/habits/useHabitStats'

type Props = {
  data: HeatmapPoint[]
}

const dayLabels = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D']

const formatDateLong = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`)
  return parsed.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
}

const getWeekdayIndex = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`)
  const day = parsed.getDay() // 0 (Sun) - 6 (Sat)
  return day === 0 ? 6 : day - 1 // Monday first
}

const cellColor = (point?: HeatmapPoint | null) => {
  if (!point || !point.total) {
    return 'rgba(255,255,255,0.05)'
  }

  const { intensityGood, intensityBad } = point

  if (intensityGood > 0 && intensityBad > 0) {
    const alpha = 0.2 + ((intensityGood + intensityBad) / 8) * 0.6
    return `rgba(234, 179, 8, ${alpha})`
  }

  if (intensityGood > 0) {
    const alpha = 0.2 + (intensityGood / 4) * 0.6
    return `rgba(34, 197, 94, ${alpha})`
  }

  const alpha = 0.2 + (intensityBad / 4) * 0.6
  return `rgba(239, 68, 68, ${alpha})`
}

export function HabitHeatmap({ data }: Props) {
  const [selected, setSelected] = useState<HeatmapPoint | null>(null)

  const weeks = useMemo(() => {
    if (!data.length) return []

    const ordered = [...data].sort((a, b) => a.date.localeCompare(b.date))
    const padded: Array<HeatmapPoint | null> = []
    const firstOffset = getWeekdayIndex(ordered[0].date)

    for (let i = 0; i < firstOffset; i++) {
      padded.push(null)
    }

    padded.push(...ordered)

    while (padded.length % 7 !== 0) {
      padded.push(null)
    }

    const chunked: Array<Array<HeatmapPoint | null>> = []

    for (let i = 0; i < padded.length; i += 7) {
      chunked.push(padded.slice(i, i + 7))
    }

    return chunked
  }, [data])

  return (
    <>
      <div className="flex max-w-full gap-4 overflow-x-auto pb-2">
        <div className="flex flex-col justify-between gap-2 text-[10px] uppercase tracking-wide text-gray-500">
          {dayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex gap-2">
          {weeks.map((week, index) => (
            <div key={`week-${index}`} className="flex flex-col gap-2">
              {week.map((point, idx) => (
                <button
                  key={`${index}-${idx}-${point?.date ?? idx}`}
                  onClick={() => point && setSelected(point)}
                  disabled={!point}
                  className={`group relative h-4 w-4 rounded-[4px] border border-white/10 transition ${
                    point ? 'hover:scale-110' : ''
                  }`}
                  style={{
                    backgroundColor: cellColor(point),
                  }}
                >
                  {point && (
                    <div className="pointer-events-none absolute -top-16 left-1/2 hidden w-32 -translate-x-1/2 rounded-lg border border-white/10 bg-black/80 p-2 text-[11px] text-left text-white shadow-lg shadow-black/30 group-hover:block">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        {formatDateLong(point.date)}
                      </p>
                      <p>Good {point.good}</p>
                      <p>Bad {point.bad}</p>
                      <p className="text-gray-400">Total {point.total}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-gray-950 p-6 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Rapport du jour</p>
                <p className="text-xl font-semibold text-white capitalize">{formatDateLong(selected.date)}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400 transition hover:border-white/30 hover:text-white"
              >
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">Good</p>
                <p className="text-2xl font-bold text-emerald-400">{selected.good}</p>
              </div>
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">Bad</p>
                <p className="text-2xl font-bold text-red-400">{selected.bad}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{selected.total}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Analyse détaillée disponible via le rapport IA. Utilise ce focus pour identifier les déclencheurs et
              comportements du jour.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:border-white/30 hover:text-white"
              >
                Fermer
              </button>
              <Link
                href="/report"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-red-700"
              >
                Générer un rapport
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
