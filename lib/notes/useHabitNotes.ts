'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { HabitNote } from '@/types/notes'

// Type pour les métadonnées légères (sans les blocks)
type NoteMetadata = Omit<HabitNote, 'blocks' | 'media_metadata'> & {
  blocks?: HabitNote['blocks']
  media_metadata?: HabitNote['media_metadata']
}

export function useHabitNotes(habitId: string) {
  const [notes, setNotes] = useState<NoteMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)

  // Chargement initial : SEULEMENT les métadonnées (pas les blocks)
  // Pour garder la liste rapide à charger
  const fetchNotesMetadata = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('habit_notes')
        .select('id, habit_id, user_id, title, is_pinned, created_at, updated_at')
        .eq('habit_id', habitId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setNotes((data || []) as NoteMetadata[])
    } catch (err) {
      console.error('Error fetching notes metadata:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notes')
    } finally {
      setIsLoading(false)
    }
  }, [habitId])

  // Chargement lazy des blocks SEULEMENT quand on ouvre la note
  // Cela évite de charger des données lourdes inutilement
  const loadNoteBlocks = useCallback(async (noteId: string) => {
    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('habit_notes')
        .select('blocks, media_metadata')
        .eq('id', noteId)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  blocks: data.blocks as any,
                  media_metadata: data.media_metadata as any,
                }
              : note
          )
        )
      }

      setActiveNoteId(noteId)
    } catch (err) {
      console.error('Error loading note blocks:', err)
      throw err
    }
  }, [])

  // Créer une nouvelle note
  const createNote = useCallback(
    async (title: string = 'Nouvelle note') => {
      try {
        const supabase = createClient()

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error: createError } = await supabase
          .from('habit_notes')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            title,
            blocks: [],
            media_metadata: {},
          })
          .select()
          .single()

        if (createError) throw createError

        await fetchNotesMetadata()
        return data
      } catch (err) {
        console.error('Error creating note:', err)
        throw err
      }
    },
    [habitId, fetchNotesMetadata]
  )

  // Mettre à jour une note
  const updateNote = useCallback(
    async (
      noteId: string,
      updates: Partial<Pick<HabitNote, 'title' | 'blocks' | 'is_pinned' | 'media_metadata'>>
    ) => {
      try {
        const supabase = createClient()

        const { error: updateError } = await supabase
          .from('habit_notes')
          .update(updates)
          .eq('id', noteId)

        if (updateError) throw updateError

        // Update local state
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  ...updates,
                  updated_at: new Date().toISOString(),
                }
              : note
          )
        )
      } catch (err) {
        console.error('Error updating note:', err)
        throw err
      }
    },
    []
  )

  // Supprimer une note
  const deleteNote = useCallback(
    async (noteId: string) => {
      try {
        const supabase = createClient()

        const { error: deleteError } = await supabase.from('habit_notes').delete().eq('id', noteId)

        if (deleteError) throw deleteError

        setNotes((prev) => prev.filter((note) => note.id !== noteId))
        if (activeNoteId === noteId) {
          setActiveNoteId(null)
        }
      } catch (err) {
        console.error('Error deleting note:', err)
        throw err
      }
    },
    [activeNoteId]
  )

  // Toggle pin status
  const togglePin = useCallback(
    async (noteId: string) => {
      const note = notes.find((n) => n.id === noteId)
      if (!note) return

      await updateNote(noteId, { is_pinned: !note.is_pinned })
      await fetchNotesMetadata() // Refresh to re-sort
    },
    [notes, updateNote, fetchNotesMetadata]
  )

  useEffect(() => {
    fetchNotesMetadata()
  }, [fetchNotesMetadata])

  return {
    notes,
    isLoading,
    error,
    activeNoteId,
    loadNoteBlocks,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    refetch: fetchNotesMetadata,
  }
}
