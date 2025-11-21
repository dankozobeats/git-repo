'use client'

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { DailyPoint } from '@/lib/habits/useHabitStats'

type Props = {
  data: DailyPoint[]
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' })

const formatDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`)
  return dateFormatter.format(parsed)
}

export function DailyBars({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="date"
            stroke="rgba(255,255,255,0.45)"
            tickFormatter={formatDate}
            tickLine={false}
            axisLine={false}
          />
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

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const good = payload.find((p: any) => p.dataKey === 'good')
  const bad = payload.find((p: any) => p.dataKey === 'bad')

  return (
    <div className="rounded-xl border border-white/10 bg-gray-950/90 px-3 py-2 text-sm shadow-lg shadow-black/30">
      <p className="text-xs uppercase tracking-wide text-gray-400">{formatDate(label)}</p>
      <p className="text-emerald-400">Good: {good?.value ?? 0}</p>
      <p className="text-red-400">Bad: {bad?.value ?? 0}</p>
    </div>
  )
}
