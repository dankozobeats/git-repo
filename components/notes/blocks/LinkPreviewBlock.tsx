'use client'

import { useState } from 'react'
import { ExternalLink, ListTodo, FileText } from 'lucide-react'
import type { LinkPreviewBlock as LinkPreviewBlockType } from '@/types/notes'

interface LinkPreviewBlockProps {
  block: LinkPreviewBlockType
  habitId: string
  noteId: string
  onCreateTask?: (title: string, url: string, type: 'article') => void
}

export default function LinkPreviewBlock({
  block,
  habitId,
  noteId,
  onCreateTask,
}: LinkPreviewBlockProps) {
  const [showTaskModal, setShowTaskModal] = useState(false)

  const { url, title, description, image, favicon } = block.content

  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const handleCreateTask = () => {
    if (onCreateTask && title) {
      onCreateTask(title, url, 'article')
      setShowTaskModal(false)
    }
  }

  return (
    <div className="group relative my-4">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/10"
      >
        <div className="flex gap-4">
          {/* Image de prévisualisation (si disponible) */}
          {image && (
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden bg-white/5 sm:h-40 sm:w-40">
              <img
                src={image}
                alt={title || 'Preview'}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Contenu */}
          <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
            <div>
              {/* Titre */}
              {title && (
                <h4 className="mb-2 font-semibold text-white line-clamp-2">
                  {title}
                </h4>
              )}

              {/* Description */}
              {description && (
                <p className="mb-3 text-sm text-white/60 line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* Footer avec domaine et icône */}
            <div className="flex items-center gap-2">
              {favicon && (
                <img
                  src={favicon}
                  alt=""
                  className="h-4 w-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <span className="text-xs text-white/50">{getDomain(url)}</span>
              <ExternalLink className="ml-auto h-4 w-4 text-white/40" />
            </div>
          </div>
        </div>
      </a>

      {/* Bouton "Créer une tâche" (visible au hover) */}
      {onCreateTask && (
        <button
          onClick={(e) => {
            e.preventDefault()
            setShowTaskModal(true)
          }}
          className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-black/80 px-3 py-2 text-sm font-medium text-white opacity-0 backdrop-blur-sm transition hover:bg-black/90 group-hover:opacity-100"
          title="Créer une tâche pour lire cet article"
        >
          <ListTodo className="h-4 w-4" />
          <span className="hidden sm:inline">Créer une tâche</span>
        </button>
      )}

      {/* Modal de création de tâche */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0d0f17] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <FileText className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Créer une tâche</h3>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white/70">
                Titre de la tâche
              </label>
              <input
                type="text"
                defaultValue={title || 'Lire cet article'}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="mb-6 rounded-lg bg-white/5 p-3">
              <p className="text-sm text-white/70">
                <strong className="text-white">Article :</strong> {title || 'Sans titre'}
              </p>
              <p className="mt-1 text-xs text-white/50">{getDomain(url)}</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTask}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Créer la tâche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
