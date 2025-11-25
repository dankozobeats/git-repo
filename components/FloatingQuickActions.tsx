'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Sparkles, Search } from 'lucide-react'
import { HABIT_SEARCH_EVENT } from '@/lib/ui/scroll'

const SCROLL_THRESHOLD = 10

export default function FloatingQuickActions() {
  const [hidden, setHidden] = useState(false)
  const lastScrollYRef = useRef(0)
  const scrollTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      const currentY = window.scrollY
      const delta = Math.abs(currentY - lastScrollYRef.current)
      if (delta < SCROLL_THRESHOLD) return
      lastScrollYRef.current = currentY
      if (document.documentElement.classList.contains('no-hide-menu')) return
      hideFloatingMenu()
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        showFloatingMenu()
      }, 200)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const preventHideDuringClick = () => {
    document.documentElement.classList.add('no-hide-menu')
    window.setTimeout(() => {
      document.documentElement.classList.remove('no-hide-menu')
    }, 300)
  }

  const hideFloatingMenu = () => {
    if (document.documentElement.classList.contains('no-hide-menu')) return
    setHidden(true)
  }

  const showFloatingMenu = () => {
    setHidden(false)
  }

  const positionClass = 'bottom-6 right-4 sm:right-8'

  return (
    <div
      id="floatingMenu"
      className={`fixed ${positionClass} z-[1500] flex flex-col items-center gap-3 transition-all duration-200 ${
        hidden ? 'translate-x-20 opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <FloatingActionButton
        onClick={() => {
          window.dispatchEvent(new CustomEvent(HABIT_SEARCH_EVENT))
        }}
        ariaLabel="Recherche"
        icon={<Search className="h-5 w-5" />}
        className="border border-white/15 bg-[#050915]/85 text-white"
        preventHideDuringClick={preventHideDuringClick}
      />
      <FloatingIconLink
        href="/habits/new"
        label="Créer une habitude"
        icon={<Plus className="h-5 w-5" />}
        className="bg-gradient-to-r from-[#FF4D4D] to-[#F58CA5] text-white shadow-[0_20px_45px_rgba(255,77,77,0.45)]"
        preventHideDuringClick={preventHideDuringClick}
      />
      <FloatingIconLink
        href="/report"
        label="Coach IA"
        icon={<Sparkles className="h-5 w-5" />}
        className="bg-[#050915]/85 text-[#4DA6FF] border border-white/15 shadow-lg shadow-black/40"
        preventHideDuringClick={preventHideDuringClick}
      />
    </div>
  )
}

function FloatingIconLink({ href, label, icon, className, preventHideDuringClick }: { href: string; label: string; icon: ReactNode; className?: string; preventHideDuringClick: () => void }) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      onPointerDown={preventHideDuringClick}
      className={`group flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 ${className}`}
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
  preventHideDuringClick: () => void
}

function FloatingActionButton({
  onClick,
  icon,
  className,
  ariaLabel,
  preventHideDuringClick,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={preventHideDuringClick}
      aria-label={ariaLabel}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl backdrop-blur-sm transition hover:-translate-y-1 hover:scale-105 touch-manipulation ${className}`}
    >
      {icon}
    </button>
  )
}
