'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { WeeklyPerformancePoint } from '@/lib/habits/useWeeklyPerformance'

interface Props {
  data: WeeklyPerformancePoint[]
}

export function WeekdayPerformanceChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="day" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="rgba(255,255,255,0.45)"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="good" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="bad" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TooltipPayload {
  payload?: {
    fullDay: string
    good: number
    bad: number
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-xl border border-white/10 bg-gray-950/90 px-3 py-2 text-sm shadow-lg shadow-black/30">
      <p className="text-xs uppercase tracking-wide text-gray-400">{point.fullDay}</p>
      <p className="text-emerald-400">Good: {point.good}</p>
      <p className="text-red-400">Bad: {point.bad}</p>
    </div>
  )
}
