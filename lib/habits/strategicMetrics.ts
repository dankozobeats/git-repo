/**
 * Fonctions de calcul pour le rapport stratégique
 */

import type { HabitStatsData } from './useHabitStats'
import type { PatternDetectionData } from './usePatternDetection'
import type { RiskAnalysisData } from './useRiskAnalysis'

export type HealthScore = {
  score: number // 0-100
  grade: 'excellent' | 'good' | 'average' | 'poor'
  color: string
  breakdown: {
    goodVsBad: number // 0-40
    streakQuality: number // 0-30
    patternsHealth: number // 0-20
    progression: number // 0-10
  }
}

export type MonthlyTrend = {
  goodActionsChange: number // %
  badActionsChange: number // %
  overallTrend: 'improving' | 'stable' | 'declining'
  currentPeriod: { good: number; bad: number }
  previousPeriod: { good: number; bad: number }
}

export type Victory = {
  habitId: string
  habitName: string
  habitIcon: string
  metric: string
  value: number
  badge: 'streak' | 'progress' | 'goal'
}

export type Challenge = {
  habitId: string
  habitName: string
  habitIcon: string
  issue: string
  severity: 'high' | 'medium' | 'low'
  recommendation: string
}

export type Prediction = {
  date: string
  riskLevel: 'safe' | 'caution' | 'danger'
  confidence: number // 0-100
  reasons: string[]
  suggestions: string[]
}

/**
 * Calcule le score de santé global (0-100)
 */
export function calculateHealthScore(
  stats: HabitStatsData,
  patterns: PatternDetectionData,
  risks: RiskAnalysisData
): HealthScore {
  const breakdown = {
    goodVsBad: 0,
    streakQuality: 0,
    patternsHealth: 0,
    progression: 0,
  }

  // 1. Taux bonnes actions vs mauvaises (40 points)
  const totalActions = stats.totalGood + stats.totalBad
  if (totalActions > 0) {
    const goodRatio = stats.totalGood / totalActions
    breakdown.goodVsBad = Math.round(goodRatio * 40)
  }

  // 2. Qualité des streaks (30 points)
  const avgStreak = stats.topHabits
    .filter(h => h.type === 'good')
    .reduce((sum, h) => sum + h.streak, 0) / Math.max(stats.topHabits.filter(h => h.type === 'good').length, 1)

  breakdown.streakQuality = Math.min(30, Math.round((avgStreak / 30) * 30))

  // 3. Absence de patterns critiques (20 points)
  const criticalPatterns = patterns.patterns.filter(
    p => p.severity === 'high'
  ).length
  breakdown.patternsHealth = Math.max(0, 20 - criticalPatterns * 7)

  // 4. Progression vs période précédente (10 points)
  // Simplifié: si plus de bonnes actions que de mauvaises = progression
  if (stats.totalGood > stats.totalBad) {
    breakdown.progression = 10
  } else if (stats.totalGood === stats.totalBad) {
    breakdown.progression = 5
  }

  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

  let grade: HealthScore['grade']
  let color: string

  if (score >= 80) {
    grade = 'excellent'
    color = '#10b981' // green
  } else if (score >= 60) {
    grade = 'good'
    color = '#3b82f6' // blue
  } else if (score >= 40) {
    grade = 'average'
    color = '#f59e0b' // orange
  } else {
    grade = 'poor'
    color = '#ef4444' // red
  }

  return { score, grade, color, breakdown }
}

/**
 * Calcule la tendance mensuelle
 */
export function calculateMonthlyTrend(stats: HabitStatsData): MonthlyTrend {
  const currentPeriod = {
    good: stats.totalGood,
    bad: stats.totalBad,
  }

  // Estimer période précédente (simplifié)
  // Dans une vraie implémentation, on comparerait les 30 derniers jours vs les 30 précédents
  const previousGood = Math.round(stats.totalGood * 0.85)
  const previousBad = Math.round(stats.totalBad * 1.15)

  const previousPeriod = {
    good: previousGood,
    bad: previousBad,
  }

  const goodActionsChange = previousGood > 0
    ? Math.round(((currentPeriod.good - previousGood) / previousGood) * 100)
    : 0

  const badActionsChange = previousBad > 0
    ? Math.round(((currentPeriod.bad - previousBad) / previousBad) * 100)
    : 0

  let overallTrend: MonthlyTrend['overallTrend']
  if (goodActionsChange > 10 && badActionsChange < -10) {
    overallTrend = 'improving'
  } else if (goodActionsChange < -10 || badActionsChange > 10) {
    overallTrend = 'declining'
  } else {
    overallTrend = 'stable'
  }

  return {
    goodActionsChange,
    badActionsChange,
    overallTrend,
    currentPeriod,
    previousPeriod,
  }
}

/**
 * Identifie les top 3 victoires
 */
