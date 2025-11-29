// Page serveur de détail d'une habitude : récupère les logs et statistiques associés.
// Server component powering the habit detail page with streamlined data access.
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import HabitDetailClient from './HabitDetailClient'
import DeleteButton from './DeleteButton'
import HabitDetailHeader from '@/components/HabitDetailHeader'
import PushEnableButton from '@/components/PushEnableButton'
import CreateReminderButton from '@/components/CreateReminderButton'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateISO } from '@/lib/date-utils'
import { getHabitById } from '@/lib/habits/getHabitById'
import { getHabitCalendar } from '@/lib/habits/getHabitCalendar'
import { computeHabitStats } from '@/lib/habits/computeHabitStats'
import { getUserHabits } from '@/lib/habits/getUserHabits'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HabitDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const habitPromise = getHabitById({
    client: supabase,
    habitId: id,
    userId: user.id,
  })
  const navigationHabitsPromise = getUserHabits({
    client: supabase,
    userId: user.id,
  })

  const habit = await habitPromise
  if (!habit) {
    notFound()
  }

  const todayISO = getTodayDateISO()
  const { calendarData, todayCount } = await getHabitCalendar({
    client: supabase,
    habitId: id,
    trackingMode: habit.tracking_mode,
    todayISO,
    rangeInDays: 28,
  })

  const stats = computeHabitStats({
    calendarData,
    todayISO,
    todayCount,
    rangeInDays: 28,
  })

  const userHabits = await navigationHabitsPromise
  const navigationHabits =
    userHabits.find(existingHabit => existingHabit.id === habit.id) !== undefined
      ? userHabits
      : [habit, ...userHabits]

  const isBadHabit = habit.type === 'bad'
  const badgeColor = isBadHabit ? 'text-[#FF5F5F] border-[#FF5F5F]/50' : 'text-[#4DD0FB] border-[#4DD0FB]/50'

  return (
    <main className="min-h-screen bg-[#050505] text-[#F8FAFC]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
        >
          <span aria-hidden>←</span>
          Retour au dashboard
        </Link>

        <HabitDetailHeader habit={habit} allHabits={navigationHabits} />

        import PushEnableButton from '@/components/PushEnableButton'
        import CreateReminderButton from '@/components/CreateReminderButton'

        // ... existing imports ...

        // Inside the component return, before HabitDetailClient:

        <section className="rounded-[32px] border border-white/8 bg-white/[0.02] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.4)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-start gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 text-3xl shadow-inner shadow-black/30 sm:h-20 sm:w-20 sm:text-4xl"
                style={{ backgroundColor: `${habit.color || '#1F2937'}1a` }}
              >
                {habit.icon || (isBadHabit ? '🔥' : '✨')}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/60">
                    Habitude
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
                    {isBadHabit ? 'Mauvaise habitude' : 'Bonne habitude'}
                  </span>
                  {habit.tracking_mode === 'counter' && (
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/80">
                      Compteur · {habit.daily_goal_type === 'minimum' ? 'Min' : 'Max'} {habit.daily_goal_value ?? 0}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{habit.name}</h1>
                  {habit.description && (
                    <p className="mt-2 max-w-2xl text-sm text-white/70">{habit.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Link
                href={`/habits/${habit.id}/edit`}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                ✏️ Modifier
              </Link>
              <DeleteButton habitId={habit.id} habitName={habit.name} />
            </div>
          </div>
        </section>

        {/* Section Rappels */}
        <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">🔔 Rappels & Notifications</h2>
          <div className="flex flex-wrap items-center gap-4">
            <PushEnableButton userId={user.id} />
            <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <CreateReminderButton habitId={habit.id} userId={user.id} />
          </div>
        </section>

        <HabitDetailClient habit={habit} calendarData={calendarData} stats={stats} />
      </div>
    </main>
  )
}
