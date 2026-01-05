import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HabitFormClient from '@/components/habits/HabitFormClient'

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
    <HabitFormClient
      mode="edit"
      initialHabit={{
        ...habit,
        type: habit.type as 'good' | 'bad',
      }}
      categories={categories || []}
    />
  )
}
