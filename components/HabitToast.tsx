'use client'

// Toast premium affiché dans le flux pour confirmer la validation d'une habitude.
import { useCallback, useEffect, useRef, useState } from 'react'
import AICoachMessage from '@/components/AICoachMessage' // Garantit le même visuel que les autres messages IA.

type HabitToastProps = {
  message: string
  variant?: 'success' | 'error'
  duration?: number
  onComplete?: () => void
}

// Durée d'affichage par défaut réduite pour éviter que le toast ne bloque la vue.
const DEFAULT_DURATION = 4000

export default function HabitToast({
  message,
  variant = 'success',
  duration = DEFAULT_DURATION,
  onComplete,
}: HabitToastProps) {
  // Suit la phase d'animation pour synchroniser l'entrée/sortie CSS.
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter')
  const exitTimerRef = useRef<number | null>(null)
  const cleanupTimerRef = useRef<number | null>(null)

  // Déclenche la fermeture après la durée demandée pour éviter l'accumulation de toasts.
  useEffect(() => {
    exitTimerRef.current = window.setTimeout(() => setPhase('exit'), Math.max(0, duration - 200))
    cleanupTimerRef.current = window.setTimeout(() => onComplete?.(), duration)
    return () => {
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
      if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current)
    }
  }, [duration, onComplete])

  // Gère la fermeture manuelle via la croix intégrée au design premium.
  const handleManualClose = useCallback(() => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
    if (cleanupTimerRef.current) {
      window.clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }
    setPhase('exit')
    cleanupTimerRef.current = window.setTimeout(() => onComplete?.(), 200)
  }, [onComplete])

  // Rend un container plein largeur pour s'aligner sur la barre de recherche et conserver la cohérence visuelle.
  const liveMode = variant === 'error' ? 'assertive' : 'polite'

  return (
    <div
      aria-live={liveMode}
      className={`habit-toast-wrapper ${phase === 'enter' ? 'habit-toast-enter' : 'habit-toast-exit'}`}
    >
      <AICoachMessage message={message} variant="toast" showCTA onClose={handleManualClose} />
    </div>
  )
}
