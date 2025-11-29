'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreVertical } from 'lucide-react'

type HabitQuickActionsProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter' | null
  initialCount: number
  counterRequired?: number | null
  streak?: number
  totalLogs?: number
  totalCraquages?: number
  onHabitValidated?: (message: string, variant?: 'success' | 'error') => void
  variant?: 'default' | 'compact'
  onActionComplete?: () => void
}

export default function HabitQuickActions({
  habitId,
  habitType,
  trackingMode,
  initialCount,
  counterRequired,
  streak,
  totalLogs,
  totalCraquages,
  onHabitValidated,
  variant = 'default',
  onActionComplete,
}: HabitQuickActionsProps) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  const handleValidate = async () => {
    try {
      const res = await fetch(`/api/habits/${habitId}/validate`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erreur')

      if (onHabitValidated) {
        onHabitValidated(data.message, 'success')
      }

      startTransition(() => {
        router.refresh()
      })

      if (onActionComplete) onActionComplete()
    } catch (err) {
      if (onHabitValidated) {
        onHabitValidated('Erreur lors de la validation', 'error')
      }
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
          <MoreVertical size={18} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        align="end"
        className="rounded-xl bg-neutral-900 p-2 text-sm shadow-xl border border-white/10"
      >
        <DropdownMenu.Item
          onClick={handleValidate}
          className="px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer"
        >
          Valider
        </DropdownMenu.Item>

        <DropdownMenu.Separator className="my-1 h-px bg-white/10" />

        <DropdownMenu.Item
          onClick={() => router.push(`/habits/${habitId}/edit`)}
          className="px-3 py-2 rounded-md hover:bg-white/10 cursor-pointer"
        >
          Modifier
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
