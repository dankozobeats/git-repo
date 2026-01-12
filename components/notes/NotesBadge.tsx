'use client'

import { FileText } from 'lucide-react'
import Link from 'next/link'

interface NotesBadgeProps {
  habitId: string
  count: number
  variant?: 'default' | 'compact'
}

export default function NotesBadge({ habitId, count, variant = 'default' }: NotesBadgeProps) {
  if (count === 0) return null

  if (variant === 'compact') {
    return (
      <Link
        href={`/habits/${habitId}?tab=notes`}
        className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <FileText className="h-3 w-3" />
        <span>{count}</span>
      </Link>
    )
  }

  return (
    <Link
      href={`/habits/${habitId}?tab=notes`}
      className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-200 transition hover:border-blue-500/50 hover:bg-blue-500/20"
      onClick={(e) => e.stopPropagation()}
    >
      <FileText className="h-4 w-4" />
      <span>
        {count} {count === 1 ? 'note' : 'notes'}
      </span>
    </Link>
  )
}
