'use client'

/**
 * Onglet Historique - Liste des logs/events avec édition/suppression
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit2, Calendar, X, Check, Plus } from 'lucide-react'
import { useToast } from '@/components/Toast'

type HistoryEntry = {
  id: string
  date: string
  time?: string | null
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
  const [editTime, setEditTime] = useState('')
  const [editValue, setEditValue] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newValue, setNewValue] = useState(1)
  const { showToast, ToastComponent } = useToast()

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

        // Déclencher le rafraîchissement du modal DayReport s'il est ouvert
        window.dispatchEvent(new Event('dayReportRefresh'))
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  function startEdit(entry: HistoryEntry) {
    setEditingId(entry.id)
    setEditDate(entry.date)
    // Extraire l'heure au format HH:MM pour l'input
    setEditTime(extractTimeForInput(entry.time))
    setEditValue(entry.value)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDate('')
    setEditTime('')
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
          time: editTime || undefined,
          value: trackingMode === 'counter' ? editValue : 1,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Modification échouée')
      }

      const updated = await res.json()
      const nextValue = trackingMode === 'counter' ? editValue : 1
      setEntries(prev =>
        prev.map(e =>
          e.id === entry.id
            ? {
                ...e,
                date: updated?.completed_date ?? updated?.event_date ?? editDate,
                value: typeof updated?.value === 'number' ? updated.value : nextValue,
              }
            : e
        )
      )
      cancelEdit()
      router.refresh()

      // Déclencher le rafraîchissement du modal DayReport s'il est ouvert
      window.dispatchEvent(new Event('dayReportRefresh'))

      showToast('Modification enregistrée', 'success')
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      showToast('Erreur lors de la modification', 'error')
    }
  }

  function startCreate() {
    setIsCreating(true)
    // Par défaut, la date d'hier
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setNewDate(yesterday.toISOString().split('T')[0])
    // Par défaut, l'heure actuelle
    const now = new Date()
    setNewTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    setNewValue(1)
  }

  function cancelCreate() {
    setIsCreating(false)
    setNewDate('')
    setNewTime('')
    setNewValue(1)
  }

  async function saveCreate() {
    if (!newDate) {
      showToast('Veuillez sélectionner une date', 'error')
      return
    }

    try {
      const res = await fetch(`/api/habits/${habitId}/manual-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDate,
          time: newTime || undefined,
          value: trackingMode === 'counter' ? newValue : 1,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Création échouée')
      }

      // Recharger l'historique
      await fetchHistory()
      cancelCreate()
      router.refresh()

      // Déclencher le rafraîchissement du modal DayReport s'il est ouvert
      window.dispatchEvent(new Event('dayReportRefresh'))

      showToast('Entrée ajoutée avec succès', 'success')
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      showToast(error instanceof Error ? error.message : 'Erreur lors de la création', 'error')
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

  function formatTime(dateTime?: string | null) {
    if (!dateTime) return null
    const date = new Date(dateTime)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function extractTimeForInput(dateTime?: string | null): string {
    if (!dateTime) return ''
    const date = new Date(dateTime)
    if (Number.isNaN(date.getTime())) return ''
    // Format HH:MM pour l'input time
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
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
        <div className="flex items-center gap-3">
          <p className="text-xs text-white/40">{entries.length} entrée{entries.length > 1 ? 's' : ''}</p>
          {!isCreating && (
            <button
              onClick={startCreate}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Ajouter une entrée manuelle</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-white/40" />
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
              />
            </div>

            {/* Heure uniquement pour bad habits et counters (qui utilisent habit_events) */}
            {(isBadHabit || trackingMode === 'counter') && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">Heure:</span>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            )}

            {trackingMode === 'counter' && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">Valeur:</span>
                <input
                  type="number"
                  min="1"
                  value={newValue}
                  onChange={e => setNewValue(parseInt(e.target.value) || 1)}
                  className="w-24 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={saveCreate}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Check className="h-4 w-4" />
                Ajouter
              </button>
              <button
                onClick={cancelCreate}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

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

                  {/* Heure uniquement pour bad habits et counters (qui utilisent habit_events) */}
                  {(isBadHabit || trackingMode === 'counter') && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/60">Heure:</span>
                      <input
                        type="time"
                        value={editTime}
                        onChange={e => setEditTime(e.target.value)}
                        className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
                      />
                    </div>
                  )}

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
                    {formatTime(entry.time) && (
                      <p className="text-xs text-white/50">{formatTime(entry.time)}</p>
                    )}
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
      {ToastComponent}
    </div>
  )
}
