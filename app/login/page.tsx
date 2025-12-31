'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      // Force un rechargement complet pour synchroniser l'état d'authentification
      window.location.href = '/'
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setMessage('Check ton email pour confirmer ton compte ! 📧')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#05060A] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/5 bg-[#111623] p-8 shadow-[0_30px_150px_rgba(0,0,0,0.6)]">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Connexion</p>
          <h1 className="text-3xl font-bold text-white">BadHabit Tracker</h1>
          <p className="text-white/60">Prêt à assumer tes conneries quotidiennes ? 😏</p>
        </div>

        <form className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-semibold text-white/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
              placeholder="ton@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-white/70">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
              {message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex-1 rounded-2xl bg-[#FF4D4D] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-[#FF4D4D]/40 transition hover:bg-[#e04343] disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : 'Connexion'}
            </button>
            <button
              onClick={handleSignup}
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-50"
            >
              Inscription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
