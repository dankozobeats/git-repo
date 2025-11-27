'use client'

// Toast premium affiché dans le flux pour confirmer la validation d'une habitude.
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'

type HabitToastProps = {
  message: string
  variant?: 'success' | 'error'
  duration?: number
  onComplete?: () => void
}

const DEFAULT_DURATION = 10000

export default function HabitToast({
  message,
  variant = 'success',
  duration = DEFAULT_DURATION,
  onComplete,
}: HabitToastProps) {
  // Suit la phase d'animation pour synchroniser l'entrée/sortie CSS.
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter')

  // Déclenche la fermeture après la durée demandée pour éviter l'accumulation de toasts.
  useEffect(() => {
    const exitTimer = window.setTimeout(() => setPhase('exit'), Math.max(0, duration - 200))
    const cleanupTimer = window.setTimeout(() => onComplete?.(), duration)
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(cleanupTimer)
    }
  }, [duration, onComplete])

  // Sélectionne l'icône selon la variante (succès ou erreur réseau).
  const Icon = useMemo(() => (variant === 'error' ? AlertTriangle : CheckCircle), [variant])
  const accentClasses = variant === 'error' ? 'text-red-300 bg-red-300/10' : 'text-emerald-200 bg-emerald-300/10'

  return (
    <div
      aria-live="polite"
      className={`habit-toast-wrapper ${phase === 'enter' ? 'habit-toast-enter' : 'habit-toast-exit'}`}
    >
      <div className="flex w-full items-start gap-3 rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
        <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl ${accentClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Habitude validée</p>
          <p className="mt-1 text-base font-semibold text-white/90">{message}</p>
        </div>
      </div>
    </div>
  )
}
