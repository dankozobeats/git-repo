// Utility that lists active habits for navigation and header context.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type HabitRow = Database['public']['Tables']['habits']['Row']
type SupabaseServerClient = SupabaseClient<Database>

type GetUserHabitsParams = {
  client: SupabaseServerClient
  userId: string
}

export async function getUserHabits({ client, userId }: GetUserHabitsParams): Promise<HabitRow[]> {
  const { data, error } = await client
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('name', { ascending: true })

  if (error || !data) {
    return [] as HabitRow[]
  }

  return data as HabitRow[]
}
