'use client'

/**
 * Message du coach IA adaptatif selon l'état de l'utilisateur
 * 3 modes: calm (🟢), sarcastic (🟠), serious (🔴)
 */

import { Sparkles } from 'lucide-react'
import type { GlobalState } from '@/lib/habits/useRiskAnalysis'

type CoachMode = 'calm' | 'sarcastic' | 'serious'

type AdaptiveCoachMessageProps = {
  globalState: GlobalState
  userName?: string
}

const MESSAGES = {
  calm: {
    greetings: [
      'Bien joué, tu tiens le cap.',
      'Continue comme ça, c\'est solide.',
      'Discipline au rendez-vous. Respect.',
      'Bon rythme. Maintiens-le.',
    ],
    tips: [
      'Garde ton système en place',
      'Rien à signaler côté discipline',
      'Prêt pour la suite',
    ],
  },
  sarcastic: {
    greetings: [
      'Hmm... On sent le dérapage venir.',
      'Vigilance s\'il te plaît, c\'est fragile.',
      'Un petit coup de mou ? Ressaisis-toi.',
      'Attention, tu glisses doucement.',
    ],
    tips: [
      'Reviens aux fondamentaux avant que ça dégénère',
      'T\'as déjà vu comment ça finit d\'habitude',
      'Soit honnête avec toi-même',
    ],
  },
  serious: {
    greetings: [
      'Stop. Spirale en cours.',
      'Alerte: tu perds le contrôle.',
      'Situation sérieuse. Réagis maintenant.',
      'Rechute confirmée. On reprend.',
    ],
    tips: [
      'Identifie immédiatement ton déclencheur',
      'Coupe avec l\'environnement problématique',
      'Reprends le contrôle, maintenant',
    ],
  },
}

export default function AdaptiveCoachMessage({ globalState, userName }: AdaptiveCoachMessageProps) {
  const mode: CoachMode = globalState.riskLevel === 'critical'
    ? 'serious'
    : globalState.riskLevel === 'warning'
      ? 'sarcastic'
      : 'calm'

  const messages = MESSAGES[mode]
  const greeting = messages.greetings[Math.floor(Math.random() * messages.greetings.length)]
  const tip = messages.tips[Math.floor(Math.random() * messages.tips.length)]

  const config = {
    calm: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      textColor: 'text-blue-100',
      badge: '🟢',
    },
    sarcastic: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      textColor: 'text-orange-100',
      badge: '🟠',
    },
    serious: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      textColor: 'text-red-100',
      badge: '🔴',
    },
  }

  const current = config[mode]

  return (
    <div className={`rounded-3xl border ${current.border} ${current.bg} p-6 backdrop-blur-sm`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 rounded-2xl p-3 ${current.iconBg}`}>
          <Sparkles className={`h-6 w-6 ${current.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Coach IA
            </p>
            <span className="text-sm">{current.badge}</span>
          </div>

          <p className={`mt-3 text-lg font-semibold ${current.textColor}`}>
            {greeting}
          </p>

          <p className="mt-2 text-sm text-white/70">
            {tip}
          </p>

          {/* Mode indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${current.iconBg}`} />
            <span className="text-xs text-white/40">
              Mode: {mode === 'calm' ? 'Encouragement' : mode === 'sarcastic' ? 'Vigilance' : 'Recadrage'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
