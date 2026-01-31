'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'

type HabitValidateButtonProps = {
  /**
   * Initial state of the button: validated or not.
   */
  initial?: boolean
  /**
   * Callback triggered whenever the state toggles.
   */
  onToggle?: (state: boolean) => void
  /**
   * Visual variant: default full-width, compact circle, or hidden.
   */
  variant?: 'default' | 'compact' | 'hidden'
}

export default function HabitValidateButton({ initial = false, onToggle, variant = 'default' }: HabitValidateButtonProps) {
  const [validated, setValidated] = useState(initial)
  const [justValidated, setJustValidated] = useState(false)

  // Sync with external initial changes (if any)
  useEffect(() => {
    setValidated(initial)
  }, [initial])

  // Trigger pop animation when validated switches to true
  useEffect(() => {
    if (validated) {
      setJustValidated(true)
      const timer = window.setTimeout(() => setJustValidated(false), 180)
      return () => window.clearTimeout(timer)
    }
  }, [validated])

  // Memoize visual classes for clarity
  const classes = useMemo(() => {
    if (validated) {
      return 'bg-green-600/20 border border-green-500/30 text-green-300 scale-95'
    }
    return 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
  }, [validated])

  if (variant === 'hidden') {
    return null
  }

  return (
    <button
      type="button"
      aria-pressed={validated}
      onClick={() => {
        const next = !validated
        setValidated(next)
        onToggle?.(next)
      }}
      className={`
        inline-flex items-center gap-2 rounded-xl transition-all duration-200 backdrop-blur
        ${variant === 'compact' ? 'h-9 w-9 justify-center px-0 py-0 text-xs' : 'px-4 py-2 text-sm font-semibold'}
        ${classes}
        ${validated ? 'shadow-[0_0_12px_rgba(74,222,128,0.25)]' : 'shadow-[0_0_12px_rgba(59,130,246,0.25)]'}
        ${justValidated ? 'animate-[pop_0.18s_ease-out]' : ''}
        active:scale-[0.96] active:opacity-90
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
      `}
    >
      <span
        className={`
          flex items-center justify-center rounded-full border border-current p-1 transition-all duration-200
          ${validated ? 'bg-green-500/20 text-green-200' : 'bg-blue-500/20 text-blue-200'}
        `}
      >
        <Check className="h-4 w-4" />
      </span>
      {/* Default variant keeps the label; compact is icon-only. */}
      {variant === 'default' && !validated && <span className="whitespace-nowrap">Valider</span>}
    </button>
  )
}

/**
 * Example usage inside a HabitCard component:
 *
 * <HabitValidateButton
 *   initial={false}
 *   onToggle={(state) => {
 *     // call your API / mutate state
 *     console.log('Validated?', state)
 *   }}
 * />
 */

// Keyframe for a tiny "pop" effect on validation
// Tailwind arbitrary value syntax for a quick inline keyframes definition.
// If your setup doesn't support arbitrary keyframes, move this to CSS:
// @keyframes pop { 0% { transform: scale(0.9); } 60% { transform: scale(1.05); } 100% { transform: scale(1); } }
