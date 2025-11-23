'use client'

import { useEffect, useState } from 'react'

type ScrollVisibilityOptions = {
  idleDelay?: number
  scrollDelta?: number
}

type ScrollDirection = 'up' | 'down'

export function useScrollVisibility(options: ScrollVisibilityOptions = {}) {
  const { idleDelay = 180, scrollDelta = 6 } = options
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('up')
  const [isIdle, setIsIdle] = useState(true)
  const [shouldShowMenu, setShouldShowMenu] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let lastScrollY = window.scrollY
    let frame: number | null = null
    let idleTimer: number | null = null

    const scheduleUpdate = () => {
      frame = null
      const currentY = window.scrollY
      const diff = currentY - lastScrollY

      if (diff > scrollDelta) {
        setScrollDirection('down')
        setShouldShowMenu(false)
        setIsIdle(false)
      } else if (diff < -scrollDelta) {
        setScrollDirection('up')
        setShouldShowMenu(true)
        setIsIdle(false)
      }

      lastScrollY = currentY

      if (idleTimer) {
        window.clearTimeout(idleTimer)
      }
      idleTimer = window.setTimeout(() => {
        setIsIdle(true)
        setShouldShowMenu(true)
      }, idleDelay)
    }

    const handleScroll = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(scheduleUpdate)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
      if (idleTimer) {
        window.clearTimeout(idleTimer)
      }
    }
  }, [idleDelay, scrollDelta])

  return { shouldShowMenu, scrollDirection, isIdle }
}

export default useScrollVisibility
