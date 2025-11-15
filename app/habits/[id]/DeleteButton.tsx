'use client'

type Props = {
  habitId: string
  habitName: string
}

export default function DeleteButton({ habitId, habitName }: Props) {
  const handleDelete = (e: React.FormEvent) => {
    if (!confirm(`Supprimer "${habitName}" et tous ses logs ?`)) {
      e.preventDefault()
    }
  }

  return (
    <form action={`/api/habits/${habitId}/delete`} method="POST" className="flex-1" onSubmit={handleDelete}>
      <button
        type="submit"
        className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 px-4 py-2 rounded-lg font-medium transition text-sm md:text-base"
      >
        🗑️ Supprimer
      </button>
    </form>
  )
}