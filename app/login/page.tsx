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
      router.push('/')
      router.refresh()
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-8 max-w-md w-full border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-2">
          BadHabit Tracker
        </h1>
        <p className="text-gray-400 mb-8">
          Prêt à assumer tes conneries quotidiennes ? 😏
        </p>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              placeholder="ton@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Chargement...' : 'Connexion'}
            </button>
            <button
              onClick={handleSignup}
              disabled={isLoading}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition border border-gray-700"
            >
              Inscription
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
