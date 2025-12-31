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
            // En cas d'erreur lors de la mise à jour des cookies (souvent en read-only mode)
            // on log mais on ne bloque pas l'application
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Supabase] Cookie set error (expected in some contexts):', error);
            }
          }
        },
      },
    }
  )
}
