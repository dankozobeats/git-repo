// Page Dashboard principale : agrège les habitudes et statistiques quotidiennes via Supabase.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getTodayDateISO } from '@/lib/date-utils'
import { getRandomMessage } from '@/lib/coach/roastMessages'
import type { Database } from '@/types/database'
import HabitSectionsClient from '@/components/HabitSectionsClient'
import ViewHabitsButton from '@/components/ViewHabitsButton'
import AICoachMessage from '@/components/AICoachMessage' // Design premium unifié pour tous les messages IA.

type CategoryRow = Database['public']['Tables']['categories']['Row']
type HabitRow = Database['public']['Tables']['habits']['Row'] & {
  current_streak?: number | null
  total_logs?: number | null
  total_craquages?: number | null
}
type CategoryStat = {
  id: string
  name: string
  color: string | null
  count: number
}
export default async function Home() {
  // Client Supabase serveur requis pour récupérer les données avant rendu.
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Charge les habitudes "bad" actives de l'utilisateur connecté.
  const { data: badHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'bad')
    .order('created_at', { ascending: false })

  // Charge également les habitudes "good" encore actives.
  const { data: goodHabits } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .eq('type', 'good')
    .order('created_at', { ascending: false })

  // Catégories de classement nécessaires pour les stats combinées.
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const today = getTodayDateISO()
  // Récupère les logs de la journée (mode classique).
  const { data: todayLogs } = await supabase
    .from('logs')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('completed_date', today)

  // Récupère les événements du mode compteur (multi-incréments).
  const { data: todayEvents } = await supabase
    .from('habit_events')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('event_date', today)

  const categoriesList = categories ?? []
  const safeBadHabits = badHabits ?? []
  const safeGoodHabits = goodHabits ?? []

  // Map interne [habitId -> nombre d'actions aujourd'hui] fusionnant logs et events.
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

  // Agrège toutes les habitudes actives pour construire les stats UI.
  const allActiveHabits = [...safeBadHabits, ...safeGoodHabits]
  const categoryStats = buildCategoryStats(categoriesList, allActiveHabits)
  const totalHabits = allActiveHabits.length
  const todayCountsRecord: Record<string, number> = Object.fromEntries(todayCounts)
  const generatedRoastMessage = getRandomMessage()

  // Génère un message contextuel selon l'activité du jour (utilisé dans la carte focus).
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

  // Prépare les textes dynamiques et préférences d'affichage stockées en cookies.
  const { message: generatedCoachMessage } = getSmartMessage()
  const heroSubtitle = hasActivityToday
    ? 'Les statistiques se mettent à jour immédiatement à chaque action.'
    : 'Commence par valider une habitude ou ajoute-en une nouvelle.'
  const cookieStore = await cookies()
  const showGoodHabits = cookieStore.get('showGoodHabits')?.value !== 'false'
  const showBadHabits = cookieStore.get('showBadHabits')?.value !== 'false'
  const showFocusCard = cookieStore.get('showFocusCard')?.value !== 'false'
  const showCoachBubble = cookieStore.get('showCoachBubble')?.value !== 'false'
  const showHabitDescriptions = cookieStore.get('showHabitDescriptions')?.value !== 'false'
  const heroStats = [
    { label: 'Bonnes actions', value: goodHabitsLoggedToday, accent: '#4DA6FF' },
    { label: 'Craquages', value: badHabitsLoggedToday, accent: '#FF4D4D' },
    { label: 'Habitudes actives', value: totalHabits, accent: '#E0E0E0' },
  ]

  // Section client centralisant la recherche, les toasts premium et l'affichage des habitudes.
  const habitDashboardSection = (
    <div id="active-habits-section">
      <HabitSectionsClient
        badHabits={safeBadHabits}
        goodHabits={safeGoodHabits}
        categories={categoriesList}
        todayCounts={todayCountsRecord}
        categoryStats={categoryStats}
        showBadHabits={showBadHabits}
        showGoodHabits={showGoodHabits}
        coachMessage={showCoachBubble ? generatedRoastMessage : undefined}
        showHabitDescriptions={showHabitDescriptions}
      />
    </div>
  )

  // Rend la page dashboard côté serveur en passant les données nécessaires au client.
  return (
    <main className="min-h-screen overflow-visible bg-[#0c0f1a] text-[#E0E0E0]">
      <div className="mx-auto max-w-5xl space-y-8 px-2 py-6 sm:px-4 md:px-10 md:py-10">
        {showFocusCard && (
          <section className="section-snap rounded-3xl border border-white/5 bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#151515] p-4 pt-10 pb-12 md:py-10 md:px-8" aria-live="polite">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Focus du jour</p>
              <AICoachMessage message={generatedCoachMessage} variant="default" showCTA />
              <p className="mt-2 text-sm text-[#A0A0A0]">{heroSubtitle}</p>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto">
              <Link
                href="/habits/new"
                className="rounded-2xl bg-[#FF4D4D] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#e04343]"
              >
                + Ajouter une habitude
              </Link>
              <ViewHabitsButton />
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
        )}

        {habitDashboardSection}

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
      </div>
    </main>
  )
}

// Combine les catégories et habitudes pour compter combien de routines par catégorie.
function buildCategoryStats(categories: CategoryRow[], habits: HabitRow[]): CategoryStat[] {
  const baseStats = new Map<string, CategoryStat>()

  // Pré-initialise chaque catégorie connue avec un compteur à 0.
  categories.forEach(category => {
    baseStats.set(category.id, {
      id: category.id,
      name: category.name,
      color: category.color,
      count: 0,
    })
  })

  // Incrémente les compteurs associés aux habitudes actives.
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
