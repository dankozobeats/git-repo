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

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">12 derniers mois</p>
        <h3 className="text-xl font-semibold text-white">Calendrier de complétion</h3>
      </div>
      <div className="min-h-[360px] w-full rounded-2xl bg-[#08080d] p-4 space-y-6">
        {months.length === 0 && <p className="text-sm text-white/60">Aucune donnée récente.</p>}
        {months.map(month => (
          <div key={month} className="space-y-2">
            <p className="text-sm text-white/60">{month}</p>
            <div className="grid grid-cols-14 gap-1">
              {(byMonth[month] || []).map(point => (
                <div
                  key={point.date}
                  className="h-6 rounded-md border border-white/5"
                  style={{ backgroundColor: getColor(point.completion) }}
                  title={`${point.date} • ${point.completion}%`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-white/50">
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
