import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Activity, BarChart3 } from 'lucide-react'
import StatsTabs from '@/components/stats/StatsTabs'
import type { Database } from '@/types/database'
import type { ReactNode } from 'react'
import type { DailyProgressPoint } from '@/components/stats/DailyProgressChart'
import type { WeekdayPoint } from '@/components/stats/WeekdayChart'
import type { WeeklyPoint } from '@/components/stats/WeeklyTrendChart'
import type { TopHabitPoint } from '@/components/stats/TopHabitsChart'
import type { CalendarPoint } from '@/components/stats/CalendarHeatmap'
import { createClient } from '@/lib/supabase/server'

const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

type HabitRecord = Pick<Database['public']['Tables']['habits']['Row'], 'id' | 'user_id' | 'name' | 'icon' | 'type'>
type LogRecord = {
  id: string
  user_id: string
  habit_id: string
  value: number | null
  completed_date: string
  created_at: string
}

type StatsResponse = {
  habits: HabitRecord[]
  logs: LogRecord[]
}

type ProcessedStats = {
  daily: DailyProgressPoint[]
  weekday: WeekdayPoint[]
  weekly: WeeklyPoint[]
  topHabits: TopHabitPoint[]
  calendar: CalendarPoint[]
  summary: {
    totalLogs: number
    totalHabits: number
    completion: number
  }
}

export default async function HabitStatsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, user_id, name, icon, type')
    .eq('user_id', user!.id)
    .eq('is_archived', false)

  if (habitsError) {
    throw new Error(habitsError.message)
  }

  const { data: logs, error: logsError } = await supabase
    .from('logs')
    .select('id, user_id, habit_id, value, completed_date, created_at')
    .eq('user_id', user!.id)
    .order('completed_date', { ascending: false })

  if (logsError) {
    throw new Error(logsError.message)
  }

  const payload: StatsResponse = {
    habits: habits ?? [],
    logs: logs ?? [],
  }
  const stats = buildStats(payload)

  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0]">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <header className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1E1E1E] via-[#151515] to-[#0f0f0f] p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white/70 transition hover:border-white/40">
              <ArrowLeft className="h-4 w-4" /> Retour habitudes
            </Link>
            <div className="text-center md:text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Analytique</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Statistiques d'habitudes</h1>
              <p className="text-sm text-white/60">Visualise tes tendances et repère les moments forts (ou faibles).</p>
            </div>
            <Link
              href="/reports/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
            >
              <BarChart3 className="h-4 w-4" /> Dashboard IA
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Habitudes actives" value={stats.summary.totalHabits.toString()} icon={<Activity className="h-5 w-5 text-[#4DA6FF]" />} accent="#4DA6FF" />
            <StatCard label="Logs analysés" value={stats.summary.totalLogs.toString()} icon={<TrendingUp className="h-5 w-5 text-[#2ECC71]" />} accent="#2ECC71" />
            <StatCard label="Complétion moyenne" value={`${stats.summary.completion}%`} icon={<ArrowLeft className="h-5 w-5 rotate-90 text-[#FF4D4D]" />} accent="#FF4D4D" />
          </div>
        </header>

        <section className="space-y-6 rounded-3xl border border-white/5 bg-[#1B1B24] p-6 shadow-2xl shadow-black/40">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Exploration</p>
            <h2 className="text-2xl font-bold text-white">Analyses interactives</h2>
            <p className="text-sm text-white/60">Choisis un onglet pour explorer tes performances sous différents angles.</p>
          </div>
          <StatsTabs
            daily={stats.daily}
            weekday={stats.weekday}
            weekly={stats.weekly}
            topHabits={stats.topHabits}
            calendar={stats.calendar}
          />
        </section>
      </div>
    </main>
  )
}

