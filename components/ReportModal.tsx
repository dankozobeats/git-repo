'use client'

import { Fragment } from 'react'
import { X } from 'lucide-react'

export type ReportModalProps = {
  open: boolean
  date: string | null
  reports: Array<{ id: string; created_at: string; report: string }>
  selectedReportId: string | null
  onSelectReport: (id: string) => void
  onClose: () => void
}

export default function ReportModal({ open, date, reports, selectedReportId, onSelectReport, onClose }: ReportModalProps) {
  if (!open) return null

  const activeReport = reports.find(r => r.id === selectedReportId) || reports[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_0_40px_rgba(255,77,109,0.25)] backdrop-blur-xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Rapports du</p>
            <h3 className="text-2xl font-semibold">{date ?? 'Date inconnue'}</h3>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/20 p-2 text-white/70 transition hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-white/70">Aucun rapport enregistré pour cette journée.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-[220px,1fr]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2 max-h-[360px] overflow-y-auto">
              {reports.map(report => {
                const time = new Date(report.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const isActive = report.id === activeReport?.id
                return (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'border-[#FF4D4D] bg-[#FF4D4D]/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-[0.3em] text-white/50">{time}</span>
                    <p className="line-clamp-2 text-sm">{report.report}</p>
                  </button>
                )
              })}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 max-h-[360px] overflow-y-auto">
              <p className="text-sm text-white/60">Rapport sélectionné</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-white/90">
                {activeReport?.report || 'Sélectionne un rapport pour lire son contenu.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
