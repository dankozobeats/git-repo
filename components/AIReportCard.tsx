'use client'

/**
 * Description: Carte mémoïsée premium pour consulter un rapport IA individuel.
 * Objectif: Offrir un aperçu rapide, des métriques contextuelles et des actions instantanées.
 * Utilisation: <AIReportCard report={report} onArchive={...} onDelete={...} onPreview={...} />
 */
import { memo, useCallback, useMemo } from 'react'
import { Archive, Eye, Sparkles, Trash2 } from 'lucide-react'

import type { AIReportRecord } from '@/hooks/useAIReportHistory'
import { formatDateHuman } from '@/lib/date-utils'

type AIReportCardProps = {
  report: AIReportRecord
  onArchive: (id: string) => void
  onDelete: (report: AIReportRecord) => void
  onPreview: (report: AIReportRecord) => void
}

type ReportStats = {
  discipline_score?: number
  currentStreak?: number
  goodLogs?: number
}

function AIReportCardComponent({ report, onArchive, onDelete, onPreview }: AIReportCardProps) {
  const createdAtLabel = useMemo(() => formatDateHuman(report.created_at, { includeTime: true }), [report.created_at])
  const archivedLabel = useMemo(
    () => (report.archived_at ? `Archivé le ${formatDateHuman(report.archived_at, { includeTime: true })}` : null),
    [report.archived_at]
  )
  const stats = report.stats as ReportStats | undefined
  const disciplineScore = typeof stats?.discipline_score === 'number' ? stats.discipline_score : null
  const currentStreak = typeof stats?.currentStreak === 'number' ? stats.currentStreak : null
  const achievements = typeof stats?.goodLogs === 'number' ? stats.goodLogs : null
  const isArchived = Boolean(report.archived_at)

  const handleArchive = useCallback(() => onArchive(report.id), [onArchive, report.id])
  const handleDelete = useCallback(() => onDelete(report), [onDelete, report])
  const handlePreview = useCallback(() => onPreview(report), [onPreview, report])

  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-white/8 bg-white/5 p-6 shadow-[0_20px_60px_rgba(5,6,15,0.45)] transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#5B8DEF]/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
      <div className="relative">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/45">Rapport automatisé</p>
            <p className="mt-1 text-sm font-medium text-white/80">{createdAtLabel}</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isArchived ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/10 text-white/80'}`}>
            <Sparkles className="h-3.5 w-3.5" />
            {isArchived ? 'Archivé' : 'Actif'}
          </span>
        </header>

        <p className="mt-5 line-clamp-4 text-sm leading-relaxed text-white/75">{report.report}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/65">
          {disciplineScore !== null && (
            <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1">
              Discipline IA · {disciplineScore}%
            </span>
          )}
          {currentStreak !== null && (
            <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1">
              Streak · {currentStreak} j
            </span>
          )}
          {achievements !== null && (
            <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1">
              Validation · {achievements}
            </span>
          )}
        </div>

        {archivedLabel && <p className="mt-3 text-xs text-white/50">{archivedLabel}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition-all duration-300 hover:border-white/30 hover:bg-white/10 sm:flex-none"
          >
            <Eye className="h-4 w-4" />
            Ouvrir
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={isArchived}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300 ${
              isArchived
                ? 'cursor-not-allowed border border-white/10 bg-white/5 text-white/40'
                : 'border border-white/10 bg-gradient-to-r from-[#4B6BFF]/80 to-[#7C4DFF]/80 text-white hover:shadow-[0_15px_35px_rgba(76,110,255,0.35)]'
            }`}
          >
            <Archive className="h-4 w-4" />
            Archiver
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition-all duration-300 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>
    </article>
  )
}

const AIReportCard = memo(AIReportCardComponent)
export default AIReportCard
