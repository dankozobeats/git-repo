'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Edit, Trash2, X } from 'lucide-react'
import type { Database } from '@/types/database'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

/* ———————————————————————————————— */
/* TYPES */
/* ———————————————————————————————— */

type HabitSummary = {
  id: string
  name: string
  type: 'good' | 'bad'
}

type HabitStatsModalProps = {
  habit: HabitSummary
  onClose: () => void
}

type InsightData = {
  icon: string
  category: string
  streak: number
  streakRecord: number
  frequency: number
  trend: number[]
  week: number[]
  history: { date: string; completed: boolean }[]
  coachMessage: string
}

type HabitMetaRow = Pick<
  Database['public']['Tables']['habits']['Row'],
  'icon' | 'color' | 'category_id' | 'created_at'
>

type HabitLogRow = Pick<
  Database['public']['Tables']['logs']['Row'],
  'completed_date' | 'value' | 'created_at'
>

// ❗ created_at supprimé ici (car n’existe pas dans habit_events)
type HabitEventRow = Pick<
  Database['public']['Tables']['habit_events']['Row'],
  'event_date' | 'occurred_at'
>

/* ———————————————————————————————— */

const formatDate = (date: Date) => date.toISOString().split('T')[0]

const normalizeDate = (date?: string | null, fallback?: string | null) => {
  if (date) return date.split('T')[0]
  if (fallback) return fallback.split('T')[0]
  return null
}

/* ———————————————————————————————— */
/* COMPONENT */
/* ———————————————————————————————— */

