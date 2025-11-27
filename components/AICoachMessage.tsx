'use client'

// Composant client unifié pour tous les messages IA (coach, roast, toast) afin d'éviter les écarts SSR/hydratation.
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'

type AICoachMessageProps = {
  message: string
  variant?: 'default' | 'roast' | 'toast'
  showCTA?: boolean
  onClose?: () => void
}

// Libellé réutilisé pour centraliser la destination premium.
const CTA_LABEL = "Voir l'analyse complète"

export default function AICoachMessage({
  message,
  variant = 'default',
  showCTA = true,
  onClose,
}: AICoachMessageProps) {
  // Les variantes compactes (toast) utilisent une largeur contrainte pour rester lisibles dans les overlays.
  const isToastVariant = variant === 'toast'
  const containerPadding = isToastVariant ? 'px-4 py-4' : 'px-5 py-5 sm:px-6 sm:py-6'
  const containerWidth = isToastVariant ? 'max-w-[350px]' : 'w-full'
  const iconSize = isToastVariant ? 'h-10 w-10' : 'h-12 w-12'
  const messageSize = isToastVariant ? 'text-sm' : 'text-base'
  const ctaSize = isToastVariant ? 'text-xs' : 'text-sm'
  const messageToneClass = variant === 'roast' ? 'italic text-white' : 'text-white/90'

  return (
    <article
      className={`relative flex ${containerWidth} items-start gap-4 rounded-2xl border border-white/10 bg-[#1B0F2F]/60 text-white shadow-[0_20px_60px_rgba(15,13,35,0.55)] backdrop-blur-xl ${containerPadding}`}
    >
      <div
        className={`flex ${iconSize} flex-shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#C084FC]/80 via-[#A855F7]/80 to-[#7C3AED]/80 text-white shadow-[0_12px_35px_rgba(124,58,237,0.45)]`}
        aria-hidden
      >
        <Sparkles className={isToastVariant ? 'h-5 w-5' : 'h-6 w-6'} />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-white">Message de votre Coach IA</p>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#E9D5FF]">
            Premium
          </span>
        </div>
        <p className={`${messageSize} leading-relaxed ${messageToneClass}`}>{message}</p>
        {showCTA && (
          <Link
            href="/report"
            className={`inline-flex items-center gap-1 font-semibold text-[#C084FC] transition hover:text-white ${ctaSize}`}
          >
            {CTA_LABEL} <span aria-hidden>→</span>
          </Link>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Fermer le message IA"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-1 text-white/70 transition hover:border-white/40 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </article>
  )
}
