'use client'

import { useState } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { extractTOC } from './TOCExtractor'

type Props = {
  open: boolean
  report: string | null
  title?: string
  onClose: () => void
}

export default function AIReportModal({ open, report, title, onClose }: Props) {
  const [fullScreen, setFullScreen] = useState(false)

  if (!open || !report) return null

  const toc = extractTOC(report)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div
        className={`w-full ${fullScreen ? 'max-w-7xl h-[92vh]' : 'max-w-5xl max-h-[85vh]'
          } rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-semibold">
              Rapport IA
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {title || 'Rapport généré'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFullScreen(prev => !prev)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-100 hover:bg-white/10 transition"
            >
              {fullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-100 hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden divide-x divide-white/5">

          {/* TOC */}
          <aside className="hidden lg:block w-64 overflow-y-auto py-4 px-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Sommaire</h3>
            <nav className="space-y-2">
              {toc.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    const el = document.getElementById(item.id)
                    if (el) el.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`block w-full text-left text-sm text-gray-400 hover:text-white transition ${item.level === 1 ? '' : item.level === 2 ? 'pl-4' : 'pl-8'
                    }`}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* MARKDOWN */}
          <section className="flex-1 overflow-y-auto px-6 py-6">
            <MarkdownRenderer content={report} />
          </section>
        </div>
      </div>
    </div>
  )
}
