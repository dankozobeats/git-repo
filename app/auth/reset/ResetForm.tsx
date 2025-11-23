'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { initialState, resetAction } from './actions'

export default function ResetForm() {
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