function buildStats(data: StatsResponse): ProcessedStats {
  const habitsMap = new Map<string, HabitRecord>(data.habits.map(habit => [habit.id, habit]))
  const logsWithDate = data.logs
    .map(log => {
      const dateStr = log.completed_date || log.created_at
      const parsed = new Date(dateStr)
      if (Number.isNaN(parsed.getTime())) {
        return null
      }
      return { ...log, date: parsed }
    })
    .filter(Boolean) as Array<LogRecord & { date: Date }>

  const groupedByDate = new Map<string, { success: number; total: number }>()
  const habitStats = new Map<string, { success: number; total: number }>()
  let overallSuccess = 0

  logsWithDate.forEach(log => {
    const key = log.date.toISOString().split('T')[0]
    const isSuccess = (log.value ?? 0) > 0
    const dateEntry = groupedByDate.get(key) || { success: 0, total: 0 }
    groupedByDate.set(key, {
      success: dateEntry.success + (isSuccess ? 1 : 0),
      total: dateEntry.total + 1,
    })

    const habitEntry = habitStats.get(log.habit_id) || { success: 0, total: 0 }
    habitStats.set(log.habit_id, {
      success: habitEntry.success + (isSuccess ? 1 : 0),
      total: habitEntry.total + 1,
    })

    overallSuccess += isSuccess ? 1 : 0
  })

  const totalLogs = logsWithDate.length
  const summaryCompletion = totalLogs === 0 ? 0 : Math.round((overallSuccess / totalLogs) * 100)

  const daily = buildDailyData(groupedByDate)
  const weekday = buildWeekdayData(logsWithDate)
  const weekly = buildWeeklyData(logsWithDate)
  const topHabits = buildTopHabits(habitStats, habitsMap)
  const calendar = buildCalendarData(groupedByDate)

  return {
    daily,
    weekday,
    weekly,
    topHabits,
    calendar,
    summary: {
      totalLogs,
      totalHabits: data.habits.length,
      completion: summaryCompletion,
    },
  }
}

function buildDailyData(groupedByDate: Map<string, { success: number; total: number }>): DailyProgressPoint[] {
  const points: DailyProgressPoint[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const key = day.toISOString().split('T')[0]
    const entry = groupedByDate.get(key)
    const completion = entry && entry.total > 0 ? Math.round((entry.success / entry.total) * 100) : 0
    points.push({ date: day.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), completion })
  }

  return points
}

function buildWeekdayData(logs: Array<LogRecord & { date: Date }>): WeekdayPoint[] {
  const counters = Array.from({ length: 7 }, () => ({ success: 0, total: 0 }))

  logs.forEach(log => {
    const dayIndex = log.date.getDay()
    counters[dayIndex].success += (log.value ?? 0) > 0 ? 1 : 0
    counters[dayIndex].total += 1
  })

  return counters.map((counter, index) => ({
    day: weekdayLabels[index],
    completion: counter.total === 0 ? 0 : Math.round((counter.success / counter.total) * 100),
  }))
}

function buildWeeklyData(logs: Array<LogRecord & { date: Date }>): WeeklyPoint[] {
  const weeklyMap = new Map<string, { success: number; total: number; date: Date }>()

  logs.forEach(log => {
    const isoKey = getWeekKey(log.date)
    const entry = weeklyMap.get(isoKey) || { success: 0, total: 0, date: log.date }
    weeklyMap.set(isoKey, {
      success: entry.success + ((log.value ?? 0) > 0 ? 1 : 0),
      total: entry.total + 1,
      date: entry.date,
    })
  })

  return Array.from(weeklyMap.entries())
    .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
    .map((entry, index) => ({
      week: `S${index + 1}`,
      completion: entry[1].total === 0 ? 0 : Math.round((entry[1].success / entry[1].total) * 100),
    }))
}

function buildTopHabits(
  habitStats: Map<string, { success: number; total: number }>,
  habitsMap: Map<string, HabitRecord>
): TopHabitPoint[] {
  return Array.from(habitStats.entries())
    .map(([habitId, stats]) => ({
      habit: habitsMap.get(habitId)?.name ?? 'Habitude inconnue',
      completion: stats.total === 0 ? 0 : Math.round((stats.success / stats.total) * 100),
    }))
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 5)
}

function buildCalendarData(groupedByDate: Map<string, { success: number; total: number }>): CalendarPoint[] {
  const today = new Date()
  const points: CalendarPoint[] = []

  for (let i = 364; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const key = day.toISOString().split('T')[0]
    const entry = groupedByDate.get(key)
    const completion = entry && entry.total > 0 ? Math.round((entry.success / entry.total) * 100) : 0
    points.push({ date: key, completion })
  }

  return points
}

function getWeekKey(date: Date) {
  const target = new Date(date.valueOf())
  target.setHours(0, 0, 0, 0)
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))
  const week1 = new Date(target.getFullYear(), 0, 4)
  return (
    target.getFullYear() +
    '-W' +
    (1 + Math.round(((target.valueOf() - week1.valueOf()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7))
  )
}

type StatCardProps = {
  label: string
  value: string
  icon: ReactNode
  accent: string
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center shadow-inner shadow-black/40">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}1f` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
