'use client'

// Consistent error/empty feedback block for the analytics area.

import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface StatsErrorStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'default' | 'warning'
}

function StatsErrorStateComponent({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: StatsErrorStateProps) {
  const borderColor = variant === 'warning' ? 'border-amber-500/40' : 'border-rose-500/40'
  const bgColor = variant === 'warning' ? 'bg-amber-500/10' : 'bg-rose-500/10'

  return (
    <div className={`rounded-[32px] border ${borderColor} ${bgColor} p-6 text-center text-white shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="mt-2 text-sm text-white/70">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default memo(StatsErrorStateComponent)
