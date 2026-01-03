'use client'

// Client component orchestrating all interactive widgets for a single habit view.
import { useState, type ReactNode } from 'react'
import HeroCard from './HeroCard'
import HabitCounter from './HabitCounter'
import { WeeklyCalendar } from '@/components/WeeklyCalendar'
import { DayReportModal } from '@/components/DayReportModal'
import GoalSettingsModal from './GoalSettingsModal'
import GamificationPanel from './GamificationPanel'
import HabitCoach from './HabitCoach'
import type { HabitCalendarMap, HabitStats } from '@/lib/habits/computeHabitStats'
import { useRouter } from 'next/navigation'

type Habit = {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  type: 'good' | 'bad'
  tracking_mode: 'binary' | 'counter' | null
  goal_value: number | null
  goal_type: 'daily' | 'weekly' | 'monthly' | null
  goal_description: string | null
  daily_goal_value: number | null
  daily_goal_type: 'minimum' | 'maximum' | null
}

type Props = {
  habit: Habit
  calendarData: HabitCalendarMap
  stats: HabitStats
}

export default function HabitDetailClient({ habit, calendarData, stats }: Props) {
  const router = useRouter()
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [count, setCount] = useState(stats.todayCount)
  const [isValidating, setIsValidating] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    focus: true,      // Ouvert par défaut
    stats: true,      // Ouvert par défaut
    gamification: false,
    coach: true,      // Ouvert par défaut
    calendar: true,   // Ouvert par défaut
    message: false,
  })

  const isBadHabit = habit.type === 'bad'
  const statColor = isBadHabit ? 'text-[#FF6B6B]' : 'text-[#5EEAD4]'
  const labelColor = isBadHabit ? 'text-[#FFB4A2]' : 'text-[#BAE6FD]'

  const dynamicCoachStats = {
    totalCount: stats.totalCount,
    last7DaysCount: stats.last7DaysCount,
    currentStreak: stats.currentStreak,
    todayCount: count,
    monthPercentage: stats.monthCompletionRate,
  }

  const getContextualMessage = () => {
    if (isBadHabit) {
      if (stats.currentStreak > 7) return 'Forte occurrence cette semaine, documente les déclencheurs.'
      if (stats.totalCount === 0) return 'Parfait, reste concentré sur les signaux faibles.'
      if (count === 0) return "Tu tiens bon aujourd'hui — verrouille cette énergie."
      return 'Identifie la prochaine tentation et prépare une parade.'
    }
    if (stats.currentStreak > 7) return 'Série solide, verrouille tes routines clés.'
    if (stats.last7DaysCount >= 5) return 'Très belle moyenne hebdo, conserve ta mécanique.'
    if (count === 0) return 'Commence par une action minimale pour enclencher la journée.'
    return 'Chaque validation te rapproche de la version attendue de toi-même.'
  }

  const sectionCard =
    'rounded-[28px] border border-white/10 bg-white/[0.02] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur'

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleQuickValidate = async () => {
    setIsValidating(true)
    try {
      const res = await fetch(`/api/habits/${habit.id}/check-in`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Validation failed')

      const data = await res.json()
      const newCount = typeof data.count === 'number' ? data.count : count + 1
      setCount(newCount)
      router.refresh()
    } catch (error) {
      console.error('Erreur validation:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const sections = [
    {
      id: 'focus',
      title: 'Focus du jour',
      subtitle: 'Action immédiate',
      content: (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Focus du jour</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Action immédiate</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-1 text-xs font-semibold text-white/70">
                {habit.tracking_mode === 'counter' ? 'Mode compteur' : 'Mode simple'}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold text-white/80 transition hover:border-white/60"
                onClick={() => setIsGoalModalOpen(true)}
              >
                🎯 Ajuster l&apos;objectif
              </button>
            </div>
          </div>

          <div
            className={`flex flex-col gap-4 rounded-3xl border px-5 py-4 sm:px-7 sm:py-6 ${isBadHabit ? 'border-[#FF6B6B]/40 bg-[#1A0E11]' : 'border-[#5EEAD4]/30 bg-[#0D1B1E]'
              }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Statut</p>
                <p className={`mt-2 text-3xl font-semibold ${isBadHabit ? 'text-[#FF6B6B]' : 'text-[#5EEAD4]'}`}>
                  {isBadHabit
                    ? count > 0
                      ? `${count} craquage${count > 1 ? 's' : ''}`
                      : 'Aucun craquage'
                    : count > 0
                      ? 'Habitude validée'
                      : 'En attente'}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {isBadHabit
                    ? count > 0
                      ? 'Note rapidement le contexte pour identifier tes leviers de contrôle.'
                      : 'Status clean pour le moment, garde cette vigilance.'
                    : count > 0
                      ? 'Momentum enclenché, verrouille ta progression par une répétition bonus.'
                      : 'Une micro-action suffit pour basculer dans le camp des disciplinés.'}
                </p>
              </div>
              <span
                className={`inline-flex items-center justify-center rounded-full border px-4 py-1 text-xs font-semibold ${count > 0
                  ? isBadHabit
                    ? 'border-[#FF6B6B] text-[#FF6B6B]'
                    : 'border-[#5EEAD4] text-[#5EEAD4]'
                  : 'border-white/20 text-white/60'
                  }`}
              >
                {count > 0 ? (isBadHabit ? 'Craquage détecté' : 'Validée') : 'À lancer'}
              </span>
            </div>
            <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Streak</p>
                <p className={`mt-1 text-2xl font-semibold ${statColor}`}>{stats.currentStreak} j</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Moy. 7j</p>
                <p className={`mt-1 text-2xl font-semibold ${labelColor}`}>{stats.last7DaysCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Ce mois</p>
                <p className="mt-1 text-2xl font-semibold text-white">{stats.monthCompletionRate}%</p>
              </div>
            </div>
          </div>

          <HabitCounter
            habitId={habit.id}
            habitType={habit.type}
            trackingMode={habit.tracking_mode || 'binary'}
            goalValue={habit.goal_value}
            goalType={habit.goal_type}
            todayCount={count}
            onCountChange={setCount}
            habitName={habit.name}
            streak={stats.currentStreak}
            totalLogs={stats.totalCount}
            totalCraquages={isBadHabit ? stats.totalCount : 0}
          />
        </div>
      ),
    },
    {
      id: 'stats',
      title: 'Statistiques clés',
      subtitle: `Performance · fenêtre ${stats.rangeInDays}j`,
      content: (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total période', value: stats.totalCount, accent: statColor },
            { label: '7 derniers jours', value: stats.last7DaysCount, accent: labelColor },
            { label: 'Streak actif', value: stats.currentStreak, accent: 'text-[#FDE68A]' },
            { label: 'Focus jour', value: count, accent: 'text-[#C4B5FD]' },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-center shadow-inner shadow-black/40"
            >
              <p className={`text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
              <p className="mt-2 text-xs tracking-wide text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'gamification',
      title: 'Progression & badges',
      subtitle: 'Gamification',
      content: (
        <GamificationPanel
          habit={habit}
          calendarData={calendarData}
          totalCount={stats.totalCount}
          last7DaysCount={stats.last7DaysCount}
          currentStreak={stats.currentStreak}
        />
      ),
    },
    {
      id: 'coach',
      title: 'Coach personnalisé',
      subtitle: 'Recommandations IA',
      content: <HabitCoach habitId={habit.id} stats={dynamicCoachStats} />,
    },
    {
      id: 'calendar',
      title: 'Calendrier hebdomadaire',
      subtitle: 'Semaine en un coup d’œil',
      content: (
        <WeeklyCalendar
          habitType={habit.type}
          calendarData={calendarData}
          trackingMode={habit.tracking_mode ?? 'binary'}
          onDayClick={date => setSelectedDate(date)}
        />
      ),
    },
    {
      id: 'message',
      title: 'Message du jour',
      subtitle: 'Contexte rapide',
      content: (
        <div
          className={`rounded-[24px] border p-6 text-center shadow-lg ${isBadHabit ? 'border-[#FF6B6B]/40 bg-[#1A0E11]' : 'border-[#5EEAD4]/30 bg-[#0D1B1E]'
            }`}
        >
          <p className="text-base text-white/90">&ldquo;{getContextualMessage()}&rdquo;</p>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Hero Card - Always Visible */}
      <HeroCard
        habit={habit}
        stats={{
          currentStreak: stats.currentStreak,
          todayCount: count,
          last7DaysCount: stats.last7DaysCount,
          monthCompletionRate: stats.monthCompletionRate,
        }}
        onValidate={handleQuickValidate}
        isValidating={isValidating}
      />

      <div className="space-y-6 mt-6">
        {sections.map(section => (
          <CollapsibleCard
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            open={openSections[section.id]}
            onToggle={() => toggleSection(section.id)}
            className={section.id === 'focus' || section.id === 'calendar' ? sectionCard : undefined}
          >
            {section.content}
          </CollapsibleCard>
        ))}
      </div>

      <GoalSettingsModal
        habitId={habit.id}
        currentGoal={{
          goal_value: habit.goal_value,
          goal_type: habit.goal_type,
          goal_description: habit.goal_description,
        }}
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />

      <DayReportModal date={selectedDate || ''} isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} />
    </>
  )
}

function CollapsibleCard({
  title,
  subtitle,
  open,
  onToggle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${className || ''} space-y-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-white/30"
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">{subtitle}</p>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xl font-bold text-white/80">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </section>
  )
}
