'use client'

interface Media {
  id: string
  type: 'video' | 'image'
  url: string
}

interface SimpleNoteViewerProps {
  text: string
  media: Media[]
}

// Extraire l'ID YouTube d'une URL
function getYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Détecter le type de vidéo
function getVideoType(url: string): 'youtube' | 'tiktok' | 'vimeo' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('vimeo.com')) return 'vimeo'
  return 'other'
}

// Extraire l'ID Vimeo
function getVimeoId(url: string): string | null {
  const regex = /vimeo\.com\/(?:video\/)?(\d+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

export default function SimpleNoteViewer({ text, media }: SimpleNoteViewerProps) {
  // Convertir le markdown basique en HTML
  const renderText = (text: string) => {
    let html = text
    // Gras
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italique
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Titres
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // Listes
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
    // Sauts de ligne
    html = html.replace(/\n/g, '<br />')

    return html
  }

  const renderVideo = (url: string) => {
    const type = getVideoType(url)

    if (type === 'youtube') {
      const videoId = getYouTubeId(url)
      if (!videoId) return <p className="text-red-400">URL YouTube invalide</p>

      return (
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            title="YouTube video"
          />
        </div>
      )
    }

    if (type === 'vimeo') {
      const videoId = getVimeoId(url)
      if (!videoId) return <p className="text-red-400">URL Vimeo invalide</p>

      return (
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
            title="Vimeo video"
          />
        </div>
      )
    }

    if (type === 'tiktok') {
      return (
        <div className="rounded-lg border border-white/10 bg-black p-4 text-center">
          <p className="mb-2 text-white/60">📱 Vidéo TikTok</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Voir sur TikTok
          </a>
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

  return (
    <div className="space-y-6">
      {/* Texte */}
      {text && (
        <div
          className="prose prose-invert max-w-none text-white/90"
          dangerouslySetInnerHTML={{ __html: renderText(text) }}
        />
      )}

      {/* Médias */}
      {media && media.length > 0 && (
        <div className="space-y-4">
          {media.map((item) => (
            <div key={item.id}>
              {item.type === 'video' ? (
                renderVideo(item.url)
              ) : (
                <img
                  src={item.url}
                  alt="Image"
                  className="max-w-full rounded-lg border border-white/10"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {!text && (!media || media.length === 0) && (
        <p className="text-center text-white/40">Note vide</p>
      )}
    </div>
  )
}
