import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CreateTaskRequest } from '@/types/notes'

// GET: Récupérer toutes les tâches d'une habitude
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const habitId = searchParams.get('habitId')
    const noteId = searchParams.get('noteId')
    const completed = searchParams.get('completed')

    let query = supabase
      .from('habit_note_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (habitId) {
      query = query.eq('habit_id', habitId)
    }

    if (noteId) {
      query = query.eq('note_id', noteId)
    }

    if (completed !== null) {
      query = query.eq('is_completed', completed === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ tasks: data || [] })
  } catch (error) {
    console.error('Error in GET /api/notes/tasks:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST: Créer une nouvelle tâche
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateTaskRequest = await request.json()
    const { noteId, habitId, title, description, sourceType, sourceUrl, dueDate } = body

    if (!noteId || !habitId || !title || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: noteId, habitId, title, sourceType' },
        { status: 400 }
      )
    }

    // Vérifier que la note appartient à l'utilisateur
    const { data: note, error: noteError } = await supabase
      .from('habit_notes')
      .select('id, user_id')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single()

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Créer la tâche
    const { data: task, error: createError } = await supabase
      .from('habit_note_tasks')
      .insert({
        note_id: noteId,
        habit_id: habitId,
        user_id: user.id,
        title,
        description,
        source_type: sourceType,
        source_url: sourceUrl,
        due_date: dueDate,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating task:', createError)
      return NextResponse.json(
        { error: 'Failed to create task', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ task, message: 'Tâche créée avec succès !' })
  } catch (error) {
    console.error('Error in POST /api/notes/tasks:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
