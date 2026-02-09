'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { HABIT_SEARCH_EVENT } from '@/lib/ui/scroll'

type SearchResult = {
    id: string
    name: string
    type: string | null
    icon?: string | null
    color?: string | null
}

type SearchOverlayProps = {
    searchQuery: string
    setSearchQuery: (query: string) => void
    isOpen: boolean
    onClose: () => void
    results?: SearchResult[]
}

export default function SearchOverlay({ searchQuery, setSearchQuery, isOpen, onClose, results = [] }: SearchOverlayProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    // Gère l'animation d'entrée/sortie
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            // Focus après l'animation
            setTimeout(() => inputRef.current?.focus(), 100)
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Ferme avec Echap
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose])

    if (!isVisible && !isOpen) return null

    const hasQuery = searchQuery.trim().length > 0

    return (
        <div
            className={`fixed inset-0 z-[2000] flex items-start justify-center px-4 pt-24 transition-all duration-300 ${isOpen ? 'bg-black/60 backdrop-blur-md opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0 pointer-events-none'
                }`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                className={`w-full max-w-2xl transform transition-all duration-300 ${isOpen ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-4 scale-95 opacity-0'
                    }`}
            >
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#12121A]/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
                    {/* Header style iOS Spotlight */}
                    <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4 sm:px-6">
                        <Search className="h-5 w-5 text-white/40" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher une habitude..."
                            className="flex-1 bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="rounded-full bg-white/10 p-1 text-white/60 hover:bg-white/20 hover:text-white"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="ml-2 rounded-xl bg-white/5 px-3 py-1.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                        >
                            Fermer
                        </button>
                    </div>

                    {/* Résultats de recherche */}
                    <div className="max-h-80 overflow-y-auto">
                        {hasQuery && results.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {results.map((habit) => (
                                    <Link
                                        key={habit.id}
                                        href={`/habits/${habit.id}`}
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5 sm:px-6"
                                    >
                                        <div
                                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                                            style={{ backgroundColor: `${habit.color || '#6b7280'}33` }}
                                        >
                                            {habit.icon || (habit.type === 'bad' ? '🔥' : '✨')}
                                        </div>
                                        <span className="text-sm font-medium text-white">{habit.name}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : hasQuery ? (
                            <div className="px-4 py-6 text-center text-sm text-white/40 sm:px-6">
                                Aucun résultat pour &laquo; {searchQuery} &raquo;
                            </div>
                        ) : (
                            <div className="bg-black/20 px-4 py-2 text-xs text-white/30">
                                Appuyez sur Echap pour fermer
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
