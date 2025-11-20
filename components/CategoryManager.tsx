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
    <section className="mb-12 rounded-3xl border border-white/5 bg-gradient-to-b from-[#1F1F1F] to-[#121212] py-1 px-1 text-white">
      <CategoryAccordion
        title="Catégories personnalisées"
        count={categories.length}
        color="#FF4D4D"
        defaultOpen={false}
        className="rounded-3xl border-none bg-transparent"
        headerClassName="bg-transparent px-5 py-4 text-white font-semibold text-base tracking-tight border-b border-white/10"
        contentClassName="px-5 py-5 space-y-5"
      >
        <div className="space-y-5">
          {/* Description et bouton refresh */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#A0A7D4]">Organisation</p>
              <p className="text-sm text-white/80">Organise tes habitudes par thèmes.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadCategories}
                className="text-xs px-4 py-2 rounded-full border border-white/20 bg-white/5 text-white hover:border-white/40 transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="text-sm text-red-300 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Formulaire d'ajout */}
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nouvelle catégorie"
              className="flex-1 min-w-[220px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
            />
            <input
              type="color"
              value={newColor || '#6b7280'}
              onChange={e => setNewColor(e.target.value)}
              className="w-14 h-12 rounded-xl border border-white/10 bg-[#0F0F0F]/70 cursor-pointer"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-5 py-3 rounded-2xl bg-[#FF4D4D] text-sm font-semibold text-white shadow-lg shadow-[#FF4D4D]/30 transition hover:bg-[#e04343] disabled:opacity-40"
            >
              Ajouter
            </button>
          </form>

          {/* Liste des catégories */}
          {isLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-[#FF4D4D] border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-white/70">Chargement...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-6 text-white/70 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-sm">Aucune catégorie pour le moment.</p>
              <p className="text-xs text-white/50 mt-1">Crée ta première catégorie ci-dessus !</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {categories.map(category => (
                <li
                  key={category.id}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-white/30 flex flex-col gap-3 md:flex-row md:items-center"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow"
                      style={{ backgroundColor: category.color || '#6b7280' }}
                    />
                    <input
                      type="text"
                      defaultValue={category.name}
                      onBlur={e =>
                        e.target.value.trim() &&
                        handleUpdate(category.id, e.target.value.trim(), category.color)
                      }
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]"
                    />
                    <input
                      type="color"
                      defaultValue={category.color || '#6b7280'}
                      onChange={e => handleUpdate(category.id, category.name, e.target.value)}
                      className="w-12 h-10 rounded-xl border border-white/10 bg-[#0F0F0F]/70 cursor-pointer"
                      title="Changer la couleur"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
                    className="text-xs px-4 py-2 rounded-full border border-[#FF4D4D]/60 text-[#FF4D4D] hover:bg-[#FF4D4D]/15 transition"
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
