'use client'

// Small inline error banner replacing window.alert for a smoother UX.

import { memo } from 'react'
import { AlertTriangle } from 'lucide-react'

interface InlineErrorProps {
  message: string
  onRetry?: () => void
}

function InlineErrorComponent({ message, onRetry }: InlineErrorProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/10"
        >
          Réessayer
        </button>
      )}
    </div>
  )
}

export default memo(InlineErrorComponent)
