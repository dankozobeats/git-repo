'use client'

import { NodeViewWrapper } from '@tiptap/react'
import ReactPlayer from 'react-player'

export default function VideoEmbedNode({ node }: any) {
  const { src, provider } = node.attrs

  return (
    <NodeViewWrapper className="my-4">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
        <ReactPlayer
          url={src}
          controls
          width="100%"
          height={provider === 'spotify' ? '152px' : '400px'}
          light={provider !== 'spotify'}
          playing={false}
          config={{
            youtube: {
              playerVars: { modestbranding: 1 },
            },
          }}
        />
      </div>
      <div className="mt-2 text-xs text-white/40">
        {provider === 'youtube' && '🎥 Vidéo YouTube'}
        {provider === 'tiktok' && '📱 TikTok'}
        {provider === 'vimeo' && '🎬 Vimeo'}
        {provider === 'spotify' && '🎵 Spotify'}
      </div>
    </NodeViewWrapper>
  )
}
