import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    redirect('/auth/sign-in?error=missing_code')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    redirect('/auth/sign-in?error=callback')
  }

  // Sécurité : on force une route interne
  redirect(next.startsWith('/') ? next : '/dashboard')
}