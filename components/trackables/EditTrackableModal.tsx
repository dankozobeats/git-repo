'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Target } from 'lucide-react'
import { Trackable, Mission } from '@/types/trackables'

interface EditTrackableModalProps {
  trackable: Trackable | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (id: string, updates: Partial<Trackable>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const EMOJI_SUGGESTIONS = {
  habit: ['💪', '🧘', '📚', '🏃', '🎯', '✍️', '🎨', '🎵', '💻', '🌱'],
  state: ['🛍️', '🍰', '🍕', '😰', '😴', '😑', '🚬', '🍺', '📱', '🎮'],
}

const COLOR_SUGGESTIONS = [
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Violet', value: '#6366f1' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Jaune', value: '#eab308' },
]

export default function EditTrackableModal({
  trackable,
  isOpen,
  onClose,
  onSubmit,
  onDelete,
}: EditTrackableModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [isPriority, setIsPriority] = useState(false)
  const [targetPerDay, setTargetPerDay] = useState<string>('')
  const [unit, setUnit] = useState('fois')
  const [missions, setMissions] = useState<Mission[]>([])
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (trackable) {
      setName(trackable.name)
      setDescription(trackable.description || '')
      setIcon(trackable.icon || '')
      setColor(trackable.color || '#3b82f6')
      setIsPriority(trackable.is_priority)
      setTargetPerDay(trackable.target_per_day?.toString() || '')
      setUnit(trackable.unit || 'fois')
      setMissions(trackable.missions || [])
    }
  }, [trackable])

  if (!isOpen || !trackable) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Le nom est obligatoire')
      return
    }

    setIsSubmitting(true)
    try {
      const updates: Partial<Trackable> = {
        name: name.trim(),
        description: description.trim() || null,
        icon: icon || null,
        color: color || null,
        is_priority: isPriority,
        target_per_day: trackable.type === 'habit' && targetPerDay ? parseInt(targetPerDay) : null,
        unit: trackable.type === 'habit' && unit ? unit : null,
        missions: missions.length > 0 ? missions : null,
      }

      await onSubmit(trackable.id, updates)
      onClose()
    } catch (error) {
      console.error('Error updating trackable:', error)
      alert('Erreur lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsSubmitting(true)
    try {
      await onDelete(trackable.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error('Error deleting trackable:', error)
      alert('Erreur lors de la suppression')
    } finally {
      setIsSubmitting(false)
    }
  }

  const emojiList = trackable.type === 'habit' ? EMOJI_SUGGESTIONS.habit : EMOJI_SUGGESTIONS.state

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            Modifier {trackable.type === 'habit' ? 'l\'habitude' : 'l\'état'}
          </h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Nom *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={2}
              className="w-full resize-none rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Icône (optionnel)
            </label>
            <div className="mb-3 grid grid-cols-10 gap-2">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl transition-all ${icon === emoji
                      ? 'bg-blue-500 scale-110 shadow-lg'
                      : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                    }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Ou tape ton propre emoji"
              className="w-full rounded-lg bg-white/5 px-4 py-2 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Couleur
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_SUGGESTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`h-10 w-10 rounded-lg transition-all ${color === colorOption.value
                      ? 'scale-110 shadow-lg ring-2 ring-white'
                      : 'hover:scale-105'
                    }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

          {/* Priority Toggle */}
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-4">
            <div>
              <div className="font-medium text-white">Trackable prioritaire</div>
              <div className="text-sm text-gray-400">
                Affiché en premier dans le dashboard
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPriority(!isPriority)}
              className={`relative h-8 w-14 rounded-full transition-all ${isPriority ? 'bg-blue-500' : 'bg-white/20'
                }`}
            >
              <div
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all ${isPriority ? 'left-7' : 'left-1'
                  }`}
              />
            </button>
          </div>

          {/* Target (for habits only) */}
          {trackable.type === 'habit' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Objectif quotidien
                </label>
                <input
                  type="number"
                  value={targetPerDay}
                  onChange={(e) => setTargetPerDay(e.target.value)}
                  placeholder="Ex: 1, 30..."
                  min="1"
                  className="w-full rounded-lg bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Unité
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg bg-white/5 px-4 py-3 text-white outline-none ring-2 ring-transparent transition-all focus:bg-white/10 focus:ring-blue-500"
                >
                  <option value="fois">fois</option>
                  <option value="minutes">minutes</option>
                  <option value="heures">heures</option>
                  <option value="pages">pages</option>
                  <option value="km">km</option>
                  <option value="sessions">sessions</option>
                </select>
              </div>
            </div>
          )}

          {/* Missions Checklist Management */}
          <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <Target size={18} className="text-blue-400" />
                  Missions quotidiennes
                </h3>
                <p className="text-xs text-gray-400">
                  Sous-objectifs à accomplir
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="flex items-center gap-2 rounded-lg bg-white/5 p-2 transition-all hover:bg-white/10"
                >
                  <input
                    type="text"
                    value={mission.title}
                    onChange={(e) => {
                      setMissions(
                        missions.map((m) =>
                          m.id === mission.id ? { ...m, title: e.target.value } : m
                        )
                      )
                    }}
                    className="flex-1 bg-transparent text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMissions(missions.filter((m) => m.id !== mission.id))}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMissionTitle}
                  onChange={(e) => setNewMissionTitle(e.target.value)}
                  placeholder="Ajouter une mission..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newMissionTitle.trim()) {
                        setMissions([
                          ...missions,
                          { id: crypto.randomUUID(), title: newMissionTitle.trim(), is_active: true },
                        ])
                        setNewMissionTitle('')
                      }
                    }
                  }}
                  className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newMissionTitle.trim()) {
                      setMissions([
                        ...missions,
                        { id: crypto.randomUUID(), title: newMissionTitle.trim(), is_active: true },
                      ])
                      setNewMissionTitle('')
                    }
                  }}
                  className="rounded-lg bg-blue-500 px-3 py-2 text-white hover:bg-blue-600"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className={`flex-1 rounded-lg px-6 py-3 font-medium text-white transition-all ${showDeleteConfirm
                  ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:scale-105'
                  : 'bg-red-500/20 hover:bg-red-500/30'
                } disabled:opacity-50 disabled:hover:scale-100`}
            >
              {showDeleteConfirm ? '⚠️ Confirmer' : 'Supprimer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-white/10 px-6 py-3 font-medium text-white transition-colors hover:bg-white/20"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-400">
              ⚠️ La suppression est définitive.
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
