'use client'

// Modale riche pour afficher un rapport IA en Markdown avec sommaire interactif.

import { useMemo, useState } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { extractTOC, slugifyHeading, TOCEntry } from './TOCExtractor'

type AIReportModalProps = {
  open: boolean
  report: string | null
  title?: string
  onClose: () => void
}

export default function AIReportModal({ open, report, title, onClose }: AIReportModalProps) {
  const [fullScreen, setFullScreen] = useState(false)

  // Génère dynamiquement la table des matières en scannant le markdown.
  const toc = useMemo<TOCEntry[]>(() => (report ? extractTOC(report) : []), [report])

  if (!open || !report) return null

  // Permet d'ajouter des IDs prévisibles aux titres rendus par ReactMarkdown.
  function headingRenderer(level: number) {
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements
    const sizeClass = level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl'
    return (props: any) => {
      const { children } = props
      const plain = Array.isArray(children)
        ? children.map((child: any) => (typeof child === 'string' ? child : '')).join(' ')
        : typeof children === 'string'
          ? children
          : ''
      const id = slugifyHeading(plain)
      return (
        <Tag id={id} className={`${sizeClass} font-semibold mt-8 mb-3`}>
          {children}
        </Tag>
      )
    }
  }

  // Structure modale avec barre d'action, toc et contenu scrollable.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
      <div
        className={`w-full ${fullScreen ? 'max-w-7xl h-[92vh]' : 'max-w-5xl max-h-[85vh]'} rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl flex flex-col`}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-semibold">Rapport IA</p>
            <h2 className="text-2xl font-semibold text-white">{title || 'Rapport généré'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFullScreen(prev => !prev)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-100 hover:bg-white/10 transition"
              aria-label="Basculer plein écran"
            >
              {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-100 hover:bg-white/10 transition"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden divide-x divide-white/5">
          <aside className="hidden lg:block w-64 overflow-y-auto py-4 px-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Sommaire</h3>
            <nav className="space-y-2">
              {toc.length === 0 && <p className="text-xs text-gray-500">Pas de sections détectées.</p>}
              {toc.map(item => {
                const indent = item.level === 1 ? 'pl-0' : item.level === 2 ? 'pl-4' : 'pl-8'
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      const el = document.getElementById(item.id)
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className={`block w-full text-left text-sm text-gray-400 hover:text-white transition ${indent}`}
                  >
                    {item.title}
                  </button>
                )
              })}
            </nav>
          </aside>

          <section className="flex-1 overflow-y-auto px-6 py-6">
            <article className="prose prose-invert max-w-none text-gray-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: headingRenderer(1),
                  h2: headingRenderer(2),
                  h3: headingRenderer(3),
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-white/10">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="border border-white/10 px-3 py-2 text-left bg-white/5">{children}</th>,
                  td: ({ children }) => <td className="border border-white/10 px-3 py-2">{children}</td>,
                  ul: ({ children }) => <ul className="list-disc pl-6 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1">{children}</ol>,
                  code: (props: any) =>
                    props.inline ? (
                      <code className="rounded bg-white/10 px-1 py-0.5 text-xs">{props.children}</code>
                    ) : (
                      <code className="block rounded-xl bg-black/60 border border-white/10 px-4 py-3 text-sm">{props.children}</code>
                    ),
                }}
              >
                {report}
              </ReactMarkdown>
            </article>
          </section>
        </div>
      </div>
    </div>
  )
}
