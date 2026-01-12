'use client'

import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'
import { ExternalLink, Plus } from 'lucide-react'

interface NoteViewerProps {
  content: any // Tiptap JSON content
  onCreateTask?: (title: string, url: string, type: 'video' | 'article') => void
}

// Détecte si une URL est une vidéo
function detectVideoProvider(url: string): 'youtube' | 'tiktok' | 'vimeo' | 'spotify' | null {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('vimeo.com')) return 'vimeo'
  if (url.includes('spotify.com')) return 'spotify'
  return null
}

export default function NoteViewer({ content, onCreateTask }: NoteViewerProps) {
  const [linkPreviews, setLinkPreviews] = useState<Record<string, any>>({})

  // Fonction pour charger les métadonnées d'un lien
  const fetchLinkPreview = async (url: string) => {
    if (linkPreviews[url]) return

    try {
      const res = await fetch('/api/notes/embed-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (res.ok) {
        const data = await res.json()
        setLinkPreviews((prev) => ({ ...prev, [url]: data }))
      }
    } catch (err) {
      console.error('Failed to fetch link preview:', err)
    }
  }

  // Fonction récursive pour rendre le contenu Tiptap
  const renderContent = (node: any, index: number = 0): React.ReactNode => {
    if (!node) return null

    // Embed vidéo (nouveau type de node)
    if (node.type === 'videoEmbed') {
      const { src, provider } = node.attrs
      return (
        <div key={index} className="my-4 overflow-hidden rounded-lg border border-white/10 bg-black">
          <ReactPlayer
            url={src}
            controls
            width="100%"
            height={provider === 'spotify' ? '152px' : '400px'}
            light={provider !== 'spotify'}
            playing={false}
          />
          <div className="mt-2 px-2 pb-2 text-xs text-white/40">
            {provider === 'youtube' && '🎥 Vidéo YouTube'}
            {provider === 'tiktok' && '📱 TikTok'}
            {provider === 'vimeo' && '🎬 Vimeo'}
            {provider === 'spotify' && '🎵 Spotify'}
          </div>
        </div>
      )
    }

    // Image
    if (node.type === 'image') {
      const { src, alt } = node.attrs
      return (
        <div key={index} className="my-4">
          <img
            src={src}
            alt={alt || 'Image'}
            className="max-w-full rounded-lg border border-white/10"
          />
        </div>
      )
    }

    // Texte simple
    if (node.type === 'text') {
      let text = node.text

      // Appliquer les marks (gras, italique, etc.)
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === 'bold') {
            text = <strong key={Math.random()}>{text}</strong>
          }
          if (mark.type === 'italic') {
            text = <em key={Math.random()}>{text}</em>
          }
          if (mark.type === 'link') {
            const url = mark.attrs.href
            const provider = detectVideoProvider(url)

            // Si c'est une vidéo, afficher un player
            if (provider) {
              return (
                <div key={url} className="my-4 overflow-hidden rounded-lg">
                  <ReactPlayer
                    url={url}
                    controls
                    width="100%"
                    height="360px"
                    light
                    className="react-player"
                  />
                  {onCreateTask && (
                    <button
                      onClick={() => onCreateTask('Regarder cette vidéo', url, 'video')}
                      className="mt-2 flex items-center gap-2 rounded-lg bg-purple-600/20 px-3 py-2 text-sm text-purple-300 transition hover:bg-purple-600/30"
                    >
                      <Plus className="h-4 w-4" />
                      Créer une tâche
                    </button>
                  )}
                </div>
              )
            }

            // Sinon, charger un aperçu de lien
            fetchLinkPreview(url)
            const preview = linkPreviews[url]

            if (preview && preview.title) {
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="my-4 block overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-purple-500/50 hover:bg-white/10"
                >
                  {preview.image && (
                    <img
                      src={preview.image}
                      alt={preview.title}
                      className="h-48 w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{preview.title}</h4>
                        {preview.description && (
                          <p className="mt-1 text-sm text-white/60 line-clamp-2">
                            {preview.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-white/40">{new URL(url).hostname}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 flex-shrink-0 text-white/40" />
                    </div>
                  </div>
                  {onCreateTask && (
                    <div className="border-t border-white/10 p-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          onCreateTask(preview.title || 'Lire cet article', url, 'article')
                        }}
                        className="flex items-center gap-2 text-sm text-purple-300 transition hover:text-purple-200"
                      >
                        <Plus className="h-4 w-4" />
                        Créer une tâche
                      </button>
                    </div>
                  )}
                </a>
              )
            }

            // Lien simple en attendant l'aperçu
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                {text}
              </a>
            )
          }
        })
      }

      return text
    }

    // Paragraphe
    if (node.type === 'paragraph') {
      return (
        <p key={index} className="mb-4">
          {node.content?.map((child: any, i: number) => renderContent(child, i))}
        </p>
      )
    }

    // Titres
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1
      const Tag = `h${level}` as keyof JSX.IntrinsicElements
      const classes = {
        1: 'text-2xl font-bold mb-4 text-white',
        2: 'text-xl font-semibold mb-3 text-white',
        3: 'text-lg font-medium mb-2 text-white',
      }[level]

      return (
        <Tag key={index} className={classes}>
          {node.content?.map((child: any, i: number) => renderContent(child, i))}
        </Tag>
      )
    }

    // Liste à puces
    if (node.type === 'bulletList') {
      return (
        <ul key={index} className="mb-4 ml-6 list-disc space-y-2 text-white/80">
          {node.content?.map((child: any, i: number) => renderContent(child, i))}
        </ul>
      )
    }

    // Liste numérotée
    if (node.type === 'orderedList') {
      return (
        <ol key={index} className="mb-4 ml-6 list-decimal space-y-2 text-white/80">
          {node.content?.map((child: any, i: number) => renderContent(child, i))}
        </ol>
      )
    }

    // Item de liste
    if (node.type === 'listItem') {
      return <li key={index}>{node.content?.map((child: any, i: number) => renderContent(child, i))}</li>
    }

    // Citation
    if (node.type === 'blockquote') {
      return (
        <blockquote
          key={index}
          className="mb-4 border-l-4 border-purple-500 pl-4 italic text-white/70"
        >
          {node.content?.map((child: any, i: number) => renderContent(child, i))}
        </blockquote>
      )
    }

    // Doc (racine)
    if (node.type === 'doc') {
      return <div>{node.content?.map((child: any, i: number) => renderContent(child, i))}</div>
    }

    return null
  }

  return <div className="prose prose-invert max-w-none">{renderContent(content)}</div>
}
