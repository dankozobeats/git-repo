'use client'

// Shared premium container for analytics charts/sections.

import { memo, type ReactNode } from 'react'

interface StatsCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

function StatsCardComponent({ title, subtitle, actions, children }: StatsCardProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">{title}</p>
          {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="min-h-[300px]">
        {children}
      </div>
    </section>
  )
}

export default memo(StatsCardComponent)
