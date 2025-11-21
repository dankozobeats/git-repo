'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Trash2,
  Archive,
  ArrowLeft,
  LibraryBig,
  ArrowUpDown,
  GitCompare,
  BarChart3,
} from 'lucide-react'

import GraphAIStats from '@/components/GraphAIStats'
import AIDisciplineScore from '@/components/AIScoreCard'
import AIHeatmap from '@/components/AIHeatmap'
import AICalendarView from '@/components/AICalendarView'
import ReportModal from '@/components/ReportModal'

export default function HistoryPage() {
  const [reports, setReports] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [sortAsc, setSortAsc] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  async function loadReports() {
    const res = await fetch('/api/ai-reports')
    const data = await res.json()

    let items = data.reports || []

    if (filter !== 'all') {
      const days = Number(filter)
      const minDate = new Date()
      minDate.setDate(minDate.getDate() - days)
      items = items.filter((r: any) => new Date(r.created_at) >= minDate)
    }

    items.sort((a: any, b: any) =>
      sortAsc
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    setReports(items)
  }

  useEffect(() => {
    loadReports()
  }, [filter, sortAsc])

  async function deleteReport(id: string) {
    if (!confirm('Supprimer ce rapport ?')) return
    await fetch(`/api/ai-reports/${id}`, { method: 'DELETE' })
    loadReports()
  }

  async function archiveReport(id: string) {
    await fetch(`/api/ai-reports/${id}/archive`, { method: 'PATCH' })
    loadReports()
  }

  function compareSelected() {
    if (selected.length !== 2) return alert('Sélectionne exactement 2 rapports.')
    const [id1, id2] = selected
    window.location.href = `/reports/compare?id1=${id1}&id2=${id2}`
  }

  const reportsByDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    reports.forEach(report => {
      const key = formatDateKey(report.created_at)
      if (!map[key]) map[key] = []
      map[key].push(report)
    })
    return map
  }, [reports])

  const reportsForSelectedDate = selectedDate ? reportsByDate[selectedDate] ?? [] : []

  function handleDayClick(date: string) {
    setSelectedDate(date)
    const dayReports = reportsByDate[date] ?? []
    setSelectedReportId(dayReports[0]?.id ?? null)
    setModalOpen(dayReports.length > 0)
  }

  return (
    <main className="min-h-screen bg-[#121212] text-[#E0E0E0]">
      <header className="border-b border-white/5 bg-gradient-to-r from-[#1E1E1E] via-[#0F0F0F] to-[#1A1A1A]">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-white/70 transition hover:border-white/40"
          >
            <ArrowLeft className="h-4 w-4" /> Retour rapport
          </Link>
          <div className="text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Historique IA</p>
            <h1 className="mt-1 flex items-center justify-center gap-2 text-3xl font-bold text-white md:justify-start">
              <LibraryBig className="h-7 w-7 text-[#FF4D4D]" /> Bibliothèque des rapports
            </h1>
            <p className="text-sm text-white/60">Tous tes rapports auto-générés et archivables.</p>
          </div>
          <Link
            href="/reports/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
          >
            <BarChart3 className="h-4 w-4" /> Dashboard IA
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <section className="rounded-3xl border border-white/5 bg-[#121420] p-6 shadow-2xl shadow-black/40">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Aperçu global</p>
          <h2 className="text-2xl font-bold text-white">Insights automatiques</h2>
          <p className="text-sm text-white/60 mb-6">Synthèse des derniers rapports générés.</p>
          <AIDisciplineScore reports={reports} />
          <AIHeatmap reports={reports} />
          <AICalendarView reports={reports} onDayClick={handleDayClick} />
        </section>

        <section className="rounded-3xl border border-white/5 bg-[#1B1B24] p-6 shadow-2xl shadow-black/40 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {[{ label: 'Tous', value: 'all' }, { label: '7 jours', value: '7' }, { label: '30 jours', value: '30' }, { label: '90 jours', value: '90' }].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  filter === btn.value
                    ? 'border-[#FF4D4D] bg-[#FF4D4D]/10 text-white shadow-[0_0_20px_rgba(255,77,77,0.2)]'
                    : 'border-white/10 bg-black/20 text-white/60 hover:border-white/30'
                }`}
              >
                {btn.label}
              </button>
            ))}

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/70 transition hover:border-white/30"
            >
              <ArrowUpDown className="h-4 w-4" /> {sortAsc ? 'Plus anciens' : 'Plus récents'}
            </button>
          </div>

          <GraphAIStats reports={reports} />

          {selected.length >= 2 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center gap-3 text-sm">
              <GitCompare className="h-5 w-5 text-[#9B59B6]" />
              <span>
                <strong>{selected.length}</strong> rapports sélectionnés
              </span>
              <button
                onClick={compareSelected}
                className="ml-auto rounded-full bg-[#9B59B6] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#9B59B6]/40"
              >
                Comparer
              </button>
            </div>
          )}
        </section>

        <section className="space-y-4">
          {reports.map((r) => (
            <article
              key={r.id}
              id={`report-${r.id}`}
              className="rounded-3xl border border-white/5 bg-[#0F0F13] p-5 shadow-lg shadow-black/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="text-xs uppercase tracking-[0.3em] text-white/40">
                  {new Date(r.created_at).toLocaleString('fr-FR')}
                </div>
                <div className="flex gap-3 text-white/60">
                  <button onClick={() => archiveReport(r.id)} className="hover:text-white">
                    <Archive className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteReport(r.id)} className="text-[#FF4D4D] hover:text-[#ff7070]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/70">
                Rapport généré automatiquement. Consulte les détails via le calendrier.
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                <label className="inline-flex items-center gap-2 text-xs text-white/50">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-black/40"
                    checked={selected.includes(r.id)}
                    onChange={() =>
                      setSelected((sel) =>
                        sel.includes(r.id) ? sel.filter((x) => x !== r.id) : [...sel, r.id]
                      )
                    }
                  />
                  Sélectionner pour comparaison
                </label>
              </div>
            </article>
          ))}
        </section>
      </div>

      <ReportModal
        open={modalOpen}
        date={selectedDate}
        reports={reportsForSelectedDate}
        selectedReportId={selectedReportId}
        onSelectReport={id => setSelectedReportId(id)}
        onClose={() => {
          setModalOpen(false)
          setSelectedReportId(null)
        }}
      />
    </main>
  )
}

function formatDateKey(date: string | Date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().split('T')[0]
}
