'use client'

// Carte affichant la tendance hebdomadaire de complétion globale.

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export type WeeklyPoint = {
  week: string
  completion: number
}

type WeeklyTrendChartProps = {
  data: WeeklyPoint[]
}

export default function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  // Style commun aux chartes "glass".
  const cardClass =
    'glass-card min-h-[320px] w-full p-4 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.08)]'
  const axisColor = '#C5C8D0'

  // Rendu principal avec en-tête et courbe Recharts responsive.
  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-1 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Vue consolidée</p>
        <h3 className="text-xl font-semibold">Tendance par semaine</h3>
      </div>
      <div className="mt-4 w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#1f1f2b" strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{ fill: axisColor, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={16}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={48}
              domain={[0, 100]}
              tickFormatter={value => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(11,11,17,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 16,
                backdropFilter: 'blur(12px)',
              }}
              labelStyle={{ color: '#fff', fontWeight: 600 }}
              itemStyle={{ color: '#fff', fontWeight: 600 }}
              formatter={value => [`${value}%`, 'Complétion']}
            />
            <Line
              type="monotone"
              dataKey="completion"
              stroke="#B57BFF"
              strokeWidth={3}
              dot={{ r: 5, style: { filter: 'drop-shadow(0 0 8px rgba(181,123,255,0.6))' } }}
              style={{ filter: 'drop-shadow(0 0 12px rgba(181,123,255,0.35))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
