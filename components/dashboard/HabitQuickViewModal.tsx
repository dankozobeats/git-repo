'use client'

/**
 * Modal compact pour afficher rapidement les infos essentielles d'une habitude
 * - Calendrier visuel (28 jours)
 * - Statistiques clés
 * - Coach IA local
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/utils/date'

type HabitQuickViewModalProps = {
  habitId: string
  habitName: string
  isOpen: boolean
  onClose: () => void
}

type CalendarDay = {
  date: string
  value: number
  isToday: boolean
}

type HabitData = {
  habit: {
    id: string
    name: string
    type: 'good' | 'bad'
    icon: string | null
    color: string
    tracking_mode: 'binary' | 'counter' | null
  }
  calendar: CalendarDay[]
  stats: {
    currentStreak: number
    bestStreak: number
    totalCount: number
    last7DaysCount: number
    last30DaysCount: number
    todayCount: number
    completionRate: number
  }
  coachMessage: string
}

export default function HabitQuickViewModal({
  habitId,
  habitName,
  isOpen,
  onClose,
}: HabitQuickViewModalProps) {
  const router = useRouter()
  const [data, setData] = useState<HabitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/habits/${habitId}/quick-view`)
        if (!res.ok) throw new Error('Erreur lors du chargement')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError('Impossible de charger les données')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [habitId, isOpen])

  if (!isOpen) return null

  const isBadHabit = data?.habit.type === 'bad'
  const primaryColor = isBadHabit ? '#FF6B6B' : '#5EEAD4'
  const bgGradient = isBadHabit
    ? 'bg-gradient-to-br from-red-500/10 to-red-900/5'
    : 'bg-gradient-to-br from-emerald-500/10 to-teal-900/5'

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl">
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between border-b border-white/10 p-4 ${bgGradient}`}>
          <div className="flex items-center gap-3">
            {data?.habit.icon && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl"
                style={{ backgroundColor: `${data.habit.color}40` }}
              >
                {data.habit.icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">{habitName}</h2>
              <p className="text-xs text-white/50">Vue rapide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center text-sm text-red-300">
              {error}
            </div>
          )}

          {data && !loading && !error && (
            <>
              {/* Statistiques clés */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Série actuelle"
                  value={`${data.stats.currentStreak}j`}
                  color={primaryColor}
                />
                <StatCard
                  label="Meilleure série"
                  value={`${data.stats.bestStreak}j`}
                  color={primaryColor}
                />
                <StatCard
                  label="7 derniers jours"
                  value={data.stats.last7DaysCount}
                  color={primaryColor}
                />
                <StatCard
                  label="Ce mois"
                  value={`${data.stats.completionRate}%`}
                  color={primaryColor}
                />
              </div>

              {/* Calendrier visuel */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                  Calendrier (28 jours)
                </h3>
                <div className="grid grid-cols-7 gap-2">
                  {data.calendar.map((day, idx) => {
                    const dayNum = new Date(day.date).getDate()
                    const hasValue = day.value > 0
                    const intensity = Math.min(day.value / 3, 1) // 0-1 scale

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div
                          className={`h-9 w-9 rounded-lg border transition ${
                            day.isToday
                              ? 'border-white ring-2 ring-white/50'
                              : hasValue
                              ? 'border-transparent'
                              : 'border-white/10'
                          }`}
                          style={{
                            backgroundColor: hasValue
                              ? `${primaryColor}${Math.floor(intensity * 100)
                                  .toString()
                                  .padStart(2, '0')}`
                              : 'transparent',
                          }}
                          title={`${day.date}: ${day.value}`}
                        >
                          {day.isToday && (
                            <div className="flex h-full items-center justify-center text-xs font-bold text-white">
                              {dayNum}
                            </div>
                          )}
                        </div>
                        {idx < 7 && (
                          <span className="text-[10px] text-white/40">
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'][idx]}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Coach IA */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                  💬 Coach IA
                </h3>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm leading-relaxed text-white/80">
                    {data.coachMessage}
                  </p>
                </div>
              </div>

              {/* Action : Voir détails complets */}
              <button
                onClick={() => {
                  router.push(`/habits/${habitId}`)
                  onClose()
                }}
                className="w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Voir tous les détails →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
