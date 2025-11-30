'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setStatus('loading')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setStatus('success')
      setTimeout(() => router.push('/auth/sign-in'), 1200)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Impossible de mettre à jour ton mot de passe.'
      setError(errorMessage)
      setStatus('idle')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-white/10 bg-[#11131c] p-6 text-white shadow-2xl shadow-black/40">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
          <p className="text-sm text-white/60">Saisis un mot de passe sécurisé pour ton compte.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs uppercase tracking-[0.3em] text-white/60">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm focus:border-white/60 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-xs uppercase tracking-[0.3em] text-white/60">
              Confirme
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm focus:border-white/60 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
          {status === 'success' && (
            <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              Mot de passe mis à jour ! Redirection...
            </p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </form>
        <p className="text-center text-xs text-white/60">
          <Link href="/auth/sign-in" className="font-semibold text-white">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  )
}
