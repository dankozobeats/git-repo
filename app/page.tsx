import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTodayDateISO } from '@/lib/date-utils'
import { getRandomMessage } from '@/lib/coach/roastMessages'
import CategoryManager from '@/components/CategoryManager'
import type { Database } from '@/types/database'
import HabitSectionsClient from '@/components/HabitSectionsClient'

type CategoryRow = Database['public']['Tables']['categories']['Row']
type HabitRow = Database['public']['Tables']['habits']['Row'] & {
  current_streak?: number | null
  total_logs?: number | null
  total_craquages?: number | null
}
type HabitGroup = {
  category: CategoryRow | null
  habits: HabitRow[]
}
type CategoryStat = {
  id: string
  name: string
  color: string | null
  count: number
}
export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: badHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'bad')
    .order('created_at', { ascending: false })

  const { data: goodHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'good')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const today = getTodayDateISO()
  const { data: todayLogs } = await supabase
    .from('logs')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('completed_date', today)

  const { data: todayEvents } = await supabase
    .from('habit_events')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('event_date', today)

  const categoriesList = categories ?? []
  const categoriesMap = new Map<string, CategoryRow>(
    categoriesList.map(category => [category.id, category])
  )
  const safeBadHabits = badHabits ?? []
  const safeGoodHabits = goodHabits ?? []

  const todayCounts = new Map<string, number>()
  ;(todayLogs || []).forEach(log => {
    todayCounts.set(log.habit_id, 1)
  })
  ;(todayEvents || []).forEach(event => {
    todayCounts.set(event.habit_id, (todayCounts.get(event.habit_id) || 0) + 1)
  })

  const badHabitsLoggedToday =
    safeBadHabits.filter(habit => (todayCounts.get(habit.id) ?? 0) > 0).length || 0
  const goodHabitsLoggedToday =
    safeGoodHabits.filter(habit => (todayCounts.get(habit.id) ?? 0) > 0).length || 0
  const hasActivityToday = badHabitsLoggedToday + goodHabitsLoggedToday > 0

  const getCategoryMeta = (categoryId: string | null): CategoryRow | null => {
    if (!categoryId) return null
    return categoriesMap.get(categoryId) ?? null
  }

  const groupByCategory = (habitsList: HabitRow[]): HabitGroup[] => {
    const map = new Map<string, HabitGroup>()

    habitsList.forEach(habit => {
      const key = habit.category_id ?? 'uncategorized'
      if (!map.has(key)) {
        map.set(key, {
          category: getCategoryMeta(habit.category_id ?? null),
          habits: [],
        })
      }
      map.get(key)!.habits.push(habit)
    })

    return Array.from(map.values()).sort((a, b) =>
      (a.category?.name || 'Sans catégorie').localeCompare(b.category?.name || 'Sans catégorie')
    )
  }

  const groupedBadHabits = groupByCategory(safeBadHabits)
  const groupedGoodHabits = groupByCategory(safeGoodHabits)
  const allActiveHabits = [...safeBadHabits, ...safeGoodHabits]
  const categoryStats = buildCategoryStats(categoriesList, allActiveHabits)
  const totalHabits = allActiveHabits.length
  const todayCountsRecord: Record<string, number> = Object.fromEntries(todayCounts)
  const randomRoastBanner = getRandomMessage()

  const getSmartMessage = () => {
    const totalToday = badHabitsLoggedToday + goodHabitsLoggedToday

    if (totalToday === 0) {
      return {
        message: "Journée tranquille... ou tu oublies de logger ? 🤔",
      }
    }

    if (badHabitsLoggedToday > 0 && goodHabitsLoggedToday === 0) {
      if (badHabitsLoggedToday === 1) {
        return {
          message: 'Un petit craquage. Ça arrive, champion. 😏',
        }
      } else if (badHabitsLoggedToday === 2) {
        return {
          message: '2 craquages... Tu commences à prendre un rythme là. 🔥',
        }
      } else if (badHabitsLoggedToday >= 3 && badHabitsLoggedToday < 5) {
        return {
          message: `${badHabitsLoggedToday} craquages ! La constance dans la médiocrité, respect. 💀`,
        }
      }
      return {
        message: `${badHabitsLoggedToday} craquages ! Tu bats des records là. Impressionnant. 🏆`,
      }
    }

    if (goodHabitsLoggedToday > 0 && badHabitsLoggedToday === 0) {
      if (goodHabitsLoggedToday === 1) {
        return {
          message: 'Une bonne action ! C\'est déjà ça. Continue. 💪',
        }
      } else if (goodHabitsLoggedToday === 2) {
        return {
          message: '2 bonnes actions ! Tu prends ça au sérieux aujourd\'hui. ✨',
        }
      } else if (goodHabitsLoggedToday >= 3 && goodHabitsLoggedToday < 5) {
        return {
          message: `${goodHabitsLoggedToday} bonnes actions ! Regarde-toi tout motivé ! 🔥`,
        }
      }
      return {
        message: `${goodHabitsLoggedToday} bonnes actions ! Tu es en feu aujourd'hui ! 🎯`,
      }
    }

    const ratio = goodHabitsLoggedToday / (badHabitsLoggedToday + goodHabitsLoggedToday)

    if (ratio > 0.7) {
      return {
        message: 'Plus de bonnes que de mauvaises ! C\'est l\'idée. Continue. ⚖️',
      }
    }

    if (ratio >= 0.4 && ratio <= 0.7) {
      return {
        message: 'Bon... du bon ET du mauvais. Tu es humain finalement. 🤷',
      }
    }

    return {
      message: 'Plus de craquages que de bonnes actions... Intéressant. 😅',
    }
  }

  const { message: displayMessage } = getSmartMessage()
  const heroSubtitle = hasActivityToday
    ? 'Les statistiques se mettent à jour immédiatement à chaque action.'
    : 'Commence par valider une habitude ou ajoute-en une nouvelle.'
  const avatarInitial = (user.email?.charAt(0) || 'U').toUpperCase()
  const heroStats = [
    { label: 'Bonnes actions', value: goodHabitsLoggedToday, accent: '#4DA6FF' },
    { label: 'Craquages', value: badHabitsLoggedToday, accent: '#FF4D4D' },
    { label: 'Habitudes actives', value: totalHabits, accent: '#E0E0E0' },
  ]

  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0]">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 space-y-8">
        <header className="rounded-3xl border border-white/5 bg-[#1E1E1E]/70 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4DA6FF] text-2xl font-semibold text-white">
                {avatarInitial}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Tableau de bord</p>
                <h1 className="text-3xl font-bold text-white">BadHabit Tracker 🔥</h1>
                <p className="text-sm text-[#A0A0A0]">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Link
                href="/report"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-[#E0E0E0] transition hover:border-white/30 hover:text-white"
              >
                📈 Rapport
              </Link>
              <form action="/auth/signout" method="post">
                <button className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-[#E0E0E0] transition hover:border-white/30 hover:text-white">
                  Déconnexion
                </button>
              </form>
              <Link
                href="/habits/new"
                className="rounded-xl bg-[#FF4D4D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e04343]"
              >
                + Nouvelle
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-[#FF4D4D]/40 bg-[#1F1414]/70 p-6 shadow-lg shadow-black/30">
          <p className="text-xs uppercase tracking-[0.3em] text-[#FF9C9C]">Coach Roast</p>
          <p className="mt-3 text-lg font-semibold text-white">{randomRoastBanner}</p>
        </section>

        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#151515] p-6 md:p-8" aria-live="polite">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Focus du jour</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{displayMessage}</h2>
              <p className="mt-2 text-sm text-[#A0A0A0]">{heroSubtitle}</p>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto">
              <Link
                href="/habits/new"
                className="rounded-2xl bg-[#FF4D4D] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#e04343]"
              >
                + Ajouter une habitude
              </Link>
              <Link
                href="/"
                className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-[#E0E0E0] transition hover:border-white/30 hover:text-white"
              >
                Voir les habitudes actives
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {heroStats.map(stat => (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-black/20 px-4 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold" style={{ color: stat.accent }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <CategoryOverview stats={categoryStats} />

        <HabitSectionsClient
          badHabits={groupedBadHabits}
          goodHabits={groupedGoodHabits}
          todayCounts={todayCountsRecord}
        />

        {totalHabits === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#1E1E1E]/60 p-8 text-center">
            <p className="text-lg font-semibold text-white">Commence par créer une habitude</p>
            <p className="mt-2 text-sm text-[#A0A0A0]">
              Choisis un objectif clair ou une mauvaise habitude à surveiller.
            </p>
            <Link
              href="/habits/new"
              className="mt-4 inline-block rounded-2xl bg-[#FF4D4D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e04343]"
            >
              Créer ma première habitude
            </Link>
          </div>
        )}

        <div className="rounded-3xl border border-white/5 bg-[#1E1E1E]/60 p-6">
          <CategoryManager />
        </div>
      </div>
    </main>
  )
}

function buildCategoryStats(categories: CategoryRow[], habits: HabitRow[]): CategoryStat[] {
  const baseStats = new Map<string, CategoryStat>()

  categories.forEach(category => {
    baseStats.set(category.id, {
      id: category.id,
      name: category.name,
      color: category.color,
      count: 0,
    })
  })

  habits.forEach(habit => {
    const categoryId = habit.category_id
    if (categoryId && baseStats.has(categoryId)) {
      baseStats.get(categoryId)!.count += 1
    } else if (categoryId) {
      baseStats.set(categoryId, {
        id: categoryId,
        name: 'Catégorie inconnue',
        color: habit.color,
        count: 1,
      })
    } else {
      const existing = baseStats.get('uncategorized')
      if (existing) {
        existing.count += 1
      } else {
        baseStats.set('uncategorized', {
          id: 'uncategorized',
          name: 'Sans catégorie',
          color: null,
          count: 1,
        })
      }
    }
  })

  return Array.from(baseStats.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function CategoryOverview({ stats }: { stats: CategoryStat[] }) {
  return (
    <section className="rounded-3xl border border-white/5 bg-[#1E1E1E]/60 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Catégories</p>
          <h2 className="text-2xl font-semibold text-white">Organisation des habitudes</h2>
        </div>
        <span className="text-sm text-[#A0A0A0]">
          {stats.length > 0 ? `${stats.length} catégorie${stats.length > 1 ? 's' : ''}` : 'Aucune catégorie'}
        </span>
      </div>

      {stats.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-[#A0A0A0]">
          Pas encore de catégories personnalisées. Utilise le module plus bas pour en créer.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {stats.map(stat => (
            <article key={stat.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stat.color || '#6b7280' }} />
                <span className="text-sm font-medium text-white">{stat.name}</span>
              </div>
              <span className="text-xs text-[#A0A0A0]">
                {stat.count} habitude{stat.count > 1 ? 's' : ''}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
