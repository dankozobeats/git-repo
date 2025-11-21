'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export type WeeklyPoint = {
  week: string
  completion: number
}

type WeeklyTrendChartProps = {
  data: WeeklyPoint[]
}

export default function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Vue consolidée</p>
        <h3 className="text-xl font-semibold text-white">Tendance par semaine</h3>
      </div>
      <div className="w-full rounded-2xl bg-[#08080d] p-4 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#1f1f2b" strokeDasharray="3 3" />
            <XAxis dataKey="week" stroke="#9CA3AF" tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, 100]}
              tickFormatter={value => `${value}%`}
            />
            <Tooltip
              contentStyle={{ background: '#111119', border: '1px solid #2F2F3A', borderRadius: '12px' }}
              labelStyle={{ color: '#fff' }}
              formatter={value => [`${value}%`, 'Complétion']}
            />
            <Line type="monotone" dataKey="completion" stroke="#9B59B6" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
