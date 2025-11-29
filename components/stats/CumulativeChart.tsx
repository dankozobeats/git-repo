'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import type { CumulativePoint } from '@/lib/habits/useHabitStats'

type Props = {
  data: CumulativePoint[]
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
})

const formatDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`)
  return dateFormatter.format(parsed)
}

export function CumulativeChart({ data }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="goodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="badGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
          <Line
            type="monotone"
            dataKey="goodCum"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            fillOpacity={1}
            fill="url(#goodGradient)"
          />
          <Line
            type="monotone"
            dataKey="badCum"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            fillOpacity={1}
            fill="url(#badGradient)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface TooltipPayloadItem {
  dataKey: string
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const good = payload.find((p) => p.dataKey === 'goodCum')
  const bad = payload.find((p) => p.dataKey === 'badCum')

  return (
    <div className="rounded-xl border border-white/10 bg-gray-950/90 px-3 py-2 text-sm shadow-lg shadow-black/30">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label ? formatDate(label) : ''}</p>
      <p className="text-emerald-400">Good: {good?.value ?? 0}</p>
      <p className="text-red-400">Bad: {bad?.value ?? 0}</p>
    </div>
  )
}
