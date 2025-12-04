'use client'

import { X } from 'lucide-react'
import { useThemeSwitcher, type ThemeName } from './ThemeProvider'

type ThemeModalProps = {
  isOpen: boolean
  onClose: () => void
}

const THEME_OPTIONS: Array<{ id: ThemeName; title: string; description: string; preview: string }> = [
  { id: 'dark', title: 'Nuit néon', description: 'Palette originale sombre, accents bleu/rose.', preview: 'bg-gradient-to-br from-[#0b0b10] via-[#141421] to-[#1c1c2a]' },
  { id: 'rose', title: 'Rose & blanc', description: 'Ambiance douce rose pastel.', preview: 'bg-gradient-to-br from-[#4d1a3f] via-[#3d1532] to-[#2a0f24]' },
  { id: 'light', title: 'Mode clair', description: 'Fond clair et texte foncé.', preview: 'bg-gradient-to-br from-[#f5f6fb] via-white to-[#e5e7eb]' },
  { id: 'gold', title: 'Blanc & or', description: 'Accents dorés sur fond profond.', preview: 'bg-gradient-to-br from-[#2e2718] via-[#262015] to-[#1e1a12]' },
]

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { theme, setTheme } = useThemeSwitcher()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b0b10]/90 p-6 text-white shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full border border-white/15 p-2 text-white/70 transition hover:text-white"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-2 pr-10">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Thèmes</p>
          <h2 className="text-2xl font-semibold text-white">Choisis ton ambiance</h2>
          <p className="text-sm text-white/70">Passe en mode clair, rose ou doré instantanément.</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {THEME_OPTIONS.map(option => {
            const isActive = theme === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTheme(option.id)
                  onClose()
                }}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:border-white/40 ${isActive ? 'border-[#C084FC] bg-white/5' : 'border-white/15 bg-white/[0.03]'
                  }`}
              >
                <div className={`h-12 w-12 rounded-xl border border-white/10 ${option.preview}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{option.title}</p>
                  <p className="text-xs text-white/60">{option.description}</p>
                </div>
                {isActive && (
                  <span className="rounded-full bg-[#C084FC] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    Actif
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
