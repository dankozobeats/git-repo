'use client'

/**
 * Description: Barre de filtres Linear-like pour piloter l'historique IA.
 * Objectif: Stabiliser les callbacks, offrir un design premium et une lecture instantanée.
 * Utilisation: <AIReportFilters filter={...} onFilterChange={...} sortAsc={...} onToggleSort={...} total={...} />
 */
import { memo } from 'react'
import { ArrowUpDown, Filter, Sparkles } from 'lucide-react'

import type { ReportFilterValue } from '@/hooks/useAIReportHistory'

type AIReportFiltersProps = {
  filter: ReportFilterValue
  onFilterChange: (value: ReportFilterValue) => void
  sortAsc: boolean
  onToggleSort: () => void
  total: number
}

const FILTER_OPTIONS: Array<{ label: string; value: ReportFilterValue }> = [
  { label: 'Tous', value: 'all' },
  { label: '7 jours', value: '7' },
  { label: '30 jours', value: '30' },
  { label: '90 jours', value: '90' },
]

function AIReportFiltersComponent({ filter, onFilterChange, sortAsc, onToggleSort, total }: AIReportFiltersProps) {
  return (
    <section className="rounded-[32px] border border-white/8 bg-white/5 px-6 py-5 shadow-[0_20px_60px_rgba(4,7,15,0.45)] backdrop-blur-2xl">
      <header className="flex flex-wrap items-center justify-between gap-4 text-white/70">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em]">
          <Filter className="h-3.5 w-3.5" />
          Filtres
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Sparkles className="h-3 w-3" /> {total} rapports
          </span>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {FILTER_OPTIONS.map(option => {
          const active = option.value === filter
          return (
            <button
              type="button"
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              aria-pressed={active}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#4C6EF5] to-[#A179FF] text-white shadow-[0_14px_35px_rgba(76,110,245,0.35)]'
                  : 'border border-white/10 bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onToggleSort}
          className="ml-auto inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortAsc ? 'Plus anciens' : 'Plus récents'}
        </button>
      </div>
    </section>
  )
}

const AIReportFilters = memo(AIReportFiltersComponent)
export default AIReportFilters
