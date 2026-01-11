'use client'

/**
 * Grille affichant les top 3 victoires et top 3 défis
 */

import type { Victory, Challenge } from '@/lib/habits/strategicMetrics'
import { Trophy, Award, Target, AlertTriangle, AlertCircle, Info } from 'lucide-react'

type VictoriesChallengesGridProps = {
  victories: Victory[]
  challenges: Challenge[]
}

export function VictoriesChallengesGrid({ victories, challenges }: VictoriesChallengesGridProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Colonne Victoires */}
      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Trophy className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Top Victoires</h3>
            <p className="text-xs text-emerald-300/70">Vos meilleurs résultats</p>
          </div>
        </div>

        <div className="space-y-3">
          {victories.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/50">
              Continuez vos efforts pour débloquer des victoires
            </div>
          ) : (
            victories.map((victory, idx) => (
              <VictoryCard key={victory.habitId} victory={victory} rank={idx + 1} />
            ))
          )}
        </div>
      </div>

      {/* Colonne Défis */}
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Défis Actuels</h3>
            <p className="text-xs text-amber-300/70">Points d'attention</p>
          </div>
        </div>

        <div className="space-y-3">
          {challenges.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/50">
              Aucun défi critique détecté - Excellent !
            </div>
          ) : (
            challenges.map((challenge) => (
              <ChallengeCard key={challenge.habitId} challenge={challenge} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

type VictoryCardProps = {
  victory: Victory
  rank: number
}

function VictoryCard({ victory, rank }: VictoryCardProps) {
  const BadgeIcon = victory.badge === 'streak'
    ? Trophy
    : victory.badge === 'progress'
    ? Award
    : Target

  const rankColors = {
    1: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
    2: 'from-gray-400/20 to-gray-400/5 border-gray-400/30',
    3: 'from-orange-600/20 to-orange-600/5 border-orange-600/30',
  }

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-4 transition hover:scale-[1.02] ${
        rankColors[rank as keyof typeof rankColors] || 'border-emerald-500/20'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Rang */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
          {rank}
        </div>

        {/* Icône habitude */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
          {victory.habitIcon}
        </div>

        {/* Contenu */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-white">{victory.habitName}</h4>
          <p className="mt-1 text-sm text-emerald-300">{victory.metric}</p>
        </div>

        {/* Badge */}
        <div className="flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
            <BadgeIcon className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

type ChallengeCardProps = {
  challenge: Challenge
}

function ChallengeCard({ challenge }: ChallengeCardProps) {
  const severityConfig = {
    high: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      badgeColor: 'bg-red-500/20 text-red-300',
    },
    medium: {
      icon: AlertCircle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    low: {
      icon: Info,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      badgeColor: 'bg-blue-500/20 text-blue-300',
    },
  }

  const config = severityConfig[challenge.severity]
  const SeverityIcon = config.icon

  return (
    <div
      className={`rounded-2xl border ${config.borderColor} bg-gradient-to-br from-white/5 to-transparent p-4 transition hover:scale-[1.02]`}
    >
      <div className="flex items-start gap-3">
        {/* Icône sévérité */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.bgColor}`}>
          <SeverityIcon className={`h-5 w-5 ${config.color}`} />
        </div>

        {/* Icône habitude */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl">
          {challenge.habitIcon}
        </div>

        {/* Contenu */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-white">{challenge.habitName}</h4>
          <p className="mt-1 text-sm text-white/70">{challenge.issue}</p>
          <div className="mt-2 rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-white/80">
              <span className="font-semibold">Action: </span>
              {challenge.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
