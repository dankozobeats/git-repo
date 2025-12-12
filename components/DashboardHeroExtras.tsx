'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DailyMantra } from '@/components/ai/DailyMantra'
import { SarcasticMessage } from '@/components/ai/SarcasticMessage'
import VisibilityControls from '@/components/VisibilityControls'
import { getVisibility, UI_VISIBILITY_EVENT } from '@/lib/ui/visibility'

type DashboardHeroExtrasProps = {
  userId: string
  mainHabitName: string | null
  todaysBadHabitName: string | null
  todaysBadCount: number
}

export default function DashboardHeroExtras({ userId, mainHabitName, todaysBadHabitName, todaysBadCount }: DashboardHeroExtrasProps) {
  const [hideFocusCard, setHideFocusCard] = useState(false)
  const [hideTestToolCard, setHideTestToolCard] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setHideFocusCard(getVisibility('focusCard'))
    setHideTestToolCard(getVisibility('testToolCard'))

    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key?: string; value?: boolean }
      if (detail?.key === 'focusCard' && typeof detail.value === 'boolean') {
        setHideFocusCard(detail.value)
      }
      if (detail?.key === 'testToolCard' && typeof detail.value === 'boolean') {
        setHideTestToolCard(detail.value)
      }
    }

    window.addEventListener(UI_VISIBILITY_EVENT, handler)
    return () => {
      window.removeEventListener(UI_VISIBILITY_EVENT, handler)
    }
  }, [])

  const hasBadHabitToday = Boolean(todaysBadHabitName && todaysBadCount > 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <VisibilityControls />
        {!hideTestToolCard && <TestToolCard />}
      </div>

      {!hideFocusCard && mainHabitName && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DailyMantra habitName={mainHabitName} userId={userId} />
          {hasBadHabitToday ? (
            <SarcasticMessage habitName={todaysBadHabitName!} count={todaysBadCount} userId={userId} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
              Pas de rechute signalée aujourd'hui. Garde ce momentum ! ✨
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TestToolCard() {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-[#10131d] via-[#0b0d14] to-[#06070f] p-5 shadow-lg shadow-black/40">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Outil de test</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Sandbox IA</h3>
        <p className="mt-3 text-sm text-white/70">
          Expérimente des prompts personnalisés, vérifie les réponses de ton coach et garde la main sur le système IA.
        </p>
      </div>
      <Link
        href="/test-ai"
        className="mt-4 inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Ouvrir l’outil de test
      </Link>
    </div>
  )
}
