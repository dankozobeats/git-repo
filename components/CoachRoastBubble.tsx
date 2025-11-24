'use client'

import { useEffect, useState } from 'react'

type CoachRoastBubbleProps = {
  message: string
  variant?: 'overlay' | 'inline' | 'toast'
}

export default function CoachRoastBubble({ message, variant = 'overlay' }: CoachRoastBubbleProps) {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'leaving'>('hidden')
  const [render, setRender] = useState(true)
  const visibleDuration = variant === 'inline' ? 4000 : 6000

  useEffect(() => {
    const enter = setTimeout(() => setPhase('visible'), 120)
    const leave = setTimeout(() => setPhase('leaving'), visibleDuration)
    const cleanup = setTimeout(() => setRender(false), visibleDuration + 400)

    return () => {
      clearTimeout(enter)
      clearTimeout(leave)
      clearTimeout(cleanup)
    }
  }, [])

  if (!render) return null

  const overlayPhaseClass =
    phase === 'visible'
      ? 'translate-y-0 opacity-100'
      : phase === 'hidden'
      ? 'translate-y-4 opacity-0'
      : 'translate-y-4 opacity-0'

  const inlinePhaseClass =
    phase === 'visible'
      ? 'max-h-64 opacity-100 translate-y-0 my-0'
      : phase === 'hidden'
      ? 'max-h-0 opacity-0 -translate-y-1.5 my-0'
      : 'max-h-0 opacity-0 translate-y-1.5 -my-3'

  const toastPhaseClass =
    phase === 'visible'
      ? 'translate-y-0 opacity-100'
      : phase === 'hidden'
      ? 'translate-y-3 opacity-0'
      : 'translate-y-3 opacity-0'

  const bubbleContent = (
    <div className="rounded-3xl border border-[#FF4D4D]/40 bg-[#1F1414]/80 px-5 py-4 text-sm text-white shadow-lg shadow-black/30">
      <p className="text-xs uppercase tracking-[0.35em] text-[#FF9C9C]">Coach Roast</p>
      <p className="mt-2 text-base font-semibold text-white">{message}</p>
    </div>
  )

  if (variant === 'inline') {
    return (
      <div
        className={`overflow-hidden transition-[max-height,opacity,transform,margin] duration-500 ease-in-out ${inlinePhaseClass}`}
        style={{ marginTop: phase === 'visible' ? undefined : 0 }}
      >
        {bubbleContent}
      </div>
    )
  }

  if (variant === 'toast') {
    return (
      <div
        className={`pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6 sm:justify-end sm:px-6 transition-all duration-500 ${toastPhaseClass}`}
      >
        <div className="pointer-events-auto w-full max-w-sm rounded-3xl border border-[#FF4D4D]/50 bg-[#1F1414]/95 px-4 py-3 text-sm text-white shadow-2xl shadow-black/40">
          <p className="text-xs uppercase tracking-[0.35em] text-[#FF9C9C]">Coach Roast</p>
          <p className="mt-1.5 text-base font-semibold text-white">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-x-0 top-28 z-50 flex justify-center px-4 transition-all duration-500 sm:top-24 md:top-10 ${overlayPhaseClass}`}
    >
      <div className="relative max-w-xl rounded-3xl border border-[#FF4D4D]/50 bg-[#1F1414]/90 px-5 py-4 text-sm text-white shadow-2xl shadow-black/50">
        <p className="text-xs uppercase tracking-[0.35em] text-[#FF9C9C]">Coach Roast</p>
        <p className="mt-2 text-base font-semibold text-white">{message}</p>
        <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b border-[#FF4D4D]/50 bg-[#1F1414]/90" />
      </div>
    </div>
  )
}
