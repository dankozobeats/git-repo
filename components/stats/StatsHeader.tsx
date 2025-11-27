'use client'

// Premium header for the stats dashboard: handles return action, title and period metadata.

import Link from 'next/link'
import { memo } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'

interface StatsHeaderProps {
  periodLabel: string
  description: string
}

function StatsHeaderComponent({ periodLabel, description }: StatsHeaderProps) {
  return (
    <header className="rounded-[42px] border border-white/10 bg-white/[0.06] p-6 md:p-10 shadow-[0_40px_120px_rgba(2,6,23,0.65)] backdrop-blur-2xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour dashboard
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Analytics</p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-semibold text-white md:text-4xl">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white/10">
                <Sparkles className="h-5 w-5 text-white" />
              </span>
              IA Habit Intelligence
            </h1>
            <p className="mt-3 text-sm text-white/70">{description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm text-white/70">
          <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 to-transparent px-5 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Période actuelle</p>
            <p className="mt-2 text-lg font-semibold text-white">{periodLabel}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-center text-xs uppercase tracking-[0.3em] text-white/60">
            Données consolidées par Gemini
          </div>
        </div>
      </div>
    </header>
  )
}

export default memo(StatsHeaderComponent)
