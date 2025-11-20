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

  const baseClasses =
    'w-full h-11 rounded-lg px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D4D]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f]'

  return (
    <form action={`/api/habits/${habitId}/delete`} method="POST" className="flex-1" onSubmit={handleDelete}>
      <button
        type="submit"
        className={`${baseClasses} border border-[#FF4D4D]/40 bg-[#2A0F0F] text-[#FF4D4D] hover:border-[#FF4D4D]/60 hover:bg-[#3b1414]`}
      >
        🗑️ Supprimer
      </button>
    </form>
  )
}
