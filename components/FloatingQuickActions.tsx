'use client'

import { type ReactNode, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { Plus, Sparkles, Search, Move } from 'lucide-react'
import { HABIT_SEARCH_EVENT } from '@/lib/ui/scroll'

export default function FloatingQuickActions() {
  const [scrollHidden, setScrollHidden] = useState(false)
  const [interactionHidden, setInteractionHidden] = useState(false)
  const [customPosition, setCustomPosition] = useState<{ top: number; left: number } | null>(null)
  const [moveMode, setMoveMode] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
    startX: number
    startY: number
    isDragging: boolean
  } | null>(null)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let timeout: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      const currentY = window.scrollY
      const moved = Math.abs(currentY - lastScrollY) > 2
      lastScrollY = currentY

      if (window.innerWidth >= 768) return

      if (moved && currentY > 10) {
        setScrollHidden(true)
      }

      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (window.innerWidth < 768) {
          setScrollHidden(false)
        }
      }, 250)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    let interactionTimeout: ReturnType<typeof setTimeout>

    const handlePointer = (event: PointerEvent) => {
      if (window.innerWidth >= 768) return
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-floating-hide-on-press]')) {
        setInteractionHidden(true)
        clearTimeout(interactionTimeout)
        interactionTimeout = setTimeout(() => setInteractionHidden(false), 700)
      }
    }

    document.addEventListener('pointerdown', handlePointer)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      clearTimeout(interactionTimeout)
    }
  }, [])

  const handleDragStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
    }
  }

  const handleDragMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current || !containerRef.current) return
    const ref = dragRef.current
    const distance = Math.hypot(event.clientX - ref.startX, event.clientY - ref.startY)
    if (!ref.isDragging && distance > 6) {
      ref.isDragging = true
      event.currentTarget.setPointerCapture(ref.pointerId)
    }
    if (!ref.isDragging) return
    event.preventDefault()
    const { offsetX, offsetY } = ref
    const rect = containerRef.current.getBoundingClientRect()
    const nextLeft = event.clientX - offsetX
    const nextTop = event.clientY - offsetY
    const maxLeft = window.innerWidth - rect.width - 8
    const maxTop = window.innerHeight - rect.height - 8
    const clampedLeft = Math.min(Math.max(8, nextLeft), Math.max(8, maxLeft))
    const clampedTop = Math.min(Math.max(8, nextTop), Math.max(8, maxTop))
    setCustomPosition({ left: clampedLeft, top: clampedTop })
  }

  const handleDragEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.isDragging && event.currentTarget.hasPointerCapture(dragRef.current.pointerId)) {
      event.currentTarget.releasePointerCapture(dragRef.current.pointerId)
    }
    dragRef.current = null
  }

  const positionClass = customPosition ? '' : 'bottom-6 right-4 sm:right-8'
  const positionStyle = customPosition ? { top: customPosition.top, left: customPosition.left } : undefined

  return (
    <div
      ref={containerRef}
      className={`fixed ${positionClass} z-40 flex flex-col items-center gap-3 transition-all duration-200 ${
        scrollHidden || interactionHidden ? 'translate-x-16 opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={positionStyle}
    >
      <FloatingActionButton
        onClick={() => {
          setMoveMode(prev => !prev)
          dragRef.current = null
        }}
        ariaLabel={moveMode ? 'Valider la position du menu' : 'Déplacer les actions rapides'}
        icon={<Move className={`h-4 w-4 ${moveMode ? 'text-[#FF4D4D]' : ''}`} />}
        className={`border border-white/15 bg-[#050915]/70 text-white ${moveMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={event => {
          if (!moveMode) return
          handleDragStart(event)
        }}
        onPointerMove={event => {
          if (!moveMode) return
          handleDragMove(event)
        }}
        onPointerUp={event => {
          if (!moveMode) return
          handleDragEnd(event)
        }}
        onPointerCancel={event => {
          if (!moveMode) return
          handleDragEnd(event)
        }}
      />
      {!moveMode && (
        <>
          <FloatingActionButton
            onClick={() => {
              window.dispatchEvent(new CustomEvent(HABIT_SEARCH_EVENT))
            }}
            ariaLabel="Recherche"
            icon={<Search className="h-5 w-5" />}
            className="border border-white/15 bg-[#050915]/85 text-white"
            hideOnPress
          />
          <FloatingIconLink
            href="/habits/new"
            label="Créer une habitude"
            icon={<Plus className="h-5 w-5" />}
            className="bg-gradient-to-r from-[#FF4D4D] to-[#F58CA5] text-white shadow-[0_20px_45px_rgba(255,77,77,0.45)]"
          />
          <FloatingIconLink
            href="/report"
            label="Coach IA"
            icon={<Sparkles className="h-5 w-5" />}
            className="bg-[#050915]/85 text-[#4DA6FF] border border-white/15 shadow-lg shadow-black/40"
          />
        </>
      )}
    </div>
  )
}

function FloatingIconLink({ href, label, icon, className }: { href: string; label: string; icon: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`group flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 ${className}`}
      data-floating-hide-on-press=""
    >
      {icon}
    </Link>
  )
}

type FloatingActionButtonProps = {
  onClick?: () => void
  icon: ReactNode
  className?: string
  ariaLabel: string
  hideOnPress?: boolean
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerUp?: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerCancel?: (event: ReactPointerEvent<HTMLButtonElement>) => void
}

function FloatingActionButton({
  onClick,
  icon,
  className,
  ariaLabel,
  hideOnPress,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      data-floating-hide-on-press={hideOnPress ? '' : undefined}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 ${className}`}
    >
      {icon}
    </button>
  )
}
