'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, LayoutList, Rows3, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { formatDateHuman, formatDateKey } from '@/lib/date-utils'

type AgendaItem = {
  id: string
  habit_id: string | null
  habit_name: string | null
  habit_icon: string | null
  habit_color: string | null
  habit_type: string | null
  entry_type: 'log' | 'event' | 'agenda'
  date: string
  occurred_at: string
  value: number | null
  title?: string
  description?: string | null
  scheduled_time?: string | null
  reminder_enabled?: boolean
  reminder_offset_minutes?: number | null
  is_completed?: boolean
}

type HabitOption = {
  id: string
  name: string
  type: 'good' | 'bad' | string
}

type AgendaView = 'month' | 'week' | 'timeline'

const VIEW_OPTIONS: Array<{ id: AgendaView; label: string; icon: typeof Calendar }> = [
  { id: 'month', label: 'Mois', icon: Calendar },
  { id: 'week', label: 'Semaine', icon: Rows3 },
  { id: 'timeline', label: 'Timeline', icon: LayoutList },
]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function startOfWeek(date: Date) {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(date)
  start.setDate(date.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(date.getDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(date.getMonth() + months)
  return next
}

function formatRangeLabel(view: AgendaView, start: Date, end: Date) {
  if (view === 'month') {
    return start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }
  if (view === 'week') {
    return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`
  }
  return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`
}

export default function AgendaClient() {
  const router = useRouter()
  const [view, setView] = useState<AgendaView>('month')
  const [anchorDate, setAnchorDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [items, setItems] = useState<AgendaItem[]>([])
  const [habits, setHabits] = useState<HabitOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGood, setShowGood] = useState(true)
  const [showBad, setShowBad] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formHabitId, setFormHabitId] = useState<string>('')
  const [formDate, setFormDate] = useState(formatDateKey(new Date()))
  const [formTime, setFormTime] = useState('')
  const [formReminderEnabled, setFormReminderEnabled] = useState(false)
  const [formReminderOffset, setFormReminderOffset] = useState('30')
  const [formCompleted, setFormCompleted] = useState(false)
  const [isCompactView, setIsCompactView] = useState(false)
  const todayKey = formatDateKey(new Date())

  const range = useMemo(() => {
    if (view === 'month') {
      const start = startOfMonth(anchorDate)
      const end = endOfMonth(anchorDate)
      return { start, end }
    }

    const start = startOfWeek(anchorDate)
    const end = addDays(start, view === 'week' ? 6 : 13)
    return { start, end }
  }, [anchorDate, view])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedGood = window.localStorage.getItem('agenda-show-good')
      const storedBad = window.localStorage.getItem('agenda-show-bad')
      if (storedGood !== null) setShowGood(storedGood === 'true')
      if (storedBad !== null) setShowBad(storedBad === 'true')
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedCompact = window.localStorage.getItem('agenda-compact-view')
    if (storedCompact !== null) {
      setIsCompactView(storedCompact === 'true')
      return
    }
    setIsCompactView(window.matchMedia('(max-width: 767px)').matches)
  }, [])

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch('/api/habits')
        if (!response.ok) return
        const data = await response.json()
        setHabits(data.habits || [])
      } catch {
        // Ignore habits fetch errors
      }
    }

    fetchHabits()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('agenda-show-good', String(showGood))
      window.localStorage.setItem('agenda-show-bad', String(showBad))
    } catch {
      // Ignore localStorage errors
    }
  }, [showGood, showBad])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('agenda-compact-view', String(isCompactView))
    } catch {
      // Ignore localStorage errors
    }
  }, [isCompactView])

  useEffect(() => {
    const startKey = formatDateKey(range.start)
    const endKey = formatDateKey(range.end)

    const fetchAgenda = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/agenda?start=${startKey}&end=${endKey}`)
        if (!response.ok) {
          throw new Error('Failed to load agenda')
        }
        const data = await response.json()
        setItems(data.items || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agenda')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgenda()
  }, [range.start, range.end, refreshKey])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.entry_type === 'agenda') return true
      if (item.habit_type === 'good') return showGood
      if (item.habit_type === 'bad') return showBad
      return true
    })
  }, [items, showBad, showGood])

  const itemsByDay = useMemo(() => {
    const map: Record<string, AgendaItem[]> = {}
    filteredItems.forEach((item) => {
      const key = item.date
      if (!map[key]) map[key] = []
      map[key].push(item)
    })
    return map
  }, [filteredItems])

  const monthDays = useMemo(() => {
    if (view !== 'month') return []
    const start = startOfMonth(anchorDate)
    const end = endOfMonth(anchorDate)
    const offset = (start.getDay() + 6) % 7
    const days: Array<Date | null> = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= end.getDate(); day += 1) {
      days.push(new Date(start.getFullYear(), start.getMonth(), day))
    }
    while (days.length % 7 !== 0) {
      days.push(null)
    }
    return days
  }, [anchorDate, view])

  const weekDays = useMemo(() => {
    if (view !== 'week') return []
    return Array.from({ length: 7 }, (_, index) => addDays(range.start, index))
  }, [range.start, view])

  const timelineDays = useMemo(() => {
    if (view !== 'timeline') return []
    const totalDays = Math.floor(
      (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    return Array.from({ length: totalDays }, (_, index) => addDays(range.start, index))
  }, [range.start, range.end, view])

  const selectedItems = selectedDate ? itemsByDay[selectedDate] || [] : []

  const handlePrevious = () => {
    if (view === 'month') {
      setAnchorDate((prev) => addMonths(prev, -1))
      return
    }
    setAnchorDate((prev) => addDays(prev, view === 'week' ? -7 : -14))
  }

  const handleNext = () => {
    if (view === 'month') {
      setAnchorDate((prev) => addMonths(prev, 1))
      return
    }
    setAnchorDate((prev) => addDays(prev, view === 'week' ? 7 : 14))
  }

  const handleToday = () => {
    setAnchorDate(new Date())
  }

  const openCreate = (date?: string) => {
    setEditingItem(null)
    setFormTitle('')
    setFormDescription('')
    setFormHabitId('')
    setFormDate(date || formatDateKey(new Date()))
    setFormTime('')
    setFormReminderEnabled(false)
    setFormReminderOffset('30')
    setFormCompleted(false)
    setIsEditorOpen(true)
  }

  const openEdit = (item: AgendaItem) => {
    if (item.entry_type !== 'agenda') return
    setEditingItem(item)
    setFormTitle(item.title || '')
    setFormDescription(item.description || '')
    setFormHabitId(item.habit_id || '')
    setFormDate(item.date)
    setFormTime(item.scheduled_time || '')
    setFormReminderEnabled(Boolean(item.reminder_enabled))
    setFormReminderOffset(String(item.reminder_offset_minutes ?? 30))
    setFormCompleted(Boolean(item.is_completed))
    setIsEditorOpen(true)
  }

  const handleSaveAgendaItem = async () => {
    if (!formTitle.trim() || !formDate) return
    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      habit_id: formHabitId || null,
      scheduled_date: formDate,
      scheduled_time: formTime || null,
      reminder_enabled: formReminderEnabled,
      reminder_offset_minutes: formReminderEnabled ? Number(formReminderOffset || 30) : null,
      is_completed: formCompleted,
    }

    try {
      const url = editingItem
        ? `/api/agenda-items/${editingItem.id}`
        : '/api/agenda-items'
      const method = editingItem ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Failed to save agenda item')
      }
      setIsEditorOpen(false)
      setEditingItem(null)
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agenda item')
    }
  }

  const handleDeleteAgendaItem = async (item: AgendaItem) => {
    if (item.entry_type !== 'agenda') return
    if (!confirm('Supprimer ce rendez-vous ?')) return
    try {
      const response = await fetch(`/api/agenda-items/${item.id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete agenda item')
      }
      setRefreshKey((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agenda item')
    }
  }

  const renderAgendaItem = (item: AgendaItem) => {
    const isAgenda = item.entry_type === 'agenda'
    const timeLabel = isAgenda
      ? (item.scheduled_time ? formatDateHuman(item.occurred_at, { includeTime: true }) : formatDateHuman(item.occurred_at))
      : formatDateHuman(item.occurred_at, { includeTime: true })

    return (
      <div
        key={`${item.entry_type}-${item.id}`}
        className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{item.habit_icon || (isAgenda ? '📌' : '•')}</span>
          <div>
            <p className={`font-semibold text-white ${item.is_completed ? 'line-through text-white/50' : ''}`}>
              {isAgenda ? item.title : item.habit_name}
            </p>
            <p className="text-xs text-white/50">
              {timeLabel}
              {isAgenda && item.habit_name ? ` · ${item.habit_name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAgenda ? (
            <>
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200">
                Rendez-vous
              </span>
              {item.reminder_enabled && (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
                  Rappel
                </span>
              )}
              <button
                onClick={() => openEdit(item)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Éditer
              </button>
              <button
                onClick={() => handleDeleteAgendaItem(item)}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-400/70"
              >
                Supprimer
              </button>
            </>
          ) : (
            <>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.habit_type === 'bad'
                    ? 'bg-rose-500/20 text-rose-200'
                    : 'bg-emerald-500/20 text-emerald-200'
                }`}
              >
                {item.entry_type === 'event' ? 'Compteur' : 'Validation'}
              </span>
              {item.habit_id && (
                <button
                  onClick={() => router.push(`/habits/${item.habit_id}`)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  Ouvrir
                </button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Agenda global</p>
              <h1 className="text-3xl font-semibold text-white">Vue d ensemble</h1>
            </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  onClick={() => setView(option.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em] ${
                    view === option.id
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              )
            })}
            <button
              onClick={() => setShowGood((prev) => !prev)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em] ${
                showGood
                  ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100'
                  : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              Bonnes
            </button>
            <button
              onClick={() => setShowBad((prev) => !prev)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em] ${
                showBad
                  ? 'border-rose-400/60 bg-rose-500/10 text-rose-100'
                  : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              Mauvaises
            </button>
            <button
              onClick={() => {
                setShowGood(true)
                setShowBad(true)
                if (typeof window !== 'undefined') {
                  try {
                    window.localStorage.removeItem('agenda-show-good')
                    window.localStorage.removeItem('agenda-show-bad')
                  } catch {
                    // Ignore localStorage errors
                  }
                }
              }}
              title="Réactive toutes les habitudes"
              className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 transition hover:border-white/30 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em]"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setIsCompactView((prev) => !prev)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em] ${
                isCompactView
                  ? 'border-sky-400/60 bg-sky-500/10 text-sky-100'
                  : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
              }`}
            >
              Compact
            </button>
            {showGood && showBad && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Tout
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrevious}
              className="rounded-full border border-white/10 bg-black/30 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNext}
              className="rounded-full border border-white/10 bg-black/30 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:border-white/30 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.3em]"
            >
              Aujourd hui
            </button>
            <button
              onClick={() => openCreate(selectedDate || todayKey)}
              className="flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-100 transition hover:border-sky-300/70 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em]"
            >
              <Plus className="h-4 w-4" />
              Rendez-vous
            </button>
          </div>
          <p className="text-sm text-white/70">{formatRangeLabel(view, range.start, range.end)}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-white/50">
          Chargement de l agenda...
        </div>
      ) : (
        <>
          {view === 'month' && (
            <div className={`grid gap-6 ${isCompactView ? '' : 'lg:grid-cols-[1.2fr_0.8fr]'}`}>
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
                <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 sm:text-xs sm:tracking-[0.3em]">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label) => (
                    <span key={label} className="text-center">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-7 gap-2 sm:mt-4">
                  {monthDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="h-16 rounded-2xl border border-white/5 sm:h-20" />
                    }
                    const key = formatDateKey(day)
                    const dayItems = itemsByDay[key] || []
                    const goodCount = dayItems.filter((item) => item.entry_type !== 'agenda' && item.habit_type === 'good').length
                    const badCount = dayItems.filter((item) => item.entry_type !== 'agenda' && item.habit_type === 'bad').length
                    const agendaCount = dayItems.filter((item) => item.entry_type === 'agenda').length
                    const isSelected = selectedDate === key
                    const isToday = key === todayKey
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(key)}
                        className={`flex h-16 flex-col items-start justify-between rounded-2xl border px-2 py-2 text-left text-[11px] transition sm:h-20 sm:text-[12px] ${
                          isSelected
                            ? 'border-white/40 bg-white/10'
                            : isToday
                              ? 'border-emerald-400/60 bg-black/40'
                              : 'border-white/10 bg-black/40 hover:border-white/30'
                        }`}
                      >
                        <span className="text-sm font-semibold text-white">{day.getDate()}</span>
                        <div className="flex flex-col gap-1 text-[10px] text-white/60 sm:text-[11px]">
                          {isCompactView ? (
                            <>
                              <span className="text-white/70">{goodCount + badCount + agendaCount} items</span>
                              {agendaCount > 0 && <span className="text-sky-300">+{agendaCount} rdv</span>}
                            </>
                          ) : (
                            <>
                              {goodCount > 0 && <span className="text-emerald-300">+{goodCount} bonnes</span>}
                              {badCount > 0 && <span className="text-rose-300">+{badCount} mauvaises</span>}
                              {agendaCount > 0 && <span className="text-sky-300">+{agendaCount} rdv</span>}
                              {goodCount === 0 && badCount === 0 && agendaCount === 0 && (
                                <span className="text-white/30">Rien</span>
                              )}
                            </>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {!isCompactView && (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">Jour selectionne</p>
                      <h2 className="text-xl font-semibold text-white">
                        {selectedDate ? formatDateHuman(selectedDate) : 'Selectionne un jour'}
                      </h2>
                    </div>
                    <button
                      onClick={() => openCreate(selectedDate || todayKey)}
                      className="flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-sky-100 transition hover:border-sky-300/70"
                    >
                      <Plus className="h-4 w-4" />
                      Rendez vous
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedItems.length === 0 && (
                      <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/50">
                        Aucun log, event ou rendez-vous pour ce jour.
                      </p>
                    )}
                    {selectedItems.map(renderAgendaItem)}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'week' && (
            <div className="space-y-4">
              {weekDays.map((day) => {
                const key = formatDateKey(day)
                const dayItems = itemsByDay[key] || []
                const isToday = key === todayKey
                const dayGood = dayItems.filter((item) => item.entry_type !== 'agenda' && item.habit_type === 'good').length
                const dayBad = dayItems.filter((item) => item.entry_type !== 'agenda' && item.habit_type === 'bad').length
                const dayAgenda = dayItems.filter((item) => item.entry_type === 'agenda').length
                return (
                  <div
                    key={key}
                    className={`rounded-3xl border p-6 ${
                      isToday ? 'border-emerald-400/60 bg-white/[0.02]' : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">{formatDateHuman(day)}</h2>
                      <span className="text-xs text-white/40">{dayItems.length} items</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {dayItems.length === 0 ? (
                        <p className="text-sm text-white/50">Rien de prévu.</p>
                      ) : isCompactView ? (
                        <div className="flex flex-wrap gap-2 text-sm text-white/70">
                          <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                            Total: {dayItems.length}
                          </span>
                          {dayGood > 0 && (
                            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                              {dayGood} bonnes
                            </span>
                          )}
                          {dayBad > 0 && (
                            <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-rose-200">
                              {dayBad} mauvaises
                            </span>
                          )}
                          {dayAgenda > 0 && (
                            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sky-200">
                              {dayAgenda} rdv
                            </span>
                          )}
                        </div>
                      ) : (
                        dayItems.map(renderAgendaItem)
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'timeline' && (
            <div className="space-y-4">
              {timelineDays.map((day) => {
                const key = formatDateKey(day)
                const dayItems = itemsByDay[key] || []
                const isToday = key === todayKey
                const dayGood = dayItems.filter((item) => item.entry_type !== 'agenda' && item.habit_type === 'good').length
                const dayBad = dayItems.filter((item) => item.entry_type !== 'agenda' && item.habit_type === 'bad').length
                const dayAgenda = dayItems.filter((item) => item.entry_type === 'agenda').length
                return (
                  <div
                    key={key}
                    className={`rounded-3xl border p-6 ${
                      isToday ? 'border-emerald-400/60 bg-white/[0.02]' : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">{formatDateHuman(day)}</h2>
                      <span className="text-xs text-white/40">{dayItems.length} items</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {dayItems.length === 0 ? (
                        <p className="text-sm text-white/50">Aucun élément.</p>
                      ) : isCompactView ? (
                        <div className="flex flex-wrap gap-2 text-sm text-white/70">
                          <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
                            Total: {dayItems.length}
                          </span>
                          {dayGood > 0 && (
                            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                              {dayGood} bonnes
                            </span>
                          )}
                          {dayBad > 0 && (
                            <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-rose-200">
                              {dayBad} mauvaises
                            </span>
                          )}
                          {dayAgenda > 0 && (
                            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sky-200">
                              {dayAgenda} rdv
                            </span>
                          )}
                        </div>
                      ) : (
                        dayItems.map(renderAgendaItem)
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0f1d] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {editingItem ? 'Édition' : 'Nouveau'}
                </p>
                <h2 className="text-2xl font-semibold text-white">Rendez-vous</h2>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 hover:border-white/30"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Titre
                </label>
                <input
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none"
                  placeholder="Ex: RDV médecin"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(event) => setFormDate(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Heure (optionnel)
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(event) => setFormTime(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Lien avec une habitude (optionnel)
                </label>
                <select
                  value={formHabitId}
                  onChange={(event) => setFormHabitId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Aucune</option>
                  {habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>
                      {habit.name} ({habit.type === 'bad' ? 'mauvaise' : 'bonne'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:outline-none"
                  placeholder="Notes rapides..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={formReminderEnabled}
                    onChange={(event) => setFormReminderEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-black/40 text-sky-400"
                  />
                  Activer un rappel (badge)
                </label>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Minutes avant
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={formReminderOffset}
                    onChange={(event) => setFormReminderOffset(event.target.value)}
                    disabled={!formReminderEnabled}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={formCompleted}
                  onChange={(event) => setFormCompleted(event.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-black/40 text-emerald-400"
                />
                Marquer comme terminé
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAgendaItem}
                className="rounded-2xl border border-sky-400/50 bg-sky-500/20 px-6 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-300/80"
              >
                {editingItem ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
