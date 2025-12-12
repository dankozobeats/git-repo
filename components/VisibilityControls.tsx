'use client'

import { useCallback, useEffect, useState } from 'react'
import { setVisibility, getVisibility, VisibilityKey, UI_VISIBILITY_EVENT } from '@/lib/ui/visibility'

type ToggleInfo = {
  key: VisibilityKey
  label: string
  description: string
}

const TOGGLES: ToggleInfo[] = [
  {
    key: 'sidebar',
    label: 'Afficher la barre latérale',
    description: 'Libère tout l’écran en masquant la navigation permanente.',
  },
  {
    key: 'floatingMenu',
    label: 'Afficher les actions rapides',
    description: 'Réduit le chrome flottant pour ne garder que l’essentiel.',
  },
  {
    key: 'focusCard',
    label: 'Afficher la carte coach',
    description: 'Montre/masque la carte IA (mantra + sarcasme) dans l’en-tête.',
  },
  {
    key: 'testToolCard',
    label: 'Afficher l’outil de test',
    description: 'Ajoute un accès rapide à l’outil de test IA.',
  },
]

export default function VisibilityControls() {
  const [states, setStates] = useState<Record<VisibilityKey, boolean>>({
    sidebar: false,
    floatingMenu: false,
    focusCard: false,
    testToolCard: false,
  })

  useEffect(() => {
    const snapshot: Record<VisibilityKey, boolean> = {
      sidebar: getVisibility('sidebar'),
      floatingMenu: getVisibility('floatingMenu'),
      focusCard: getVisibility('focusCard'),
      testToolCard: getVisibility('testToolCard'),
    }
    setStates(snapshot)

    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key: VisibilityKey; value: boolean }
      if (detail?.key && typeof detail.value === 'boolean') {
        setStates(prev => ({ ...prev, [detail.key]: detail.value }))
      }
    }

    window.addEventListener(UI_VISIBILITY_EVENT, handler)
    return () => {
      window.removeEventListener(UI_VISIBILITY_EVENT, handler)
    }
  }, [])

  const toggle = useCallback((key: VisibilityKey) => {
    setStates(prev => {
      const next = !prev[key]
      setVisibility(key, next)
      return { ...prev, [key]: next }
    })
  }, [])

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Montrer les éléments</p>
          <h3 className="text-lg font-semibold text-white">Éviter les distractions</h3>
        </div>
      </div>
      <div className="space-y-3">
        {TOGGLES.map(toggleInfo => (
          <div key={toggleInfo.key} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/30 p-3">
            <div>
              <p className="text-sm font-semibold text-white">{toggleInfo.label}</p>
              <p className="text-xs text-white/50">{toggleInfo.description}</p>
            </div>
            <button
              type="button"
              aria-pressed={!states[toggleInfo.key]}
              onClick={() => toggle(toggleInfo.key)}
              className={`inline-flex h-9 items-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold transition ${
                !states[toggleInfo.key] ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'
              }`}
            >
              {!states[toggleInfo.key] ? 'Visible' : 'Masqué'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
