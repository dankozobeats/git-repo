'use client'

// Raccourcis d'action pour cocher/supprimer une habitude directement depuis les listes.

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreVertical, ExternalLink, Target, Pencil, BarChart3, Eye, Trash2, X } from 'lucide-react'
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
  habitColor?: string | null
  habitIcon?: string | null
  streak?: number
  totalLogs?: number
  totalCraquages?: number
  isFocused?: boolean
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
  habitColor,
  habitIcon,
  streak = 0,
  totalLogs = 0,
  totalCraquages = 0,
  isFocused = false,
  onHabitValidated,
}: HabitQuickActionsProps) {
  const router = useRouter()
  const [count, setCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isFocusToggling, setIsFocusToggling] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Empêche le scroll arrière-plan lorsque le tiroir ou l'aperçu est ouvert.
  useEffect(() => {
    if (isPreviewOpen || isDrawerOpen) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
  }, [isPreviewOpen, isDrawerOpen])

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

  // Toggle focus mode for this habit
  const handleToggleFocus = async () => {
    if (isFocusToggling) return
    setIsFocusToggling(true)
    try {
      const res = await fetch(`/api/habits/${habitId}/focus`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      // Dispatch custom event to refresh focus widget
      window.dispatchEvent(new CustomEvent('focusModeChanged'))

      // Refresh the page
      startTransition(() => router.refresh())

      // Show success message
      if (data.message) {
        onHabitValidated?.(data.message, 'success')
      }
    } catch (error) {
      console.error('Failed to toggle focus:', error)
      onHabitValidated?.('Impossible de changer le mode focus', 'error')
    } finally {
      setIsFocusToggling(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Primary Action (Check-in) */}
        <HabitValidateButton
          variant="compact"
          initial={isFullyValidated}
          onToggle={handleAction}
        />

        {/* Secondary Micro-Actions (Minimized) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleFocus()
          }}
          disabled={isFocusToggling}
          className={`flex items-center justify-center h-8 w-8 rounded-full transition-all duration-300 ${isFocused ? 'bg-purple-500/20 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'text-white/30 hover:text-white/70 hover:bg-white/5'}`}
          title={isFocused ? 'Mode Focus activé' : 'Activer le mode Focus'}
        >
          <Target className={`h-4.5 w-4.5 ${isFocused ? 'animate-pulse scale-110' : ''}`} />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsDrawerOpen(true)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-white/5 hover:text-white active:scale-95"
          title="Plus d'actions"
        >
          <MoreVertical className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Premium Drawer (Bottom Sheet on Mobile, Modal on Desktop) */}
      {
        isDrawerOpen && (
          <Portal>
            <div
              className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm animate-in fade-in"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="fixed inset-0 z-[10001] pointer-events-none flex items-end sm:items-center justify-center p-0 sm:p-6">
              <div
                className="pointer-events-auto relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0d0f17]/98 p-6 sm:p-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] sm:shadow-[0_40px_100px_rgba(0,0,0,0.7)] backdrop-blur-3xl animate-in slide-in-from-bottom sm:zoom-in duration-300 ease-out"
                onClick={e => e.stopPropagation()}
              >
                {/* Decorative Handle */}
                <div className="mx-auto mb-8 h-1 w-12 rounded-full bg-white/20 sm:hidden" />

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute right-6 top-6 sm:right-8 sm:top-8 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Drawer Header */}
                <div className="mb-8 flex items-center gap-5">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl shadow-2xl border border-white/10"
                    style={{ backgroundColor: `${habitColor || '#6b7280'}20` }}
                  >
                    {habitIcon || (habitType === 'bad' ? '🔥' : '✨')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold text-white tracking-tight truncate">{habitName}</h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Paramètres de l'habitude</p>
                  </div>
                </div>

                {/* Action Tiles Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <DrawerTile
                    icon={<Eye />}
                    label="Voir"
                    sub="Fiche détaillée"
                    color="#A855F7"
                    onClick={() => { setIsDrawerOpen(false); setIsPreviewOpen(true); }}
                  />
                  <DrawerTile
                    icon={<Pencil />}
                    label="Modifier"
                    sub="Nom, icône, réglages"
                    color="#3B82F6"
                    isLink
                    href={`/habits/${habitId}/edit`}
                  />
                  <DrawerTile
                    icon={<BarChart3 />}
                    label="Stats"
                    sub="Evolution & logs"
                    color="#F59E0B"
                    isLink
                    href={`/habits/${habitId}?view=stats`}
                  />
                  <DrawerTile
                    icon={<Trash2 />}
                    label="Supprimer"
                    sub="Action irréversible"
                    color="#EF4444"
                    onClick={handleDelete}
                    loading={isDeleting}
                  />
                </div>
              </div>
            </div>
          </Portal>
        )
      }

      {/* Habit Preview Modal */}
      {
        isPreviewOpen && (
          <Portal>
            <div
              className="fixed inset-0 z-[10002] bg-black/80 backdrop-blur-md animate-in fade-in"
              onClick={() => setIsPreviewOpen(false)}
            />
            <div className="fixed inset-0 z-[10003] pointer-events-none flex items-center justify-center p-4">
              <div
                className="pointer-events-auto relative w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#0b0f1d]/95 p-8 sm:p-10 text-white shadow-[0_40px_120px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in zoom-in duration-300"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all"
                  onClick={() => setIsPreviewOpen(false)}
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.4em] text-white/30 mb-2">Aperçu rapide</p>
                    <h3 className="text-3xl font-bold tracking-tight">{habitName}</h3>
                  </div>

                  {habitDescription ? (
                    <p className="text-base text-white/60 leading-relaxed font-medium">{habitDescription}</p>
                  ) : (
                    <p className="text-sm text-white/25 italic">Aucune description disponible.</p>
                  )}

                  <div className="flex flex-col gap-3 pt-4">
                    <Link
                      href={`/habits/${habitId}`}
                      className="flex items-center justify-center gap-3 rounded-2xl bg-white text-black h-14 text-base font-bold shadow-[0_15px_40px_rgba(255,255,255,0.15)] hover:opacity-90 transition-all active:scale-95"
                    >
                      Voir la fiche complète
                      <ExternalLink className="h-5 w-5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(false)}
                      className="h-14 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        )
      }
    </>
  )
}

function DrawerTile({
  icon,
  label,
  sub,
  color,
  onClick,
  isLink,
  href,
  loading
}: {
  icon: React.ReactNode,
  label: string,
  sub: string,
  color: string,
  onClick?: () => void,
  isLink?: boolean,
  href?: string,
  loading?: boolean
}) {
  const content = (
    <>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-xl border border-white/5 transition-transform group-hover:scale-110 duration-300"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
      </div>
      <div className="text-left w-full min-w-0">
        <p className="text-sm font-bold text-white tracking-tight">{label}</p>
        <p className="text-[10px] text-white/30 leading-snug line-clamp-2 truncate">{sub}</p>
      </div>
    </>
  )

  const className = "flex flex-col items-start gap-4 rounded-[28px] border border-white/5 bg-white/[0.03] p-5 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/10 active:scale-95 group overflow-hidden"

  if (isLink && href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className} disabled={loading}>
      {content}
    </button>
  )
}
