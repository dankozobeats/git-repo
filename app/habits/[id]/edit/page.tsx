import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function updateHabit(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  const habitId = formData.get('habitId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const icon = formData.get('icon') as string
  const color = formData.get('color') as string
  const type = formData.get('type') as string

  await supabase
    .from('habits')
    .update({
      name,
      description: description || null,
      icon: icon || null,
      color,
      type,
    })
    .eq('id', habitId)
    .eq('user_id', user.id)

  revalidatePath('/')
  revalidatePath(`/habits/${habitId}`)
  redirect(`/habits/${habitId}`)
}

export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!habit) {
    redirect('/')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link 
          href={`/habits/${id}`}
          className="text-gray-400 hover:text-white mb-6 inline-block"
        >
          ← Retour
        </Link>

        <h1 className="text-3xl font-bold mb-8">Modifier l'habitude</h1>

        <form action={updateHabit} className="space-y-6">
          <input type="hidden" name="habitId" value={id} />

          <div>
            <label className="block text-sm font-medium mb-2">
              Nom de l'habitude *
            </label>
            <input
              type="text"
              name="name"
              defaultValue={habit.name}
              required
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-500 text-white"
              placeholder="Ex: Fumer, Sport, Lecture..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optionnel)
            </label>
            <textarea
              name="description"
              defaultValue={habit.description || ''}
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-500 text-white"
              placeholder="Quelques détails..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Type d'habitude *
            </label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="bad"
                  defaultChecked={habit.type === 'bad'}
                  className="peer sr-only"
                />
                <div className="border-2 border-gray-800 rounded-lg p-4 text-center peer-checked:border-red-600 peer-checked:bg-red-900/20 hover:border-gray-700 transition">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="font-medium">Mauvaise</div>
                  <div className="text-xs text-gray-500 mt-1">À réduire</div>
                </div>
              </label>

              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="good"
                  defaultChecked={habit.type === 'good'}
                  className="peer sr-only"
                />
                <div className="border-2 border-gray-800 rounded-lg p-4 text-center peer-checked:border-green-600 peer-checked:bg-green-900/20 hover:border-gray-700 transition">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="font-medium">Bonne</div>
                  <div className="text-xs text-gray-500 mt-1">À maintenir</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Icône (emoji)
            </label>
            <input
              type="text"
              name="icon"
              defaultValue={habit.icon || ''}
              maxLength={2}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-red-500 text-white text-2xl text-center"
              placeholder="🔥"
            />
            <p className="text-xs text-gray-500 mt-1">
              Un emoji qui représente ton habitude
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Couleur
            </label>
            <div className="grid grid-cols-6 gap-3">
              {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'].map((c) => (
                <label key={c} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    defaultChecked={habit.color === c}
                    className="sr-only peer"
                  />
                  <div
                    className="w-full aspect-square rounded-lg border-2 border-transparent peer-checked:border-white peer-checked:scale-110 transition"
                    style={{ backgroundColor: c }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href={`/habits/${id}`}
              className="flex-1 bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition text-center border border-gray-700"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}