import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HabitEditForm from '../HabitEditForm'
import { cookies } from 'next/headers'
import CategoryManager from '@/components/CategoryManager'

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

  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0]">
      <section className="bg-gradient-to-br from-[#1E1E1E] via-[#151515] to-[#0f0f0f] border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <Link
            href={`/habits/${habit.id}`}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
          >
            ← Retour à l&apos;habitude
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-inner"
              style={{ backgroundColor: `${habit.color}33` }}
            >
              {habit.icon || (habit.type === 'bad' ? '🔥' : '✨')}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A0A0]">Édition</p>
              <h1 className="text-3xl font-bold text-white">{habit.name}</h1>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <HabitEditForm habit={habit} categories={categories || []} />
      </div>
    </main>
  )
}
