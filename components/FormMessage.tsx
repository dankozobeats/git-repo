'use client'

// Message compact utilisé sous les champs pour signaler les erreurs SMART de façon élégante.
import { CircleAlert } from 'lucide-react'
import { memo } from 'react'

type FormMessageProps = {
  type?: 'error' | 'warning'
  message?: string | null
}

function FormMessageComponent({ type = 'error', message }: FormMessageProps) {
  if (!message) return null
  const colorClasses =
    type === 'error'
      ? 'border-red-500/20 bg-red-500/10 text-red-300'
      : 'border-amber-500/20 bg-amber-500/10 text-amber-200'

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-inner shadow-black/20 transition-opacity animate-in fade-in ${colorClasses}`}
    >
      <CircleAlert className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

const FormMessage = memo(FormMessageComponent)
FormMessage.displayName = 'FormMessage'

export default FormMessage
