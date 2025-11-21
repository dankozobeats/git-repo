'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export type WeekdayPoint = {
  day: string
  completion: number
}

type WeekdayChartProps = {
  data: WeekdayPoint[]
}

export default function WeekdayChart({ data }: WeekdayChartProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Moyenne par jour</p>
        <h3 className="text-xl font-semibold text-white">Performance hebdomadaire</h3>
      </div>
      <div className="w-full rounded-2xl bg-[#08080d] p-4 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#1f1f2b" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#9CA3AF" tickLine={false} axisLine={false} />
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
            <Bar dataKey="completion" fill="#4DA6FF" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
