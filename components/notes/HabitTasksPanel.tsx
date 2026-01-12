'use client'

import { useNoteTasks } from '@/lib/notes/useNoteTasks'
import { CheckCircle2, Circle, Trash2, ExternalLink, Video, FileText, Calendar } from 'lucide-react'
import { useState } from 'react'

interface HabitTasksPanelProps {
  habitId: string
  habitName: string
}

export default function HabitTasksPanel({ habitId, habitName }: HabitTasksPanelProps) {
  const { tasks, isLoading, stats, toggleTaskComplete, deleteTask } = useNoteTasks(habitId)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'pending') return !task.is_completed
    if (filter === 'completed') return task.is_completed
    return true
  })

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      await toggleTaskComplete(taskId, currentStatus)
    } catch (err) {
      alert('Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Supprimer cette tâche ?')) return

    try {
      await deleteTask(taskId)
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/50">Chargement des tâches...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div>
        <h2 className="text-2xl font-bold text-white">Tâches</h2>
        <p className="mt-1 text-sm text-white/60">
          Vidéos à regarder et articles à lire issus de vos notes
        </p>

        {/* Stats cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Total</p>
            <p className="mt-1 text-2xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">En cours</p>
            <p className="mt-1 text-2xl font-bold text-orange-400">{stats.pending}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Terminées</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{stats.completed}</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Vidéos</p>
            <p className="mt-1 text-2xl font-bold text-purple-400">{stats.videos}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          Toutes ({stats.total})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'pending'
              ? 'bg-orange-500/20 text-orange-300'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          En cours ({stats.pending})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'completed'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          Terminées ({stats.completed})
        </button>
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/20 py-12 text-center">
            <Circle className="h-12 w-12 text-white/20" />
            <p className="mt-4 text-lg font-medium text-white/60">Aucune tâche</p>
            <p className="mt-2 text-sm text-white/40">
              {filter === 'pending'
                ? 'Bravo ! Toutes vos tâches sont terminées'
                : 'Créez des tâches depuis vos notes enrichies'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group rounded-lg border p-4 transition ${
                task.is_completed
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleComplete(task.id, task.is_completed)}
                  className="flex-shrink-0 pt-1 transition hover:scale-110"
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <Circle className="h-6 w-6 text-white/40 hover:text-white" />
                  )}
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-semibold ${
                      task.is_completed ? 'text-white/60 line-through' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="mt-1 text-sm text-white/50">{task.description}</p>
                  )}

                  {/* Metadata */}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {/* Type badge */}
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        task.source_type === 'video'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {task.source_type === 'video' ? (
                        <Video className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {task.source_type === 'video' ? 'Vidéo' : 'Article'}
                    </span>

                    {/* Due date */}
                    {task.due_date && (
                      <span className="flex items-center gap-1.5 text-xs text-white/50">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}

                    {/* Created date */}
                    <span className="text-xs text-white/40">
                      Créée {new Date(task.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {task.source_url && (
                    <a
                      href={task.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                      title="Ouvrir la source"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg p-2 text-red-400/60 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
