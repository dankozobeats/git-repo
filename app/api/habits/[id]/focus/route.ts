import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: habitId } = await params

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify habit belongs to user
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('id, user_id, name, is_focused')
      .eq('id', habitId)
      .single()

    if (habitError || !habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    if (habit.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If habit is already focused, unfocus it
    if (habit.is_focused) {
      const { error: updateError } = await supabase
        .from('habits')
        .update({ is_focused: false })
        .eq('id', habitId)

      if (updateError) {
        console.error('Error unfocusing habit:', updateError)
        return NextResponse.json(
          { error: 'Failed to unfocus habit', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        focused: false,
        message: `"${habit.name}" n'est plus en mode focus`,
      })
    }

    // Otherwise, unfocus all other habits and focus this one
    // First, unfocus all habits for this user
    const { error: unfocusAllError } = await supabase
      .from('habits')
      .update({ is_focused: false })
      .eq('user_id', user.id)
      .eq('is_focused', true)

    if (unfocusAllError) {
      console.error('Error unfocusing all habits:', unfocusAllError)
      return NextResponse.json(
        { error: 'Failed to update focus', details: unfocusAllError.message },
        { status: 500 }
      )
    }

    // Then focus the selected habit
    const { error: focusError } = await supabase
      .from('habits')
      .update({ is_focused: true })
      .eq('id', habitId)

    if (focusError) {
      console.error('Error focusing habit:', focusError)
      return NextResponse.json(
        { error: 'Failed to focus habit', details: focusError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      focused: true,
      message: `"${habit.name}" est maintenant en mode focus 🎯`,
    })
  } catch (error) {
    console.error('Error in focus API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
