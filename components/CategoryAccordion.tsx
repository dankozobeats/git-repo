'use client'

import { useEffect, useRef, useState } from 'react'

export let scrollingByCode = false

export default function CategoryAccordion({
  id,
  openCategoryKey,
  setOpenCategoryKey,
  title,
  count,
  color,
  children,
  defaultOpen = false,
  className,
  headerClassName,
  contentClassName,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [isAccordionVisible, setAccordionVisible] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const accordionRef = useRef<HTMLDivElement>(null)
  const isControlled =
    typeof id === 'string' &&
    typeof openCategoryKey !== 'undefined' &&
    typeof setOpenCategoryKey === 'function'

  const isOpen = isControlled ? openCategoryKey === id : uncontrolledOpen

  const handleToggle = () => {
    if (isControlled && id) {
      setOpenCategoryKey(openCategoryKey === id ? null : id)
    } else {
      setUncontrolledOpen(prev => !prev)
    }
  }

  // Auto scroll when opened
  useEffect(() => {
    if (isOpen && accordionRef.current) {
      scrollingByCode = true
      accordionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      const timeout = setTimeout(() => {
        scrollingByCode = false
      }, 600)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  // Observe visibility but do NOT close too early
  useEffect(() => {
    if (!accordionRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAccordionVisible(entry.isIntersecting)
      },
      { threshold: 0.01 }  // 🔥 beaucoup moins agressif
    )
    observer.observe(accordionRef.current)
    return () => observer.disconnect()
  }, [])

  // Scroll-based auto-close with distance & delay
  useEffect(() => {
    if (!isControlled || typeof setOpenCategoryKey !== 'function') return

    let closeTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (!accordionRef.current) return

      const rect = accordionRef.current.getBoundingClientRect()

      if (isHovered) {
        if (closeTimeout) {
          clearTimeout(closeTimeout)
          closeTimeout = null
        }
        return
      }

      if (rect.bottom > 80 && rect.top < window.innerHeight - 80) {
        if (closeTimeout) {
          clearTimeout(closeTimeout)
          closeTimeout = null
        }
        return
      }

      if (scrollingByCode) return

      if (closeTimeout) clearTimeout(closeTimeout)
      closeTimeout = setTimeout(() => {
        setOpenCategoryKey(null)
        closeTimeout = null
      }, 1500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      if (closeTimeout) clearTimeout(closeTimeout)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isControlled, setOpenCategoryKey, isHovered])

  return (
    <div
      ref={accordionRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`overflow-hidden rounded-2xl border-0 bg-transparent sm:border sm:border-gray-800 sm:bg-black/30 ${
        className || ''
      }`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-white transition sm:rounded-none sm:px-4 sm:py-4 sm:bg-gray-900/70 sm:hover:bg-gray-900 ${
          headerClassName || ''
        }`}
        aria-expanded={isOpen}
        aria-controls={id ? `${id}-content` : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color || '#6b7280' }} />
          <span className="font-semibold text-left text-sm md:text-base">
            {title} ({count})
          </span>
        </div>
        <span className="text-gray-400 text-xs">{isOpen ? 'Fermer' : 'Ouvrir'}</span>
      </button>
      {isOpen && (
        <div
          id={id ? `${id}-content` : undefined}
          className={`px-0 py-0 sm:px-4 sm:py-4 ${contentClassName || ''}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
