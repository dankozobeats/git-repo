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

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6">
          <Link
            href={`/habits/${habit.id}`}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Retour à l&apos;habitude
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            {habit.icon || (habit.type === 'bad' ? '🔥' : '✨')}
          </div>
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">Modifier</p>
            <h1 className="text-3xl font-bold">{habit.name}</h1>
          </div>
        </div>

        <HabitEditForm habit={habit} categories={categories || []} />
      </div>
    </main>
  )
}
