'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HabitNoteTask } from '@/types/notes'

export function useNoteTasks(habitId: string) {
  const [tasks, setTasks] = useState<HabitNoteTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/notes/tasks?habitId=${habitId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }, [habitId])

  const createTask = useCallback(
    async (
      noteId: string,
      title: string,
      sourceUrl: string,
      sourceType: 'video' | 'article' | 'custom',
      description?: string,
      dueDate?: string
    ) => {
      try {
        const response = await fetch('/api/notes/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noteId,
            habitId,
            title,
            description,
            sourceType,
            sourceUrl,
            dueDate,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create task')
        }

        const data = await response.json()
        await fetchTasks() // Refresh list
        return data.task
      } catch (err) {
        console.error('Error creating task:', err)
        throw err
      }
    },
    [habitId, fetchTasks]
  )

  const toggleTaskComplete = useCallback(
    async (taskId: string, currentStatus: boolean) => {
      try {
        const response = await fetch(`/api/notes/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_completed: !currentStatus,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        // Update local state
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, is_completed: !currentStatus } : task
          )
        )
      } catch (err) {
        console.error('Error toggling task:', err)
        throw err
      }
    },
    []
  )

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const response = await fetch(`/api/notes/tasks/${taskId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete task')
        }

        // Update local state
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
      } catch (err) {
        console.error('Error deleting task:', err)
        throw err
      }
    },
    []
  )

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: Partial<Pick<HabitNoteTask, 'title' | 'description' | 'due_date'>>
    ) => {
      try {
        const response = await fetch(`/api/notes/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        const data = await response.json()

        // Update local state
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
        )

        return data.task
      } catch (err) {
        console.error('Error updating task:', err)
        throw err
      }
    },
    []
  )

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.is_completed).length,
    pending: tasks.filter((t) => !t.is_completed).length,
    videos: tasks.filter((t) => t.source_type === 'video').length,
    articles: tasks.filter((t) => t.source_type === 'article').length,
  }

  return {
    tasks,
    isLoading,
    error,
    stats,
    createTask,
    toggleTaskComplete,
    deleteTask,
    updateTask,
    refetch: fetchTasks,
  }
}
