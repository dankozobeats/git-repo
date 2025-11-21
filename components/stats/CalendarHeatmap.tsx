'use client'

export type CalendarPoint = {
  date: string
  completion: number
}

type CalendarHeatmapProps = {
  data: CalendarPoint[]
}

const buckets = [0, 25, 50, 75, 100]

function getColor(value: number) {
  if (value >= 90) return '#34D399'
  if (value >= 60) return '#10B981'
  if (value >= 30) return '#059669'
  if (value > 0) return '#064E3B'
  return '#1F2937'
}

export default function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' })
  const byMonth = data.reduce<Record<string, CalendarPoint[]>>((acc, point) => {
    const month = monthFormatter.format(new Date(point.date))
    acc[month] = acc[month] || []
    acc[month].push(point)
    return acc
  }, {})

  const months = Object.keys(byMonth)
  const cardClass =
    'glass-card min-h-[320px] w-full p-4 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.08)]'

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-1 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">12 derniers mois</p>
        <h3 className="text-xl font-semibold">Calendrier de complétion</h3>
      </div>
      <div className="mt-4 w-full space-y-6">
        {months.length === 0 && <p className="text-sm text-white/60">Aucune donnée récente.</p>}
        {months.map(month => (
          <div key={month} className="space-y-2">
            <p className="text-sm text-white/60">{month}</p>
            <div className="grid grid-cols-7 gap-1 sm:grid-cols-14">
              {(byMonth[month] || []).map(point => (
                <div
                  key={point.date}
                  className="h-6 rounded-md border border-white/5 transition-colors"
                  style={{ backgroundColor: getColor(point.completion), filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.08))' }}
                  title={`${point.date} • ${point.completion}%`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/50">
        Intensité:
        {buckets.map(bucket => (
          <span key={bucket} className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: getColor(bucket) }} />
            {bucket}%
          </span>
        ))}
      </div>
    </div>
  )
}
