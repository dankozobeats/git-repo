'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { VideoEmbed } from '@/lib/tiptap/VideoEmbedExtension'
import { useCallback, useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Link as LinkIcon,
  Save,
  ImageIcon,
  Video,
} from 'lucide-react'

interface NoteEditorProps {
  initialContent?: any
  onSave: (content: any) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
}

export default function NoteEditor({
  initialContent,
  onSave,
  placeholder = 'Commencez à écrire votre note...',
  autoFocus = false,
}: NoteEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline hover:text-blue-300',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      VideoEmbed,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
    autofocus: autoFocus,
  })

  const handleSave = useCallback(async () => {
    if (!editor) return

    const json = editor.getJSON()
    await onSave(json)
  }, [editor, onSave])

  // Keyboard shortcut for save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return

    const url = window.prompt('URL de l\'image:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addVideo = useCallback(() => {
    if (!editor) return

    const url = window.prompt('URL de la vidéo (YouTube, TikTok, Vimeo, Spotify):')
    if (url) {
      // Détecter automatiquement le provider
      const youtubeRegex = /(?:youtube\.com|youtu\.be)/
      const tiktokRegex = /tiktok\.com/
      const vimeoRegex = /vimeo\.com/
      const spotifyRegex = /spotify\.com/

      let provider = null
      if (youtubeRegex.test(url)) provider = 'youtube'
      else if (tiktokRegex.test(url)) provider = 'tiktok'
      else if (vimeoRegex.test(url)) provider = 'vimeo'
      else if (spotifyRegex.test(url)) provider = 'spotify'

      if (provider) {
        editor.chain().focus().setVideoEmbed({ src: url, provider }).run()
      } else {
        alert('URL de vidéo non reconnue. Utilisez YouTube, TikTok, Vimeo ou Spotify.')
      }
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="min-h-[200px] animate-pulse rounded-lg border border-white/10 bg-white/5" />
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-2 transition ${
            editor.isActive('bold')
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Gras (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-2 transition ${
            editor.isActive('italic')
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Italique (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-white/20" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`rounded p-2 transition ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Titre 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-2 transition ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Titre 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-white/20" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-2 transition ${
            editor.isActive('bulletList')
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-2 transition ${
            editor.isActive('orderedList')
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`rounded p-2 transition ${
            editor.isActive('blockquote')
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Citation"
        >
          <Quote className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-white/20" />

        <button
          type="button"
          onClick={setLink}
          className={`rounded p-2 transition ${
            editor.isActive('link')
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
          title="Ajouter un lien"
        >
          <LinkIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={addImage}
          className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Ajouter une image"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={addVideo}
          className="rounded p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title="Ajouter une vidéo (YouTube, TikTok, Vimeo, Spotify)"
        >
          <Video className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
          >
            <Save className="h-4 w-4" />
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer hint */}
      <div className="border-t border-white/10 px-4 py-2 text-xs text-white/40">
        Astuce : Cmd/Ctrl + S pour sauvegarder
      </div>
    </div>
  )
}
