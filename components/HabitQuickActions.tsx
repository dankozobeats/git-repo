'use client'

// Raccourcis d'action pour cocher/supprimer une habitude directement depuis les listes.

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreVertical, ExternalLink } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Portal } from '@radix-ui/react-portal'
import HabitValidateButton from '@/components/HabitValidateButton'
type HabitQuickActionsProps = {
  habitId: string
  habitType: 'good' | 'bad'
  trackingMode: 'binary' | 'counter' | null
  initialCount: number
  counterRequired?: number | null
  habitName: string
  habitDescription?: string | null
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
  habitDescription,
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Empêche le scroll arrière-plan lorsque le modal d'aperçu est ouvert.
  useEffect(() => {
    if (isPreviewOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isPreviewOpen])
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

  // Rend le bouton principal (check-in) et un menu Radix pour les actions secondaires.
  return (
    <>
      <div
  data-prevent-toggle="true"
      className="ml-auto flex items-center justify-end gap-2 sm:gap-3 min-w-[64px]"
>

        {/* Compact validation CTA keeps a consistent touch target without dominating the row. */}
        <HabitValidateButton
          variant="compact"
          initial={isFullyValidated}
          onToggle={() => {
            handleAction()
          }}
        />
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
            className="z-[10050] w-[208px] rounded-2xl border border-white/10 bg-[#0d0f17]/95 p-2 text-sm text-white shadow-2xl shadow-black/60 backdrop-blur-lg data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
            collisionPadding={12}
          >
            <DropdownMenu.Item
              onSelect={event => {
                event.preventDefault()
                setIsPreviewOpen(true)
                }}
                className="rounded-lg px-3 py-2 text-left text-white/90 transition hover:bg-white/10 focus:bg-white/10"
              >
                Voir l'habitude
              </DropdownMenu.Item>
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
      {isPreviewOpen && (
        <Portal>
          <div
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
            <div
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b0f1d]/95 p-6 text-white shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full border border-white/15 px-2 py-1 text-white/70 transition hover:text-white"
                onClick={() => setIsPreviewOpen(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
              <div className="space-y-2 pr-8">
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Aperçu habitude</p>
                <h3 className="text-2xl font-semibold">{habitName}</h3>
                {habitDescription ? (
                  <p className="text-sm text-white/70 leading-relaxed">{habitDescription}</p>
                ) : (
                  <p className="text-sm text-white/40 italic">Aucune description fournie.</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href={`/habits/${habitId}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold shadow-[0_12px_30px_rgba(255,255,255,0.25)] transition hover:opacity-90"
                >
                  Voir la fiche détaillée
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
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
