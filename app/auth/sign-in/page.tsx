import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  searchParams: { error?: string }
}

async function signInAction(formData: FormData) {
  'use server'

  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  if (!email || !password) {
    redirect('/auth/sign-in?error=missing_credentials')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/')
}

export default function SignInPage({ searchParams }: PageProps) {
  const errorMessage = searchParams.error
    ? decodeURIComponent(searchParams.error.replace(/\+/g, ' '))
    : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-[#11131c] p-6 text-white shadow-2xl shadow-black/40">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-sm text-white/60">Reprends ta progression en un clic.</p>
        </div>
        {errorMessage && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{errorMessage}</p>
        )}
        <form action={signInAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs uppercase tracking-[0.3em] text-white/60">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm focus:border-white/60 focus:outline-none"
              placeholder="email@exemple.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs uppercase tracking-[0.3em] text-white/60">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm focus:border-white/60 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Se connecter
          </button>
        </form>
        <div className="text-center text-sm text-white/60">
          <Link href="/auth/reset" className="text-white underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <p className="text-center text-xs text-white/60">
          Pas encore de compte ?{' '}
          <Link href="/auth/sign-up" className="font-semibold text-white">
            Inscription
          </Link>
        </p>
      </div>
    </main>
  )
}
