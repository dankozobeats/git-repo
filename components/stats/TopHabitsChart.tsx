'use client'

// Bar chart vertical affichant les habitudes les plus complétées.

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export type TopHabitPoint = {
  habit: string
  completion: number
}

type TopHabitsChartProps = {
  data: TopHabitPoint[]
}

export default function TopHabitsChart({ data }: TopHabitsChartProps) {
  // Style cartouche aligné sur les autres widgets analytics.
  const cardClass =
    'glass-card min-h-[320px] w-full p-4 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.08)]'
  const axisColor = '#C5C8D0'

  // Conteneur complet abritant un bar chart horizontal.
  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-1 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Classement</p>
        <h3 className="text-xl font-semibold">Top habitudes validées</h3>
      </div>
      <div className="mt-4 w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data].reverse()} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid stroke="#1f1f2b" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="habit"
              width={140}
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 12 }}
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
            <Bar
              dataKey="completion"
              fill="#2ECC71"
              radius={[0, 14, 14, 0]}
              barSize={18}
              style={{ filter: 'drop-shadow(0 0 12px rgba(46,204,113,0.35))' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
