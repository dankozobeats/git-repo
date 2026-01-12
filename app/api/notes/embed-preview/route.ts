import { NextRequest, NextResponse } from 'next/server'
import { unfurl } from 'unfurl.js'
import type { EmbedPreviewResponse } from '@/types/notes'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const provider = detectProvider(url)

    // YouTube
    if (provider === 'youtube') {
      const videoId = extractYouTubeId(url)
      if (!videoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
      }

      // Fetch video metadata using oEmbed
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      const response = await fetch(oembedUrl)
      const data = await response.json()

      const result: EmbedPreviewResponse = {
        provider: 'youtube',
        embedId: videoId,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        title: data.title,
        url: `https://www.youtube.com/embed/${videoId}`,
      }

      return NextResponse.json(result)
    }

    // TikTok
    if (provider === 'tiktok') {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      const response = await fetch(oembedUrl)

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch TikTok data' }, { status: 500 })
      }

      const data = await response.json()

      const result: EmbedPreviewResponse = {
        provider: 'tiktok',
        thumbnail: data.thumbnail_url,
        title: data.title,
        embedHtml: data.html,
        url,
      }

      return NextResponse.json(result)
    }

    // Vimeo
    if (provider === 'vimeo') {
      const videoId = extractVimeoId(url)
      if (!videoId) {
        return NextResponse.json({ error: 'Invalid Vimeo URL' }, { status: 400 })
      }

      const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
      const response = await fetch(oembedUrl)
      const data = await response.json()

      const result: EmbedPreviewResponse = {
        provider: 'vimeo',
        embedId: videoId,
        thumbnail: data.thumbnail_url,
        title: data.title,
        duration: data.duration,
        url: `https://player.vimeo.com/video/${videoId}`,
      }

      return NextResponse.json(result)
    }

    // Twitter/X
    if (provider === 'twitter') {
      const result: EmbedPreviewResponse = {
        provider: 'twitter',
        url,
      }
      return NextResponse.json(result)
    }

    // Spotify
    if (provider === 'spotify') {
      const spotifyId = extractSpotifyId(url)
      if (spotifyId) {
        const result: EmbedPreviewResponse = {
          provider: 'spotify',
          embedId: spotifyId.id,
          url: `https://open.spotify.com/embed/${spotifyId.type}/${spotifyId.id}`,
        }
        return NextResponse.json(result)
      }
    }

    // Articles génériques avec unfurl
    const metadata = await unfurl(url)

    const result: EmbedPreviewResponse = {
      provider: 'article',
      url,
      title: metadata.open_graph?.title || metadata.twitter_card?.title || metadata.title,
      description:
        metadata.open_graph?.description ||
        metadata.twitter_card?.description ||
        metadata.description,
      image: metadata.open_graph?.images?.[0]?.url || metadata.twitter_card?.images?.[0]?.url,
      favicon: metadata.favicon,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching embed preview:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function detectProvider(url: string): string {
  const urlLower = url.toLowerCase()

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube'
  if (urlLower.includes('tiktok.com')) return 'tiktok'
  if (urlLower.includes('vimeo.com')) return 'vimeo'
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter'
  if (urlLower.includes('spotify.com')) return 'spotify'

  return 'article'
}

function extractYouTubeId(url: string): string | null {
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ]

  for (const regex of regexes) {
    const match = url.match(regex)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

function extractVimeoId(url: string): string | null {
  const regex = /vimeo\.com\/(?:video\/)?(\d+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

function extractSpotifyId(url: string): { type: string; id: string } | null {
  const regex = /spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/
  const match = url.match(regex)
  if (match && match[1] && match[2]) {
    return { type: match[1], id: match[2] }
  }
  return null
}
