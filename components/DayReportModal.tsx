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
    day: 'numeric'
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border-2 border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Rapport du jour</h2>
            <p className="text-gray-400 text-sm mt-1 capitalize">{formattedDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : report ? (
            <>
              {/* Score Global */}
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6 text-center">
                <div className="text-6xl font-bold text-white mb-2">
                  {report.successRate}%
                </div>
                <div className="text-gray-400">Taux de réussite</div>
                {report.successRate >= 80 && (
                  <div className="mt-3 text-green-400 flex items-center justify-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-medium">Excellente journée ! 🎉</span>
                  </div>
                )}
                {report.successRate < 50 && report.goodHabits.total > 0 && (
                  <div className="mt-3 text-orange-400 flex items-center justify-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-medium">Peut mieux faire... 💪</span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Good Habits */}
                <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-green-400">Bonnes Habitudes</h3>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {report.goodHabits.completed}/{report.goodHabits.total}
                  </div>
                  <div className="text-sm text-gray-400">réussies</div>
                </div>

                {/* Bad Habits */}
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <h3 className="font-semibold text-red-400">Craquages</h3>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {report.badHabits.totalCracks}
                  </div>
                  <div className="text-sm text-gray-400">
                    {report.badHabits.cracked}/{report.badHabits.total} habitudes
                  </div>
                </div>
              </div>

              {/* Détails Good Habits */}
              {report.goodHabits.completed > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-green-400">✨</span>
                    Bonnes habitudes accomplies
                  </h3>
                  <div className="space-y-2">
                    {report.goodHabits.details.map((habit, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{habit.icon || '✨'}</span>
                          <span className="text-white font-medium">{habit.name}</span>
                        </div>
                        {habit.count > 1 && (
                          <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                            {habit.count}×
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Détails Bad Habits */}
              {report.badHabits.totalCracks > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="text-red-400">🔥</span>
                    Craquages du jour
                  </h3>
                  <div className="space-y-2">
                    {report.badHabits.details.map((habit, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{habit.icon || '🔥'}</span>
                          <span className="text-white font-medium">{habit.name}</span>
                        </div>
                        <span className="bg-red-900/50 text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                          {habit.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jour vide */}
              {report.goodHabits.completed === 0 && report.badHabits.totalCracks === 0 && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-3">📭</div>
                  <p className="text-gray-400">Aucune activité ce jour-là</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Journée tranquille ou oubli de logger ?
                  </p>
                </div>
              )}

              {/* Message motivant */}
              {report.successRate === 100 && report.goodHabits.total > 0 && (
                <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700/50 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-semibold text-lg">
                    🎯 Journée parfaite ! Continue comme ça ! 💪
                  </p>
                </div>
              )}

              {report.badHabits.totalCracks >= 5 && (
                <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-700/50 rounded-lg p-4 text-center">
                  <p className="text-red-400 font-semibold">
                    😅 {report.badHabits.totalCracks} craquages... Demain sera mieux !
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Impossible de charger le rapport
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
