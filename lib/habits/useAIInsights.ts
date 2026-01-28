'use client'

/**
 * Hook pour récupérer les insights IA
 */

import { useState, useCallback } from 'react'

export type DeepInsight = {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  category: 'pattern' | 'trigger' | 'motivation' | 'progress'
}

export type Recommendation = {
  title: string
  description: string
  action: string
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: string
}

export type WhatIfScenario = {
  scenario: string
  outcome: string
  confidence: number
}

export type AIInsightsData = {
  summary: string
  deepInsights: DeepInsight[]
  recommendations: Recommendation[]
  predictions: {
    in30Days: string
    in60Days: string
    in90Days: string
  }
  whatIf: WhatIfScenario[]
  motivationalMessage: string
}

export function useAIInsights() {
  const [data, setData] = useState<AIInsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateInsights = useCallback(async (personality: string = 'balanced') => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reports/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personality }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error Response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to generate insights')
      }

      const insights = await response.json()

      // Vérifier si c'est une erreur déguisée
      if (insights.error) {
        throw new Error(insights.details || insights.error)
      }

      setData(insights)
    } catch (err) {
      console.error('Error generating AI insights:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    generateInsights,
  }
}
