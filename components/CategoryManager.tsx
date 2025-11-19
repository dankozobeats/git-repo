'use client'

import { useEffect, useState } from 'react'
import CategoryAccordion from './CategoryAccordion'

type Category = {
  id: string
  name: string
  color: string | null
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string | null>(null)

  const loadCategories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Erreur de chargement des catégories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      if (!res.ok) throw new Error('Création impossible')
      setNewName('')
      setNewColor(null)
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  const handleUpdate = async (id: string, name: string, color: string | null) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
      if (!res.ok) throw new Error('Mise à jour impossible')
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les habitudes resteront sans catégorie.')) {
      return
    }
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Suppression impossible')
      await loadCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <section className="mb-8">
      <CategoryAccordion
        title="Catégories personnalisées"
        count={categories.length}
        color="#3b82f6"
        defaultOpen={false}
      >
        <div className="space-y-4">
          {/* Description et bouton refresh */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Organise tes habitudes par thèmes.</p>
            <button
              onClick={loadCategories}
              className="text-xs px-3 py-1 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Formulaire d'ajout */}
          <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nouvelle catégorie"
              className="flex-1 min-w-[200px] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="color"
              value={newColor || '#6b7280'}
              onChange={e => setNewColor(e.target.value)}
              className="w-12 h-10 rounded-lg border border-gray-700 bg-gray-900 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ajouter
            </button>
          </form>

          {/* Liste des catégories */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Chargement...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-6 text-gray-500 bg-gray-900/30 rounded-lg border border-gray-800">
              <p className="text-sm">Aucune catégorie pour le moment.</p>
              <p className="text-xs text-gray-600 mt-1">Crée ta première catégorie ci-dessus !</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {categories.map(category => (
                <li
                  key={category.id}
                  className="p-3 border border-gray-800 rounded-xl bg-gray-900/50 hover:bg-gray-900 transition-colors flex flex-col gap-2 md:flex-row md:items-center md:gap-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || '#6b7280' }}
                    />
                    <input
                      type="text"
                      defaultValue={category.name}
                      onBlur={e =>
                        e.target.value.trim() &&
                        handleUpdate(category.id, e.target.value.trim(), category.color)
                      }
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <input
                      type="color"
                      defaultValue={category.color || '#6b7280'}
                      onChange={e => handleUpdate(category.id, category.name, e.target.value)}
                      className="w-12 h-10 rounded-lg border border-gray-700 bg-gray-900 cursor-pointer"
                      title="Changer la couleur"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    className="text-xs px-3 py-2 border border-red-700 text-red-300 rounded-lg hover:bg-red-900/30 transition-colors"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CategoryAccordion>
    </section>
  )
}