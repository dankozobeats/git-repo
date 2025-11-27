'use client'

// Premium empty state shown while no report has been generated.

import { memo } from 'react'
import { LineChart } from 'lucide-react'

interface ReportEmptyStateProps {
  cta?: string
}

function ReportEmptyStateComponent({ cta }: ReportEmptyStateProps) {
  return (
    <section className="rounded-[36px] border border-dashed border-white/10 bg-white/[0.02] p-12 text-center shadow-[0_30px_80px_rgba(1,7,23,0.6)] backdrop-blur-2xl">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.08]">
        <LineChart className="h-10 w-10 text-white/70" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold text-white">Aucun rapport actif</h3>
      <p className="mt-3 text-sm text-white/60">
        Lance une génération pour découvrir les insights IA personnalisés sur tes habitudes.
      </p>
      {cta && <p className="mt-6 text-xs uppercase tracking-[0.5em] text-white/40">{cta}</p>}
    </section>
  )
}

export default memo(ReportEmptyStateComponent)
