'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export type TopHabitPoint = {
  habit: string
  completion: number
}

type TopHabitsChartProps = {
  data: TopHabitPoint[]
}

export default function TopHabitsChart({ data }: TopHabitsChartProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Classement</p>
        <h3 className="text-xl font-semibold text-white">Top habitudes validées</h3>
      </div>
      <div className="w-full rounded-2xl bg-[#08080d] p-4 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data].reverse()} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#1f1f2b" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="habit"
              width={120}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#E5E7EB', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ background: '#111119', border: '1px solid #2F2F3A', borderRadius: '12px' }}
              labelStyle={{ color: '#fff' }}
              formatter={value => [`${value}%`, 'Complétion']}
            />
            <Bar dataKey="completion" fill="#2ECC71" radius={[0, 12, 12, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
