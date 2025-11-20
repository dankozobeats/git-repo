'use client'

import { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react'

interface DayReport {
  date: string
  goodHabits: {
    total: number
    completed: number
    details: Array<{ name: string; icon: string; count: number }>
  }
  badHabits: {
    total: number
    cracked: number
    totalCracks: number
    details: Array<{ name: string; icon: string; count: number }>
  }
  successRate: number
}

interface DayReportModalProps {
  date: string
  isOpen: boolean
  onClose: () => void
}

export function DayReportModal({ date, isOpen, onClose }: DayReportModalProps) {
  const [report, setReport] = useState<DayReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && date) {
      fetchReport()
    }
  }, [isOpen, date])

  async function fetchReport() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/day/${date}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-['Inter']">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-white/5 bg-[#111623] shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
        <div className="sticky top-0 flex items-center justify-between rounded-t-3xl bg-[#111623] px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Rapport du jour</p>
            <h2 className="text-2xl font-bold text-white capitalize">{formattedDate}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-6 pb-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#4DA6FF] border-t-transparent" />
              <p className="text-white/60">Chargement...</p>
            </div>
          ) : report ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#151d3b] to-[#0f1220] p-6 text-center">
                <p className="text-5xl font-bold text-white">{report.successRate}%</p>
                <p className="text-white/60">Taux de réussite</p>
                {report.successRate >= 80 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-emerald-300">
                    <TrendingUp className="h-5 w-5" /> Excellente journée ! 🎉
                  </div>
                )}
                {report.successRate < 50 && report.goodHabits.total > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-orange-300">
                    <TrendingDown className="h-5 w-5" /> Peut mieux faire... 💪
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <div className="mb-3 flex items-center gap-2 text-emerald-300">
                    <CheckCircle className="h-5 w-5" /> Bonnes habitudes
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {report.goodHabits.completed}/{report.goodHabits.total}
                  </p>
                  <p className="text-sm text-white/60">réussies</p>
                </div>
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                  <div className="mb-3 flex items-center gap-2 text-red-300">
                    <XCircle className="h-5 w-5" /> Craquages
                  </div>
                  <p className="text-3xl font-bold text-white">{report.badHabits.totalCracks}</p>
                  <p className="text-sm text-white/60">
                    {report.badHabits.cracked}/{report.badHabits.total} habitudes
                  </p>
                </div>
              </div>

              {report.goodHabits.completed > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="text-emerald-300">✨</span> Bonnes habitudes accomplies
                  </h3>
                  <div className="space-y-2">
                    {report.goodHabits.details.map((habit, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#141929] px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{habit.icon || '✨'}</span>
                          <span className="font-medium text-white">{habit.name}</span>
                        </div>
                        {habit.count > 1 && (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                            {habit.count}×
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.badHabits.totalCracks > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="text-red-300">🔥</span> Craquages du jour
                  </h3>
                  <div className="space-y-2">
                    {report.badHabits.details.map((habit, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-red-500/20 bg-[#1f1414] px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{habit.icon || '🔥'}</span>
                          <span className="font-medium text-white">{habit.name}</span>
                        </div>
                        <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                          {habit.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.goodHabits.completed === 0 && report.badHabits.totalCracks === 0 && (
                <div className="py-8 text-center text-white/60">
                  <div className="mb-3 text-5xl">📭</div>
                  Journée tranquille ou oubli de logger ?
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-white/60">Aucune donnée disponible</div>
          )}
        </div>

        <div className="sticky bottom-0 rounded-b-3xl border-t border-white/10 bg-[#0d1020] p-4">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-[#4DA6FF] py-3 text-sm font-semibold text-white shadow-lg shadow-[#4DA6FF]/40 transition hover:bg-[#3b82ff]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
