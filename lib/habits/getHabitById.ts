// Utility centralizing the secure retrieval of a single habit for the authenticated user.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type HabitRow = Database['public']['Tables']['habits']['Row']
type SupabaseServerClient = SupabaseClient<Database>

type GetHabitByIdParams = {
  client: SupabaseServerClient
  habitId: string
  userId: string
}

export async function getHabitById({
  client,
  habitId,
  userId,
}: GetHabitByIdParams): Promise<HabitRow | null> {
  const { data, error } = await client
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', userId)
    .single()

  if (error) {
    return null
  }

  return data as HabitRow
}
