'use client'

// Button with confirmation to delete the habit inside the premium toolbar.
type Props = {
  habitId: string
  habitName: string
}

export default function DeleteButton({ habitId, habitName }: Props) {
  const handleDelete = (event: React.FormEvent) => {
    if (!confirm(`Supprimer "${habitName}" et tous ses logs ?`)) {
      event.preventDefault()
    }
  }

  return (
    <form
      action={`/api/habits/${habitId}/delete`}
      method="POST"
      className="flex-1"
      onSubmit={handleDelete}
    >
      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#FF6B6B]/50 bg-[#2A0F14] px-5 text-sm font-semibold text-[#FF9B9B] transition hover:border-[#FF6B6B] hover:text-[#FFE4E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B]/60"
      >
        <span aria-hidden>🗑️</span>
        Supprimer
      </button>
    </form>
  )
}
