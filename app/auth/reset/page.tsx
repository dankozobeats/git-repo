import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

async function resetAction(_: FormState, formData: FormData): Promise<FormState> {
  'use server'

  const email = formData.get('email')?.toString().trim() ?? ''

  if (!email) {
    return { error: 'Email requis.' }
  }

  const supabase = await createClient()
  const redirectTo =
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Un email de réinitialisation vient de t’être envoyé.' }
}

export default function ResetPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-[#11131c] p-6 text-white shadow-2xl shadow-black/40">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Réinitialiser le mot de passe</h1>
          <p className="text-sm text-white/60">Entre ton email pour recevoir un lien sécurisé.</p>
        </div>
        <ResetForm />
        <p className="text-center text-xs text-white/60">
          <Link href="/auth/sign-in" className="font-semibold text-white">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  )
}

function ResetForm() {
  'use client'
  const [state, formAction] = useFormState(resetAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
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
      {state?.error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.success}
        </p>
      )}
      <SubmitButton label="Envoyer le lien" />
    </form>
  )
}

function SubmitButton({ label }: { label: string }) {
  'use client'
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? 'Envoi...' : label}
    </button>
  )
}
