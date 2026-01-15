'use client'

import { type ChangeEvent, useRef, useState } from 'react'
import { Save, Plus, X, Video as VideoIcon, Image as ImageIcon, CheckSquare } from 'lucide-react'

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

interface SimpleNoteEditorProps {
  initialText?: string
  initialMedia?: Media[]
  initialTasks?: Task[]
  onSave: (text: string, media: Media[], tasks: Task[]) => Promise<void>
}

export default function SimpleNoteEditor({ initialText = '', initialMedia = [], initialTasks = [], onSave }: SimpleNoteEditorProps) {
  const [text, setText] = useState(initialText)
  const [media, setMedia] = useState<Media[]>(initialMedia)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const addLocalImage = () => {
    fileInputRef.current?.click()
  }

  const handleLocalImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('❌ Seuls les fichiers image sont acceptés.')
      return
    }
    const maxSizeBytes = 3 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      alert('❌ Image trop lourde (max 3 Mo).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setMedia((prev) => [...prev, { id: Date.now().toString(), type: 'image', url: result }])
      }
    }
    reader.readAsDataURL(file)
  }

  const removeMedia = (id: string) => {
    setMedia(media.filter(m => m.id !== id))
  }

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    setTasks([...tasks, { id: Date.now().toString(), title: newTaskTitle, completed: false }])
    setNewTaskTitle('')
  }

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(text, media, tasks)
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
          className="w-full min-h-[240px] rounded-lg border border-white/10 bg-black/30 p-3 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none sm:min-h-[300px] sm:p-4"
        />
      </div>

      {/* Médias */}
      {media.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-white/60 sm:text-sm">Médias attachés</h3>
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
                className="absolute right-2 top-2 rounded-lg bg-red-500 p-2 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tâches */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-white/60 sm:text-sm">Tâches à faire</h3>

        {/* Liste des tâches */}
        {tasks.length > 0 && (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 text-green-600 focus:ring-2 focus:ring-green-500 sm:h-5 sm:w-5"
                />
                <span className={`flex-1 text-sm ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>
                  {task.title}
                </span>
                <button
                  onClick={() => removeTask(task.id)}
                  className="opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X className="h-4 w-4 text-red-400 hover:text-red-300" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Ajouter une tâche */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Ajouter une tâche..."
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={addTask}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 sm:w-auto"
          >
            <CheckSquare className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          onClick={addVideo}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10 sm:w-auto sm:text-sm"
        >
          <VideoIcon className="h-4 w-4" />
          Ajouter une vidéo
        </button>

        <button
          onClick={addImage}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10 sm:w-auto sm:text-sm"
        >
          <ImageIcon className="h-4 w-4" />
          Image (URL)
        </button>

        <button
          onClick={addLocalImage}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs text-white/80 transition hover:bg-white/10 sm:w-auto sm:text-sm"
        >
          <ImageIcon className="h-4 w-4" />
          Image locale
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50 sm:ml-auto sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLocalImageChange}
        className="hidden"
      />

      <p className="text-xs text-white/40">
        💡 Astuce : Utilise **gras**, *italique*, # titres, - listes dans le texte
      </p>
    </div>
  )
}
