'use client'

import { useState } from 'react'
import { useHabitNotes } from '@/lib/notes/useHabitNotes'
import { FileText, Plus, Pin, Trash2, Edit, X, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import SimpleNoteEditor from './SimpleNoteEditor'
import SimpleNoteViewer from './SimpleNoteViewer'

interface HabitNotesPanelProps {
  habitId: string
  habitName: string
}

export default function HabitNotesPanelSimple({ habitId }: HabitNotesPanelProps) {
  const {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  } = useHabitNotes(habitId)

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return

    try {
      const newNote = await createNote(newNoteTitle)
      setNewNoteTitle('')
      setIsCreating(false)
      // Ouvrir la nouvelle note en édition
      if (newNote) {
        setEditingId(newNote.id)
      }
    } catch (err) {
      console.error('Failed to create note:', err)
      alert('Erreur lors de la création de la note')
    }
  }

  const handleViewNote = (noteId: string) => {
    if (viewingId === noteId) {
      setViewingId(null)
    } else {
      setViewingId(noteId)
      setEditingId(null)
    }
  }

  const handleEditNote = (noteId: string) => {
    if (editingId === noteId) {
      setEditingId(null)
    } else {
      setEditingId(noteId)
      setViewingId(null)
    }
  }

  const handleSaveNote = async (noteId: string, text: string, media: any[], tasks: any[]) => {
    try {
      await updateNote(noteId, {
        content_text: text,
        media: media,
        tasks: tasks,
      } as any)
    } catch (err) {
      console.error('Failed to save note:', err)
      throw err
    }
  }

  const handleToggleTask = async (noteId: string, taskId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const tasks = (note as any).tasks || []
    const updatedTasks = tasks.map((t: any) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )

    try {
      await updateNote(noteId, {
        tasks: updatedTasks,
      } as any)
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Supprimer cette note ?')) return

    try {
      await deleteNote(noteId)
    } catch (err) {
      console.error('Failed to delete note:', err)
      alert('Erreur lors de la suppression')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/50">Chargement des notes...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        Erreur : {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Notes</h2>
          <p className="mt-1 text-sm text-white/60">
            {notes.length === 0
              ? 'Aucune note pour cette habitude'
              : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 sm:w-auto sm:text-base"
        >
          <Plus className="h-5 w-5" />
          Nouvelle note
        </button>
      </div>

      {/* Create new note */}
      {isCreating && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Titre de la note..."
              className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
            />
            <div className="flex items-center gap-2 sm:flex-none">
              <button
                onClick={handleCreateNote}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 sm:flex-none"
              >
                Créer
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewNoteTitle('')
                }}
                className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-4">
        {notes.map((note) => {
          const isEditing = editingId === note.id
          const isViewing = viewingId === note.id
          const isOpen = isEditing || isViewing
          const hasContent =
            ((note as any).content_text && (note as any).content_text.trim() !== '') ||
            ((note as any).media && (note as any).media.length > 0) ||
            ((note as any).tasks && (note as any).tasks.length > 0)

          return (
            <div
              key={note.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              {/* Note header */}
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                  onClick={() => {
                    if (isOpen) {
                      setViewingId(null)
                      setEditingId(null)
                    } else {
                      handleViewNote(note.id)
                    }
                  }}
                >
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-white/40" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-white/40" />
                  )}
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{note.title}</h3>
                    <p className="text-xs text-white/50">
                      Modifiée {new Date(note.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {note.is_pinned && (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-300">
                      Épinglée
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`rounded-lg p-1.5 transition sm:p-2 ${
                      note.is_pinned
                        ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                    title={note.is_pinned ? 'Désépingler' : 'Épingler'}
                  >
                    <Pin className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleViewNote(note.id)}
                    className={`rounded-lg p-1.5 transition sm:p-2 ${
                      viewingId === note.id
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                    title={viewingId === note.id ? 'Fermer' : 'Consulter'}
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleEditNote(note.id)}
                    className={`rounded-lg p-1.5 transition sm:p-2 ${
                      isEditing
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                    title={isEditing ? 'Fermer' : 'Modifier'}
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/20 sm:p-2"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Note viewer (read-only mode) */}
              {viewingId === note.id && (
                <div className="p-3 sm:p-4">
                  {hasContent ? (
                    <SimpleNoteViewer
                      text={(note as any).content_text || ''}
                      media={(note as any).media || []}
                      tasks={(note as any).tasks || []}
                      onToggleTask={(taskId) => handleToggleTask(note.id, taskId)}
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8 text-white/50">
                      Note vide
                    </div>
                  )}
                </div>
              )}

              {/* Note editor */}
              {isEditing && (
                <div className="p-3 sm:p-4">
                  <SimpleNoteEditor
                    initialText={(note as any).content_text || ''}
                    initialMedia={(note as any).media || []}
                    initialTasks={(note as any).tasks || []}
                    onSave={(text, media, tasks) => handleSaveNote(note.id, text, media, tasks)}
                  />
                </div>
              )}
            </div>
          )
        })}

        {notes.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-white/20" />
            <p className="mt-4 text-lg font-medium text-white/60">Aucune note pour le moment</p>
            <p className="mt-2 text-sm text-white/40">
              Créez votre première note pour organiser vos idées et ressources
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700 sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Créer ma première note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
