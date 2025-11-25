'use client'

import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { useScrollVisibility } from '@/hooks/useScrollVisibility'

type MobileHamburgerMenuProps = {
  onOpen: () => void
  isMenuOpen?: boolean
}

type SearchMetrics = {
  top: number
  bottom: number
  isVisible: boolean
} | null

export default function MobileHamburgerMenu({ onOpen, isMenuOpen = false }: MobileHamburgerMenuProps) {
  const { shouldShowMenu } = useScrollVisibility()
  const searchElementRef = useRef<HTMLElement | null>(null)
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    searchElementRef.current = document.querySelector<HTMLElement>('[data-mobile-search]')
    const element = searchElementRef.current
    if (!element) return

    // Keep live metrics of the search field to decide if the menu should move or hide.
    const updateMetrics = () => {
      if (!searchElementRef.current) return
      const rect = searchElementRef.current.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0
      setSearchMetrics({
        top: rect.top,
        bottom: rect.bottom,
        isVisible,
      })
    }

    updateMetrics()

    window.addEventListener('scroll', updateMetrics, { passive: true })
    window.addEventListener('resize', updateMetrics)

    const handleFocusIn = () => setIsSearchFocused(true)
    const handleFocusOut = () => setIsSearchFocused(false)

    element.addEventListener('focusin', handleFocusIn)
    element.addEventListener('focusout', handleFocusOut)

    return () => {
      window.removeEventListener('scroll', updateMetrics)
      window.removeEventListener('resize', updateMetrics)
      element.removeEventListener('focusin', handleFocusIn)
      element.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  const MENU_HEIGHT = 52
  const BASE_TOP = 12
  const SEARCH_BUFFER = 12

  const shouldOffsetForSearch =
    Boolean(searchMetrics?.isVisible) && (searchMetrics?.top ?? 0) < BASE_TOP + MENU_HEIGHT
  const targetTop = shouldOffsetForSearch
    ? Math.max((searchMetrics?.bottom ?? 0) + SEARCH_BUFFER, BASE_TOP)
    : BASE_TOP

  const searchWouldBeBlocked =
    Boolean(searchMetrics?.isVisible) &&
    targetTop < (searchMetrics?.bottom ?? 0) &&
    targetTop + MENU_HEIGHT > (searchMetrics?.top ?? 0)

  const canDisplayMenu = shouldShowMenu && !isSearchFocused && !searchWouldBeBlocked && !isMenuOpen

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ouvrir le menu principal"
      className={`fixed right-3 z-[1200] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-[#050915]/95 text-white shadow-2xl transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D4D]/60 md:hidden ${
        canDisplayMenu ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
      }`}
      style={{ top: targetTop }}
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