export default function HabitStatsModal({ habit, onClose }: HabitStatsModalProps) {
  const [data, setData] = useState<InsightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        const [habitRes, logsRes, eventsRes] = await Promise.all([
          supabase
            .from('habits')
            .select('icon, color, category_id, created_at')
            .eq('id', habit.id)
            .single(),

          supabase
            .from('logs')
            .select('completed_date, value, created_at')
            .eq('habit_id', habit.id)
            .order('completed_date', { ascending: true }),

          // ❗ created_at retiré
          supabase
            .from('habit_events')
            .select('event_date, occurred_at')
            .eq('habit_id', habit.id)
            .order('event_date', { ascending: true }),
        ])

        if (habitRes.error) throw habitRes.error
        if (logsRes.error) throw logsRes.error
        if (eventsRes.error) throw eventsRes.error

        const habitRow = habitRes.data as HabitMetaRow | null
        const logRows = (logsRes.data ?? []) as HabitLogRow[]
        const eventRows = (eventsRes.data ?? []) as HabitEventRow[]

        let categoryLabel =
          habit.type === 'bad'
            ? 'Habitudes à limiter'
            : 'Habitudes à renforcer'

        if (habitRow?.category_id) {
          const { data: category } = await supabase
            .from('categories')
            .select('name')
            .eq('id', habitRow.category_id)
            .single()
          if (category?.name) categoryLabel = category.name
        }

        const insight = buildInsight(
          habit,
          habitRow?.icon ?? (habit.type === 'bad' ? '🔥' : '✨'),
          categoryLabel,
          habitRow?.created_at ?? null,
          logRows,
          eventRows
        )

        setData(insight)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les détails.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchInsight()
  }, [habit])

  /* ============================================== */
  /* GRAPH DATA */
  /* ============================================== */

  const trendPoints = useMemo(
    () => data?.trend.map((value, index) => ({ day: index + 1, value })) ?? [],
    [data]
  )

  const weekPoints = useMemo(() => {
    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
    return (
      data?.week.map((value, index) => ({
        day: dayLabels[index] ?? `J${index + 1}`,
        value,
      })) ?? []
    )
  }, [data])

  const trendDelta = useMemo(() => {
    if (!data || data.trend.length < 2) return 0
    const first = data.trend[0]
    const last = data.trend[data.trend.length - 1]
    if (first === 0) return last === 0 ? 0 : 100
    return Math.round(((last - first) / first) * 100)
  }, [data])

  /* ============================================== */
  /* MODAL CONTENT */
  /* ============================================== */

  const modalContent = () => {
    if (loading) {
      return (
        <p className="text-center text-sm text-gray-400">
          Analyse des données en cours…
        </p>
      )
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-center">
          <p className="text-lg font-semibold text-white">
            Impossible de charger les détails
          </p>
          <p className="mt-2 text-sm text-gray-300">{error}</p>
        </div>
      )
    }

    if (!data) return null

    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* LEFT : TITLE + ICON */}
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/30 text-2xl">
              {data.icon}
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{habit.name}</h2>
              <p className="text-sm text-gray-400">{data.category}</p>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${habit.type === 'bad'
                  ? 'border-red-500 text-red-300'
                  : 'border-emerald-400 text-emerald-300'
                  }`}
              >
                {habit.type === 'bad'
                  ? 'Habitude négative'
                  : 'Habitude positive'}
              </span>
            </div>
          </div>

          {/* RIGHT : ACTION BUTTONS */}
          <div className="flex gap-2">
            <Link
              href={`/habits/${habit.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Link>

            <button
              onClick={() => {
                if (confirm('Supprimer cette habitude ?')) {
                  fetch(`/api/habits/${habit.id}/delete`, {
                    method: 'POST',
                  }).then(() => onClose())
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/40 px-4 text-sm text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>

            <button
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-xl border border-white/10 px-3 text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Streak actuel',
              value: `${data.streak} j`,
              accent: 'text-emerald-300',
            },
            {
              label: 'Record',
              value: `${data.streakRecord} j`,
              accent: 'text-yellow-300',
            },
            {
              label: 'Fréquence',
              value: `${data.frequency}%`,
              accent: 'text-sky-300',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                {stat.label}
              </p>
              <p className={`mt-2 text-2xl font-bold ${stat.accent}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* GRAPHS */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* TREND */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <p>Tendance 30 jours</p>
              <span
                className={
                  trendDelta >= 0 ? 'text-emerald-400' : 'text-red-400'
                }
              >
                {trendDelta >= 0 ? '+' : ''}
                {isFinite(trendDelta) ? trendDelta : 0}%
              </span>
            </div>

            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4DA6FF"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f111b',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* WEEKLY */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-sm text-gray-400">Activité hebdo</div>

            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekPoints}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis
                    dataKey="day"
                    stroke="rgba(255,255,255,0.4)"
                  />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f111b',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={habit.type === 'bad' ? '#f87171' : '#4ade80'}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* HISTORY + COACH */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* HISTORY */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Historique 30j</p>

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-2 text-sm">
              {data.history.map(entry => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2"
                >
                  <span className="text-gray-400">
                    {new Date(entry.date).toLocaleDateString(
                      'fr-FR',
                      {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      }
                    )}
                  </span>

                  <span
                    className={`text-sm font-semibold ${entry.completed
                      ? habit.type === 'bad'
                        ? 'text-red-400'
                        : 'text-emerald-400'
                      : 'text-gray-500'
                      }`}
                  >
                    {entry.completed
                      ? habit.type === 'bad'
                        ? 'Craqué'
                        : 'Validé'
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* COACH */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Coach IA</p>
            <p className="mt-3 flex-1 text-base text-gray-300">
              {data.coachMessage}
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-500">
              Analyse générée automatiquement à partir des données des 30
              derniers jours.
            </div>
          </div>
        </div>
      </>
    )
  }

  /* ———————————————————————————————— */

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative z-[100000] h-full w-full overflow-y-auto bg-[#11131c] p-5 text-white sm:h-auto sm:max-w-4xl sm:rounded-3xl sm:p-8">
        {modalContent()}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

/* ———————————————————————————————— */
/* LOGIC */
/* ———————————————————————————————— */

function buildInsight(
  habit: HabitSummary,
  icon: string,
  category: string,
  createdAt: string | null,
  logs: HabitLogRow[],
  events: HabitEventRow[]
): InsightData {
  const today = new Date()

  const dateKeys: string[] = []
  for (let offset = 29; offset >= 0; offset--) {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    dateKeys.push(formatDate(d))
  }

  const logCounts = new Map<string, number>()
  logs.forEach(log => {
    const date = normalizeDate(log.completed_date, log.created_at)
    if (!date) return
    const amount =
      typeof log.value === 'number' ? Math.max(1, log.value) : 1
    logCounts.set(date, (logCounts.get(date) ?? 0) + amount)
  })

  const eventCounts = new Map<string, number>()
  events.forEach(event => {
    const date = normalizeDate(event.event_date, event.occurred_at)
    if (!date) return
    eventCounts.set(date, (eventCounts.get(date) ?? 0) + 1)
  })

  const relevantCounts =
    habit.type === 'bad' ? eventCounts : logCounts

  const trend = dateKeys.map(k => relevantCounts.get(k) ?? 0)

  const history = dateKeys
    .slice()
    .reverse()
    .map(k => ({
      date: k,
      completed:
        habit.type === 'bad'
          ? (eventCounts.get(k) ?? 0) > 0
          : (logCounts.get(k) ?? 0) > 0,
    }))

  const last7 = dateKeys.slice(-7)
  const week = last7.map(k => relevantCounts.get(k) ?? 0)

  const activeDays =
    habit.type === 'bad'
      ? dateKeys.filter(k => (eventCounts.get(k) ?? 0) === 0)
        .length
      : dateKeys.filter(k => (logCounts.get(k) ?? 0) > 0).length

  const frequency = Math.round(
    (activeDays / dateKeys.length) * 100
  )

  const logSet = new Set(
    [...logCounts.entries()]
      .filter(([, v]) => v > 0)
      .map(([k]) => k)
  )

  const eventSet = new Set(
    [...eventCounts.entries()]
      .filter(([, v]) => v > 0)
      .map(([k]) => k)
  )

  const streakInfo =
    habit.type === 'bad'
      ? computeBadHabitStreak(eventSet, createdAt, today)
      : computeGoodHabitStreak(logSet, today)

  const coachMessage =
    habit.type === 'bad'
      ? streakInfo.current > 5
        ? 'Tu protèges bien ton rythme. Continue à identifier les déclencheurs pour rester focus.'
        : 'Chaque jour clean compte. Prends une minute pour comprendre ce qui t’a fait craquer.'
      : streakInfo.current > 5
        ? 'Tu construis une routine solide. Continue d’empiler les validations sans te poser de questions.'
        : 'Reviens à l’essentiel : une action simple aujourd’hui débloque la suite.'

  return {
    icon,
    category,
    streak: streakInfo.current,
    streakRecord: streakInfo.max,
    frequency,
    trend,
    week,
    history,
    coachMessage,
  }
}

/* ———————————————————————————————— */

function computeGoodHabitStreak(dateSet: Set<string>, today: Date) {
  if (dateSet.size === 0) return { current: 0, max: 0 }

  const sorted = Array.from(dateSet).sort()

  let longest = 0
  let streak = 0
  let prev: Date | null = null

  sorted.forEach(d => {
    const date = new Date(`${d}T00:00:00`)
    if (prev && differenceInDays(prev, date) === 1) streak++
    else streak = 1
    longest = Math.max(longest, streak)
    prev = date
  })

  let current = 0
  const cursor = new Date(today)

  while (true) {
    const key = formatDate(cursor)
    if (dateSet.has(key)) {
      current++
      cursor.setDate(cursor.getDate() - 1)
    } else break
  }

  return { current, max: longest }
}

function computeBadHabitStreak(
  dateSet: Set<string>,
  createdAt: string | null,
  today: Date
) {
  const sorted = Array.from(dateSet).sort()
  const creation = createdAt ? new Date(createdAt) : null

  let current = 0
  const cursor = new Date(today)

  while (true) {
    const key = formatDate(cursor)
    if (dateSet.has(key)) break
    current++
    cursor.setDate(cursor.getDate() - 1)
    if (creation && cursor < creation) break
  }

  let max = current
  let prev: Date | null = creation

  sorted.forEach(d => {
    const event = new Date(`${d}T00:00:00`)
    if (prev) {
      const start = new Date(prev)
      start.setDate(start.getDate() + 1)
      const gap = Math.max(0, differenceInDays(start, event))
      max = Math.max(max, gap)
    }
    prev = event
  })

  if (sorted.length) {
    const last = new Date(`${sorted[sorted.length - 1]}T00:00:00`)
    max = Math.max(max, differenceInDays(last, today))
  } else if (creation) {
    max = Math.max(max, differenceInDays(creation, today))
  }

  return { current, max }
}

function differenceInDays(a: Date, b: Date) {
  return Math.floor(
    (b.getTime() - a.getTime()) / 86400000
  )
}
