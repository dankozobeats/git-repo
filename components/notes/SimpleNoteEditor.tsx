'use client'

import { useState } from 'react'
import { Save, Plus, X, Video as VideoIcon, Image as ImageIcon } from 'lucide-react'

interface Media {
  id: string
  type: 'video' | 'image'
  url: string
}

interface SimpleNoteEditorProps {
  initialText?: string
  initialMedia?: Media[]
  onSave: (text: string, media: Media[]) => Promise<void>
}

export default function SimpleNoteEditor({ initialText = '', initialMedia = [], onSave }: SimpleNoteEditorProps) {
  const [text, setText] = useState(initialText)
  const [media, setMedia] = useState<Media[]>(initialMedia)
  const [isSaving, setIsSaving] = useState(false)

  const addVideo = () => {
    const url = prompt('Colle l\'URL de la vidéo (YouTube, TikTok, Vimeo):')
    if (url) {
      setMedia([...media, { id: Date.now().toString(), type: 'video', url }])
    }
  }

  const addImage = () => {
    const url = prompt('Colle l\'URL de l\'image:')
    if (url) {
      setMedia([...media, { id: Date.now().toString(), type: 'image', url }])
    }
  }

  const removeMedia = (id: string) => {
    setMedia(media.filter(m => m.id !== id))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(text, media)
      alert('✅ Note sauvegardée !')
    } catch (err) {
      alert('❌ Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Texte */}
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écris tes notes ici... Tu peux utiliser du Markdown basique."
          className="w-full min-h-[300px] rounded-lg border border-white/10 bg-black/30 p-4 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Médias */}
      {media.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/60">Médias attachés</h3>
          {media.map((item) => (
            <div key={item.id} className="group relative">
              {item.type === 'video' ? (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-black p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <VideoIcon className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-white/60">Vidéo</span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm text-blue-400 hover:underline"
                  >
                    {item.url}
                  </a>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt="Uploaded"
                  className="max-w-full rounded-lg border border-white/10"
                />
              )}
              <button
                onClick={() => removeMedia(item.id)}
                className="absolute right-2 top-2 rounded-lg bg-red-500 p-2 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={addVideo}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
        >
          <VideoIcon className="h-4 w-4" />
          Ajouter une vidéo
        </button>

        <button
          onClick={addImage}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
        >
          <ImageIcon className="h-4 w-4" />
          Ajouter une image
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <p className="text-xs text-white/40">
        💡 Astuce : Utilise **gras**, *italique*, # titres, - listes dans le texte
      </p>
    </div>
  )
}
