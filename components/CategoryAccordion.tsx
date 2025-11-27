'use client'

// Accordéon client contrôlé/auto pour regrouper les habitudes par catégorie avec animation douce.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import animateAndCenterCategoryAccordion from '@/lib/ui/scroll'

type CategoryAccordionProps = {
  id: string
  title: string
  count?: number
  color?: string | null
  children: ReactNode
  openCategoryKey?: string | null
  setOpenCategoryKey?: (id: string | null) => void
  defaultOpen?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  onToggleOpen?: (open: boolean, id: string) => void
}

export default function CategoryAccordion({
  id,
  title,
  count = 0,
  color,
  children,
  openCategoryKey,
  setOpenCategoryKey,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
  onToggleOpen,
}: CategoryAccordionProps) {
  // Permet de fonctionner en mode contrôlé ou non selon les props.
  const isControlled = typeof openCategoryKey !== 'undefined' && typeof setOpenCategoryKey === 'function'
  const [internalValue, setInternalValue] = useState(defaultOpen ? id : '')
  const accordionValue = isControlled ? openCategoryKey ?? '' : internalValue
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [opening, setOpening] = useState(false)
  const previousOpenRef = useRef<boolean>(defaultOpen)

  // Détermine la couleur d'accent utilisée dans l'entête.
  const accentColor = useMemo(() => color || '#6b7280', [color])

  // Synchronise l'état du composant avec Radix en fonction du mode contrôlé.
  const handleChange = (nextValue: string) => {
    if (isControlled && setOpenCategoryKey) {
      setOpenCategoryKey(nextValue === id ? id : null)
    } else {
      setInternalValue(nextValue)
    }
  }

  const isOpen = accordionValue === id

  // Informe le parent quand l'accordéon passe ouvert/fermé.
  useEffect(() => {
    onToggleOpen?.(isOpen, id)
  }, [isOpen, onToggleOpen, id])

  // Gère la classe "opening" pour déclencher l'animation de centrage.
  useEffect(() => {
    let timer: number | null = null
    if (isOpen && !previousOpenRef.current) {
      setOpening(true)
      animateAndCenterCategoryAccordion(wrapperRef.current)
      timer = window.setTimeout(() => {
        setOpening(false)
      }, 300)
    }
    if (!isOpen && previousOpenRef.current) {
      setOpening(false)
    }

    previousOpenRef.current = isOpen

    return () => {
      if (timer) {
        window.clearTimeout(timer)
      }
    }
  }, [isOpen])

  const animationClass = isOpen || opening ? 'opacity-100 scale-100' : 'opacity-80 scale-95'

  // Rend l'accordéon Radix avec un trigger stylisé et le contenu enfant.
  return (
    <div ref={wrapperRef} className={`transition-all duration-300 ease-out ${animationClass}`}>
      <Accordion.Root
        type="single"
        collapsible
        value={accordionValue}
        onValueChange={handleChange}
        className={`relative z-0 w-full text-white ${className}`}
      >
        <Accordion.Item value={id} className="overflow-hidden rounded-2xl">
          <Accordion.Header>
            <Accordion.Trigger
              className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${headerClassName}`}
              data-floating-hide-on-press
            >
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full shadow" style={{ backgroundColor: accentColor }} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold sm:text-base">{title}</span>
                  <span className="text-xs text-white/60">
                    {count} habitude{count > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60 transition-transform duration-200 data-[state=open]:rotate-180">
                ▼
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content
            className={`overflow-hidden px-3 py-3 text-white/80 transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:max-h-[60vh] data-[state=open]:overflow-y-auto data-[state=open]:pr-3 sm:px-5 sm:py-5 ${contentClassName}`}
          >
            {children}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}
