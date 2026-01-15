'use client'

import { useState, useEffect } from 'react'
import { TrackableEvent, Decision } from '@/types/trackables'

export interface Pattern {
  type: 'temporal' | 'context' | 'trigger' | 'correlation'
  title: string
  description: string
  confidence: number // 0-100
  severity: 'high' | 'medium' | 'low'
  data: {
    stateId?: string
    stateName?: string
    timeOfDay?: string
    dayOfWeek?: string
    context?: string
    trigger?: string
    correlation?: string
  }
}

export interface Insight {
  category: 'success' | 'warning' | 'opportunity' | 'risk'
  title: string
  description: string
  metric?: string
  action?: string
}

export function useTrackableInsights(period: number = 30) {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      setIsLoading(true)
      try {
        const now = new Date()
        const fromDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]

        // Fetch events and decisions
        const [eventsRes, decisionsRes] = await Promise.all([
          fetch(`/api/trackable-events?from=${fromDate}T00:00:00&limit=1000`),
          fetch(`/api/decisions?from=${fromDate}T00:00:00&limit=1000`),
        ])

        const events: (TrackableEvent & { trackable?: any })[] = await eventsRes.json()
        const decisions: Decision[] = await decisionsRes.json()

        // Analyze patterns
        const detectedPatterns = analyzePatterns(events, decisions)
        setPatterns(detectedPatterns)

        // Generate insights
        const generatedInsights = generateInsights(events, decisions, detectedPatterns)
        setInsights(generatedInsights)
      } catch (error) {
        console.error('Error analyzing trackables:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAndAnalyze()
  }, [period])

  return { patterns, insights, isLoading }
}

function analyzePatterns(
  events: (TrackableEvent & { trackable?: any })[],
  decisions: Decision[]
): Pattern[] {
  const patterns: Pattern[] = []

  // Group state observations by state
  const stateObservations = events.filter((e) => e.kind === 'observe')
  const stateGroups: Record<string, (TrackableEvent & { trackable?: any })[]> = {}

  stateObservations.forEach((obs) => {
    if (!stateGroups[obs.trackable_id]) {
      stateGroups[obs.trackable_id] = []
    }
    stateGroups[obs.trackable_id].push(obs)
  })

  // Analyze each state
  Object.entries(stateGroups).forEach(([stateId, observations]) => {
    if (observations.length < 3) return // Need at least 3 observations

    const stateName = observations[0]?.trackable?.name || 'État inconnu'

    // 1. Temporal patterns (time of day)
    const hourCounts: Record<number, number> = {}
    observations.forEach((obs) => {
      const hour = new Date(obs.occurred_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const totalObs = observations.length
    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]

    if (peakHour && peakHour[1] / totalObs > 0.3) {
      const hour = parseInt(peakHour[0])
      const timeLabel =
        hour < 12 ? 'le matin' : hour < 18 ? 'l\'après-midi' : 'le soir'

      patterns.push({
        type: 'temporal',
        title: `${stateName} survient surtout ${timeLabel}`,
        description: `${Math.round((peakHour[1] / totalObs) * 100)}% des observations vers ${hour}h`,
        confidence: Math.round((peakHour[1] / totalObs) * 100),
        severity: peakHour[1] / totalObs > 0.5 ? 'high' : 'medium',
        data: {
          stateId,
          stateName,
          timeOfDay: `${hour}h`,
        },
      })
    }

    // 2. Context patterns
    const contextCounts: Record<string, number> = {}
    observations.forEach((obs) => {
      const context = obs.meta_json?.context
      if (context) {
        contextCounts[context] = (contextCounts[context] || 0) + 1
      }
    })

    const dominantContext = Object.entries(contextCounts)
      .sort((a, b) => b[1] - a[1])[0]

    if (dominantContext && dominantContext[1] / totalObs > 0.3) {
      patterns.push({
        type: 'context',
        title: `${stateName} lié au contexte "${dominantContext[0]}"`,
        description: `${Math.round((dominantContext[1] / totalObs) * 100)}% des observations dans ce contexte`,
        confidence: Math.round((dominantContext[1] / totalObs) * 100),
        severity: dominantContext[1] / totalObs > 0.5 ? 'high' : 'medium',
        data: {
          stateId,
          stateName,
          context: dominantContext[0],
        },
      })
    }

    // 3. Trigger patterns
    const triggerCounts: Record<string, number> = {}
    observations.forEach((obs) => {
      const trigger = obs.meta_json?.trigger
      if (trigger && trigger.length > 2) {
        const lowerTrigger = trigger.toLowerCase()
        triggerCounts[lowerTrigger] = (triggerCounts[lowerTrigger] || 0) + 1
      }
    })

    const commonTrigger = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])[0]

    if (commonTrigger && commonTrigger[1] >= 2) {
      patterns.push({
        type: 'trigger',
        title: `Déclencheur récurrent détecté`,
        description: `"${commonTrigger[0]}" revient ${commonTrigger[1]} fois`,
        confidence: Math.min(Math.round((commonTrigger[1] / totalObs) * 100), 90),
        severity: commonTrigger[1] >= 3 ? 'high' : 'medium',
        data: {
          stateId,
          stateName,
          trigger: commonTrigger[0],
        },
      })
    }
  })

  return patterns
}

