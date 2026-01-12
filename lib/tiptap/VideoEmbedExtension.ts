import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import VideoEmbedNode from '@/components/notes/VideoEmbedNode'

export interface VideoEmbedOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (options: { src: string; provider: string }) => ReturnType
    }
  }
}

// Détecte le type de vidéo depuis une URL
export function detectVideoProvider(url: string): {
  provider: 'youtube' | 'tiktok' | 'vimeo' | 'spotify' | null
  videoId: string | null
} {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) {
    return { provider: 'youtube', videoId: youtubeMatch[1] }
  }

  // TikTok
  if (url.includes('tiktok.com')) {
    return { provider: 'tiktok', videoId: url }
  }

  // Vimeo
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch) {
    return { provider: 'vimeo', videoId: vimeoMatch[1] }
  }

  // Spotify
  if (url.includes('spotify.com')) {
    return { provider: 'spotify', videoId: url }
  }

  return { provider: null, videoId: null }
}

export const VideoEmbed = Node.create<VideoEmbedOptions>({
  name: 'videoEmbed',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      provider: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-video-embed': '' })]
  },

  addCommands() {
    return {
      setVideoEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addPasteRules() {
    return [
      {
        find: /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|spotify\.com)[^\s]+/g,
        handler: ({ match, chain, range }) => {
          const url = match[0]
          const { provider, videoId } = detectVideoProvider(url)

          if (provider && videoId) {
            chain()
              .deleteRange(range)
              .setVideoEmbed({ src: url, provider })
              .run()
          }
        },
      },
    ]
  },

  addInputRules() {
    return [
      {
        find: /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|spotify\.com)[^\s]+$/,
        handler: ({ match, chain, range }) => {
          const url = match[0]
          const { provider, videoId } = detectVideoProvider(url)

          if (provider && videoId) {
            chain()
              .deleteRange(range)
              .setVideoEmbed({ src: url, provider })
              .run()
          }
        },
      },
    ]
  },
})