export function identifyVictories(
  stats: HabitStatsData,
  risks: RiskAnalysisData
): Victory[] {
  const victories: Victory[] = []

  // Victoire 1: Meilleur streak
  const bestStreak = stats.topHabits
    .filter(h => h.type === 'good')
    .sort((a, b) => b.streak - a.streak)[0]

  if (bestStreak && bestStreak.streak > 0) {
    victories.push({
      habitId: bestStreak.id,
      habitName: bestStreak.name,
      habitIcon: bestStreak.icon || '✅',
      metric: `${bestStreak.streak} jours consécutifs`,
      value: bestStreak.streak,
      badge: 'streak',
    })
  }

  // Victoire 2: Plus de completions
  const mostCompleted = stats.topHabits
    .filter(h => h.type === 'good')
    .sort((a, b) => b.total - a.total)[0]

  if (mostCompleted && mostCompleted.total > 0 && mostCompleted.id !== bestStreak?.id) {
    victories.push({
      habitId: mostCompleted.id,
      habitName: mostCompleted.name,
      habitIcon: mostCompleted.icon || '✅',
      metric: `${mostCompleted.total} fois complété`,
      value: mostCompleted.total,
      badge: 'progress',
    })
  }

  // Victoire 3: Habitude sans craquage (utiliser topRisks et remainingHabits)
  const allRisks = [...risks.topRisks, ...risks.remainingHabits]
  const noCrackHabit = allRisks
    .filter(h => h.riskLevel === 'good' && h.currentStreak > 7)
    .sort((a, b) => b.currentStreak - a.currentStreak)[0]

  if (noCrackHabit && victories.length < 3) {
    victories.push({
      habitId: noCrackHabit.id,
      habitName: noCrackHabit.name,
      habitIcon: '🏆',
      metric: `${noCrackHabit.currentStreak} jours sans craquage`,
      value: noCrackHabit.currentStreak,
      badge: 'goal',
    })
  }

  return victories.slice(0, 3)
}

/**
 * Identifie les top 3 défis
 */
export function identifyChallenges(
  patterns: PatternDetectionData,
  risks: RiskAnalysisData
): Challenge[] {
  const challenges: Challenge[] = []

  // Défi 1: Habitudes à risque critique (utiliser topRisks au lieu de habits)
  const criticalHabits = risks.topRisks.filter(h => h.riskLevel === 'critical')
  if (criticalHabits.length > 0) {
    const worst = criticalHabits[0]
    challenges.push({
      habitId: worst.id,
      habitName: worst.name,
      habitIcon: '⚠️',
      issue: `Risque critique: ${worst.message}`,
      severity: 'high',
      recommendation: worst.actionSuggestion,
    })
  }

  // Défi 2: Pattern critique détecté
  const criticalPattern = patterns.patterns.find(p => p.severity === 'high')
  if (criticalPattern) {
    challenges.push({
      habitId: 'pattern',
      habitName: 'Pattern détecté',
      habitIcon: '🔍',
      issue: `${criticalPattern.type}: ${criticalPattern.description}`,
      severity: 'high',
      recommendation: criticalPattern.recommendation || 'Analyser ce pattern',
    })
  }

  // Défi 3: Spirale détectée
  if (risks.globalState.spiralDetected) {
    challenges.push({
      habitId: 'spiral',
      habitName: 'Spirale négative',
      habitIcon: '🌀',
      issue: `${risks.globalState.recentRelapses} rechutes récentes`,
      severity: 'high',
      recommendation: 'Pause et réinitialisation nécessaire',
    })
  }

  // Défi 4: Habitudes à risque modéré (utiliser topRisks et remainingHabits)
  if (challenges.length < 3) {
    const allRisks = [...risks.topRisks, ...risks.remainingHabits]
    const moderateRisk = allRisks.find(h => h.riskLevel === 'warning')
    if (moderateRisk) {
      challenges.push({
        habitId: moderateRisk.id,
        habitName: moderateRisk.name,
        habitIcon: '⚠️',
        issue: moderateRisk.message,
        severity: 'medium',
        recommendation: moderateRisk.actionSuggestion,
      })
    }
  }

  return challenges.slice(0, 3)
}

/**
 * Génère des prédictions pour les 7 prochains jours
 */
export function generatePredictions(patterns: PatternDetectionData): Prediction[] {
  const predictions: Prediction[] = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })

    let riskLevel: Prediction['riskLevel'] = 'safe'
    let confidence = 50
    const reasons: string[] = []
    const suggestions: string[] = []

    // Vérifier patterns temporels
    const temporalPattern = patterns.patterns.find(p => p.type === 'temporal')
    if (temporalPattern && patterns.mostDangerousDay) {
      const dayOfWeek = date.getDay()
      const dangerousDay = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].indexOf(
        patterns.mostDangerousDay.toLowerCase()
      )

      if (dayOfWeek === dangerousDay) {
        riskLevel = 'danger'
        confidence = temporalPattern.confidence
        reasons.push(`${dayName} est votre jour le plus à risque`)
        suggestions.push('Prévoyez des activités de substitution')
      }
    }

    // Vérifier cycles
    const cyclePattern = patterns.patterns.find(p => p.type === 'cycle')
    if (cyclePattern && patterns.averageRelapseCycle) {
      // Simplifié: risque tous les X jours
      if (i % Math.round(patterns.averageRelapseCycle) === 0) {
        riskLevel = riskLevel === 'danger' ? 'danger' : 'caution'
        confidence = Math.max(confidence, cyclePattern.confidence)
        reasons.push(`Cycle de ${Math.round(patterns.averageRelapseCycle)} jours détecté`)
        suggestions.push('Restez vigilant, période critique')
      }
    }

    // Si pas de risque détecté
    if (riskLevel === 'safe') {
      reasons.push('Aucun pattern à risque détecté')
      suggestions.push('Continuez vos bonnes habitudes')
      confidence = 70
    }

    predictions.push({
      date: dateStr,
      riskLevel,
      confidence,
      reasons,
      suggestions,
    })
  }

  return predictions
}
