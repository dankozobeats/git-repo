'use client'

import { useMemo, useState, type ReactNode } from 'react'
import * as Accordion from '@radix-ui/react-accordion'

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
}: CategoryAccordionProps) {
  const isControlled = typeof openCategoryKey !== 'undefined' && typeof setOpenCategoryKey === 'function'
  const [internalValue, setInternalValue] = useState(defaultOpen ? id : '')
  const accordionValue = isControlled ? openCategoryKey ?? '' : internalValue

  const accentColor = useMemo(() => color || '#6b7280', [color])

  const handleChange = (nextValue: string) => {
    if (isControlled && setOpenCategoryKey) {
      setOpenCategoryKey(nextValue === id ? id : null)
    } else {
      setInternalValue(nextValue)
    }
  }

  return (
    <Accordion.Root
      type="single"
      collapsible
      value={accordionValue}
      onValueChange={handleChange}
      className={`relative z-0 w-full rounded-2xl border border-white/10 bg-[#11131c]/70 text-white shadow-lg shadow-black/30 ${className}`}
    >
      <Accordion.Item value={id} className="overflow-hidden rounded-2xl">
        <Accordion.Header>
          <Accordion.Trigger
            className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${headerClassName}`}
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
          className={`overflow-hidden border-t border-white/10 px-3 py-3 text-white/80 transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down sm:px-5 sm:py-5 ${contentClassName}`}
        >
          {children}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}
