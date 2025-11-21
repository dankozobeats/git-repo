'use client'

import { useState } from 'react'

type CategoryAccordionProps = {
  id?: string
  openCategoryId?: string | null
  setOpenCategoryId?: (id: string | null) => void
  title: string
  count: number
  color?: string | null
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export default function CategoryAccordion({
  id,
  openCategoryId,
  setOpenCategoryId,
  title,
  count,
  color,
  children,
  defaultOpen = false,
  className,
  headerClassName,
  contentClassName,
}: CategoryAccordionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled =
    typeof id === 'string' && typeof openCategoryId !== 'undefined' && typeof setOpenCategoryId === 'function'
  const isOpen = isControlled ? openCategoryId === id : uncontrolledOpen

  const handleToggle = () => {
    if (isControlled && id) {
      setOpenCategoryId(openCategoryId === id ? null : id)
    } else {
      setUncontrolledOpen(prev => !prev)
    }
  }

  return (
    <div
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
          role="region"
          aria-labelledby={id}
        >
          {children}
        </div>
      )}
    </div>
  )
}
