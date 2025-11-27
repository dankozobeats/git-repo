import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HabitEditForm from '../HabitEditForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function HabitEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: habit, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !habit) {
    redirect('/')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  const statusLabel = habit.is_archived ? 'Habitude suspendue' : 'Habitude active'

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#05070f] via-[#080b16] to-[#0f172a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        <header className="rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
                style={{ backgroundColor: `${habit.color}33` }}
              >
                {habit.icon || (habit.type === 'bad' ? '🔥' : '✨')}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">Édition</p>
                <h1 className="text-3xl font-semibold text-white">{habit.name}</h1>
                <p className="text-sm text-white/60">{statusLabel}</p>
              </div>
            </div>
            <Link
              href={`/habits/${habit.id}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              Retour à l’habitude
            </Link>
          </div>
        </header>

        <HabitEditForm habit={habit} categories={categories || []} />
      </div>
    </main>
  )
}
