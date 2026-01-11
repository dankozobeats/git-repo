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

  // Fonction exposée pour rafraîchir manuellement
  useEffect(() => {
    const handleRefresh = () => {
      if (isOpen && date) {
        fetchReport()
      }
    }

    window.addEventListener('dayReportRefresh', handleRefresh)
    return () => window.removeEventListener('dayReportRefresh', handleRefresh)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-800 bg-gray-950/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-800 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-semibold">Rapport du jour</p>
            <h2 className="text-2xl font-semibold text-white capitalize">{formattedDate}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-800 bg-gray-900/60 p-2 text-gray-300 transition hover:text-white hover:border-gray-700"
            aria-label="Fermer le rapport"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          {isLoading ? (
            <div className="py-12 text-center text-gray-300">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              Chargement...
            </div>
          ) : report ? (
            <>
              <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-5xl font-semibold text-white">{report.successRate}%</p>
                <p className="text-sm text-gray-400 mt-2">Taux de réussite</p>
                {report.successRate >= 80 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-emerald-300">
                    <TrendingUp className="h-5 w-5 opacity-90" /> Excellente journée !
                  </div>
                )}
                {report.successRate < 50 && report.goodHabits.total > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-amber-300">
                    <TrendingDown className="h-5 w-5 opacity-90" /> Peut mieux faire...
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-2 text-gray-300 text-sm font-semibold uppercase tracking-wide">
                    <CheckCircle className="h-4 w-4 opacity-80" /> Bonnes habitudes
                  </div>
                  <p className="text-3xl font-semibold text-white">
                    {report.goodHabits.completed}/{report.goodHabits.total}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">réussies</p>
                </div>
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-2 text-gray-300 text-sm font-semibold uppercase tracking-wide">
                    <XCircle className="h-4 w-4 opacity-80" /> Craquages
                  </div>
                  <p className="text-3xl font-semibold text-white">{report.badHabits.totalCracks}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {report.badHabits.cracked}/{report.badHabits.total} habitudes
                  </p>
                </div>
              </div>

              {report.goodHabits.completed > 0 && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
                    Bonnes habitudes accomplies
                  </h3>
                  <div className="space-y-3">
                    {report.goodHabits.details.map((habit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/30 px-4 py-3 text-sm text-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl">{habit.icon || '✨'}</span>
                          <span className="font-medium truncate">{habit.name}</span>
                        </div>
                        {habit.count > 1 && (
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            {habit.count}×
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.badHabits.totalCracks > 0 && (
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">Craquages du jour</h3>
                  <div className="space-y-3">
                    {report.badHabits.details.map((habit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/30 px-4 py-3 text-sm text-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl">{habit.icon || '🔥'}</span>
                          <span className="font-medium truncate">{habit.name}</span>
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
                <div className="py-10 text-center text-gray-400">
                  <div className="mb-4 text-4xl">📭</div>
                  Journée calme ou oubli de logger.
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-gray-400">Aucune donnée disponible</div>
          )}
        </div>

        <div className="border-t border-gray-800 px-6 py-5">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-blue-500/40 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
