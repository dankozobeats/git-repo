import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Supprime d'abord tous les logs associés
  await supabase
    .from('logs')
    .delete()
    .eq('habit_id', id)
    .eq('user_id', user.id)

  // Puis supprime l'habitude
  await supabase
    .from('habits')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/')
  redirect('/')
}