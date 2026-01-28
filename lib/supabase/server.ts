// Client Supabase côté serveur pour les routes/app RSC avec gestion des cookies.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // Configure Supabase avec des handlers cookie compatibles Next App Router.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Dans Next.js App Router, on ne peut pas modifier les cookies dans les RSC.
            // Cette erreur est attendue et gérée par @supabase/ssr.
            // On ne loggue que si ce n'est pas l'erreur spécifique de "Server Action/Route Handler"
            // ou si on est vraiment en train de débugger quelque chose de complexe.
          }
        },
      },
    }
  )
}
