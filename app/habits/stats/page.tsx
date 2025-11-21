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

  const groupedCompletions = new Map<string, Set<string>>()
  const habitCompletionDates = new Map<string, Set<string>>()

  data.habits.forEach(habit => {
    habitCompletionDates.set(habit.id, new Set())
  })

  logsWithDate.forEach(log => {
    if ((log.value ?? 0) > 0) {
      const dateKey = log.date.toISOString().split('T')[0]
      if (!groupedCompletions.has(dateKey)) {
        groupedCompletions.set(dateKey, new Set())
      }
      groupedCompletions.get(dateKey)!.add(log.habit_id)

      if (!habitCompletionDates.has(log.habit_id)) {
        habitCompletionDates.set(log.habit_id, new Set())
      }
      habitCompletionDates.get(log.habit_id)!.add(dateKey)
    }
  })

  const totalHabits = data.habits.length
  const analysisDays = 365
  const totalLogs = logsWithDate.length

  const daily = buildDailyData(groupedCompletions, totalHabits)
  const weekday = buildWeekdayData(groupedCompletions, totalHabits)
  const weekly = buildWeeklyData(groupedCompletions, totalHabits)
  const topHabits = buildTopHabits(habitCompletionDates, habitsMap, analysisDays)
  const calendar = buildCalendarData(groupedCompletions, totalHabits)
  const averageCompletion = daily.length
    ? Math.round(daily.reduce((sum, point) => sum + point.completion, 0) / daily.length)
    : 0

  return {
    daily,
    weekday,
    weekly,
    topHabits,
    calendar,
    summary: {
      totalLogs,
      totalHabits: data.habits.length,
      completion: averageCompletion,
    },
  }
}

function buildDailyData(completions: Map<string, Set<string>>, totalHabits: number): DailyProgressPoint[] {
  const points: DailyProgressPoint[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const key = getDateKey(day)
    const completion = calculateCompletionPercentage(completions, totalHabits, key)
    points.push({ date: day.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), completion })
  }

  return points
}

function buildWeekdayData(completions: Map<string, Set<string>>, totalHabits: number): WeekdayPoint[] {
  const counters = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }))
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const key = getDateKey(day)
    const completion = calculateCompletionPercentage(completions, totalHabits, key)
    const index = day.getDay()
    counters[index].sum += completion
    counters[index].count += 1
  }

  return counters.map((counter, index) => ({
    day: weekdayLabels[index],
    completion: counter.count === 0 ? 0 : Math.round(counter.sum / counter.count),
  }))
}

function buildWeeklyData(completions: Map<string, Set<string>>, totalHabits: number): WeeklyPoint[] {
  const today = new Date()
  const weeklyAggregates = new Map<string, { sum: number; count: number; reference: Date }>()

  for (let i = 0; i < 84; i++) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const weekKey = getWeekKey(day)
    const completion = calculateCompletionPercentage(completions, totalHabits, getDateKey(day))
    const entry = weeklyAggregates.get(weekKey) || { sum: 0, count: 0, reference: day }
    entry.sum += completion
    entry.count += 1
    weeklyAggregates.set(weekKey, entry)
  }

  const ordered = Array.from(weeklyAggregates.entries()).sort(
    (a, b) => a[1].reference.getTime() - b[1].reference.getTime()
  )

  return ordered.map((entry, index) => ({
    week: `S${index + 1}`,
    completion: entry[1].count === 0 ? 0 : Math.round(entry[1].sum / entry[1].count),
  }))
}

function buildTopHabits(
  habitCompletionDates: Map<string, Set<string>>,
  habitsMap: Map<string, HabitRecord>,
  analysisDays: number
): TopHabitPoint[] {
  const safeDays = Math.max(1, analysisDays)

  return Array.from(habitCompletionDates.entries())
    .map(([habitId, dates]) => ({
      habit: habitsMap.get(habitId)?.name ?? 'Habitude inconnue',
      completion: Math.round(((dates?.size ?? 0) / safeDays) * 100),
    }))
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 5)
}

function buildCalendarData(completions: Map<string, Set<string>>, totalHabits: number): CalendarPoint[] {
  const today = new Date()
  const points: CalendarPoint[] = []

  for (let i = 364; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const key = getDateKey(day)
    const completion = calculateCompletionPercentage(completions, totalHabits, key)
    points.push({ date: key, completion })
  }

  return points
}

function calculateCompletionPercentage(completions: Map<string, Set<string>>, totalHabits: number, dateKey: string) {
  if (totalHabits === 0) return 0
  const completed = completions.get(dateKey)?.size ?? 0
  return Math.round((completed / totalHabits) * 100)
}

function getDateKey(date: Date) {
  return date.toISOString().split('T')[0]
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
