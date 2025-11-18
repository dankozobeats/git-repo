'use client'

import { useState } from 'react'

type CategoryAccordionProps = {
  title: string
  count: number
  color?: string | null
  children: React.ReactNode
  defaultOpen?: boolean
}

export default function CategoryAccordion({
  title,
  count,
  color,
  children,
  defaultOpen = false,
}: CategoryAccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/70 hover:bg-gray-900 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color || '#6b7280' }}
          />
          <span className="font-semibold text-left text-sm md:text-base">
            {title} ({count})
          </span>
        </div>
        <span className="text-gray-400 text-xs">
          {open ? 'Fermer' : 'Ouvrir'}
        </span>
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  )
}
