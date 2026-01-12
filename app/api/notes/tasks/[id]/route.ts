import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH: Mettre à jour une tâche (toggle completed, modifier titre, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: taskId } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_completed, title, description, due_date } = body

    // Vérifier que la tâche appartient à l'utilisateur
    const { data: task, error: taskError } = await supabase
      .from('habit_note_tasks')
      .select('id, user_id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Préparer les mises à jour
    const updates: any = {}
    if (typeof is_completed === 'boolean') updates.is_completed = is_completed
    if (title) updates.title = title
    if (description !== undefined) updates.description = description
    if (due_date !== undefined) updates.due_date = due_date

    // Mettre à jour
    const { data: updatedTask, error: updateError } = await supabase
      .from('habit_note_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json(
        { error: 'Failed to update task', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      task: updatedTask,
      message: 'Tâche mise à jour',
    })
  } catch (error) {
    console.error('Error in PATCH /api/notes/tasks/[id]:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer une tâche
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: taskId } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Vérifier que la tâche appartient à l'utilisateur
    const { data: task, error: taskError } = await supabase
      .from('habit_note_tasks')
      .select('id, user_id')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Supprimer
    const { error: deleteError } = await supabase.from('habit_note_tasks').delete().eq('id', taskId)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete task', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Tâche supprimée' })
  } catch (error) {
    console.error('Error in DELETE /api/notes/tasks/[id]:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
