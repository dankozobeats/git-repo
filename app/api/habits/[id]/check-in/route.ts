import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const habitId = params.id
  const today = new Date().toISOString().split('T')[0]

  // Vérifier si déjà logué aujourd'hui
  const { data: existingLog } = await supabase
    .from('logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .eq('completed_date', today)
    .single()

  if (existingLog) {
    return NextResponse.json({ message: 'Déjà logué aujourd\'hui' })
  }

  // Créer le log
  const { error } = await supabase
    .from('logs')
    .insert({
      habit_id: habitId,
      user_id: user.id,
      completed_date: today,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
