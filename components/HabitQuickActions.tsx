'use client'

// Raccourcis d'action pour cocher/supprimer une habitude directement depuis les listes.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreVertical } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
type HabitQuickActionsProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter' | null
  initialCount: number
  counterRequired?: number | null
  habitName: string
  streak?: number
  totalLogs?: number
  totalCraquages?: number
  onHabitValidated?: (message: string, variant?: 'success' | 'error') => void
}

export default function HabitQuickActions({
  habitId,
  habitType,
  trackingMode,
  initialCount,
  counterRequired,
  habitName,
  streak = 0,
  totalLogs = 0,
  totalCraquages = 0,
  onHabitValidated,
}: HabitQuickActionsProps) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()
  // Cible dynamique permettant de savoir quand un compteur est considéré comme terminé.
  const [requiredCount, setRequiredCount] = useState(() => {
    if (typeof counterRequired === 'number' && counterRequired > 0) {
      return counterRequired
    }
    return trackingMode === 'counter' ? Number.POSITIVE_INFINITY : 1
  })

  // Déduit les états d'UI en fonction de la configuration de suivi.
  const isCounterMode = trackingMode === 'counter'
  const hasValue = count > 0
  const isFullyValidated = count >= requiredCount
  const disablePrimary = isSubmitting || isPending || isFullyValidated
  const remaining = Number.isFinite(requiredCount) ? Math.max(0, requiredCount - count) : null

  // Valeurs sécurisées utilisées pour calculer les punchlines.
  const safeStreak = Math.max(0, streak)
  const safeLogs = Math.max(0, totalLogs)
  const safeCraquages = Math.max(0, totalCraquages)

  // Effectue un check-in rapide et rafraîchit les données locales/serveur.
  const handleAction = async () => {
    if (disablePrimary) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/habits/${habitId}/check-in`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const newCount = typeof data.count === 'number' ? data.count : count + 1
      if (typeof data.counterRequired === 'number' && data.counterRequired > 0) {
        // Stocke le seuil renvoyé par l'API afin d'éviter toute divergence côté client.
        setRequiredCount(data.counterRequired)
      }
      setCount(newCount)
      startTransition(() => router.refresh())

    } catch (error) {
      console.error(error)
      onHabitValidated?.('Impossible de mettre à jour', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Supprime une habitude depuis le menu contextuel après confirmation.
  const handleDelete = async () => {
    if (!confirm('Supprimer cette habitude ?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/habits/${habitId}/delete`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      startTransition(() => router.refresh())
    } catch (error) {
      console.error(error)
      onHabitValidated?.('Suppression impossible', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Palette de couleurs selon le type d'habitude pour maintenir un feedback visuel.
  const softPrimary =
    habitType === 'bad'
      ? 'bg-red-500/80 text-white/90 shadow-inner shadow-red-500/20 hover:bg-red-500'
      : 'bg-emerald-500/80 text-white/90 shadow-inner shadow-emerald-500/20 hover:bg-emerald-500'

  const primaryClasses = disablePrimary ? 'cursor-not-allowed bg-gray-800 text-gray-500' : softPrimary

  // Texte du bouton principal selon type/mode de suivi.
  const primaryLabel = () => {
    if (isFullyValidated) return 'Validée ✓'
    if (habitType === 'bad') {
      if (hasValue && !isCounterMode) return 'Craquée'
      return '+ Craquage'
    }
    if (hasValue && !isCounterMode) return 'Validée'
    return 'Valider'
  }

  // Rend le bouton principal (check-in) et un menu Radix pour les actions secondaires.
  return (
    <>
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

// Wrapper simplifié pour les entrées de menu de navigation Radix.
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
