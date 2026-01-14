'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { HabitNote } from '@/types/notes'

// Type complet incluant les nouveaux champs
type NoteData = HabitNote & {
  content_text?: string
  media?: any[]
  tasks?: any[]
}

export function useHabitNotes(habitId: string) {
  const [notes, setNotes] = useState<NoteData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Chargement de TOUTES les données d'un coup (pas de lazy loading)
  const fetchNotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Charger TOUT d'un coup pour éviter les problèmes de synchronisation
      const { data, error: fetchError } = await supabase
        .from('habit_notes')
        .select('*')
        .eq('habit_id', habitId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      setNotes((data || []) as NoteData[])
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notes')
    } finally {
      setIsLoading(false)
    }
  }, [habitId])

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
            content_text: '',
            media: [],
            tasks: [],
          })
          .select()
          .single()

        if (createError) throw createError

        await fetchNotes()
        return data
      } catch (err) {
        console.error('Error creating note:', err)
        throw err
      }
    },
    [habitId, fetchNotes]
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
      } catch (err) {
        console.error('Error deleting note:', err)
        throw err
      }
    },
    []
  )

  // Toggle pin status
  const togglePin = useCallback(
    async (noteId: string) => {
      const note = notes.find((n) => n.id === noteId)
      if (!note) return

      await updateNote(noteId, { is_pinned: !note.is_pinned })
      await fetchNotes() // Refresh to re-sort
    },
    [notes, updateNote, fetchNotes]
  )

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    refetch: fetchNotes,
  }
}
