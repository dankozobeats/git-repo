'use client'

// Skeleton loader displayed while analytics data is being prepared.

import { memo } from 'react'

interface StatsLoadingSkeletonProps {
  rows?: number
  height?: 'sm' | 'md' | 'lg'
}

function StatsLoadingSkeletonComponent({ rows = 3, height = 'lg' }: StatsLoadingSkeletonProps) {
  const blockHeight = height === 'sm' ? 'h-16' : height === 'md' ? 'h-28' : 'h-40'

  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className={`${blockHeight} rounded-[32px] border border-white/10 bg-white/[0.04] animate-pulse`}
          style={{ animationDelay: `${row * 120}ms` }}
        />
      ))}
    </div>
  )
}

export default memo(StatsLoadingSkeletonComponent)
