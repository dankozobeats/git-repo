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
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black" style={{ paddingTop: '56.25%' }}>
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
            <iframe
              src={`https://www.instagram.com/p/${postId}/embed/`}
              allowFullScreen
              className="absolute inset-0 h-full w-full"
              title="Instagram post"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
            />
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
