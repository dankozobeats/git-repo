'use client'

// Premium card dedicated to the AI-generated report with multi-paragraph layout.

import { memo, useMemo } from 'react'
import { Sparkles } from 'lucide-react'

interface AIReportContentProps {
  report: string
}

function AIReportContentComponent({ report }: AIReportContentProps) {
  const paragraphs = useMemo(
    () =>
      report
        .trim()
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    [report],
  )

  return (
    <section className="rounded-[36px] border border-white/5 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 md:p-10 text-white shadow-[0_30px_80px_rgba(5,6,16,0.55)] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Rapport IA</p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold">
            <span className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            BadHabit Intelligence
          </h2>
        </div>
        <div className="text-sm text-white/60">Analyse générée par Gemini, adaptée à ta période</div>
      </div>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-white/80">
        {paragraphs.map((text, idx) => (
          <p key={idx} className="rounded-3xl bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
            {text}
          </p>
        ))}
      </div>
    </section>
  )
}

export default memo(AIReportContentComponent)
