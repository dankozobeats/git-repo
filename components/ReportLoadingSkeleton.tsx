'use client'

// Linear-inspired shimmering skeleton while the report is generated.

import { memo } from 'react'

function ReportLoadingSkeletonComponent() {
  return (
    <section className="rounded-[36px] border border-white/5 bg-white/[0.03] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/40 to-white/10 opacity-80" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded-full bg-white/20" />
          <div className="h-4 w-52 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 rounded-3xl border border-white/10 bg-white/[0.05] animate-pulse"
            style={{ animationDelay: `${index * 0.15}s` }}
          />
        ))}
      </div>
    </section>
  )
}

export default memo(ReportLoadingSkeletonComponent)
