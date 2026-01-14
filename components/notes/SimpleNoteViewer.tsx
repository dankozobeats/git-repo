'use client'

import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Media {
  id: string
  type: 'video' | 'image'
  url: string
}

interface Task {
  id: string
  title: string
  completed: boolean
}

interface SimpleNoteViewerProps {
  text: string
  media: Media[]
  tasks: Task[]
  onToggleTask?: (taskId: string) => void
}

// Extraire l'ID YouTube d'une URL
function getYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Détecter le type de vidéo
function getVideoType(url: string): 'youtube' | 'tiktok' | 'vimeo' | 'instagram' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('vimeo.com')) return 'vimeo'
  if (url.includes('instagram.com')) return 'instagram'
  return 'other'
}

// Extraire l'ID Vimeo
function getVimeoId(url: string): string | null {
  const regex = /vimeo\.com\/(?:video\/)?(\d+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Extraire l'ID TikTok
function getTikTokId(url: string): string | null {
  // Formats: tiktok.com/@user/video/1234567890 ou vm.tiktok.com/xxxxx
  const regex = /tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)?(\d+)|vm\.tiktok\.com\/([\w]+)/
  const match = url.match(regex)
  return match ? (match[1] || match[2]) : null
}

// Extraire l'ID Instagram
function getInstagramId(url: string): string | null {
  // Formats: instagram.com/p/xxxxx ou instagram.com/reel/xxxxx
  const regex = /instagram\.com\/(?:p|reel|tv)\/([\w-]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

export default function SimpleNoteViewer({ text, media, tasks, onToggleTask }: SimpleNoteViewerProps) {
  const [isTextOpen, setIsTextOpen] = useState(false)
  const [isMediaOpen, setIsMediaOpen] = useState(false)
  const [isTasksOpen, setIsTasksOpen] = useState(false)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const [loadedVideoIds, setLoadedVideoIds] = useState<string[]>([])

  const renderVideo = (id: string, url: string, isEmbedActive: boolean) => {
    const type = getVideoType(url)

    if (type === 'youtube') {
      const videoId = getYouTubeId(url)
      if (!videoId) return <p className="text-red-400">URL YouTube invalide</p>

      return (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black" style={{ paddingTop: '56.25%' }}>
            {isEmbedActive ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
                title="YouTube video"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
              />
            ) : (
              <button
                onClick={() => setLoadedVideoIds((prev) => [...prev, id])}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 transition hover:text-white"
              >
                <span className="text-4xl">▶️</span>
                <span className="text-sm">Afficher la vidéo</span>
              </button>
            )}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="mb-2 text-xs text-white/60">Si la vidéo ne s'affiche pas:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
            >
              <span>🔗</span>
              <span className="truncate">{url}</span>
            </a>
          </div>
        </div>
      )
    }

    if (type === 'vimeo') {
      const videoId = getVimeoId(url)
      if (!videoId) return <p className="text-red-400">URL Vimeo invalide</p>

      return (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black" style={{ paddingTop: '56.25%' }}>
            {isEmbedActive ? (
              <iframe
                src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
                title="Vimeo video"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
              />
            ) : (
              <button
                onClick={() => setLoadedVideoIds((prev) => [...prev, id])}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 transition hover:text-white"
              >
                <span className="text-4xl">▶️</span>
                <span className="text-sm">Afficher la vidéo</span>
              </button>
            )}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="mb-2 text-xs text-white/60">Si la vidéo ne s'affiche pas:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
            >
              <span>🔗</span>
              <span className="truncate">{url}</span>
            </a>
          </div>
        </div>
      )
    }

    if (type === 'tiktok') {
      const videoId = getTikTokId(url)

      // TikTok embed fonctionne avec blockquote + script, mais difficile en React
      // On affiche un lien direct avec preview
      return (
        <div className="space-y-3">
          <div className="rounded-lg border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-purple-500/10 p-6 text-center">
            <div className="mb-4 text-5xl">📱</div>
            <p className="mb-3 text-lg font-semibold text-white">Vidéo TikTok</p>
            <p className="mb-4 text-sm text-white/60">
              Les vidéos TikTok ne peuvent pas être intégrées directement
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
            >
              <span>🎵</span>
              <span>Voir sur TikTok</span>
            </a>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
            >
              <span>🔗</span>
              <span className="truncate">{url}</span>
            </a>
          </div>
        </div>
      )
    }

    if (type === 'instagram') {
      const postId = getInstagramId(url)
      if (!postId) return <p className="text-red-400">URL Instagram invalide</p>

      return (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black" style={{ paddingTop: '125%', maxWidth: '540px', margin: '0 auto' }}>
            {isEmbedActive ? (
              <iframe
                src={`https://www.instagram.com/p/${postId}/embed/`}
                allowFullScreen
                className="absolute inset-0 h-full w-full"
                title="Instagram post"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
              />
            ) : (
              <button
                onClick={() => setLoadedVideoIds((prev) => [...prev, id])}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70 transition hover:text-white"
              >
                <span className="text-4xl">📷</span>
                <span className="text-sm">Afficher le post</span>
              </button>
            )}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="mb-2 text-xs text-white/60">Si le post ne s'affiche pas:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:underline"
            >
              <span>🔗</span>
              <span className="truncate">{url}</span>
            </a>
          </div>
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-white/10 bg-black p-4 text-center">
        <p className="mb-2 text-white/60">🎥 Vidéo</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          {url}
        </a>
      </div>
    )
  }

  const textLines = useMemo(() => (text ? text.split('\n') : []), [text])
  const previewLineCount = 4
  const isTextTruncated = textLines.length > previewLineCount
  const previewText = textLines.slice(0, previewLineCount).join('\n')

  const mediaItems = media || []
  const taskItems = tasks || []
  const previewTasks = taskItems.slice(0, 5)
  const hasMoreTasks = taskItems.length > previewTasks.length

  return (
    <div className="space-y-6">
      {/* Texte */}
      {text && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">Notes</h3>
            {isTextTruncated && (
              <button
                onClick={() => setIsTextOpen((prev) => !prev)}
                className="text-xs text-blue-300 transition hover:text-blue-200"
              >
                {isTextOpen ? 'Réduire' : 'Voir tout'}
              </button>
            )}
          </div>
          <div className="prose prose-invert max-w-none text-white/90">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-white/20 pl-4 text-white/70 italic">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="border-white/10 my-4" />,
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="rounded bg-white/10 px-1 py-0.5 text-sm">{children}</code>
                  ) : (
                    <code className="block rounded-lg bg-black/60 p-3 text-sm">{children}</code>
                  ),
                pre: ({ children }) => (
                  <pre className="overflow-x-auto rounded-lg bg-black/60 p-3">{children}</pre>
                ),
              }}
            >
              {isTextOpen ? text : previewText}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Médias */}
      {mediaItems.length > 0 && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">
              Médias ({mediaItems.length})
            </h3>
            <button
              onClick={() => setIsMediaOpen((prev) => !prev)}
              className="text-xs text-blue-300 transition hover:text-blue-200"
            >
              {isMediaOpen ? 'Réduire' : 'Voir tout'}
            </button>
          </div>

          {isMediaOpen ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {mediaItems.map((item) => {
                if (item.type === 'video') {
                  const isEmbedActive = loadedVideoIds.includes(item.id)
                  return (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-black/40 p-3">
                      {renderVideo(item.id, item.url, isEmbedActive)}
                    </div>
                  )
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveImageUrl(item.url)}
                    className="overflow-hidden rounded-lg border border-white/10 bg-black/40"
                  >
                    <img
                      src={item.url}
                      alt="Image"
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {mediaItems.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <p className="text-xs text-white/50">
                    {item.type === 'video' ? '🎥 Vidéo' : '🖼️ Image'}
                  </p>
                  <p className="truncate text-sm text-white/70">
                    {item.type === 'video' ? item.url : 'Aperçu'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tâches */}
      {taskItems.length > 0 && (
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/80">
              Tâches ({taskItems.filter(t => t.completed).length}/{taskItems.length})
            </h3>
            {hasMoreTasks && (
              <button
                onClick={() => setIsTasksOpen((prev) => !prev)}
                className="text-xs text-blue-300 transition hover:text-blue-200"
              >
                {isTasksOpen ? 'Réduire' : 'Voir tout'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(isTasksOpen ? taskItems : previewTasks).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask?.(task.id)}
                  className="h-5 w-5 cursor-pointer rounded border-white/20 bg-white/10 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <span className={`flex-1 text-sm ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>
                  {task.title}
                </span>
                {task.completed && (
                  <span className="text-xs text-green-400">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!text && (!media || media.length === 0) && (!tasks || tasks.length === 0) && (
        <p className="text-center text-white/40">Note vide</p>
      )}

      {activeImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setActiveImageUrl(null)}
        >
          <div className="relative max-h-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => setActiveImageUrl(null)}
              className="absolute -right-2 -top-2 rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
            >
              Fermer
            </button>
            <img
              src={activeImageUrl}
              alt="Image"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
