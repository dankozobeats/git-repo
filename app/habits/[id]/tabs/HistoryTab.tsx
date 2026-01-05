'use client'

/**
 * Onglet Historique - Liste des logs/events avec édition/suppression
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit2, Calendar, X, Check } from 'lucide-react'

type HistoryEntry = {
  id: string
  date: string
  value: number
  type: 'log' | 'event'
}

type HistoryTabProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter'
}

export default function HistoryTab({ habitId, habitType, trackingMode }: HistoryTabProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editValue, setEditValue] = useState(1)

  const isBadHabit = habitType === 'bad'

  useEffect(() => {
    fetchHistory()
  }, [habitId])

  async function fetchHistory() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/habits/${habitId}/history`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(entry: HistoryEntry) {
    if (!confirm(`Supprimer cette entrée du ${formatDate(entry.date)} ?`)) return

    try {
      const endpoint = entry.type === 'log'
        ? `/api/habits/${habitId}/logs/${entry.id}`
        : `/api/habits/${habitId}/events/${entry.id}`

      const res = await fetch(endpoint, { method: 'DELETE' })
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entry.id))
        router.refresh()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  function startEdit(entry: HistoryEntry) {
    setEditingId(entry.id)
    setEditDate(entry.date)
    setEditValue(entry.value)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDate('')
    setEditValue(1)
  }

  async function saveEdit(entry: HistoryEntry) {
    try {
      const endpoint = entry.type === 'log'
        ? `/api/habits/${habitId}/logs/${entry.id}`
        : `/api/habits/${habitId}/events/${entry.id}`

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editDate,
          value: trackingMode === 'counter' ? editValue : 1,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setEntries(prev =>
          prev.map(e => (e.id === entry.id ? { ...e, date: editDate, value: editValue } : e))
        )
        cancelEdit()
        router.refresh()
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      alert('Erreur lors de la modification')
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-5xl opacity-40">📭</div>
        <p className="text-sm text-white/60">Aucune entrée dans l'historique</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          📚 Historique complet
        </h2>
        <p className="text-xs text-white/40">{entries.length} entrée{entries.length > 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-2">
        {entries.map(entry => {
          const isEditing = editingId === entry.id

          return (
            <div
              key={entry.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20"
            >
              {isEditing ? (
                // Mode édition
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-white/40" />
                    <input
                      type="date"
                      value={editDate}
                      onChange={e => setEditDate(e.target.value)}
                      className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                    />
                  </div>

                  {trackingMode === 'counter' && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/60">Valeur:</span>
                      <input
                        type="number"
                        min="1"
                        value={editValue}
                        onChange={e => setEditValue(parseInt(e.target.value) || 1)}
                        className="w-24 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(entry)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      Enregistrer
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                // Mode affichage
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                        isBadHabit
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-green-500/20 text-green-300'
                      }`}
                    >
                      {isBadHabit ? '🔥' : '✅'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {formatDate(entry.date)}
                      </p>
                      {trackingMode === 'counter' && entry.value > 1 && (
                        <p className="text-xs text-white/50">{entry.value}×</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(entry)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300"
                      title="Modifier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
