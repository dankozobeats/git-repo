import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (!code) {
    return redirect('/auth/sign-in?error=missing_code')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirect('/auth/sign-in?error=callback')
  }

  return redirect(next.startsWith('/') ? next : origin)
}
