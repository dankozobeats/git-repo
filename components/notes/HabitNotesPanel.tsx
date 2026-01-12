'use client'

import { useState } from 'react'
import { useHabitNotes } from '@/lib/notes/useHabitNotes'
import { FileText, Plus, Pin, Trash2, Edit, X, Eye, ChevronDown, ChevronRight } from 'lucide-react'
import NoteEditor from './NoteEditor'
import NoteViewer from './NoteViewer'

interface HabitNotesPanelProps {
  habitId: string
  habitName: string
}

export default function HabitNotesPanel({ habitId, habitName }: HabitNotesPanelProps) {
  const {
    notes,
    isLoading,
    error,
    activeNoteId,
    loadNoteBlocks,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  } = useHabitNotes(habitId)

  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [loadingNoteId, setLoadingNoteId] = useState<string | null>(null)

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return

    try {
      await createNote(newNoteTitle)
      setNewNoteTitle('')
      setIsCreating(false)
    } catch (err) {
      console.error('Failed to create note:', err)
      alert('Erreur lors de la création de la note')
    }
  }

  const handleViewNote = async (noteId: string) => {
    if (viewingId === noteId) {
      setViewingId(null)
      setLoadingNoteId(null)
    } else {
      setLoadingNoteId(noteId)
      setViewingId(noteId)
      setEditingId(null) // Fermer l'édition si ouverte
      try {
        await loadNoteBlocks(noteId)
      } finally {
        setLoadingNoteId(null)
      }
    }
  }

  const handleEditNote = async (noteId: string) => {
    if (editingId === noteId) {
      setEditingId(null)
      setLoadingNoteId(null)
    } else {
      setLoadingNoteId(noteId)
      setEditingId(noteId)
      setViewingId(null) // Fermer la vue si ouverte
      try {
        await loadNoteBlocks(noteId)
      } finally {
        setLoadingNoteId(null)
      }
    }
  }

  const handleSaveNote = async (noteId: string, content: any) => {
    try {
      await updateNote(noteId, { blocks: content })
      alert('Note sauvegardée !')
    } catch (err) {
      console.error('Failed to save note:', err)
      alert('Erreur lors de la sauvegarde')
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notes</h2>
          <p className="mt-1 text-sm text-white/60">
            {notes.length === 0
              ? 'Aucune note pour cette habitude'
              : `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700"
        >
          <Plus className="h-5 w-5" />
          <span>Nouvelle note</span>
        </button>
      </div>

      {/* Create note modal */}
      {isCreating && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Créer une note</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-white/50 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Titre de la note..."
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/40 focus:border-purple-500 focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateNote()
              if (e.key === 'Escape') setIsCreating(false)
            }}
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateNote}
              disabled={!newNoteTitle.trim()}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Créer
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-4">
        {notes.map((note) => {
          const isEditing = editingId === note.id
          const isViewing = viewingId === note.id
          const isOpen = isEditing || isViewing
          const hasBlocks = note.blocks !== undefined

          return (
            <div
              key={note.id}
              className="overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              {/* Note header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div
                  className="flex flex-1 cursor-pointer items-center gap-3"
                  onClick={() => {
                    // Cliquer sur le titre ouvre/ferme la note en mode consultation
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
                  <div>
                    <h3 className="font-semibold text-white">{note.title}</h3>
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

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`rounded-lg p-2 transition ${
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
                    className={`rounded-lg p-2 transition ${
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
                    className={`rounded-lg p-2 transition ${
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
                    className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/20"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Note viewer (read-only mode) */}
              {viewingId === note.id && (
                <div className="p-4">
                  {loadingNoteId === note.id ? (
                    <div className="flex items-center justify-center py-8 text-white/50">
                      Chargement de la note...
                    </div>
                  ) : hasBlocks ? (
                    <NoteViewer content={note.blocks} />
                  ) : (
                    <div className="flex items-center justify-center py-8 text-white/50">
                      Erreur de chargement
                    </div>
                  )}
                </div>
              )}

              {/* Note editor (only when editing) */}
              {isEditing && (
                <div className="p-4">
                  {loadingNoteId === note.id ? (
                    <div className="flex items-center justify-center py-8 text-white/50">
                      Chargement de la note...
                    </div>
                  ) : hasBlocks ? (
                    <NoteEditor
                      initialContent={note.blocks}
                      onSave={(content) => handleSaveNote(note.id, content)}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center justify-center py-8 text-white/50">
                      Erreur de chargement
                    </div>
                  )}
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
              className="mt-6 flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" />
              <span>Créer une note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
