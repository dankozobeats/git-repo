// Client Supabase côté navigateur (utilisé dans les composants client).
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Instancie le client SSR-friendly en utilisant les variables publiques.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
