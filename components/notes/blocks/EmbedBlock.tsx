'use client'

import { useState } from 'react'
import ReactPlayer from 'react-player'
import { ListTodo, ExternalLink, Play } from 'lucide-react'
import type { EmbedBlock as EmbedBlockType } from '@/types/notes'

interface EmbedBlockProps {
  block: EmbedBlockType
  habitId: string
  noteId: string
  onCreateTask?: (title: string, url: string, type: 'video') => void
}

export default function EmbedBlock({ block, habitId, noteId, onCreateTask }: EmbedBlockProps) {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const { url, provider, thumbnail, title, embedId } = block.content

  const handleCreateTask = () => {
    if (onCreateTask && title) {
      onCreateTask(title, url, 'video')
      setShowTaskModal(false)
    }
  }

  // URLs pour les embeds
  const getEmbedUrl = () => {
    switch (provider) {
      case 'youtube':
        return `https://www.youtube.com/embed/${embedId}`
      case 'vimeo':
        return `https://player.vimeo.com/video/${embedId}`
      case 'spotify':
        return `https://open.spotify.com/embed/${embedId}`
      default:
        return url
    }
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-white/10 bg-white/5">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        {provider === 'tiktok' ? (
          // TikTok nécessite un iframe spécial
          <div
            className="h-full w-full"
            dangerouslySetInnerHTML={{
              __html: `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${embedId}"><section></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`,
            }}
          />
        ) : (
          <ReactPlayer
            url={getEmbedUrl()}
            width="100%"
            height="100%"
            controls
            light={thumbnail || true}
            playing={isPlaying}
            onPlay={() => setIsPlaying(true)}
            config={{
              youtube: {
                playerVars: { modestbranding: 1, rel: 0 },
              },
            }}
          />
        )}

        {/* Overlay avec actions (visible au hover) */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition hover:bg-purple-700 hover:scale-110"
            >
              <Play className="h-8 w-8" fill="currentColor" />
            </button>
          )}
        </div>

        {/* Bouton "Créer une tâche" (coin supérieur droit) */}
        {onCreateTask && (
          <button
            onClick={() => setShowTaskModal(true)}
            className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-black/80 px-3 py-2 text-sm font-medium text-white opacity-0 backdrop-blur-sm transition hover:bg-black/90 group-hover:opacity-100"
            title="Créer une tâche à partir de cette vidéo"
          >
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Créer une tâche</span>
          </button>
        )}
      </div>

      {/* Métadonnées de la vidéo */}
      {(title || provider) && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {title && <p className="font-medium text-white line-clamp-2">{title}</p>}
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
                  {provider === 'youtube' && '📺 YouTube'}
                  {provider === 'tiktok' && '🎵 TikTok'}
                  {provider === 'vimeo' && '🎬 Vimeo'}
                  {provider === 'spotify' && '🎧 Spotify'}
                </span>
              </div>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Modal de création de tâche */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0d0f17] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Créer une tâche</h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-white/70">
                Titre de la tâche
              </label>
              <input
                type="text"
                defaultValue={title || 'Regarder cette vidéo'}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:border-purple-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="mb-6">
              <p className="text-sm text-white/50">
                Une tâche sera créée pour suivre le visionnage de cette vidéo.
              </p>
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
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
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