function generateInsights(
  events: (TrackableEvent & { trackable?: any })[],
  decisions: Decision[],
  patterns: Pattern[]
): Insight[] {
  const insights: Insight[] = []

  // Calculate resistance rate
  const resistCount = decisions.filter((d) => d.decision === 'resist').length
  const relapseCount = decisions.filter((d) => d.decision === 'relapse').length
  const totalDecisions = resistCount + relapseCount

  if (totalDecisions > 0) {
    const resistanceRate = (resistCount / totalDecisions) * 100

    if (resistanceRate >= 70) {
      insights.push({
        category: 'success',
        title: 'Excellent contrôle !',
        description: `Tu résistes ${Math.round(resistanceRate)}% du temps. Continue comme ça !`,
        metric: `${resistCount}/${totalDecisions} résistances`,
      })
    } else if (resistanceRate >= 50) {
      insights.push({
        category: 'opportunity',
        title: 'Bon progrès',
        description: `${Math.round(resistanceRate)}% de résistance. Tu peux encore améliorer !`,
        metric: `${resistCount}/${totalDecisions} résistances`,
        action: 'Identifie les moments de rechute pour mieux t\'y préparer',
      })
    } else if (resistanceRate < 50 && totalDecisions >= 5) {
      insights.push({
        category: 'warning',
        title: 'Zone de vigilance',
        description: `Seulement ${Math.round(resistanceRate)}% de résistance. Il faut renforcer tes stratégies.`,
        metric: `${resistCount}/${totalDecisions} résistances`,
        action: 'Essaie les stratégies "delay" et "replace" au lieu de céder',
      })
    }
  }

  // Habit completion insights
  const habitChecks = events.filter((e) => e.kind === 'check')
  const daysWithHabits = new Set(
    habitChecks.map((e) => e.occurred_at.split('T')[0])
  ).size

  if (daysWithHabits >= 7) {
    insights.push({
      category: 'success',
      title: 'Régularité excellente',
      description: `Habitudes complétées sur ${daysWithHabits} jours différents !`,
      metric: `${habitChecks.length} complétions`,
    })
  }

  // Pattern-based insights
  const highSeverityPatterns = patterns.filter((p) => p.severity === 'high')
  if (highSeverityPatterns.length > 0) {
    const pattern = highSeverityPatterns[0]

    if (pattern.type === 'temporal') {
      insights.push({
        category: 'risk',
        title: 'Moment à risque identifié',
        description: pattern.description,
        action: `Prévois une activité de remplacement ${pattern.data.timeOfDay}`,
      })
    } else if (pattern.type === 'context') {
      insights.push({
        category: 'risk',
        title: 'Contexte déclencheur',
        description: `Le contexte "${pattern.data.context}" revient souvent`,
        action: 'Anticipe ce contexte et prépare une stratégie de résistance',
      })
    }
  }

  // Delay strategy insight
  const delayDecisions = decisions.filter((d) => d.decision === 'delay')
  if (delayDecisions.length >= 2) {
    insights.push({
      category: 'opportunity',
      title: 'La stratégie du report fonctionne',
      description: `Tu as utilisé le report ${delayDecisions.length} fois`,
      action: 'Continue à utiliser cette technique quand tu es tenté',
    })
  }

  // Replacement strategy insight
  const replaceDecisions = decisions.filter((d) => d.decision === 'replace')
  if (replaceDecisions.length >= 2) {
    insights.push({
      category: 'success',
      title: 'Excellent ! Tu remplaces les pulsions',
      description: `${replaceDecisions.length} actions de remplacement effectuées`,
      metric: 'Stratégie efficace',
    })
  }

  // Money saved insight
  const totalSpent = decisions
    .filter((d) => d.decision === 'relapse' && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0)

  if (totalSpent > 0) {
    insights.push({
      category: 'warning',
      title: 'Dépenses liées aux rechutes',
      description: `${totalSpent.toFixed(2)}€ dépensés lors des craquages`,
      metric: `${relapseCount} rechutes avec dépenses`,
      action: 'Visualise ce que tu aurais pu faire avec cet argent',
    })
  }

  return insights
}
