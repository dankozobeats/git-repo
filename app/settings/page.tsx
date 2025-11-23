import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const DASHBOARD_ORDER_COOKIE = 'dashboardOrder'
const SHOW_GOOD_COOKIE = 'showGoodHabits'
const SHOW_BAD_COOKIE = 'showBadHabits'
const SHOW_FOCUS_COOKIE = 'showFocusCard'
const SHOW_COACH_COOKIE = 'showCoachBubble'

const updateDashboardPreferences = async (formData: FormData) => {
  'use server'
  const order = formData.get('dashboardOrder') === 'good-first' ? 'good-first' : 'bad-first'
  const showGood = formData.get('showGoodHabits') === 'on'
  const showBad = formData.get('showBadHabits') === 'on'
  const showFocus = formData.get('showFocusCard') === 'on'
  const showCoach = formData.get('showCoachBubble') === 'on'

  const cookieStore = await cookies()
  cookieStore.set(DASHBOARD_ORDER_COOKIE, order, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  cookieStore.set(SHOW_GOOD_COOKIE, showGood ? 'true' : 'false', { path: '/', maxAge: 60 * 60 * 24 * 365 })
  cookieStore.set(SHOW_BAD_COOKIE, showBad ? 'true' : 'false', { path: '/', maxAge: 60 * 60 * 24 * 365 })
  cookieStore.set(SHOW_FOCUS_COOKIE, showFocus ? 'true' : 'false', { path: '/', maxAge: 60 * 60 * 24 * 365 })
  cookieStore.set(SHOW_COACH_COOKIE, showCoach ? 'true' : 'false', { path: '/', maxAge: 60 * 60 * 24 * 365 })
  revalidatePath('/')
  revalidatePath('/settings')
  redirect('/')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const currentOrder = cookieStore.get(DASHBOARD_ORDER_COOKIE)?.value === 'good-first' ? 'good-first' : 'bad-first'
  const showGood = cookieStore.get(SHOW_GOOD_COOKIE)?.value !== 'false'
  const showBad = cookieStore.get(SHOW_BAD_COOKIE)?.value !== 'false'
  const showFocus = cookieStore.get(SHOW_FOCUS_COOKIE)?.value !== 'false'
  const showCoach = cookieStore.get(SHOW_COACH_COOKIE)?.value !== 'false'

  return (
    <main className="min-h-screen bg-[#0c0f1a] text-[#E0E0E0]">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 md:px-10 md:py-10">
        <div className="rounded-3xl border border-white/10 bg-[#111623]/80 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Préférences</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Paramètres d’affichage</h1>
          <p className="mt-2 text-sm text-white/60">
            Ajuste la façon dont le tableau de bord organise tes habitudes. Chaque modification s’applique instantanément
            sur tes prochaines visites.
          </p>

          <form action={updateDashboardPreferences} className="mt-8 space-y-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  Dashboard
                </span>
                <p className="text-sm text-white/60">Ordre d’affichage des sections</p>
              </div>
              <p className="mt-2 text-base font-semibold text-white">Position des catégories</p>
              <p className="text-sm text-white/60">
                Choisis si tu veux voir les bonnes habitudes en premier ou garder les mauvaises en haut pour les traiter
                en priorité.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="group cursor-pointer">
                  <input
                    type="radio"
                    name="dashboardOrder"
                    value="bad-first"
                    defaultChecked={currentOrder === 'bad-first'}
                    className="peer sr-only"
                  />
                  <div className="flex flex-col rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition group-hover:border-white/30 peer-checked:border-white/40 peer-checked:bg-white/5 peer-checked:shadow-[0_12px_45px_rgba(0,0,0,0.45)]">
                    <span className="text-sm font-semibold text-white">Mauvaises habitudes en premier</span>
                    <span className="text-xs text-white/50">Feu rouge en haut pour traiter les craquages en priorité.</span>
                  </div>
                </label>

                <label className="group cursor-pointer">
                  <input
                    type="radio"
                    name="dashboardOrder"
                    value="good-first"
                    defaultChecked={currentOrder === 'good-first'}
                    className="peer sr-only"
                  />
                  <div className="flex flex-col rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition group-hover:border-white/30 peer-checked:border-white/40 peer-checked:bg-white/5 peer-checked:shadow-[0_12px_45px_rgba(0,0,0,0.45)]">
                    <span className="text-sm font-semibold text-white">Bonnes habitudes en premier</span>
                    <span className="text-xs text-white/50">Commence par les wins avant de gérer les craquages.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <PreferenceToggle
                id="showGoodHabits"
                label="Afficher les bonnes habitudes"
                description="Affiche la section dédiée aux wins."
                defaultChecked={showGood}
              />
              <PreferenceToggle
                id="showBadHabits"
                label="Afficher les mauvaises habitudes"
                description="Garde un œil sur tes craquages."
                defaultChecked={showBad}
              />
              <PreferenceToggle
                id="showFocusCard"
                label="Afficher le focus du jour"
                description="Montre la bannière de motivation contextuelle."
                defaultChecked={showFocus}
              />
              <PreferenceToggle
                id="showCoachBubble"
                label="Bulles Coach Roast"
                description="Active ou coupe les messages sarcastiques."
                defaultChecked={showCoach}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-[#4DA6FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f8fd9]"
              >
                Enregistrer mes préférences
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

function PreferenceToggle({
  id,
  label,
  description,
  defaultChecked,
}: {
  id: string
  label: string
  description: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:border-white/30">
      <input type="checkbox" id={id} name={id} defaultChecked={defaultChecked} className="mt-1.5 h-4 w-4 rounded border-white/30 bg-black/50 text-[#4DA6FF]" />
      <div>
        <span className="text-sm font-semibold text-white">{label}</span>
        <p className="text-xs text-white/60">{description}</p>
      </div>
    </label>
  )
}
