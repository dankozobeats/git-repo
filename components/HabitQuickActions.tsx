'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreVertical } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useToast } from './Toast'
import { toastRoastCraquage, toastRoastCorrection, toastRoastSuccess } from '@/lib/coach/coach'

type HabitQuickActionsProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter' | null
  initialCount: number
  habitName: string
  streak?: number
  totalLogs?: number
  totalCraquages?: number
}

export default function HabitQuickActions({
  habitId,
  habitType,
  trackingMode,
  initialCount,
  habitName,
  streak = 0,
  totalLogs = 0,
  totalCraquages = 0,
}: HabitQuickActionsProps) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { showToast, ToastComponent } = useToast()

  const isCounterMode = trackingMode === 'counter'
  const hasValue = count > 0
  const disablePrimary = isSubmitting || isPending || (!isCounterMode && hasValue)

  const safeStreak = Math.max(0, streak)
  const safeLogs = Math.max(0, totalLogs)
  const safeCraquages = Math.max(0, totalCraquages)

  const handleAction = async () => {
    if (disablePrimary) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/habits/${habitId}/check-in`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const newCount = typeof data.count === 'number' ? data.count : count + 1
      setCount(newCount)
      startTransition(() => router.refresh())

      const payloadStreak = habitType === 'good' ? safeStreak + 1 : safeStreak
      if (habitType === 'bad') {
        showToast(toastRoastCraquage(habitName, payloadStreak, safeCraquages + newCount), 'error')
      } else {
        showToast(toastRoastSuccess(habitName, payloadStreak, safeLogs + newCount), 'success')
      }
    } catch (error) {
      console.error(error)
      showToast('Impossible de mettre à jour', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette habitude ?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/habits/${habitId}/delete`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      startTransition(() => router.refresh())
    } catch (error) {
      console.error(error)
      showToast('Suppression impossible', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const primaryClasses = disablePrimary
    ? 'cursor-not-allowed bg-gray-800 text-gray-500'
    : habitType === 'bad'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-green-600 hover:bg-green-700'

  const primaryLabel = () => {
    if (habitType === 'bad') {
      if (hasValue && !isCounterMode) return 'Craquée'
      return '+ Craquage'
    }
    if (hasValue && !isCounterMode) return 'Validée'
    return 'Valider'
  }

  return (
    <>
      {ToastComponent}
      <div data-prevent-toggle="true" className="flex w-full items-center gap-2 sm:gap-3">
        <button
          type="button"
          disabled={disablePrimary}
          onClick={event => {
            event.stopPropagation()
            handleAction()
          }}
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:text-base ${primaryClasses}`}
        >
          {primaryLabel()}
        </button>

        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              data-prevent-toggle="true"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              onClick={event => event.stopPropagation()}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="bottom"
              align="end"
              sideOffset={10}
              className="z-[999999] w-[208px] rounded-2xl border border-white/10 bg-[#0d0f17] p-2 text-sm text-white shadow-2xl shadow-black/40 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
            >
              <MenuLink href={`/habits/${habitId}`} label="Voir l'habitude" />
              <MenuLink href={`/habits/${habitId}/edit`} label="Modifier" />
              <MenuLink href={`/habits/${habitId}?view=stats`} label="Statistiques" />
              <DropdownMenu.Item
                onSelect={event => {
                  event.preventDefault()
                  handleDelete()
                }}
                className="rounded-lg px-3 py-2 text-left text-red-500 transition hover:bg-white/10 focus:bg-white/10"
              >
                {isDeleting ? 'Suppression…' : 'Supprimer'}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </>
  )
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className="block rounded-lg px-3 py-2 text-white/90 transition hover:bg-white/10 focus:bg-white/10"
        onClick={event => event.stopPropagation()}
      >
        {label}
      </Link>
    </DropdownMenu.Item>
  )
}
