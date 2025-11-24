'use client'

import { type ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Sparkles, Search } from 'lucide-react'
import { HABIT_SEARCH_EVENT } from '@/lib/ui/scroll'

export default function FloatingQuickActions() {
  const [scrollHidden, setScrollHidden] = useState(false)
  const [interactionHidden, setInteractionHidden] = useState(false)

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
      }, 600)
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

  const positionClass = 'bottom-6 right-4 sm:right-8'

  return (
    <div
      className={`fixed ${positionClass} z-40 flex flex-col items-center gap-3 transition-all duration-200 ${
        scrollHidden || interactionHidden ? 'translate-x-16 opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
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
}

function FloatingActionButton({
  onClick,
  icon,
  className,
  ariaLabel,
  hideOnPress,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-floating-hide-on-press={hideOnPress ? '' : undefined}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 touch-manipulation ${className}`}
    >
      {icon}
    </button>
  )
}
