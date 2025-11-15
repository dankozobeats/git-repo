'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'

const BAD_HABIT_PRESETS = [
  { name: 'Fast-food', icon: '🍔', color: '#EF4444' },
  { name: 'Scroll social media', icon: '📱', color: '#3B82F6' },
  { name: 'Snooze alarm', icon: '⏰', color: '#F59E0B' },
  { name: 'Procrastination', icon: '🛋️', color: '#8B5CF6' },
  { name: 'Cigarettes', icon: '🚬', color: '#6B7280' },
  { name: 'Alcool', icon: '🍺', color: '#F97316' },
]

const GOOD_HABIT_PRESETS = [
  { name: 'Sport', icon: '💪', color: '#10B981' },
  { name: 'Lecture', icon: '📚', color: '#3B82F6' },
  { name: 'Méditation', icon: '🧘', color: '#8B5CF6' },
  { name: 'Eau (8 verres)', icon: '💧', color: '#06B6D4' },
  { name: 'Sommeil 8h', icon: '😴', color: '#6366F1' },
  { name: 'Fruits & légumes', icon: '🥗', color: '#10B981' },
]

export default function EditHabitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🔥')
  const [color, setColor] = useState('#EF4444')
  const [type, setType] = useState<'bad' | 'good'>('bad')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadHabit() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: habit, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !habit) {
        router.push('/')
        return
      }

      setName(habit.name)
      setDescription(habit.description || '')
      setIcon(habit.icon || '🔥')
      setColor(habit.color || '#EF4444')
      setType(habit.type || 'bad')
      setIsLoading(false)
    }

    loadHabit()
  }, [id, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase
      .from('habits')
      .update({
        name,
        description,
        icon,
        color,
        type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      alert('Erreur : ' + error.message)
      setIsSaving(false)
    } else {
      router.push(`/habits/${id}`)
      router.refresh()
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Modifier l'habitude</h1>
        <p className="text-gray-400 mb-8">
          Change ce que tu veux, on juge pas... enfin si, un peu. 😏
        </p>

        <div className="mb-6">
          <div className="flex gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
            <button
              type="button"
              onClick={() => setType('bad')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                type === 'bad'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔥 Mauvaise habitude
            </button>
            <button
              type="button"
              onClick={() => setType('good')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                type === 'good'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ✨ Bonne habitude
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            {type === 'bad' ? 'Mauvaises habitudes courantes' : 'Bonnes habitudes à développer'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(type === 'bad' ? BAD_HABIT_PRESETS : GOOD_HABIT_PRESETS).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setName(preset.name)
                  setIcon(preset.icon)
                  setColor(preset.color)
                }}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg p-4 text-left transition"
              >
                <div className="text-2xl mb-1">{preset.icon}</div>
                <div className="text-sm font-medium">{preset.name}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de l'habitude *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                placeholder="Ex: Fast-food, Sport..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 h-24"
                placeholder={type === 'bad' ? "Pourquoi c'est un problème ?" : "Pourquoi c'est important ?"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icône
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl focus:outline-none focus:border-red-500"
                  placeholder="🔥"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Couleur
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push(`/habits/${id}`)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition border border-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 py-3 rounded-lg font-medium transition disabled:opacity-50 ${
                  type === 'bad'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}