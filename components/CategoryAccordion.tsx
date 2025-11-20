'use client'

import { useState } from 'react'

type CategoryAccordionProps = {
  id?: string
  openId?: string | null
  onToggle?: (id: string) => void
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
  openId,
  onToggle,
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
  const isControlled = typeof id === 'string' && typeof openId !== 'undefined' && typeof onToggle === 'function'
  const isOpen = isControlled ? openId === id : uncontrolledOpen

  const handleToggle = () => {
    if (isControlled && id) {
      onToggle(id)
    } else {
      setUncontrolledOpen(prev => !prev)
    }
  }

  return (
    <div className={`border border-gray-800 rounded-xl overflow-hidden ${className || ''}`}>
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-900/70 hover:bg-gray-900 transition-colors ${
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
          className={`p-4 space-y-3 ${contentClassName || ''}`}
          role="region"
          aria-labelledby={id}
        >
          {children}
        </div>
      )}
    </div>
  )
}
